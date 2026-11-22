import { fireEvent, renderWithProviders, screen } from '@/test-utils/render';

import { ResendCodeButton } from './ResendCodeButton';

describe('ResendCodeButton', () => {
  it('bekleme süresince geri sayım gösterir, düğme yoktur', async () => {
    await renderWithProviders(<ResendCodeButton secondsLeft={42} onPress={jest.fn()} />);

    expect(screen.getByText('42 sn sonra tekrar gönderebilirsin')).toBeOnTheScreen();
    expect(screen.queryByRole('button')).toBeNull();
  });

  it('süre bitince "Kodu tekrar gönder" düğmesi çıkar', async () => {
    const onPress = jest.fn();
    await renderWithProviders(<ResendCodeButton secondsLeft={0} onPress={onPress} />);

    await fireEvent.press(screen.getByRole('button', { name: 'Kodu tekrar gönder' }));

    expect(onPress).toHaveBeenCalledTimes(1);
  });
});
