class SwipeResponse < ApplicationRecord
  belongs_to :user
  belongs_to :swipe_card, foreign_key: :card_id
end
