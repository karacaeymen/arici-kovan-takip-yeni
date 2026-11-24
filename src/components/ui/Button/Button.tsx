import MaterialCommunityIcons from '@expo/vector-icons/MaterialCommunityIcons';
import type { ComponentProps } from 'react';
import { ActivityIndicator, Pressable, StyleSheet, Text } from 'react-native';

import {
  colors,
  CONTROL_BORDER,
  CONTROL_HEIGHT,
  MIN_TOUCH_SIZE,
  radius,
  spacing,
  typography,
} from '../../../theme';

// Saha düğmesi (TODO.md T0.8; docs/tasarim). 60 dp yükseklik, kalın yazı.
// - primary: bal sarısı zemin, koyu yazı, koyu bal kenarlık (ekranın ana eylemi)
// - secondary: beyaz zemin, belirgin kenarlık
// - danger: kırmızı zemin (geri alınamaz eylem)
// - text: kestane, altı çizili yazı (ikincil eylem); `destructive` ile kırmızı

export type IconName = ComponentProps<typeof MaterialCommunityIcons>['name'];

export interface ButtonProps {
  label: string;
  onPress: () => void;
  variant?: 'primary' | 'secondary' | 'danger' | 'text';
  /** Yalnızca `text` düğmede: kırmızı yazı. */
  destructive?: boolean;
  icon?: IconName;
  disabled?: boolean;
  /** İşlem sürerken: düğme basılamaz ve dönen gösterge görünür. */
  loading?: boolean;
}

const LABEL_COLOR = {
  primary: colors.onPrimary,
  secondary: colors.text,
  danger: colors.onDanger,
  text: colors.secondary,
} as const;

export function Button({
  label,
  onPress,
  variant = 'primary',
  destructive,
  icon,
  disabled,
  loading,
}: ButtonProps) {
  const inactive = disabled === true || loading === true;
  const isText = variant === 'text';
  const labelColor = inactive
    ? colors.textDisabled
    : isText && destructive
      ? colors.danger
      : LABEL_COLOR[variant];

  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={label}
      accessibilityState={{ disabled: inactive, busy: loading === true }}
      disabled={inactive}
      onPress={onPress}
      style={({ pressed }) => [
        styles.base,
        styles[variant],
        pressed && styles[`${variant}Pressed`],
        inactive && (isText ? styles.textDisabled : styles.disabled),
      ]}
    >
      {loading ? (
        <ActivityIndicator color={isText ? colors.secondary : colors.text} />
      ) : (
        <>
          {icon ? <MaterialCommunityIcons name={icon} size={24} color={labelColor} /> : null}
          <Text
            style={[styles.label, { color: labelColor }, isText && !inactive && styles.underline]}
          >
            {label}
          </Text>
        </>
      )}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  base: {
    minHeight: CONTROL_HEIGHT,
    minWidth: MIN_TOUCH_SIZE,
    flexDirection: 'row',
    gap: 10,
    paddingHorizontal: spacing.screen,
    paddingVertical: spacing.sm,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: radius.md,
    borderWidth: CONTROL_BORDER,
    borderColor: 'transparent',
  },
  primary: { backgroundColor: colors.primary, borderColor: colors.primaryBorder },
  primaryPressed: { backgroundColor: colors.primaryPressed },
  secondary: { backgroundColor: colors.surface, borderColor: colors.borderStrong },
  secondaryPressed: { backgroundColor: colors.surfaceAlt, borderColor: colors.text },
  danger: { backgroundColor: colors.danger, borderColor: colors.danger },
  dangerPressed: { backgroundColor: colors.dangerPressed, borderColor: colors.dangerPressed },
  text: { minHeight: MIN_TOUCH_SIZE, paddingHorizontal: spacing.md },
  textPressed: { backgroundColor: colors.surfaceAlt },
  disabled: { backgroundColor: colors.disabledBackground, borderColor: 'transparent' },
  textDisabled: { backgroundColor: 'transparent' },
  label: { ...typography.button, textAlign: 'center' },
  underline: { textDecorationLine: 'underline' },
});
