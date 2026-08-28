# frozen_string_literal: true

module Admin
  class UsersController < BaseController
    def index
      authorize User

      render json: policy_scope(User)
    end
  end
end
