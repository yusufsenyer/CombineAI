class Outfit < ApplicationRecord
  belongs_to :user

  enum :visual_status, { pending: 0, ready: 1, locked: 2, error: 3 }
end
