import { fireEvent, renderWithProviders, screen } from '@/test-utils/render';

import { SettingsMenuItem } from './SettingsMenuItem';

describe('SettingsMenuItem', () => {
  it('başlık ve açıklamayla bir düğmedir; basılınca onPress çağırır', async () => {
    const onPress = jest.fn();
    await renderWithProviders(
      <SettingsMenuItem title="Senkron durumu" subtitle="Kayıtlar güncel" onPress={onPress} />,
    );

    await fireEvent.press(screen.getByRole('button', { name: 'Senkron durumu, Kayıtlar güncel' }));

    expect(onPress).toHaveBeenCalledTimes(1);
    expect(screen.getByTestId('icon-chevron-right')).toBeOnTheScreen();
  });

  it('tehlikeli eylemde ok göstermez; devre dışıyken basılamaz', async () => {
    const onPress = jest.fn();
    await renderWithProviders(
      <SettingsMenuItem title="Çıkış yap" onPress={onPress} destructive disabled />,
    );

    const button = screen.getByRole('button', { name: 'Çıkış yap' });
    await fireEvent.press(button);

    expect(button).toBeDisabled();
    expect(onPress).not.toHaveBeenCalled();
    expect(screen.queryByTestId('icon-chevron-right')).toBeNull();
  });
});
