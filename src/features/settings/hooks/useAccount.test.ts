import { act, renderHook } from '@testing-library/react-native';

import { createAuthServiceMock, TEST_USER } from '@/test-utils/auth-mock';

import { useAccount } from './useAccount';

const mockAuth = createAuthServiceMock({ status: 'signedIn', user: TEST_USER });
jest.mock('@/services/auth', () =>
  jest.requireActual('@/test-utils/auth-mock').authModuleMock(() => mockAuth.service),
);

describe('useAccount', () => {
  beforeEach(() => jest.clearAllMocks());

  it('giriş yapılan numarayı okunur biçimde verir', async () => {
    const { result } = await renderHook(() => useAccount());
    expect(result.current.phone).toBe('+90 532 123 45 67');
  });

  it('oturum yoksa numara boştur', async () => {
    mockAuth.setSnapshot({ status: 'signedOut', user: null });
    const { result } = await renderHook(() => useAccount());
    expect(result.current.phone).toBeNull();
    mockAuth.setSnapshot({ status: 'signedIn', user: TEST_USER });
  });

  it('çıkış yapar', async () => {
    const { result } = await renderHook(() => useAccount());

    await act(async () => {
      await result.current.signOut();
    });

    expect(mockAuth.service.signOut).toHaveBeenCalledTimes(1);
    expect(result.current.failed).toBe(false);
    expect(result.current.signingOut).toBe(false);
  });

  it('çıkış başarısız olursa bunu bildirir', async () => {
    mockAuth.service.signOut.mockRejectedValueOnce(new Error('ağ yok'));
    const { result } = await renderHook(() => useAccount());

    await act(async () => {
      await result.current.signOut();
    });

    expect(result.current.failed).toBe(true);
  });
});
