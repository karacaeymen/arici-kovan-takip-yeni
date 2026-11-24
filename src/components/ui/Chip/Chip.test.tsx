import { fireEvent, renderWithProviders, screen } from '@/test-utils/render';

import { Chip } from './Chip';

describe('Chip', () => {
  it('basılınca onPress çağırır; seçili durumu bildirir', async () => {
    const onPress = jest.fn();
    await renderWithProviders(<Chip label="Sakin" selected onPress={onPress} />);

    const chip = screen.getByRole('button', { name: 'Sakin' });
    await fireEvent.press(chip);

    expect(onPress).toHaveBeenCalledTimes(1);
    expect(chip).toBeSelected();
    expect(chip).toHaveStyle({ minHeight: 56 });
  });

  it('seçili değilken seçili görünmez; devre dışıyken basılamaz', async () => {
    const onPress = jest.fn();
    await renderWithProviders(<Chip label="Saldırgan" onPress={onPress} disabled />);

    const chip = screen.getByRole('button', { name: 'Saldırgan' });
    await fireEvent.press(chip);

    expect(chip).not.toBeSelected();
    expect(chip).toBeDisabled();
    expect(onPress).not.toHaveBeenCalled();
  });
});
