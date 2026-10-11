# FAZ.md — Geliştirme Fazları ve Görev Kırılımı

Bu doküman, `idea.md` ve `SCREENS.md`'de netleşen kapsamı, Codex'in (veya herhangi bir
geliştiricinin) sırayla işleyebileceği somut görevlere böler. Her görev bağımsız olarak
tamamlanabilir ve test edilebilir olacak şekilde tasarlanmıştır.

**Genel prensip:** Her görev, "backend endpoint + mobil ekran" çiftini birlikte teslim eder
ki uçtan uca test her adımda mümkün olsun. Test CLI komutları (npm/rspec script'leri) ayrı
bir aşamada, uygulama tamamlandıktan sonra her işlev için tek tek hazırlanacaktır (bkz. not).

---

## FAZ 1 — MVP (Mock AI + Mock Ödeme)

### Epic 0: Proje İskeleti
- **0.1** Rails API-only projesi kurulumu (`rails new backend --api`), temel gem'ler (JWT auth, ActiveStorage, background job — Sidekiq veya Solid Queue), CORS ayarı.
- **0.2** Expo (React Native) projesi kurulumu, navigasyon kütüphanesi (React Navigation), klasör yapısı (screens, components, api client, state yönetimi).
- **0.3** Ortak API client katmanı (mobil): base URL, token interceptor, hata yönetimi standardı.
- **0.4** Backend: kullanıcı modeli (`User`), JWT auth altyapısı (register/login/logout/me).

**Kabul kriteri:** Boş bir ekrandan `POST /api/v1/auth/register` ile kayıt olup `GET /api/v1/me` çağrısı token ile başarılı dönüyor.

---

### Epic 1: Auth + Onboarding
- **1.1** Backend: `OnboardingQuestion`, `OnboardingAnswer`, `SwipeCard`, `SwipeResponse` modelleri + `GET /onboarding/questions`, `GET /onboarding/swipe_cards`, `POST /onboarding/complete` endpoint'leri.
- **1.2** Mobil: Auth ekranı (Login/Register) — SCREENS.md bölüm 1.
- **1.3** Mobil: Onboarding soru-cevap ekranı — SCREENS.md bölüm 2A.
- **1.4** Mobil: Onboarding swipe kart ekranı — SCREENS.md bölüm 2B.
- **1.5** Onboarding tamamlanınca `onboarding_completed` flag güncelleme + Ana Sayfa'ya yönlendirme; Splash ekranındaki yönlendirme mantığının auth/onboarding state'ine göre çalıştığının doğrulanması.

**Kabul kriteri:** Yeni kullanıcı kayıt olur → onboarding'i atlayamaz → tamamlayınca Ana Sayfa'ya düşer → uygulamayı kapatıp açtığında tekrar Ana Sayfa'ya düşer (Splash mantığı çalışıyor).

---

### Epic 2: Dolap Yönetimi
- **2.1** Backend: `WardrobeItem` modeli (category, color, image, user_id), `POST/GET/PATCH/DELETE /wardrobe/items`.
- **2.2** Backend: Mock oto-etiketleme servisi — yüklenen görsele **sabit/rastgele mock kategori-renk** atayan bir servis sınıfı (gerçek AI çağrısı yerine geçecek arayüzle, bkz. Epic 6 mock interface notu).
- **2.3** Backend: Free kullanıcı için 5 parça limiti kontrolü (item oluşturmada validasyon, limit dolunca 422 + anlamlı hata kodu döner).
- **2.4** Mobil: Dolabım tab ekranı (grid, kategori filtre) — SCREENS.md bölüm 6.
- **2.5** Mobil: Kıyafet ekleme akışı (kamera/galeri, önizleme, upload, otomatik kayıt, onay adımı yok) — SCREENS.md bölüm 6A.
- **2.6** Mobil: Limit dolunca upgrade modalının tetiklenmesi (ortak component, bkz. SCREENS.md "Ortak Bileşenler").
- **2.7** Mobil: Ana Sayfa'daki hızlı kamera kısayolunun aynı ekleme akışını tetiklemesi.

**Kabul kriteri:** Free kullanıcı 5 parça ekleyebilir, 6.'da upgrade modalı görür; parça kartına girip kategori/rengi düzenleyebilir.

---

### Epic 3: Günlük Kombin Süreci (Metin Bazlı Öneri)
- **3.1** Backend: `Outfit`, `OutfitGenerationJob` modelleri; `POST /outfits/generate` (item_ids alır, job oluşturur, background job'a atar).
- **3.2** Backend: Mock kombin öneri motoru — seçilen parçalardan basit kural bazlı (ör. renk/kategori eşleştirme) veya sabit mock metin üreten servis sınıfı; free'de 2, ücretlide daha fazla kombin üretir.
- **3.3** Backend: Free kullanıcı için günlük 3 çalıştırma limiti (job oluşturmada kontrol, UTC bazlı günlük reset — reset zaman dilimi kararı: basitlik için UTC gece yarısı kullanılacak).
- **3.4** Backend: `GET /outfits/jobs/:job_id` polling endpoint'i (status: pending/partial/complete/error).
- **3.5** Mobil: Hazır Kıyafet Seçimi ekranı — SCREENS.md bölüm 4.
- **3.6** Mobil: Kombin Sonuç Ekranı — metin önerilerin gösterimi, polling entegrasyonu, kart bazlı state yönetimi — SCREENS.md bölüm 5.
- **3.7** Mobil: Ana Sayfa'daki günlük kota göstergesinin gerçek veriyle çalışması.

**Kabul kriteri:** Kullanıcı hazır kıyafetleri seçip "Kombin Oluştur" dediğinde metin öneriler ekranda görünür; free kullanıcı günde 3 çalıştırmadan sonra engellenir.

---

### Epic 4: Görselleştirme (Collage / Try-on Kilidi)
- **4.1** Backend: Free kullanıcı için collage üretimi — seçilen parça görsellerini basitçe yan yana birleştiren image processing servisi (AI değil, deterministik).
- **4.2** Backend: Ücretli kullanıcı için mock try-on görseli — sabit bir placeholder görsel döndüren mock servis (gerçek AI'nin yerini tutan arayüz, bkz. Epic 6).
- **4.3** Backend: Aylık try-on kotası kontrolü (Plus: 20/ay, Pro: sınırsız) — job oluşturmada kontrol.
- **4.4** Backend: Cache mekanizması — aynı `item_ids` kombinasyonu için görsel tekrar üretilmez, mevcut kayıt döner.
- **4.5** Mobil: Kombin kartında görsel state'lerinin (skeleton → collage/try-on/locked) doğru yönetimi.
- **4.6** Mobil: `visual_locked` durumunda blur + kilit ikonu + "Try-on için premium alın" CTA'sının Paket Karşılaştırma'ya yönlendirmesi.

**Kabul kriteri:** Free kullanıcı kombin kartında collage görür + try-on kartı kilitli görünür; Plus/Pro kullanıcı mock try-on görselini görür; aynı kombinasyon tekrar istenince görsel cache'den anında gelir.

---

### Epic 5: Kombinler Geçmişi + Profil
- **5.1** Backend: `GET /outfits`, `GET /outfits/:id` (geçmiş listesi).
- **5.2** Backend: `GET /me/usage` (günlük/aylık sayaç özeti).
- **5.3** Mobil: Kombinler tab ekranı — SCREENS.md bölüm 7.
- **5.4** Mobil: Profil tab ekranı — SCREENS.md bölüm 8.

**Kabul kriteri:** Kullanıcı geçmiş kombinlerini listeleyip detayına girebilir; Profil'de güncel kullanım sayaçlarını görür.

---

### Epic 6: Paket Sistemi + Mock Ödeme
- **6.1** Backend: `Package`, `Subscription` modelleri; `GET /packages`, `POST /subscriptions` (mock — her zaman başarılı, `user.package`'ı günceller).
- **6.2** **Mock/gerçek servis arayüz standardı:** Tüm mock servisler (oto-etiketleme, kombin öneri, try-on görsel üretimi, ödeme) ortak bir interface/adapter pattern ile yazılır (ör. `AiTaggingService`, `OutfitSuggestionService`, `TryOnService`, `PaymentService` — her biri tek bir public metoda sahip, Faz 2'de sadece implementasyon sınıfı değişecek, çağıran kod değişmeyecek).
- **6.3** Mobil: Paket Karşılaştırma ekranı — SCREENS.md bölüm 9.
- **6.4** Mobil: Mock Ödeme ekranı (tam ekran, mock form, `Alert.alert("Ödeme alındı")`) — SCREENS.md bölüm 10.
- **6.5** Mobil: Ödeme sonrası paket güncellemesinin Profil ve kota göstergelerine yansıması.

**Kabul kriteri:** Kullanıcı paket seçip mock ödeme ekranından "Öde"ye bastığında alert görür, Profil'de paketi güncellenmiş olarak görünür, ilgili limitler (dolap/kombin/try-on) yeni pakete göre çalışır.

---

## FAZ 2 — Gerçek Servis Entegrasyonları

- **2.1** Try-on AI sağlayıcısı seçimi (ücret/performans araştırması sonrası) ve `TryOnService` implementasyonunun mock'tan gerçek servise çevrilmesi (Epic 6.2'deki adapter sayesinde çağıran kod değişmez).
- **2.2** Oto-etiketleme ve kombin öneri motorunun gerçek AI/LLM servisine bağlanması (aynı adapter pattern).
- **2.3** E-fatura ve sanal POS entegrasyonu — `PaymentService` adapter'ının gerçek sağlayıcıya bağlanması, webhook yönetimi.
- **2.4** Gerçek AI çağrılarının maliyet/performans izlemesi (loglama, rate-limit ayarları).

---

## FAZ 3 — Genişletme / Ek Özellikler

- **3.1** Bildirim sistemi (push notification) — try-on görseli hazır olduğunda kullanıcıya haber verme.
- **3.2** Pro pakete özel ek özellikler: hava durumuna göre öneri, etkinlik bazlı kombin, gardolap kullanım analitiği.
- **3.3** Performans/maliyet optimizasyonları: cache stratejisinin genişletilmesi, model/sağlayıcı iyileştirme.
- **3.4** *(Uzak gelecek, ayrı değerlendirme)* Kombin paylaşımı için sosyal medya benzeri 5. sekme.

---

## Test Stratejisi Notu

Uygulama (Faz 1 kapsamı) tamamlandıktan sonra, her işlev için ayrı ayrı **test CLI
komutları** (backend: `rspec` senaryoları, mobil: `npm test` / Jest senaryoları) hazırlanacaktır.
Bu doküman kapsamında değildir; ayrı bir `TESTS.md` veya doğrudan test dosyaları olarak
geliştirme tamamlandıktan sonra ele alınacaktır.
