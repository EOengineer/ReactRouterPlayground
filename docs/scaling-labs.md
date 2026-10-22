# Scaling Labs

Hands-on companion to [scaling-playbook.md](scaling-playbook.md). Each lab breaks the app in one specific way under "traffic doubled" load, shows you what that looks like in the metrics, and then fixes it.

All numbers below were measured on this repo (MacBook, Docker Desktop, API limited to 2 CPUs). Yours will differ; the *shape* is what matters.

---

## Setup

```bash
bin/lab up          # db, redis, api, sidekiq, slowvendor, pgbouncer in lab mode
bin/lab seed        # ~10k users, ~1M posts (about 15s)
```

If port 3000 is taken: `export LAB_API_PORT=3001` before running `bin/lab`.

Lab mode (`compose.lab.yml`) makes development behave more like production: eager loading, no code reloading, info-level logs, CPU limits, `pg_stat_statements`, Puma control app.

### Knobs

Set these in the shell and run `bin/lab restart`:

| Variable | Default | Meaning |
|---|---|---|
| `RAILS_MAX_THREADS` | 3 | Puma threads per process |
| `WEB_CONCURRENCY` | 0 | Puma worker processes (0 = single mode) |
| `DB_POOL` | = threads | Active Record pool size per process |
| `DB_CHECKOUT_TIMEOUT` | 5 | Seconds to wait for a pool connection |
| `API_CPUS` | 2 | CPU budget for the api container |
| `SIDEKIQ_CONCURRENCY` | 5 | Sidekiq threads (pool follows it) |
| `PG_MAX_CONNECTIONS` | 100 | Postgres `max_connections` (`docker compose -f compose.yml -f compose.lab.yml up -d db`) |
| `LAB_DATABASE_URL` | direct to db | Point Rails at PgBouncer instead |

### Running load

```bash
bin/lab k6 <script> -e RATE=10 -e MODE=fixed
```

Every script runs **baseline traffic for 20s, then doubles it for 40s** (open arrival-rate model, so requests keep coming even when the server falls behind — exactly like real users). Shorten with `-e BASELINE=15s -e DOUBLED=30s`. `bin/lab k6` waits for Puma to drain leftover requests from the previous run first.

### Reading the k6 summary

| Metric | What it tells you |
|---|---|
| `http_req_duration` | What the user experienced (p95/p99 are the ones to watch) |
| `server_queue_ms` | Time waiting *before* Rails started (from `X-Request-Start`) — high means not enough free Puma threads |
| `server_app_ms` | Time inside Rails |
| `server_sql_ms` | Time in SQL, as measured from Ruby (includes waiting for the GVL afterwards!) |
| `server_query_count` | Queries per request — 101 means N+1 |
| `http_req_failed` / `dropped_iterations` | Errors / k6 couldn't even send (system way behind) |

**The key split:** `http_req_duration ≈ server_queue_ms + server_app_ms`. If queue time dominates, requests are waiting in line; then ask *why* the threads are busy.

### Observing while load runs (second terminal)

```bash
bin/lab watch              # Puma busy/backlog + Postgres activity every 2s
bin/lab puma               # threads, busy, backlog, pool_capacity
bin/lab sql top_queries    # pg_stat_statements: which queries eat DB time
bin/lab sql activity       # connections per client + running queries
bin/lab sql locks          # who's blocked on whom
bin/lab sql reset_stats    # reset pg_stat_statements between runs
docker stats               # CPU per container (api vs db is a key question)
open http://localhost:3000/sidekiq
```

Every response also carries `Server-Timing`, `X-Query-Count`, and `X-Queue-Time-Ms` headers (`curl -i`).

The scenario code is intentionally small and side-by-side: [backend/app/models/lab/](../backend/app/models/lab/).

---

## Lab 1 — Blind triage drill

Do this one first *and* last.

```bash
bin/lab incident start     # picks a hidden scenario
bin/lab k6 incident        # traffic doubles...
# diagnose using only the observation tools, out loud, as in an interview
bin/lab incident reveal
bin/lab incident stop
```

Possible incidents: slow query, N+1, slow vendor, lock contention, CPU-bound.

**Worked example (measured):**

