// Hata bildirme sözleşmesi. Uygulama kodu Sentry'yi doğrudan bilmez, buradaki reportError'ı çağırır;
// Sentry açılışta kendini setErrorReporter ile bağlar (sentry.ts). Testlerde sahte bir reporter verilir.

/** Sentry'de filtrelenecek katman etiketi (TODO.md T0.7). */
export type Layer = 'screen' | 'service' | 'repository';

export interface ErrorTags {
  layer: Layer;
  /** Özellik adı: `apiary`, `hive` ya da rota grubu (`tabs`, `auth`). */
  feature: string;
  /** Hatanın çıktığı metot, ör. `createApiary`. */
  operation?: string;
}

export type ErrorReporter = (error: unknown, tags: ErrorTags) => void;

const noop: ErrorReporter = () => {};
let current: ErrorReporter = noop;
// Aynı hata servis ve repository'den iki kez bildirilmesin diye işaretlenir.
const reported = new WeakSet<object>();

export function setErrorReporter(reporter: ErrorReporter | undefined): void {
  current = reporter ?? noop;
}

export function reportError(error: unknown, tags: ErrorTags): void {
  if (typeof error === 'object' && error !== null) {
    if (reported.has(error)) return;
    reported.add(error);
  }
  try {
    current(error, tags);
  } catch {
    // Hata bildirme sırasında çıkan hata uygulamayı düşürmemeli.
  }
}

/** Rota grubunun ErrorBoundary'si için hazır bildirim fonksiyonu. */
export function reportScreenError(feature: string): (error: Error) => void {
  return (error) => reportError(error, { layer: 'screen', feature });
}
