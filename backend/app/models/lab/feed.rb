# frozen_string_literal: true

module Lab
  # Lab 3: the 50 newest posts with author info.
  class Feed
    LIMIT = 50

    def initialize(mode)
      @mode = mode
    end

    def call
      @mode == "fixed" ? fixed : broken
    end

    private

    # 1 query for posts + 1 per post for the author + 1 per post for COUNT(*) = 101 queries.
    def broken
      Post.order(created_at: :desc).limit(LIMIT).map do |post|
        serialize(post, post.user.posts.count)
      end
    end

    # 2 queries: posts, then all authors in one IN (...). Count comes from the counter cache.
    def fixed
      Post.includes(:user).order(created_at: :desc).limit(LIMIT).map do |post|
        serialize(post, post.user.posts_count)
      end
    end

    def serialize(post, author_posts_count)
      {
        id: post.id,
        title: post.title,
        author: post.user.full_name,
        author_posts_count: author_posts_count
      }
    end
  end
end
