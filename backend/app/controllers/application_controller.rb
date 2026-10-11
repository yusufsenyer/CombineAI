class ApplicationController < ActionController::API
  rescue_from ActiveRecord::RecordNotFound, with: :render_not_found
  rescue_from ActiveRecord::RecordInvalid, with: :render_validation_error

  private

  def render_error(code, message, status)
    render json: { error: { code: code, message: message } }, status: status
  end

  def render_not_found
    render_error("not_found", "Kaynak bulunamadı.", :not_found)
  end

  def render_validation_error(exception)
    render_error("validation_error", exception.record.errors.full_messages.join(", "), :unprocessable_entity)
  end
end
