# frozen_string_literal: true

module Lab
  # Lab 2: a perfectly normal-looking query that is only fast with the right index.
  # Without posts(user_id, created_at), Postgres reads posts newest-first via the
  # created_at index and filters on user_id until it finds 20 matches.
  class UserPosts
    def self.call(user_id)
      Post.where(user_id: user_id)
          .order(created_at: :desc)
          .limit(20)
          .pluck(:id, :title, :created_at)
          .map { |id, title, created_at| { id:, title:, created_at: } }
    end
  end
end
