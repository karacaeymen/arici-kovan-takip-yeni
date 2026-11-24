import { fireEvent, renderWithProviders, screen } from '@/test-utils/render';

import { SegmentedChoice } from './SegmentedChoice';

const OPTIONS = [
  { value: 'seen', label: 'Görüldü' },
  { value: 'not_seen', label: 'Görülmedi' },
  { value: 'queenless', label: 'Kraliçesiz' },
] as const;

describe('SegmentedChoice', () => {
  it('seçenekleri radyo düğmesi olarak gösterir; seçili olan işaretlidir', async () => {
    await renderWithProviders(
      <SegmentedChoice
        label="Kraliçe durumu"
        options={OPTIONS}
        value="seen"
        onChange={jest.fn()}
      />,
    );

    expect(screen.getByText('Kraliçe durumu')).toBeOnTheScreen();
    expect(screen.getByRole('radio', { name: 'Görüldü' })).toBeChecked();
    expect(screen.getByRole('radio', { name: 'Kraliçesiz' })).not.toBeChecked();
  });

  it('başka seçeneğe basınca onu seçer', async () => {
    const onChange = jest.fn();
    await renderWithProviders(
      <SegmentedChoice label="Kraliçe durumu" options={OPTIONS} value="seen" onChange={onChange} />,
    );

    await fireEvent.press(screen.getByRole('radio', { name: 'Kraliçesiz' }));

    expect(onChange).toHaveBeenCalledWith('queenless');
  });

  it('seçili seçeneğe tekrar basınca: izin varsa seçimi kaldırır, yoksa aynı kalır', async () => {
    const onChange = jest.fn();
    const { rerender } = await renderWithProviders(
      <SegmentedChoice
        label="Durum"
        options={OPTIONS}
        value="seen"
        onChange={onChange}
        allowDeselect
      />,
    );
    await fireEvent.press(screen.getByRole('radio', { name: 'Görüldü' }));
    expect(onChange).toHaveBeenLastCalledWith(null);

    await rerender(
      <SegmentedChoice label="Durum" options={OPTIONS} value="seen" onChange={onChange} />,
    );
    await fireEvent.press(screen.getByRole('radio', { name: 'Görüldü' }));
    expect(onChange).toHaveBeenLastCalledWith('seen');
  });

  it('devre dışıyken seçilemez; seçenekler 60 dp', async () => {
    const onChange = jest.fn();
    await renderWithProviders(
      <SegmentedChoice label="Durum" options={OPTIONS} value={null} onChange={onChange} disabled />,
    );
    const radio = screen.getByRole('radio', { name: 'Görülmedi' });
    await fireEvent.press(radio);
    expect(onChange).not.toHaveBeenCalled();
    expect(radio).toHaveStyle({ minHeight: 60 });
  });
});
