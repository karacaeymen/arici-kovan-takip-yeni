import { Pressable, StyleSheet, Text, View } from 'react-native';

import { colors, MIN_TOUCH_SIZE, spacing, typography } from '../../../theme';

// Ayarlar menüsündeki tek satır: başlık, isteğe bağlı açıklama; basılınca bir ekrana gider ya da
// bir eylem yapar. `destructive` (ör. çıkış) kırmızı yazılır.

export interface SettingsMenuItemProps {
  title: string;
  subtitle?: string | null;
  onPress: () => void;
  destructive?: boolean;
  disabled?: boolean;
}

export function SettingsMenuItem({
  title,
  subtitle,
  onPress,
  destructive,
  disabled,
}: SettingsMenuItemProps) {
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={subtitle ? `${title}, ${subtitle}` : title}
      accessibilityState={{ disabled: disabled === true }}
      disabled={disabled}
      onPress={onPress}
      style={({ pressed }) => [styles.row, pressed && styles.pressed]}
    >
      <View style={styles.texts}>
        <Text style={[styles.title, destructive && styles.destructive]}>{title}</Text>
        {subtitle ? <Text style={styles.subtitle}>{subtitle}</Text> : null}
      </View>
      {destructive ? null : <Text style={styles.chevron}>›</Text>}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  row: {
    minHeight: MIN_TOUCH_SIZE + spacing.md,
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
    backgroundColor: colors.surface,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: colors.border,
    gap: spacing.md,
  },
  pressed: { backgroundColor: colors.background },
  texts: { flex: 1, gap: spacing.xs },
  title: { ...typography.body, fontWeight: '600', color: colors.text },
  destructive: { color: colors.danger },
  subtitle: { ...typography.caption, color: colors.textMuted },
  chevron: { ...typography.title, color: colors.textMuted },
});
