import { fireEvent, renderWithProviders, screen } from '@/test-utils/render';

import { EmptyState } from './EmptyState';

describe('EmptyState', () => {
  it('başlığı, açıklamayı ve eylem düğmesini gösterir', async () => {
    const onAction = jest.fn();
    await renderWithProviders(
      <EmptyState
        title="Henüz kovan yok"
        message="İlk kovanını ekleyerek başla."
        actionLabel="Kovan ekle"
        onAction={onAction}
      />,
    );

    expect(screen.getByRole('header', { name: 'Henüz kovan yok' })).toBeOnTheScreen();
    expect(screen.getByText('İlk kovanını ekleyerek başla.')).toBeOnTheScreen();
    await fireEvent.press(screen.getByRole('button', { name: 'Kovan ekle' }));
    expect(onAction).toHaveBeenCalledTimes(1);
  });

  it('eylem verilmezse düğme yoktur', async () => {
    await renderWithProviders(<EmptyState title="Bekleyen kayıt yok" />);
    expect(screen.queryByRole('button')).toBeNull();
  });
});
