import { act, renderHook } from '@testing-library/react-native';

import { AuthRequestError } from '@/data/api/auth.client';
import { createAuthServiceMock, TEST_PHONE } from '@/test-utils/auth-mock';

import { useLogin } from './useLogin';

const mockAuth = createAuthServiceMock();
jest.mock('@/services/auth', () =>
  jest.requireActual('@/test-utils/auth-mock').authModuleMock(() => mockAuth.service),
);

describe('useLogin', () => {
  beforeEach(() => jest.clearAllMocks());

  it('kodu gönderir ve doğrulamada kullanılacak numarayı döndürür', async () => {
    const { result } = await renderHook(() => useLogin());

    await act(async () => result.current.changeDigits('5321234567'));
    let phone: string | null = null;
    await act(async () => {
      phone = await result.current.submit();
    });

    expect(mockAuth.service.requestCode).toHaveBeenCalledWith('5321234567');
    expect(phone).toBe(TEST_PHONE);
    expect(result.current.error).toBeNull();
    expect(result.current.sending).toBe(false);
  });

  it('hatada türünü verir ve null döner; numara değişince hata silinir', async () => {
    mockAuth.service.requestCode.mockRejectedValueOnce(
      new AuthRequestError('invalid_phone', 'geçersiz'),
    );
    const { result } = await renderHook(() => useLogin());

    let phone: string | null = 'x';
    await act(async () => {
      phone = await result.current.submit();
    });
    expect(phone).toBeNull();
    expect(result.current.error).toBe('invalid_phone');

    await act(async () => result.current.changeDigits('5'));
    expect(result.current.error).toBeNull();
  });

  it('beklenmeyen hatayı unknown sayar', async () => {
    mockAuth.service.requestCode.mockRejectedValueOnce(new Error('bozuk'));
    const { result } = await renderHook(() => useLogin());

    await act(async () => {
      await result.current.submit();
    });

    expect(result.current.error).toBe('unknown');
  });

  it('gönderim sürerken ikinci kez göndermez', async () => {
    let finish: (phone: string) => void = () => {};
    mockAuth.service.requestCode.mockImplementationOnce(
      () => new Promise<string>((resolve) => (finish = resolve)),
    );
    const { result } = await renderHook(() => useLogin());

    let first: Promise<string | null> = Promise.resolve(null);
    await act(async () => {
      first = result.current.submit();
    });
    expect(result.current.sending).toBe(true);
    await act(async () => {
      await result.current.submit();
    });
    await act(async () => {
      finish(TEST_PHONE);
      await first;
    });

    expect(mockAuth.service.requestCode).toHaveBeenCalledTimes(1);
  });
});
