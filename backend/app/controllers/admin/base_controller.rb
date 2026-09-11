# frozen_string_literal: true

module Admin
  # All admin actions require a signed-in session (ApplicationController → 401)
  # and admin authorization via Pundit (→ 403 for non-admins).
  class BaseController < ApplicationController
    rescue_from Pundit::NotAuthorizedError, with: :render_forbidden
    rescue_from ActiveRecord::RecordNotFound, with: :render_not_found

    after_action :verify_authorized
    after_action :verify_policy_scoped, only: :index

    class << self
      def allow_unauthenticated_access(**)
        raise ArgumentError, "Admin controllers require authentication"
      end
    end

    private

    def pundit_namespace(record)
      [ :admin, record ]
    end

    def authorize(record, ...)
      super(pundit_namespace(record), ...)
    end

    def policy_scope(scope, ...)
      super(pundit_namespace(scope), ...)
    end

    def render_forbidden
      render json: { error: "Forbidden" }, status: :forbidden
    end

    def render_not_found
      render json: { error: "Not Found" }, status: :not_found
    end
  end
end
