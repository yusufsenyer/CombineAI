class MockOutfitSuggestionService
  CATEGORY_TR = {
    "top" => "üst",
    "bottom" => "alt",
    "shoes" => "ayakkabı",
    "accessory" => "aksesuar"
  }.freeze

  TEMPLATES = [
    "Günlük, rahat bir seçim: %{pieces} bir araya gelince dengeli ve şık durur.",
    "İş için derli toplu bir kombin: %{pieces} uyumu güçlü bir siluet oluşturur.",
    "Hafta sonu için ideal: %{pieces} rahatlığı ve tarzı birleştirir.",
    "Minimal bir görünüm: %{pieces} az parçayla çok şey anlatır."
  ].freeze

  def self.call(items, _user, count)
    pieces = items.map { |item| "#{item.color} #{CATEGORY_TR.fetch(item.category, item.category)}" }
    description = pieces.length > 1 ? pieces[0..-2].join(", ") + " ve " + pieces[-1] : pieces.first.to_s

    Array.new(count) do |idx|
      TEMPLATES[idx % TEMPLATES.length] % { pieces: description }
    end
  end
end
