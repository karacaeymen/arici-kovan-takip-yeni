# TODO.md — Arıcı Kovan Takip (MVP Yol Haritası)

> **Sıfırdan başlangıç sürümü.** Daha önce yapılan hiçbir görev tamamlanmış sayılmaz; tüm görevler bu belgedeki modüler yapıya göre yeniden yapılır.

Mimari kurallar için önce `CLAUDE.md`, ardından bu belgenin **§1 Mimari Modülerlik Standartları** bölümü okunmalıdır. Bir görev, kabul kriterleri **iOS ve Android'de** doğrulanmadan tamamlanmış sayılmaz (aksi belirtilmedikçe). Görev ID'leri `T<faz>.<sıra>` biçimindedir. Her görevin **Dosyalar** satırı, o görevde açılacak dosyaların bağlayıcı listesidir; listede olmayan bir katmana kod yazmak gerekirse önce bu belge güncellenir.

> Not: Proje TypeScript'tir; "JSX dosyası" ifadesi bu belgede `.tsx` dosyası anlamına gelir.

---

## §1 Mimari Modülerlik Standartları

### 1.1 Temel ilkeler
1. **Her endpoint ayrı dosyadır.** Frontend'de her ekran rotası (`app/**`) ayrı bir `.tsx` dosyası; backend'de her HTTP uç noktası ayrı bir `*.route.ts` dosyasıdır.
2. **Route katmanı ince kalır.** Route dosyası yalnızca isteği/parametreyi alır, doğrular ve bir alt katmana devreder. İş mantığı, DB erişimi veya üçüncü parti çağrısı içermez.
3. **İş mantığı servistedir.** Backend'de `services/*.service.ts`, frontend'de `*Service.ts` dosyaları iş akışını yönetir. Servisler HTTP nesnesi (`Request`/`Response`) ya da React bileşeni bilmez.
4. **Bileşenler parçalanır.** Ekranlar alt bileşenlerden birleştirilir; her alt bileşen kendi dosyasındadır ve veriyi yalnızca props ile alır.
5. **Bağımlılık yönü tek yönlüdür** (aşağıdaki tablolar). Ters yöndeki import ESLint tarafından engellenir (T0.2).
6. **Bağımlılıklar enjekte edilir.** Servisler bağımlılıklarını (repository, provider, `Clock`) fabrika/constructor parametresi olarak alır; böylece mock'la izole test edilir.

### 1.2 Frontend katmanları

