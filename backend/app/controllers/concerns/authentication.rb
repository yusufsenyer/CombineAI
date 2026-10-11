module Authentication
  extend ActiveSupport::Concern

  private

  def authenticate_request
    header = request.headers["Authorization"]
    token = header&.match(/^Bearer\s+(.+)$/i)&.captures&.first
    payload = token.present? ? JsonWebToken.decode(token) : nil
    @current_user = payload ? User.find_by(id: payload[:user_id]) : nil

    render_error("unauthorized", "Geçersiz veya süresi dolmuş token.", :unauthorized) unless @current_user
  end

  def current_user
    @current_user
  end
end
