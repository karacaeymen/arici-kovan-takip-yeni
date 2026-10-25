import { z } from 'zod';

/**
 * Ortam değişkenleri tek yerden, zod ile doğrulanarak okunur.
 * SUPABASE_* değerlerini Supabase Edge Runtime otomatik verir; yerelde `supabase start` sağlar.
 */
const configSchema = z.object({
  SUPABASE_URL: z.url(),
  SUPABASE_ANON_KEY: z.string().min(1),
  SUPABASE_SERVICE_ROLE_KEY: z.string().min(1),
  APP_ENV: z.enum(['local', 'dev', 'prod']).default('local'),
  APP_VERSION: z.string().default('0.0.0'),
});

export type Config = z.infer<typeof configSchema>;

let cached: Config | undefined;

export function getConfig(env: Record<string, string | undefined> = Deno.env.toObject()): Config {
  if (cached) return cached;
  const result = configSchema.safeParse(env);
  if (!result.success) {
    const missing = result.error.issues.map((issue) => issue.path.join('.')).join(', ');
    throw new Error(`Eksik veya geçersiz ortam değişkenleri: ${missing}`);
  }
  cached = result.data;
  return cached;
}
