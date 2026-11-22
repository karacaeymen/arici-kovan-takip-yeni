import { StyleSheet, Text, View } from 'react-native';

import { t } from '../../../i18n';
import { colors, radius, spacing, typography } from '../../../theme';

// İlk açılış adımlarının ilerlemesi: "Adım 2 / 3" ve parçalı çubuk.

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
      <View style={styles.bar}>
        {Array.from({ length: total }, (_, i) => (
          <View key={i} style={[styles.segment, i < current && styles.segmentDone]} />
        ))}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { gap: spacing.sm },
  label: { ...typography.caption, color: colors.textMuted },
  bar: { flexDirection: 'row', gap: spacing.xs },
  segment: { flex: 1, height: 6, borderRadius: radius.sm, backgroundColor: colors.disabled },
  segmentDone: { backgroundColor: colors.primary },
});
