require "sidekiq/web"

Rails.application.routes.draw do
  # Reveal health status on /up that returns 200 if the app boots with no exceptions, otherwise 500.
  get "up" => "rails/health#show", as: :rails_health_check

  defaults format: :json do
    resource :registration, only: [ :create ]
    resource :session, only: [ :create, :destroy ]
    resource :me, only: [ :show ], controller: "me"

    namespace :admin do
      resources :users, only: [ :index ]
    end
  end

  # Sidekiq dashboard (dev only; API-only apps need session middleware for auth in prod)
  if Rails.env.development?
    mount Sidekiq::Web => "/sidekiq"
  end
end