| Katman | Konum | Sorumluluk | Import edebileceği |
|---|---|---|---|
| **Route** | `app/**/*.tsx` | URL parametresini okur, **tek** bir Screen render eder (≤ 30 satır) | `src/features/*/screens` |
| **Screen** | `src/features/<feature>/screens/<Ad>Screen.tsx` | Alt bileşenleri birleştirir, hook'ları çağırır | aynı feature'ın `components`, `hooks`; `src/components/ui`; `theme`; `i18n` |
| **Component** | `src/features/<feature>/components/<Ad>.tsx`, `src/components/ui/<Ad>/<Ad>.tsx` | Sunum; veri yalnızca props ile | `src/components/ui`, `theme`, `i18n`, `src/lib/format` |
| **Hook** | `src/features/<feature>/hooks/use<Ad>.ts` | Ekran durumu, form durumu, servis çağrısı | `services`, `domain` (tipler) |
| **Service** | `src/features/<feature>/services/<Ad>Service.ts` (feature'a özel), `src/services/<alan>/<Ad>Service.ts` (çapraz: auth, sync, bildirim, konum, abonelik) | İş akışı koordinasyonu | `domain`, `data/repositories`, `data/api`, `lib`, platform adaptörleri |
| **Domain** | `src/domain/**` | Saf iş kuralları, varlıklar, hesaplamalar | yalnızca `zod` ve `src/lib` saf yardımcıları |
| **Repository** | `src/data/repositories/<Varlık>Repository.ts` | Yerel SQLite CRUD + outbox + canlı sorgu (`watch*`) | `data/db`, `domain` (tipler) |
| **API client** | `src/data/api/<fonksiyon>.client.ts` | Backend Edge Function'a tek bir HTTP istemcisi (backend fonksiyonu başına bir dosya) | `src/data/supabase/client.ts`, `domain` (tipler) |

Okuma (canlı sorgu) akışı: `Screen → hook → Service.watch*() → Repository.watch*()`. Hook'lar repository'ye doğrudan erişmez.

### 1.3 Frontend klasör yapısı
```
app/                                # Expo Router — her dosya = tek endpoint/ekran
  _layout.tsx
  (auth)/login.tsx                  # → features/auth/screens/LoginScreen.tsx
  (tabs)/index.tsx                  # → features/home/screens/HomeScreen.tsx
  ...                               # tam liste: §1.7 Ekran Rota Haritası
src/
  features/
    <feature>/                      # auth, onboarding, apiary, hive, queen, inspection,
      screens/<Ad>Screen.tsx        #   treatment, feeding, harvest, calendar, weather,
      components/<Ad>.tsx           #   settings, legal, subscription, scanner, home
      hooks/use<Ad>.ts
      services/<Ad>Service.ts
      <dosya>.test.ts(x)            # test, test ettiği dosyanın yanında
  components/ui/<Ad>/<Ad>.tsx       # ortak saha modu bileşenleri (+ <Ad>.test.tsx)
  services/                         # çapraz servisler: auth/, sync/, notifications/,
                                    #   location/, subscription/, background/
  domain/
    entities/<varlık>.ts            # zod şeması + tip
    calendar/                       # RuleEngine.ts, rules/<Kural>Rule.ts
    <alan>/<hesap>.ts               # saf hesaplamalar (queen, treatment, harvest…)
  data/
    db/client.ts, db/schema/<tablo>.ts, db/schema/index.ts
    repositories/<Varlık>Repository.ts
    api/<fonksiyon>.client.ts
    supabase/client.ts
  lib/                              # clock.ts, format.ts, config.ts, result.ts
  theme/                            # colors, spacing, typography, radius
  i18n/                             # index.ts, tr.json
```

### 1.4 Backend katmanları (Supabase Edge Functions, Deno)

| Katman | Konum | Sorumluluk | Import edebileceği |
|---|---|---|---|
| **Giriş** | `functions/<fonksiyon>/index.ts` | Yalnızca router'ı kurar, route'ları kaydeder, `Deno.serve` (≤ 25 satır) | `routes/*`, `_shared/http` |
| **Route** | `functions/<fonksiyon>/routes/<ad>.route.ts` | **Bir** metot+yol: kimlik doğrulama, zod ile girdi doğrulama, servisi çağırma, sonucu HTTP yanıtına çevirme (≤ 80 satır) | `services/*`, `_shared/http`, `_shared/auth`, `_shared/validation` |
| **Service** | `functions/<fonksiyon>/services/<ad>.service.ts` | İş mantığı, hesaplama, koordinasyon. `Request`/`Response` bilmez | `repositories/*`, `providers/*`, `_shared/domain`, `_shared/clock` |
| **Repository** | `functions/<fonksiyon>/repositories/<ad>.repository.ts` | SQL / supabase-js / RPC çağrıları | `_shared/db` |
| **Provider** | `functions/<fonksiyon>/providers/<ad>.provider.ts` | Üçüncü parti API entegrasyonu (bir arayüzün uygulaması) | `_shared/http-client` |
| **Shared** | `functions/_shared/**` | Router, yanıt/hata yardımcıları, CORS, DB istemcisi, auth, logger, config | hiçbir fonksiyon klasöründen import etmez |

> `_` ile başlayan klasörler Supabase tarafından ayrı fonksiyon olarak deploy edilmez; ortak kod bu yüzden `_shared/` altındadır. `routes/`, `services/` vb. klasörler her zaman ilgili fonksiyon klasörünün **içindedir**.

### 1.5 Backend klasör yapısı
```
supabase/
  config.toml
  migrations/<zaman>_<ad>.sql       # tablo/politika/fonksiyon başına ayrı migration
  seed/reference/<alan>.sql         # referans içerik (T4.2)
  tests/database/<ad>_test.sql      # pgTAP
  functions/
    _shared/
      http/router.ts                # Hono tabanlı router fabrikası (basePath = fonksiyon adı)
      http/response.ts              # ok(), created(), noContent()
      http/errors.ts                # AppError, hata → HTTP eşleme
      http/cors.ts
      auth/require-user.ts          # JWT doğrulama, kullanıcı/işletme bağlamı
      validation/parse.ts           # zod ile body/query/param doğrulama
      db/client.ts                  # kullanıcı JWT'li ve service-role istemci fabrikaları
      observability/logger.ts       # fonksiyon+route etiketli yapılandırılmış log
      config.ts                     # ortam değişkenleri (zod ile doğrulanmış)
      clock.ts
    <fonksiyon>/
      index.ts
      routes/<ad>.route.ts
      services/<ad>.service.ts
      repositories/<ad>.repository.ts
      providers/<ad>.provider.ts    # gerekiyorsa
      tests/<ad>.test.ts            # deno test
```

### 1.6 Backend Endpoint Haritası

| Fonksiyon | Metot ve yol | Route dosyası | Servis(ler) | Görev |
|---|---|---|---|---|
| `health` | `GET /health` | `health.route.ts` | `health.service.ts` | T0.4 |
| `sync` | `POST /sync/push` | `push.route.ts` | `sync-push.service.ts` | T1.2 |
| `sync` | `GET /sync/pull` | `pull.route.ts` | `sync-pull.service.ts` | T1.2 |
| `reference-content` | `GET /reference-content/manifest` | `manifest.route.ts` | `reference-manifest.service.ts` | T4.1 |
| `reference-content` | `GET /reference-content/:table` | `content.route.ts` | `reference-content.service.ts` | T4.1 |
| `content-feedback` | `POST /content-feedback` | `feedback.route.ts` | `content-feedback.service.ts` | T4.3 |
| `weather-forecast` | `GET /weather-forecast/:apiaryId` | `forecast.route.ts` | `forecast.service.ts`, `forecast-cache.service.ts` (+ `open-meteo.provider.ts`) | T5.1 |
| `push-tokens` | `POST /push-tokens` | `register.route.ts` | `push-token.service.ts` | T5.5 |
| `push-tokens` | `DELETE /push-tokens/:token` | `unregister.route.ts` | `push-token.service.ts` | T5.5 |
| `weather-alerts` | `POST /weather-alerts/run` (cron) | `run.route.ts` | `alert-evaluator.service.ts`, `push-sender.service.ts` | T5.6 |
| `revenuecat-webhook` | `POST /revenuecat-webhook` | `webhook.route.ts` | `entitlement.service.ts` | T6.2 |
| `delete-account` | `POST /delete-account` | `delete-account.route.ts` | `account-deletion.service.ts` | T6.5 |

Her satır için istemci tarafında `src/data/api/<fonksiyon>.client.ts` dosyası bulunur.

### 1.7 Ekran Rota Haritası

| Rota dosyası (`app/`) | Screen bileşeni | Görev |
|---|---|---|
| `_layout.tsx`, `(auth)/_layout.tsx`, `(tabs)/_layout.tsx` | — (yalnızca layout) | T0.1 |
| `(tabs)/index.tsx` | `home/screens/HomeScreen.tsx` | T0.1 (iskelet), T4.7 (bugünün görevleri) |
| `(auth)/login.tsx` | `auth/screens/LoginScreen.tsx` | T1.7 |
| `(auth)/otp-verify.tsx` | `auth/screens/OtpVerifyScreen.tsx` | T1.7 |
| `onboarding/business-name.tsx` | `onboarding/screens/BusinessNameScreen.tsx` | T1.8 |
| `onboarding/first-apiary.tsx` | `onboarding/screens/FirstApiaryScreen.tsx` | T1.8 |
| `onboarding/notifications.tsx` | `onboarding/screens/NotificationPermissionScreen.tsx` | T1.8 |
| `(tabs)/settings.tsx` | `settings/screens/SettingsScreen.tsx` | T1.9 |
| `settings/sync-status.tsx` | `settings/screens/SyncStatusScreen.tsx` | T1.9 |
| `(tabs)/apiaries.tsx` | `apiary/screens/ApiaryListScreen.tsx` | T2.2 |
| `apiaries/new.tsx` | `apiary/screens/ApiaryCreateScreen.tsx` | T2.2 |
| `apiaries/[id]/index.tsx` | `apiary/screens/ApiaryDetailScreen.tsx` | T2.2 |
| `apiaries/[id]/edit.tsx` | `apiary/screens/ApiaryEditScreen.tsx` | T2.2 |
| `hives/new.tsx` | `hive/screens/HiveCreateScreen.tsx` | T2.3 |
| `hives/bulk-new.tsx` | `hive/screens/HiveBulkCreateScreen.tsx` | T2.3 |
| `hives/index.tsx` | `hive/screens/HiveListScreen.tsx` | T2.4 |
| `hives/[id]/queen.tsx` | `queen/screens/QueenHistoryScreen.tsx` | T2.5 |
| `hives/relocate.tsx` | `hive/screens/HiveRelocateScreen.tsx` | T2.6 |
| `hives/qr-print.tsx` | `hive/screens/QrPrintScreen.tsx` | T2.7 |
| `scanner.tsx` | `scanner/screens/ScannerScreen.tsx` | T2.8 |
| `inspections/[hiveId]/new.tsx` | `inspection/screens/InspectionCreateScreen.tsx` | T3.1 |
| `inspections/session.tsx` | `inspection/screens/InspectionSessionScreen.tsx` | T3.2 |
| `inspections/summary.tsx` | `inspection/screens/InspectionSummaryScreen.tsx` | T3.2 |
| `treatments/new.tsx` | `treatment/screens/TreatmentCreateScreen.tsx` | T3.3 |
| `feedings/new.tsx` | `feeding/screens/FeedingCreateScreen.tsx` | T3.4 |
| `harvests/new.tsx` | `harvest/screens/HarvestCreateScreen.tsx` | T3.5 |
| `hives/[id]/index.tsx` | `hive/screens/HiveDetailScreen.tsx` | T3.6 |
| `apiaries/[id]/dashboard.tsx` | `apiary/screens/ApiaryDashboardScreen.tsx` | T3.7 |
| `(tabs)/calendar.tsx` | `calendar/screens/CalendarScreen.tsx` | T4.7 |
| `tasks/[id].tsx` | `calendar/screens/TaskDetailScreen.tsx` | T4.7 |
| `legal/disclaimer.tsx` | `legal/screens/DisclaimerScreen.tsx` | T4.8 |
| `weather/[apiaryId].tsx` | `weather/screens/WeatherDetailScreen.tsx` | T5.2 |
| `settings/notifications.tsx` | `settings/screens/NotificationSettingsScreen.tsx` | T5.4 |
| `paywall.tsx` (modal) | `subscription/screens/PaywallScreen.tsx` | T6.3 |
| `settings/subscription.tsx` | `subscription/screens/SubscriptionScreen.tsx` | T6.3 |
| `legal/privacy.tsx`, `legal/terms.tsx`, `legal/kvkk.tsx` | `legal/screens/PrivacyScreen.tsx`, `TermsScreen.tsx`, `KvkkScreen.tsx` | T6.4 |
| `settings/delete-account.tsx` | `settings/screens/DeleteAccountScreen.tsx` | T6.5 |
| `settings/export-data.tsx` | `settings/screens/ExportDataScreen.tsx` | T6.6 |

### 1.8 Adlandırma
- **Frontend:** Screen `PascalCaseScreen.tsx`, bileşen `PascalCase.tsx`, hook `useCamelCase.ts`, servis `PascalCaseService.ts`, repository `PascalCaseRepository.ts`, API istemcisi `kebab-case.client.ts`, domain `kebab-case.ts`.
- **Backend:** `kebab-case.route.ts`, `kebab-case.service.ts`, `kebab-case.repository.ts`, `kebab-case.provider.ts`; fonksiyon klasörleri `kebab-case`.
- **Test:** test ettiği dosyanın yanında `<dosya>.test.ts(x)`; backend'de `tests/<ad>.test.ts`.

### 1.9 Boyut sınırları (ESLint `max-lines` ile zorlanır)
| Dosya türü | Üst sınır |
|---|---|
| `app/**` route dosyası | 30 satır |
| Backend `index.ts` | 25 satır |
| Backend `*.route.ts` | 80 satır |
| Screen | 150 satır |
| Component | 150 satır |
| Service / hook | 250 satır |

Sınırı aşan dosya bölünür; istisna gerekiyorsa gerekçesiyle `eslint-disable` yorumu ve PR açıklaması zorunludur.

### 1.10 Yeni endpoint ekleme kontrol listesi
**Frontend ekranı:**
1. `app/<yol>.tsx` → yalnızca parametre okuma + `<XScreen />`.
2. `src/features/<feature>/screens/XScreen.tsx` → bileşenleri birleştirir.
3. Alt parçalar `components/` altında ayrı dosyalar.
4. Durum ve servis çağrıları `hooks/useX.ts` içinde.
5. İş mantığı `services/XService.ts` içinde; saf hesaplar `src/domain` altında.
6. Screen, hook, servis ve domain için ayrı testler. §1.7 tablosuna satır eklenir.

**Backend endpoint'i:**
1. `functions/<fonksiyon>/routes/<ad>.route.ts` → doğrula, servisi çağır, yanıtla.
2. `services/<ad>.service.ts` → iş mantığı, bağımlılıklar parametreyle.
3. DB erişimi `repositories/`, dış API `providers/` altında.
4. `index.ts` içinde route kaydı (tek satır).
5. Servis için mock'lu birim testi, route için istek → yanıt testi (servis stub'lanmış).
6. `src/data/api/<fonksiyon>.client.ts` güncellenir. §1.6 tablosuna satır eklenir.

---

## Güncel Durum (her görev sonunda güncellenir)
- **Son güncelleme**: 2026-10-24
- **Tamamlanan**: — (sıfırdan başlangıç)
- **Devam eden**: T0.1 (iskelet dosyaları oluşturuldu; Expo Go ile iOS/Android doğrulaması ve repo ayarları bekliyor)
- **Sıradaki görev**: T0.1
- **Tasarım kararı**: Renk/tipografi değerleri Claude Designer çıktısına göre `src/theme/*.ts` dosyalarına işlenecektir.

