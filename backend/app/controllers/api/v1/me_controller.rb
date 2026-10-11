module Api
  module V1
    class MeController < BaseController
      include Authentication

      before_action :authenticate_request

      def show
        render json: user_json(current_user)
      end
    end
  end
end
