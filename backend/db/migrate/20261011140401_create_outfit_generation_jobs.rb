class CreateOutfitGenerationJobs < ActiveRecord::Migration[8.1]
  def change
    create_table :outfit_generation_jobs do |t|
      t.references :user, null: false, foreign_key: true
      t.integer :status, null: false, default: 0
      t.jsonb :item_ids, null: false, default: []
      t.jsonb :outfit_ids, null: false, default: []

      t.timestamps
    end
  end
end
