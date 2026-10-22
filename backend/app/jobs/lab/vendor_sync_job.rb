# frozen_string_literal: true

require "net/http"

module Lab
  class VendorSyncJob < ApplicationJob
    queue_as :low

    # A job is the right place for a slow call: retries with backoff, and no user waiting.
    retry_on Net::OpenTimeout, Net::ReadTimeout, wait: :polynomially_longer, attempts: 5

    def perform(url)
      uri = URI(url)
      response = Net::HTTP.start(uri.host, uri.port, open_timeout: 2, read_timeout: 10) do |http|
        http.get(uri.request_uri)
      end
      Rails.cache.write(Lab::Vendor::LAST_GOOD_KEY, { vendor: response.code, source: "live" })
    end
  end
end
