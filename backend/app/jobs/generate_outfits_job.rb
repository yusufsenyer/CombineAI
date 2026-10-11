class GenerateOutfitsJob < ApplicationJob
  queue_as :default

  def perform(generation_job_id)
    generation_job = OutfitGenerationJob.find(generation_job_id)
    user = generation_job.user
    items = user.wardrobe_items.where(id: generation_job.item_ids).to_a

    count = user.package_limits[:outfits_per_run]
    suggestions = OutfitSuggestionService.call(items, user, count)

    counter = UsageCounter.for(user)
    outfits = suggestions.map do |text|
      visual = resolve_visual(user, counter, generation_job.item_ids)
      user.outfits.create!(
        item_ids: generation_job.item_ids,
        text_suggestion: text,
        visual_status: visual[:status],
        visual_url: visual[:url],
        generation_job_id: generation_job.id.to_s
      )
    end

    generation_job.update!(status: :complete, outfit_ids: outfits.map(&:id))
  rescue StandardError => e
    generation_job&.update!(status: :error)
    raise e
  end

  private

  def resolve_visual(user, counter, item_ids)
    return { status: :locked, url: nil } if user.free?

    limit = user.package_limits[:monthly_tryon]
    return { status: :locked, url: nil } if limit && counter.monthly_tryon_used >= limit

    counter.increment_monthly_tryon!
    { status: :ready, url: TryOnService.call(item_ids) }
  end
end
