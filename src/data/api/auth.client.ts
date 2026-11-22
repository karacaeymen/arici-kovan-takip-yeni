import type { SupabaseClient, User } from '@supabase/supabase-js';

import { getSupabaseClient } from '../supabase/client';

// Supabase Auth istemcisi: telefon + SMS koduyla giriş (TODO.md T1.7). Supabase'e özgü hata
// biçimleri burada uygulamanın anladığı türlere çevrilir; üst katmanlar Supabase'i bilmez.

export interface AuthUser {
  id: string;
  /** Supabase'in sakladığı biçimde, `+` olmadan (ör. `905321234567`). */
  phone: string | null;
}

/**
 * - `invalid_phone`: numara geçersiz.
 * - `invalid_code`: kod yanlış ya da süresi geçmiş.
 * - `rate_limited`: çok sık istek; biraz sonra tekrar denenmeli.
 * - `network`: sunucuya ulaşılamadı.
 * - `unavailable`: SMS ile giriş sunucuda kapalı ya da SMS gönderilemedi.
 * - `unknown`: diğer.
 */
export type AuthErrorKind =
  'invalid_phone' | 'invalid_code' | 'rate_limited' | 'network' | 'unavailable' | 'unknown';

export class AuthRequestError extends Error {
  constructor(
    readonly kind: AuthErrorKind,
    message: string,
    readonly code?: string,
  ) {
    super(message);
    this.name = 'AuthRequestError';
  }
}

type SupabaseAuth = Pick<
  SupabaseClient['auth'],
  | 'signInWithOtp'
  | 'verifyOtp'
  | 'signOut'
  | 'onAuthStateChange'
  | 'startAutoRefresh'
  | 'stopAutoRefresh'
>;

const KIND_BY_CODE: Record<string, AuthErrorKind> = {
  validation_failed: 'invalid_phone',
  otp_expired: 'invalid_code',
  invalid_credentials: 'invalid_code',
  over_sms_send_rate_limit: 'rate_limited',
  over_request_rate_limit: 'rate_limited',
  sms_send_failed: 'unavailable',
  phone_provider_disabled: 'unavailable',
  provider_disabled: 'unavailable',
  signup_disabled: 'unavailable',
  otp_disabled: 'unavailable',
};

/** Supabase Auth hatasını (`AuthApiError`, `AuthRetryableFetchError`, …) çevirir. */
export function toAuthError(error: unknown): AuthRequestError {
  if (error instanceof AuthRequestError) return error;
  const { name, code, status, message } = (error ?? {}) as {
    name?: unknown;
    code?: unknown;
    status?: unknown;
    message?: unknown;
  };
  const text = typeof message === 'string' ? message : 'Kimlik doğrulama hatası';
  const errorCode = typeof code === 'string' ? code : undefined;
  if (name === 'AuthRetryableFetchError' || (error instanceof TypeError && !errorCode)) {
    return new AuthRequestError('network', text, errorCode);
  }
  const byCode = errorCode === undefined ? undefined : KIND_BY_CODE[errorCode];
  const kind: AuthErrorKind = byCode ?? (status === 429 ? 'rate_limited' : 'unknown');
  return new AuthRequestError(kind, text, errorCode);
}

const toUser = (user: User): AuthUser => ({ id: user.id, phone: user.phone ?? null });

export function createAuthClient(auth: SupabaseAuth) {
  return {
    /** Numaraya SMS ile giriş kodu gönderir (`phone`: `+905…` biçiminde). Hesap yoksa açılır. */
    async sendCode(phone: string): Promise<void> {
      const { error } = await auth.signInWithOtp({ phone, options: { channel: 'sms' } });
      if (error) throw toAuthError(error);
    },

    /** Kodu doğrular; başarılıysa oturum açılır ve güvenli depoya yazılır. */
    async verifyCode(phone: string, code: string): Promise<AuthUser> {
      const { data, error } = await auth.verifyOtp({ phone, token: code, type: 'sms' });
      if (error) throw toAuthError(error);
      if (!data.user) throw new AuthRequestError('unknown', 'Doğrulama yanıtında kullanıcı yok');
      return toUser(data.user);
    },

    async signOut(): Promise<void> {
      const { error } = await auth.signOut();
      if (error) throw toAuthError(error);
    },

    /**
     * Oturum değişikliklerini dinler. İlk çağrıda depodaki oturum okunur ve bir kez bildirilir;
     * sonra her giriş/çıkışta. Dönen fonksiyon dinlemeyi bırakır.
     */
    onUserChange(listener: (user: AuthUser | null) => void): () => void {
      const { data } = auth.onAuthStateChange((_event, session) =>
        listener(session ? toUser(session.user) : null),
      );
      return () => data.subscription.unsubscribe();
    },

    /** Belirtecin arka planda yenilenmesi: uygulama öndeyken açık, arka plandayken kapalı. */
    setAutoRefresh(active: boolean): void {
      void (active ? auth.startAutoRefresh() : auth.stopAutoRefresh());
    },
  };
}

export type AuthClient = ReturnType<typeof createAuthClient>;

let client: AuthClient | undefined;

export function getAuthClient(): AuthClient {
  client ??= createAuthClient(getSupabaseClient().auth);
  return client;
}
