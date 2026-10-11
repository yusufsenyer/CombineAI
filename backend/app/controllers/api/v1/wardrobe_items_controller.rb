module Api
  module V1
    class WardrobeItemsController < BaseController
      include Authentication

      before_action :authenticate_request
      before_action :set_item, only: [ :update, :destroy ]

      def index
        scope = current_user.wardrobe_items.order(created_at: :desc)
        scope = scope.where(category: params[:category]) if params[:category].present?
        render json: scope.map { |item| wardrobe_item_json(item) }
      end

      def create
        if wardrobe_limit_reached?
          return render_error("wardrobe_limit_reached", "Free pakette 5 parça sınırına ulaştınız.", :unprocessable_entity)
        end

        image = params[:image]
        return render_error("missing_image", "Görsel yüklenmedi.", :unprocessable_entity) if image.blank?

        item = current_user.wardrobe_items.new(tagging_status: :processing)
        item.image.attach(image)

        tags = AiTaggingService.call(item.image.blob)
        item.category = tags[:category]
        item.color = tags[:color]
        item.tagging_status = :done

        if item.save
          render json: wardrobe_item_json(item), status: :created
        else
          render_error("validation_error", item.errors.full_messages.join(", "), :unprocessable_entity)
        end
      end

      def update
        begin
          item = @item
          item.update!(update_params)
          render json: wardrobe_item_json(item)
        rescue ArgumentError
          render_error("validation_error", "Geçersiz kategori.", :unprocessable_entity)
        end
      end

      def destroy
        @item.destroy!
        head :no_content
      end

      private

      def set_item
        @item = current_user.wardrobe_items.find(params[:id])
      end

      def update_params
        params.permit(:category, :color)
      end

      def wardrobe_limit_reached?
        limit = current_user.package_limits[:wardrobe_items]
        return false if limit.nil?

        current_user.wardrobe_items.count >= limit
      end

      def wardrobe_item_json(item)
        {
          id: item.id,
          category: item.category,
          color: item.color,
          image_url: item.image.attached? ? Rails.application.routes.url_helpers.rails_blob_path(item.image, only_path: true) : nil,
          tagging_status: item.tagging_status
        }
      end
    end
  end
end
