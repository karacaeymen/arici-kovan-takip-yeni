import { fireEvent, renderWithProviders, screen } from '@/test-utils/render';

import { PhoneInput, toMobileDigits } from './PhoneInput';

const props = { label: 'Cep telefonu', placeholder: '5XX XXX XX XX' };

describe('PhoneInput', () => {
  it('rakamları gruplu gösterir ve +90 ön ekini sabit tutar', async () => {
    await renderWithProviders(
      <PhoneInput {...props} digits="5321234567" onChangeDigits={jest.fn()} />,
    );

    expect(screen.getByLabelText('Cep telefonu')).toHaveDisplayValue('532 123 45 67');
    expect(screen.getByText('+90')).toBeOnTheScreen();
  });

  it('yazılanı yalnızca rakam olarak dışarı verir', async () => {
    const onChangeDigits = jest.fn();
    await renderWithProviders(<PhoneInput {...props} digits="" onChangeDigits={onChangeDigits} />);

    await fireEvent.changeText(screen.getByLabelText('Cep telefonu'), '0532 123 45 67');

    expect(onChangeDigits).toHaveBeenCalledWith('5321234567');
  });

  it('hata metnini uyarı olarak gösterir', async () => {
    await renderWithProviders(
      <PhoneInput {...props} digits="53" onChangeDigits={jest.fn()} error="Geçersiz numara" />,
    );
    expect(screen.getByRole('alert')).toHaveTextContent('Geçersiz numara');
  });

  it('klavyede tamam basılınca onSubmit çağırır', async () => {
    const onSubmit = jest.fn();
    await renderWithProviders(
      <PhoneInput {...props} digits="5321234567" onChangeDigits={jest.fn()} onSubmit={onSubmit} />,
    );
    await fireEvent(screen.getByLabelText('Cep telefonu'), 'submitEditing');
    expect(onSubmit).toHaveBeenCalled();
  });
});

describe('toMobileDigits', () => {
  it.each([
    ['532 123 45 67', '5321234567'],
    ['0532 123 45 67', '5321234567'],
    ['+90 532 123 45 67', '5321234567'],
    ['905321234567', '5321234567'],
    ['53212345678999', '5321234567'],
    ['', ''],
  ])('%j → %j', (text, digits) => {
    expect(toMobileDigits(text)).toBe(digits);
  });
});
