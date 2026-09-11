# frozen_string_literal: true

require "rails_helper"

RSpec.describe "Me", type: :request do
  let!(:user) do
    create(
      :user,
      :admin,
      first_name: "Eric",
      last_name: "Oligney"
    )
  end

  describe "GET /me" do
    let(:request_path) { "/me" }

    it "defaults to the JSON format without an extension or Accept header" do
      sign_in(user)

      get "/me"

      expect(response).to have_http_status(:ok)
      expect(response.media_type).to eq("application/json")
      expect(response.parsed_body).to include("id" => user.id, "email" => user.email)
    end

    it "returns the current user when authenticated" do
      sign_in(user)

      get "/me", as: :json

      expect(response).to have_http_status(:ok)
      expect(response.media_type).to eq("application/json")
      expect(response.parsed_body).to include(
        "id" => user.id,
        "email" => user.email,
        "first_name" => user.first_name,
        "last_name" => user.last_name,
        "admin" => user.admin
      )
    end

    it_behaves_like "requires authentication"
  end
end
