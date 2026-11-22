import tr from './tr.json';

// Kullanıcıya görünen metinler (TODO.md T0.8). Şimdilik yalnızca Türkçe; anahtarlar `tr.json`'dan
// tip olarak çıkarılır, yanlış anahtar derlemede yakalanır. Değişken: `{{ad}}`.

type Leaves<T, Prefix extends string = ''> = {
  [K in keyof T & string]: T[K] extends string ? `${Prefix}${K}` : Leaves<T[K], `${Prefix}${K}.`>;
}[keyof T & string];

export type TranslationKey = Leaves<typeof tr>;

export function t(key: TranslationKey, params?: Record<string, string | number>): string {
  const value = key
    .split('.')
    .reduce<unknown>((node, part) => (node as Record<string, unknown> | undefined)?.[part], tr);
  if (typeof value !== 'string') return key;
  if (!params) return value;
  return value.replace(/\{\{(\w+)\}\}/g, (match, name: string) =>
    name in params ? String(params[name]) : match,
  );
}
