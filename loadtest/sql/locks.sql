-- Who is blocked, and who is blocking them?
SELECT
  blocked.pid                                        AS blocked_pid,
  round(extract(epoch FROM now() - blocked.query_start)::numeric * 1000) AS waiting_ms,
  pg_blocking_pids(blocked.pid)                      AS blocked_by,
  left(regexp_replace(blocked.query, '\s+', ' ', 'g'), 80)  AS blocked_query,
  left(regexp_replace(blocker.query, '\s+', ' ', 'g'), 80)  AS blocker_query,
  blocker.state                                      AS blocker_state
FROM pg_stat_activity blocked
JOIN LATERAL unnest(pg_blocking_pids(blocked.pid)) AS b(pid) ON true
JOIN pg_stat_activity blocker ON blocker.pid = b.pid
ORDER BY waiting_ms DESC
LIMIT 20;

-- How many sessions are waiting on locks right now?
SELECT count(*) AS waiting_on_locks
FROM pg_stat_activity
WHERE wait_event_type = 'Lock';
