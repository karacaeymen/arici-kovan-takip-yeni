import { AuthRequestError } from '@/data/api/auth.client';
import { createAuthServiceMock, TEST_PHONE } from '@/test-utils/auth-mock';
import { fireEvent, renderWithProviders, screen } from '@/test-utils/render';

import { LoginScreen } from './LoginScreen';

const mockAuth = createAuthServiceMock();
jest.mock('@/services/auth', () =>
  jest.requireActual('@/test-utils/auth-mock').authModuleMock(() => mockAuth.service),
);
const mockRouter = { push: jest.fn(), back: jest.fn() };
jest.mock('expo-router', () => ({ useRouter: () => mockRouter }));

describe('LoginScreen', () => {
  beforeEach(() => jest.clearAllMocks());

  const typePhone = (text: string) =>
    fireEvent.changeText(screen.getByLabelText('Cep telefonu numarası'), text);

  it('numara tamamlanmadan "Kod gönder" basılamaz', async () => {
    await renderWithProviders(<LoginScreen />);

    expect(screen.getByRole('header', { name: 'Telefonla giriş' })).toBeOnTheScreen();
    expect(screen.getByRole('button', { name: 'Kod gönder' })).toBeDisabled();
    await typePhone('532 123');
    expect(screen.getByRole('button', { name: 'Kod gönder' })).toBeDisabled();
  });

  it('kodu gönderir ve numarayla doğrulama ekranına geçer', async () => {
    await renderWithProviders(<LoginScreen />);

    await typePhone('0532 123 45 67');
    await fireEvent.press(screen.getByRole('button', { name: 'Kod gönder' }));

    expect(mockAuth.service.requestCode).toHaveBeenCalledWith('5321234567');
    expect(mockRouter.push).toHaveBeenCalledWith({
      pathname: '/otp-verify',
      params: { phone: TEST_PHONE },
    });
  });

  it('hata olursa anlaşılır mesaj gösterir ve ekranda kalır', async () => {
    mockAuth.service.requestCode.mockRejectedValueOnce(new AuthRequestError('network', 'x'));
    await renderWithProviders(<LoginScreen />);

    await typePhone('5321234567');
    await fireEvent.press(screen.getByRole('button', { name: 'Kod gönder' }));

    expect(screen.getByRole('alert')).toHaveTextContent(
      'İnternet bağlantısı yok. Bağlanınca tekrar dene.',
    );
    expect(mockRouter.push).not.toHaveBeenCalled();
  });
});
