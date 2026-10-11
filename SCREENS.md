# SCREENS.md — Ekran Bazlı UI/UX Spesifikasyonu

Bu doküman, `idea.md` bölüm 7'de tanımlanan ekran akışının her bir ekranını; state'leri,
bileşenleri, tetiklediği API çağrılarını ve edge case'leri ile detaylandırır. Codex'in her
ekranı bağımsız olarak, tutarlı bir sözleşmeyle implemente edebilmesi hedeflenir.

**API konvansiyonu:** Tüm endpoint'ler `/api/v1/...` altında, JSON request/response,
auth gerektiren her istek `Authorization: Bearer <jwt>` header'ı taşır.

---

## 0. Splash

**Amaç:** Oturum kontrolü, yönlendirme.

**State'ler:**
- `loading` — token kontrolü sürerken (kısa süreli, spinner/logo)
- `redirect` — hedef ekran belirlenince otomatik yönlendirme (kullanıcı görmez)

**Mantık:**
1. Secure storage'dan JWT oku.
2. Token yoksa → **Auth**.
3. Token varsa → `GET /api/v1/me` ile doğrula ve kullanıcı durumunu al (`onboarding_completed: boolean`, `package: free|plus|pro`).
4. Token geçersiz/expired → **Auth**.
5. `onboarding_completed == false` → **Onboarding**.
6. `onboarding_completed == true` → **Ana Sayfa**.

**API:** `GET /api/v1/me`

---

## 1. Auth (Login / Register)

**Amaç:** Kayıt/giriş.

