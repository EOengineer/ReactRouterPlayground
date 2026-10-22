-- What is the database doing right now?

-- Connection usage vs the hard limit, per client (application_name is set in database.yml).
SELECT
  coalesce(nullif(application_name, ''), backend_type) AS client,
  state,
  count(*)                                             AS connections,
  current_setting('max_connections')::int              AS max_connections
FROM pg_stat_activity
WHERE datname = current_database() OR backend_type = 'client backend'
GROUP BY 1, 2
ORDER BY 3 DESC;

-- Currently running statements, longest first. wait_event_type = 'Lock' means blocked on a lock.
SELECT
  pid,
  application_name                            AS client,
  state,
  wait_event_type,
  wait_event,
  round(extract(epoch FROM now() - query_start)::numeric * 1000) AS running_ms,
  left(regexp_replace(query, '\s+', ' ', 'g'), 120) AS query
FROM pg_stat_activity
WHERE state <> 'idle'
  AND pid <> pg_backend_pid()
  AND datname = current_database()
ORDER BY query_start
LIMIT 20;
