# frozen_string_literal: true

module AuthenticationHelpers
  def sign_in(user, password: "password1234!")
    post "/session", params: { email: user.email, password: password }, as: :json
    expect(response).to have_http_status(:created)
  end
end

RSpec.configure do |config|
  config.include AuthenticationHelpers, type: :request
end
