class CreateUsageCounters < ActiveRecord::Migration[8.1]
  def change
    create_table :usage_counters do |t|
      t.references :user, null: false, foreign_key: true, index: { unique: true }
      t.integer :daily_outfit_count, null: false, default: 0
      t.date :reset_at
      t.integer :monthly_tryon_count, null: false, default: 0
      t.string :reset_month

      t.timestamps
    end
  end
end