| Signal | Value | Conclusion |
|---|---|---|
| k6 | p50 47ms but p95 5.0s; queue p95 4.7s, app p95 305ms | Requests waiting in line → app tier saturated. Why? |
| `bin/lab puma` | busy=4 / 3 threads, backlog=1, pool_capacity=0 | All threads busy |
| `docker stats` | api 6% CPU, **db 199% CPU** | Not Ruby — the database is the bottleneck |
| `server_query_count` | 1 | Not an N+1 |
| `bin/lab sql locks` | nothing waiting | Not lock contention |
| `bin/lab sql top_queries` | one query = ~100% of DB time: `WHERE title = $1`, mean 55ms, max 295ms | That's it |
| `EXPLAIN` | Seq Scan on posts | Missing index |

Reveal: `slow_query`. Fix: index (or change the query). **The decision tree:** queue vs app time → app CPU vs DB CPU → query count → locks → top queries.

---

## Lab 2 — Slow query / missing index

```bash
bin/lab index drop
bin/lab sql reset_stats
bin/lab k6 slow_query              # 1 → 2 req/s
bin/lab sql top_queries
bin/lab sql explain_user_posts
bin/lab index add                  # CREATE INDEX CONCURRENTLY
bin/lab k6 slow_query
bin/lab k6 slow_query -e RATE=50   # 50 → 100 req/s
```

| Run | p95 | Notes |
|---|---|---|
| No index, 1 → 2 req/s | 1.43s | ~500ms per query alone; at 2x the DB saturates |
| No index, 4 → 8 req/s | 30s (62% failed) | queue avg 13.6s; same query now 1.9s due to contention |
| Index, 1 → 2 req/s | 18ms | `EXPLAIN`: 450ms → 0.15ms |
| Index, 50 → 100 req/s | 4.5ms | 0 errors at 50x the traffic that broke it before |

**What you see:** Plan was `Parallel Index Scan Backward using index_posts_on_created_at … Filter: (user_id = $1) Rows Removed by Filter: 142431` × 3 workers. Postgres reads ~430k rows to return 20. `pg_stat_statements` shows that one query with ~100% of `total_ms`.

**Signature:** DB CPU pegged; one query dominates `total_exec_time`; latency of *that query* rises with concurrency (it competes with itself for CPU).

**Fix in a real app:**

```ruby
class AddIndexToPostsUserIdCreatedAt < ActiveRecord::Migration[8.1]
  disable_ddl_transaction!

  def change
    add_index :posts, [:user_id, :created_at], algorithm: :concurrently
  end
end
```

`CONCURRENTLY` avoids locking the table against writes during the build — essential during an incident. (`strong_migrations` enforces this.)

**Interview soundbite:** "Doubling traffic often exposes a query that was fine at 1x. `pg_stat_statements` sorted by total time finds it in seconds; `EXPLAIN ANALYZE` tells you why; an index built concurrently fixes it without downtime."

---

## Lab 3 — N+1 queries

Run after Lab 2 (needs the `user_id` index, otherwise each `COUNT` is a full scan and it becomes Lab 2 again).

```bash
bin/lab k6 feed -e RATE=20
bin/lab k6 feed -e RATE=20 -e MODE=fixed
```

| Run (20 → 40 req/s) | Queries/request | App time p50 | p95 | Queue avg |
|---|---|---|---|---|
| Broken | 101 | 108ms | 8.5s | 3.6s |
| Fixed (`includes(:user)` + `posts_count` counter cache) | 2 | 5ms | 10.6ms | 0.8ms |

At 10 → 20 req/s the broken version *didn't* fall over (p95 37ms) — locally each query is ~0.01ms. In production, each query is a network round trip (0.5–2ms), so 101 queries is 50–200ms of pure waiting.

**Two surprising findings:**

1. Most of the N+1 cost was **Ruby CPU**, not SQL: at low load, SQL was 10ms of a 31ms request. Building, sending, and instantiating 100 Active Record queries is CPU work. That's why it saturated a single Puma process at 40 req/s.
2. Under load, `server_sql_ms` rose from 10ms to 83ms **while Postgres was idle**. Instrumentation measures wall-clock time around the query, which includes waiting to reacquire the GVL after the result comes back. **APM "DB time" can be inflated by Ruby CPU contention** — always cross-check with DB-side metrics.

