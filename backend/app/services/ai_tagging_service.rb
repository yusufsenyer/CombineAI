class AiTaggingService
  # MVP: mock implementation. Phase 2: swap to a real vision provider here,
  # the caller (WardrobeItemsController) stays unchanged.
  def self.call(image)
    MockAiTaggingService.call(image)
  end
end
