# frozen_string_literal: true

require "rails_helper"

RSpec.describe User, type: :model do
  let(:password) { "password1234!" }
  subject(:user) { build(:user, password: password, password_confirmation: password) }

  it "is valid with email, names, and password" do
    expect(user).to be_valid
  end

  it "requires email, first_name, and last_name" do
    user.email = nil
    user.first_name = nil
    user.last_name = nil

    expect(user).not_to be_valid
    expect(user.errors[:email]).to be_present
    expect(user.errors[:first_name]).to be_present
    expect(user.errors[:last_name]).to be_present
  end

  describe "email uniqueness" do
    let(:taken_email) { "taken@example.com" }

    before { create(:user, email: taken_email) }

    it "requires a unique email" do
      user.email = taken_email

      expect(user).not_to be_valid
      expect(user.errors[:email]).to be_present
    end
  end

  describe "email normalization" do
    let(:raw_email) { "  Eric@Example.COM " }
    let(:normalized_email) { "eric@example.com" }

    it "strips and downcases email" do
      user.email = raw_email
      user.save!

      expect(user.reload.email).to eq(normalized_email)
    end
  end

  it "defaults admin to false" do
    user.save!
    expect(user.reload.admin).to be(false)
  end

  it "authenticates with the correct password" do
    user.save!
    expect(User.authenticate_by(email: user.email, password: password)).to eq(user)
    expect(User.authenticate_by(email: user.email, password: "wrong")).to be_nil
  end

  describe "password length" do
    let(:short_password) { "short" }

    it "requires password of at least 8 characters" do
      user.password = short_password
      user.password_confirmation = short_password

      expect(user).not_to be_valid
      expect(user.errors[:password]).to be_present
    end
  end
end
