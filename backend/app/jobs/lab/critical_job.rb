# frozen_string_literal: true

module Lab
  # Lab 8: latency-sensitive work (password reset email, payment webhook).
  # Records how long it sat in the queue before a worker picked it up.
  class CriticalJob < ApplicationJob
    LATENCY_KEY = "lab:critical:last_wait_ms"

    queue_as :critical

    def perform(enqueued_at)
      wait_ms = ((Time.now.to_f - enqueued_at) * 1000).round
      Rails.cache.write(LATENCY_KEY, wait_ms, raw: true)
      Rails.logger.info("[critical_job] waited #{wait_ms}ms in queue")
    end
  end
end
