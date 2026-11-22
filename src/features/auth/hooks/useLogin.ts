import { useState } from 'react';

import { AuthRequestError, type AuthErrorKind, getAuthService } from '../../../services/auth';

/** Giriş ekranının durumu: yazılan numara, gönderim ve hata. */
export function useLogin() {
  const [digits, setDigits] = useState('');
  const [error, setError] = useState<AuthErrorKind | null>(null);
  const [sending, setSending] = useState(false);

  const changeDigits = (next: string) => {
    setDigits(next);
    setError(null);
  };

  /** Kodu gönderir; başarılıysa doğrulamada kullanılacak numarayı (`+905…`), değilse `null` döner. */
  const submit = async (): Promise<string | null> => {
    if (sending) return null;
    setSending(true);
    setError(null);
    try {
      return await getAuthService().requestCode(digits);
    } catch (e) {
      setError(e instanceof AuthRequestError ? e.kind : 'unknown');
      return null;
    } finally {
      setSending(false);
    }
  };

  return { digits, changeDigits, error, sending, submit };
}
