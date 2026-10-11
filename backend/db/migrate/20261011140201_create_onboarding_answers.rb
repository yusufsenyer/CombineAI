class CreateOnboardingAnswers < ActiveRecord::Migration[8.1]
  def change
    create_table :onboarding_answers do |t|
      t.references :user, null: false, foreign_key: true
      t.string :question_key, null: false
      t.string :answer_value, null: false

      t.timestamps
    end

    add_index :onboarding_answers, [ :user_id, :question_key ], unique: true
  end
end
