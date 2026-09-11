# frozen_string_literal: true

require "rails_helper"

RSpec.describe "Admin users", type: :request do
  describe "GET /admin/users" do
    let(:request_path) { "/admin/users" }

    it "defaults to the JSON format without an extension or Accept header" do
      admin = create(:user, :admin)
      sign_in(admin)

      get "/admin/users"

      expect(response).to have_http_status(:ok)
      expect(response.media_type).to eq("application/json")
      expect(response.parsed_body).to be_an(Array)
    end

    it "returns all users for an admin" do
      admin = create(:user, :admin)
      other_user = create(:user)
      sign_in(admin)

      get "/admin/users", as: :json

      expect(response).to have_http_status(:ok)
      expect(response.media_type).to eq("application/json")
      expect(response.parsed_body).to include(
        a_hash_including("id" => admin.id, "email" => admin.email, "admin" => true),
        a_hash_including("id" => other_user.id, "email" => other_user.email, "admin" => false)
      )
    end

    it_behaves_like "requires authentication"
    it_behaves_like "requires admin"
  end

  describe "GET /admin/users/:id" do
    let!(:target_user) { create(:user) }
    let(:request_path) { "/admin/users/#{target_user.id}" }

    it "returns the user for an admin" do
      admin = create(:user, :admin)
      sign_in(admin)

      get "/admin/users/#{target_user.id}", as: :json

      expect(response).to have_http_status(:ok)
      expect(response.media_type).to eq("application/json")
      expect(response.parsed_body).to include(
        "id" => target_user.id,
        "email" => target_user.email,
        "first_name" => target_user.first_name,
        "last_name" => target_user.last_name,
        "admin" => false
      )
    end

    it "returns not found for a missing user" do
      admin = create(:user, :admin)
      sign_in(admin)

      get "/admin/users/0", as: :json

      expect_json_error(:not_found, "Not Found")
    end

    it_behaves_like "requires authentication"
    it_behaves_like "requires admin"
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
