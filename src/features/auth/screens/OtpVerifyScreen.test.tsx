import { AuthRequestError } from '@/data/api/auth.client';
import { createAuthServiceMock, TEST_PHONE } from '@/test-utils/auth-mock';
import { fireEvent, renderWithProviders, screen } from '@/test-utils/render';

import { OtpVerifyScreen } from './OtpVerifyScreen';

const mockAuth = createAuthServiceMock();
jest.mock('@/services/auth', () =>
  jest.requireActual('@/test-utils/auth-mock').authModuleMock(() => mockAuth.service),
);
const mockRouter = { push: jest.fn(), back: jest.fn() };
jest.mock('expo-router', () => {
  const { createElement } = jest.requireActual<typeof import('react')>('react');
  const { Text } = jest.requireActual<typeof import('react-native')>('react-native');
  return {
    useRouter: () => mockRouter,
    Redirect: ({ href }: { href: string }) => createElement(Text, null, `yönlendir:${href}`),
  };
});

describe('OtpVerifyScreen', () => {
  beforeEach(() => jest.clearAllMocks());

  it('kodun gönderildiği numarayı ve geri sayımı gösterir', async () => {
    await renderWithProviders(<OtpVerifyScreen phone={TEST_PHONE} />);

    expect(
      screen.getByText('+90 532 123 45 67 numarasına gönderilen 6 haneli kodu yaz.'),
    ).toBeOnTheScreen();
    expect(screen.getByText('60 sn sonra tekrar gönderebilirsin')).toBeOnTheScreen();
  });

  it('6 hane yazılınca kendiliğinden doğrular', async () => {
    await renderWithProviders(<OtpVerifyScreen phone={TEST_PHONE} />);

    await fireEvent.changeText(screen.getByLabelText('Doğrulama kodu'), '123456');

    expect(mockAuth.service.verifyCode).toHaveBeenCalledWith(TEST_PHONE, '123456');
  });

  it('yanlış kodda mesaj gösterir', async () => {
    mockAuth.service.verifyCode.mockRejectedValueOnce(new AuthRequestError('invalid_code', 'x'));
    await renderWithProviders(<OtpVerifyScreen phone={TEST_PHONE} />);

    await fireEvent.changeText(screen.getByLabelText('Doğrulama kodu'), '000000');

    expect(screen.getByRole('alert')).toHaveTextContent(
      'Kod yanlış ya da süresi dolmuş. Tekrar dene ya da yeni kod iste.',
    );
  });

  it('"Numarayı değiştir" giriş ekranına döner', async () => {
    await renderWithProviders(<OtpVerifyScreen phone={TEST_PHONE} />);

    await fireEvent.press(screen.getByRole('button', { name: 'Numarayı değiştir' }));

    expect(mockRouter.back).toHaveBeenCalled();
  });

  it('numara yoksa giriş ekranına yönlendirir', async () => {
    await renderWithProviders(<OtpVerifyScreen phone="" />);
    expect(screen.getByText('yönlendir:/login')).toBeOnTheScreen();
  });
});