**Bileşenler:**
- Tab/segment: Giriş / Kayıt Ol
- E-posta + şifre alanları (Register'da ek: isim)
- "Giriş Yap" / "Kayıt Ol" butonu
- Hata mesajı alanı (inline, form üstünde)

**State'ler:**
- `idle`
- `submitting` — buton disabled + spinner
- `error` — hatalı kimlik bilgisi / e-posta zaten kayıtlı / validasyon hatası (inline gösterilir)
- `success` — token alınır, secure storage'a yazılır → yönlendirme

**Yönlendirme mantığı (login/register sonrası):**
- `onboarding_completed == false` → **Onboarding**
- `onboarding_completed == true` → **Ana Sayfa**

**API:**
- `POST /api/v1/auth/register` → `{ email, password, name }` → `{ token, user }`
- `POST /api/v1/auth/login` → `{ email, password }` → `{ token, user }`

---

## 2. Onboarding

**Amaç:** Zorunlu zevk/tercih profili oluşturma. Atlanamaz (geri tuşu/gesture ile çıkılamaz).

### 2A. Soru-Cevap Adımı
**Bileşenler:** Tek seferde 1 soru gösteren, ilerleme çubuklu (progress bar) çoktan seçmeli/tekli seçim ekranları (örn. "Genelde ne tarz giyinirsin?", "Ağırlıklı kullanım amacın?").

**State'ler:** `question_n_of_m`, `submitting` (son soru sonrası), `error` (ağ hatası → retry)

### 2B. Swipe Kartlar Adımı
**Bileşenler:** Kart deste görünümü (stil/kıyafet görselleri), sağa (beğen) / sola (beğenme) swipe, buton alternatifi (erişilebilirlik için ❤️ / ✕ butonları da olmalı).

**State'ler:**
- `loading` — kart seti çekiliyor
- `swiping` — aktif kullanım
- `empty` — kart seti bitti → otomatik olarak tamamlama isteğini tetikler
- `submitting`, `error`

**Tamamlanınca:** `onboarding_completed = true` set edilir → **Ana Sayfa**'ya yönlendirme.

**API:**
- `GET /api/v1/onboarding/questions`
- `GET /api/v1/onboarding/swipe_cards`
- `POST /api/v1/onboarding/complete` → `{ answers: [...], swipes: [{card_id, liked}] }` → `{ user }`

---

## 3. Ana Sayfa (Home Tab)

**Bileşenler:**
- "Bugün Ne Giyeyim?" büyük CTA kartı
- Hızlı kamera kısayolu (floating action button veya ikon) → **Dolabım / Kıyafet Ekleme** akışını açar
- Kota göstergesi: free kullanıcıda "Bugün X/3 kombin hakkın kaldı" rozeti (Plus/Pro'da gösterilmez ya da "Sınırsız" yazar)
- Son üretilen kombine hızlı erişim kartı (varsa; yoksa bu alan gizlenir)

**State'ler:**
- `loading` — kota/son kombin bilgisi çekiliyor
- `ready`
- `quota_exhausted` — free kullanıcı günlük 3 hakkını doldurmuşsa CTA'nın görünümü değişir (disabled + "Yarın tekrar dene" veya "Yükselt" ikincil butonu)

**API:**
- `GET /api/v1/home` → `{ daily_quota: {used, limit}, last_outfit: {...} | null, package }`

---

## 4. Hazır Kıyafet Seçimi

**Amaç:** Kullanıcı bugün temiz/hazır olan parçaları işaretler.

**Bileşenler:**
- Grid (kategori sekmeli filtre: Üst / Alt / Ayakkabı / Aksesuar)
- Her kart üzerinde checkbox/seçili durum vurgusu
- Alt sabit bar: "X parça seçildi" + "Kombin Oluştur" butonu (0 seçiliyken disabled)

**State'ler:**
- `loading` — dolap verisi çekiliyor
- `empty` — dolapta hiç parça yoksa → "Önce dolabına kıyafet ekle" CTA'sı ile **Kıyafet Ekleme**'ye yönlendirme
- `ready`
- `submitting` — "Kombin Oluştur" sonrası, **Kombin Sonuç Ekranı**'na yönlendirmeden önceki kısa an

**Edge case:** Free kullanıcı günlük hakkını doldurmuşsa bu ekrana girmeden Ana Sayfa'da engellenir (quota_exhausted state'i).

**API:**
- `GET /api/v1/wardrobe/items?ready_candidates=true`
- `POST /api/v1/outfits/generate` → `{ item_ids: [...] }` → `{ job_id }` (asenkron, bkz. bölüm 5)

---

## 5. Kombin Sonuç Ekranı

**Amaç:** Üretilen kombin(ler)i göstermek.

**Akış:**
1. `POST /api/v1/outfits/generate` çağrısından dönen `job_id` ile bu ekrana geçilir.
2. Metin bazlı öneriler genelde hızlı üretildiği için **polling** (ör. her 1.5sn) veya websocket
   (Action Cable) ile `job_id` durumu izlenir.
3. Metin öneri(ler) geldiğinde kartlar hemen render edilir (görsel alanı henüz `pending` state'inde skeleton gösterir).
4. Her kart için görsel (collage/try-on) ayrı ayrı hazır oldukça günceller (progressive).

**Kart State'leri (her kombin kartı bağımsız):**
- `text_pending` — metin öneri de henüz gelmedi (ilk anlık state, çok kısa sürmeli)
- `text_ready_visual_pending` — metin hazır, görsel skeleton/shimmer'da
- `visual_ready` — görsel de hazır (collage veya try-on görseli)
- `visual_locked` — **free kullanıcı, try-on hak etmiyor:** görsel alanı blurlu placeholder +
  kilit ikonu + "Try-on için premium alın" metni; tıklanınca **Paket Karşılaştırma**'ya gider
- `error` — üretim başarısız, "Tekrar dene" butonu

**Ekran genel state'leri:**
- `loading` (job henüz başlamadı/ilk yanıt bekleniyor)
- `partial` (bazı kartlar hazır, bazıları hâlâ üretiliyor)
- `complete` (tüm kartlar `visual_ready` veya `visual_locked`)
- `quota_exhausted_mid_flow` — free kullanıcı bu çalıştırmada üretilen 2 kombini gördükten sonra tekrar üretmek isterse ve günlük hakkı dolmuşsa

**API:**
- `GET /api/v1/outfits/jobs/:job_id` (polling) → `{ status: pending|partial|complete|error, outfits: [{id, text_suggestion, visual: {status, url|null, locked: boolean}}] }`
- (Alternatif: Action Cable ile `OutfitJobChannel` üzerinden push)

---

## 6. Dolabım (Wardrobe Tab)

**Bileşenler:**
- Grid görünüm, üstte kategori filtre çubuğu (Tümü / Üst / Alt / Ayakkabı / Aksesuar)
- Her kart: küçük resim + kategori/renk etiketi
- Sağ alt "+" floating action button

**State'ler:**
- `loading`
- `empty` — "Henüz kıyafet eklemedin" + büyük "+" CTA
- `ready`
- `limit_reached` — free kullanıcı 5 parçaya ulaştıysa "+" tıklanınca ekleme akışı yerine upgrade modalı açılır

**API:**
- `GET /api/v1/wardrobe/items?category=...`
- `DELETE /api/v1/wardrobe/items/:id` (kıyafet silme — kart üzerinde uzun basma/swipe menüsü)

### 6A. Kıyafet Ekleme Akışı (modal/stack, Ana Sayfa'dan da erişilebilir)
1. Kaynak seç: Kamera / Galeri (action sheet)
2. Fotoğraf çekildi/seçildi → **önizleme** ekranı (kırpma opsiyonu opsiyonel)
3. "Yükle" → `submitting` state, arka planda oto etiketleme (mock AI) çalışır
4. **Onay adımı yoktur** — sonuç geldiğinde parça otomatik dolaba kaydedilir ve kullanıcıya kısa bir "Eklendi ✓" toast'ı gösterilir; kullanıcı isterse dolap ekranından kart detayına girip kategori/rengi sonradan düzenleyebilir.
5. Akış otomatik kapanır, kullanıcı bir sonraki fotoğrafı ekleyebilir (arka arkaya hızlı ekleme akışı desteklenir — "Yeni Ekle" kısayolu hemen sunulur).

**State'ler:** `source_select`, `preview`, `uploading`, `error` (yükleme başarısız → retry), `limit_reached` (5. parçadan sonra free kullanıcıda akış başlamadan upgrade modalı)

**API:**
- `POST /api/v1/wardrobe/items` (multipart: image) → `{ id, category, color, image_url, status: processing|done }`
- `PATCH /api/v1/wardrobe/items/:id` → `{ category, color }` (sonradan düzenleme)

---

## 7. Kombinler (Outfits History Tab)

**Bileşenler:** Tarih sıralı liste/grid, her öğe küçük önizleme + tarih

**State'ler:** `loading`, `empty` ("Henüz kombin oluşturmadın" + Ana Sayfa'ya CTA), `ready`

**Detay ekranı:** Seçilen kombinin tam görünümü (Kombin Sonuç Ekranı'ndaki kart görünümünün salt-okunur versiyonu)

**API:**
- `GET /api/v1/outfits?page=...`
- `GET /api/v1/outfits/:id`

---

## 8. Profil (Profile Tab)

**Bileşenler:**
- Kullanıcı adı/e-posta
- Paket rozeti (Free/Plus/Pro)
- Kullanım sayaçları: "Bugün X/3 kombin çalıştırması", "Bu ay X/20 try-on" (Pro'da "Sınırsız")
- "Paketi Yükselt/Değiştir" butonu (Free/Plus'ta görünür, Pro'da "Mevcut Paketin" olarak pasif)
- Çıkış Yap

**State'ler:** `loading`, `ready`

**API:**
- `GET /api/v1/me/usage` → `{ daily_outfit: {used, limit}, monthly_tryon: {used, limit} }`
- `POST /api/v1/auth/logout`

---

## 9. Paket Karşılaştırma Ekranı

**Bileşenler:** 3 paket kartı (Free/Plus/Pro) yan yana kaydırmalı veya alt alta, özellik karşılaştırma tablosu, her kartta "Seç"/"Mevcut Paketin" butonu

**State'ler:** `loading` (paket bilgisi statik olabilir, sunucudan da çekilebilir), `ready`, `current_package_highlighted`

**API:**
- `GET /api/v1/packages` → `[{id, name, price_placeholder, features: [...]}]`

**Not:** Fiyat alanları bu aşamada placeholder (`idea.md` bölüm 9'da fiyatlandırma açık konu olarak işaretli).

---

## 10. Mock Ödeme Ekranı

**Amaç:** Gerçek satın alma deneyimini taklit eden tam ekran form.

**Bileşenler:**
- Seçilen paket özeti (üstte)
- Mock kart formu: Kart Numarası, Son Kullanma Tarihi, CVV, Kart Üzerindeki İsim (hiçbiri gerçek validasyon yapmaz, sadece boş olmama kontrolü yeterli)
- "Öde" butonu

**State'ler:**
- `idle`
- `submitting` — buton spinner
- `success` — **`Alert.alert("Ödeme alındı")`** gösterilir → Profil'e dönüş, paket güncellenmiş olarak yansır
- (Gerçek hata senaryosu yok, mock her zaman başarılı döner)

**API:**
- `POST /api/v1/subscriptions` → `{ package_id }` → `{ subscription, user }` (backend, mock olarak her zaman başarılı işler ve `user.package`'ı günceller)

---

## Ortak Bileşenler / Kalıplar

- **Upgrade Modalı:** Free limit dolduğunda (dolap 5 parça, günlük 3 kombin, try-on kilidi) tetiklenen ortak bir modal component; "Paketleri Gör" butonu **Paket Karşılaştırma**'ya götürür.
- **Toast/Snackbar:** Kısa başarı/hata bildirimleri (örn. "Eklendi ✓") için ortak component.
- **Skeleton/Shimmer Kart:** Kombin Sonuç Ekranı'ndaki progressive loading için ortak component.
- **Kota Rozeti:** Ana Sayfa ve Profil'de kullanılan ortak "X/Y kullanıldı" gösterge component'i.
