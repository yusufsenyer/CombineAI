class MockAiTaggingService
  CATEGORIES = %w[top bottom shoes accessory].freeze
  COLORS = %w[beyaz siyah lacivert gri bej bordo yeşil].freeze

  def self.call(image)
    seed = image.respond_to?(:checksum) ? image.checksum : image.to_s
    value = Digest::SHA256.hexdigest(seed.to_s).to_i(16)
    {
      category: CATEGORIES[value % CATEGORIES.length],
      color: COLORS[(value / CATEGORIES.length) % COLORS.length]
    }
  end
end
