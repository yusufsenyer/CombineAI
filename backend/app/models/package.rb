class Package < ApplicationRecord
  has_many :subscriptions, dependent: :destroy

  scope :ordered, -> { order(:sort_order) }
end
