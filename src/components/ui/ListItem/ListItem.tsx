import MaterialCommunityIcons from '@expo/vector-icons/MaterialCommunityIcons';
import { Pressable, StyleSheet, Text, View } from 'react-native';

import { colors, spacing, typography } from '../../../theme';
import type { IconName } from '../Button/Button';

// Liste satırı (TODO.md T0.8): solda isteğe bağlı ikon, başlık ve açıklama; sağda değer ya da ok.
// `onPress` verilirse satır düğmedir; en az 64 dp yükseklik.

export interface ListItemProps {
  title: string;
  subtitle?: string | null;
  /** Sağda gösterilen kısa değer (ör. "12 kovan"). */
  value?: string | null;
  icon?: IconName;
  onPress?: () => void;
  destructive?: boolean;
  disabled?: boolean;
}

export function ListItem({
  title,
  subtitle,
  value,
  icon,
  onPress,
  destructive,
  disabled,
}: ListItemProps) {
  const label = [title, subtitle, value].filter(Boolean).join(', ');
  const titleColor = disabled ? colors.textDisabled : destructive ? colors.danger : colors.text;
  const iconColor = disabled ? colors.textDisabled : destructive ? colors.danger : colors.textMuted;

  const content = (
    <>
      {icon ? (
        <View style={styles.icon}>
          <MaterialCommunityIcons name={icon} size={26} color={iconColor} />
        </View>
      ) : null}
      <View style={styles.texts}>
        <Text style={[styles.title, { color: titleColor }]}>{title}</Text>
        {subtitle ? (
          <Text style={[styles.subtitle, disabled && styles.disabledText]}>{subtitle}</Text>
        ) : null}
      </View>
      {value ? <Text style={styles.value}>{value}</Text> : null}
      {onPress && !destructive ? (
        <MaterialCommunityIcons
          testID="list-item-chevron"
          name="chevron-right"
          size={24}
          color={colors.textMuted}
        />
      ) : null}
    </>
  );

  if (!onPress) {
    return (
      <View accessible accessibilityLabel={label} style={styles.row}>
        {content}
      </View>
    );
  }
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={label}
      accessibilityState={{ disabled: disabled === true }}
      disabled={disabled}
      onPress={onPress}
      style={({ pressed }) => [styles.row, pressed && styles.pressed]}
    >
      {content}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  row: {
    minHeight: 64,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
    paddingHorizontal: spacing.lg,
    paddingVertical: 10,
    backgroundColor: colors.surface,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  pressed: { backgroundColor: colors.surfaceAlt },
  icon: { width: 28, alignItems: 'center' },
  texts: { flex: 1, gap: 2 },
  title: { ...typography.bodyStrong, lineHeight: 24 },
  subtitle: { ...typography.caption, color: colors.textMuted },
  disabledText: { color: colors.textDisabled },
  value: { ...typography.caption, maxWidth: '46%', textAlign: 'right', color: colors.textMuted },
});
