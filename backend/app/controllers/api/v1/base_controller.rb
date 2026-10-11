module Api
  module V1
    class BaseController < ApplicationController
      private

      def user_json(user)
        {
          id: user.id,
          email: user.email,
          name: user.name,
          onboarding_completed: user.onboarding_completed,
          package: user.package
        }
      end
    end
  end
end
