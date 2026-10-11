class TokenService
  ACCESS_TTL = 2.hours
  REFRESH_TTL = 30.days

  def self.issue(user)
    access_token = JsonWebToken.encode({ user_id: user.id }, exp: ACCESS_TTL.from_now)
    raw_refresh = SecureRandom.hex(32)
    user.refresh_tokens.create!(
      token_digest: Digest::SHA256.hexdigest(raw_refresh),
      expires_at: REFRESH_TTL.from_now
    )
    { access_token: access_token, refresh_token: raw_refresh }
  end

  def self.user_for_refresh(raw)
    return nil if raw.blank?

    digest = Digest::SHA256.hexdigest(raw.to_s)
    RefreshToken.active.find_by(token_digest: digest)&.user
  end

  def self.revoke(raw, user)
    return if raw.blank?

    digest = Digest::SHA256.hexdigest(raw.to_s)
    user.refresh_tokens.where(token_digest: digest).find_each(&:revoke!)
  end
end
