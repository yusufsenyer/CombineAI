class CreateSwipeCards < ActiveRecord::Migration[8.1]
  def change
    create_table :swipe_cards do |t|
      t.string :image_url, null: false
      t.jsonb :tags, null: false, default: []

      t.timestamps
    end
  end
end
