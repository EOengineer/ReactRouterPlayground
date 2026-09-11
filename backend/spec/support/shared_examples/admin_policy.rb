# frozen_string_literal: true

RSpec.shared_examples "admin-only policy action" do |action|
  let(:record) { User }

  it "allows admins" do
    admin = build(:user, :admin)
    expect(described_class.new(admin, record).public_send(action)).to be(true)
  end

  it "denies non-admins" do
    regular_user = build(:user)
    expect(described_class.new(regular_user, record).public_send(action)).to be(false)
  end

  it "denies nil user" do
    expect(described_class.new(nil, record).public_send(action)).to be(false)
  end
end

RSpec.shared_examples "admin-only policy scope" do
  subject(:scope) { described_class.new(user, scope_class.all).resolve }

  let(:scope_class) { User }
  let!(:admin_user) { create(:user, :admin) }
  let!(:regular_user) { create(:user) }

  context "when user is an admin" do
    let(:user) { admin_user }

    it "returns all records" do
      expect(scope).to include(admin_user, regular_user)
    end
  end

  context "when user is not an admin" do
    let(:user) { regular_user }

    it "returns no records" do
      expect(scope).to be_empty
    end
  end

  context "when user is nil" do
    let(:user) { nil }

    it "returns no records" do
      expect(scope).to be_empty
    end
  end
end
