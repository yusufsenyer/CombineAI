# Be sure to restart your server when you modify this file.

# Avoid CORS issues when API is called from the frontend app.
# Handle Cross-Origin Resource Sharing (CORS) in order to accept cross-origin Ajax requests.
#
# NOTE (MVP): Native React Native / Expo Go clients do not enforce CORS. This permissive
# policy exists to unblock Expo Web during development. Tighten to specific origins in a
# later phase if a browser-based client is shipped.

Rails.application.config.middleware.insert_before 0, Rack::Cors do
  allow do
    origins "*"

    resource "*",
      headers: :any,
      methods: [ :get, :post, :put, :patch, :delete, :options, :head ]
  end
end
