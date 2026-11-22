import type { AuthErrorKind } from '../data/api/auth.client';

import { t, type TranslationKey } from './index';

jest.mock('expo-secure-store', () => ({}));

describe('t', () => {
  it('anahtarın Türkçe metnini verir', () => {
    expect(t('auth.login.submit')).toBe('Kod gönder');
  });

  it('değişkenleri yerleştirir; verilmeyeni olduğu gibi bırakır', () => {
    expect(t('auth.otp.resendIn', { seconds: 42 })).toBe('42 sn sonra tekrar gönderebilirsin');
    expect(t('auth.otp.resendIn', {})).toBe('{{seconds}} sn sonra tekrar gönderebilirsin');
  });

  it('metin olmayan anahtar için anahtarın kendisini döndürür', () => {
    expect(t('auth.login' as TranslationKey)).toBe('auth.login');
    expect(t('yok.boyle' as TranslationKey)).toBe('yok.boyle');
  });

  it('her giriş hatasının bir mesajı vardır', () => {
    const kinds: AuthErrorKind[] = [
      'invalid_phone',
      'invalid_code',
      'rate_limited',
      'network',
      'unavailable',
      'unknown',
    ];
    for (const kind of kinds) {
      expect(t(`auth.errors.${kind}`)).not.toBe(`auth.errors.${kind}`);
    }
  });
});
