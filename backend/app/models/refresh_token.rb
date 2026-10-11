class RefreshToken < ApplicationRecord
  belongs_to :user

  scope :active, -> { where(revoked_at: nil).where("expires_at > ?", Time.current) }

  def revoked?
    revoked_at.present? || expires_at <= Time.current
  end

  def revoke!
    update!(revoked_at: Time.current)
  end
end
