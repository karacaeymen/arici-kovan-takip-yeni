import { useFonts } from 'expo-font';
import { Text } from 'react-native';

import { renderWithProviders, screen } from '@/test-utils/render';

import { FontGate } from './FontGate';

jest.mock('expo-font', () => ({ useFonts: jest.fn() }));
const mockUseFonts = jest.mocked(useFonts);

const renderGate = () =>
  renderWithProviders(
    <FontGate>
      <Text>uygulama</Text>
    </FontGate>,
  );

describe('FontGate', () => {
  it('yazı tipi yüklenene kadar ekranı çizmez', async () => {
    mockUseFonts.mockReturnValue([false, null]);
    await renderGate();
    expect(screen.queryByText('uygulama')).toBeNull();
  });

  it('yüklenince uygulamayı gösterir', async () => {
    mockUseFonts.mockReturnValue([true, null]);
    await renderGate();
    expect(screen.getByText('uygulama')).toBeOnTheScreen();
    expect(mockUseFonts).toHaveBeenCalledWith(
      expect.objectContaining({
        IBMPlexSans_400Regular: expect.anything(),
        IBMPlexSans_600SemiBold: expect.anything(),
        IBMPlexSans_700Bold: expect.anything(),
      }),
    );
  });

  it('yüklenemezse sistem yazı tipiyle açılır', async () => {
    mockUseFonts.mockReturnValue([false, new Error('yazı tipi yok')]);
    await renderGate();
    expect(screen.getByText('uygulama')).toBeOnTheScreen();
  });
});
