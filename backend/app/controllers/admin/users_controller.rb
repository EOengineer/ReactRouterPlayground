# frozen_string_literal: true

module Admin
  class UsersController < BaseController
    def index
      authorize User

      render json: policy_scope(User)
    end

    def show
      authorize User

      render json: User.find(params[:id])
    end
  end
end
