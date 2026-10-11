class User < ApplicationRecord
  has_secure_password

  has_many :refresh_tokens, dependent: :destroy
  has_many :onboarding_answers, dependent: :destroy
  has_many :swipe_responses, dependent: :destroy

  enum :package, { free: 0, plus: 1, pro: 2 }, default: :free

  PACKAGE_LIMITS = {
    "free" => { wardrobe_items: 5, daily_outfits: 3, outfits_per_run: 2, monthly_tryon: 0 },
    "plus" => { wardrobe_items: nil, daily_outfits: nil, outfits_per_run: 4, monthly_tryon: 20 },
    "pro"  => { wardrobe_items: nil, daily_outfits: nil, outfits_per_run: 6, monthly_tryon: nil }
  }.freeze

  validates :email, presence: true,
                    uniqueness: { case_sensitive: false },
                    format: { with: URI::MailTo::EMAIL_REGEXP }
  validates :name, presence: true
  validates :password, length: { minimum: 8 }, allow_nil: true

  before_validation :normalize_email

  def package_limits
    PACKAGE_LIMITS[package]
  end

  private

  def normalize_email
    self.email = email.to_s.strip.downcase
  end
end
