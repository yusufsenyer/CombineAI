# Dolap & Kombin Asistanı — Proje Fikir Dokümanı (idea.md)

## 1. Özet

Kullanıcının dolabındaki kıyafetleri (t-shirt, pantolon, aksesuar vb.) dijital ortama taşıyan;
o gün giyime hazır (temiz/ütülü) parçalardan yapay zeka ile kombin önerileri üreten ve
premium kullanıcılarda bu kombinleri kullanıcının kendi fotoğrafı üzerinde (try-on) gösteren
bir mobil uygulama.

**Platform:** React Native, Expo Go ile test edilecek.

**Temel değer önerisi:** "Dolabımda ne var, bugün ne giyeyim?" sorusuna AI destekli, kişiselleştirilmiş cevap.

---

## 2. Kullanıcı Akışı

### 2.1 Onboarding (Zorunlu — herkes için, ücretsiz dahil)
- Kayıt/giriş sonrası kullanıcının karşılaştığı **ilk ekran** onboarding akışıdır, atlanamaz.
- İki yöntem birlikte kullanılır:
  - **Swipe (Tinder tarzı) kartlar:** Kıyafet/stil görselleri beğen/beğenme.
  - **Kısa soru-cevap:** Stil tercihleri, renk tercihleri, kullanım amacı (iş, günlük, spor vb.)
- Bu veri, AI'nin kombin önerilerini kişiselleştirmesi için kullanılır.
- Maliyet düşük (metin/LLM tabanlı), bu yüzden tüm kullanıcılara (free dahil) açıktır — hem
  adoption'ı artırır hem "AI beni tanıyor" hissini erken verir.

