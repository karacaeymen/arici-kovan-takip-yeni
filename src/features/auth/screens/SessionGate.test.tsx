import { Text } from 'react-native';

import { createAuthServiceMock, TEST_USER } from '@/test-utils/auth-mock';
import { act, renderWithProviders, screen } from '@/test-utils/render';

import { SessionGate } from './SessionGate';

const mockAuth = createAuthServiceMock();
jest.mock('@/services/auth', () =>
  jest.requireActual('@/test-utils/auth-mock').authModuleMock(() => mockAuth.service),
);
jest.mock('expo-router', () => {
  const { createElement } = jest.requireActual<typeof import('react')>('react');
  const { Text: RNText } = jest.requireActual<typeof import('react-native')>('react-native');
  return {
    Redirect: ({ href }: { href: string }) => createElement(RNText, null, `yönlendir:${href}`),
  };
});

const signedIn = { status: 'signedIn', user: TEST_USER } as const;
const signedOut = { status: 'signedOut', user: null } as const;

describe('SessionGate', () => {
  beforeEach(() => mockAuth.setSnapshot({ status: 'loading', user: null }));

  const renderGate = (require: 'signedIn' | 'signedOut') =>
    renderWithProviders(
      <SessionGate require={require}>
        <Text>içerik</Text>
      </SessionGate>,
    );

  it('oturum okunurken bekleme göstergesi gösterir; içerik ve yönlendirme yoktur', async () => {
    await renderGate('signedIn');

    expect(screen.getByLabelText('Yükleniyor…')).toBeOnTheScreen();
    expect(screen.queryByText('içerik')).toBeNull();
    expect(mockAuth.service.start).toHaveBeenCalled();
  });

  it('oturum yoksa sekmeler yerine giriş ekranına yönlendirir', async () => {
    mockAuth.setSnapshot(signedOut);
    await renderGate('signedIn');

    expect(screen.getByText('yönlendir:/login')).toBeOnTheScreen();
    expect(screen.queryByText('içerik')).toBeNull();
  });

  it('oturum varsa sekmeleri gösterir', async () => {
    mockAuth.setSnapshot(signedIn);
    await renderGate('signedIn');
    expect(screen.getByText('içerik')).toBeOnTheScreen();
  });

  it('oturum açıkken giriş ekranları yerine ana sayfaya yönlendirir', async () => {
    mockAuth.setSnapshot(signedIn);
    await renderGate('signedOut');
    expect(screen.getByText('yönlendir:/')).toBeOnTheScreen();
  });

  it('giriş yapılınca giriş ekranlarından ana sayfaya geçer', async () => {
    mockAuth.setSnapshot(signedOut);
    await renderGate('signedOut');
    expect(screen.getByText('içerik')).toBeOnTheScreen();

    await act(async () => mockAuth.setSnapshot(signedIn));

    expect(screen.getByText('yönlendir:/')).toBeOnTheScreen();
  });
});
