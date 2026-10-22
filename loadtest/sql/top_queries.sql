-- Which queries consume the most total database time since the last reset?
-- total_ms is what matters: a 2ms query called 1M times beats a 2s query called once.
SELECT
  calls,
  round(total_exec_time::numeric, 0)            AS total_ms,
  round(mean_exec_time::numeric, 2)             AS mean_ms,
  round(max_exec_time::numeric, 2)              AS max_ms,
  rows / greatest(calls, 1)                     AS rows_per_call,
  round(100 * shared_blks_hit::numeric / nullif(shared_blks_hit + shared_blks_read, 0), 1) AS cache_hit_pct,
  left(regexp_replace(query, '\s+', ' ', 'g'), 140) AS query
FROM pg_stat_statements
WHERE dbid = (SELECT oid FROM pg_database WHERE datname = current_database())
  AND query NOT ILIKE '%pg_stat_statements%'
ORDER BY total_exec_time DESC
LIMIT 10;
