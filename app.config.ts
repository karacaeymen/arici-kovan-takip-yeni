// Expo uygulama ayarları (TODO.md T0.5). Ortama göre değişen her şey burada, EXPO_PUBLIC_APP_VARIANT'a göre seçilir.
// EXPO_PUBLIC_APP_VARIANT'ı eas.json'daki build profili verir; yerelde `npm start` için varsayılan "development"tır.
import type { ConfigContext, ExpoConfig } from 'expo/config';

export type AppVariant = 'development' | 'preview' | 'production';

// K2 açık: kalıcı uygulama kimliği mağaza hesapları açılırken seçilecek. Yalnızca bu satır değişir.
// Kimlik yayından sonra değiştirilemez; o zamana kadar bu geçici değer kullanılır.
export const BASE_APP_ID = 'com.aricikovantakip.app';

const VARIANTS: Record<AppVariant, { idSuffix: string; nameSuffix: string; scheme: string }> = {
  // Farklı kimlikler sayesinde üç sürüm aynı telefona yan yana kurulabilir.
  development: { idSuffix: '.dev', nameSuffix: ' (Dev)', scheme: 'aricikovantakip-dev' },
  preview: { idSuffix: '.preview', nameSuffix: ' (Test)', scheme: 'aricikovantakip-preview' },
  production: { idSuffix: '', nameSuffix: '', scheme: 'aricikovantakip' },
};

export function resolveVariant(value: string | undefined): AppVariant {
  if (value === undefined || value === '') return 'development';
  if (value in VARIANTS) return value as AppVariant;
  throw new Error(
    `EXPO_PUBLIC_APP_VARIANT geçersiz: "${value}". Geçerli değerler: ${Object.keys(VARIANTS).join(', ')}`,
  );
}

export function createAppConfig(env: Record<string, string | undefined>): ExpoConfig {
  const variant = resolveVariant(env.EXPO_PUBLIC_APP_VARIANT);
  const { idSuffix, nameSuffix, scheme } = VARIANTS[variant];
  const appId = `${BASE_APP_ID}${idSuffix}`;
  const easProjectId = env.EAS_PROJECT_ID;

  return {
    name: `Arıcı Kovan Takip${nameSuffix}`,
    slug: 'arici-kovan-takip',
    version: '0.1.0',
    orientation: 'portrait',
    scheme,
    userInterfaceStyle: 'light',
    ios: { bundleIdentifier: appId, supportsTablet: false },
    android: { package: appId },
    plugins: ['expo-router'],
    experiments: { typedRoutes: true },
    extra: {
      appVariant: variant,
      ...(easProjectId ? { eas: { projectId: easProjectId } } : {}),
    },
  };
}

export default ({ config }: ConfigContext): ExpoConfig => ({
  ...config,
  ...createAppConfig(process.env),
});
