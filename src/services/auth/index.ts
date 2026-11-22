import { AppState } from 'react-native';

import { getAuthClient } from '../../data/api/auth.client';
import { getSyncCoordinator } from '../sync';

import { type AuthService, createAuthService } from './AuthService';

// Oturum servisinin gerçek bağımlılıklarla kurulduğu tek yer (TODO.md T1.7).

let service: AuthService | undefined;

export function getAuthService(): AuthService {
  service ??= createAuthService({
    client: getAuthClient(),
    // Senkron motoru ilk girişte kurulur; oturum yokken veritabanı/istemci açılmaz.
    sync: {
      start: () => getSyncCoordinator().start(),
      stop: () => getSyncCoordinator().stop(),
    },
    appState: AppState,
  });
  return service;
}

export { AuthRequestError } from '../../data/api/auth.client';
export type { AuthErrorKind, AuthUser } from '../../data/api/auth.client';
export type { AuthService, SessionSnapshot, SessionStatus } from './AuthService';
export { formatPhoneNumber } from '../../lib/format';
export { OTP_CODE_LENGTH, RESEND_COOLDOWN_SECONDS } from './phoneNumber';
