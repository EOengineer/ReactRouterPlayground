# frozen_string_literal: true

# Adds the two numbers APM tools give you in production but Rails doesn't by default:
#
# * Request queue time: how long the request waited before Rails started on it,
#   computed from the X-Request-Start header a load balancer (or our k6 scripts) sets.
# * SQL query count: the fastest way to spot an N+1 on a JSON endpoint.
#
# Both are appended to the Server-Timing header (next to Rails' own sql/view timings),
# exposed as X-Query-Count / X-Queue-Time-Ms, and logged as a single line per request.
class RequestMetrics
  def initialize(app)
    @app = app
  end

  def call(env)
    queue_ms = queue_time_ms(env["HTTP_X_REQUEST_START"])
    queries = 0
    request_thread = Thread.current
    # Notification subscribers are global, so ignore queries from other requests' threads.
    counter = lambda do |*, payload|
      next unless Thread.current == request_thread

      queries += 1 unless payload[:name] == "SCHEMA" || payload[:cached]
    end

    started = Process.clock_gettime(Process::CLOCK_MONOTONIC)
    status, headers, body = ActiveSupport::Notifications.subscribed(counter, "sql.active_record") do
      @app.call(env)
    end
    app_ms = (Process.clock_gettime(Process::CLOCK_MONOTONIC) - started) * 1000

    timing = [ headers["server-timing"], "app;dur=#{app_ms.round(1)}" ]
    timing << "queue;dur=#{queue_ms.round(1)}" if queue_ms
    headers["server-timing"] = timing.compact.join(", ")
    headers["x-query-count"] = queries.to_s
    headers["x-queue-time-ms"] = queue_ms.round(1).to_s if queue_ms

    Rails.logger.info(
      "[metrics] #{env["REQUEST_METHOD"]} #{env["PATH_INFO"]} status=#{status} " \
      "app_ms=#{app_ms.round(1)} queue_ms=#{queue_ms&.round(1) || "-"} queries=#{queries}"
    )

    [ status, headers, body ]
  end

  private

  # Accepts the common formats: "t=1700000000123" (ms), "t=1700000000.123" (s),
  # or microseconds. Returns nil when the header is missing.
  def queue_time_ms(header)
    return unless header

    value = header.delete_prefix("t=").to_f
    return if value <= 0

    started_ms =
      if value > 1e15 then value / 1000.0
      elsif value > 1e12 then value
      else value * 1000.0
      end
    [ (Time.now.to_f * 1000) - started_ms, 0 ].max
  end
end

Rails.application.config.middleware.insert_before 0, RequestMetrics unless Rails.env.production?
