# frozen_string_literal: true

require "rails_helper"

RSpec.describe "Sessions", type: :request do
  let(:email) { "login@example.com" }
  let(:password) { "password1234!" }
  let!(:user) { create(:user, email: email, password: password, password_confirmation: password) }

  describe "POST /session" do
    it "signs in with valid credentials and sets a session cookie" do
      expect {
        post "/session", params: { email: email, password: password }, as: :json
      }.to change(Session, :count).by(1)

      expect(response).to have_http_status(:created)
      expect(response.cookies["session_id"]).to be_present
      expect(response.parsed_body).to include(
        "id" => user.id,
        "email" => user.email,
        "admin" => user.admin
      )
    end

    it "rejects invalid credentials" do
      post "/session", params: { email: email, password: "wrong" }, as: :json

      expect(response).to have_http_status(:unauthorized)
      expect(response.parsed_body["error"]).to eq("Invalid email or password")
    end
  end

  describe "DELETE /session" do
    it "signs out and destroys the session" do
      sign_in(user, password: password)

      expect {
        delete "/session", as: :json
      }.to change(Session, :count).by(-1)

      expect(response).to have_http_status(:no_content)
      expect(user.sessions.count).to eq(0)
    end

    it "requires authentication" do
      delete "/session", as: :json

      expect(response).to have_http_status(:unauthorized)
    end
  end
end
