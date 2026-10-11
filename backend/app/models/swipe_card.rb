class SwipeCard < ApplicationRecord
  has_many :swipe_responses, foreign_key: :card_id
end
