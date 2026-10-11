class Subscription < ApplicationRecord
  belongs_to :user
  belongs_to :package

  enum :status, { active: 0 }
end
