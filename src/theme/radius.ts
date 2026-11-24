// Köşe (TODO.md T0.8; docs/tasarim/MOBILE-DESIGN.md).
// 8 küçük iç öğe · 12 bütün kontroller · 16 kart ve alt sayfa · tam yuvarlak yalnızca kraliçe
// diski, anahtar ve sekme hapı.
export const radius = { sm: 8, md: 12, lg: 16, full: 999 } as const;

/** Gölge kartlarda yok; yalnızca üstte yüzen öğelerde (alt sayfa, kayıt bildirimi). */
export const shadows = {
  sheet: {
    shadowColor: '#1F1709',
    shadowOffset: { width: 0, height: -4 },
    shadowOpacity: 0.16,
    shadowRadius: 16,
    elevation: 12,
  },
} as const;
