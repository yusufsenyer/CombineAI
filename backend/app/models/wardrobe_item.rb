class WardrobeItem < ApplicationRecord
  belongs_to :user

  has_one_attached :image

  enum :category, { top: 0, bottom: 1, shoes: 2, accessory: 3 }
  enum :tagging_status, { processing: 0, done: 1, failed: 2 }

  ALLOWED_CONTENT_TYPES = %w[image/jpeg image/png image/webp].freeze
  MAX_IMAGE_SIZE = 10.megabytes

  validates :category, presence: true
  validate :image_content_type_allowed
  validate :image_size_allowed

  private

  def image_content_type_allowed
    return unless image.attached?
    return if ALLOWED_CONTENT_TYPES.include?(image.blob.content_type)

    errors.add(:image, "yalnızca JPEG/PNG/WebP olabilir")
  end

  def image_size_allowed
    return unless image.attached?
    return if image.blob.byte_size <= MAX_IMAGE_SIZE

    errors.add(:image, "10MB'dan küçük olmalı")
  end
end
