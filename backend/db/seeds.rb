# This file should ensure the existence of records required to run the application in every environment (production,
# development, test). The code here should be idempotent so that it can be executed at any point in every environment.
# The data can then be loaded with the bin/rails db:seed command (or created alongside the database with db:setup).

onboarding_questions = [
  {
    question_key: "style",
    prompt: "Genelde ne tarz giyinirsin?",
    options: [ "Günlük / rahat", "Klasik / şık", "Spor", "Minimal / sade", "Cesur / renkli" ],
    sort_order: 1
  },
  {
    question_key: "purpose",
    prompt: "Kombinlerini ağırlıklı olarak ne için kullanırsın?",
    options: [ "İş", "Günlük", "Spor", "Özel davet", "Gece" ],
    sort_order: 2
  },
  {
    question_key: "color_preference",
    prompt: "En çok hangi renkleri tercih edersin?",
    options: [ "Nötr tonlar (siyah/beyaz/gri)", "Toprak tonları", "Pastel tonlar", "Canlı renkler" ],
    sort_order: 3
  },
  {
    question_key: "fit_preference",
    prompt: "Kalıp tercihin nasıl?",
    options: [ "Dar / slim", "Rahat / oversize", "Standart / regular" ],
    sort_order: 4
  }
]

onboarding_questions.each do |q|
  OnboardingQuestion.find_or_create_by!(question_key: q[:question_key]) do |record|
    record.prompt = q[:prompt]
    record.options = q[:options]
    record.sort_order = q[:sort_order]
  end
end

swipe_cards = [
  { image_url: "https://picsum.photos/seed/kombin-style-1/600/800", tags: [ "minimal", "sade" ] },
  { image_url: "https://picsum.photos/seed/kombin-style-2/600/800", tags: [ "spor", "rahat" ] },
  { image_url: "https://picsum.photos/seed/kombin-style-3/600/800", tags: [ "klasik", "şık" ] },
  { image_url: "https://picsum.photos/seed/kombin-style-4/600/800", tags: [ "sokak", "günlük" ] },
  { image_url: "https://picsum.photos/seed/kombin-style-5/600/800", tags: [ "bohem", "renkli" ] },
  { image_url: "https://picsum.photos/seed/kombin-style-6/600/800", tags: [ "klasik", "iş" ] },
  { image_url: "https://picsum.photos/seed/kombin-style-7/600/800", tags: [ "denim", "günlük" ] },
  { image_url: "https://picsum.photos/seed/kombin-style-8/600/800", tags: [ "spor", "aktif" ] }
]

swipe_cards.each do |card|
  SwipeCard.find_or_create_by!(image_url: card[:image_url]) do |record|
    record.tags = card[:tags]
  end
end
