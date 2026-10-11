module Api
  module V1
    class MeController < BaseController
      include Authentication

      before_action :authenticate_request

      def show
        render json: user_json(current_user)
      end

      def usage
        counter = UsageCounter.for(current_user)
        limits = current_user.package_limits
        render json: {
          daily_outfit: { used: counter.daily_outfit_used, limit: limits[:daily_outfits] },
          monthly_tryon: { used: counter.monthly_tryon_used, limit: limits[:monthly_tryon] }
        }
      end
    end
  end
end