**Signature:** query count per request is high and scales with result size; `pg_stat_statements` shows a cheap query with an enormous `calls` count (41,200 calls of `SELECT COUNT(*) FROM posts WHERE user_id = $1` in one 50s run).

**Prevention:** `strict_loading` (Rails), Bullet / Prosopite in dev and CI, counter caches for counts.

---

## Lab 4 — Connection pool exhaustion and Postgres limits

```bash
# A: pool smaller than threads
RAILS_MAX_THREADS=10 DB_POOL=2 DB_CHECKOUT_TIMEOUT=1 bin/lab restart
bin/lab k6 db_work                       # each request holds a connection 100ms

RAILS_MAX_THREADS=25 DB_POOL=2 DB_CHECKOUT_TIMEOUT=1 bin/lab restart
bin/lab k6 db_work

# B: pool = threads
RAILS_MAX_THREADS=10 DB_POOL=10 bin/lab restart
bin/lab k6 db_work

# C: too many total connections for Postgres
PG_MAX_CONNECTIONS=30 docker compose -f compose.yml -f compose.lab.yml up -d db
WEB_CONCURRENCY=4 RAILS_MAX_THREADS=10 bin/lab restart     # up to 40 connections
bin/lab k6 db_work -e MS=300 -e RATE=40

# D: same, through PgBouncer (transaction pooling, 20 server connections)
export LAB_DATABASE_URL="postgres://reactrouterplayground:reactrouterplayground@pgbouncer:5432/reactrouterplayground_development?prepared_statements=false&advisory_locks=false"
WEB_CONCURRENCY=4 RAILS_MAX_THREADS=10 bin/lab restart
bin/lab k6 db_work -e MS=300 -e RATE=40
bin/lab sql activity

# reset
unset LAB_DATABASE_URL; PG_MAX_CONNECTIONS=100 docker compose -f compose.yml -f compose.lab.yml up -d db; bin/lab restart
```

| Run | Result |
|---|---|
| A: 10 threads, pool 2 | **No errors**, but throughput capped at 20 req/s (2 conns ÷ 0.1s). App time 504ms vs SQL 105ms; queue avg 8.1s |
| A: 25 threads, pool 2 | **15.5% failed** with `ActiveRecord::ConnectionTimeoutError … all pooled connections were in use` |
| B: 10 threads, pool 10 | p95 110ms, 0 errors |
| C: 4×10 = 40 possible vs PG limit 30 | **15.5% failed** with `PG::ConnectionBad: FATAL: sorry, too many clients already` (2,048 log lines) |
| D: same through PgBouncer | **0 errors**; Postgres saw only ~21 connections. But p50 went 300ms → 2.2s |

**Signatures:**
- *Pool too small:* `app_ms` ≫ `sql_ms` with low CPU. Time is disappearing between "request started" and "query ran" — that's waiting for a connection. Errors only appear once the wait exceeds `checkout_timeout`, so a too-small pool often shows up as mysterious slowness first.
- *Postgres limit:* hard failures, `too many clients already`, `bin/lab sql activity` shows connections at `max_connections`.

**The lesson about PgBouncer (D):** it stopped the errors and protected Postgres, but **it does not create database capacity**. 20 real connections × (1 / 0.3s) = ~67 req/s < 80 requested, so requests queued inside PgBouncer instead. The real fix is making the 300ms query faster.

**Why "more threads + bigger pool" fails here:** run C *is* that answer. It converts slowness into hard errors.

Rails 7.2+ note: connections are leased per query (`with_connection`), not per request, so a request only holds a connection while actually querying (or in a transaction).

---

## Lab 5 — CPU-bound requests and the GVL

```bash
RAILS_MAX_THREADS=3 bin/lab restart;                    bin/lab k6 cpu -e RATE=12
RAILS_MAX_THREADS=10 bin/lab restart;                   bin/lab k6 cpu -e RATE=12
WEB_CONCURRENCY=2 RAILS_MAX_THREADS=3 bin/lab restart;  bin/lab k6 cpu -e RATE=12
```

Each request burns 50ms of pure-Ruby CPU (think: serializing a big JSON payload). One process can do at most ~20 of those per second.

