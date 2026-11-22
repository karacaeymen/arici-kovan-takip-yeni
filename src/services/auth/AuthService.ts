import { type AuthClient, AuthRequestError, type AuthUser } from '../../data/api/auth.client';
import { reportError } from '../../lib/observability/report';

import { normalizeOtpCode, normalizeTurkishMobile } from './phoneNumber';

// Oturum yönetimi (TODO.md T1.7): kod gönderme, doğrulama, çıkış ve oturum durumu. Arayüz
// durumu `getSnapshot`/`subscribe` ile okur (`useSession`); Supabase'i bilmez.
// Oturum açılınca senkron başlar, kapanınca durur (T1.6).

/** `loading`: güvenli depodaki oturum henüz okunmadı. */
export type SessionStatus = 'loading' | 'signedIn' | 'signedOut';

export interface SessionSnapshot {
  status: SessionStatus;
  user: AuthUser | null;
}

export interface AuthServiceDeps {
  client: Pick<
    AuthClient,
    'sendCode' | 'verifyCode' | 'signOut' | 'onUserChange' | 'setAutoRefresh'
  >;
  /** Senkron motoru (`getSyncCoordinator()`). */
  sync: { start(): void; stop(): void };
  /** Uygulamanın ön/arka plan durumu (React Native `AppState`). */
  appState: {
    currentState?: string | null;
    addEventListener(type: 'change', listener: (state: string) => void): { remove(): void };
  };
}

/** Kullanıcı hatası olmayan, sunucu ayarı ya da beklenmeyen durumları Sentry'ye bildirir. */
const REPORTED_KINDS = new Set(['unavailable', 'unknown']);

export function createAuthService({ client, sync, appState }: AuthServiceDeps) {
  let snapshot: SessionSnapshot = { status: 'loading', user: null };
  const listeners = new Set<(snapshot: SessionSnapshot) => void>();
  let started = false;

  const setUser = (user: AuthUser | null) => {
    const status: SessionStatus = user ? 'signedIn' : 'signedOut';
    if (snapshot.status === status && snapshot.user?.id === user?.id) return;
    snapshot = { status, user };
    listeners.forEach((listener) => listener(snapshot));
    if (user) sync.start();
    else sync.stop();
  };

  const withReporting = async <T>(operation: string, run: () => Promise<T>): Promise<T> => {
    try {
      return await run();
    } catch (error) {
      const failure =
        error instanceof AuthRequestError ? error : new AuthRequestError('unknown', String(error));
      if (REPORTED_KINDS.has(failure.kind)) {
        reportError(error, { layer: 'service', feature: 'auth', operation });
      }
      throw failure;
    }
  };

  return {
    getSnapshot: (): SessionSnapshot => snapshot,

    subscribe(listener: (snapshot: SessionSnapshot) => void): () => void {
      listeners.add(listener);
      return () => {
        listeners.delete(listener);
      };
    },

    /** Depodaki oturumu okur ve değişiklikleri dinlemeye başlar. İkinci çağrı bir şey yapmaz. */
    start(): void {
      if (started) return;
      started = true;
      client.onUserChange(setUser);
      client.setAutoRefresh((appState.currentState ?? 'active') === 'active');
      appState.addEventListener('change', (state) => client.setAutoRefresh(state === 'active'));
    },

    /** Numarayı doğrular ve SMS kodu gönderir. Kodu doğrularken kullanılacak numarayı döndürür. */
    requestCode(input: string): Promise<string> {
      return withReporting('requestCode', async () => {
        const phone = normalizeTurkishMobile(input);
        if (!phone) throw new AuthRequestError('invalid_phone', 'Geçersiz telefon numarası');
        await client.sendCode(phone);
        return phone;
      });
    },

    /** Kodu doğrular ve oturumu açar. */
    verifyCode(phone: string, input: string): Promise<AuthUser> {
      return withReporting('verifyCode', async () => {
        const code = normalizeOtpCode(input);
        if (!code) throw new AuthRequestError('invalid_code', 'Kod 6 haneli olmalı');
        const user = await client.verifyCode(phone, code);
        setUser(user);
        return user;
      });
    },

    signOut(): Promise<void> {
      return withReporting('signOut', async () => {
        await client.signOut();
        setUser(null);
      });
    },
  };
}

export type AuthService = ReturnType<typeof createAuthService>;
