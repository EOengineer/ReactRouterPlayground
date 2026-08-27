# frozen_string_literal: true

require "rails_helper"

RSpec.describe "Registrations", type: :request do
  describe "POST /registration" do
    let(:email) { "new@example.com" }
    let(:password) { "password1234!" }
    let(:first_name) { "New" }
    let(:last_name) { "User" }
    let(:params) do
      {
        email: email,
        password: password,
        password_confirmation: password,
        first_name: first_name,
        last_name: last_name
      }
    end

    it "defaults to the JSON format without an extension or Accept header" do
      post "/registration", params: params

      expect(response).to have_http_status(:created)
      expect(response.media_type).to eq("application/json")
      expect(response.parsed_body).to include("email" => email, "admin" => false)
    end

    it "creates a user, sets a session cookie, and returns the user" do
      expect {
        post "/registration", params: params, as: :json
      }.to change(User, :count).by(1)
        .and change(Session, :count).by(1)

      expect(response).to have_http_status(:created)
      expect(response.media_type).to eq("application/json")
      expect(response.cookies["session_id"]).to be_present
      expect(response.parsed_body).to include(
        "email" => email,
        "first_name" => first_name,
        "last_name" => last_name,
        "admin" => false
      )
    end

    it "ignores admin in registration params" do
      post "/registration", params: params.merge(admin: true), as: :json

      expect(response).to have_http_status(:created)
      expect(User.find_by!(email: email).admin).to be(false)
      expect(response.parsed_body["admin"]).to be(false)
    end

    it "returns validation errors for invalid input" do
      post "/registration", params: params.merge(email: "", password: "short"), as: :json

      expect(response).to have_http_status(:unprocessable_content)
      expect(response.media_type).to eq("application/json")
      expect(response.parsed_body["errors"]).to be_present
    end
  end
end
