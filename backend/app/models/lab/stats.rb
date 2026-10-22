# frozen_string_literal: true

module Lab
  # Lab 7: an expensive aggregate (top authors over the last 90 days, ~250k rows).
  class Stats
    CACHE_KEY = "lab:stats:top_authors"

    def initialize(mode, ttl: 5)
      @mode = mode
      @ttl = ttl.to_i.clamp(1, 3600).seconds
    end

    def call
      case @mode
      # When the key expires, every in-flight request misses at once and they all
      # run the query together: a cache stampede.
      when "naive" then Rails.cache.fetch(CACHE_KEY, expires_in: @ttl) { compute }
      # race_condition_ttl: the first request after expiry extends the stale value
      # and recomputes; everyone else keeps getting the stale value meanwhile.
      when "fixed" then Rails.cache.fetch(CACHE_KEY, expires_in: @ttl, race_condition_ttl: 10.seconds) { compute }
      else compute
      end
    end

    private

    def compute
      Post.where(created_at: 90.days.ago..)
          .group(:user_id)
          .order(Arel.sql("count(*) DESC"))
          .limit(10)
          .pluck(:user_id, Arel.sql("count(*)"), Arel.sql("sum(likes_count)"))
          .map { |user_id, posts, likes| { user_id:, posts:, likes: } }
    end
  end
end
