import type { ReactNode } from 'react';
import { StyleSheet, Text, type TextStyle } from 'react-native';

import { colors, typography } from '../../../theme';

// Uygulamanın metin bileşeni (TODO.md T0.8): yazı ölçüsü ve rengi temadan gelir.
// `header` başlığı ekran okuyucuya başlık olarak bildirir.

export type AppTextVariant = keyof typeof typography;
export type AppTextTone =
  'default' | 'muted' | 'danger' | 'success' | 'warning' | 'info' | 'secondary';

export interface AppTextProps {
  children: ReactNode;
  variant?: AppTextVariant;
  tone?: AppTextTone;
  header?: boolean;
  align?: TextStyle['textAlign'];
  numberOfLines?: number;
}

const TONE_COLOR: Record<AppTextTone, string> = {
  default: colors.text,
  muted: colors.textMuted,
  danger: colors.danger,
  success: colors.success,
  warning: colors.warning,
  info: colors.info,
  secondary: colors.secondary,
};

export function AppText({
  children,
  variant = 'body',
  tone = 'default',
  header,
  align,
  numberOfLines,
}: AppTextProps) {
  return (
    <Text
      accessibilityRole={header ? 'header' : undefined}
      numberOfLines={numberOfLines}
      style={[styles[variant], { color: TONE_COLOR[tone] }, align ? { textAlign: align } : null]}
    >
      {children}
    </Text>
  );
}

const styles = StyleSheet.create(typography);
