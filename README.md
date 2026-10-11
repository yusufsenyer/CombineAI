# Kombin — Dolap & Kombin Asistanı

Kullanıcının dolabındaki kıyafetleri dijital ortama taşıyan; o gün **hazır** (temiz/ütülü) parçalardan
yapay zekâ ile kombin önerileri üreten ve premium kullanıcılarda bu kombinleri kullanıcının kendi
fotoğrafı üzerinde (try-on) gösteren bir mobil uygulama.

> **Faz 1 (MVP) durumu:** Tüm AI ve ödeme çağrıları **mock**'tur; akış uçtan uca çalışır.
> Gerçek AI/ödeme entegrasyonları Faz 2'ye bırakılmıştır.

- **Backend:** Ruby on Rails 8 (API-only) + PostgreSQL
- **Frontend:** React Native / Expo (TypeScript), Expo Go ile test
- **Diller:** Arayüz ve hata mesajları Türkçe

---

## 1. Mimari

```
Telefon (Expo Go)  ──HTTP/JSON──►  Rails API (/api/v1)  ──►  PostgreSQL
                                         │
                                         ├─ ActiveStorage (görseller)
                                         ├─ Background jobs (kombin üretimi)
                                         └─ Mock servisler (AI / ödeme)
```

- **Auth:** `has_secure_password` (bcrypt) + `jwt` — access token (2 sa) + refresh token (30 gün).
- **Background jobs:** Solid Queue (production) / `:async` (development).
- **Cache:** Solid Cache (production) / `:memory_store` (development). Redis **yok**.
- **Gerçek zamanlılık:** MVP'de **polling** (kombin job durumu); Action Cable Faz 2.
- **Dosya:** ActiveStorage (dev: local disk; S3-uyumlu sağlayıcıya geçişe hazır).
- **Mock/gerçek ayrımı:** Tüm AI/ödeme çağrıları adapter arayüzü üzerinden — Faz 2'de yalnızca
  implementasyon sınıfı değişir, çağıran kod değişmez:
  `AiTaggingService`, `OutfitSuggestionService`, `TryOnService`, `PaymentService`
  (→ `Mock*` implementasyonları).

---

## 2. Dizin Yapısı

```
CombineAI/
├── backend/                 # Rails 8 API-only
│   ├── app/controllers/api/v1/
│   ├── app/models/
│   ├── app/services/        # mock/gerçek servis adapter'ları
│   ├── app/jobs/            # GenerateOutfitsJob
│   ├── config/              # routes, database.yml, credentials...
│   └── db/                  # migrate + seeds
├── Frontend/                # Expo (React Native) + TypeScript
│   ├── App.tsx
│   └── src/
│       ├── api/             # client + endpoint'ler + tipler
│       ├── auth/            # AuthContext + token storage
│       ├── navigation/      # RootNavigator, AppStack, MainTabs, OnboardingStack
│       ├── screens/         # auth, onboarding, home, wardrobe, outfit, outfits, profile, packages
│       ├── components/      # Button, Input, Card, Badge, Skeleton, OutfitCard, UpgradeModal, Toast
│       ├── config/          # env, categories, limits
│       ├── theme/           # renk/tipografi/spacing
│       └── utils/           # imageUpload
├── idea.md                  # ürün vizyonu, paket yapısı, iş kuralları
├── ARCHITECTURE.md          # teknoloji seçimleri, veri modeli, API sözleşmesi
├── SCREENS.md               # ekran bazlı UI/UX spesifikasyonu
├── FAZ.md                   # faz/epic görev kırılımı
├── TEST_REPORT.md           # yükleme akışı + backend sağlık test raporu
└── .agents/skills/          # tasarım/uygulama skill'leri
```

---

## 3. Gereksinimler

| Araç | Sürüm |
|---|---|
| Ruby | 3.4.3 |
| Rails | 8.1.4 |
| PostgreSQL | 12+ (yerel sunucu) |
| Node.js | 24+ |
| npm | 11+ |
| Telefon | **Expo Go** (App Store / Play Store) |

