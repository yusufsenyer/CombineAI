class CreateSwipeResponses < ActiveRecord::Migration[8.1]
  def change
    create_table :swipe_responses do |t|
      t.references :user, null: false, foreign_key: true
      t.references :card, null: false, foreign_key: { to_table: :swipe_cards }
      t.boolean :liked, null: false, default: false

      t.timestamps
    end

    add_index :swipe_responses, [ :user_id, :card_id ], unique: true
  end
end
