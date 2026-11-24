import type { TextStyle } from 'react-native';

// Yazı (TODO.md T0.8). IBM Plex Sans: 1/l/I ayrışır, sıfır düz, iki platformda aynı görünür
// (docs/tasarim/MOBILE-DESIGN.md). Kalınlık `fontWeight` ile değil yazı tipi dosyasıyla verilir:
// Android'de özel yazı tipiyle `fontWeight` birlikte kullanılınca yanlış dosya seçilebilir.
// Gövde 18: gözlüksüz ve güneş altında okunurluk.

export const fonts = {
  regular: 'IBMPlexSans_400Regular',
  semibold: 'IBMPlexSans_600SemiBold',
  bold: 'IBMPlexSans_700Bold',
} as const;

export const typography = {
  title: { fontFamily: fonts.bold, fontSize: 28, lineHeight: 34, letterSpacing: -0.2 },
  subtitle: { fontFamily: fonts.bold, fontSize: 22, lineHeight: 28 },
  body: { fontFamily: fonts.regular, fontSize: 18, lineHeight: 26 },
  bodyStrong: { fontFamily: fonts.semibold, fontSize: 18, lineHeight: 26 },
  /** Yardımcı metin: açıklama, alt satır. */
  caption: { fontFamily: fonts.regular, fontSize: 16, lineHeight: 22 },
  captionStrong: { fontFamily: fonts.semibold, fontSize: 16, lineHeight: 22 },
  /** Kısa etiket: sekme adı, durum etiketi. */
  label: { fontFamily: fonts.semibold, fontSize: 15, lineHeight: 20 },
  /** Sayılar (sayaç, kovan numarası): sabit genişlikli rakamlar. */
  number: { fontFamily: fonts.bold, fontSize: 26, lineHeight: 32, fontVariant: ['tabular-nums'] },
  button: { fontFamily: fonts.bold, fontSize: 18, lineHeight: 24 },
} as const satisfies Record<string, TextStyle>;
