# frozen_string_literal: true

FactoryBot.define do
  factory :post do
    user
    sequence(:title) { |n| "Post #{n}" }
    body { "lorem ipsum" }
  end
end
