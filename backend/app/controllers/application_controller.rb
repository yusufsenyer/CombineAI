class ApplicationController < ActionController::API
  # Registered first (Rails evaluates rescue_from handlers in reverse declaration order),
  # so the specific handlers below still take precedence. Logs unexpected exceptions with
  # a short backtrace, then re-raises so the response is unchanged.
  rescue_from StandardError, with: :log_unexpected_error
  rescue_from ActiveRecord::RecordNotFound, with: :render_not_found
  rescue_from ActiveRecord::RecordInvalid, with: :render_validation_error

  private

  def render_error(code, message, status, reason: nil)
    log_api_error(code, message, status, reason: reason)
    render json: { error: { code: code, message: message } }, status: status
  end

  def render_not_found
    render_error("not_found", "Kaynak bulunamadı.", :not_found, reason: "kaynak bulunamadı")
  end

  def render_validation_error(exception)
    render_error(
      "validation_error",
      exception.record.errors.full_messages.join(", "),
      :unprocessable_entity,
      reason: "doğrulama hatası: #{exception.record.errors.to_hash.inspect}"
    )
  end

  def log_api_error(code, message, status, reason: nil)
    status_code = Rack::Utils.status_code(status)
    line = "[API ERROR] #{request.request_method} #{request.fullpath} -> #{status_code} #{code} #{message.to_s.inspect}"
    line += " reason=#{reason.inspect}" if reason.present?
    line += " user=#{log_user_id} req=#{request.request_id}"
    Rails.logger.info(line)
  end

  def log_unexpected_error(exception)
    Rails.logger.error(
      "[API ERROR] #{request.request_method} #{request.fullpath} -> 500 internal_server_error " \
      "#{exception.class}: #{exception.message} user=#{log_user_id} req=#{request.request_id}"
    )
    Rails.logger.error((exception.backtrace || []).first(8).join("\n"))
    raise exception
  end

  # Log only the id (never the e-mail) to avoid leaking personal data.
  def log_user_id
    id = defined?(@current_user) ? @current_user&.id : nil
    id || "anon"
  end
end
