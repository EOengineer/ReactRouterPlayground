# frozen_string_literal: true

module Lab
  # Lab 9: everyone likes the same viral post at once.
  class Like
    def initialize(mode, post_id:)
      @mode = mode
      @post_id = post_id
    end

    def call
      @mode == "fixed" ? fixed : broken
    end

    private

    # Read-modify-write under a row lock, with a slow side effect *inside* the
    # transaction. Every request queues on the same row lock (and holds a DB
    # connection while it waits), so throughput is capped at ~1 / notify time.
    def broken
      post = Post.find(@post_id)
      post.with_lock do
        post.likes_count += 1
        post.save!
        notify_author
      end
      { likes_count: post.likes_count }
    end

    # One atomic UPDATE ... SET likes_count = likes_count + 1 (row lock held for
    # microseconds), and the side effect runs after the lock is released.
    def fixed
      Post.update_counters(@post_id, likes_count: 1)
      notify_author
      { likes_count: Post.where(id: @post_id).pick(:likes_count) }
    end

    # Stand-in for a webhook/email/push call.
    def notify_author
      sleep 0.05
    end
  end
end
