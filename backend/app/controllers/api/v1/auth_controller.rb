module Api
  module V1
    class AuthController < BaseController
      include Authentication

      before_action :authenticate_request, only: :logout

      def register
        user = User.new(register_params)
        if user.save
          render json: auth_payload(user), status: :created
        else
          render_error("validation_error", user.errors.full_messages.join(", "), :unprocessable_entity)
        end
      end

      def login
        user = User.find_by(email: params[:email].to_s.strip.downcase)
        if user&.authenticate(params[:password].to_s)
          render json: auth_payload(user)
        else
          render_error("invalid_credentials", "E-posta veya şifre hatalı.", :unauthorized)
        end
      end

      def refresh
        user = TokenService.user_for_refresh(params[:refresh_token])
        if user
          access_token = JsonWebToken.encode({ user_id: user.id }, exp: TokenService::ACCESS_TTL.from_now)
          render json: { access_token: access_token }
        else
          render_error("invalid_refresh_token", "Geçersiz refresh token.", :unauthorized)
        end
      end

      def logout
        TokenService.revoke(params[:refresh_token], current_user)
        head :no_content
      end

      private

      def register_params
        params.permit(:email, :password, :name)
      end

      def auth_payload(user)
        TokenService.issue(user).merge(user: user_json(user))
      end
    end
  end
end
