// UI testleri için ortak hazırlık (jest.config.js → ui projesi → setupFiles).
// İkon setleri yazı tipi dosyası yükler; testte yerine `icon-<ad>` kimlikli boş bir görünüm konur.
jest.mock('@expo/vector-icons/MaterialCommunityIcons', () => {
  const { createElement } = jest.requireActual<typeof import('react')>('react');
  const { View } = jest.requireActual<typeof import('react-native')>('react-native');
  const Icon = ({ name }: { name: string }) => createElement(View, { testID: `icon-${name}` });
  return { __esModule: true, default: Icon };
});
