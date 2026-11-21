# Faruk için başlangıç dosyası

> Hazırlanma: 2026-11-05 · Son güncelleme: 2026-11-21 (T1.4 ve T1.5 bitti, T1.6 sana verildi). Bu dosya o günün özetidir. Bir çelişki görürsen **repo kazanır**: `TODO.md` > `CLAUDE.md` > `docs/YOL_HARITASI.md` > bu dosya.
>
> Dönem A'nın "uygulama içi temel" şeridi senin (`docs/YOL_HARITASI.md` §2.4): T0.8, T1.4 ✅, T1.5 ✅, **T1.6**, T1.7, T1.9, T1.8.

---

## 1. Proje bir paragrafta

Türk arıcılar için **çevrimdışı öncelikli** kovan takip uygulaması (iOS + Android). Arıcı sahada internet olmadan arılık, kovan, kraliçe, denetim, ilaçlama, besleme ve bal sağımı kaydı tutar; kayıtlar önce telefondaki SQLite'a yazılır, ağ gelince arka planda Supabase'e gider.

- **İstemci:** Expo SDK 58 + Expo Router, React Native 0.88, React 19, TypeScript strict (`noUncheckedIndexedAccess` açık), zod.
- **Backend:** Supabase (Postgres + RLS + Deno Edge Functions), Frankfurt bölgesi. Ortamlar: yerel, `dev`, `prod`.
- **Kalite:** ESLint (katman yönü ve dosya boyutu otomatik denetlenir), Prettier, husky + lint-staged, Jest (unit + ui), `deno test`, pgTAP, GitHub Actions.

---

## 2. Bilgisayarını hazırla

Gerekenler: **Git**, **Node.js 22** (CI de 22 kullanıyor), telefonda **Expo Go**. Veritabanı testleri için ayrıca **Docker Desktop** (T1.4/T1.5 için şart değil).

```bash
git clone https://github.com/karacaeymen/arici-kovan-takip-yeni.git
cd arici-kovan-takip-yeni
npm install              # husky commit kancaları da kurulur
cp .env.example .env.local   # dev değerlerini Eymen sana özelden gönderir; .env.local asla commit edilmez
npm start                # Expo Go ile QR'ı okut, "Ana sayfa" açılmalı
```

Her şeyin yolunda olduğunu şu dördüyle kontrol et (hepsi yeşil olmalı):

```bash
npm run typecheck
npm run lint
npm test
npm run format:check
```

