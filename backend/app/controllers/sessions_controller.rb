# frozen_string_literal: true

class SessionsController < ApplicationController
  allow_unauthenticated_access only: :create

  def create
    user = User.authenticate_by(email: params[:email], password: params[:password])

    if user
      start_new_session_for(user)
      render json: user, status: :created
    else
      render json: { error: "Invalid email or password" }, status: :unauthorized
    end
  end

  def destroy
    terminate_session
    head :no_content
  end
end
