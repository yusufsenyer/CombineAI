class OutfitSuggestionService
  # MVP: mock implementation. Phase 2: swap to a real LLM provider here,
  # the caller (GenerateOutfitsJob) stays unchanged.
  def self.call(items, user, count)
    MockOutfitSuggestionService.call(items, user, count)
  end
end
