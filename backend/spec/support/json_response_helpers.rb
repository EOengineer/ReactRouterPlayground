# frozen_string_literal: true

module JsonResponseHelpers
  def expect_json_error(status, message)
    expect(response).to have_http_status(status)
    expect(response.media_type).to eq("application/json")
    expect(response.parsed_body["error"]).to eq(message)
  end
end

RSpec.configure do |config|
  config.include JsonResponseHelpers, type: :request
end
