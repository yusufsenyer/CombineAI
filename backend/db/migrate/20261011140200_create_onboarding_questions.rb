class CreateOnboardingQuestions < ActiveRecord::Migration[8.1]
  def change
    create_table :onboarding_questions do |t|
      t.string :question_key, null: false
      t.text :prompt, null: false
      t.jsonb :options, null: false, default: []
      t.integer :sort_order, null: false, default: 0

      t.timestamps
    end

    add_index :onboarding_questions, :question_key, unique: true
  end
end
