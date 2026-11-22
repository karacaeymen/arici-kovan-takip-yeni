import type { TextStyle } from 'react-native';

// GEÇİCİ: Yazı tipi ve ölçüler tasarım gelince güncellenecek (TODO.md T0.8).
// Gövde metni en az 17: saha koşullarında okunabilirlik.
export const typography = {
  title: { fontSize: 26, lineHeight: 32, fontWeight: '700' },
  subtitle: { fontSize: 20, lineHeight: 26, fontWeight: '600' },
  body: { fontSize: 17, lineHeight: 24, fontWeight: '400' },
  caption: { fontSize: 15, lineHeight: 20, fontWeight: '400' },
  button: { fontSize: 18, lineHeight: 24, fontWeight: '600' },
} as const satisfies Record<string, TextStyle>;
