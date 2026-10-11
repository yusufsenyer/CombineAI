class CreateUsers < ActiveRecord::Migration[8.1]
  def change
    create_table :users do |t|
      t.string :email, null: false
      t.string :password_digest, null: false
      t.string :name
      t.boolean :onboarding_completed, null: false, default: false
      t.integer :package, null: false, default: 0

      t.timestamps
    end

    add_index :users, :email, unique: true
  end
end
