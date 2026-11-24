import type { ReactNode } from 'react';
import { Pressable, StyleSheet, View } from 'react-native';

import { colors, CONTROL_BORDER, radius, spacing } from '../../../theme';

// Kart (TODO.md T0.8): kovan, görev ve hava kartlarının ortak kutusu. Gölgesiz, ince kenarlı.
// `onPress` verilirse tamamı basılabilir olur ve ekran okuyucuya `accessibilityLabel` ile tek
// düğme olarak okunur. `highlight`: bal tonu zemin (ör. bugünün görevi).

export interface CardProps {
  children: ReactNode;
  onPress?: () => void;
  /** Basılabilir kartın ekran okuyucu etiketi. */
  accessibilityLabel?: string;
  tone?: 'default' | 'highlight';
}

export function Card({ children, onPress, accessibilityLabel, tone = 'default' }: CardProps) {
  const style = [styles.card, tone === 'highlight' && styles.highlight];
  if (!onPress) return <View style={style}>{children}</View>;
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={accessibilityLabel}
      onPress={onPress}
      style={({ pressed }) => [...style, pressed && styles.pressed]}
    >
      {children}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  card: {
    padding: spacing.lg,
    gap: spacing.sm,
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.surface,
  },
  highlight: {
    borderWidth: CONTROL_BORDER,
    borderColor: colors.primaryBorder,
    backgroundColor: colors.primarySoft,
  },
  pressed: { backgroundColor: colors.surfaceAlt },
});
