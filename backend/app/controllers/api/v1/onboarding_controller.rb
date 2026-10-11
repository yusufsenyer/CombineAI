module Api
  module V1
    class OnboardingController < BaseController
      include Authentication

      before_action :authenticate_request

      def questions
        render json: OnboardingQuestion.ordered.map { |q|
          { key: q.question_key, prompt: q.prompt, options: q.options }
        }
      end

      def swipe_cards
        render json: SwipeCard.order(:id).map { |c|
          { id: c.id, image_url: c.image_url, tags: c.tags }
        }
      end

      def complete
        ApplicationRecord.transaction do
          complete_params[:answers].to_a.each do |a|
            next if a[:question_key].blank?

            current_user.onboarding_answers
              .find_or_initialize_by(question_key: a[:question_key])
              .tap { |answer| answer.update!(answer_value: a[:answer_value]) }
          end

          complete_params[:swipes].to_a.each do |s|
            next if s[:card_id].blank?

            current_user.swipe_responses
              .find_or_initialize_by(card_id: s[:card_id])
              .tap { |response| response.update!(liked: s[:liked] == true) }
          end
        end

        current_user.update!(onboarding_completed: true)
        render json: { user: user_json(current_user) }
      end

      private

      def complete_params
        params.permit(answers: [ :question_key, :answer_value ], swipes: [ :card_id, :liked ])
      end
    end
  end
end
