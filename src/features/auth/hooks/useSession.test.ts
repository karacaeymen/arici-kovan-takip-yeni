import { act, renderHook } from '@testing-library/react-native';

import { createAuthServiceMock, TEST_USER } from '@/test-utils/auth-mock';

import { useSession } from './useSession';

const mockAuth = createAuthServiceMock();
jest.mock('@/services/auth', () =>
  jest.requireActual('@/test-utils/auth-mock').authModuleMock(() => mockAuth.service),
);

describe('useSession', () => {
  it('oturum servisini başlatır ve durumu canlı verir', async () => {
    const { result } = await renderHook(() => useSession());

    expect(mockAuth.service.start).toHaveBeenCalled();
    expect(result.current.status).toBe('loading');

    await act(async () => mockAuth.setSnapshot({ status: 'signedIn', user: TEST_USER }));

    expect(result.current).toEqual({ status: 'signedIn', user: TEST_USER });
  });
});
