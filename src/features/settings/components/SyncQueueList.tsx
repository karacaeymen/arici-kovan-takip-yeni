import { StyleSheet, Text, View } from 'react-native';

import { t, type TranslationKey } from '../../../i18n';
import { colors, radius, spacing, typography } from '../../../theme';

// Gönderilmeyi bekleyen kayıtların listesi (senkron durum ekranı). Kaydın içeriği gösterilmez;
// türü, kaç kez denendiği ve son hatası görünür.

export interface SyncQueueItem {
  id: number;
  table: string;
  attemptCount: number;
  lastError: string | null;
}

export interface SyncQueueListProps {
  items: readonly SyncQueueItem[];
}

/** Bilinen anahtarın metni; yoksa `fallback`. */
function translateOr(key: string, fallback: TranslationKey): string {
  const text = t(key as TranslationKey);
  return text === key ? t(fallback) : text;
}

export function SyncQueueList({ items }: SyncQueueListProps) {
  if (items.length === 0) {
    return <Text style={styles.empty}>{t('sync.pendingEmpty')}</Text>;
  }
  return (
    <View accessibilityRole="list" style={styles.list}>
      {items.map((item) => (
        <View key={item.id} style={styles.row}>
          <Text style={styles.table}>
            {translateOr(`sync.tables.${item.table}`, 'sync.errors.unknown')}
          </Text>
          {item.attemptCount > 0 ? (
            <Text style={styles.detail}>
              {t('sync.attempts', { count: item.attemptCount })}
              {item.lastError
                ? ` · ${translateOr(`sync.errors.${item.lastError}`, 'sync.errors.unknown')}`
                : ''}
            </Text>
          ) : null}
        </View>
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  list: { gap: spacing.sm },
  row: {
    padding: spacing.md,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.surface,
    gap: spacing.xs,
  },
  table: { ...typography.bodyStrong, lineHeight: 24, color: colors.text },
  detail: { ...typography.caption, color: colors.textMuted },
  empty: { ...typography.body, color: colors.textMuted },
});
