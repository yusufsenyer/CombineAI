# This file is auto-generated from the current state of the database. Instead
# of editing this file, please use the migrations feature of Active Record to
# incrementally modify your database, and then regenerate this schema definition.
#
# This file is the source Rails uses to define your schema when running `bin/rails
# db:schema:load`. When creating a new database, `bin/rails db:schema:load` tends to
# be faster and is potentially less error prone than running all of your
# migrations from scratch. Old migrations may fail to apply correctly if those
# migrations use external dependencies or application code.
#
# It's strongly recommended that you check this file into your version control system.

ActiveRecord::Schema[8.1].define(version: 2026_10_11_140402) do
  # These are extensions that must be enabled in order to support this database
  enable_extension "pg_catalog.plpgsql"

  create_table "active_storage_attachments", force: :cascade do |t|
    t.string "name", null: false
    t.string "record_type", null: false
    t.bigint "record_id", null: false
    t.bigint "blob_id", null: false
    t.datetime "created_at", null: false
    t.index ["blob_id"], name: "index_active_storage_attachments_on_blob_id"
    t.index ["record_type", "record_id", "name", "blob_id"], name: "index_active_storage_attachments_uniqueness", unique: true
  end

  create_table "active_storage_blobs", force: :cascade do |t|
    t.string "key", null: false
    t.string "filename", null: false
    t.string "content_type"
    t.text "metadata"
    t.string "service_name", null: false
    t.bigint "byte_size", null: false
    t.string "checksum"
    t.datetime "created_at", null: false
    t.index ["key"], name: "index_active_storage_blobs_on_key", unique: true
  end

  create_table "active_storage_variant_records", force: :cascade do |t|
    t.bigint "blob_id", null: false
    t.string "variation_digest", null: false
    t.index ["blob_id", "variation_digest"], name: "index_active_storage_variant_records_uniqueness", unique: true
  end

  create_table "onboarding_answers", force: :cascade do |t|
    t.bigint "user_id", null: false
    t.string "question_key", null: false
    t.string "answer_value", null: false
    t.datetime "created_at", null: false
    t.datetime "updated_at", null: false
    t.index ["user_id", "question_key"], name: "index_onboarding_answers_on_user_id_and_question_key", unique: true
    t.index ["user_id"], name: "index_onboarding_answers_on_user_id"
  end

  create_table "onboarding_questions", force: :cascade do |t|
    t.string "question_key", null: false
    t.text "prompt", null: false
    t.jsonb "options", default: [], null: false
    t.integer "sort_order", default: 0, null: false
    t.datetime "created_at", null: false
    t.datetime "updated_at", null: false
    t.index ["question_key"], name: "index_onboarding_questions_on_question_key", unique: true
  end

  create_table "outfit_generation_jobs", force: :cascade do |t|
    t.bigint "user_id", null: false
    t.integer "status", default: 0, null: false
    t.jsonb "item_ids", default: [], null: false
    t.jsonb "outfit_ids", default: [], null: false
    t.datetime "created_at", null: false
    t.datetime "updated_at", null: false
    t.index ["user_id"], name: "index_outfit_generation_jobs_on_user_id"
  end

  create_table "outfits", force: :cascade do |t|
    t.bigint "user_id", null: false
    t.jsonb "item_ids", default: [], null: false
    t.text "text_suggestion"
    t.integer "visual_status", default: 0, null: false
    t.string "visual_url"
    t.string "generation_job_id"
    t.datetime "created_at", null: false
    t.datetime "updated_at", null: false
    t.index ["user_id", "created_at"], name: "index_outfits_on_user_id_and_created_at"
    t.index ["user_id"], name: "index_outfits_on_user_id"
  end

  create_table "refresh_tokens", force: :cascade do |t|
    t.bigint "user_id", null: false
    t.string "token_digest", null: false
    t.datetime "revoked_at"
    t.datetime "expires_at", null: false
    t.datetime "created_at", null: false
    t.datetime "updated_at", null: false
    t.index ["token_digest"], name: "index_refresh_tokens_on_token_digest", unique: true
    t.index ["user_id"], name: "index_refresh_tokens_on_user_id"
  end

  create_table "swipe_cards", force: :cascade do |t|
    t.string "image_url", null: false
    t.jsonb "tags", default: [], null: false
    t.datetime "created_at", null: false
    t.datetime "updated_at", null: false
  end

  create_table "swipe_responses", force: :cascade do |t|
    t.bigint "user_id", null: false
    t.bigint "card_id", null: false
    t.boolean "liked", default: false, null: false
    t.datetime "created_at", null: false
    t.datetime "updated_at", null: false
    t.index ["card_id"], name: "index_swipe_responses_on_card_id"
    t.index ["user_id", "card_id"], name: "index_swipe_responses_on_user_id_and_card_id", unique: true
    t.index ["user_id"], name: "index_swipe_responses_on_user_id"
  end

  create_table "usage_counters", force: :cascade do |t|
    t.bigint "user_id", null: false
    t.integer "daily_outfit_count", default: 0, null: false
    t.date "reset_at"
    t.integer "monthly_tryon_count", default: 0, null: false
    t.string "reset_month"
    t.datetime "created_at", null: false
    t.datetime "updated_at", null: false
    t.index ["user_id"], name: "index_usage_counters_on_user_id", unique: true
  end

  create_table "users", force: :cascade do |t|
    t.string "email", null: false
    t.string "password_digest", null: false
    t.string "name"
    t.boolean "onboarding_completed", default: false, null: false
    t.integer "package", default: 0, null: false
    t.datetime "created_at", null: false
    t.datetime "updated_at", null: false
    t.index ["email"], name: "index_users_on_email", unique: true
  end

  create_table "wardrobe_items", force: :cascade do |t|
    t.bigint "user_id", null: false
    t.integer "category", null: false
    t.string "color"
    t.integer "tagging_status", default: 0, null: false
    t.datetime "created_at", null: false
    t.datetime "updated_at", null: false
    t.index ["user_id", "category"], name: "index_wardrobe_items_on_user_id_and_category"
    t.index ["user_id"], name: "index_wardrobe_items_on_user_id"
  end

  add_foreign_key "active_storage_attachments", "active_storage_blobs", column: "blob_id"
  add_foreign_key "active_storage_variant_records", "active_storage_blobs", column: "blob_id"
  add_foreign_key "onboarding_answers", "users"
  add_foreign_key "outfit_generation_jobs", "users"
  add_foreign_key "outfits", "users"
  add_foreign_key "refresh_tokens", "users"
  add_foreign_key "swipe_responses", "swipe_cards", column: "card_id"
  add_foreign_key "swipe_responses", "users"
  add_foreign_key "usage_counters", "users"
  add_foreign_key "wardrobe_items", "users"
end
