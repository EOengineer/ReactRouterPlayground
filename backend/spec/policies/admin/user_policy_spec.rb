# frozen_string_literal: true

require "rails_helper"

RSpec.describe Admin::UserPolicy do
  it_behaves_like "admin-only policy action", :index?
  it_behaves_like "admin-only policy action", :show? do
    let(:record) { build(:user) }
  end

  describe Admin::UserPolicy::Scope do
    it_behaves_like "admin-only policy scope"
  end
end
