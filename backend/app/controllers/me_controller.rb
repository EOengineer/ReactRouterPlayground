# frozen_string_literal: true

class MeController < ApplicationController
  def show
    render json: Current.user
  end
end
