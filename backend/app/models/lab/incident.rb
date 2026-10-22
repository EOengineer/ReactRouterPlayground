# frozen_string_literal: true

module Lab
  # Lab 1: GET /lab/incident behaves like one hidden scenario. Diagnose which.
  class Incident
    KEY = "lab:incident"
    SCENARIOS = %w[slow_query n_plus_one slow_vendor lock_contention cpu_bound].freeze

    def self.start!(scenario = SCENARIOS.sample)
      Rails.cache.write(KEY, scenario)
      scenario
    end

    def self.stop!
      Rails.cache.delete(KEY)
    end

    def self.current
      Rails.cache.read(KEY)
    end

    def self.call
      case current
      when "slow_query"
        # "Search by title": title has no index, so this is a sequential scan of posts.
        { status: 200, body: Post.where(title: "Post #{rand(1_000_000)}").limit(5).pluck(:id) }
      when "n_plus_one" then { status: 200, body: Feed.new("broken").call }
      when "slow_vendor" then Vendor.new("broken", delay: 1.5).call
      when "lock_contention" then { status: 200, body: Like.new("broken", post_id: Post.minimum(:id)).call }
      when "cpu_bound" then { status: 200, body: CpuWork.call(80) }
      else { status: 200, body: { incident: "none" } }
      end
    end
  end
end
