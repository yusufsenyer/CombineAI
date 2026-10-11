module Api
  module V1
    class PackagesController < BaseController
      def index
        render json: Package.ordered.map { |p|
          { id: p.id, key: p.key, name: p.name, price_placeholder: p.price_placeholder, features: p.features }
        }
      end
    end
  end
end
