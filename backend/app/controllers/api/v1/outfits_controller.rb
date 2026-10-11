module Api
  module V1
    class OutfitsController < BaseController
      include Authentication

      before_action :authenticate_request

      def generate
        item_ids = Array(params[:item_ids]).map(&:to_i)
        if item_ids.empty?
          return render_error("invalid_item_ids", "En az bir parça seçmelisin.", :unprocessable_entity)
        end

        items = current_user.wardrobe_items.where(id: item_ids)
        if items.count != item_ids.uniq.length
          return render_error("invalid_item_ids", "Geçersiz parça seçimi.", :unprocessable_entity)
        end

        counter = UsageCounter.for(current_user)
        limit = current_user.package_limits[:daily_outfits]
        if limit && counter.daily_outfit_used >= limit
          return render_error("daily_limit_reached", "Bugünlük kombin hakkını doldurdun. Yarın tekrar dene.", :unprocessable_entity)
        end

        generation_job = current_user.outfit_generation_jobs.create!(status: :pending, item_ids: item_ids)
        counter.increment_daily_outfit!

        GenerateOutfitsJob.perform_later(generation_job.id)

        render json: { job_id: generation_job.id }, status: :created
      end

      def job
        generation_job = current_user.outfit_generation_jobs.find(params[:job_id])
        outfits = current_user.outfits.where(generation_job_id: generation_job.id.to_s).order(:id)
        render json: { status: generation_job.status, outfits: outfits.map { |o| outfit_json(o) } }
      end

      def index
        page = (params[:page] || 1).to_i
        per = 20
        outfits = current_user.outfits.order(created_at: :desc).offset((page - 1) * per).limit(per)
        render json: outfits.map { |o| outfit_json(o) }
      end

      def show
        outfit = current_user.outfits.find(params[:id])
        render json: outfit_json(outfit)
      end

      private

      def outfit_json(outfit)
        items_by_id = current_user.wardrobe_items.where(id: outfit.item_ids).index_by(&:id)
        ordered = outfit.item_ids.filter_map { |id| items_by_id[id] }

        {
          id: outfit.id,
          text_suggestion: outfit.text_suggestion,
          item_ids: outfit.item_ids,
          item_images: ordered.filter_map { |i| blob_url(i.image) },
          visual: {
            status: outfit.visual_status,
            url: outfit.visual_url,
            locked: outfit.visual_status == "locked"
          },
          created_at: outfit.created_at
        }
      end

      def blob_url(image)
        return nil unless image.attached?

        Rails.application.routes.url_helpers.rails_blob_path(image, only_path: true)
      end
    end
  end
end
