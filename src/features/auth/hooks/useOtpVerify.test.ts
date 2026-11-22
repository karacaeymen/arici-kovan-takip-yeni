import { act, renderHook } from '@testing-library/react-native';

import { AuthRequestError } from '@/data/api/auth.client';
import { createAuthServiceMock, TEST_PHONE } from '@/test-utils/auth-mock';

import { useOtpVerify } from './useOtpVerify';

const mockAuth = createAuthServiceMock();
jest.mock('@/services/auth', () =>
  jest.requireActual('@/test-utils/auth-mock').authModuleMock(() => mockAuth.service),
);

describe('useOtpVerify', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    jest.useFakeTimers();
  });
  afterEach(() => jest.useRealTimers());

  const setup = () => renderHook(() => useOtpVerify(TEST_PHONE));

  it('numarayı okunur biçimde verir; tekrar gönderme için 60 sn sayar', async () => {
    const { result } = await setup();

    expect(result.current.displayPhone).toBe('+90 532 123 45 67');
    expect(result.current.codeLength).toBe(6);
    expect(result.current.secondsLeft).toBe(60);

    await act(async () => jest.advanceTimersByTime(3_000));
    expect(result.current.secondsLeft).toBe(57);

    await act(async () => jest.advanceTimersByTime(60_000));
    expect(result.current.secondsLeft).toBe(0);
  });

  it('kodu doğrular', async () => {
    const { result } = await setup();
    await act(async () => result.current.changeCode('123456'));

    let ok = false;
    await act(async () => {
      ok = await result.current.verify();
    });

    expect(ok).toBe(true);
    expect(mockAuth.service.verifyCode).toHaveBeenCalledWith(TEST_PHONE, '123456');
  });

  it('yanlış kodda hatayı verir ve kutuyu temizler', async () => {
    mockAuth.service.verifyCode.mockRejectedValueOnce(new AuthRequestError('invalid_code', 'x'));
    const { result } = await setup();

    let ok = true;
    await act(async () => {
      ok = await result.current.verify('000000');
    });

    expect(ok).toBe(false);
    expect(result.current.error).toBe('invalid_code');
    expect(result.current.code).toBe('');
    await act(async () => result.current.changeCode('1'));
    expect(result.current.error).toBeNull();
  });

  it('geri sayım bitmeden yeni kod istemez; bitince ister ve sayacı yeniden başlatır', async () => {
    const { result } = await setup();

    await act(async () => result.current.resend());
    expect(mockAuth.service.requestCode).not.toHaveBeenCalled();

    await act(async () => jest.advanceTimersByTime(61_000));
    await act(async () => result.current.resend());

    expect(mockAuth.service.requestCode).toHaveBeenCalledWith(TEST_PHONE);
    expect(result.current.resent).toBe(true);
    expect(result.current.secondsLeft).toBe(60);
  });

  it('yeni kod istenemezse hatayı verir', async () => {
    mockAuth.service.requestCode.mockRejectedValueOnce(new Error('bozuk'));
    const { result } = await setup();
    await act(async () => jest.advanceTimersByTime(61_000));

    await act(async () => result.current.resend());

    expect(result.current.error).toBe('unknown');
    expect(result.current.resent).toBe(false);
  });
});
