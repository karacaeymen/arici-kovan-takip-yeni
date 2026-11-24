import { fireEvent, renderWithProviders, screen } from '@/test-utils/render';

import { Stepper } from './Stepper';

describe('Stepper', () => {
  it('değeri gösterir; + ve − ile adım adım değiştirir', async () => {
    const onChange = jest.fn();
    await renderWithProviders(
      <Stepper label="Arılı çerçeve" value={5} onChange={onChange} max={20} />,
    );

    expect(screen.getByText('5')).toBeOnTheScreen();
    await fireEvent.press(screen.getByRole('button', { name: 'Arılı çerçeve artır' }));
    await fireEvent.press(screen.getByRole('button', { name: 'Arılı çerçeve azalt' }));

    expect(onChange.mock.calls).toEqual([[6], [4]]);
  });

  it('sınırlarda ilgili düğme basılamaz', async () => {
    const onChange = jest.fn();
    await renderWithProviders(
      <Stepper label="Ballı çerçeve" value={0} onChange={onChange} min={0} max={0} />,
    );

    expect(screen.getByRole('button', { name: 'Ballı çerçeve azalt' })).toBeDisabled();
    expect(screen.getByRole('button', { name: 'Ballı çerçeve artır' })).toBeDisabled();
    await fireEvent.press(screen.getByRole('button', { name: 'Ballı çerçeve artır' }));
    expect(onChange).not.toHaveBeenCalled();
  });

  it('değer girilmemişse "–" gösterir; + en küçük değeri yazar', async () => {
    const onChange = jest.fn();
    await renderWithProviders(
      <Stepper label="Yavrulu çerçeve" value={null} onChange={onChange} min={1} />,
    );

    expect(screen.getByText('–')).toBeOnTheScreen();
    expect(screen.getByRole('button', { name: 'Yavrulu çerçeve azalt' })).toBeDisabled();
    await fireEvent.press(screen.getByRole('button', { name: 'Yavrulu çerçeve artır' }));
    expect(onChange).toHaveBeenCalledWith(1);
  });

  it('ekran okuyucuda ayarlanabilir öğedir; artırma/azaltma eylemleri çalışır', async () => {
    const onChange = jest.fn();
    await renderWithProviders(
      <Stepper label="Arılı çerçeve" value={3} onChange={onChange} step={2} />,
    );

    const adjustable = screen.getByRole('adjustable', { name: 'Arılı çerçeve' });
    expect(adjustable).toHaveAccessibilityValue({ now: 3 });
    await fireEvent(adjustable, 'accessibilityAction', {
      nativeEvent: { actionName: 'increment' },
    });
    await fireEvent(adjustable, 'accessibilityAction', {
      nativeEvent: { actionName: 'decrement' },
    });

    expect(onChange.mock.calls).toEqual([[5], [1]]);
  });

  it('devre dışıyken değişmez; düğmeler en az 56 dp', async () => {
    const onChange = jest.fn();
    await renderWithProviders(
      <Stepper label="Arılı çerçeve" value={3} onChange={onChange} disabled />,
    );
    const plus = screen.getByRole('button', { name: 'Arılı çerçeve artır' });
    await fireEvent.press(plus);
    expect(onChange).not.toHaveBeenCalled();
    expect(plus).toHaveStyle({ width: 56, height: 56 });
  });
});
