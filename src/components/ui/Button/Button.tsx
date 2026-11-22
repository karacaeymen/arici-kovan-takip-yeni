import { ActivityIndicator, Pressable, StyleSheet, Text } from 'react-native';

import { colors, MIN_TOUCH_SIZE, radius, spacing, typography } from '../../../theme';

// Saha düğmesi (TODO.md T0.8): en az 56 dp yükseklik, büyük yazı. `primary` dolu, `text` yalnızca
// yazı (ikincil eylemler için).

export interface ButtonProps {
  label: string;
  onPress: () => void;
  variant?: 'primary' | 'text';
  disabled?: boolean;
  /** İşlem sürerken: düğme basılamaz ve dönen gösterge görünür. */
  loading?: boolean;
}

export function Button({ label, onPress, variant = 'primary', disabled, loading }: ButtonProps) {
  const inactive = disabled === true || loading === true;
  const primary = variant === 'primary';
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={label}
      accessibilityState={{ disabled: inactive, busy: loading === true }}
      disabled={inactive}
      onPress={onPress}
      style={({ pressed }) => [
        styles.base,
        primary && styles.primary,
        primary && pressed && styles.primaryPressed,
        primary && inactive && styles.primaryDisabled,
        !primary && pressed && styles.textPressed,
      ]}
    >
      {loading ? (
        <ActivityIndicator color={primary ? colors.onPrimary : colors.primary} />
      ) : (
        <Text
          style={[
            styles.label,
            primary ? styles.primaryLabel : styles.textLabel,
            inactive && (primary ? styles.primaryLabelDisabled : styles.textLabelDisabled),
          ]}
        >
          {label}
        </Text>
      )}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  base: {
    minHeight: MIN_TOUCH_SIZE,
    minWidth: MIN_TOUCH_SIZE,
    paddingHorizontal: spacing.xl,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: radius.md,
  },
  primary: { backgroundColor: colors.primary },
  primaryPressed: { backgroundColor: colors.primaryPressed },
  primaryDisabled: { backgroundColor: colors.disabled },
  textPressed: { opacity: 0.6 },
  label: { ...typography.button, textAlign: 'center' },
  primaryLabel: { color: colors.onPrimary },
  primaryLabelDisabled: { color: colors.textDisabled },
  textLabel: { color: colors.primary },
  textLabelDisabled: { color: colors.textDisabled },
});
