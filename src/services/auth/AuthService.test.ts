import { AuthRequestError, type AuthUser } from '../../data/api/auth.client';
import { setErrorReporter } from '../../lib/observability/report';

import { createAuthService } from './AuthService';

jest.mock('expo-secure-store', () => ({}));

const PHONE = '+905321234567';
const USER: AuthUser = { id: 'kullanici-1', phone: '905321234567' };

function setup(currentState: string | null = 'active') {
  let userListener: ((user: AuthUser | null) => void) | undefined;
  let appListener: ((state: string) => void) | undefined;
  const client = {
    sendCode: jest.fn(async () => {}),
    verifyCode: jest.fn(async () => USER),
    signOut: jest.fn(async () => {}),
    onUserChange: jest.fn((listener: (user: AuthUser | null) => void) => {
      userListener = listener;
      return () => {};
    }),
    setAutoRefresh: jest.fn(),
  };
  const sync = { start: jest.fn(), stop: jest.fn() };
  const appState = {
    currentState,
    addEventListener: jest.fn((_type: 'change', listener: (state: string) => void) => {
      appListener = listener;
      return { remove: jest.fn() };
    }),
  };
  const service = createAuthService({ client, sync, appState });
  return {
    client,
    sync,
    service,
    emitUser: (user: AuthUser | null) => userListener?.(user),
    setAppState: (state: string) => appListener?.(state),
  };
}

describe('AuthService', () => {
  const reporter = jest.fn();
  beforeEach(() => {
    reporter.mockReset();
    setErrorReporter(reporter);
  });
  afterAll(() => setErrorReporter(undefined));

  describe('oturum durumu', () => {
    it('depodaki oturum okunana kadar loading; sonra signedIn/signedOut', () => {
      const t = setup();
      expect(t.service.getSnapshot()).toEqual({ status: 'loading', user: null });

      t.service.start();
      t.emitUser(USER);
      expect(t.service.getSnapshot()).toEqual({ status: 'signedIn', user: USER });

      t.emitUser(null);
      expect(t.service.getSnapshot()).toEqual({ status: 'signedOut', user: null });
    });

    it('oturum açılınca senkronu başlatır, kapanınca durdurur', () => {
      const t = setup();
      t.service.start();

      t.emitUser(USER);
      t.emitUser(USER); // belirteç yenilendi: aynı kullanıcı, tekrar başlatılmaz
      t.emitUser(null);

      expect(t.sync.start).toHaveBeenCalledTimes(1);
      expect(t.sync.stop).toHaveBeenCalledTimes(1);
    });

    it('abonelere değişikliği bildirir; abonelik kaldırılabilir', () => {
      const t = setup();
      const listener = jest.fn();
      const unsubscribe = t.service.subscribe(listener);
      t.service.start();

      t.emitUser(USER);
      unsubscribe();
      t.emitUser(null);

      expect(listener).toHaveBeenCalledTimes(1);
      expect(listener).toHaveBeenCalledWith({ status: 'signedIn', user: USER });
    });

    it('start bir kez dinlemeye başlar; belirteç yenileme uygulama öndeyken açıktır', () => {
      const t = setup('background');
      t.service.start();
      t.service.start();

      expect(t.client.onUserChange).toHaveBeenCalledTimes(1);
      expect(t.client.setAutoRefresh).toHaveBeenLastCalledWith(false);
      t.setAppState('active');
      expect(t.client.setAutoRefresh).toHaveBeenLastCalledWith(true);
      t.setAppState('background');
      expect(t.client.setAutoRefresh).toHaveBeenLastCalledWith(false);
    });

    it('uygulama durumu bilinmiyorsa öndeymiş gibi davranır', () => {
      const t = setup(null);
      t.service.start();
      expect(t.client.setAutoRefresh).toHaveBeenCalledWith(true);
    });
  });

  describe('requestCode', () => {
    it('numarayı +90 biçimine çevirip kod gönderir', async () => {
      const t = setup();
      await expect(t.service.requestCode('0532 123 45 67')).resolves.toBe(PHONE);
      expect(t.client.sendCode).toHaveBeenCalledWith(PHONE);
    });

    it('geçersiz numarada sunucuya gitmez, bildirmez', async () => {
      const t = setup();
      await expect(t.service.requestCode('212 123')).rejects.toMatchObject({
        kind: 'invalid_phone',
      });
      expect(t.client.sendCode).not.toHaveBeenCalled();
      expect(reporter).not.toHaveBeenCalled();
    });

    it('kullanıcı kaynaklı hatayı bildirmez, sunucu ayar hatasını bildirir', async () => {
      const t = setup();
      t.client.sendCode
        .mockRejectedValueOnce(new AuthRequestError('rate_limited', 'çok sık'))
        .mockRejectedValueOnce(new AuthRequestError('unavailable', 'SMS kapalı'));

      await expect(t.service.requestCode('5321234567')).rejects.toMatchObject({
        kind: 'rate_limited',
      });
      expect(reporter).not.toHaveBeenCalled();
      await expect(t.service.requestCode('5321234567')).rejects.toMatchObject({
        kind: 'unavailable',
      });
      expect(reporter).toHaveBeenCalledWith(expect.any(AuthRequestError), {
        layer: 'service',
        feature: 'auth',
        operation: 'requestCode',
      });
    });

    it('beklenmeyen hatayı unknown olarak fırlatır ve bildirir', async () => {
      const t = setup();
      const error = new Error('bozuk');
      t.client.sendCode.mockRejectedValueOnce(error);

      await expect(t.service.requestCode('5321234567')).rejects.toMatchObject({ kind: 'unknown' });
      expect(reporter).toHaveBeenCalledWith(error, expect.objectContaining({ feature: 'auth' }));
    });
  });

  describe('verifyCode', () => {
    it('kodu doğrular, oturumu açar ve senkronu başlatır', async () => {
      const t = setup();
      await expect(t.service.verifyCode(PHONE, '123 456')).resolves.toEqual(USER);

      expect(t.client.verifyCode).toHaveBeenCalledWith(PHONE, '123456');
      expect(t.service.getSnapshot().status).toBe('signedIn');
      expect(t.sync.start).toHaveBeenCalledTimes(1);
    });

    it('6 haneli olmayan kodu sunucuya göndermez', async () => {
      const t = setup();
      await expect(t.service.verifyCode(PHONE, '123')).rejects.toMatchObject({
        kind: 'invalid_code',
      });
      expect(t.client.verifyCode).not.toHaveBeenCalled();
    });

    it('yanlış kodda oturum açılmaz', async () => {
      const t = setup();
      t.client.verifyCode.mockRejectedValueOnce(new AuthRequestError('invalid_code', 'yanlış'));

      await expect(t.service.verifyCode(PHONE, '000000')).rejects.toMatchObject({
        kind: 'invalid_code',
      });
      expect(t.service.getSnapshot().status).toBe('loading');
      expect(t.sync.start).not.toHaveBeenCalled();
    });
  });

  it('signOut oturumu kapatır ve senkronu durdurur', async () => {
    const t = setup();
    await t.service.verifyCode(PHONE, '123456');

    await t.service.signOut();

    expect(t.client.signOut).toHaveBeenCalled();
    expect(t.service.getSnapshot()).toEqual({ status: 'signedOut', user: null });
    expect(t.sync.stop).toHaveBeenCalledTimes(1);
  });
});