---

## Açık Kararlar
- **K1** Pro fiyatı (TL karşılığı, aylık/yıllık) ve ücretsiz kovan limiti (varsayım: 5 kovan). → T6.1'den önce.
- **K2** Bundle ID / package name'deki şirket adı, Apple Developer ve Google Play hesap türü. → T0.5'ten önce.
- **K3** Open-Meteo ticari abonelik planı (veya MET Norway Locationforecast yedek adaptörü). → T7.7'den önce.
- **K4** KVKK yurt dışına aktarım (Supabase AB bölgesi) için hukuki görüş. → T6.4'ten önce.
- **K5** Beta arıcı grubu (en az 12 kişi). → T4.3 ve T7.6'dan önce.

---

## Faz Özeti
| Faz | Ad | Görev |
|---|---|---|
| 0 | Proje Kurulumu ve Modüler Temel | 8 |
| 1 | Veri Katmanı, Modüler Senkron ve Kimlik | 9 |
| 2 | Arılık, Kovan, Kraliçe, Taşıma, QR | 8 |
| 3 | Saha Denetimi ve Modüler Form Ekranları | 7 |
| 4 | Referans İçerik ve Takvim Motoru | 8 |
| 5 | Hava Durumu Servisleri ve Bildirimler | 7 |
| 6 | Abonelik, Hukuki, Hesap ve Rota Yönetimi | 6 |
| 7 | Kalite, Beta ve Eş Zamanlı Yayın | 8 |
| | **Toplam** | **61** |

---

## Faz 0: Proje Kurulumu ve Modüler Temel

