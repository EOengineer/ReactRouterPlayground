# frozen_string_literal: true

require "sidekiq/api"

module Lab
  # Deliberately broken endpoints for docs/scaling-labs.md. Most take ?mode=broken|fixed.
  # Not routed in production.
  class ScenariosController < ActionController::API
    # Lab 2
    def slow_query
      render json: UserPosts.call(params[:user_id] || random_lab_user_id)
    end

    # Lab 3
    def feed
      render json: Feed.new(mode).call
    end

    # Lab 4
    def db_work
      render json: DbWork.call(params.fetch(:ms, 100))
    end

    # Lab 5
    def cpu
      render json: CpuWork.call(params.fetch(:ms, 50))
    end

    # Lab 6
    def vendor
      result = Vendor.new(mode, delay: params.fetch(:delay, 2)).call
      render json: result[:body], status: result[:status]
    end

    # Lab 7
    def stats
      render json: Stats.new(mode, ttl: params.fetch(:ttl, 5)).call
    end

    # Lab 8
    def enqueue
      count = params.fetch(:count, 500).to_i.clamp(0, 10_000)
      ms = params.fetch(:ms, 200).to_i
      critical_queue = params[:critical_queue] == "critical" ? :critical : :default

      ActiveJob.perform_all_later(Array.new(count) { SlowJob.new(ms) })
      CriticalJob.set(queue: critical_queue).perform_later(Time.now.to_f)

      render json: { enqueued: count, critical_queue: }, status: :accepted
    end

    # Lab 8
    def queues
      render json: {
        queues: Sidekiq::Queue.all.map { |q| { name: q.name, size: q.size, latency_s: q.latency.round(1) } },
        busy: Sidekiq::Workers.new.size,
        retries: Sidekiq::RetrySet.new.size,
        last_critical_wait_ms: Rails.cache.read(CriticalJob::LATENCY_KEY, raw: true)&.to_i
      }
    end

    # Lab 9
    def like
      render json: Like.new(mode, post_id: params[:post_id] || Post.minimum(:id)).call
    end

    # Lab 1
    def incident
      result = Incident.call
      render json: result[:body], status: result[:status]
    end

    private

    def mode
      params.fetch(:mode, "broken")
    end

    def random_lab_user_id
      min, max = User.where("email LIKE 'lab-user-%'").pick(Arel.sql("min(id)"), Arel.sql("max(id)"))
      min ? rand(min..max) : 0
    end
  end
end
