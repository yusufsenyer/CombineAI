# TEST_REPORT.md — Faz 1: Fotoğraf Yükleme Akışı + Backend Sağlık Raporu

> Bu rapor yalnızca **test** amaçlıdır. Hiçbir kaynak dosya değiştirilmedi; sadece bu dosya (`TEST_REPORT.md`) oluşturuldu.

## 0. Test Ortamı

| Alan | Değer |
|---|---|
| Tarih | 2026-10-11 |
| LAN IP (telefonun kullandığı) | `192.168.1.48:3000` |
| Frontend `EXPO_PUBLIC_API_URL` | `http://192.168.1.48:3000` (`Frontend/.env`) |
| Backend komutu | `bin/rails s -b 0.0.0.0 -p 3000` |
| Test veritabanı | `combineai_development` (yalnızca bu; başka DB'ye dokunulmadı) |
| Ruby / Rails | 3.4.3 / 8.1.4 |
| Tüm istekler | `curl` ile **LAN IP** üzerinden (localhost DEĞİL) |

> Not: Ortamda bir **artık puma süreci** (`pid 816687`) `127.0.0.1:3000`'e bağlı olarak bulundu; LAN IP'ye ulaşılamıyordu. Test öncesi bu süreç sonlandırılıp backend `-b 0.0.0.0` ile yeniden başlatıldı. Detay: **Bulgu #2**.

---

## 1. Özet

- **Toplam kontrol:** ~52
- **Geçen:** ~45
- **Kalan / şüpheli:** 6 (1 kritik, 2 orta, 3 düşük) + 2 not

**En kritik bulgu:** iOS'ta galeriden seçilen HEIC fotoğraflar backend'de **422** ile reddediliyor (`content_type` whitelist'i JPEG/PNG/WebP ile sınırlı). expo-image-picker 57.x, iOS'ta HEIC'i **JPEG'e çevirmeden** ham olarak döndürüyor (native kaynak doğrulaması aşağıda). Bu, telefondaki yükleme hatasının en güçlü açıklamasıdır.

---

## 2. Başarısız / Şüpheli Bulgular

### 🔴 Bulgu #1 — iOS HEIC görseller yüklenemiyor (KRİTİK — kök neden adayı #1)

**Ne denendi:** Gerçek HEIC imza baytlarına sahip bir görsel (`ftyp`/`heic`) multipart ile yüklendi:
```bash
curl -X POST http://192.168.1.48:3000/api/v1/wardrobe/items \
  -H "Authorization: Bearer $TOKEN" \
  -F "image=@real.heic;type=image/heic;filename=IMG_0001.HEIC"
```
**Beklenen:** Görsel kabul edilmeli (iOS'un varsayılan fotoğraf formatı HEIC'tir).
**Gerçek:**
```json
{"error":{"code":"validation_error","message":"Image yalnızca JPEG/PNG/WebP olabilir"}}
```
HTTP **422**.

**Ek kanıt — dosya adı/declared type değil, içerik belirleyici:**
- JPEG baytları içeren ama `.heic` adlı + `type=image/heic` gönderilen dosya → **201** (Marcel içeriği JPEG olarak algıladı, blob `content_type=image/jpeg`).
- Yani doğrulama **magic bytes** üzerinden çalışıyor; gerçek HEIC içeriği her koşulda reddediliyor.

**Kök neden (frontend native kaynağıyla doğrulandı):**
`Frontend/node_modules/expo-image-picker/ios/ImageUtils.swift` (satır 114–159), galeri (PHPicker) yavaş yolunda:
```swift
case UTType.heic.identifier:
  return (rawData, ".heic")      // <-- ham HEIC, JPEG'e çevrilmiyor
default:
  if options.quality >= 1.0 { return (rawData, ".jpg") }
  let data = image.jpegData(compressionQuality: options.quality)
  return (data, ".jpg")
```
`quality: 0.8` "fast path"i kapatır (`MediaHandler.swift:129-131`: fast path yalnızca `quality >= 1` iken), ama yine de **HEIC dalı ham HEIC döndürür**. Kamera yolu (UIImagePickerController) ise `default` dalına düşüp **JPEG** üretir.
Ayrıca `CHANGELOG.md` (17.0.0, 2025-08-13): *"The default for `preferredAssetRepresentationMode` is now `.current` instead of `.automatic`. This keeps the asset in its original container/codec (e.g. HEIC instead of JPEG)."*

**Sonuç:** iOS'ta **kamera → JPEG (çalışır)**, **galeri (HEIC fotoğraf) → HEIC (422, çalışmaz)**. iPhone kamerası fotoğrafları varsayılan olarak HEIC kaydettiği için, galeriden seçilen "yeni çekilmiş" kıyafet fotoğrafı bile HEIC olur.

**Önerilen düzeltme (biri yeterli, ilki önerilir):**
1. **Frontend (önerilen):** Seçim sonrası görseli JPEG'e çevir — `expo-image-manipulator` ile `manipulateAsync(uri, [], { compress: 0.8, format: SaveFormat.JPEG })`, sonra o JPEG'i yükle. Alternatif olarak `ImagePicker.launchImageLibraryAsync({ preferredAssetRepresentationMode: ImagePicker.UIImagePickerPreferredAssetRepresentationMode.Automatic, ... })` verilebilir (item provider'ın JPEG representation sunmasını sağlar). `WardrobeItem` doğrulaması değişmez, depolama homojen kalır ve Faz 2 görsel işleme (collage/try-on) JPEG beklediği için güvenli olur.
2. **Backend (alternatif/tamamlayıcı):** `WardrobeItem::ALLOWED_CONTENT_TYPES` listesine `image/heic` ve `image/heif` ekle. Hızlı çözüm; ancak Faz 2'de gerçek görsel işleme HEIC'i desteklemeyebilir.

**Önem:** Kritik

---

### 🔴 Bulgu #2 — Backend `localhost`'a bağlıysa telefon hiçbir isteği yapamaz (KRİTİK — ortam)

**Ne denendi:** Backend'i `-b 0.0.0.0` ile başlatmadan önce ortam incelendi.
**Gerçek:**
```
$ ss -ltnp | grep :3000
LISTEN 0 1024 127.0.0.1:3000 0.0.0.0:* users:(("ruby",pid=816687,fd=6))
LISTEN 0 1024     [::1]:3000     [::]:* users:(("ruby",pid=816687,fd=7))
```
Bu süreçte LAN IP erişilemezdi:
```bash
$ curl -s -o /dev/null -w "%{http_code}\n" http://192.168.1.48:3000/up
000          # bağlantı kurulamadı (curl exit 7)
```
Süreç öldürülüp `bin/rails s -b 0.0.0.0` ile yeniden başlatılınca:
```
LISTEN 0 1024 0.0.0.0:3000 0.0.0.0:* users:(("ruby",pid=821143,fd=6))
$ curl -s -o /dev/null -w "%{http_code}\n" http://192.168.1.48:3000/up
200
```
**Beklenen:** Backend `0.0.0.0`'a bağlı olmalı; aksi halde telefon (localhost'a ulaşamaz) hiçbir endpoint'e erişemez.
**Gerçek:** `127.0.0.1`'e bağlı bir süreçte LAN IP tamamen erişilemez.
**Olası kök neden:** Backend bazen `-b 0.0.0.0` olmadan (`bin/rails s`) başlatılmış. Token önbellekte olduğu için uygulama açılıp ana ekranı gösterir, ama **yeni** istekler (yükleme dahil) ağ hatasıyla düşer — kullanıcı bunu "yükleme çalışmıyor" olarak algılar.
**Önerilen düzeltme:** Backend'i her zaman `bin/rails s -b 0.0.0.0` ile çalıştır (README'ye yaz); mümkünse `config/puma.rb`'de `bind "tcp://0.0.0.0:3000"` sabitle. Telefonda hata "Yükleme başarısız oldu." (generic) yerine ağ hatası olarak ayırt edilebilir olmalı.
**Önem:** Kritik (ortam/kurulum)

---

### 🟠 Bulgu #3 — Multipart isteğe `Content-Type: application/json` eklenirse 400 döner (ORTA — istemci riski)

**Ne denendi (istemcideki sık hata simülasyonu):**
```bash
curl -X POST http://192.168.1.48:3000/api/v1/wardrobe/items \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -F "image=@photo.jpg;type=image/jpeg;filename=photo.jpg"
```
**Beklenen:** İstek multipart/form-data olarak işlenmeli.
**Gerçek:** HTTP **400** + Rails debug gövdesi (standart hata formatı **değil**):
```json
{"status":400,"error":"Bad Request","exception":"#<ActionDispatch::Http::Parameters::ParseError: Error occurred while parsing request parameters>","traces":{...}}
```
Rails log karşılığı:
```
ActionDispatch::Http::Parameters::ParseError (Error occurred while parsing request parameters)
Caused by: JSON::ParserError (invalid number: '--------------------------djTzaL' at line 1 column 1)
app/controllers/api/v1/wardrobe_items_controller.rb:20:in 'Api::V1::WardrobeItemsController#create'
```
**Kök neden:** İstemci multipart gövdeye elle `application/json` Content-Type eklediğinde Rails gövdeyi JSON sanıp parse eder; sınır (boundary) string'i JSON sayı olarak okunur ve patlar.
**İstemci kod incelemesi (Test 2):** `Frontend/src/api/client.ts:37-41` bunu **doğru** şekilde ele alıyor (`isFormData` ise Content-Type set edilmiyor). Yani mevcut kodda bu hata **yok**; ancak `fetch` çağrısında başka bir katman/ileride eklenen bir header bunu bozarsa sessiz 400 üretir.
**Önerilen düzeltme:** Mevcut davranışı koru (FormData'da Content-Type set etme). Backend'de opsiyonel olarak `ActionDispatch::Http::Parameters::ParseError` için `rescue_from` ile standart `{error:{code,message}}` formatında 400 dön (istemciye anlamlı mesaj).
**Önem:** Orta (potansiyel; mevcut kodda tetiklenmiyor)

---

### 🟠 Bulgu #4 — Bozuk/boş içerik `.jpg` adıyla kabul ediliyor (ORTA — zayıf içerik doğrulaması)

**Ne denendi:** Rastgele baytlar ve 0 baytlık boş dosya `.jpg` adıyla yüklendi.
**Beklenen:** Görsel olmayan içerik reddedilmeli.
**Gerçek:** Her ikisi de **201** (kabul):
```json
{"id":19,"category":"shoes","color":"yeşil",...,"tagging_status":"done"}     // rastgele 2KB, ad: corrupt.jpg
{"id":20,"category":"bottom","color":"gri",...,"tagging_status":"done"}      // 0 bayt, ad: empty.jpg
```
**Kök neden:** Marcel, tanınmayan içerikte dosya adı uzantısına (`.jpg`) düşüyor → `content_type=image/jpeg`. Boş içerik de kabul ediliyor.
**Önerilen düzeltme:** Blob doğrulamasına minimum boyut (`byte_size > 0`) ve mümkünse gerçek magic-byte kontrolü ekle; "boş/geçersiz görsel" için anlamlı 422 döndür. (MVP mock etiketleme içeriği okumadığı için şu an görünür bir etkisi yok, ama kötü niyetli/hatalı girdi kabul ediliyor.)
**Önem:** Orta

---

### 🟡 Bulgu #5 — Dosya adı sağlanmazsa `missing_image` (DÜŞÜK — istemci her zaman ad gönderiyor)

**Ne denendi:** `filename` boş bırakılarak multipart gönderildi.
**Gerçek:** HTTP **422** `{"error":{"code":"missing_image","message":"Görsel yüklenmedi."}}`. Rack, boş `filename`li part'ı dosya değil normal alan sayıyor; `params[:image]` boş kalıyor.
**İstemci kod incelemesi:** `AddItemScreen.tsx:46` `fileName ?? 'photo-<ts>.jpg'` fallback uyguluyor, `api/index.ts` `name` alanını her zaman gönderiyor → pratikte bu yol tetiklenmiyor.
**Önerilen düzeltme:** Yok (bilgi amaçlı). Yine de `missing_image` mesajı istemcide anlamlı gösteriliyor — iyi.
**Önem:** Düşük

---

### 🟡 Bulgu #6 — `GET /wardrobe/items/:id` yok; routing 404 standart formatta değil (DÜŞÜK)

**Ne denendi:** Yükleme sonrası tek parçayı çekmek için `GET /api/v1/wardrobe/items/1`.
**Gerçek:** HTTP **404** + Rails debug gövdesi (`{"status":404,"error":"Not Found","exception":"#<ActionController::RoutingError..."}`), standart `{error:{code,message}}` **değil**.
Karşılaştırma: `GET /outfits/999999` → **doğru** format `{"error":{"code":"not_found","message":"Kaynak bulunamadı."}}`.
**Kök neden:** Wardrobe için `show` route'u tanımlı değil (ARCHITECTURE'da da yok) → `RoutingError` fırlıyor ve uygulama seviyesindeki `rescue_from` yakalamıyor.
**Önerilen düzeltme:** İstemci tek parçayı `GET /wardrobe/items` listesinden alıyor; endpoint gerekmiyorsa sorun yok. Gerekirse `show` ekle ya da `ActionController::RoutingError` için global `rescue_from` ile standart 404 dön.
**Önem:** Düşük

---

### 🟡 Bulgu #7 — `tagging_status` senkron ilerliyor (not)

**Ne denendi:** `POST /wardrobe/items` sonrası `tagging_status` geçişi izlendi.
**Gerçek:** CREATE yanıtı doğrudan `"tagging_status":"done"` dönüyor; arada `processing` durumu **hiç görünmüyor** (mock etiketleme senkron çalışıyor). SCREENS.md 6A "arka planda oto etiketleme" ve ARCHITECTURE.md "mock etiketleme **job'ı** tetikler" derken asenkron bir akış ima ediyor.
**Etki:** İşlevsel bir hata değil (kullanıcı akışı "onay adımı yok, otomatik kaydedilir" ile uyumlu); yalnızca doküman/uygulama arasında küçük bir tasarım farkı.
**Önerilen düzeltme:** Faz 2'de gerçek AI gecikme getireceği için etiketlemeyi Solid Queue job'ına taşıyıp istemcide `processing → done` durumunu göstermek (şu an gerekmez).
**Önem:** Düşük (not)

---

### 🟡 Bulgu #8 — İzin/kamera reddi sessiz; ağ hatası mesajı generic (DÜŞÜK — UX)

**Kod incelemesi:**
- `AddItemScreen.pick()` `launchCameraAsync`/`launchImageLibraryAsync` çağırıyor. Bu fonksiyonlar izni **otomatik ister** (Expo Go Info.plist'inde açıklamalar mevcut, bu yüzden Expo Go'da izin diyaloğu çıkar).
- Ancak izin reddedilir veya kullanıcı iptal ederse `result.canceled === true` olur ve kod **hiçbir geri bildirim göstermez** (ekran aynı kalır). Kullanıcı "butona bastım, hiçbir şey olmadı" hisseder.
- Ağ hatalarında (Bulgu #2) `apiFetch` fırlatılan `TypeError`'ı `ApiError`'a çevirmez; `AddItemScreen` `instanceof ApiError` false olduğu için generic `"Yükleme başarısız oldu."` gösterir. Hata **sessizce yutulmuyor** (mesaj var) ama ayırt edici değil.
**Önerilen düzeltme:** İzin reddi/iptal için kısa bir uyarı göster; ağ hatalarını `ApiError(code:'network_error')` olarak normalize edip "Sunucuya ulaşılamıyor, ağı kontrol et" mesajı ver.
**Önem:** Düşük

---

### Ek doğrulamalar (bulgu değil, teyit)
- **10MB üstü dosya → 422** (`"Image 10MB'dan küçük olmalı"`) — beklenen davranış. Not: modern telefon fotoğrafları 10MB'ı aşabilir; istemci `quality: 0.8` ile sıkıştırmasa HEIC/JPEG'de bu sınıra takılabilir.
- **`image_url` sunumu doğru:** API göreli yol (`/rails/active_storage/blobs/redirect/...`) döndürüyor; **LAN IP ile** `curl -I` → `302` ve `location: http://192.168.1.48:3000/rails/active_storage/disk/...` (istek host'una göre üretiliyor), redirect takip edilince `200`, `image/jpeg`, 3829 bayt indirildi. Yani görsel LAN üzerinden **indirilebiliyor**.
- **Auth hataları:** token yok / geçersiz / süresi dolmuş → hepsi `401` + `{"error":{"code":"unauthorized","message":"Geçersiz veya süresi dolmuş token."}}`.
- **CORS:** Preflight `OPTIONS` → `access-control-allow-origin: *` (native istemci CORS uygulamaz; Expo Web için geçerli).

---

## 3. "Telefonda yükleme neden çalışmıyor olabilir?" — Olasılık Sırası

> **Ek gözlem (güçlü destek):** Dev veritabanında telefonda oluşturulmuş **gerçek bir kullanıcı hesabı** (`yusuf555senyer@gmail.com`, 2026-10-11 15:02 UTC) mevcut ve bu hesabın **0 dolap parçası** var. Yani telefondan **kayıt/giriş başarılı** (backend'e ağ erişimi VAR), ancak hiçbir kıyafet yüklemesi veritabanına düşmemiş. Bu, "backend'e ulaşılamıyor" ihtimalini zayıflatıp **yükleme payload'ına (format) işaret eden** Bulgu #1'i güçlendirir.

1. **(ÇOK YÜKSEK) iOS HEIC formatı.** Galeriden seçilen HEIC fotoğraf ham HEIC olarak yükleniyor; backend `content_type` whitelist'i (JPEG/PNG/WebP) reddediyor → **422** `wardrobe_limit_reached` değil, `validation_error: "Image yalnızca JPEG/PNG/WebP olabilir"`. iPhone kamerası varsayılan HEIC olduğu için tipik senaryo budur. Kanıt: gerçek HEIC baytlarıyla curl 422 + expo-image-picker native kaynağı. **Çözüm:** istemcide JPEG'e çevir (expo-image-manipulator) veya backend whitelist'ine `image/heic`/`image/heif` ekle.

2. **(YÜKSEK) Backend `0.0.0.0`'a bağlı değil.** Bulunan artık süreç `127.0.0.1:3000`'e bağlıydı; bu durumda telefon **hiçbir** endpoint'e ulaşamaz, yükleme de ağ hatasıyla düşer. Login/token önbellekteyse uygulama açılır, ama yeni istekler başarısız olur. **Çözüm:** her zaman `bin/rails s -b 0.0.0.0`.

3. **(ORTA) 10MB üstü fotoğraf.** `quality: 0.8` bile yeterli olmayabilir; 48MP bir fotoğraf >10MB olabilir → 422. **Çözüm:** istemcide boyut/çözünürlük düşür (manipulator resize/compress) veya backend limitini artır.

4. **(DÜŞÜK-ORTA) Multipart'a yanlış `Content-Type: application/json`.** Mevcut kod bunu engelliyor, ama bir bağımlılık/versiyon kayması bu guard'ı bozarsa → **400** (standart olmayan gövde) ile yükleme sessizce başarısız olur.

5. **(DÜŞÜK) İzin reddi / picker iptali.** Expo Go'da izin diyaloğu çıkar; reddedilirse akış hiç ilerlemez ve **hiçbir mesaj gösterilmez** — kullanıcı bunu "çalışmıyor" sanabilir.

6. **(DÜŞÜK) Dosya adı boş gönderilmesi.** Kod fallback uyguluyor; pratikte olası değil.

---

## 4. Geçen Testler (özet tablo)

### Test 1 — Yükleme akışı
| # | Senaryo | Sonuç | Not |
|---|---|---|---|
| 1a | Register → token | ✅ 201 | |
| 1b | JPEG yükle | ✅ 201 | `tagging_status: done` |
| 1b | PNG yükle | ✅ 201 | |
| 1b | WebP yükle | ✅ 201 | |
| 1b | `.heic` adı + JPEG bayt | ✅ 201 | (içerik JPEG olduğu için geçer; yanıltıcı) |
| 1b | **Gerçek HEIC baytları** | ❌ **422** | **Bulgu #1** |
| 1b | >10MB dosya | ✅ 422 (beklenen) | |
| 1b | Bozuk/rastgele içerik | ⚠️ 201 | **Bulgu #4** |
| 1b | Boş dosya | ⚠️ 201 | **Bulgu #4** |
| 1b | PNG bayt + `.jpg` adı | ✅ 201 | magic-byte belirleyici |
| 1b | `filename` boş | ⚠️ 422 `missing_image` | **Bulgu #5** |
| 1c | Multipart alan adı/type/filename (`-F image=@...;type=...;filename=...`) | ✅ | RN FormData biçimiyle uyumlu |
| 1d | `Content-Type: application/json` + multipart | ❌ 400 | **Bulgu #3** |
| 1d | Yanlış alan adı (`file`) | ✅ 422 `missing_image` | doğru reddetme |
| 1d | Part type verilmeden | ✅ 201 | |
| 1e | Token yok | ✅ 401 | |
| 1e | Geçersiz token | ✅ 401 | standart format |
| 1e | Süresi dolmuş token | ✅ 401 | standart format |
| 1f | `image_url` host + redirect + indirme | ✅ | 302 → 200, 3829B, `image/jpeg` |
| 1g | `tagging_status` akışı | ⚠️ senkron `done` | **Bulgu #7** |
| 1h | Free 6. parça | ✅ 422 `wardrobe_limit_reached` | ARCHITECTURE formatına uygun |

### Test 2 — Frontend kod incelemesi (sadece okuma)
| Kontrol | Sonuç |
|---|---|
| FormData'ya ekleme biçimi (`{uri,name,type}`) | ✅ Doğru (`api/index.ts`) |
| Android `file://` / iOS `ph://` / HEIC ele alınıyor mu | ❌ **HEIC ele alınmıyor** (Bulgu #1) |
| API client multipart'a elle JSON Content-Type ekliyor mu | ✅ Hayır (guard var, `client.ts:37`) |
| Picker izinleri isteniyor mu / reddedilirse | ⚠️ Otomatik istenir; red/iptal **sessiz** (Bulgu #8) |
| Hata kullanıcıya gösteriliyor mu | ✅ Inline mesaj var; ağ hatası generic (Bulgu #8) |
| `image_url` istemcide host dönüşümü | ✅ `resolveImageUrl` base URL'i ekliyor |
| Rails `default_url_options`/ActiveStorage host | ⚠️ Sadece mailer için `localhost:3000`; ActiveStorage istek-host'una göre üretiyor (LAN IP ile doğru çalışıyor) |

### Test 3 — Backend regresyonu (hepsi LAN IP üzerinden)
| Endpoint | Sonuç |
|---|---|
| `POST /auth/register` (başarılı) | ✅ 201 |
| `POST /auth/register` (tekrar e-posta) | ✅ 422 `validation_error` (TR mesaj) |
| `POST /auth/register` (eksik alan) | ✅ 422 `validation_error` |
| `POST /auth/login` (doğru) | ✅ 200 |
| `POST /auth/login` (yanlış şifre) | ✅ 401 `invalid_credentials` |
| `POST /auth/refresh` (geçerli) | ✅ 200 |
| `POST /auth/refresh` (geçersiz) | ✅ 401 `invalid_refresh_token` |
| `GET /me` (token'lı / token'sız) | ✅ 200 / ✅ 401 |
| `GET /me/usage` | ✅ 200 |
| `GET /onboarding/questions` | ✅ 200 (4 soru) |
| `GET /onboarding/swipe_cards` | ✅ 200 (8 kart) |
| `POST /onboarding/complete` | ✅ 200, `onboarding_completed=true` |
| `GET /wardrobe/items` (+ `?category=`) | ✅ 200 |
| `POST /wardrobe/items` | ✅ 201 (Test 1 ile detaylı) |
| `PATCH /wardrobe/items/:id` | ✅ 200 |
| `DELETE /wardrobe/items/:id` (1. / 2.) | ✅ 204 / ✅ 404 `not_found` |
| AUTHZ: B, A'nın parçasını PATCH/DELETE | ✅ 404 (scope'lu) |
| `POST /outfits/generate` | ✅ 201 → `job_id` |
| `GET /outfits/jobs/:id` (geçerli/geçersiz) | ✅ 200 / ✅ 404 `not_found` |
| `GET /outfits` / `GET /outfits/:id` | ✅ 200 / ✅ 200 |
| `GET /outfits/:id` (yok) | ✅ 404 `not_found` |
| `GET /packages` | ✅ 200 (3 paket) |
| `POST /subscriptions` (geçerli) | ✅ 200, `user.package` güncellendi |
| `POST /subscriptions` (geçersiz id) | ✅ 404 `not_found` |
| `POST /auth/logout` | ✅ 204 |
| Free limit: 5 parça / günlük 3 çalıştırma | ✅ 422 `wardrobe_limit_reached` / `daily_limit_reached` |

---

## 5. Temizlik

Test sırasında oluşturulan geçici dosyalar ve kullanıcılar temizlendi:

- **Geçici görseller** (`/tmp/.../scratchpad/imgs/*`: `photo.jpg/png/webp/heic`, `real.heic`, `large.jpg`, `corrupt.jpg`, `empty.jpg`, `wrong_ext.jpg`, `photo_noext`, indirilen `downloaded.jpg`) ve log/yardımcı dosyalar **silindi**.
- **Test kullanıcıları** (bu ve önceki oturumda oluşturulan `*@example.com` hesapları) ve bunlara bağlı onboarding cevapları, swipe yanıtları, dolap parçaları, kombinler, abonelikler, kullanım sayaçları **silindi** (`combineai_development` içinde, yalnızca test hesapları). Bu işlemden sonra dolap parçası/kombin/blob sayısı 0.
- **Gerçek kullanıcı hesabınıza dokunulmadı** (`@example.com` filtresine girmediği için `yusuf555senyer@gmail.com` korundu).
- Test için başlatılan Rails sunucusu **durduruldu**; `tmp/pids/server.pid` temizlendi.
- **Hiçbir kaynak dosya değiştirilmedi.** Bu rapordan başka dosya oluşturulmadı.

> Not: Ön koşul olarak ortamda bulunan, `127.0.0.1:3000`'e bağlı artık puma süreci (`pid 816687`) de sonlandırıldı (bkz. Bulgu #2).
