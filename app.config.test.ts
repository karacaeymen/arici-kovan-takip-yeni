import { BASE_APP_ID, createAppConfig, resolveVariant } from './app.config';

describe('app.config', () => {
  it('EXPO_PUBLIC_APP_VARIANT yoksa development kullanır', () => {
    expect(resolveVariant(undefined)).toBe('development');
    expect(resolveVariant('')).toBe('development');
  });

  it('geçersiz EXPO_PUBLIC_APP_VARIANT için anlaşılır hata verir', () => {
    expect(() => resolveVariant('staging')).toThrow('EXPO_PUBLIC_APP_VARIANT geçersiz: "staging"');
  });

  it.each([
    ['development', `${BASE_APP_ID}.dev`, 'Arıcı Kovan Takip (Dev)'],
    ['preview', `${BASE_APP_ID}.preview`, 'Arıcı Kovan Takip (Test)'],
    ['production', BASE_APP_ID, 'Arıcı Kovan Takip'],
  ])('%s için kimlik ve ad doğru', (variant, appId, name) => {
    const config = createAppConfig({ EXPO_PUBLIC_APP_VARIANT: variant });
    expect(config.ios?.bundleIdentifier).toBe(appId);
    expect(config.android?.package).toBe(appId);
    expect(config.name).toBe(name);
    expect(config.extra?.appVariant).toBe(variant);
  });

  it('EAS proje kimliği yalnızca verildiğinde eklenir', () => {
    expect(createAppConfig({}).extra?.eas).toBeUndefined();
    expect(createAppConfig({ EAS_PROJECT_ID: 'abc' }).extra?.eas).toEqual({ projectId: 'abc' });
  });
});
