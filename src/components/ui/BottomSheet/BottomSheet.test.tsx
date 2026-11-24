import { Text } from 'react-native';

import { fireEvent, renderWithProviders, screen } from '@/test-utils/render';

import { BottomSheet } from './BottomSheet';

describe('BottomSheet', () => {
  it('açıkken başlığı ve içeriği gösterir', async () => {
    await renderWithProviders(
      <BottomSheet visible title="Arılık seç" onClose={jest.fn()}>
        <Text>Yayla Arılığı</Text>
      </BottomSheet>,
    );

    expect(screen.getByRole('header', { name: 'Arılık seç' })).toBeOnTheScreen();
    expect(screen.getByText('Yayla Arılığı')).toBeOnTheScreen();
  });

  it('kapalıyken hiçbir şey göstermez', async () => {
    await renderWithProviders(
      <BottomSheet visible={false} title="Arılık seç" onClose={jest.fn()}>
        <Text>Yayla Arılığı</Text>
      </BottomSheet>,
    );
    expect(screen.queryByText('Yayla Arılığı')).toBeNull();
  });

  it('"Kapat" düğmesi ve arka plan paneli kapatır', async () => {
    const onClose = jest.fn();
    await renderWithProviders(
      <BottomSheet visible title="Arılık seç" onClose={onClose}>
        <Text>içerik</Text>
      </BottomSheet>,
    );

    // Panel açıkken ekran okuyucu yalnızca paneli görür (arka plan gizli), ama dokunulabilir.
    expect(screen.getAllByRole('button', { name: 'Kapat' })).toHaveLength(1);
    const closeButtons = screen.getAllByRole('button', {
      name: 'Kapat',
      includeHiddenElements: true,
    });
    expect(closeButtons).toHaveLength(2);
    for (const button of closeButtons) await fireEvent.press(button);

    expect(onClose).toHaveBeenCalledTimes(2);
  });
});
