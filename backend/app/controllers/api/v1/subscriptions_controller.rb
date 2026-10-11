module Api
  module V1
    class SubscriptionsController < BaseController
      include Authentication

      before_action :authenticate_request

      def create
        package = Package.find(params[:package_id])
        result = PaymentService.charge(current_user, package)

        unless result[:success]
          return render_error("payment_failed", "Ödeme tamamlanamadı.", :unprocessable_entity)
        end

        current_user.update!(package: package.key)
        subscription = current_user.subscriptions.create!(package: package, status: :active)

        render json: {
          subscription: { id: subscription.id, package: subscription.package.key, status: subscription.status },
          user: user_json(current_user)
        }
      end
    end
  end
end
