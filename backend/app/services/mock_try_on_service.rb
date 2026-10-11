class MockTryOnService
  def self.call(item_ids)
    seed = Digest::SHA256.hexdigest(item_ids.map(&:to_i).sort.join('-'))[0, 12]
    "https://picsum.photos/seed/tryon-#{seed}/600/800"
  end
end
