class User < ApplicationRecord
  has_secure_password

  has_many :refresh_tokens, dependent: :destroy
  has_many :onboarding_answers, dependent: :destroy
  has_many :swipe_responses, dependent: :destroy
  has_many :wardrobe_items, dependent: :destroy
  has_many :outfits, dependent: :destroy
  has_many :outfit_generation_jobs, dependent: :destroy
  has_many :subscriptions, dependent: :destroy
  has_one :usage_counter, dependent: :destroy

  enum :package, { free: 0, plus: 1, pro: 2 }, default: :free

  PACKAGE_LIMITS = {
    "free" => { wardrobe_items: 5, daily_outfits: 3, outfits_per_run: 2, monthly_tryon: 0 },
    "plus" => { wardrobe_items: nil, daily_outfits: nil, outfits_per_run: 4, monthly_tryon: 20 },
    "pro"  => { wardrobe_items: nil, daily_outfits: nil, outfits_per_run: 6, monthly_tryon: nil }
  }.freeze

  validates :email, presence: { message: "boş bırakılamaz" },
                    uniqueness: { case_sensitive: false, message: "zaten kayıtlı" },
                    format: { with: URI::MailTo::EMAIL_REGEXP, message: "geçerli bir e-posta değil" }
  validates :name, presence: { message: "boş bırakılamaz" }
  validates :password, length: { minimum: 8, too_short: "en az 8 karakter olmalı" }, allow_nil: true

  before_validation :normalize_email

  def package_limits
    PACKAGE_LIMITS[package]
  end

  private

  def normalize_email
    self.email = email.to_s.strip.downcase
  end
end
