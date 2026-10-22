# frozen_string_literal: true

require "net/http"

module Lab
  # Lab 6: an endpoint that depends on a third-party API (the `slowvendor` container).
  # `delay` is how slow the vendor is being today.
  class Vendor
    LAST_GOOD_KEY = "lab:vendor:last_good"

    def initialize(mode, delay: 2)
      @mode = mode
      @uri = URI("#{ENV.fetch("SLOW_VENDOR_URL", "http://localhost:8080")}/delay/#{delay.to_f}")
    end

    def call
      case @mode
      when "fixed" then fixed
      when "async" then async
      else broken
      end
    end

    private

    # Net::HTTP defaults: 60s open timeout, 60s read timeout. Every Puma thread
    # that calls a slow vendor is stuck for the full vendor delay.
    def broken
      response = Net::HTTP.get_response(@uri)
      { status: 200, body: { vendor: response.code, source: "live" } }
    end

    # Tight timeouts, a circuit breaker, and a cached fallback.
    # max_retries: 0 because Net::HTTP silently retries idempotent requests once
    # after a timeout, which doubles the worst-case wait.
    def fixed
      breaker = CircuitBreaker.new("vendor", threshold: 5, window: 30.seconds)
      body = breaker.run(fallback: -> { fallback }) do
        response = Net::HTTP.start(@uri.host, @uri.port, open_timeout: 0.5, read_timeout: 0.5, max_retries: 0) do |http|
          http.get(@uri.request_uri)
        end
        live = { vendor: response.code, source: "live" }
        Rails.cache.write(LAST_GOOD_KEY, live)
        live
      end
      { status: 200, body: }
    end

    # Don't make the user wait at all: hand the call to Sidekiq and return 202.
    def async
      VendorSyncJob.perform_later(@uri.to_s)
      { status: 202, body: { enqueued: true } }
    end

    def fallback
      cached = Rails.cache.read(LAST_GOOD_KEY)
      cached ? cached.merge(source: "cache") : { vendor: nil, source: "unavailable" }
    end
  end
end
