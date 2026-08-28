# frozen_string_literal: true

FactoryBot.define do
  factory :user do
    sequence(:email) { |n| "user#{n}@example.com" }
    first_name { "Test" }
    last_name { "User" }
    password { "password1234!" }
    password_confirmation { "password1234!" }
    admin { false }

    trait :admin do
      admin { true }
    end
  end
end
