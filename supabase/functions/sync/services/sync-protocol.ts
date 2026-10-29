/**
 * Senkron protokolünün ortak tanımları. İstemci (T1.6) aynı sürüm numarasını gönderir;
 * sözleşme değişirse sürüm artırılır ve eski istemciler 426 alıp güncellemeye yönlendirilir.
 */
export const SYNC_PROTOCOL_VERSION = 1;

/** Senkronlanan tablolar, ebeveynden çocuğa doğru (`public.sync_tables()` ile aynı sıra). */
export const SYNC_TABLES = [
  'businesses',
  'apiaries',
  'hives',
  'queens',
  'inspections',
  'treatments',
  'feedings',
  'harvests',
  'relocations',
  'tasks',
] as const;

export type SyncTable = (typeof SYNC_TABLES)[number];

/** Tek istekte gönderilebilecek en fazla değişiklik. */
export const MAX_PUSH_CHANGES = 500;

/**
 * Tek pull isteğinde dönebilecek en fazla değişiklik. Servis bir fazlasını ister (`hasMore` için);
 * SQL fonksiyonunun üst sınırı (1000) bunun altında kalmalıdır.
 */
export const MAX_PULL_LIMIT = 500;
export const DEFAULT_PULL_LIMIT = 200;

export type Row = Record<string, unknown>;

/** İstemci alan adları camelCase, veritabanı sütunları snake_case'tir. */
export function toSnakeCaseRow(row: Row): Row {
  return Object.fromEntries(
    Object.entries(row).map(([key, value]) => [
      key.replace(/[A-Z]/g, (ch) => `_${ch.toLowerCase()}`),
      value,
    ]),
  );
}

export function toCamelCaseRow(row: Row): Row {
  return Object.fromEntries(
    Object.entries(row).map(([key, value]) => [
      key.replace(/_([a-z0-9])/g, (_, ch: string) => ch.toUpperCase()),
      value,
    ]),
  );
}
