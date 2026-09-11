# frozen_string_literal: true

module Admin
  class UserPolicy < ApplicationPolicy
    def index?
      admin?
    end

    def show?
      admin?
    end

    class Scope < ApplicationPolicy::Scope
      def resolve
        admin? ? scope.all : scope.none
      end
    end
  end
end
