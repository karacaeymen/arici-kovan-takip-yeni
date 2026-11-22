import { useEffect, useState } from 'react';

import {
  AuthRequestError,
  type AuthErrorKind,
  formatPhoneNumber,
  getAuthService,
  OTP_CODE_LENGTH,
  RESEND_COOLDOWN_SECONDS,
} from '../../../services/auth';

const toKind = (error: unknown): AuthErrorKind =>
  error instanceof AuthRequestError ? error.kind : 'unknown';

/**
 * Kod doğrulama ekranının durumu. Ekran açıldığında kod yeni gönderilmiştir; tekrar gönderme
 * için geri sayım buradan başlar. Doğrulama başarılı olunca oturum açılır ve yönlendirmeyi
 * oturum kapısı (`SessionGate`) yapar.
 */
export function useOtpVerify(phone: string) {
  const [code, setCode] = useState('');
  const [error, setError] = useState<AuthErrorKind | null>(null);
  const [verifying, setVerifying] = useState(false);
  const [resending, setResending] = useState(false);
  const [resent, setResent] = useState(false);
  const [secondsLeft, setSecondsLeft] = useState(RESEND_COOLDOWN_SECONDS);

  // Geri sayım sürerken saniyede bir azalır; sıfıra inince sayaç durur, yeni kod istenince yeniden başlar.
  const counting = secondsLeft > 0;
  useEffect(() => {
    if (!counting) return;
    const timer = setInterval(() => setSecondsLeft((s) => Math.max(0, s - 1)), 1_000);
    return () => clearInterval(timer);
  }, [counting]);

  const changeCode = (next: string) => {
    setCode(next);
    setError(null);
  };

  const verify = async (value = code): Promise<boolean> => {
    if (verifying) return false;
    setVerifying(true);
    setError(null);
    try {
      await getAuthService().verifyCode(phone, value);
      return true;
    } catch (e) {
      setError(toKind(e));
      setCode('');
      return false;
    } finally {
      setVerifying(false);
    }
  };

  const resend = async (): Promise<void> => {
    if (resending || secondsLeft > 0) return;
    setResending(true);
    setError(null);
    setResent(false);
    try {
      await getAuthService().requestCode(phone);
      setResent(true);
      setSecondsLeft(RESEND_COOLDOWN_SECONDS);
    } catch (e) {
      setError(toKind(e));
    } finally {
      setResending(false);
    }
  };

  return {
    displayPhone: formatPhoneNumber(phone),
    codeLength: OTP_CODE_LENGTH,
    code,
    changeCode,
    error,
    verifying,
    verify,
    resend,
    resending,
    resent,
    secondsLeft,
  };
}
