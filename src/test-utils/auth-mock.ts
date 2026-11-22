import { AuthRequestError, type AuthUser } from '../data/api/auth.client';
import { formatPhoneNumber } from '../lib/format';
import type { AuthService, SessionSnapshot } from '../services/auth/AuthService';
import { OTP_CODE_LENGTH, RESEND_COOLDOWN_SECONDS } from '../services/auth/phoneNumber';

// Giriş hook'ları ve ekranları (T1.7) için sahte oturum servisi. Kullanım:
//   const mockAuth = createAuthServiceMock();
//   jest.mock('@/services/auth', () =>
//     jest.requireActual('@/test-utils/auth-mock').authModuleMock(() => mockAuth.service));

export const TEST_PHONE = '+905321234567';
export const TEST_USER: AuthUser = { id: 'kullanici-1', phone: '905321234567' };

export function createAuthServiceMock(
  initial: SessionSnapshot = { status: 'loading', user: null },
) {
  let snapshot = initial;
  const listeners = new Set<(snapshot: SessionSnapshot) => void>();
  const service = {
    getSnapshot: jest.fn(() => snapshot),
    subscribe: jest.fn((listener: (snapshot: SessionSnapshot) => void) => {
      listeners.add(listener);
      return () => {
        listeners.delete(listener);
      };
    }),
    start: jest.fn(),
    requestCode: jest.fn(async (_input: string) => TEST_PHONE),
    verifyCode: jest.fn(async (_phone: string, _code: string) => TEST_USER),
    signOut: jest.fn(async () => {}),
  } satisfies AuthService;

  return {
    service,
    /** Oturum durumunu değiştirir ve aboneleri bilgilendirir. */
    setSnapshot(next: SessionSnapshot) {
      snapshot = next;
      listeners.forEach((listener) => listener(snapshot));
    },
  };
}

/** `@/services/auth` modülünün yerine geçen sahte modül. */
export function authModuleMock(getService: () => AuthService) {
  return {
    AuthRequestError,
    getAuthService: () => getService(),
    formatPhoneNumber,
    OTP_CODE_LENGTH,
    RESEND_COOLDOWN_SECONDS,
  };
}
