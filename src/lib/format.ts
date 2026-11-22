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

/** Geçen sürenin gösterim birimi: "az önce", "5 dk önce", "2 sa önce", "3 gün önce". */
export interface Elapsed {
  unit: 'justNow' | 'minutes' | 'hours' | 'days';
  value: number;
}

/** `from` ile `now` arasındaki süre, en büyük uygun birimle (gelecek tarih "az önce" sayılır). */
export function elapsedSince(from: string, now: Date): Elapsed {
  const minutes = Math.floor((now.getTime() - Date.parse(from)) / 60_000);
  if (!(minutes >= 1)) return { unit: 'justNow', value: 0 };
  if (minutes < 60) return { unit: 'minutes', value: minutes };
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return { unit: 'hours', value: hours };
  return { unit: 'days', value: Math.floor(hours / 24) };
}
