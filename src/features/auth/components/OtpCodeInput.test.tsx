import { fireEvent, renderWithProviders, screen } from '@/test-utils/render';

import { OtpCodeInput } from './OtpCodeInput';

describe('OtpCodeInput', () => {
  it('her haneyi kendi kutusunda gösterir', async () => {
    await renderWithProviders(
      <OtpCodeInput label="Kod" value="123" length={6} onChange={jest.fn()} />,
    );
    expect(screen.getByText('1')).toBeOnTheScreen();
    expect(screen.getByText('3')).toBeOnTheScreen();
  });

  it('yalnızca rakamları alır, uzunluğu aşmaz ve tamamlanınca onComplete çağırır', async () => {
    const onChange = jest.fn();
    const onComplete = jest.fn();
    await renderWithProviders(
      <OtpCodeInput label="Kod" value="" length={6} onChange={onChange} onComplete={onComplete} />,
    );

    await fireEvent.changeText(screen.getByLabelText('Kod'), '12a34');
    await fireEvent.changeText(screen.getByLabelText('Kod'), '1234567');

    expect(onChange.mock.calls).toEqual([['1234'], ['123456']]);
    expect(onComplete).toHaveBeenCalledTimes(1);
    expect(onComplete).toHaveBeenCalledWith('123456');
  });

  it('SMS kodunu otomatik doldurmaya uygundur', async () => {
    await renderWithProviders(
      <OtpCodeInput label="Kod" value="" length={6} onChange={jest.fn()} />,
    );
    expect(screen.getByLabelText('Kod')).toHaveProp('textContentType', 'oneTimeCode');
    expect(screen.getByLabelText('Kod')).toHaveProp('autoComplete', 'sms-otp');
  });

  it('hata metnini uyarı olarak gösterir', async () => {
    await renderWithProviders(
      <OtpCodeInput label="Kod" value="" length={6} onChange={jest.fn()} error="Kod yanlış" />,
    );
    expect(screen.getByRole('alert')).toHaveTextContent('Kod yanlış');
  });
});
