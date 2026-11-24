// Boşluk ve ölçüler (TODO.md T0.8; docs/tasarim/MOBILE-DESIGN.md).
// Ölçek: 4, 8, 12, 16, 20, 24, 32, 40. Ekran kenarı 20.
export const spacing = {
  xs: 4,
  sm: 8,
  md: 12,
  lg: 16,
  screen: 20,
  xl: 24,
  xxl: 32,
  xxxl: 40,
} as const;

/** Saha kullanımı: eldivenle basılabilecek en küçük dokunma alanı. */
export const MIN_TOUCH_SIZE = 56;
/** Düğme ve giriş kutusu yüksekliği. */
export const CONTROL_HEIGHT = 60;
/** Sekme çubuğu yüksekliği (alt güvenli alan hariç). */
export const TAB_BAR_HEIGHT = 68;
/** Bal dolgulu ve dokunulabilir öğelerin kenarlık kalınlığı. */
export const CONTROL_BORDER = 1.5;
