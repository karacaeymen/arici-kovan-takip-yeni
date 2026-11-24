import { StyleSheet, Text, View } from 'react-native';

import { t } from '../../../i18n';
import { colors, spacing, typography } from '../../../theme';

// İlk açılış adımlarının ilerlemesi: "Adım 2 / 3" ve kestane dolgulu ilerleme çubuğu.

export interface OnboardingProgressProps {
  /** 1'den başlar. */
  current: number;
  total: number;
}

export function OnboardingProgress({ current, total }: OnboardingProgressProps) {
  const label = t('onboarding.progress', { current, total });
  return (
    <View
      accessible
      accessibilityRole="progressbar"
      accessibilityLabel={label}
      accessibilityValue={{ min: 1, max: total, now: current }}
      style={styles.container}
    >
      <Text style={styles.label}>{label}</Text>
      <View style={styles.track}>
        <View style={[styles.fill, { width: `${(current / total) * 100}%` }]} />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { gap: spacing.sm },
  label: { ...typography.captionStrong, color: colors.textMuted },
  track: { height: 8, borderRadius: 4, backgroundColor: colors.border, overflow: 'hidden' },
  fill: { height: '100%', backgroundColor: colors.secondary },
});