### Görev T0.1: Expo projesi, modüler klasör iskeleti ve repo
- **Açıklama**: `arici-kovan-takip/` içinde TypeScript strict modunda Expo Router projesi açılır. §1.3 ve §1.5'teki klasör iskeleti boş `.gitkeep` dosyalarıyla kurulur. Private GitHub reposu açılır.
- **Dosyalar**: `app/_layout.tsx`, `app/(auth)/_layout.tsx`, `app/(tabs)/_layout.tsx`, `app/(tabs)/index.tsx`, `src/features/home/screens/HomeScreen.tsx`, `tsconfig.json`, `.gitignore`, `.gitattributes`, `README.md`, `CLAUDE.md`, `TODO.md`
- **Bağımlılıklar**: Yok
- **Kabul Kriterleri**:
  - [ ] `strict` ve `noUncheckedIndexedAccess` açık; `@/` yol takma adı `src/`'yi gösterir
  - [ ] `app/(tabs)/index.tsx` yalnızca `<HomeScreen />` render eder; ekran içeriği `src/features/home/screens/` altındadır
  - [ ] Klasör iskeleti §1.3 ve §1.5 ile birebir aynıdır
  - [ ] `.gitignore` şunları içerir: `.env*.local`, `supabase/.temp/`, `supabase/.branches/`, `ios/`, `android/`, imza/anahtar dosyaları (`*.jks`, `*.keystore`, `*.p8`, `*.p12`, `*.mobileprovision`, `credentials.json`)
  - [ ] `.gitattributes` satır sonlarını LF'e sabitler
  - [ ] Repo private; secret scanning ve push protection açık; `main` dalında force-push yasak
  - [ ] Uygulama Expo Go ile Android'de ve iOS'ta açılır (development build T0.5'te)

### Görev T0.2: Kod kalitesi ve katman import kuralları
- **Açıklama**: ESLint (flat config), Prettier, husky + lint-staged kurulur. §1.2 ve §1.4 tablolarındaki bağımlılık yönleri `eslint-plugin-boundaries` ile, §1.9 boyut sınırları `max-lines` ile zorlanır. Kurallar hem `src/`+`app/` hem `supabase/functions/` için geçerlidir.
- **Dosyalar**: `eslint.config.js`, `.prettierrc`, `.husky/pre-commit`, `package.json` (`lint`, `format`, `prepare` script'leri), `docs/lint-violations/` (yalnızca doğrulama için, commit'lenmez)
- **Bağımlılıklar**: T0.1
- **Kabul Kriterleri**:
  - [ ] Aşağıdaki her ihlal için örnek dosya lint hatası verir:
    - `app/**` → servis, hook, repository veya bileşen importu (yalnızca Screen serbest)
    - Component → servis veya repository importu
    - Hook → repository veya `data/db` importu
    - `src/domain/**` → React, React Native, Expo, `data/**` veya `services/**` importu
    - Backend `routes/**` → `repositories/**`, `providers/**` veya `_shared/db` importu
    - Backend `services/**` → `_shared/http` importu (`Request`/`Response` bağımlılığı)
    - `_shared/**` → herhangi bir fonksiyon klasöründen import
  - [ ] §1.9 boyut sınırları aşıldığında lint hatası verir
  - [ ] Commit öncesi lint + format otomatik çalışır; repo klonlandığında hook'lar `prepare` ile kurulur

### Görev T0.3: Test altyapısı (frontend + backend)
- **Açıklama**: Jest iki proje olarak kurulur: `unit` (saf Node; `src/domain`, `src/lib`, servisler, repository'ler) ve `ui` (`jest-expo` + React Native Testing Library; bileşen, Screen, hook). Edge Function'lar için `deno test` kurulur. `Clock` soyutlaması eklenir.
- **Dosyalar**: `jest.config.js`, `src/lib/clock.ts`, `src/lib/clock.test.ts`, `src/test-utils/render.tsx`, `supabase/functions/deno.json`, `supabase/functions/_shared/clock.ts`
- **Bağımlılıklar**: T0.1
- **Kabul Kriterleri**:
  - [ ] Servisler mock bağımlılıklarla saf Node ortamında test edilebilir (örnek servis testi)
  - [ ] Bileşen ve Screen'ler RNTL ile izole render edilip test edilebilir (örnek test)
  - [ ] `Clock`, `systemClock` ve test için `createFixedClock` mevcut; servislere enjekte edilebilir
  - [ ] Kapsam eşikleri: `src/domain` ≥ %90, servisler ≥ %80 satır; eşik altında `npm run test:coverage` hata verir
  - [ ] `npm run test:functions` → `deno test` ile backend testlerini çalıştırır

### Görev T0.4: Supabase ortamları ve modüler Edge Function şablonu
- **Açıklama**: Supabase yerel ortamı ve uzak `dev`/`prod` projeleri (Frankfurt, `eu-central-1`) kurulur. `_shared/` altyapısı ve şablon görevi gören `health` fonksiyonu §1.4 katmanlarıyla yazılır.
- **Dosyalar**: `supabase/config.toml`, `supabase/migrations/<zaman>_base_extensions.sql`, `supabase/tests/database/base_extensions_test.sql`, `supabase/functions/_shared/http/{router,response,errors,cors}.ts`, `_shared/validation/parse.ts`, `_shared/db/client.ts`, `_shared/config.ts`, `_shared/observability/logger.ts`, `supabase/functions/health/index.ts`, `health/routes/health.route.ts`, `health/services/health.service.ts`, `health/tests/health.service.test.ts`, `health/tests/health.route.test.ts`, `.env.example`
- **Bağımlılıklar**: T0.1, T0.3
- **Kabul Kriterleri**:
  - [ ] `health/index.ts` yalnızca router kurar ve `health.route.ts`'yi kaydeder
  - [ ] `health.route.ts` iş mantığı içermez; `health.service.ts`'yi çağırır ve yanıtı `_shared/http/response.ts` ile döner
  - [ ] Servis testi (mock `Clock`/DB ping) ve route testi (stub servis) `deno test` ile geçer
  - [ ] Hatalar `_shared/http/errors.ts` ile tutarlı JSON biçiminde döner
  - [ ] pgTAP testleri ve gerekli eklentiler etkin; `npm run db:start|db:stop|db:reset|db:test` çalışır
  - [ ] Yerel, `dev` ve `prod`'da `GET /health` HTTP 200 döner
  - [ ] Bağlantı bilgileri yalnızca git'e girmeyen `.env.local` içinde; repoda değersiz `.env.example`

### Görev T0.5: EAS yapılandırması ve mağaza hesapları
- **Açıklama**: `eas.json` içinde `development`, `preview` ve `production` profilleri tanımlanır. Ortama göre değişen ayarlar `app.config.ts` içinde okunur.
- **Dosyalar**: `eas.json`, `app.config.ts`
- **Bağımlılıklar**: T0.1, K2
- **Kabul Kriterleri**:
  - [ ] Üç profil için EAS Build başarılı
  - [ ] Development build iOS ve Android'de açılıyor
  - [ ] Ortam değişkenleri ve servis anahtarları EAS secrets üzerinde; repoda gerçek değer yok

### Görev T0.6: Modüler CI hattı
- **Açıklama**: GitHub Actions iş akışları; her kontrol bağımsız bir job olarak koşar. `prod` ortamına deploy manuel onaya bağlıdır.
- **Dosyalar**: `.github/workflows/ci.yml`, `.github/workflows/deploy-functions.yml`, `.github/pull_request_template.md`
- **Bağımlılıklar**: T0.2, T0.3, T0.4, T0.5
- **Kabul Kriterleri**:
  - [ ] Ayrı job'lar: `lint`, `typecheck`, `test-unit`, `test-ui`, `test-functions` (deno), `test-db` (pgTAP)
  - [ ] Her job sonucu PR'da ayrı raporlanır; `main`'e merge için tümünün geçmesi zorunlu
  - [ ] GitHub Environments: `dev` (otomatik), `prod` (required reviewer)
  - [ ] PR şablonunda "iOS'ta doğrulandı / Android'de doğrulandı / TODO.md güncellendi" kutucukları var

### Görev T0.7: Hata izleme ve modüler config yönetimi
- **Açıklama**: Sentry React Native SDK'sı kurulur. Ortam değişkenleri tek bir doğrulanmış config modülünden okunur. Hatalar katmanına göre etiketlenir.
- **Dosyalar**: `src/lib/config.ts`, `src/lib/observability/sentry.ts`, `src/lib/observability/withServiceErrors.ts`, `src/components/ui/ErrorBoundary/ErrorBoundary.tsx`, `supabase/functions/_shared/observability/logger.ts` (genişletme)
- **Bağımlılıklar**: T0.5
- **Kabul Kriterleri**:
  - [ ] `config.ts` ortam değişkenlerini zod ile doğrular; eksik değerde açılışta anlaşılır hata verir
  - [ ] Sentry'de `layer` etiketi (`screen` / `service` / `repository`) ve `feature` etiketi ile filtreleme yapılabilir
  - [ ] Her rota grubu `ErrorBoundary` ile sarılı
  - [ ] Backend log'ları `function` ve `route` alanlarıyla yapılandırılmış JSON olarak yazılır

### Görev T0.8: Tasarım temeli, i18n ve ayrık saha bileşenleri
- **Açıklama**: Tema, i18n ve her biri kendi klasöründe duran saha modu bileşenleri oluşturulur.
- **Dosyalar**: `src/theme/{colors,spacing,typography,radius,index}.ts`, `src/i18n/index.ts`, `src/i18n/tr.json`, `src/lib/format.ts`, `src/components/ui/<Ad>/<Ad>.tsx` + `<Ad>.test.tsx` — AppText, Button, Card, ListItem, Stepper, SegmentedChoice, Chip, BottomSheet, EmptyState, OfflineBanner
- **Bağımlılıklar**: T0.1, T0.3
- **Kabul Kriterleri**:
  - [ ] Her bileşen kendi dosyasında, tek sorumlulukta ve yalnızca props ile çalışır
  - [ ] Metinler `tr.json`'dan okunur; sabit Türkçe metin yoktur
  - [ ] Dokunma hedefleri ≥ 56 dp
  - [ ] Her bileşenin RNTL rol tabanlı testi var

---

## Faz 1: Veri Katmanı, Modüler Senkron ve Kimlik

### Görev T1.1: Domain varlıkları ve modüler zod şemaları
- **Açıklama**: Her varlık ve zod şeması ayrı dosyadadır. Ortak değer nesneleri (ID, zaman damgası, senkron meta alanları) ayrı tutulur.
- **Dosyalar**: `src/domain/shared/{ids,timestamps,sync-meta}.ts`, `src/domain/entities/{business,apiary,hive,queen,inspection,treatment,feeding,harvest,relocation,task}.ts`, `src/domain/entities/index.ts`, her biri için `<varlık>.test.ts`
- **Bağımlılıklar**: T0.3
- **Kabul Kriterleri**:
  - [ ] Her varlık kendi dosyasında; tip `z.infer` ile şemadan türetilir
  - [ ] Her şemanın geçerli/geçersiz örneklerle ayrı test dosyası var
  - [ ] `src/domain` içinde UI veya veri katmanı importu yok (lint geçer)

### Görev T1.2: Supabase şeması ve `sync` Edge Function'ı
- **Açıklama**: Tablolar ayrı migration dosyalarında oluşturulur. LWW birleştirmesi atomik olsun diye SQL fonksiyonlarında (`sync_apply_changes`, `sync_changes_since`) yapılır; istemci bunlara `sync` Edge Function'ının iki route'u üzerinden ulaşır.
- **Dosyalar**: `supabase/migrations/<zaman>_create_<tablo>.sql` (tablo başına), `<zaman>_sync_functions.sql`, `supabase/tests/database/sync_test.sql`, `supabase/functions/sync/index.ts`, `sync/routes/push.route.ts`, `sync/routes/pull.route.ts`, `sync/services/sync-push.service.ts`, `sync/services/sync-pull.service.ts`, `sync/repositories/sync.repository.ts`, `sync/tests/*.test.ts`
- **Bağımlılıklar**: T0.4, T1.1
- **Kabul Kriterleri**:
  - [ ] `POST /sync/push` ve `GET /sync/pull` ayrı route dosyalarındadır; ikisi de girdiyi zod ile doğrular
  - [ ] Parti bölme, sürüm kontrolü ve hata eşleme servistedir; SQL çağrısı yalnızca `sync.repository.ts`'dedir
  - [ ] LWW mantığı pgTAP ile; servisler ve route'lar `deno test` ile test edilmiştir

### Görev T1.3: RLS politikaları
- **Açıklama**: Her tablo için işletme bazlı politikalar ayrı migration dosyalarında yazılır. Kullanıcı istekleri Edge Function'larda kullanıcı JWT'li istemciyle yürütülür (service-role değil).
- **Dosyalar**: `supabase/migrations/<zaman>_rls_<tablo>.sql` (tablo başına), `supabase/tests/database/rls_<tablo>_test.sql`
- **Bağımlılıklar**: T1.2
- **Kabul Kriterleri**:
  - [ ] İşletmeler arası veri izolasyonu her tablo için pgTAP ile doğrulanmış
  - [ ] `sync` fonksiyonu `_shared/db/client.ts`'deki kullanıcı istemcisini kullanır

### Görev T1.4: Yerel SQLite şeması (Drizzle)
- **Açıklama**: Drizzle şeması her tablo için ayrı dosyada tanımlanır; outbox tablosu dahil.
- **Dosyalar**: `src/data/db/client.ts`, `src/data/db/schema/{business,apiaries,hives,queens,inspections,treatments,feedings,harvests,relocations,tasks,outbox,sync_state}.ts`, `src/data/db/schema/index.ts`, `drizzle.config.ts`, `drizzle/` (üretilen migration'lar)
- **Bağımlılıklar**: T1.1, T0.1
- **Kabul Kriterleri**:
  - [ ] Her tablo kendi dosyasında; `schema/index.ts` tek export noktası
  - [ ] Uygulama açılışında yerel migration'lar otomatik uygulanır
  - [ ] `useLiveQuery` ile canlı dinleme çalışır (örnek test)

### Görev T1.5: Repository katmanı
- **Açıklama**: Her varlık için ayrı repository. Yazma işlemi ve outbox kaydı tek transaction'dadır. Okumalar `watch*` metotlarıyla canlı sorgu olarak sunulur.
- **Dosyalar**: `src/data/repositories/{Business,Apiary,Hive,Queen,Inspection,Treatment,Feeding,Harvest,Relocation,Task,Outbox}Repository.ts` + her biri için `.test.ts`
- **Bağımlılıklar**: T1.4
- **Kabul Kriterleri**:
  - [ ] CRUD ve outbox işlemleri tek transaction içinde atomik (hata durumunda ikisi de geri alınır)
  - [ ] Repository'ler yalnızca `data/db` ve domain tiplerini import eder
  - [ ] Testler Node SQLite sürücüsüyle bellek içi veritabanında koşar

### Görev T1.6: Senkron motoru (istemci)
- **Açıklama**: Push, pull ve koordinasyon ayrı servislerdir. Backend ile iletişim tek bir API istemcisi üzerindendir. Senkron durumu reaktif bir store'da tutulur.
- **Dosyalar**: `src/data/supabase/client.ts`, `src/data/api/sync.client.ts`, `src/services/sync/{SyncPushService,SyncPullService,SyncCoordinator}.ts`, `src/services/sync/syncStore.ts`, her biri için `.test.ts`
- **Bağımlılıklar**: T1.2, T1.3, T1.5
- **Kabul Kriterleri**:
  - [ ] Senkron iş mantığı UI bileşenlerinden tamamen soyutlanmış; hiçbir bileşen senkron servislerini doğrudan import etmez
  - [ ] Kuyruk yönetimi, yeniden deneme (üstel bekleme) ve LWW çakışma çözümü testli
  - [ ] Ağ geldiğinde/uygulama öne geldiğinde senkron otomatik tetiklenir

### Görev T1.7: Kimlik doğrulama servisi ve ekranları
- **Açıklama**: Telefon + OTP ile giriş. Oturum yönetimi `AuthService`'te, ekranlar ve alt bileşenler ayrı dosyalarda.
- **Dosyalar**: `src/services/auth/AuthService.ts`, `src/services/auth/sessionStorage.ts`, `app/(auth)/login.tsx`, `app/(auth)/otp-verify.tsx`, `src/features/auth/screens/{LoginScreen,OtpVerifyScreen}.tsx`, `src/features/auth/components/{PhoneInput,OtpCodeInput,ResendCodeButton}.tsx`, `src/features/auth/hooks/{useLogin,useOtpVerify}.ts`
- **Bağımlılıklar**: T0.5, T0.8, T1.4
- **Kabul Kriterleri**:
  - [ ] `login.tsx` ve `otp-verify.tsx` ayrı, ≤ 30 satırlık rota dosyalarıdır
  - [ ] Kimlik mantığı UI'da değil `AuthService` içindedir; oturum güvenli depolamada tutulur
  - [ ] Oturum yoksa `(tabs)` grubuna erişim `(auth)`'a yönlendirilir

### Görev T1.8: Onboarding akışı ve ayrık adım ekranları
- **Açıklama**: İşletme adı, ilk arılık ve bildirim izni adımları ayrı rota dosyalarıdır. İlerleme `OnboardingService` ile saklanır.
- **Dosyalar**: `app/onboarding/{business-name,first-apiary,notifications}.tsx`, `src/features/onboarding/screens/{BusinessNameScreen,FirstApiaryScreen,NotificationPermissionScreen}.tsx`, `src/features/onboarding/components/OnboardingProgress.tsx`, `src/features/onboarding/hooks/useOnboardingStep.ts`, `src/features/onboarding/services/OnboardingService.ts`
- **Bağımlılıklar**: T1.6, T1.7
- **Kabul Kriterleri**:
  - [ ] Her adım ayrı rota ve ayrı Screen dosyasıdır
  - [ ] Akış yarım kalırsa uygulama kaldığı adımdan devam eder

### Görev T1.9: Ayarlar ana ekranı, senkron durum ekranı ve banner
- **Açıklama**: Ekranın üstünde duran `SyncBanner` ile detayları gösteren senkron durum ekranı ayrı ayrı kodlanır. Ayarlar sekmesinin iskeleti kurulur.
- **Dosyalar**: `app/(tabs)/settings.tsx`, `app/settings/sync-status.tsx`, `src/features/settings/screens/{SettingsScreen,SyncStatusScreen}.tsx`, `src/features/settings/components/{SyncBanner,SyncQueueList,SettingsMenuItem}.tsx`, `src/features/settings/hooks/useSyncStatus.ts`
- **Bağımlılıklar**: T1.6, T0.8
- **Kabul Kriterleri**:
  - [ ] Senkron durumu `syncStore` → `useSyncStatus` → bileşen yoluyla reaktif aktarılır
  - [ ] `SyncBanner` yalnızca props alır; store'a doğrudan bağlı değildir

---

## Faz 2: Arılık, Kovan, Kraliçe, Taşıma, QR

### Görev T2.1: Konum izni servisi ve rıza bileşeni
- **Açıklama**: İzin kontrolü ve koordinat alma `LocationService`'te; açık rıza ekranı ayrı bir bileşendir.
- **Dosyalar**: `src/services/location/LocationService.ts`, `src/features/apiary/components/LocationConsentModal.tsx`, `src/features/apiary/hooks/useLocationPermission.ts`
- **Bağımlılıklar**: T1.8
- **Kabul Kriterleri**:
  - [ ] İzin kontrolü ve koordinat alma UI'dan bağımsız, mock'lanabilir bir servistir
  - [ ] Rıza reddedilirse manuel konum girişi mümkündür

### Görev T2.2: Arılık yönetimi
- **Açıklama**: Liste, ekleme, detay ve düzenleme ekranları ayrı rotalardır; iş mantığı `ApiaryService`'tedir.
- **Dosyalar**: `app/(tabs)/apiaries.tsx`, `app/apiaries/new.tsx`, `app/apiaries/[id]/index.tsx`, `app/apiaries/[id]/edit.tsx`, `src/features/apiary/screens/{ApiaryListScreen,ApiaryCreateScreen,ApiaryDetailScreen,ApiaryEditScreen}.tsx`, `src/features/apiary/components/{ApiaryForm,ApiaryCard,ClimateProfilePicker}.tsx`, `src/features/apiary/hooks/{useApiaries,useApiaryForm}.ts`, `src/features/apiary/services/ApiaryService.ts`
- **Bağımlılıklar**: T2.1, T4.1
- **Kabul Kriterleri**:
  - [ ] Her rota kendi dosyasındadır; ekleme ve düzenleme aynı `ApiaryForm` bileşenini kullanır
  - [ ] Doğrulama domain şemasıyla servis katmanında yapılır

### Görev T2.3: Kovan oluşturma (tekli ve toplu)
- **Açıklama**: Tekli ve toplu ekleme mantığı `HiveService`'te; iki ekran ayrı rotadır.
- **Dosyalar**: `app/hives/new.tsx`, `app/hives/bulk-new.tsx`, `src/features/hive/screens/{HiveCreateScreen,HiveBulkCreateScreen}.tsx`, `src/features/hive/components/{HiveForm,BulkHiveRangeInput}.tsx`, `src/features/hive/hooks/{useHiveForm,useBulkHiveCreate}.ts`, `src/features/hive/services/HiveService.ts`, `src/domain/hive/hive-numbering.ts`
- **Bağımlılıklar**: T1.5, T2.2
- **Kabul Kriterleri**:
  - [ ] Tekli ve toplu ekleme ekranları birbirinden bağımsız dosyalardır
  - [ ] Toplu numaralandırma saf domain fonksiyonudur ve testlidir
  - [ ] Toplu ekleme tek transaction'da yapılır

### Görev T2.4: Kovan listesi, arama ve toplu işlemler
- **Açıklama**: Liste ekranı, filtre barı, kovan kartı ve toplu eylem çubuğu ayrı dosyalardır.
- **Dosyalar**: `app/hives/index.tsx`, `src/features/hive/screens/HiveListScreen.tsx`, `src/features/hive/components/{HiveFilterBar,HiveCard,BulkActionBar}.tsx`, `src/features/hive/hooks/{useHiveList,useHiveSelection}.ts`, `src/domain/hive/hive-filter.ts`
- **Bağımlılıklar**: T2.3, T0.8
- **Kabul Kriterleri**:
  - [ ] Filtreleme mantığı saf domain fonksiyonudur
  - [ ] 200 kovanlık sanal liste performans kaybı olmadan render edilir (`HiveCard` memo'lu)

### Görev T2.5: Kraliçe takibi
- **Açıklama**: Kraliçe rengi ve yaşı saf domain hesaplarıdır; geçmiş ekranı ve rozet ayrı dosyalardır.
- **Dosyalar**: `app/hives/[id]/queen.tsx`, `src/domain/queen/{queen-color,queen-age}.ts`, `src/features/queen/screens/QueenHistoryScreen.tsx`, `src/features/queen/components/{QueenBadge,QueenForm,QueenHistoryItem}.tsx`, `src/features/queen/hooks/useQueenHistory.ts`, `src/features/queen/services/QueenService.ts`
- **Bağımlılıklar**: T2.3
- **Kabul Kriterleri**:
  - [ ] Renk/yaş hesabı `Clock` enjekte edilerek testli
  - [ ] Kraliçe kartı, formu ve rozeti ayrı bileşenlerdir

### Görev T2.6: Kovan taşıma
- **Açıklama**: Tek ve toplu taşıma aynı ekran üzerinden; iş mantığı `HiveRelocationService`'tedir.
- **Dosyalar**: `app/hives/relocate.tsx`, `src/features/hive/screens/HiveRelocateScreen.tsx`, `src/features/hive/components/{RelocationTargetPicker,RelocationSummary}.tsx`, `src/features/hive/hooks/useRelocation.ts`, `src/features/hive/services/HiveRelocationService.ts`
- **Bağımlılıklar**: T2.3, T2.4
- **Kabul Kriterleri**:
  - [ ] Tek ve toplu taşıma tek bir Screen üzerinden yürür; taşıma kaydı ve kovan güncellemesi atomiktir

### Görev T2.7: QR etiket PDF üretimi
- **Açıklama**: PDF çizim mantığı servistedir; önizleme ekranı ayrı rotadır.
- **Dosyalar**: `app/hives/qr-print.tsx`, `src/features/hive/screens/QrPrintScreen.tsx`, `src/features/hive/components/{QrLabelPreview,LabelLayoutPicker}.tsx`, `src/features/hive/hooks/useQrPrint.ts`, `src/features/hive/services/PdfExportService.ts`, `src/domain/hive/qr-payload.ts`
- **Bağımlılıklar**: T2.3
- **Kabul Kriterleri**:
  - [ ] PDF üretimi UI render işleminden ayrı servis dosyasındadır
  - [ ] QR içeriği (deep link) saf domain fonksiyonuyla üretilir ve testlidir

### Görev T2.8: QR tarayıcı ve yönlendirme
- **Açıklama**: Kamera ekranı ve QR → rota çözümleyicisi ayrı dosyalardır.
- **Dosyalar**: `app/scanner.tsx`, `src/features/scanner/screens/ScannerScreen.tsx`, `src/features/scanner/components/{CameraView,ScanOverlay}.tsx`, `src/features/scanner/hooks/useQrScan.ts`, `src/services/navigation/DeepLinkRoutingService.ts`
- **Bağımlılıklar**: T2.7, T1.4
- **Kabul Kriterleri**:
  - [ ] Kamera görünümü ve rota çözümleyici servis ayrı dosyalardır; çözümleyici testli
  - [ ] Bilinmeyen/başka işletmeye ait QR için anlaşılır hata gösterilir

---

## Faz 3: Saha Denetimi ve Modüler Form Ekranları

### Görev T3.1: Hızlı denetim formu
- **Açıklama**: Denetim ekranı tek parça yazılmaz; her form grubu ayrı bileşendir. Form durumu merkezi hook'ta, kayıt `InspectionService`'tedir.
- **Dosyalar**: `app/inspections/[hiveId]/new.tsx`, `src/features/inspection/screens/InspectionCreateScreen.tsx`, `src/features/inspection/components/{FrameCounterSection,QueenStatusSection,VarroaCalculatorSection,NotesSection}.tsx`, `src/features/inspection/hooks/useInspectionForm.ts`, `src/features/inspection/services/InspectionService.ts`, `src/domain/inspection/varroa-rate.ts`
- **Bağımlılıklar**: T2.5, T0.8
- **Kabul Kriterleri**:
  - [ ] Her form grubu izole bileşendir ve yalnızca props alır
  - [ ] Form durumu ve validasyonu `useInspectionForm` üzerinden yönetilir
  - [ ] Varroa oranı hesabı saf domain fonksiyonudur

### Görev T3.2: Toplu denetim oturumu
- **Açıklama**: Saha sihirbazı ve oturum özeti ayrı rotalardır. Oturum durumu servis/store katmanındadır.
- **Dosyalar**: `app/inspections/session.tsx`, `app/inspections/summary.tsx`, `src/features/inspection/screens/{InspectionSessionScreen,InspectionSummaryScreen}.tsx`, `src/features/inspection/components/{SessionProgressBar,SessionHiveNavigator,SessionSummaryList}.tsx`, `src/features/inspection/hooks/useInspectionSession.ts`, `src/features/inspection/services/InspectionSessionService.ts`, `src/features/inspection/services/inspectionSessionStore.ts`
- **Bağımlılıklar**: T3.1, T2.8, T2.4
- **Kabul Kriterleri**:
  - [ ] Oturum mantığı bileşen state'inde değil servis/store katmanındadır
  - [ ] Uygulama kapanıp açılsa da oturum kaldığı kovandan devam eder

### Görev T3.3: İlaçlama kaydı ve arınma süresi
- **Açıklama**: Arınma süresi hesabı saf domain fonksiyonu, kayıt `TreatmentService`, ürün seçimi ayrı bileşendir.
- **Dosyalar**: `app/treatments/new.tsx`, `src/features/treatment/screens/TreatmentCreateScreen.tsx`, `src/features/treatment/components/{TreatmentProductPicker,TreatmentForm}.tsx`, `src/features/treatment/hooks/useTreatmentForm.ts`, `src/features/treatment/services/TreatmentService.ts`, `src/domain/treatment/withdrawal-period.ts`
- **Bağımlılıklar**: T2.4, T4.1
- **Kabul Kriterleri**:
  - [ ] Hesaplama domain'de, kayıt serviste, form elemanları ayrı bileşenlerdedir

### Görev T3.4: Besleme kaydı
- **Açıklama**: Ekran, besin tipi seçici ve servis ayrı dosyalardır.
- **Dosyalar**: `app/feedings/new.tsx`, `src/features/feeding/screens/FeedingCreateScreen.tsx`, `src/features/feeding/components/{FeedingTypeSelector,FeedingForm}.tsx`, `src/features/feeding/hooks/useFeedingForm.ts`, `src/features/feeding/services/FeedingService.ts`
- **Bağımlılıklar**: T2.4
- **Kabul Kriterleri**:
  - [ ] Ekran, servis ve seçim bileşeni ayrı dosyalardır; çoklu kovana tek seferde kayıt yapılabilir

### Görev T3.5: Bal sağımı ve arınma çakışma uyarısı
- **Açıklama**: Çakışma kontrolü saf domain fonksiyonudur; uyarı ayrı bileşendir.
- **Dosyalar**: `app/harvests/new.tsx`, `src/features/harvest/screens/HarvestCreateScreen.tsx`, `src/features/harvest/components/{HarvestForm,WithdrawalConflictAlert}.tsx`, `src/features/harvest/hooks/useHarvestForm.ts`, `src/features/harvest/services/HarvestService.ts`, `src/domain/harvest/withdrawal-conflict.ts`
- **Bağımlılıklar**: T3.3
- **Kabul Kriterleri**:
  - [ ] Çakışma kontrolü saf ve testli; uyarı diyaloğu ayrı bileşendir

### Görev T3.6: Kovan detayı ve zaman çizelgesi
- **Açıklama**: Detay ekranı; özet kartı, zaman çizelgesi listesi ve olay tipi başına öğe bileşenlerinden oluşur.
- **Dosyalar**: `app/hives/[id]/index.tsx`, `src/features/hive/screens/HiveDetailScreen.tsx`, `src/features/hive/components/{HiveOverviewCard,HiveTimelineList,HiveQuickActions}.tsx`, `src/features/hive/components/timeline/{InspectionTimelineItem,TreatmentTimelineItem,FeedingTimelineItem,HarvestTimelineItem,RelocationTimelineItem,QueenTimelineItem}.tsx`, `src/features/hive/hooks/useHiveTimeline.ts`, `src/features/hive/services/HiveTimelineService.ts`
- **Bağımlılıklar**: T3.1, T3.3, T3.4, T3.5, T2.6
- **Kabul Kriterleri**:
  - [ ] Zaman çizelgesi öğeleri olay tipine göre ayrı bileşenlerde render edilir
  - [ ] Olayların birleştirilmesi/sıralanması serviste yapılır

### Görev T3.7: Arılık operasyonel özet paneli
- **Açıklama**: Panel bağımsız widget'ların birleşimidir; her widget'ın kendi hook'u vardır.
- **Dosyalar**: `app/apiaries/[id]/dashboard.tsx`, `src/features/apiary/screens/ApiaryDashboardScreen.tsx`, `src/features/apiary/components/{StatCardGrid,AlertSection,WeatherCardSlot}.tsx`, `src/features/apiary/hooks/{useApiaryStats,useApiaryAlerts}.ts`, `src/features/apiary/services/ApiaryStatsService.ts`
- **Bağımlılıklar**: T3.6
- **Kabul Kriterleri**:
  - [ ] Paneldeki her kart bağımsız bileşen ve hook'a sahiptir
  - [ ] Hava kartı yeri (`WeatherCardSlot`) T5.2'deki `WeatherWidget` ile doldurulacak şekilde hazırdır

---

## Faz 4: Referans İçerik ve Takvim Motoru

### Görev T4.1: Referans içerik servisi (backend + istemci)
- **Açıklama**: Referans tablolar sürümlü olarak `reference-content` Edge Function'ından sunulur; istemci sürüm kontrolüyle yerel önbelleğe alır.
- **Dosyalar**: `supabase/migrations/<zaman>_create_reference_tables.sql`, `supabase/functions/reference-content/index.ts`, `reference-content/routes/{manifest,content}.route.ts`, `reference-content/services/{reference-manifest,reference-content}.service.ts`, `reference-content/repositories/reference.repository.ts`, `reference-content/tests/*.test.ts`, `src/data/api/reference-content.client.ts`, `src/data/db/schema/reference.ts`, `src/services/reference/ReferenceContentService.ts`
- **Bağımlılıklar**: T1.3, T1.6
- **Kabul Kriterleri**:
  - [ ] Manifest ve içerik uç noktaları ayrı route dosyalarıdır
  - [ ] İstemci yalnızca sürümü değişen tabloları indirir; çevrimdışı önbellekten çalışır

### Görev T4.2: İlk içerik derlemesi
- **Açıklama**: İklim profilleri, nektar akışları ve ilaç verileri alan başına ayrı seed dosyalarındadır.
- **Dosyalar**: `supabase/seed/reference/{climate_profiles,nectar_flows,treatment_products}.sql`, `src/domain/reference/{climate-profile,nectar-flow,treatment-product}.ts`
- **Bağımlılıklar**: T4.1
- **Kabul Kriterleri**:
  - [ ] Seed verileri domain şemalarıyla doğrulanır (test)
  - [ ] Her seed dosyası tek bir alanı kapsar

### Görev T4.3: İçerik geri bildirimi
- **Açıklama**: "Bu öneri bölgemde farklı" aksiyonu; bileşenler ayrı, kayıt `content-feedback` Edge Function'ı üzerinden.
- **Dosyalar**: `supabase/functions/content-feedback/index.ts`, `content-feedback/routes/feedback.route.ts`, `content-feedback/services/content-feedback.service.ts`, `content-feedback/repositories/feedback.repository.ts`, `src/data/api/content-feedback.client.ts`, `src/services/reference/ContentFeedbackService.ts`, `src/components/ui/FeedbackButton/FeedbackButton.tsx`, `src/features/calendar/components/FeedbackModal.tsx`
- **Bağımlılıklar**: T4.2, K5
- **Kabul Kriterleri**:
  - [ ] Geri bildirim formu bağımsız bileşendir ve içerik kimliğini servise iletir
  - [ ] Çevrimdışıyken gönderim kuyruğa alınır

### Görev T4.4: Modüler kural motoru
- **Açıklama**: Kural motoru çekirdeği ve her kural ayrı dosyadır; motor kayıtlı kuralları çalıştırır.
- **Dosyalar**: `src/domain/calendar/{RuleEngine,Rule,RuleContext,Recommendation}.ts`, `src/domain/calendar/rules/index.ts` (kural kaydı), `src/domain/calendar/RuleEngine.test.ts`
- **Bağımlılıklar**: T1.1, T4.1
- **Kabul Kriterleri**:
  - [ ] Kural eklemek/çıkarmak yalnızca `rules/index.ts` kaydını değiştirir (Open/Closed)
  - [ ] Motor saf ve `Clock` enjekteli; testleri mevcut

### Görev T4.5: MVP kural seti
- **Açıklama**: 13 MVP kuralı, her biri ayrı dosyada ve ayrı testle.
- **Dosyalar**: `src/domain/calendar/rules/<Ad>Rule.ts` + `<Ad>Rule.test.ts` (13 adet; ör. `SpringCheckRule`, `VarroaTreatmentRule`)
- **Bağımlılıklar**: T4.4, T4.2
- **Kabul Kriterleri**:
  - [ ] Her kural kendi dosyasında, parametrik (iklim profili/referans veriden) çalışır
  - [ ] Her kuralın sınır durumlarını kapsayan bağımsız testi var

### Görev T4.6: Görev materyalizasyon servisi
- **Açıklama**: Kural önerilerini yerel görevlerle uzlaştırır (oluştur, güncelle, tekilleştir).
- **Dosyalar**: `src/services/calendar/TaskMaterializerService.ts`, `src/services/calendar/TaskMaterializerService.test.ts`, `src/domain/calendar/task-dedup.ts`
- **Bağımlılıklar**: T4.5, T1.5, T2.6, T3.1
- **Kabul Kriterleri**:
  - [ ] Tekilleştirme saf domain fonksiyonu; servis UI'dan bağımsız
  - [ ] Kullanıcının tamamladığı/ertelediği görevler yeniden üretilmez

### Görev T4.7: Takvim ekranları
- **Açıklama**: Takvim sekmesi; günlük, haftalık, aylık ve yıllık görünümler ayrı bileşenlerdir. Görev detayı ayrı rotadır. Ana sayfa bugünün görevlerini gösterir.
- **Dosyalar**: `app/(tabs)/calendar.tsx`, `app/tasks/[id].tsx`, `src/features/calendar/screens/{CalendarScreen,TaskDetailScreen}.tsx`, `src/features/calendar/components/{CalendarDayView,CalendarWeekView,CalendarMonthView,CalendarYearView,CalendarViewSwitcher,TaskListItem}.tsx`, `src/features/calendar/hooks/{useCalendarTasks,useTaskDetail}.ts`, `src/features/calendar/services/CalendarService.ts`, `src/features/home/components/TodayTasksCard.tsx`
- **Bağımlılıklar**: T4.6, T0.8
- **Kabul Kriterleri**:
  - [ ] Her takvim görünümü ayrı bileşen dosyasıdır
  - [ ] Görev detayı bağımsız rota dosyasıdır; görev tamamla/ertele işlemleri serviste

### Görev T4.8: Sorumluluk reddi
- **Açıklama**: Metin sayfası ve onboarding onay modalı ayrı; onay kontrolü `LegalComplianceService`'te.
- **Dosyalar**: `app/legal/disclaimer.tsx`, `src/features/legal/screens/DisclaimerScreen.tsx`, `src/features/legal/components/DisclaimerApprovalModal.tsx`, `src/services/legal/LegalComplianceService.ts`
- **Bağımlılıklar**: T1.8, T4.7
- **Kabul Kriterleri**:
  - [ ] Onay sürümü ve zamanı `LegalComplianceService` ile kaydedilir; metin sürümü değişince yeniden sorulur

---

## Faz 5: Hava Durumu Servisleri ve Bildirimler

### Görev T5.1: `weather-forecast` Edge Function'ı
- **Açıklama**: Route HTTP'yi karşılar, servis önbelleği ve iş mantığını yönetir, provider sağlayıcıya bağlanır. Sağlayıcılar ortak bir arayüzü uygular.
- **Dosyalar**: `supabase/migrations/<zaman>_create_weather_cache.sql`, `supabase/functions/weather-forecast/index.ts`, `weather-forecast/routes/forecast.route.ts`, `weather-forecast/services/{forecast,forecast-cache}.service.ts`, `weather-forecast/providers/{weather-provider,open-meteo.provider}.ts`, `weather-forecast/repositories/weather-cache.repository.ts`, `weather-forecast/tests/*.test.ts`
- **Bağımlılıklar**: T0.4, T2.2
- **Kabul Kriterleri**:
  - [ ] Route, servis, provider ve repository ayrı dosyalardadır
  - [ ] Yeni sağlayıcı eklemek yalnızca yeni bir `*.provider.ts` ve kayıt satırı gerektirir; route ve servis değişmez
  - [ ] Önbellek süresi config'den okunur; testlerde provider mock'lanır

### Görev T5.2: İstemci hava servisi ve UI
- **Açıklama**: Tahminleri çeken/önbelleğe alan servis; kart bileşeni ve detay ekranı ayrıdır.
- **Dosyalar**: `src/data/api/weather-forecast.client.ts`, `src/services/weather/ClientWeatherService.ts`, `app/weather/[apiaryId].tsx`, `src/features/weather/screens/WeatherDetailScreen.tsx`, `src/features/weather/components/{WeatherWidget,HourlyForecastList,DailyForecastRow}.tsx`, `src/features/weather/hooks/useWeather.ts`
- **Bağımlılıklar**: T5.1, T1.4
- **Kabul Kriterleri**:
  - [ ] Hava kartı bağımsız bileşen; detay ayrı rota
  - [ ] Çevrimdışıyken son tahmin "güncellenme zamanı" ile gösterilir

### Görev T5.3: Hava sinyalleri ve hava kuralları
- **Açıklama**: Hava verisini kural sinyallerine çeviren servis; hava kaynaklı kurallar ayrı dosyalarda.
- **Dosyalar**: `src/domain/weather/weather-signals.ts`, `src/services/weather/WeatherSignalService.ts`, `src/domain/calendar/rules/WeatherPostponeRule.ts` (+ diğer hava kuralları ve testleri)
- **Bağımlılıklar**: T5.2, T4.5
- **Kabul Kriterleri**:
  - [ ] Sinyal hesabı saf domain fonksiyonu; hava kuralları ayrı ve testli

### Görev T5.4: Yerel bildirim planlama ve ayar ekranı
- **Açıklama**: Bildirim planlama/iptal `LocalNotificationService`'te; ayar ekranı ayrı rota.
- **Dosyalar**: `src/services/notifications/LocalNotificationService.ts`, `app/settings/notifications.tsx`, `src/features/settings/screens/NotificationSettingsScreen.tsx`, `src/features/settings/components/{NotificationToggleRow,QuietHoursPicker}.tsx`, `src/features/settings/hooks/useNotificationSettings.ts`
- **Bağımlılıklar**: T4.6, T1.8
- **Kabul Kriterleri**:
  - [ ] Planlama ve iptal mantığı ekranlardan tamamen bağımsız; görev değişince bildirim güncellenir

### Görev T5.5: Push token servisi
- **Açıklama**: Token alma istemcide, kaydetme/silme `push-tokens` Edge Function'ının iki route'unda.
- **Dosyalar**: `supabase/migrations/<zaman>_create_push_tokens.sql`, `supabase/functions/push-tokens/index.ts`, `push-tokens/routes/{register,unregister}.route.ts`, `push-tokens/services/push-token.service.ts`, `push-tokens/repositories/push-token.repository.ts`, `src/data/api/push-tokens.client.ts`, `src/services/notifications/PushNotificationService.ts`
- **Bağımlılıklar**: T0.5, T1.7
- **Kabul Kriterleri**:
  - [ ] Kayıt ve silme ayrı route dosyalarıdır
  - [ ] Token yaşam döngüsü `AuthService` olaylarına bağlı (giriş → kaydet, çıkış → sil)

### Görev T5.6: `weather-alerts` Edge Function'ı
- **Açıklama**: Cron ile tetiklenen route; eşik değerlendirme ve push gönderimi ayrı servisler.
- **Dosyalar**: `supabase/functions/weather-alerts/index.ts`, `weather-alerts/routes/run.route.ts`, `weather-alerts/services/{alert-evaluator,push-sender}.service.ts`, `weather-alerts/repositories/{alert-subscription,push-token}.repository.ts`, `weather-alerts/providers/expo-push.provider.ts`, `weather-alerts/tests/*.test.ts`, `supabase/migrations/<zaman>_schedule_weather_alerts.sql`
- **Bağımlılıklar**: T5.1, T5.5, T5.3
- **Kabul Kriterleri**:
  - [ ] Değerlendirme ve gönderim servisleri birbirinden bağımsız; ikisi de mock'larla testli
  - [ ] Route yalnızca cron gizli anahtarıyla çağrılabilir

### Görev T5.7: Arka plan görev koordinatörü
- **Açıklama**: Periyodik senkron ve takvim güncellemesini sırayla tetikleyen koordinatör.
- **Dosyalar**: `src/services/background/BackgroundTaskService.ts`, `src/services/background/backgroundTasks.ts` (görev kayıtları)
- **Bağımlılıklar**: T1.6, T4.6, T5.4
- **Kabul Kriterleri**:
  - [ ] Arka plan işleri servis çağrıları zinciri olarak yapılandırılmış; bir adımın hatası diğerlerini durdurmaz

---

## Faz 6: Abonelik, Hukuki, Hesap ve Rota Yönetimi

### Görev T6.1: RevenueCat servis katmanı
- **Açıklama**: Satın alma ve abonelik durumu `SubscriptionService` arkasında; SDK başka yerden import edilmez.
- **Dosyalar**: `src/services/subscription/SubscriptionService.ts`, `src/services/subscription/subscriptionStore.ts`
- **Bağımlılıklar**: T0.5, T1.7, K1
- **Kabul Kriterleri**:
  - [ ] RevenueCat SDK yalnızca bu servis tarafından import edilir (lint kuralı)
  - [ ] Abonelik durumu tek kaynaktan reaktif olarak okunur

### Görev T6.2: Webhook Edge Function'ı ve kota servisi
- **Açıklama**: Webhook route'u doğrular ve servise iletir; servis yetkiyi DB'de günceller. İstemcide kovan limiti `QuotaLimitService` ile kontrol edilir.
- **Dosyalar**: `supabase/migrations/<zaman>_create_entitlements.sql`, `supabase/functions/revenuecat-webhook/index.ts`, `revenuecat-webhook/routes/webhook.route.ts`, `revenuecat-webhook/services/entitlement.service.ts`, `revenuecat-webhook/repositories/entitlement.repository.ts`, `revenuecat-webhook/tests/*.test.ts`, `src/services/subscription/QuotaLimitService.ts`
- **Bağımlılıklar**: T6.1, T2.3, T1.2
- **Kabul Kriterleri**:
  - [ ] Route yalnızca imza/yetki doğrular ve veriyi servise verir; DB güncellemesi serviste (repository üzerinden)
  - [ ] Limit sunucuda da zorlanır (istemci atlansa bile `sync/push` reddeder)

### Görev T6.3: Paywall ve abonelik yönetimi
- **Açıklama**: Paywall modal rotası, abonelik detay ekranı ve fiyat kartı ayrı dosyalardır.
- **Dosyalar**: `app/paywall.tsx`, `app/settings/subscription.tsx`, `src/features/subscription/screens/{PaywallScreen,SubscriptionScreen}.tsx`, `src/features/subscription/components/{OfferingCard,FeatureComparisonList,RestorePurchasesButton}.tsx`, `src/features/subscription/hooks/{useOfferings,useSubscriptionStatus}.ts`
- **Bağımlılıklar**: T6.1, T6.2
- **Kabul Kriterleri**:
  - [ ] Paywall bağımsız rota; UI elemanları ayrı bileşenlerde
  - [ ] Satın alma geri yükleme her iki platformda çalışır

### Görev T6.4: Hukuki metin ekranları
- **Açıklama**: Her hukuki doküman ayrı rota ve ayrı Screen; metinler ortak bir görüntüleyici bileşenle gösterilir.
- **Dosyalar**: `app/legal/{privacy,terms,kvkk}.tsx`, `src/features/legal/screens/{PrivacyScreen,TermsScreen,KvkkScreen}.tsx`, `src/features/legal/components/LegalDocumentView.tsx`, `src/features/legal/content/{privacy,terms,kvkk}.tr.md`
- **Bağımlılıklar**: T2.1, T4.8, K4
- **Kabul Kriterleri**:
  - [ ] Her doküman kendi rota ve Screen dosyasında; metin içerikten ayrı dosyada

### Görev T6.5: Hesap silme
- **Açıklama**: Onay ekranı istemcide; silme sunucuda route-service ayrımıyla.
- **Dosyalar**: `app/settings/delete-account.tsx`, `src/features/settings/screens/DeleteAccountScreen.tsx`, `src/features/settings/components/DeleteAccountConfirm.tsx`, `src/data/api/delete-account.client.ts`, `src/services/auth/AccountDeletionService.ts`, `supabase/functions/delete-account/index.ts`, `delete-account/routes/delete-account.route.ts`, `delete-account/services/account-deletion.service.ts`, `delete-account/repositories/account.repository.ts`, `delete-account/tests/*.test.ts`
- **Bağımlılıklar**: T1.7, T5.5, T6.1
- **Kabul Kriterleri**:
  - [ ] Silme sunucuda route → service → repository akışıyla yürür; tüm kullanıcı verisi ve push token'ları silinir
  - [ ] İstemcide yerel veritabanı ve oturum temizlenir

### Görev T6.6: Veri dışa aktarma
- **Açıklama**: CSV derleme servisi ve filtre/indirme ekranı ayrıdır.
- **Dosyalar**: `app/settings/export-data.tsx`, `src/features/settings/screens/ExportDataScreen.tsx`, `src/features/settings/components/ExportFilterForm.tsx`, `src/features/settings/hooks/useDataExport.ts`, `src/services/export/CsvExportService.ts`, `src/domain/export/csv-format.ts`
- **Bağımlılıklar**: T3.6
- **Kabul Kriterleri**:
  - [ ] CSV biçimleme saf domain fonksiyonu; üretim ve paylaşım serviste; UI'dan izole

---

## Faz 7: Kalite, Beta ve Eş Zamanlı Yayın

### Görev T7.1: Maestro E2E testleri
- **Açıklama**: §1.7 rota haritasındaki kritik yollar için akışlar; her akış ayrı dosyada.
- **Dosyalar**: `e2e/flows/<akış>.yaml` (giriş, onboarding, kovan ekleme, denetim oturumu, takvim, paywall)
- **Bağımlılıklar**: T4.7, T3.2, T6.3
- **Kabul Kriterleri**:
  - [ ] Kritik kullanıcı yolları hem iOS hem Android'de geçer

### Görev T7.2: Çevrimdışı ve çoklu cihaz testleri
- **Açıklama**: Senkron servislerinin uçak modu, ağ değişimi ve iki cihazda eş zamanlı düzenleme senaryolarında doğrulanması.
- **Dosyalar**: `src/services/sync/__scenarios__/*.test.ts`, `docs/test-plans/offline.md`
- **Bağımlılıklar**: T1.6, T3.2, T4.6
- **Kabul Kriterleri**:
  - [ ] Push/pull servisleri veri kaybı olmadan senkronizasyonu tamamlar; LWW sonuçları beklenene uyar

### Görev T7.3: Performans ve render optimizasyonu
- **Açıklama**: Bileşenlerin `React.memo` ve liste optimizasyonları incelenir; 200 kovanlık veri setiyle profilleme.
- **Dosyalar**: `scripts/seed-large-dataset.ts`, `docs/perf/report.md`
- **Bağımlılıklar**: T4.7, T3.6
- **Kabul Kriterleri**:
  - [ ] Liste ve detay ekranlarında gereksiz yeniden çizim yok (React DevTools Profiler ile doğrulanmış)
  - [ ] Soğuk açılış ve liste kaydırma hedefleri rapora yazılmış ve karşılanmış

### Görev T7.4: İzinler, gizlilik manifesti ve erişilebilirlik
- **Açıklama**: İzin metinleri, iOS gizlilik manifesti ve tüm bileşenlerin VoiceOver/TalkBack etiketleri denetlenir.
- **Dosyalar**: `app.config.ts` (izin metinleri, privacy manifest), `docs/a11y-checklist.md`
- **Bağımlılıklar**: T2.8, T5.4, T6.1, T0.7
- **Kabul Kriterleri**:
  - [ ] Tüm UI bileşenlerinde erişilebilirlik etiketleri tam; RNTL testleri rol/etiketle sorgular

### Görev T7.5: Mağaza meta verileri ve formlar
- **Açıklama**: Ekran görüntüleri, açıklamalar ve veri güvenliği formları.
- **Dosyalar**: `store/ios/*`, `store/android/*`
- **Bağımlılıklar**: T6.4, T7.4
- **Kabul Kriterleri**:
  - [ ] App Store ve Google Play hazırlıkları tamam; veri güvenliği formu gerçek veri akışıyla tutarlı

### Görev T7.6: Kapalı beta
- **Açıklama**: TestFlight ve Play Console kapalı test kanallarına yükleme.
- **Bağımlılıklar**: T7.1, T7.5, T4.3
- **Kabul Kriterleri**:
  - [ ] Beta arıcı grubu sahada test yürütür; crash-free oranı > %99

### Görev T7.7: Eş zamanlı mağaza yayını
- **Açıklama**: iOS ve Android production sürümü.
- **Bağımlılıklar**: T7.6, T6.5, T6.6, K3
- **Kabul Kriterleri**:
  - [ ] Mağazalarda canlıya çıkış eş zamanlı tamamlanır

### Görev T7.8: Yayın sonrası izleme
- **Açıklama**: Sentry, Edge Function log'ları ve servis sağlık metriklerinin izlenmesi.
- **Dosyalar**: `docs/runbooks/<olay>.md`
- **Bağımlılıklar**: T7.7
- **Kabul Kriterleri**:
  - [ ] Ekran, servis ve backend route seviyesinde hata alarmları devrede; her alarmın runbook'u var
