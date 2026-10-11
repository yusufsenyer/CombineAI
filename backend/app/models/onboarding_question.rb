class OnboardingQuestion < ApplicationRecord
  has_many :onboarding_answers, foreign_key: :question_key, primary_key: :question_key

  scope :ordered, -> { order(:sort_order) }
end
