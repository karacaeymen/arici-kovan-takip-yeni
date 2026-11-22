import { createClient, type SupabaseClient } from '@supabase/supabase-js';

import { type AppConfig, getConfig } from '../../lib/config';

// Uygulamanın tek Supabase istemcisi (TODO.md T1.6). Üst katmanlar bunu doğrudan değil,
// `src/data/api/*.client.ts` üzerinden kullanır.

export type AppSupabaseClient = SupabaseClient;

/** Verilen ayarlarla yeni bir istemci kurar (testler ve `getSupabaseClient` için). */
export function createSupabaseClient(
  config: Pick<AppConfig, 'supabaseUrl' | 'supabaseAnonKey'>,
): AppSupabaseClient {
  return createClient(config.supabaseUrl, config.supabaseAnonKey, {
    // Oturumun güvenli depolamada saklanması ve uygulama öne gelince yenilenmesi T1.7'de
    // (`src/services/auth/sessionStorage.ts`) bağlanır; o zamana kadar oturum bellektedir.
    auth: { autoRefreshToken: true, persistSession: true, detectSessionInUrl: false },
  });
}

let client: AppSupabaseClient | undefined;

/** Uygulama boyunca tek istemci; ilk çağrıda ortam ayarlarından kurulur. */
export function getSupabaseClient(): AppSupabaseClient {
  client ??= createSupabaseClient(getConfig());
  return client;
}
