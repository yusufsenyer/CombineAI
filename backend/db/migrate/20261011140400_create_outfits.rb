class CreateOutfits < ActiveRecord::Migration[8.1]
  def change
    create_table :outfits do |t|
      t.references :user, null: false, foreign_key: true
      t.jsonb :item_ids, null: false, default: []
      t.text :text_suggestion
      t.integer :visual_status, null: false, default: 0
      t.string :visual_url
      t.string :generation_job_id

      t.timestamps
    end

    add_index :outfits, [ :user_id, :created_at ]
  end
end
