# frozen_string_literal: true

module Admin
  class ApplicationPolicy < ::ApplicationPolicy
    include AdminAuthorizable

    class Scope < ::ApplicationPolicy::Scope
      include AdminAuthorizable
    end
  end
end
