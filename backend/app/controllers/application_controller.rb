# frozen_string_literal: true

class ApplicationController < ActionController::API
  include ActionController::Cookies
  include Authentication
  include Pundit::Authorization

  private

  def pundit_user
    Current.user
  end
end