---

## 4. Hızlı Başlangıç

İki terminal kullanın: biri backend, biri Metro.

### 4.1 Backend

```bash
cd backend
bundle install
bin/rails db:prepare      # combineai_development oluşturur + migrate eder
bin/rails db:seed         # onboarding soruları, swipe kartları, paketler

# Telefondan erişilebilmesi için MUTLAKA 0.0.0.0'a bağlayın:
bin/rails s -b 0.0.0.0
```

- Sağlık kontrolü: `http://localhost:3000/up` → `200`.
- Veritabanları: `combineai_development`, `combineai_test` (bkz. `config/database.yml`).
- JWT secret `config/credentials.yml.enc` içindedir (`bin/rails credentials:edit`).
  `config/master.key` repoya girmez; yoksa credential'lar okunamaz.

### 4.2 Frontend

```bash
cd Frontend
npm install

cp .env.example .env      # ve EXPO_PUBLIC_API_URL'i kendi LAN IP'nizle güncelleyin
# örn: EXPO_PUBLIC_API_URL=http://192.168.1.48:3000

npx expo start            # QR kodu Expo Go ile okutun
```

Ek script'ler: `npm run android`, `npm run ios`, `npm run web`.

---

## 5. Ortam Değişkenleri

| Değişken | Nerede | Açıklama |
|---|---|---|
| `EXPO_PUBLIC_API_URL` | `Frontend/.env` | Backend'in telefonun erişebildiği adresi (LAN IP). `.env` git'e girmez. |

Telefon **`localhost`'a ulaşamaz** — bu yüzden API adresi bilgisayarın yerel IP'si olmalı ve backend
`-b 0.0.0.0` ile dinlemelidir. IP değişirse yalnızca `.env` güncellenir.

---

## 6. API Özeti

Tüm endpoint'ler `/api/v1` altında. 🔒 = `Authorization: Bearer <access_token>` gerekir.

| Grup | Method & Path | Açıklama |
|---|---|---|
| Auth | `POST /auth/register` | `{email, password, name}` → `{access_token, refresh_token, user}` |
| | `POST /auth/login` | `{email, password}` → token'lar |
| | `POST /auth/refresh` | `{refresh_token}` → `{access_token}` |
| | `POST /auth/logout` 🔒 | refresh token'ı iptal eder |
| Me | `GET /me` 🔒 | mevcut kullanıcı |
| | `GET /me/usage` 🔒 | `{daily_outfit:{used,limit}, monthly_tryon:{used,limit}}` |
| Onboarding | `GET /onboarding/questions` 🔒 | soru listesi |
| | `GET /onboarding/swipe_cards` 🔒 | swipe kartları |
| | `POST /onboarding/complete` 🔒 | `{answers[], swipes[]}` → onboarding tamamlanır |
| Dolap | `GET /wardrobe/items?category=` 🔒 | liste |
| | `POST /wardrobe/items` 🔒 | multipart `image` → mock etiketleme |
| | `PATCH /wardrobe/items/:id` 🔒 | kategori/renk düzenle |
| | `DELETE /wardrobe/items/:id` 🔒 | sil |
| Kombin | `POST /outfits/generate` 🔒 | `{item_ids[]}` → `{job_id}` |
| | `GET /outfits/jobs/:job_id` 🔒 | polling → `{status, outfits[]}` |
| | `GET /outfits` 🔒 | geçmiş (sayfalı) |
| | `GET /outfits/:id` 🔒 | detay |
| Paket | `GET /packages` | 3 paket (public) |
| | `POST /subscriptions` 🔒 | `{package_id}` → mock ödeme + paket güncelleme |

**Hata formatı (standart):**
```json
{ "error": { "code": "wardrobe_limit_reached", "message": "Free pakette 5 parça sınırına ulaştınız." } }
```

---

## 7. Paket Yapısı ve Limitler

