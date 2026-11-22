// Türkiye cep telefonu numarası (TODO.md T1.7). Kullanıcı numarayı `0532 123 45 67`,
// `532 123 45 67`, `+90 532 123 45 67` gibi biçimlerde yazabilir; sunucuya `+905321234567` gider.

const MOBILE = /^5\d{9}$/;

/** Numarayı `+905XXXXXXXXX` biçimine çevirir; Türkiye cep numarası değilse `null`. */
export function normalizeTurkishMobile(input: string): string | null {
  let digits = input.replace(/\D/g, '');
  if (digits.startsWith('90') && digits.length === 12) digits = digits.slice(2);
  else if (digits.startsWith('0') && digits.length === 11) digits = digits.slice(1);
  return MOBILE.test(digits) ? `+90${digits}` : null;
}

/** Doğrulama kodu: tam 6 rakam (boşluklar yok sayılır). */
export const OTP_CODE_LENGTH = 6;

/** Aynı numaraya yeni kod istemeden önce beklenecek süre (Supabase'in SMS sıklık sınırıyla uyumlu). */
export const RESEND_COOLDOWN_SECONDS = 60;

export function normalizeOtpCode(input: string): string | null {
  const digits = input.replace(/\s/g, '');
  return /^\d+$/.test(digits) && digits.length === OTP_CODE_LENGTH ? digits : null;
}
