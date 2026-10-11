module Authentication
  extend ActiveSupport::Concern

  private

  def authenticate_request
    header = request.headers["Authorization"]
    token = header&.match(/^Bearer\s+(.+)$/i)&.captures&.first

    if token.blank?
      @current_user = nil
      return render_error("unauthorized", "Geçersiz veya süresi dolmuş token.", :unauthorized, reason: "token yok")
    end

    payload, failure = JsonWebToken.decode_with_reason(token)
    @current_user = payload ? User.find_by(id: payload[:user_id]) : nil

    return if @current_user

    reason =
      if failure == :expired then "token süresi dolmuş"
      elsif failure == :invalid then "geçersiz token"
      elsif payload then "kullanıcı bulunamadı"
      else "geçersiz token"
      end

    render_error("unauthorized", "Geçersiz veya süresi dolmuş token.", :unauthorized, reason: reason)
  end

  def current_user
    @current_user
  end
end
