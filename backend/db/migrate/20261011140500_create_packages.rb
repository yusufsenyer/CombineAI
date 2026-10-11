class CreatePackages < ActiveRecord::Migration[8.1]
  def change
    create_table :packages do |t|
      t.string :key, null: false
      t.string :name, null: false
      t.string :price_placeholder, null: false
      t.jsonb :features, null: false, default: []
      t.integer :sort_order, null: false, default: 0

      t.timestamps
    end

    add_index :packages, :key, unique: true
  end
end
