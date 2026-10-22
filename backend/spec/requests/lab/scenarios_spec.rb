# frozen_string_literal: true

require "rails_helper"

RSpec.describe "Scaling lab scenarios", type: :request do
  let(:author) { create(:user, first_name: "Ada", last_name: "Lovelace") }

  describe "GET /lab/slow_query" do
    it "returns the user's most recent posts, newest first" do
      older = create(:post, user: author, created_at: 2.days.ago)
      newer = create(:post, user: author, created_at: 1.day.ago)
      create(:post)

      get "/lab/slow_query", params: { user_id: author.id }

      expect(response).to have_http_status(:ok)
      expect(response.parsed_body.pluck("id")).to eq([ newer.id, older.id ])
    end
  end

  describe "GET /lab/feed" do
    before { create_list(:post, 3, user: author) }

    it "returns the same feed in broken and fixed modes" do
      get "/lab/feed", params: { mode: "broken" }
      broken = response.parsed_body

      get "/lab/feed", params: { mode: "fixed" }

      expect(response.parsed_body).to eq(broken)
      expect(broken.first).to include("author" => "Ada Lovelace", "author_posts_count" => 3)
    end

    it "uses a constant number of queries when fixed" do
      get "/lab/feed", params: { mode: "fixed" }

      expect(response.headers["x-query-count"].to_i).to be <= 2
    end
  end

  describe "POST /lab/like" do
    %w[broken fixed].each do |mode|
      it "increments the like count (#{mode})" do
        post_record = create(:post, likes_count: 4)

        post "/lab/like", params: { mode:, post_id: post_record.id }

        expect(response.parsed_body["likes_count"]).to eq(5)
        expect(post_record.reload.likes_count).to eq(5)
      end
    end
  end

  describe "GET /lab/stats" do
    it "returns the same top authors whether or not it is cached" do
      create_list(:post, 2, user: author, likes_count: 3)
      create(:post, likes_count: 1)

      results = %w[broken naive fixed].map do |mode|
        get "/lab/stats", params: { mode: }
        response.parsed_body
      end

      expect(results.uniq.size).to eq(1)
      expect(results.first.first).to eq("user_id" => author.id, "posts" => 2, "likes" => 6)
    end
  end

  describe "GET /lab/vendor" do
    around do |example|
      original = ENV["SLOW_VENDOR_URL"]
      ENV["SLOW_VENDOR_URL"] = "http://127.0.0.1:1"
      example.run
    ensure
      ENV["SLOW_VENDOR_URL"] = original
    end

    it "degrades to a fallback instead of erroring when the vendor is down (fixed)" do
      get "/lab/vendor", params: { mode: "fixed" }

      expect(response).to have_http_status(:ok)
      expect(response.parsed_body["source"]).to eq("unavailable")
    end
  end

  describe "GET /lab/incident" do
    it "reports no incident when none is running" do
      get "/lab/incident"

      expect(response.parsed_body).to eq("incident" => "none")
    end
  end

  describe "request metrics" do
    it "reports query count and request queue time" do
      get "/lab/feed", params: { mode: "fixed" },
                       headers: { "X-Request-Start" => "t=#{((Time.now.to_f - 0.25) * 1000).round}" }

      expect(response.headers["x-query-count"]).to be_present
      expect(response.headers["x-queue-time-ms"].to_f).to be >= 250
      expect(response.headers["server-timing"]).to include("queue;dur=", "app;dur=")
    end
  end
end
