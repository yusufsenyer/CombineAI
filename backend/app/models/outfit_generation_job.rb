class OutfitGenerationJob < ApplicationRecord
  belongs_to :user

  enum :status, { pending: 0, partial: 1, complete: 2, error: 3 }
end
