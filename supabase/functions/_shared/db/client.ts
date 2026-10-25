import { createClient, type SupabaseClient } from '@supabase/supabase-js';

import { getConfig } from '../config.ts';

export type DbClient = SupabaseClient;

const serverOptions = { auth: { persistSession: false, autoRefreshToken: false } };

/**
 * Kullanıcının JWT'siyle çalışan istemci. RLS politikaları bu kullanıcı adına uygulanır.
 * Kullanıcı isteklerinde varsayılan budur (TODO.md T1.3).
 */
export function createUserClient(authorizationHeader: string): DbClient {
  const { SUPABASE_URL, SUPABASE_ANON_KEY } = getConfig();
  return createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
    ...serverOptions,
    global: { headers: { Authorization: authorizationHeader } },
  });
}

/** RLS'i atlayan yönetici istemcisi. Yalnızca sistem işlerinde (sağlık kontrolü, cron, webhook). */
export function createServiceClient(): DbClient {
  const { SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY } = getConfig();
  return createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, serverOptions);
}
