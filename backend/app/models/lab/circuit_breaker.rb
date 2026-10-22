# frozen_string_literal: true

module Lab
  # Minimal shared (Redis-backed) circuit breaker. After `threshold` failures within
  # `window`, the circuit opens and calls skip straight to the fallback until it expires,
  # so a dead dependency costs microseconds instead of a full timeout per request.
  # Production options: stoplight, circuitbox, semian.
  class CircuitBreaker
    def initialize(name, threshold: 5, window: 30.seconds)
      @key = "lab:circuit:#{name}"
      @threshold = threshold
      @window = window
    end

    def run(fallback:)
      return fallback.call if open?

      yield
    rescue Timeout::Error, SystemCallError, SocketError, IOError => e
      Rails.cache.increment(@key, 1, expires_in: @window)
      Rails.logger.warn("[circuit] #{@key} failure: #{e.class}")
      fallback.call
    end

    def open?
      Rails.cache.read(@key, raw: true).to_i >= @threshold
    end
  end
end
