# Faruk için başlangıç dosyası

> Hazırlanma: 2026-11-05. Bu dosya o günün özetidir. Bir çelişki görürsen **repo kazanır**: `TODO.md` > `CLAUDE.md` > `docs/YOL_HARITASI.md` > bu dosya.
>
> `docs/YOL_HARITASI.md`'de adı geçen "Arkadaş" sensin. Orada "ChatGPT" şeridine yazılmış uygulama içi temel işleri (T0.8, T1.4, T1.5) artık sen yürütüyorsun.

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
cp .env.example .env.local   # değerleri Eymen'den al; .env.local asla commit edilmez
npm start                # Expo Go ile QR'ı okut, "Ana sayfa" açılmalı
```

Her şeyin yolunda olduğunu şu dördüyle kontrol et (hepsi yeşil olmalı):

```bash
npm run typecheck
npm run lint
npm test
npm run format:check
```

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

## 5. Şu anki durum

| Görev | Ne | Durum |
|---|---|---|
| T0.1–T0.4 | İskelet, lint, test altyapısı, Supabase + `health` | ✅ bitti |
| T0.5, T0.6, T0.7 | EAS, CI, Sentry | 🔄 kod hazır; hesap/ayar işleri Eymen'de, **dokunma** |
| T1.1 | Domain varlıkları + zod şemaları (`src/domain/**`) | ✅ `main`'de |
| T1.2 | Supabase tabloları + `sync` fonksiyonu | 🔄 PR #9, merge bekliyor |
| T1.3 | RLS politikaları | Claude, T1.2'den sonra |

---

## 6. Senin görevlerin

Ayrıntılı **Dosyalar** ve **Kabul Kriterleri** her zaman `TODO.md`'de. Yalnızca o satırdaki dosyaları aç; listede olmayan bir dosya gerekiyorsa önce `TODO.md`'yi aynı PR'da güncelle.

### T0.8 — Tema, i18n ve saha bileşenleri
- **Bekleyen:** Senin renk paleti ve yazı tipi tasarımın. Tasarım hazırsa değerleri doğrudan `src/theme/*.ts`'e işle. Hazır değilse geçici değerlerle başla ve dosyada açıkça `// GEÇİCİ: tasarım gelince değişecek` diye işaretle.
- **Dosyalar:** `src/theme/{colors,spacing,typography,radius,index}.ts`, `src/i18n/{index.ts,tr.json}`, `src/lib/format.ts`, `src/components/ui/<Ad>/<Ad>.tsx` + `<Ad>.test.tsx`.
- **Bileşenler:** AppText, Button, Card, ListItem, Stepper, SegmentedChoice, Chip, BottomSheet, EmptyState, OfflineBanner.
- **Dikkat:** Dokunma hedefleri en az **56 dp** (eldivenli el). Her bileşenin rol tabanlı RNTL testi olsun (`getByRole`). Tema ve i18n sağlayıcılarını `src/test-utils/render.tsx`'e ekle (dosyada bunun için not var). `HomeScreen`'deki sabit metni `tr.json`'a taşı.

### T1.4 — Yerel SQLite şeması (Drizzle)
- **Bağımlılık:** T1.1 (✅ hazır). Şimdi başlayabilirsin.
- **Dosyalar:** `src/data/db/client.ts`, `src/data/db/schema/{business,apiaries,hives,queens,inspections,treatments,feedings,harvests,relocations,tasks,outbox,sync_state}.ts`, `src/data/db/schema/index.ts`, `drizzle.config.ts`, `drizzle/`.
- **Paketler:** `npx expo install expo-sqlite`, `npm install drizzle-orm`, `npm install -D drizzle-kit`. Yalnızca bu görevin gerektirdiği paketi ekle.
- **Sunucuyla aynı olmalı** (PR #9'daki `supabase/migrations/*_create_<tablo>.sql` dosyalarına bak):
  - Tablo adları: `businesses, apiaries, hives, queens, inspections, treatments, feedings, harvests, relocations, tasks` (çoğul; senkron bu adlarla eşleşir).
  - Sütunlar `snake_case`, alanlar domain'deki camelCase karşılıkları (`business_id` ↔ `businessId`).
  - Her satırda `id` (UUID metin), `created_at`, `updated_at`, `deleted_at` var. Zaman damgaları **saat dilimli ISO metni**, takvim günleri `YYYY-MM-DD` metni.
  - Silme her zaman `deleted_at` doldurularak yapılır; satır fiziksel olarak silinmez.
  - Sunucudaki `sync_seq` sütunu yerelde gerekmez.
- **outbox:** Sunucuya gidecek değişikliklerin kuyruğu. `POST /sync/push` her değişikliği `{ table, row }` olarak, **satırın tamamıyla** (camelCase, en az `id` + `updatedAt`) bekler. En az: tablo adı, satır id'si, satır içeriği (JSON), sıraya girme zamanı, deneme sayısı.
- **sync_state:** Pull imleci sunucuda tek bir global sayıdır (`sync_seq`). Son çekilen imleç ve son senkron zamanı burada tutulur.
- **Kabul:** Her tablo kendi dosyasında, `schema/index.ts` tek export noktası; uygulama açılışında migration'lar otomatik uygulanır; `useLiveQuery` ile canlı dinleme örnek testi.

### T1.5 — Repository katmanı
- **Bağımlılık:** T1.4 `main`'e merge edilmiş olmalı.
- **Dosyalar:** `src/data/repositories/{Business,Apiary,Hive,Queen,Inspection,Treatment,Feeding,Harvest,Relocation,Task,Outbox}Repository.ts` + her biri için `.test.ts`.
- **Kural:** Bir kaydın yazılması ve outbox kaydı **tek transaction'da**; biri hata verirse ikisi de geri alınır (bunun testi olmalı). Okumalar `watch*` metotlarıyla canlı sorgu döner. `updatedAt` `Clock`'tan gelir. Testler Node'un SQLite sürücüsüyle bellek içi veritabanında koşar (cihaz gerekmez).
- **Neden önemli:** Claude'un **T1.6** (istemci senkron motoru) görevi senin T1.5'ine bağlı. T1.5 merge edilmeden T1.6 başlayamaz; bu yüzden Outbox repository'sinin API'si (kuyruktan oku, gönderileni işaretle, deneme sayısını artır) net olsun.

### Sonrası (sırayla)
T1.7 telefon + OTP girişi → T1.9 ayarlar/senkron ekranı → T1.8 onboarding (T1.6 merge edildikten sonra). Ayrıntı: `docs/YOL_HARITASI.md` §2.4.

---

## 7. Alan sahipliği (çakışmayı önlemek için)

- **Senin alanın:** `src/theme/**`, `src/components/ui/**`, `src/i18n/**`, `src/data/db/**`, `src/data/repositories/**`, ilgili `app/**` ve `src/features/{auth,onboarding,settings,home}/**`.
- **Claude'un alanı, dokunma:** `src/domain/**`, `supabase/**`, `src/services/sync/**`, `src/data/api/**`.
- **Ortak dosyalar:** `package.json`, `package-lock.json`, `TODO.md`, `docs/YOL_HARITASI.md`, `src/i18n/tr.json`. PR açmadan önce güncel `main`'i al (`git pull origin main`); çakışma çıkarsa diğer tarafın satırlarını silme.

---

## 8. Her görevde iş akışı

1. `TODO.md`'de görevin Açıklama, Dosyalar, Bağımlılıklar ve Kabul Kriterleri satırlarını oku. Bağımlılık bitmemişse başlama.
2. Güncel `main`'den dal aç: `git checkout main && git pull && git checkout -b faruk/t1.4-sqlite-schema` (biçim: `faruk/t<faz>.<sıra>-kisa-ad`).
3. Kodu ve testini birlikte yaz (test, test ettiği dosyanın yanında: `<dosya>.test.ts(x)`).
4. Bitmeden önce: `npm run typecheck`, `npm run lint`, `npm test` yeşil olsun.
5. Aynı PR'da `TODO.md`'de görevin kutucuklarını `[x]` yap, **Güncel Durum**'u ve `docs/YOL_HARITASI.md` §2.1 tablosunu güncelle.
6. PR aç, açıklamada `.github/pull_request_template.md` başlıklarını kullan. Bir görev = bir PR; `main`'e doğrudan push yok. Eymen inceler ve iOS/Android'de doğrular.

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
Sonra TODO.md'deki T1.4 görevinin Dosyalar ve Kabul Kriterleri satırlarına göre
bir uygulama planı çıkar (dosya listesi, tablo/sütunlar, testler) ve onayımı bekle.
Yalnızca görevin Dosyalar satırındaki dosyalara dokun.
```

Görev numarasını (T0.8, T1.4, T1.5) ihtiyacına göre değiştir. Takıldığında Eymen'e sor.
