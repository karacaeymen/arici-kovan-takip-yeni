import { AuthApiError, AuthRetryableFetchError } from '@supabase/supabase-js';

import { AuthRequestError, createAuthClient, toAuthError } from './auth.client';

jest.mock('expo-secure-store', () => ({}));

const PHONE = '+905321234567';
const USER = { id: 'kullanici-1', phone: '905321234567' };

function fakeAuth() {
  let listener: ((event: string, session: unknown) => void) | undefined;
  const unsubscribe = jest.fn();
  const auth = {
    signInWithOtp: jest.fn(async () => ({ data: {}, error: null as unknown })),
    verifyOtp: jest.fn(async () => ({ data: { user: USER as unknown }, error: null as unknown })),
    signOut: jest.fn(async () => ({ error: null as unknown })),
    onAuthStateChange: jest.fn((callback: (event: string, session: unknown) => void) => {
      listener = callback;
      return { data: { subscription: { unsubscribe } } };
    }),
    startAutoRefresh: jest.fn(async () => {}),
    stopAutoRefresh: jest.fn(async () => {}),
  };
  const client = createAuthClient(auth as unknown as Parameters<typeof createAuthClient>[0]);
  return {
    auth,
    client,
    unsubscribe,
    emit: (session: unknown) => listener?.('SIGNED_IN', session),
  };
}

describe('auth istemcisi', () => {
  it('SMS kodunu numaraya gönderir', async () => {
    const { auth, client } = fakeAuth();
    await client.sendCode(PHONE);
    expect(auth.signInWithOtp).toHaveBeenCalledWith({ phone: PHONE, options: { channel: 'sms' } });
  });

  it('kodu doğrular ve kullanıcıyı döndürür', async () => {
    const { auth, client } = fakeAuth();
    await expect(client.verifyCode(PHONE, '123456')).resolves.toEqual(USER);
    expect(auth.verifyOtp).toHaveBeenCalledWith({ phone: PHONE, token: '123456', type: 'sms' });
  });

  it('yanıtta kullanıcı yoksa unknown verir', async () => {
    const { auth, client } = fakeAuth();
    auth.verifyOtp.mockResolvedValueOnce({ data: { user: null }, error: null });
    await expect(client.verifyCode(PHONE, '123456')).rejects.toMatchObject({ kind: 'unknown' });
  });

  it('Supabase hatasını çevirip fırlatır', async () => {
    const { auth, client } = fakeAuth();
    auth.signInWithOtp.mockResolvedValueOnce({
      data: {},
      error: new AuthApiError('Too many', 429, 'over_sms_send_rate_limit'),
    });
    auth.signOut.mockResolvedValueOnce({ error: new AuthRetryableFetchError('fetch failed', 0) });

    await expect(client.sendCode(PHONE)).rejects.toMatchObject({ kind: 'rate_limited' });
    await expect(client.signOut()).rejects.toMatchObject({ kind: 'network' });
  });

  it('oturum değişikliğini kullanıcı olarak bildirir ve dinlemeyi bırakabilir', () => {
    const { client, emit, unsubscribe } = fakeAuth();
    const listener = jest.fn();

    const stop = client.onUserChange(listener);
    emit({ user: USER });
    emit(null);
    stop();

    expect(listener.mock.calls).toEqual([[USER], [null]]);
    expect(unsubscribe).toHaveBeenCalled();
  });

  it('telefonsuz kullanıcının numarası null olur', () => {
    const { client, emit } = fakeAuth();
    const listener = jest.fn();
    client.onUserChange(listener);
    emit({ user: { id: 'x' } });
    expect(listener).toHaveBeenCalledWith({ id: 'x', phone: null });
  });

  it('belirteç yenilemeyi açıp kapatır', () => {
    const { auth, client } = fakeAuth();
    client.setAutoRefresh(true);
    client.setAutoRefresh(false);
    expect(auth.startAutoRefresh).toHaveBeenCalledTimes(1);
    expect(auth.stopAutoRefresh).toHaveBeenCalledTimes(1);
  });
});

describe('toAuthError', () => {
  it.each([
    ['validation_failed', 'invalid_phone'],
    ['otp_expired', 'invalid_code'],
    ['invalid_credentials', 'invalid_code'],
    ['over_sms_send_rate_limit', 'rate_limited'],
    ['over_request_rate_limit', 'rate_limited'],
    ['sms_send_failed', 'unavailable'],
    ['phone_provider_disabled', 'unavailable'],
    ['signup_disabled', 'unavailable'],
    ['unexpected_failure', 'unknown'],
  ])('%s → %s', (code, kind) => {
    const error = toAuthError(new AuthApiError('hata', 400, code));
    expect(error).toMatchObject({ kind, code });
  });

  it('kodu olmayan 429 rate_limited, ağ hatası network olur', () => {
    expect(toAuthError({ status: 429, message: 'yavaş' }).kind).toBe('rate_limited');
    expect(toAuthError(new TypeError('Network request failed')).kind).toBe('network');
    expect(toAuthError(new AuthRetryableFetchError('fetch failed', 0)).kind).toBe('network');
  });

  it('tanınmayan hata unknown olur; zaten çevrilmiş hata olduğu gibi kalır', () => {
    expect(toAuthError(undefined)).toMatchObject({
      kind: 'unknown',
      message: 'Kimlik doğrulama hatası',
    });
    const error = new AuthRequestError('invalid_code', 'yanlış');
    expect(toAuthError(error)).toBe(error);
  });
});
