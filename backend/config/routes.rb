Rails.application.routes.draw do
  # Define your application routes per the DSL in https://guides.rubyonrails.org/routing.html

  # Reveal health status on /up that returns 200 if the app boots with no exceptions, otherwise 500.
  # Can be used by load balancers and uptime monitors to verify that the app is live.
  get "up" => "rails/health#show", as: :rails_health_check

  # ActiveStorage is not auto-mounted in API-only mode; mount it so uploaded images
  # and generated visuals are servable to the mobile client.
  mount ActiveStorage::Engine => "/rails/active_storage"

  namespace :api do
    namespace :v1 do
      post "auth/register", to: "auth#register"
      post "auth/login", to: "auth#login"
      post "auth/refresh", to: "auth#refresh"
      post "auth/logout", to: "auth#logout"

      get "me", to: "me#show"
      get "me/usage", to: "me#usage"

      get "onboarding/questions", to: "onboarding#questions"
      get "onboarding/swipe_cards", to: "onboarding#swipe_cards"
      post "onboarding/complete", to: "onboarding#complete"

      get "wardrobe/items", to: "wardrobe_items#index"
      post "wardrobe/items", to: "wardrobe_items#create"
      patch "wardrobe/items/:id", to: "wardrobe_items#update"
      delete "wardrobe/items/:id", to: "wardrobe_items#destroy"

      post "outfits/generate", to: "outfits#generate"
      get "outfits/jobs/:job_id", to: "outfits#job"
      get "outfits", to: "outfits#index"
      get "outfits/:id", to: "outfits#show"
    end
  end
end
