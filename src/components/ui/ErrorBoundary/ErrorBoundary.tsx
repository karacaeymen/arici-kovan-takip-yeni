import { useEffect } from 'react';
import MaterialCommunityIcons from '@expo/vector-icons/MaterialCommunityIcons';
import { StyleSheet, Text, View } from 'react-native';

import { t } from '../../../i18n';
import { colors, spacing, typography } from '../../../theme';
import { Button } from '../Button/Button';

// Rota grubunda yakalanmamış bir hata olunca görünen ekran (TODO.md T0.7).
// Expo Router `error` ve `retry` verir; `onError` ile hata bildirilir (bileşen Sentry'yi bilmez).

export interface ErrorBoundaryProps {
  error: Error;
  retry: () => void | Promise<void>;
  onError?: (error: Error) => void;
}

export function ErrorBoundary({ error, retry, onError }: ErrorBoundaryProps) {
  useEffect(() => {
    onError?.(error);
  }, [error, onError]);

  return (
    <View style={styles.container} accessibilityRole="alert">
      <MaterialCommunityIcons name="alert-outline" size={64} color={colors.warning} />
      <Text style={styles.title}>{t('errorBoundary.title')}</Text>
      <Text style={styles.message}>{t('errorBoundary.message')}</Text>
      <View style={styles.action}>
        <Button label={t('errorBoundary.retry')} icon="refresh" onPress={() => void retry()} />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: spacing.screen,
    gap: spacing.lg,
    backgroundColor: colors.background,
  },
  title: { ...typography.title, color: colors.text, textAlign: 'center' },
  message: { ...typography.body, color: colors.textMuted, textAlign: 'center' },
  action: { alignSelf: 'stretch' },
});
