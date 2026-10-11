class TryOnService
  # MVP: mock implementation backed by Rails.cache. Phase 2: swap to a real
  # try-on provider; the caller (GenerateOutfitsJob) stays unchanged.
  def self.call(item_ids)
    cache_key = "try_on/#{Digest::SHA256.hexdigest(item_ids.map(&:to_i).sort.join('-'))}"
    Rails.cache.fetch(cache_key, expires_in: 30.days) do
      MockTryOnService.call(item_ids)
    end
  end
end
