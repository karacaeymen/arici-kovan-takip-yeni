import { useRouter } from 'expo-router';
import { Alert, ScrollView, StyleSheet, Text, View } from 'react-native';

import { ListItem } from '../../../components/ui/ListItem/ListItem';
import { t } from '../../../i18n';
import { colors, radius, spacing, typography } from '../../../theme';
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
          icon="sync"
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
          <ListItem icon="cellphone" title={t('settings.signedInAs')} subtitle={account.phone} />
        ) : null}
        <SettingsMenuItem
          icon="logout"
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
  content: { padding: spacing.screen, gap: spacing.sm },
  // Liste grubu: beyaz zemin, ince kenar, yuvarlak köşe (docs/tasarim "group").
  section: {
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.lg,
    overflow: 'hidden',
    backgroundColor: colors.surface,
  },
  sectionTitle: { ...typography.label, color: colors.textMuted, marginTop: spacing.lg },
  error: { ...typography.captionStrong, color: colors.danger },
});
