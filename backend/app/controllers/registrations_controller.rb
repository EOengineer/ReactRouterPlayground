# frozen_string_literal: true

class RegistrationsController < ApplicationController
  allow_unauthenticated_access only: :create

  def create
    user = User.new(registration_params)

    if user.save
      start_new_session_for(user)
      render json: user, status: :created
    else
      render json: { errors: user.errors.full_messages }, status: :unprocessable_content
    end
  end

  private

  def registration_params
    params.permit(:email, :password, :password_confirmation, :first_name, :last_name)
  end
end
