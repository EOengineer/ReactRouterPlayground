# frozen_string_literal: true

class MeController < ApplicationController
  def show
    render json: UserSerializer.as_json(Current.user)
  end
end
