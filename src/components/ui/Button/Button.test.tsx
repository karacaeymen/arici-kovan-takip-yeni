import { fireEvent, renderWithProviders, screen } from '@/test-utils/render';

import { Button } from './Button';

describe('Button', () => {
  it('etiketiyle bir düğmedir ve basılınca onPress çağırır', async () => {
    const onPress = jest.fn();
    await renderWithProviders(<Button label="Kaydet" onPress={onPress} />);

    await fireEvent.press(screen.getByRole('button', { name: 'Kaydet' }));

    expect(onPress).toHaveBeenCalledTimes(1);
  });

  it('devre dışıyken basılamaz', async () => {
    const onPress = jest.fn();
    await renderWithProviders(<Button label="Kaydet" onPress={onPress} disabled />);

    const button = screen.getByRole('button', { name: 'Kaydet' });
    await fireEvent.press(button);

    expect(button).toBeDisabled();
    expect(onPress).not.toHaveBeenCalled();
  });

  it('yüklenirken meşgul görünür, etiket yerine gösterge vardır ve basılamaz', async () => {
    const onPress = jest.fn();
    await renderWithProviders(<Button label="Kaydet" onPress={onPress} loading />);

    const button = screen.getByRole('button', { name: 'Kaydet' });
    await fireEvent.press(button);

    expect(button).toBeBusy();
    expect(screen.queryByText('Kaydet')).toBeNull();
    expect(onPress).not.toHaveBeenCalled();
  });

  it('metin düğmesi de en az 56 dp yüksekliktedir', async () => {
    await renderWithProviders(<Button label="Vazgeç" variant="text" onPress={jest.fn()} />);
    expect(screen.getByRole('button', { name: 'Vazgeç' })).toHaveStyle({ minHeight: 56 });
  });
});
