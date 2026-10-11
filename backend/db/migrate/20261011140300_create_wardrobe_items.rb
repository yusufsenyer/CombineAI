class CreateWardrobeItems < ActiveRecord::Migration[8.1]
  def change
    create_table :wardrobe_items do |t|
      t.references :user, null: false, foreign_key: true
      t.integer :category, null: false
      t.string :color
      t.integer :tagging_status, null: false, default: 0

      t.timestamps
    end

    add_index :wardrobe_items, [ :user_id, :category ]
  end
end
