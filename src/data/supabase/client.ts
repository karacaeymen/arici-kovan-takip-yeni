import { createClient, type SupabaseClient } from '@supabase/supabase-js';

import { type AppConfig, getConfig } from '../../lib/config';

import { createSecureSessionStorage, type SessionStorage } from './secureSessionStorage';

// Uygulamanın tek Supabase istemcisi (TODO.md T1.6, T1.7). Üst katmanlar bunu doğrudan değil,
// `src/data/api/*.client.ts` üzerinden kullanır.

export type AppSupabaseClient = SupabaseClient;

/** Verilen ayarlarla yeni bir istemci kurar (testler ve `getSupabaseClient` için). */
export function createSupabaseClient(
  config: Pick<AppConfig, 'supabaseUrl' | 'supabaseAnonKey'>,
  storage: SessionStorage = createSecureSessionStorage(),
): AppSupabaseClient {
  return createClient(config.supabaseUrl, config.supabaseAnonKey, {
    // Oturum güvenli depoda saklanır; uygulama kapanıp açılınca tekrar giriş gerekmez.
    // Belirtecin yenilenmesi uygulama öndeyken açıktır (`AuthService`, T1.7).
    auth: { storage, autoRefreshToken: true, persistSession: true, detectSessionInUrl: false },
  });
}

let client: AppSupabaseClient | undefined;

/** Uygulama boyunca tek istemci; ilk çağrıda ortam ayarlarından kurulur. */
export function getSupabaseClient(): AppSupabaseClient {
  client ??= createSupabaseClient(getConfig());
  return client;
}
