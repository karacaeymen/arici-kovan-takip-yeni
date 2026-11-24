import { Text } from 'react-native';

import { fireEvent, renderWithProviders, screen } from '@/test-utils/render';

import { Card } from './Card';

describe('Card', () => {
  it('basılabilir değilse düğme değildir', async () => {
    await renderWithProviders(
      <Card>
        <Text>Yayla Arılığı</Text>
      </Card>,
    );
    expect(screen.getByText('Yayla Arılığı')).toBeOnTheScreen();
    expect(screen.queryByRole('button')).toBeNull();
  });

  it('onPress verilince etiketiyle tek düğmedir', async () => {
    const onPress = jest.fn();
    await renderWithProviders(
      <Card onPress={onPress} accessibilityLabel="Kovan 7, aktif" tone="highlight">
        <Text>Kovan 7</Text>
      </Card>,
    );

    await fireEvent.press(screen.getByRole('button', { name: 'Kovan 7, aktif' }));

    expect(onPress).toHaveBeenCalledTimes(1);
  });
});
