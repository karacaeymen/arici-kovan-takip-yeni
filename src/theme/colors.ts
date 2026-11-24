// Renkler (TODO.md T0.8). Kaynak: docs/tasarim/MOBILE-DESIGN.md ve docs/tasarim/prototip.html
// (`:root` bloğu). Adlar anlamsaldır; koyu tema sonradan aynı adlarla eklenebilir.
// Durum renkleri tek başına anlam taşımaz: her zaman ikon ve metinle birlikte kullanılır.
export const colors = {
  // Marka
  /** Bal sarısı: birincil düğme, seçili seçenek, etkin sekme. */
  primary: '#F7B618',
  primaryPressed: '#E09E00',
  /** Bal zemin üstündeki yazı ve ikon (9,8:1). */
  onPrimary: '#1F1709',
  /** Bal dolgulu öğelerin 1,5 px kenarlığı. */
  primaryBorder: '#9A6A00',
  /** Kovan plakası zemini, vurgulu satır. */
  primarySoft: '#FFF2C7',
  /** Kestane: metin düğmesi, bağlantı, geri, onay kutusu, ilerleme. */
  secondary: '#5E3A12',
  secondaryPressed: '#452908',
  onSecondary: '#FFFFFF',

  // Zemin ve çizgi
  background: '#FBF7EE',
  surface: '#FFFFFF',
  /** Basılı zemin, çevrimdışı şeridi. */
  surfaceAlt: '#F2EBDD',
  /** İnce ayırıcı, kart kenarı (süs; dokunulabilir öğenin sınırı değil). */
  border: '#DCD2C0',
  /** Dokunulabilir öğe kenarlığı (3:1 üstü). */
  borderStrong: '#857659',

  // Metin
  text: '#1F1709',
  textMuted: '#5A4F3E',
  textDisabled: '#9C927F',
  disabledBackground: '#EDE7DA',

  // Durum
  success: '#1B6E3A',
  successBackground: '#E3F3E6',
  warning: '#A14B00',
  warningBackground: '#FFEAD2',
  danger: '#B3261E',
  dangerBackground: '#FCE6E3',
  dangerPressed: '#8F1D17',
  onDanger: '#FFFFFF',
  info: '#1B5E9E',
  infoBackground: '#E2EDF9',

  // Kraliçe işareti (uluslararası standart, sabit; yılın son hanesine göre)
  queenWhite: '#FFFFFF',
  queenYellow: '#FFDD00',
  queenRed: '#E0281E',
  queenGreen: '#17803C',
  queenBlue: '#1F6FD0',

  /** Alt sayfa arkasındaki karartma. */
  scrim: 'rgba(31, 23, 9, 0.55)',
} as const;
