# frozen_string_literal: true

module Admin
  module AdminAuthorizable
    private

    def admin?
      user&.admin? == true
    end
  end
end
