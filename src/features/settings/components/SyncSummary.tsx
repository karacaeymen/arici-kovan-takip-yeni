import { StyleSheet, Text, View } from 'react-native';

import { t } from '../../../i18n';
import { elapsedSince } from '../../../lib/format';
import { colors, radius, spacing, typography } from '../../../theme';

import type { SyncBannerStatus } from './SyncBanner';

// Senkron durum ekranının üstündeki özet kartı: durum, son senkron zamanı, bekleyen kayıt sayısı
// ve gerekiyorsa sonraki deneme / reddedilen kayıt bilgisi.

export interface SyncSummaryProps {
  status: SyncBannerStatus;
  lastSyncedAt: string | null;
  pendingCount: number;
  nextRetryAt: string | null;
  rejectedCount: number;
  now: Date;
}

function lastSyncedText(lastSyncedAt: string | null, now: Date): string {
  if (!lastSyncedAt) return t('sync.lastSynced.never');
  const { unit, value } = elapsedSince(lastSyncedAt, now);
  return t(`sync.lastSynced.${unit}`, { value });
}

export function SyncSummary({
  status,
  lastSyncedAt,
  pendingCount,
  nextRetryAt,
  rejectedCount,
  now,
}: SyncSummaryProps) {
  return (
    <View style={styles.card}>
      <Text accessibilityRole="header" style={styles.status}>
        {t(`sync.status.${status}`)}
      </Text>
      <Text style={styles.line}>{lastSyncedText(lastSyncedAt, now)}</Text>
      {pendingCount > 0 ? (
        <Text style={styles.line}>{t('sync.pendingSummary', { count: pendingCount })}</Text>
      ) : null}
      {status === 'error' && nextRetryAt ? (
        <Text style={styles.line}>{t('sync.nextRetry')}</Text>
      ) : null}
      {rejectedCount > 0 ? (
        <Text style={[styles.line, styles.warning]}>
          {t('sync.rejected', { count: rejectedCount })}
        </Text>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    padding: spacing.lg,
    borderRadius: radius.lg,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
    gap: spacing.sm,
  },
  status: { ...typography.subtitle, color: colors.text },
  line: { ...typography.body, color: colors.textMuted },
  warning: { color: colors.warning },
});
