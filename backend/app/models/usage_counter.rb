class UsageCounter < ApplicationRecord
  belongs_to :user

  def self.for(user)
    find_or_create_by!(user_id: user.id) do |counter|
      counter.daily_outfit_count = 0
      counter.reset_at = Time.current.utc.to_date
      counter.monthly_tryon_count = 0
      counter.reset_month = Time.current.utc.strftime("%Y-%m")
    end
  end

  def daily_outfit_used
    ensure_daily_reset!
    daily_outfit_count
  end

  def monthly_tryon_used
    ensure_monthly_reset!
    monthly_tryon_count
  end

  def increment_daily_outfit!
    ensure_daily_reset!
    increment!(:daily_outfit_count)
  end

  def increment_monthly_tryon!
    ensure_monthly_reset!
    increment!(:monthly_tryon_count)
  end

  private

  def ensure_daily_reset!
    today = Time.current.utc.to_date
    return if reset_at == today

    update_columns(daily_outfit_count: 0, reset_at: today)
  end

  def ensure_monthly_reset!
    month = Time.current.utc.strftime("%Y-%m")
    return if reset_month == month

    update_columns(monthly_tryon_count: 0, reset_month: month)
  end
end
