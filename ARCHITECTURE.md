# ARCHITECTURE.md — Teknik Mimari ve API Sözleşmesi

Bu doküman `idea.md` bölüm 6'da alınan RN (frontend) + Rails API (backend) kararını,
güncel (2026) Rails ekosistemi araştırması ışığında somut teknoloji seçimlerine, veri
modeline ve API sözleşmesine döker.

---

## 1. Teknoloji Seçimleri ve Gerekçeleri

### 1.1 Backend Framework
**Rails 8, `--api` modunda** (`rails new backend --api`).

### 1.2 Kimlik Doğrulama: `jwt` + `bcrypt` (Devise/Rodauth değil)
**Karar:** Devise/Rodauth gibi tam kapsamlı auth framework'leri yerine, `has_secure_password`
(bcrypt) + `jwt` gem'i ile **kendi yazdığımız hafif JWT auth katmanı**.

**Gerekçe (araştırma sonucu):** Devise session/cookie odaklı tasarlanmıştır ve API-only
projelerde ekstra karmaşıklık getirir; Rodauth çok daha granüler ama kurulum maliyeti bu
projenin ölçeği için gereksiz. Basit bir mobil-first API için `bcrypt` (şifre hash'leme) +
`jwt` gem'i (token encode/decode) endüstri genelinde yaygın kabul gören, az bağımlılıklı ve
tam kontrol veren bir yaklaşımdır.

**Detaylar:**
- Access token: kısa ömürlü (ör. 2 saat), `Authorization: Bearer <token>` header'ında taşınır.
- Refresh token: uzun ömürlü, secure storage'da (mobil) saklanır; `POST /auth/refresh` ile yeni access token alınır.
- Secret key: Rails credentials sisteminde saklanır, asla repo'ya girmez.
- Logout: refresh token'ın DB'de invalidate edilmesi (basit bir `revoked_at` alanı yeterli — tam blacklist altyapısı MVP için gereksiz).

### 1.3 Background Jobs: **Solid Queue** (Redis yok)
**Karar:** Sidekiq yerine Rails 8'in varsayılanı olan **Solid Queue**.

**Gerekçe (araştırma sonucu):** Solid Queue, Rails 8 ile birlikte gelen ve işleri doğrudan
uygulamanın veritabanında saklayan (Postgres/MySQL/SQLite) bir job backend'idir; Redis gibi
ek bir servise ihtiyaç duymaz. Bu proje ölçeğinde (try-on/etiketleme job'ları — saniyeler
mertebesinde gecikme kabul edilebilir) Solid Queue performansı fazlasıyla yeterlidir ve
**aylık sunucu maliyetini doğrudan azaltır** (ayrı bir Redis instance'ı işletmeye gerek yok).
Yüksek trafik/ölçek gerekirse ileride Sidekiq'e geçiş mümkündür.

### 1.4 Cache: **Solid Cache** (Redis yok)
Aynı gerekçeyle, kombin/try-on görsellerinin cache'lenmesi (bkz. `idea.md` bölüm 4, madde 3)
için Redis yerine veritabanı destekli **Solid Cache** kullanılacak. Ekstra servis yok, maliyet
avantajı sürüyor.

### 1.5 Gerçek Zamanlı Güncelleme: **Polling (MVP) → Solid Cable (Faz 2+)**
**Karar:** MVP'de Kombin Sonuç Ekranı'nın job durumu takibi **basit polling** (ör. 1.5 saniyede
bir `GET /outfits/jobs/:job_id`) ile yapılacak; Action Cable/Solid Cable entegrasyonu Faz 2'ye
bırakılacak.

**Gerekçe:** Solid Cable, Rails 8 ile Redis'siz WebSocket desteği sunuyor ve maliyet açısından
uygun olsa da, React Native/Expo Go tarafında WebSocket client kurulumu (Action Cable JS
client'ının RN'e taşınması) ekstra karmaşıklık ekliyor. MVP'nin hızını önceliklendirmek için
polling ile başlamak, iş mantığını değiştirmeden ileride Solid Cable'a geçişi mümkün kılar
(client sadece veri alma yöntemini değiştirir, backend job modeli aynı kalır).

### 1.6 Dosya Depolama: Rails **ActiveStorage** + S3-uyumlu obje depolama
**Karar:** Kıyafet fotoğrafları ve üretilen görseller ActiveStorage üzerinden yönetilecek.
Sağlayıcı olarak **Cloudflare R2** (S3-uyumlu API) değerlendirilmesi önerilir.

**Gerekçe:** R2, S3 ile API uyumlu olduğu için ActiveStorage'ın S3 adapter'ı ile doğrudan
çalışır, ancak **egress (veri çıkışı) ücreti almaz** — kullanıcıların sürekli görsel
görüntülediği bir uygulamada bu, aylık maliyeti ciddi şekilde düşürebilir. Kesin sağlayıcı
seçimi (AWS S3 / Cloudflare R2 / Backblaze B2) proje ilerledikçe maliyet karşılaştırmasıyla
netleştirilebilir; ActiveStorage soyutlaması sayesinde bu değişim kod tarafında minimaldir.

### 1.7 Veritabanı: PostgreSQL
Solid Queue/Solid Cache'in `FOR UPDATE SKIP LOCKED` gibi mekanizmalarından tam performans
almak ve genel olgunluk için PostgreSQL tercih edilir (MySQL de desteklenir ama Rails
ekosisteminde Postgres daha yaygın ve iyi belgelenmiştir).

---

## 2. Veri Modeli

```
User
 ├─ id, email, password_digest, name
 ├─ onboarding_completed: boolean
 ├─ package: enum (free | plus | pro)
 └─ created_at, updated_at

RefreshToken
 ├─ user_id (FK)
 ├─ token_digest
 ├─ revoked_at: datetime | null
 └─ expires_at

OnboardingAnswer
 ├─ user_id (FK)
 ├─ question_key: string
 └─ answer_value: string

SwipeResponse
 ├─ user_id (FK)
 ├─ card_id (FK -> SwipeCard)
 └─ liked: boolean

SwipeCard (statik/seed veri)
 ├─ id, image_url, tag(s)

WardrobeItem
 ├─ user_id (FK)
 ├─ image (ActiveStorage attachment)
 ├─ category: enum (top | bottom | shoes | accessory)
 ├─ color: string
 ├─ tagging_status: enum (processing | done | failed)
 └─ created_at, updated_at

Outfit
 ├─ user_id (FK)
 ├─ item_ids: array/jsonb (kombin içeriği referansları)
 ├─ text_suggestion: text
 ├─ visual_status: enum (pending | ready | locked | error)
 ├─ visual_type: enum (collage | try_on)
 ├─ visual_url: string | null
 ├─ generation_job_id: string (job takibi için)
 └─ created_at

OutfitGenerationJob (job durumu takip tablosu; Solid Queue'nun kendi tablolarından ayrı, iş mantığına özel)
 ├─ id (job_id olarak client'a döner)
 ├─ user_id (FK)
 ├─ status: enum (pending | partial | complete | error)
 ├─ outfit_ids: array
 └─ created_at

UsageCounter
 ├─ user_id (FK)
 ├─ daily_outfit_count: integer, reset_at: date
 ├─ monthly_tryon_count: integer, reset_month: string (YYYY-MM)
 └─ (basit sayaç tablosu; günlük/aylık reset job/cron ile veya okuma anında hesaplanarak yönetilir)

Package (statik/seed veri)
 ├─ id, key (free|plus|pro), name, price_placeholder, features: jsonb

Subscription
 ├─ user_id (FK)
 ├─ package_id (FK)
 ├─ status: enum (active)
 └─ created_at
```

---

## 3. API Sözleşmesi (Endpoint Listesi)

Tüm endpoint'ler `/api/v1` altında. `🔒` = auth gerektirir.

### Auth
| Method | Path | Açıklama |
|---|---|---|
| POST | `/auth/register` | `{email, password, name}` → `{access_token, refresh_token, user}` |
| POST | `/auth/login` | `{email, password}` → `{access_token, refresh_token, user}` |
| POST | `/auth/refresh` | `{refresh_token}` → `{access_token}` |
| POST | `/auth/logout` 🔒 | refresh token'ı invalidate eder |
| GET | `/me` 🔒 | `{id, email, name, onboarding_completed, package}` |
| GET | `/me/usage` 🔒 | `{daily_outfit: {used, limit}, monthly_tryon: {used, limit}}` |

### Onboarding
| Method | Path | Açıklama |
|---|---|---|
| GET | `/onboarding/questions` 🔒 | Soru-cevap adımı için soru listesi |
| GET | `/onboarding/swipe_cards` 🔒 | Swipe kartları |
| POST | `/onboarding/complete` 🔒 | `{answers: [...], swipes: [...]}` → `onboarding_completed = true` |

### Dolap
| Method | Path | Açıklama |
|---|---|---|
| GET | `/wardrobe/items` 🔒 | `?category=` filtreli liste |
| POST | `/wardrobe/items` 🔒 | multipart image upload → mock etiketleme job'ı tetikler |
| PATCH | `/wardrobe/items/:id` 🔒 | kategori/renk düzenleme |
| DELETE | `/wardrobe/items/:id` 🔒 | |

### Kombin Üretimi
| Method | Path | Açıklama |
|---|---|---|
| POST | `/outfits/generate` 🔒 | `{item_ids: [...]}` → `{job_id}` (limit kontrolü burada yapılır, aşılmışsa 422) |
| GET | `/outfits/jobs/:job_id` 🔒 | polling → `{status, outfits: [{id, text_suggestion, visual: {status, url, locked}}]}` |
| GET | `/outfits` 🔒 | geçmiş liste (paginated) |
| GET | `/outfits/:id` 🔒 | detay |

### Paket / Ödeme
| Method | Path | Açıklama |
|---|---|---|
| GET | `/packages` | 3 paketin bilgisi (public olabilir) |
| POST | `/subscriptions` 🔒 | `{package_id}` → mock, her zaman başarılı → `user.package` günceller |

**Hata formatı (standart):**
```json
{ "error": { "code": "wardrobe_limit_reached", "message": "Free pakette 5 parça sınırına ulaştınız." } }
```

---

## 4. Mock ↔ Gerçek Servis Adapter Deseni

`idea.md`/`FAZ.md`'de belirtildiği gibi, tüm AI ve ödeme çağrıları tek bir arayüz üzerinden yapılır:

```ruby
# app/services/ai_tagging_service.rb
class AiTaggingService
  def self.call(image)
    # MVP: MockAiTaggingService.call(image)
    # Faz 2: RealAiTaggingService.call(image)
  end
end
```

Aynı desen `OutfitSuggestionService`, `TryOnService`, `PaymentService` için geçerlidir. Bu
sayede Faz 2'de sadece implementasyon sınıfı değişir, controller/job kodu değişmez.

---

## 5. Asenkron İş Akışı (Try-on / Kombin Üretimi)

1. Mobil `POST /outfits/generate` çağırır → Rails hemen `OutfitGenerationJob` kaydı oluşturur, `job_id` döner, gerçek işi Solid Queue'ya (Active Job) devreder.
2. Job içinde: önce metin öneri(ler) hızlıca üretilir ve `Outfit` kayıtları `text_suggestion` dolu, `visual_status: pending` olarak oluşturulur.
3. Aynı job (veya alt job'lar), her outfit için görsel üretimini (collage/try-on/mock) tetikler; tamamlandıkça `visual_status: ready` + `visual_url` güncellenir.
4. Mobil, `GET /outfits/jobs/:job_id`'yi polling ile çağırıp `partial`/`complete` durumunu izler, kart bazlı UI'ı buna göre günceller (bkz. `SCREENS.md` bölüm 5).
5. Free kullanıcıda try-on kartları hiç üretilmez; `visual_status: locked` olarak direkt işaretlenir (gereksiz AI çağrısı yapılmaz — maliyet optimizasyonu).

---

## 6. Güvenlik Notları

- Tüm hassas işlemler (AI çağrıları, ödeme, kota kontrolü) backend'de; mobil client hiçbir
  sağlayıcı API key'ine veya doğrudan storage erişimine sahip değildir.
- Kota/limit kontrolleri sunucu tarafında, her istekte yeniden doğrulanır (client tarafından
  gönderilen hiçbir değere güvenilmez).
- CORS, sadece mobil uygulamanın kullandığı origin'lere (gerekirse API key/HMAC ile ek doğrulama) kısıtlanır.
- Dosya yüklemelerinde tip/boyut kontrolü (ör. sadece jpeg/png, max 10MB) backend'de zorunlu kılınır.

---

## 7. Maliyet Optimizasyonu Özeti (Teknik Taraf)

| Alan | Karar | Etkisi |
|---|---|---|
| Background jobs | Solid Queue (DB-backed) | Redis maliyeti yok |
| Cache | Solid Cache (DB-backed) | Redis maliyeti yok |
| Gerçek zamanlı güncelleme | Polling (MVP) | Ekstra altyapı yok, basit |
| Dosya depolama | S3-uyumlu, egress ücretsiz sağlayıcı (ör. R2) değerlendirmesi | Görsel-yoğun uygulamada bant genişliği maliyeti düşer |
| Free kullanıcıda try-on | Hiç tetiklenmez, direkt `locked` | Gereksiz AI görsel çağrısı sıfırlanır |
| Aynı kombinasyon | Cache'den sunulur | Tekrarlanan AI çağrısı engellenir |
