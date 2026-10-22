-- The query behind GET /lab/slow_query. Compare the plan before and after `bin/lab index add`.
EXPLAIN (ANALYZE, BUFFERS)
SELECT posts.*
FROM posts
WHERE posts.user_id = (SELECT min(id) + 42 FROM users WHERE email LIKE 'lab-user-%')
ORDER BY posts.created_at DESC
LIMIT 20;
