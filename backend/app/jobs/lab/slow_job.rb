# frozen_string_literal: true

module Lab
  # Lab 8: bulk work (imports, emails, reports) that holds a DB connection for `ms`.
  class SlowJob < ApplicationJob
    queue_as :default

    def perform(ms)
      DbWork.call(ms)
    end
  end
end
