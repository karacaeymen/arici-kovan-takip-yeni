import { z } from 'zod';

// Uygulamanın tüm ortam ayarları tek yerden, doğrulanarak okunur (TODO.md T0.7).
// Yalnızca EXPO_PUBLIC_ ile başlayan değişkenler uygulamaya gömülür; gizli anahtar buraya konmaz.

const schema = z.object({
  appVariant: z.enum(['development', 'preview', 'production']).default('development'),
  supabaseUrl: z.url(),
  supabaseAnonKey: z.string().min(1),
  sentryDsn: z.url().optional(),
});

export type AppConfig = z.infer<typeof schema>;

/** Ayar alanı → ortam değişkeni adı (hata mesajlarında kullanılır). */
const ENV_NAMES = {
  appVariant: 'EXPO_PUBLIC_APP_VARIANT',
  supabaseUrl: 'EXPO_PUBLIC_SUPABASE_URL',
  supabaseAnonKey: 'EXPO_PUBLIC_SUPABASE_ANON_KEY',
  sentryDsn: 'EXPO_PUBLIC_SENTRY_DSN',
} as const satisfies Record<keyof AppConfig, string>;

export type PublicEnv = Partial<Record<(typeof ENV_NAMES)[keyof AppConfig], string>>;

export class ConfigError extends Error {
  constructor(readonly variables: string[]) {
    super(
      `Ortam ayarları eksik veya hatalı: ${variables.join(', ')}. ` +
        ".env.local dosyasını .env.example'a bakarak doldurun (EAS build için: expo.dev → Environment variables).",
    );
    this.name = 'ConfigError';
  }
}

const blankToUndefined = (value: string | undefined) =>
  value === undefined || value.trim() === '' ? undefined : value.trim();

export function parseConfig(env: PublicEnv): AppConfig {
  const result = schema.safeParse({
    appVariant: blankToUndefined(env.EXPO_PUBLIC_APP_VARIANT),
    supabaseUrl: blankToUndefined(env.EXPO_PUBLIC_SUPABASE_URL),
    supabaseAnonKey: blankToUndefined(env.EXPO_PUBLIC_SUPABASE_ANON_KEY),
    sentryDsn: blankToUndefined(env.EXPO_PUBLIC_SENTRY_DSN),
  });
  if (result.success) return result.data;
  const fields = new Set(result.error.issues.map((issue) => String(issue.path[0])));
  throw new ConfigError([...fields].map((field) => ENV_NAMES[field as keyof AppConfig] ?? field));
}

// Expo, EXPO_PUBLIC_ değişkenlerini yalnızca `process.env.AD` biçiminde tek tek yazıldığında gömer;
// bu yüzden nesne olarak değil, her biri ayrı okunur.
function readPublicEnv(): PublicEnv {
  return {
    EXPO_PUBLIC_APP_VARIANT: process.env.EXPO_PUBLIC_APP_VARIANT,
    EXPO_PUBLIC_SUPABASE_URL: process.env.EXPO_PUBLIC_SUPABASE_URL,
    EXPO_PUBLIC_SUPABASE_ANON_KEY: process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY,
    EXPO_PUBLIC_SENTRY_DSN: process.env.EXPO_PUBLIC_SENTRY_DSN,
  };
}

let cached: AppConfig | undefined;

/** Doğrulanmış ayarlar. İlk çağrıda (uygulama açılışında) eksik değer varsa ConfigError fırlatır. */
export function getConfig(): AppConfig {
  cached ??= parseConfig(readPublicEnv());
  return cached;
}
