# frozen_string_literal: true

module Lab
  # Lab 4: holds a database connection for `ms` milliseconds, like a slow query would.
  class DbWork
    MAX_MS = 5_000

    def self.call(ms)
      seconds = ms.to_i.clamp(0, MAX_MS) / 1000.0
      ActiveRecord::Base.with_connection do |conn|
        conn.select_value("SELECT pg_sleep(#{seconds})")
      end
      { slept_ms: (seconds * 1000).round }
    end
  end
end
