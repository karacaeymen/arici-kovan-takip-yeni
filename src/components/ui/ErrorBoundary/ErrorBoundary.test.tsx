import { fireEvent, renderWithProviders, screen } from '@/test-utils/render';

import { ErrorBoundary } from './ErrorBoundary';

describe('ErrorBoundary', () => {
  it('hata mesajını gösterir ve hatayı bir kez bildirir', async () => {
    const error = new Error('patladı');
    const onError = jest.fn();
    await renderWithProviders(<ErrorBoundary error={error} retry={jest.fn()} onError={onError} />);

    expect(screen.getByText('Bir şeyler ters gitti')).toBeTruthy();
    expect(onError).toHaveBeenCalledTimes(1);
    expect(onError).toHaveBeenCalledWith(error);
  });

  it('Tekrar dene düğmesi retry çağırır', async () => {
    const retry = jest.fn();
    await renderWithProviders(<ErrorBoundary error={new Error('x')} retry={retry} />);

    await fireEvent.press(screen.getByRole('button', { name: 'Tekrar dene' }));
    expect(retry).toHaveBeenCalledTimes(1);
  });
});
