# CLAUDE.md

Bu dosya, bu repoda çalışan Claude (ve geliştiriciler) için bağlayıcı kuralları özetler. Ayrıntılar ve görev listesi `TODO.md`'dedir; çelişki olursa `TODO.md` §1 esastır.

## Proje
Arıcı Kovan Takip — Expo Router (React Native, TypeScript strict) istemci + Supabase backend (Postgres, RLS, Deno Edge Functions). Çevrimdışı öncelikli: yazmalar yerel SQLite'a + outbox'a gider, senkron arka planda yapılır.

## Çalışma düzeni
1. Bir göreve başlamadan önce `TODO.md`'de görevin **Dosyalar** satırını oku. Yalnızca o listedeki dosyaları aç; listede olmayan bir katmana kod gerekiyorsa önce `TODO.md`'yi güncelle.
2. Görev, kabul kriterleri **iOS ve Android'de** doğrulanmadan tamamlanmış sayılmaz.
3. Görev bitince `TODO.md` → "Güncel Durum" bölümünü ve görevin kutucuklarını güncelle.
4. İş bölümü ve sıra için `docs/YOL_HARITASI.md`'ye bak.

## Mimari kurallar (özet)
- **Her endpoint ayrı dosya.** Her ekran rotası `app/**` altında ayrı `.tsx`; her backend uç noktası ayrı `*.route.ts`.
- **İnce route.** `app/**` dosyası yalnızca parametre okur ve **tek** bir `<XScreen />` render eder (≤ 30 satır). Backend route: doğrula → servisi çağır → yanıtla (≤ 80 satır). İş mantığı, DB veya üçüncü parti çağrısı route'ta olmaz.
- **İş mantığı serviste.** Servisler `Request`/`Response` ya da React bilmez; bağımlılıkları (repository, provider, `Clock`) parametre olarak alır.
- **Saf domain.** `src/domain/**` yalnızca `zod` ve `src/lib` saf yardımcılarını import eder; React/RN/Expo/`data`/`services` yok.
- **Bileşenler props ile çalışır.** Bileşen servis veya repository import etmez; her alt bileşen kendi dosyasında.
- **Okuma akışı:** `Screen → hook → Service.watch*() → Repository.watch*()`. Hook repository'ye doğrudan erişmez.
- **Backend:** `routes/` → `services/` → `repositories/` / `providers/`. Ortak kod `supabase/functions/_shared/` altında; `_shared` hiçbir fonksiyon klasöründen import etmez.

### Frontend import yönü
| Katman | Import edebileceği |
|---|---|
| Route `app/**` | yalnızca `src/features/*/screens` (istisna: `_layout.tsx` → `components/ui/ErrorBoundary`, `lib/observability`) |
| Screen | aynı feature'ın `components`, `hooks`; `components/ui`; `theme`; `i18n` |
| Component | `components/ui`, `theme`, `i18n`, `lib/format` |
| Hook | `services`, `domain` (tipler) |
| Service | `domain`, `data/repositories`, `data/api`, `lib`, platform adaptörleri |
| Repository | `data/db`, `domain` (tipler) |
| API client | `data/supabase/client.ts`, `domain` (tipler) |

Bu kurallar `eslint.config.js` içinde `eslint-plugin-boundaries` (beyaz liste: izin verilmeyen her iç import hata verir) ve `max-lines` ile zorlanır. Yeni bir katman/klasör eklenirse önce oradaki `elements` ve `policies` listeleri güncellenir.

## Adlandırma
- Frontend: `XScreen.tsx`, `PascalCase.tsx`, `useX.ts`, `XService.ts`, `XRepository.ts`, `kebab-case.client.ts`, domain `kebab-case.ts`.
- Backend: `kebab-case.route.ts`, `.service.ts`, `.repository.ts`, `.provider.ts`; fonksiyon klasörleri kebab-case.
- Testler test ettiği dosyanın yanında: `<dosya>.test.ts(x)`; backend'de `tests/<ad>.test.ts`.

## Boyut sınırları
Route 30 · backend `index.ts` 25 · backend `*.route.ts` 80 · Screen/Component 150 · Service/hook 250 satır. Aşan dosya bölünür.

## Diğer
- `@/` takma adı `src/`'yi gösterir.
- Kullanıcıya görünen metinler `src/i18n/tr.json`'dan okunur (T0.8 sonrası); sabit Türkçe metin yazılmaz.
- Zaman gerektiren kod `new Date()` yerine `Clock` kullanır (`src/lib/clock.ts`, backend'de `_shared/clock.ts`); testlerde `createFixedClock` ile zaman sabitlenir.
- Ekran/bileşen testleri `@/test-utils/render` içindeki `renderWithProviders` ile yazılır; `app/**` altına test dosyası konmaz (Expo Router her dosyayı rota sayar).
- Yeni bir Edge Function `health` şablonunu izler: `index.ts` → `routes/*.route.ts` → `services/*.service.ts` → `repositories/` / `providers/`. Veritabanı değişikliği her zaman yeni bir `supabase/migrations/<zaman>_<ad>.sql` dosyasıdır; eski migration düzenlenmez.
- Ortam değişkenleri yalnızca `getConfig()` (`src/lib/config.ts`) üzerinden okunur; `process.env` başka yerde kullanılmaz.
- Servisler `withServiceErrors(servis, { feature })` ile sarılır; hata Sentry'ye `layer`/`feature`/`operation` etiketiyle gider. Doğrudan Sentry import edilmez, `reportError` kullanılır.
- Gizli değerler yalnızca `.env.local` / EAS secrets'ta; repoda yalnızca değersiz `.env.example`.
- Satır sonları LF (`.gitattributes`).

## Komutlar
```bash
npm install
npm start          # Expo geliştirme sunucusu
npm run typecheck  # tsc --noEmit
npm run lint       # ESLint (katman + boyut kuralları)
npm run lint:fix   # otomatik düzeltilebilenleri düzelt
npm run format     # Prettier
npm test           # tüm Jest testleri (unit + ui)
npm run test:unit  # saf Node testleri: domain, lib, servisler, repository'ler
npm run test:ui    # bileşen, Screen ve hook testleri (React Native Testing Library)
npm run test:coverage   # kapsam raporu; domain < %90 veya servisler < %80 ise hata
npm run test:functions  # Edge Function testleri (deno test)
npm run db:start   # yerel Supabase'i başlat (Docker Desktop açık olmalı)
npm run db:stop    # yerel Supabase'i durdur
npm run db:reset   # yerel veritabanını sıfırla, migration'ları baştan uygula
npm run db:test    # veritabanı testleri (pgTAP, supabase/tests/database)
# Uzak ortama yükleme (klasör varsayılan olarak dev'e bağlıdır; prod için önce link ile prod'a geç, sonra dev'e dön):
# npx supabase link --project-ref <ref>   # dev: uakawqlztstbmmyimmjy · prod: cnmycgkyofuyucscjxwm
# npx supabase db push --linked && npx supabase functions deploy <ad>
npm run functions:serve  # Edge Function'ları yerelde çalıştır
```
Commit öncesinde husky + lint-staged değişen dosyalarda lint ve format'ı otomatik çalıştırır.
