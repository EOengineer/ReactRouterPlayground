# frozen_string_literal: true

class User < ApplicationRecord
  has_secure_password
  has_many :sessions, dependent: :destroy

  normalizes :email, with: ->(email) { email.strip.downcase }

  validates :email, presence: true, uniqueness: true
  validates :first_name, :last_name, presence: true
  validates :password, length: { minimum: 8 }, if: -> { password.present? }
end
