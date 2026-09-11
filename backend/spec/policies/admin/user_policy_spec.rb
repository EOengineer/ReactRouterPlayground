# frozen_string_literal: true

require "rails_helper"

RSpec.describe Admin::UserPolicy do
  subject(:policy) { described_class.new(user, User) }

  let(:user) { nil }

  describe "#index?" do
    it "allows admins" do
      admin = build(:user, :admin)
      expect(described_class.new(admin, User).index?).to be(true)
    end

    it "denies non-admins" do
      regular_user = build(:user)
      expect(described_class.new(regular_user, User).index?).to be(false)
    end

    it "denies nil user" do
      expect(policy.index?).to be(false)
    end
  end

  describe "#show?" do
    it "allows admins" do
      admin = build(:user, :admin)
      target = build(:user)
      expect(described_class.new(admin, target).show?).to be(true)
    end

    it "denies non-admins" do
      regular_user = build(:user)
      target = build(:user)
      expect(described_class.new(regular_user, target).show?).to be(false)
    end

    it "denies nil user" do
      target = build(:user)
      expect(described_class.new(nil, target).show?).to be(false)
    end
  end

  describe Admin::UserPolicy::Scope do
    subject(:scope) { described_class.new(user, User.all).resolve }

    let!(:admin_user) { create(:user, :admin) }
    let!(:regular_user) { create(:user) }

    context "when user is an admin" do
      let(:user) { admin_user }

      it "returns all users" do
        expect(scope).to include(admin_user, regular_user)
      end
    end

    context "when user is not an admin" do
      let(:user) { regular_user }

      it "returns no users" do
        expect(scope).to be_empty
      end
    end

    context "when user is nil" do
      let(:user) { nil }

      it "returns no users" do
        expect(scope).to be_empty
      end
    end
  end
end
