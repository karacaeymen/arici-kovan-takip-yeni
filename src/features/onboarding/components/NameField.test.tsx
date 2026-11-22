import { fireEvent, renderWithProviders, screen } from '@/test-utils/render';

import { NameField } from './NameField';

describe('NameField', () => {
  it('yazılanı dışarı verir, tamam basılınca onSubmit çağırır ve hatayı gösterir', async () => {
    const onChangeText = jest.fn();
    const onSubmit = jest.fn();
    await renderWithProviders(
      <NameField
        label="İşletme adı"
        placeholder="Ör."
        value=""
        onChangeText={onChangeText}
        onSubmit={onSubmit}
        error="Bir ad yaz."
      />,
    );

    await fireEvent.changeText(screen.getByLabelText('İşletme adı'), 'Karaca');
    await fireEvent(screen.getByLabelText('İşletme adı'), 'submitEditing');

    expect(onChangeText).toHaveBeenCalledWith('Karaca');
    expect(onSubmit).toHaveBeenCalled();
    expect(screen.getByRole('alert')).toHaveTextContent('Bir ad yaz.');
  });
});
