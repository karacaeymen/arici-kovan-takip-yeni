# Arıcı Kovan Takip

Arıcıların arılık, kovan, kraliçe, denetim, ilaçlama, besleme ve bal sağımı kayıtlarını sahada, çevrimdışı tutabildiği mobil uygulama (iOS + Android).

- **İstemci:** Expo (React Native) + Expo Router, TypeScript (strict)
- **Backend:** Supabase (Postgres, RLS, Edge Functions / Deno)
- **Yerel veri:** SQLite (Drizzle) + outbox ile senkron

## Başlangıç

```bash
npm install
npm start          # Expo Go ile QR okutarak aç
npm run typecheck  # TypeScript kontrolü
```

Gereksinim: Node.js 20+ ve telefonda Expo Go.

## Belgeler

- [`CLAUDE.md`](./CLAUDE.md) — mimari kurallar ve çalışma düzeni (önce bunu okuyun)
- [`TODO.md`](./TODO.md) — görev listesi, katman kuralları, endpoint ve ekran haritaları
- [`docs/YOL_HARITASI.md`](./docs/YOL_HARITASI.md) — aşamalar ve iki kişilik iş bölümü

## Klasör yapısı (özet)

```
app/                 Expo Router rotaları (her dosya = tek ekran, ≤ 30 satır)
src/features/        Özellik başına screens / components / hooks / services
src/components/ui/   Ortak saha modu bileşenleri
src/services/        Çapraz servisler (auth, sync, notifications, location, …)
src/domain/          Saf iş kuralları ve zod şemaları
src/data/            SQLite şeması, repository'ler, API istemcileri, Supabase istemcisi
src/lib, theme, i18n Yardımcılar, tema, çeviriler
supabase/            Migration'lar, seed, pgTAP testleri, Edge Function'lar
```

Ayrıntılı yapı: `TODO.md` §1.3 (frontend) ve §1.5 (backend).
