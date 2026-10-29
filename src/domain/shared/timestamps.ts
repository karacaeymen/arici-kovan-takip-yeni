import { z } from 'zod';

/**
 * Zaman damgası: saat dilimi bilgisi içeren ISO 8601 metni (ör. `2026-10-29T10:00:00Z`).
 * SQLite'ta metin olarak saklanır, senkronda olduğu gibi taşınır.
 */
export const timestampSchema = z.iso.datetime({ offset: true, error: 'Geçersiz zaman damgası' });

/** Takvim günü: `YYYY-MM-DD` (ör. ilaçlama başlangıcı, görev tarihi). */
export const calendarDateSchema = z.iso.date({ error: 'Geçersiz tarih' });

export type Timestamp = z.infer<typeof timestampSchema>;
export type CalendarDate = z.infer<typeof calendarDateSchema>;

/** İki zaman damgasını karşılaştırır; farklı saat dilimlerinde de doğru sonuç verir. */
export function compareTimestamps(a: Timestamp, b: Timestamp): number {
  return Date.parse(a) - Date.parse(b);
}

/** İki takvim gününü karşılaştırır (`YYYY-MM-DD` metinleri sözlük sırasıyla sıralanır). */
export function compareCalendarDates(a: CalendarDate, b: CalendarDate): number {
  return a < b ? -1 : a > b ? 1 : 0;
}
