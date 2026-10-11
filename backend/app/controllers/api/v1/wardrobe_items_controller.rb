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
        log_upload_request

        if wardrobe_limit_reached?
          log_upload_rejected("dolap limiti doldu (free 5 parça)")
          return render_error("wardrobe_limit_reached", "Free pakette 5 parça sınırına ulaştınız.", :unprocessable_entity)
        end

        image = params[:image]
        if image.blank?
          log_upload_rejected("image alanı yok")
          return render_error("missing_image", "Görsel yüklenmedi.", :unprocessable_entity)
        end

        item = current_user.wardrobe_items.new(tagging_status: :processing)
        item.image.attach(image)

        tags = AiTaggingService.call(item.image.blob)
        item.category = tags[:category]
        item.color = tags[:color]
        item.tagging_status = :done

        if item.save
          render json: wardrobe_item_json(item), status: :created
        else
          log_upload_rejected("doğrulama: #{item.errors.full_messages.join(', ')}")
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

      # --- upload observability (logging only, no behavior change) ---

      def log_upload_request
        base = "[UPLOAD] #{request.request_method} #{request.fullpath} " \
               "user=#{log_user_id} req=#{request.request_id} " \
               "content_type=#{request.headers['Content-Type'].to_s.inspect}"
        image = params[:image]

        if image.respond_to?(:original_filename)
          Rails.logger.info(
            "#{base} file=#{image.original_filename.inspect} part_type=#{image.content_type.inspect} " \
            "bytes=#{image.size} detected=#{detect_image_format(image)}"
          )
        else
          keys = params.keys - %w[controller action]
          Rails.logger.info("#{base} image alanı yok; gelen parametre anahtarları: #{keys.inspect}")
        end
      end

      def log_upload_rejected(reason)
        Rails.logger.info("[UPLOAD] reddedildi user=#{log_user_id} req=#{request.request_id} reason=#{reason.inspect}")
      end

      # Reads only the magic bytes of the uploaded file to guess the format; never logs content.
      def detect_image_format(image)
        io = image.respond_to?(:tempfile) ? image.tempfile : nil
        return "bilinmiyor" if io.nil?

        io.rewind
        head = io.read(16).to_s
        io.rewind

        case head
        when /\A\xFF\xD8\xFF/n then "jpeg"
        when /\A\x89PNG\r\n\x1A\n/n then "png"
        when /\ARIFF.{4}WEBP/n then "webp"
        when /ftyp(heic|heix|hevc|hevx|mif1|msf1|avif)/n then "heic/heif"
        else "bilinmiyor"
        end
      end
    end
  end
end