`.env.local` değerleri (Supabase dev URL'i ve anon anahtarı) GitHub'a, PR açıklamasına ya da gruba yazılmaz; yalnızca özelden paylaşılır. Değerler olmadan da testler çalışır; yalnızca telefonda uygulama sunucuya bağlanamaz.

Windows'ta satır sonları LF'dir (`.gitattributes` bunu zorlar). Git `CRLF` uyarısı verirse `git config core.autocrlf false` yap.

---

## 3. Önce oku (bu sırayla, yaklaşık 30 dakika)

1. **`CLAUDE.md`**: bağlayıcı kurallar, adlandırma, boyut sınırları, komutlar. Kısa; tamamını oku.
2. **`TODO.md` §1** (Mimari Modülerlik Standartları), sonra **Güncel Durum**, sonra çalışacağın görevin bölümü.
3. **`docs/YOL_HARITASI.md` §2.4**: iş paylaşımı, turlar ve çakışmayı önleme kuralları.
4. **`eslint.config.js`**: hangi katmanın neyi import edebileceği burada. Lint hatası alırsan cevap buradadır.

Bakıp örnek alacağın mevcut kod:

| Ne yazacaksın | Örnek al |
|---|---|
| Ekran ve rota | `app/(tabs)/index.tsx` → `src/features/home/screens/HomeScreen.tsx` (+ testi) |
| Bileşen/ekran testi | `src/test-utils/render.tsx` (`renderWithProviders`) |
| Zaman kullanan kod | `src/lib/clock.ts` (`Clock`, testte `createFixedClock`) |
| Domain tipleri | `src/domain/entities/*.ts`, `src/domain/shared/*.ts` |
| Test verisi | `src/test-utils/domain-fixtures.ts` |

---

## 4. En önemli kurallar (lint çoğunu yakalar)

- `app/**` rota dosyası ≤ 30 satır; yalnızca parametre okur ve **tek** `<XScreen />` render eder. `app/**` altına test koyma.
- Bileşen servis ya da repository import etmez; veriyi props ile alır. Her alt bileşen kendi dosyasında.
- Okuma akışı: **Screen → hook → `Service.watch*()` → `Repository.watch*()`**. Hook repository'ye doğrudan erişmez.
- Repository yalnızca `data/db` ve domain tiplerini import eder.
- `src/domain/**` saf kalır (yalnızca `zod` ve `src/lib` saf yardımcıları). Domain'de değişiklik gerekiyorsa kendin yazma, Eymen'e söyle.
- Boyut: Screen/Component 150, Service/hook 250 satır. Aşan dosyayı böl.
- `new Date()` değil `Clock`; `process.env` değil `getConfig()`; sabit Türkçe metin değil `src/i18n/tr.json` (T0.8'den sonra).
- `eslint-disable` ile kural susturma. Gerçekten gerekiyorsa gerekçesini yaz ve PR'da belirt.
- Gizli değer (anahtar, token, şifre) asla repoya girmez.

---

## 5. Şu anki durum (2026-11-21)

| Görev | Ne | Durum |
|---|---|---|
| T0.1–T0.4 | İskelet, lint, test altyapısı, Supabase + `health` | ✅ |
| T0.5, T0.6, T0.7 | EAS, CI, Sentry | 🔄 kod hazır; hesap/ayar işleri Eymen'de, **dokunma** |
| T1.1 | Domain varlıkları + zod şemaları (`src/domain/**`) | ✅ |
| T1.2 | Supabase tabloları + `sync` fonksiyonu | ✅ `main`'de (dev/prod'a yükleme T0.6 ayarlarını bekliyor) |
| T1.3 | RLS politikaları | Claude, sıradaki |
| T1.4 | Yerel SQLite şeması | ✅ senin; telefonda açılış doğrulaması bekliyor |
| T1.5 | Repository katmanı | ✅ senin |
| **T1.6** | İstemci senkron motoru | ⏭️ **senin, sıradaki** |

---

## 6. Senin görevlerin

Ayrıntılı **Dosyalar** ve **Kabul Kriterleri** her zaman `TODO.md`'de. Yalnızca o satırdaki dosyaları aç; listede olmayan bir dosya gerekiyorsa önce `TODO.md`'yi aynı PR'da güncelle.

### T1.6 — İstemci senkron motoru (sıradaki)
- **Bağımlılık:** T1.2 ✅, T1.5 ✅, T1.3 (Claude, paralel yürüyor). T1.3 bitmeden de başlayabilirsin: testler sahte API istemcisiyle koşar. Yalnızca dev sunucusuyla uçtan uca deneme T1.3'ü bekler (RLS politikası yokken push `forbidden` döner).
- **Dosyalar:** `src/data/supabase/client.ts`, `src/data/api/sync.client.ts`, `src/services/sync/{SyncPushService,SyncPullService,SyncCoordinator}.ts`, `src/services/sync/syncStore.ts` + her biri için `.test.ts`.
- **Sunucu sözleşmesi** (`supabase/functions/sync/`; kaynak `services/sync-protocol.ts`):
  - `POST /sync/push` gövdesi `{ protocolVersion: 1, changes: [{ table, row }] }`, en fazla **500** değişiklik. Yanıt `{ results: [{ table, id, status: 'applied' | 'stale' | 'rejected', reason? }] }`. `reason`: `invalid_row`, `missing_parent`, `forbidden`, `clock_skew`, `unknown`.
  - `GET /sync/pull?protocolVersion=1&cursor=<sayı>&limit=<≤500>` yanıtı `{ changes, cursor, hasMore }`. İmleç tek bir global sayıdır; `sync_state`'e yazılır. `hasMore` true ise hemen bir sonraki sayfa istenir.
  - Protokol sürümü uyuşmazsa sunucu **426** döner: senkron durur, kullanıcıya "uygulamayı güncelle" gösterilir.
  - Alan adları istemcide camelCase'tir; snake_case dönüşümünü sunucu yapar.
  - Cihaz saati sunucudan 10 dakikadan fazla ilerideyse satır `clock_skew` ile reddedilir.
- **T1.5'ten hazır gelenler:** `OutboxRepository.peek(limit)`, `markSent(ids)`, `markFailed(ids, hata)`, `count()`, `watchPending()`; pull için her repository'de `applyRemote(row)` (yerel daha yeniyse `stale`, uygulanırsa bekleyen outbox girdisini siler).
- **Push sonucu nasıl işlenir (öneri):** `applied` ve `stale` → `markSent`. `rejected` + `missing_parent` → ebeveyn henüz gitmemiş olabilir, `markFailed` ile tekrar denenir. Diğer `rejected` nedenleri kalıcıdır → `markSent` ile kuyruktan çıkar ve `reportError` ile Sentry'ye gider. Ağ hatası → tüm parti `markFailed`, üstel bekleme.
- **Sıra:** Önce push, sonra pull. Ağ geldiğinde ve uygulama öne geldiğinde otomatik tetiklenir. Aynı anda iki senkron çalışmaz.
- **Kabul:** Hiçbir bileşen senkron servislerini doğrudan import etmez; kuyruk, yeniden deneme (üstel bekleme) ve LWW testli; otomatik tetikleme çalışır.

### T1.7 — Giriş (telefon + OTP)
- T1.6'dan sonra. Ayrıntı `TODO.md` T1.7. Ekranlı ilk görev olduğu için tema (T0.8) hazır değilse geçici değerlerle başla.

### T0.8 — Tema, i18n ve saha bileşenleri
- **Bekleyen:** Senin renk paleti ve yazı tipi tasarımın. Tasarım gelince araya alınır.
- **Dosyalar:** `src/theme/{colors,spacing,typography,radius,index}.ts`, `src/i18n/{index.ts,tr.json}`, `src/lib/format.ts`, `src/components/ui/<Ad>/<Ad>.tsx` + `<Ad>.test.tsx` (AppText, Button, Card, ListItem, Stepper, SegmentedChoice, Chip, BottomSheet, EmptyState, OfflineBanner).
- **Dikkat:** Dokunma hedefleri en az **56 dp**. Her bileşenin rol tabanlı RNTL testi olsun. Tema ve i18n sağlayıcılarını `src/test-utils/render.tsx`'e ekle.

### Sonrası
T1.9 ayarlar/senkron ekranı → T1.8 onboarding. Ayrıntı: `docs/YOL_HARITASI.md` §2.4.

---

## 7. Alan sahipliği (çakışmayı önlemek için)

- **Senin alanın:** `src/theme/**`, `src/components/ui/**`, `src/i18n/**`, `src/data/db/**`, `src/data/repositories/**`, `src/data/api/**`, `src/data/supabase/**`, `src/services/sync/**`, ilgili `app/**` ve `src/features/{auth,onboarding,settings,home}/**`.
- **Claude'un alanı, dokunma:** `src/domain/**`, `supabase/**`. Sunucu tarafında bir değişiklik gerekirse ne gerektiğini Eymen'e yaz.
- **Ortak dosyalar:** `package.json`, `package-lock.json`, `TODO.md`, `docs/YOL_HARITASI.md`, `src/i18n/tr.json`. PR açmadan önce güncel `main`'i al (`git pull origin main`); çakışma çıkarsa diğer tarafın satırlarını silme.

---

## 8. Her görevde iş akışı

1. `TODO.md`'de görevin Açıklama, Dosyalar, Bağımlılıklar ve Kabul Kriterleri satırlarını oku. Bağımlılık bitmemişse başlama.
2. Güncel `main`'den dal aç: `git checkout main && git pull && git checkout -b faruk/t1.4-sqlite-schema` (biçim: `faruk/t<faz>.<sıra>-kisa-ad`).
3. Kodu ve testini birlikte yaz (test, test ettiği dosyanın yanında: `<dosya>.test.ts(x)`).
4. Bitmeden önce: `npm run typecheck`, `npm run lint`, `npm test` yeşil olsun.
5. Aynı PR'da `TODO.md`'de görevin kutucuklarını `[x]` yap, **Güncel Durum**'u ve `docs/YOL_HARITASI.md` §2.1 tablosunu güncelle.
6. PR aç, açıklamada `.github/pull_request_template.md` başlıklarını kullan. Bir görev = bir PR; `main`'e doğrudan push yok.

**İnceleme anlaşması** (`docs/YOL_HARITASI.md` §6):
- CI'ı yeşil olan her PR'a Eymen **24 saat içinde** bakar. Yanıt gelmezse hatırlat.
- **Küçük PR'ları** (yalnızca belge, `TODO.md`/yol haritası güncellemesi ya da kendi alanında tek dosyalık düzeltme) CI yeşilse kendin merge edebilirsin.
- Görev PR'ları (T-numaralı) ve Claude'un alanına dokunan PR'lar Eymen'in onayıyla merge edilir; iOS/Android doğrulamasını Eymen yapar.

---

## 9. Yapma

- Prod Supabase'e (`cnmycgkyofuyucscjxwm`) migration veya deploy yapma.
- Hesap, ödeme veya mağaza ayarı gerektiren işleri (T0.5, Sentry hesabı, RevenueCat) yapılmış gibi işaretleme.
- `TODO.md` dışında yeni görev listesi açma; plan değişikliği `TODO.md` ve `docs/YOL_HARITASI.md` üzerinden.
- Açık kararları (K1–K5) kendin verme; varsayım gerekirse yaz ve Eymen'e sor.

---

## 10. Claude ile çalışırken ilk mesaj (kopyala-yapıştır)

```text
Bu repoda Faruk olarak çalışıyorum. Önce CLAUDE.md, TODO.md §1 ve Güncel Durum,
docs/YOL_HARITASI.md §2.4 ve docs/FARUK_BASLANGIC.md dosyalarını oku.
Sonra TODO.md'deki T1.6 görevinin Dosyalar ve Kabul Kriterleri satırlarına göre
bir uygulama planı çıkar (dosya listesi, servis API'leri, testler) ve onayımı bekle.
Yalnızca görevin Dosyalar satırındaki dosyalara dokun.
```

Görev numarasını (T1.6, T1.7, T0.8 …) ihtiyacına göre değiştir. Takıldığında Eymen'e sor.