### 2.2 Dolap Yönetimi
- Kullanıcı kıyafet/aksesuar fotoğrafı yükler (kamera veya galeri).
- Otomatik arka plan silme ve kategori/renk etiketleme AI ile yapılır (MVP'de mock).
- Hız için ekstra onay adımı yoktur: etiketleme sonucu otomatik kaydedilir, kullanıcı isterse
  sonradan düzenler (kullanıcı hızlıca çok sayıda fotoğraf yükleyip bitirmek isteyeceği için
  akışı uzatmamak amaçlanmıştır).
- **Free kullanıcı:** İlk 5 parça ücretsiz, sonrası engellenir (upgrade CTA gösterilir).
- **Ücretli kullanıcılar (Plus & Pro):** Parça sayısında sınır yok.

### 2.3 Günlük Kombin Süreci
1. Kullanıcı dışarı çıkmadan önce, o gün **hazır olan** (temiz/ütülü) kıyafetleri işaretler.
2. AI, bu hazır parçalar + kullanıcının onboarding'de öğrenilen zevk profili ile kombin önerileri üretir.
3. Öneri **iki katmanlı** sunulur:
   - **Metin/liste bazlı öneri** (örn. "Bu tişört + şu pantolon + şu ayakkabı iyi gider") — hızlı, ucuz, anında gösterilir.
   - **Görselleştirme** — pakete göre farklılaşır (bkz. bölüm 3).

### 2.4 Görselleştirme Deneyimi (Loading/UX)
- Metin bazlı öneri anında gösterilir (kullanıcı beklemez).
- Görsel üretimi (özellikle try-on) arka planda kuyruğa alınır; kart bazlı
  skeleton/shimmer animasyonuyla progressive loading yapılır (Instagram/Pinterest tarzı —
  görseller sırayla hazır oldukça dolar).
- Birden fazla kombin istenirse ilk 1-2 kombin öncelikli işlenir, kalanı arkada devam eder.

---

## 3. Paket Yapısı (3 Paket)

| Özellik | **Free** | **Plus** (orta) | **Pro** (üst) |
|---|---|---|---|
| Dolaba kıyafet ekleme | İlk 5 parça | Sınırsız | Sınırsız |
| Zevk/tercih öğrenme (onboarding) | ✅ | ✅ | ✅ |
| Kombin önerisi (metin, AI) | Günde 3 çalıştırma, her çalıştırmada 2 kombin (günlük maks. 6 kombin) | Sınırsız çalıştırma, çalıştırma başına daha fazla kombin seçeneği | Sınırsız çalıştırma, çalıştırma başına en fazla kombin seçeneği |
| Görselleştirme | Seçilen kıyafet fotoğraflarının yan yana **collage**'ı; try-on kartı **blurlu + kilit ikonu** ile "Try-on için premium alın" mesajıyla gösterilir (tıklanınca paket ekranına yönlendirir) | **Try-on** görseli (kullanıcının kendi fotoğrafı üzerinde), aylık kota (ör. 20/ay) | **Try-on** görseli, **sınırsız** |
| Depolama sınırı | Free limiti ile doğal olarak sınırlı | Sınırsız | Sınırsız |

**Neden bu ayrım mantıklı:**
- En maliyetli işlem (AI ile görsel try-on üretimi) sadece ücretli kullanıcılarda çalışır.
- Free kullanıcı da "AI kombin mantığını" tam olarak deneyimler (metin öneri + görsel referans
  olarak collage), sadece "kendi üstünde görme" özelliğinden mahrumdur — bu da upgrade
  motivasyonunu net bir şekilde ortaya koyar.
- Plus → Pro geçişi tek değişkenle (try-on kotası: sınırlı vs sınırsız) basit ve anlaşılır.

---

## 4. AI Maliyet Optimizasyon Stratejisi

Uygulamanın en büyük maliyet riski AI görsel üretimi (try-on) olduğu için:

1. **Kombin önerisi (eşleştirme mantığı)** ucuz, metin/LLM tabanlı bir süreçtir; tüm kullanıcılarda çalışır.
2. **Görsel üretim** sadece ücretli kullanıcılarda tetiklenir:
   - Free: AI görsel üretimi yok, sadece mevcut kıyafet fotoğraflarının statik collage'ı (basit image processing, tek seferlik/ucuz).
   - Ücretli: Gerçek try-on görseli AI ile üretilir.
3. **Cache mekanizması:** Aynı kombinasyon (aynı kıyafetler) tekrar istenirse görsel yeniden üretilmez, cache'den sunulur.
4. **Kota sistemi:** Free'de günlük 3 metin öneri limiti, Plus'ta aylık try-on kotası — kontrolsüz maliyet artışı engellenir.
5. **Kademeli işleme:** Kullanıcı birden fazla kombin isterse, sadece ilk birkaçı öncelikli/anında işlenir.
6. **AI görsel model seçimi:** MVP aşamasında tamamen **mock** çalışacak. Gerçek try-on
   modeli/sağlayıcısı, MVP sonrası ücret/performans araştırması yapılarak seçilecek.

---

## 5. Ödeme Sistemi

- **MVP aşaması:** Mock ödeme akışı — gerçek bir satın alma deneyimini taklit eden **tam ekran**
  bir ödeme sayfası (kart numarası/son kullanma/CVV mock form alanları, hiçbir alan gerçek
  doğrulama yapmaz). "Öde" butonuna basılınca sadece bir **alert ile "Ödeme alındı"** mesajı
  gösterilir, gerçek para hareketi/entegrasyon yoktur. Paket kota/limitleri gerçek mantıkla
  güncellenir.
- **Sonraki faz:** E-fatura ve sanal POS entegrasyonu (gerçek sağlayıcı seçimi ileride yapılacak).
- Kullanım kotaları (günlük öneri sayacı, aylık try-on sayacı) MVP'de gerçek mantıkla
  çalışmalı ki ödeme entegrasyonu sonradan "takılabilir" olsun.

---

## 6. Teknik Mimari

### 6.1 Genel Yaklaşım
- **Frontend:** React Native, Expo Go ile geliştirme/test.
- **Backend:** Ruby on Rails — **API-only mode** (`rails new --api`). Rails, frontend'e
  sadece JSON API sağlayan bir servis katmanı olarak kullanılacak (view/asset pipeline yok).
- **Neden bu ayrım tercih edildi:**
  - **Güvenlik:** Auth, ödeme/kota mantığı, AI servis çağrıları (API key'ler dahil) tamamen
    backend'de kalır; mobil istemci hassas bilgiye/işleme doğrudan erişmez.
  - **Ağır AI yükleri:** Görsel üretim (try-on), kuyruk yönetimi, cache, rate-limiting gibi
    ağır/yavaş işler backend'de (background job — Sidekiq/ActiveJob vb.) yürütülür; mobil
    cihaz sadece sonucu gösterir, işlem yükü taşımaz.
  - Rails'in olgun ekosistemi (Devise/JWT auth, ActiveJob, Action Cable, ActiveStorage)
    kimlik doğrulama, dosya yükleme (kıyafet fotoğrafları) ve kuyruk/bildirim ihtiyaçlarını
    hızlı karşılar.

### 6.2 İletişim Modeli
- **REST API** (JSON) — mobil uygulama ile Rails backend arası.
- Ağır/yavaş işlemler (try-on görsel üretimi) **asenkron** çalışır:
  1. Mobil, işlem başlatma isteği atar → Rails hemen bir `job_id`/`request_id` döner.
  2. Backend arka planda (job queue) AI servisini çağırır, sonucu işler, cache'ler.
  3. Mobil, polling veya push notification/websocket (Action Cable) ile sonucu alır.
- Bu model, bölüm 2.4'te tarif edilen progressive loading / "hazır olunca göster" UX'iyle
  birebir örtüşür.

### 6.3 Bileşenler
- **AI bileşenleri (MVP'de mock, sonrasında gerçek entegrasyon):**
  - Arka plan silme / otomatik etiketleme (kıyafet yükleme sırasında)
  - Kombin öneri motoru (metin bazlı, kullanıcı zevk profiliyle kişiselleştirilmiş)
  - Try-on görsel üretimi (sadece ücretli kullanıcılar)
  - Tüm AI çağrıları backend üzerinden yapılır; API key'ler ve sağlayıcı seçimi client'a hiç görünmez.
- **Ödeme:** Mock → ileride e-fatura + sanal POS. Ödeme mantığı ve webhook'lar backend'de.
- **Kota/limit yönetimi:** Backend tarafında sayaç mantığı (günlük reset: öneri sayacı,
  aylık reset: try-on sayacı) MVP'de gerçek olarak kurulmalı; kullanıcı client tarafından
  bu sayaçları manipüle edemez.
- **Kimlik doğrulama:** Backend'de token bazlı (JWT) auth; mobil tarafta token secure storage'da saklanır.
- **Dosya depolama:** Kıyafet fotoğrafları ve üretilen görseller Rails ActiveStorage üzerinden
  bir object storage'a (ör. S3 uyumlu) yüklenir; mobil doğrudan storage'a değil, backend
  üzerinden erişir.

---

## 7. Ekran Ekran UI Akışı (Navigasyon İskeleti)

```
[Splash] → token kontrolü
   → varsa & onboarding tamam        → [Ana Sayfa]
   → yoksa                           → [Auth]
      → giriş başarılı & onboarding eksik → [Onboarding]
      → giriş başarılı & onboarding tamam → [Ana Sayfa]
```

**Bottom Tab (4 sekme):** Ana Sayfa / Dolabım / Kombinler / Profil
*(Not: Uygulama büyürse eklenebilecek 5. sekme — kombin paylaşımı için sosyal
akış — şimdilik kapsam dışı, bkz. bölüm 8.)*

1. **Splash** — token kontrolü, yönlendirme.
2. **Auth (Login/Register)**
3. **Onboarding** *(zorunlu, atlanamaz, ilk girişte)*
   - Adım A: Kısa soru-cevap (stil/kullanım amacı tercihleri)
   - Adım B: Swipe kartlar (beğen/beğenme)
   - Bitince → Ana Sayfa
4. **Ana Sayfa**
   - "Bugün Ne Giyeyim?" CTA
   - Hızlı kamera kısayolu (Dolabım dışından da kıyafet eklenebilir)
   - Kalan kota göstergesi (free: bugün X/3 çalıştırma hakkı)
   - Son üretilen kombine hızlı erişim
5. **Hazır Kıyafet Seçimi** — dolaptaki parçalar grid, multi-select ("bugün temiz/hazır"), "Kombin Oluştur" ile devam
6. **Kombin Sonuç Ekranı**
   - Metin öneriler anında listelenir
   - Free: 2 kombin kartı üretilir; her kartta görsel alanı **collage**; try-on kartı
     **blurlu + kilit ikonu + "Try-on için premium alın"** mesajıyla gösterilir, tıklanınca
     Paket Karşılaştırma ekranına yönlendirir
   - Ücretli: daha fazla kombin seçeneği, gerçek try-on görseli (skeleton/shimmer ile
     progressive loading)
   - Free günlük 3 çalıştırma hakkı dolunca CTA ile upgrade'e yönlendirilir
7. **Dolabım (tab)**
   - Grid görünüm, kategori filtresi
   - "+" → kamera/galeri seç → önizleme → oto etiketleme sonucu **otomatik kaydedilir**
     (onay adımı yok, kullanıcı sonradan düzenleyebilir)
   - Free 5 parça limiti dolunca "+" upgrade modalı açar
8. **Kombinler (tab)** — geçmiş kombin listesi (tarih sıralı), detay görüntüleme
9. **Profil (tab)**
   - Mevcut paket, kullanım sayaçları (öneri: X/3 bugün, try-on: X/kota bu ay)
   - "Paketi Yükselt" → Paket Karşılaştırma
10. **Paket Karşılaştırma Ekranı** — 3 paket karşılaştırma tablosu, paket seçimi → Mock Ödeme
11. **Mock Ödeme Ekranı** — tam ekran, mock kart formu, "Öde" → alert "Ödeme alındı" → paket
    güncellenir → Profil'e dönüş

---

## 8. Geliştirme Fazları

### Faz 1 — MVP (Mock AI + Mock Ödeme, uçtan uca çalışan akış)
1. Proje iskeleti: Expo Go projesi, navigasyon yapısı (auth, onboarding, dolap, kombin, profil/paket ekranları), state yönetimi.
2. Auth + zorunlu onboarding akışı (swipe kartlar + soru-cevap ile zevk profili oluşturma).
3. Dolap yönetimi: kıyafet ekleme (kamera/galeri), mock AI ile kategori/renk etiketleme, free'de 5 parça sınırı.
4. Günlük "hazır kıyafetler" seçim ekranı.
5. AI kombin önerisi (metin bazlı, mock): free'de günde 3 limit.
6. Görselleştirme: Free'de collage, Premium'da mock try-on (placeholder ile simülasyon).
7. Paket sistemi + mock ödeme: 3 paket gösterimi, upgrade akışı, kullanım kotası takibi (sayaç + reset mantığı).

### Faz 2 — Gerçek Servis Entegrasyonları
8. Gerçek AI try-on modeli entegrasyonu (ücret/performans araştırması sonrası seçilecek sağlayıcı).
9. Gerçek ödeme altyapısı: e-fatura + sanal POS entegrasyonu.

### Faz 3 — Genişletme / Ek Özellikler
10. Bildirim sistemi (try-on görseli hazır olduğunda kullanıcıya haber verme).
11. Pro pakete özel ek özellikler (örn. hava durumuna göre öneri, etkinlik bazlı kombin, gardolap kullanım analitiği).
12. Performans ve maliyet optimizasyonları (cache genişletme, model seçimi iyileştirme).

---

## 9. Açık Kalan / İleride Netleştirilecek Konular

- Fiyatlandırma (TL/ay tutarları) — henüz belirlenmedi, ayrı bir oturumda konuşulacak.
- Try-on için kullanılacak AI görsel sağlayıcısı — kullanıcı tarafından ücret/performans araştırması yapılacak.
- E-fatura / sanal POS sağlayıcı seçimi — MVP sonrası.
- **(Uzak gelecek fikri, şu anki fazlarda yok)** Uygulama büyük bir kullanıcı kitlesine
  ulaşırsa, kullanıcıların kombinlerini paylaşabileceği sosyal medya benzeri bir 5. sekme
  eklenmesi değerlendirilebilir.
