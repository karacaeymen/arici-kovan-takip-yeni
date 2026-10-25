import * as Sentry from '@sentry/react-native';

import { type AppConfig, getConfig } from '../config';
import { setErrorReporter } from './report';

// Sentry bağlantısı (TODO.md T0.7). Yalnızca kök _layout.tsx açılışta initObservability'yi çağırır.

/** Sentry'yi başlatır ve reportError'ı ona bağlar. DSN yoksa (yerel geliştirme) kapalı kalır. */
export function initSentry(config: AppConfig): boolean {
  if (!config.sentryDsn) {
    setErrorReporter(undefined);
    return false;
  }
  Sentry.init({
    dsn: config.sentryDsn,
    environment: config.appVariant,
    sendDefaultPii: false,
    tracesSampleRate: config.appVariant === 'production' ? 0.1 : 1,
  });
  setErrorReporter((error, tags) => {
    Sentry.captureException(error, {
      tags: { layer: tags.layer, feature: tags.feature, operation: tags.operation },
    });
  });
  return true;
}

/** Açılışta bir kez: ayarları doğrular (eksikse ConfigError) ve hata izlemeyi başlatır. */
export function initObservability(): AppConfig {
  const config = getConfig();
  initSentry(config);
  return config;
}

/** Kök bileşeni Sentry ile sarar (yakalanmamış hatalar ve dokunma izleri için). */
export const wrapRoot = Sentry.wrap;
