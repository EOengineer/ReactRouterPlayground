# frozen_string_literal: true

namespace :lab do
  desc "Seed ~10k users and ~1M posts for the scaling lab (idempotent)"
  task seed: :environment do
    user_target = Integer(ENV.fetch("LAB_USERS", 10_000))
    post_target = Integer(ENV.fetch("LAB_POSTS", 1_000_000))
    conn = ActiveRecord::Base.connection

    existing_users = User.where("email LIKE 'lab-user-%'").count
    if existing_users < user_target
      digest = BCrypt::Password.create("password1234!")
      now = Time.current
      (existing_users...user_target).each_slice(5_000) do |slice|
        User.insert_all(slice.map do |i|
          { email: "lab-user-#{i}@example.com", first_name: "Lab", last_name: "User #{i}",
            password_digest: digest, created_at: now, updated_at: now }
        end)
      end
    end
    puts "users: #{User.count}"

    missing = post_target - Post.count
    if missing.positive?
      puts "inserting #{missing} posts..."
      conn.execute(<<~SQL)
        WITH lab_users AS (
          SELECT array_agg(id) AS ids FROM users WHERE email LIKE 'lab-user-%'
        )
        INSERT INTO posts (user_id, title, body, likes_count, created_at, updated_at)
        SELECT user_id, 'Post ' || g, repeat('lorem ipsum dolor sit amet ', 8), likes, ts, ts
        FROM (
          SELECT
            g,
            lab_users.ids[1 + floor(random() * array_length(lab_users.ids, 1))::int] AS user_id,
            floor(random() * 100)::int AS likes,
            now() - random() * interval '365 days' AS ts
          FROM lab_users, generate_series(1, #{missing}) AS g
        ) generated
      SQL
      conn.execute(<<~SQL)
        UPDATE users SET posts_count = counts.n
        FROM (SELECT user_id, count(*) AS n FROM posts GROUP BY user_id) counts
        WHERE users.id = counts.user_id
      SQL
      conn.execute("ANALYZE posts")
      conn.execute("ANALYZE users")
    end
    puts "posts: #{Post.count}"
  end

  namespace :index do
    # Equivalent migration:
    #   disable_ddl_transaction!
    #   add_index :posts, [:user_id, :created_at], algorithm: :concurrently
    desc "Add posts(user_id, created_at) CONCURRENTLY (no table lock)"
    task add: :environment do
      sql = "CREATE INDEX CONCURRENTLY IF NOT EXISTS index_posts_on_user_id_and_created_at " \
            "ON posts (user_id, created_at)"
      started = Process.clock_gettime(Process::CLOCK_MONOTONIC)
      ActiveRecord::Base.connection.execute(sql)
      puts "index added in #{(Process.clock_gettime(Process::CLOCK_MONOTONIC) - started).round(1)}s"
    end

    desc "Drop the posts(user_id, created_at) index"
    task drop: :environment do
      ActiveRecord::Base.connection.execute("DROP INDEX CONCURRENTLY IF EXISTS index_posts_on_user_id_and_created_at")
      puts "index dropped"
    end
  end

  namespace :incident do
    desc "Start a random hidden incident behind GET /lab/incident"
    task start: :environment do
      Lab::Incident.start!
      puts "Incident started. Run: bin/lab k6 incident   ...then diagnose."
    end

    desc "Reveal the current incident"
    task reveal: :environment do
      puts "Current incident: #{Lab::Incident.current || "none"}"
    end

    desc "Stop the current incident"
    task stop: :environment do
      Lab::Incident.stop!
      puts "Incident stopped."
    end
  end
end
