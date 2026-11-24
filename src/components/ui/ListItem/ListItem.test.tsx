import { fireEvent, renderWithProviders, screen } from '@/test-utils/render';

import { ListItem } from './ListItem';

describe('ListItem', () => {
  it('başlık, açıklama ve değeri tek etiketle okur; basılınca onPress çağırır', async () => {
    const onPress = jest.fn();
    await renderWithProviders(
      <ListItem
        title="Yayla Arılığı"
        subtitle="Son ziyaret dün"
        value="24 kovan"
        onPress={onPress}
      />,
    );

    await fireEvent.press(
      screen.getByRole('button', { name: 'Yayla Arılığı, Son ziyaret dün, 24 kovan' }),
    );

    expect(onPress).toHaveBeenCalledTimes(1);
    expect(screen.getByTestId('icon-chevron-right')).toBeOnTheScreen();
  });

  it('basılabilir değilse düğme değildir, ok göstermez; soldaki ikonu gösterir', async () => {
    await renderWithProviders(<ListItem title="Sürüm" value="0.1.0" icon="information-outline" />);

    expect(screen.queryByRole('button')).toBeNull();
    expect(screen.getByLabelText('Sürüm, 0.1.0')).toBeOnTheScreen();
    expect(screen.getByTestId('icon-information-outline')).toBeOnTheScreen();
    expect(screen.queryByTestId('icon-chevron-right')).toBeNull();
  });

  it('tehlikeli eylemde ok yoktur; devre dışıyken basılamaz; en az 56 dp', async () => {
    const onPress = jest.fn();
    await renderWithProviders(
      <ListItem title="Çıkış yap" onPress={onPress} destructive disabled />,
    );

    const button = screen.getByRole('button', { name: 'Çıkış yap' });
    await fireEvent.press(button);

    expect(button).toBeDisabled();
    expect(onPress).not.toHaveBeenCalled();
    expect(screen.queryByTestId('icon-chevron-right')).toBeNull();
    expect(button).toHaveStyle({ minHeight: 64 });
  });
});
