import { ConfigError, parseConfig } from './config';

const VALID = {
  EXPO_PUBLIC_SUPABASE_URL: 'https://abc.supabase.co',
  EXPO_PUBLIC_SUPABASE_ANON_KEY: 'anon-key',
};

describe('parseConfig', () => {
  it('geçerli değerleri okur, sürüm verilmezse development kullanır', () => {
    expect(parseConfig(VALID)).toEqual({
      appVariant: 'development',
      supabaseUrl: 'https://abc.supabase.co',
      supabaseAnonKey: 'anon-key',
    });
  });

  it('Sentry DSN ve sürümü okur', () => {
    const config = parseConfig({
      ...VALID,
      EXPO_PUBLIC_APP_VARIANT: 'production',
      EXPO_PUBLIC_SENTRY_DSN: 'https://key@o1.ingest.sentry.io/2',
    });
    expect(config.appVariant).toBe('production');
    expect(config.sentryDsn).toBe('https://key@o1.ingest.sentry.io/2');
  });

  it('boş değeri eksik sayar', () => {
    expect(parseConfig({ ...VALID, EXPO_PUBLIC_SENTRY_DSN: '  ' }).sentryDsn).toBeUndefined();
  });

  it('eksik ve hatalı değişkenlerin adlarını hata mesajında listeler', () => {
    const run = () =>
      parseConfig({ EXPO_PUBLIC_SUPABASE_URL: 'adres-degil', EXPO_PUBLIC_APP_VARIANT: 'staging' });
    expect(run).toThrow(ConfigError);
    try {
      run();
    } catch (error) {
      expect((error as ConfigError).variables.sort()).toEqual([
        'EXPO_PUBLIC_APP_VARIANT',
        'EXPO_PUBLIC_SUPABASE_ANON_KEY',
        'EXPO_PUBLIC_SUPABASE_URL',
      ]);
      expect((error as Error).message).toContain('.env.local');
    }
  });
});
