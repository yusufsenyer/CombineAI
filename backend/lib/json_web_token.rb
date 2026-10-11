class JsonWebToken
  ALGORITHM = "HS256"

  def self.encode(payload, exp:)
    JWT.encode(payload.merge(exp: exp.to_i), secret, ALGORITHM)
  end

  def self.decode(token)
    body = JWT.decode(token, secret, true, algorithm: ALGORITHM).first
    ActiveSupport::HashWithIndifferentAccess.new(body)
  rescue JWT::DecodeError, JWT::ExpiredSignature
    nil
  end

  def self.secret
    Rails.application.credentials.jwt_secret
  end
end