| | Free | Plus | Pro |
|---|---|---|---|
| Dolap parçası | 5 | sınırsız | sınırsız |
| Kombin çalıştırması | günde 3 | sınırsız | sınırsız |
| Çalıştırma başına kombin | 2 | 4 | 6 |
| Try-on | yok (kilitli) | 20/ay | sınırsız |

Tüm limit/kota kontrolleri **backend'de** yapılır; istemciden gelen değerlere güvenilmez.
Free kullanıcıda try-on hiç üretilmez (gereksiz AI maliyeti yok); aynı kombinasyon cache'den sunulur.

---

## 8. Tasarım Dili

Minimalist, "human-made" hissi veren sıcak monokrom bir sistem (`minimalist-ui` skill'i temel alınır).

- **Palet:** canvas `#FBFBFA`, yüzey `#FFFFFF`, ayırıcı `#EAEAEA`, metin `#111111`, ikincil `#787774`.
- **Vurgu:** soluk pasteller (pale red/blue/green/yellow) yalnızca rozet/etiketlerde; birincil CTA düz `#111111`.
- **Tipografi:** Space Grotesk (display/body/label hiyerarşisi; Inter/Roboto yasak).
- **Bileşen:** düz kartlar (1px hairline, 12px köşe), bol boşluk, gölge/gradient yok, emoji yok.

Tema: `Frontend/src/theme/` · Ortak bileşenler: `Frontend/src/components/`.

---

## 9. Bilinen Davranışlar / Sık Karşılaşılan Sorunlar

- **Telefonda "network error":** Backend `localhost`'a bağlıysa telefon erişemez → `bin/rails s -b 0.0.0.0`
  ve `.env` içinde LAN IP.
- **Fotoğraf yükleme (kritik):** SDK 57'de global `fetch` = Expo'nun `expo/fetch`'idir ve React Native'in
  `{ uri, name, type }` FormData parçasını **desteklemez** (`Unsupported FormDataPart implementation`).
  Bu yüzden yükleme, görsel **`expo-image-manipulator` ile JPEG'e normalize edilip** `expo-file-system`
  `File` nesnesi olarak FormData'ya eklenerek yapılır. Detay: `Frontend/src/utils/imageUpload.ts`,
  `Frontend/src/api/index.ts`.
- **HEIC:** iOS kamera varsayılanı HEIC'tir; normalize adımı görseli JPEG'e çevirdiği için sorun oluşmaz.
- **CORS:** Geliştirmede `origins "*"` (native istemci CORS uygulamaz; Expo Web için). Faz 2'de sıkılaştırılacak.
- **Görsel URL'leri:** API göreli yol döner (`/rails/active_storage/...`); istemci base URL'i ekler.
- **Log görünürlüğü:** Development'ta API hataları terminalde `[API ERROR]` (4xx) / `[UPLOAD]` (yükleme)
  satırlarıyla görünür; request id ile gruplanır.

---

## 10. Dokümanlar

| Dosya | İçerik |
|---|---|
| `idea.md` | ürün vizyonu, paket yapısı, iş kuralları |
| `ARCHITECTURE.md` | teknoloji seçimleri, veri modeli, **API sözleşmesi** |
| `SCREENS.md` | ekran bazlı state/bileşen/endpoint tanımları |
| `FAZ.md` | epic'ler ve kabul kriterleri |
| `TEST_REPORT.md` | yükleme akışı + backend regresyon test raporu |
| `.agents/skills/` | tasarım/uygulama rehberleri |

---

## 11. Faz Durumu

- **Faz 1 (MVP) — tamamlandı:** auth + onboarding, dolap yönetimi (mock etiketleme, 5 parça limiti),
  günlük kombin üretimi (metin + collage + kilitli/mock try-on, kota/cache), kombin geçmişi + profil,
  paket sistemi + mock ödeme.
- **Faz 2 — planlı:** gerçek AI (etiketleme/kombin/try-on) ve gerçek ödeme (e-fatura + sanal POS)
  entegrasyonları; yalnızca adapter implementasyonları değişir.
- **Faz 3 — planlı:** bildirimler, hava durumu/etkinlik bazlı öneri, maliyet optimizasyonları.
