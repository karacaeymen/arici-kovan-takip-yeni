import MaterialCommunityIcons from '@expo/vector-icons/MaterialCommunityIcons';
import { StyleSheet, Text, View } from 'react-native';

import { colors, spacing, typography } from '../../../theme';
import { Button, type IconName } from '../Button/Button';

// Boş durum (TODO.md T0.8): "Henüz kovan yok" gibi; büyük ikon, ne yapılacağını söyleyen kısa
// açıklama ve isteğe bağlı bir eylem düğmesi.

export interface EmptyStateProps {
  title: string;
  message?: string;
  icon?: IconName;
  actionLabel?: string;
  onAction?: () => void;
}

export function EmptyState({
  title,
  message,
  icon = 'beehive-outline',
  actionLabel,
  onAction,
}: EmptyStateProps) {
  return (
    <View style={styles.container}>
      <MaterialCommunityIcons name={icon} size={64} color={colors.textMuted} />
      <Text accessibilityRole="header" style={styles.title}>
        {title}
      </Text>
      {message ? <Text style={styles.message}>{message}</Text> : null}
      {actionLabel && onAction ? (
        <View style={styles.action}>
          <Button label={actionLabel} onPress={onAction} />
        </View>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: spacing.xl,
    paddingHorizontal: spacing.sm,
  },
  title: {
    ...typography.subtitle,
    color: colors.text,
    textAlign: 'center',
    marginTop: spacing.md,
    marginBottom: 6,
  },
  message: { ...typography.body, color: colors.textMuted, textAlign: 'center' },
  action: { alignSelf: 'stretch', marginTop: spacing.screen },
});
