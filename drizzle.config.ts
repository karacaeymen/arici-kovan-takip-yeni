import { defineConfig } from 'drizzle-kit';

// Yerel SQLite migration'larını şemadan üretir: `npm run db:generate` (TODO.md T1.4).
// Çıktı `drizzle/` klasörüne yazılır ve uygulamaya paketlenir; elle düzenlenmez.
export default defineConfig({
  dialect: 'sqlite',
  driver: 'expo',
  schema: './src/data/db/schema/index.ts',
  out: './drizzle',
});
