# frozen_string_literal: true

require "rails_helper"

RSpec.describe "Admin users", type: :request do
  let(:password) { "password1234!" }

  describe "GET /admin/users" do
    it "defaults to the JSON format without an extension or Accept header" do
      admin = create(:user, :admin, password: password, password_confirmation: password)
      sign_in(admin, password: password)

      get "/admin/users"

      expect(response).to have_http_status(:ok)
      expect(response.media_type).to eq("application/json")
      expect(response.parsed_body).to be_an(Array)
    end

    it "returns all users for an admin" do
      admin = create(:user, :admin, password: password, password_confirmation: password)
      other_user = create(:user)
      sign_in(admin, password: password)

      get "/admin/users", as: :json

      expect(response).to have_http_status(:ok)
      expect(response.media_type).to eq("application/json")
      expect(response.parsed_body).to include(
        a_hash_including("id" => admin.id, "email" => admin.email, "admin" => true),
        a_hash_including("id" => other_user.id, "email" => other_user.email, "admin" => false)
      )
    end

    it "returns forbidden for a signed-in non-admin" do
      user = create(:user, password: password, password_confirmation: password)
      sign_in(user, password: password)

      get "/admin/users", as: :json

      expect(response).to have_http_status(:forbidden)
      expect(response.media_type).to eq("application/json")
      expect(response.parsed_body["error"]).to eq("Forbidden")
    end

    it "returns unauthorized when not signed in (before admin authorization)" do
      get "/admin/users", as: :json

      expect(response).to have_http_status(:unauthorized)
      expect(response.media_type).to eq("application/json")
      expect(response.parsed_body["error"]).to eq("Unauthorized")
    end
  end

  describe "Admin::BaseController" do
    it "cannot skip authentication" do
      expect {
        Class.new(Admin::BaseController) do
          allow_unauthenticated_access only: :index
        end
      }.to raise_error(ArgumentError, "Admin controllers require authentication")
    end
  end
end