| Run (12 → 24 req/s) | App time p50 | p95 total | Queue avg |
|---|---|---|---|
| 1 process × 3 threads | 155ms | 4.86s | 2.07s |
| 1 process × **10 threads** | **520ms** | 4.88s (no better) | 1.82s |
| **2 processes** × 3 threads | 53ms | 94ms | 10ms |

**What happened:** with 10 threads, requests moved from "waiting in Puma's queue" to "waiting for the GVL inside Rails" — app time tripled, total latency unchanged, throughput unchanged. Adding a second process doubled capacity because it's a second GVL on a second core.

**Signature:** api CPU at ~100% per process; time is in Ruby (not SQL); more threads makes `app_ms` worse.

**Fix:** more processes (Puma workers, or more instances) ≈ cores; then optimize the hot code (fewer allocations, faster serializer, cache rendered output).

Bonus: `bin/lab k6 login` hits real `has_secure_password` bcrypt checks — deliberately expensive CPU work.

---

## Lab 6 — Slow third-party API

```bash
RAILS_MAX_THREADS=3 bin/lab restart;  bin/lab k6 vendor -e DELAY=2
RAILS_MAX_THREADS=25 bin/lab restart; bin/lab k6 vendor -e DELAY=2
RAILS_MAX_THREADS=25 bin/lab restart; bin/lab k6 vendor -e DELAY=5
RAILS_MAX_THREADS=3 bin/lab restart;  bin/lab k6 vendor -e MODE=fixed
RAILS_MAX_THREADS=3 bin/lab restart;  bin/lab k6 vendor -e MODE=async
```

| Run (5 → 10 req/s) | p50 | p95 | Failed |
|---|---|---|---|
| Broken, 3 threads, vendor 2s | 30s | 30s | **63%** |
| Broken, **25 threads**, vendor 2s | 2.01s | 2.02s | 0% |
| Broken, 25 threads, vendor slows to **5s** | 8.4s | 15.2s | 0% (queue avg 4.1s) |
| Fixed (0.5s timeouts + circuit breaker + cached fallback), 3 threads | 10.6ms | 415ms | 0% |
| Async (Sidekiq job, return 202), 3 threads | 11.3ms | 15.5ms | 0% |

**This is the one case where "add threads" helps** — threads blocked on network I/O release the GVL, so 25 threads really can wait on 25 vendor calls. But capacity is `threads ÷ vendor latency`, so you've made *your* availability a function of *their* latency. When the vendor got slower (5s), it broke again.

