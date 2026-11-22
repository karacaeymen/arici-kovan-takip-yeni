// Görüntüleme biçimlendiricileri (TODO.md T0.8). Bileşenler yalnızca bu dosyayı `lib`'den import
// edebilir; burada saf, yan etkisiz fonksiyonlar durur.

/** Yazılan rakamları Türkiye cep telefonu düzenine böler: `5321234567` → `532 123 45 67`. */
export function formatMobileDigits(digits: string): string {
  const clean = digits.replace(/\D/g, '').slice(0, 10);
  const groups = [clean.slice(0, 3), clean.slice(3, 6), clean.slice(6, 8), clean.slice(8, 10)];
  return groups.filter((group) => group.length > 0).join(' ');
}

/** `+905321234567` → `+90 532 123 45 67`. Tanınmayan biçim olduğu gibi döner. */
export function formatPhoneNumber(e164: string): string {
  const match = /^\+90(5\d{9})$/.exec(e164);
  return match?.[1] ? `+90 ${formatMobileDigits(match[1])}` : e164;
}
