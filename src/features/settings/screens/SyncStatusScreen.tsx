import { ScrollView, StyleSheet, Text } from 'react-native';

import { Button } from '../../../components/ui/Button/Button';
import { t } from '../../../i18n';
import { colors, spacing, typography } from '../../../theme';
import { SyncQueueList } from '../components/SyncQueueList';
import { SyncSummary } from '../components/SyncSummary';
import { useSyncStatus } from '../hooks/useSyncStatus';

/** Ekran başlığı (rota düzeni `i18n`'i import edemediği için buradan verilir). */
export const syncStatusTitle = () => t('sync.title');

/** Senkron ayrıntıları: durum, son senkron, bekleyen kayıtlar ve "Şimdi senkronla". */
export function SyncStatusScreen() {
  const sync = useSyncStatus();
  const busy = sync.syncing || sync.status === 'syncing';

  return (
    <ScrollView style={styles.screen} contentContainerStyle={styles.content}>
      <SyncSummary
        status={sync.status}
        lastSyncedAt={sync.lastSyncedAt}
        pendingCount={sync.pendingCount}
        nextRetryAt={sync.nextRetryAt}
        rejectedCount={sync.rejectedCount}
        now={sync.now}
      />
      <Button
        label={t('sync.syncNow')}
        onPress={() => void sync.syncNow()}
        loading={busy}
        disabled={sync.status === 'updateRequired'}
      />
      <Text accessibilityRole="header" style={styles.sectionTitle}>
        {t('sync.pendingTitle')}
      </Text>
      <SyncQueueList items={sync.pending} />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.background },
  content: { padding: spacing.lg, gap: spacing.lg },
  sectionTitle: { ...typography.subtitle, color: colors.text, marginTop: spacing.sm },
});