**What the fix does:** after 5 failures in 30s the breaker opens and requests skip the vendor entirely and return the last good cached value (microseconds). It re-probes when the window expires (that's the occasional ~500ms request in the p95).

**Gotcha found while building this:** `Net::HTTP` silently **retries idempotent requests once** after a timeout (`max_retries` defaults to 1), so a 0.5s `read_timeout` actually took 1.0s. Set `max_retries: 0` when you want a hard bound.

**Async caveat:** the API stayed fast, but the Sidekiq `low` queue hit 198 jobs / 20s latency. The problem moved; it didn't disappear. That's Lab 8.

**Signature:** low CPU everywhere, low DB load, but all Puma threads busy and queue time high. APM traces show time in `Net::HTTP`.

---

## Lab 7 — Caching and stampedes

```bash
bin/lab k6 stats -e RATE=20 -e MODE=broken
bin/lab k6 stats -e RATE=20 -e MODE=naive -e TTL=5
bin/lab k6 stats -e RATE=20 -e MODE=fixed -e TTL=5
```

An aggregate over ~250k rows (top authors, last 90 days), ~70ms alone.

| Run (20 → 40 req/s) | p95 | p99 | Failed | Query executions (50s) |
|---|---|---|---|---|
| No cache | 30s | 30s | **66%** | every request (~400ms each under contention) |
| `Rails.cache.fetch(expires_in: 5s)` | 9.7ms | **182ms** | 0% | ~28 (≈3 per expiry) |
| + `race_condition_ttl: 10.seconds` | 7.7ms | 11.6ms | 0% | ~11 (≈1 per expiry) |

**Stampede:** when the naive key expires, every request in flight misses at once and they all run the query together — each one slower (190ms vs 65ms) because they compete. That's the p99 spike every TTL. `race_condition_ttl` lets the first request after expiry extend the stale value briefly and recompute while everyone else keeps getting the stale value.

**Other stampede tools:** jittered TTLs, background refresh (a job warms the key before it expires), a distributed lock around recompute, serving stale-while-revalidate.

**Cache talking points:** what to key on (include `updated_at`/version for automatic invalidation — `cache_key_with_version`), what *not* to cache (per-user data under a shared key), Redis memory and eviction policy (`allkeys-lru` for a cache), and that a cache hides a slow query rather than fixing it — a cold cache after a deploy or Redis restart puts you back at row 1.

---

## Lab 8 — Sidekiq backlog and queue isolation

```bash
bin/lab k6 jobs -e CRITICAL_QUEUE=default     # critical job behind 500 slow jobs
bin/lab k6 jobs -e CRITICAL_QUEUE=critical    # critical job on its own queue
```

500 jobs × 200ms each, 5 Sidekiq threads → ~20–25s to drain.

| Critical job enqueued to | Time it waited |
|---|---|
| `default` (behind the bulk jobs) | **21.6s** |
| `critical` (strict priority in [sidekiq.yml](../backend/config/sidekiq.yml)) | 214ms |

**Watch latency, not size:** queue latency (age of the oldest job) climbed to 12s while draining. A queue of 10,000 tiny jobs can be healthy; a queue of 50 can be an outage. Alert on latency per queue.

**Talking points:**
- Throughput ≈ concurrency ÷ job duration. Adding concurrency only helps if the jobs aren't bottlenecked on the DB, and **every Sidekiq thread needs a DB connection** (connection math again — `DB_POOL` follows `SIDEKIQ_CONCURRENCY` here).
- Separate queues (and often separate Sidekiq processes) by latency requirement: `critical`, `default`, `low`. Strict ordering can starve `low`; weighted queues avoid that.
- Retry storms: a failing dependency + automatic retries multiplies load. Use backoff (`retry_on … wait: :polynomially_longer`), a circuit breaker, and dead-letter after N attempts.
- Jobs must be idempotent (retries and at-least-once delivery mean they *will* run twice).
- `perform_all_later` / `push_bulk` for enqueueing thousands of jobs efficiently.

---

## Lab 9 — Lock contention on a hot row

```bash
RAILS_MAX_THREADS=10 bin/lab restart
bin/lab k6 like                 # meanwhile: bin/lab sql locks
bin/lab k6 like -e MODE=fixed
```

Everyone likes the same viral post.

| Run (10 → 20 req/s, 10 threads) | p50 | p95 | p99 | max |
|---|---|---|---|---|
| Broken: `with_lock` + 50ms notification inside the transaction | 1.27s | 3.39s | 6.57s | 30s (1 timeout) |
| Fixed: `update_counters` (atomic), notify after commit | 59ms | 69ms | 76ms | 95ms |

Mid-run: `waiting_on_locks = 9` — nine database sessions queued on one row lock.

**What's wrong with the broken version:** the row lock is held for the whole notification, so likes are serialized at ≤20/s *no matter how many threads or servers you add*. Each waiting request also holds a DB connection and a Puma thread, so the contention spreads to unrelated endpoints.

**Signature:** `pg_stat_activity` shows `wait_event_type = Lock`; `pg_blocking_pids()` points at one blocker; latency has a long tail; DB CPU is *low*.

**Fixes, in order of effort:**
1. Never do I/O (HTTP, email, `sleep`) inside a transaction. Use `after_commit` or enqueue a job.
2. Atomic updates: `UPDATE … SET likes_count = likes_count + 1` (`update_counters`, `increment_counter`) instead of read-modify-write.
3. Still too hot? Buffer: `INCR` in Redis and flush to Postgres every few seconds, or shard the counter into N rows and sum them.

---

## Resetting

```bash
bin/lab incident stop
bin/lab index add
unset LAB_DATABASE_URL
PG_MAX_CONNECTIONS=100 docker compose -f compose.yml -f compose.lab.yml up -d db
bin/lab restart
bin/lab down          # when finished
```
