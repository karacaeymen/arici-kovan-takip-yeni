import MaterialCommunityIcons from '@expo/vector-icons/MaterialCommunityIcons';
import { Pressable, StyleSheet, Text, View } from 'react-native';

import { colors, MIN_TOUCH_SIZE, spacing, typography } from '../../../theme';
import type { IconName } from '../Button/Button';

// Durum şeridi (TODO.md T0.8): çevrimdışı, senkron ve uyarı mesajları için ekranın üstünde
// duran şerit. Metin her zaman koyu; durumu ikon ve zemin rengi birlikte gösterir (renk tek başına
// anlam taşımaz). Hangi durumda ne yazılacağına üst katman karar verir (ör. `SyncBanner`).

export type BannerTone = 'neutral' | 'info' | 'warning' | 'danger';

export interface OfflineBannerProps {
  tone: BannerTone;
  icon: IconName;
  message: string;
  detail?: string | null;
  /** Sağdaki eylem yazısı (ör. "Ayrıntılar"); `onPress` ile birlikte. */
  actionLabel?: string;
  onPress?: () => void;
  /** Basılınca ne olacağı (ekran okuyucu ipucu). */
  hint?: string;
}

const TONE = {
  neutral: { background: colors.surfaceAlt, icon: colors.text },
  info: { background: colors.infoBackground, icon: colors.info },
  warning: { background: colors.warningBackground, icon: colors.warning },
  danger: { background: colors.dangerBackground, icon: colors.danger },
} as const;

export function OfflineBanner({
  tone,
  icon,
  message,
  detail,
  actionLabel,
  onPress,
  hint,
}: OfflineBannerProps) {
  return (
    <Pressable
      accessibilityRole={onPress ? 'button' : 'alert'}
      accessibilityLabel={detail ? `${message}. ${detail}` : message}
      accessibilityHint={hint}
      accessibilityLiveRegion="polite"
      onPress={onPress}
      disabled={!onPress}
      style={({ pressed }) => [
        styles.banner,
        { backgroundColor: TONE[tone].background },
        pressed && styles.pressed,
      ]}
    >
      <MaterialCommunityIcons name={icon} size={24} color={TONE[tone].icon} />
      <View style={styles.texts}>
        <Text style={styles.message}>{message}</Text>
        {detail ? <Text style={styles.detail}>{detail}</Text> : null}
      </View>
      {onPress && actionLabel ? <Text style={styles.action}>{actionLabel}</Text> : null}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  banner: {
    minHeight: MIN_TOUCH_SIZE,
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    paddingHorizontal: spacing.screen,
    paddingVertical: spacing.sm,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  pressed: { opacity: 0.9 },
  texts: { flex: 1, gap: 2 },
  message: { ...typography.captionStrong, color: colors.text },
  detail: { ...typography.caption, color: colors.text },
  action: {
    ...typography.captionStrong,
    fontFamily: typography.button.fontFamily,
    color: colors.secondary,
    textDecorationLine: 'underline',
  },
});
