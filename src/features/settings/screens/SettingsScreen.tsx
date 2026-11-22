import { useRouter } from 'expo-router';
import { Alert, ScrollView, StyleSheet, Text, View } from 'react-native';

import { t } from '../../../i18n';
import { colors, spacing, typography } from '../../../theme';
import { SettingsMenuItem } from '../components/SettingsMenuItem';
import { useAccount } from '../hooks/useAccount';
import { useSyncStatus } from '../hooks/useSyncStatus';

// Ayarlar sekmesinin iskeleti (TODO.md T1.9). Bildirimler (T5.4), abonelik (T6.3), hukuki
// metinler (T6.4), hesap silme (T6.5) ve dışa aktarma (T6.6) kendi görevlerinde eklenecek.

export function SettingsScreen() {
  const router = useRouter();
  const sync = useSyncStatus();
  const account = useAccount();

  const confirmSignOut = () =>
    Alert.alert(t('settings.signOutConfirmTitle'), t('settings.signOutConfirmMessage'), [
      { text: t('common.cancel'), style: 'cancel' },
      { text: t('settings.signOut'), style: 'destructive', onPress: () => void account.signOut() },
    ]);

  const syncSubtitle =
    sync.pendingCount > 0
      ? `${t(`sync.status.${sync.status}`)} · ${t('sync.banner.pendingCount', { count: sync.pendingCount })}`
      : t(`sync.status.${sync.status}`);

  return (
    <ScrollView style={styles.screen} contentContainerStyle={styles.content}>
      <View style={styles.section}>
        <SettingsMenuItem
          title={t('settings.syncStatus')}
          subtitle={syncSubtitle}
          onPress={() => router.push('/settings/sync-status')}
        />
      </View>

      <Text accessibilityRole="header" style={styles.sectionTitle}>
        {t('settings.account')}
      </Text>
      <View style={styles.section}>
        {account.phone ? (
          <View style={styles.info}>
            <Text style={styles.infoLabel}>{t('settings.signedInAs')}</Text>
            <Text style={styles.infoValue}>{account.phone}</Text>
          </View>
        ) : null}
        <SettingsMenuItem
          title={t('settings.signOut')}
          onPress={confirmSignOut}
          disabled={account.signingOut}
          destructive
        />
      </View>
      {account.failed ? (
        <Text accessibilityRole="alert" style={styles.error}>
          {t('settings.signOutFailed')}
        </Text>
      ) : null}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.background },
  content: { paddingVertical: spacing.lg, gap: spacing.sm },
  section: { borderTopWidth: StyleSheet.hairlineWidth, borderTopColor: colors.border },
  sectionTitle: {
    ...typography.caption,
    color: colors.textMuted,
    paddingHorizontal: spacing.lg,
    marginTop: spacing.lg,
  },
  info: { padding: spacing.lg, gap: spacing.xs, backgroundColor: colors.surface },
  infoLabel: { ...typography.caption, color: colors.textMuted },
  infoValue: { ...typography.body, color: colors.text },
  error: { ...typography.caption, color: colors.danger, paddingHorizontal: spacing.lg },
});
