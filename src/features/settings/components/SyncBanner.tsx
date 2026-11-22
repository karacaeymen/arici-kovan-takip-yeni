import { Pressable, StyleSheet, Text, View } from 'react-native';

import { t } from '../../../i18n';
import { colors, MIN_TOUCH_SIZE, spacing, typography } from '../../../theme';

// Ekranın üstündeki senkron şeridi (TODO.md T1.9). Yalnızca props alır; durumu bilen
// `useSyncStatus`'tur. Her şey yolundayken (idle) görünmez.

export type SyncBannerStatus =
  'idle' | 'syncing' | 'offline' | 'error' | 'signedOut' | 'updateRequired';

export interface SyncBannerProps {
  status: SyncBannerStatus;
  /** `error` durumunda: kuyrukta tekrar denenecek kayıt kaldıysa `pending_retry`. */
  issue?: string | null;
  pendingCount: number;
  onPress?: () => void;
}

type Tone = 'info' | 'warning' | 'danger';

const TONE: Record<Exclude<SyncBannerStatus, 'idle'>, Tone> = {
  syncing: 'info',
  offline: 'warning',
  error: 'warning',
  signedOut: 'warning',
  updateRequired: 'danger',
};

function bannerMessage(status: Exclude<SyncBannerStatus, 'idle'>, issue?: string | null) {
  if (status === 'error' && issue === 'pending_retry') return t('sync.banner.pendingRetry');
  return t(`sync.banner.${status}`);
}

export function SyncBanner({ status, issue, pendingCount, onPress }: SyncBannerProps) {
  if (status === 'idle') return null;
  const tone = TONE[status];
  const message = bannerMessage(status, issue);
  const showCount = pendingCount > 0 && status !== 'syncing';

  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={message}
      accessibilityHint={t('sync.banner.openDetails')}
      accessibilityLiveRegion="polite"
      onPress={onPress}
      disabled={!onPress}
      style={({ pressed }) => [styles.banner, styles[tone], pressed && styles.pressed]}
    >
      <View style={styles.texts}>
        <Text style={[styles.message, styles[`${tone}Text`]]}>{message}</Text>
        {showCount ? (
          <Text style={[styles.count, styles[`${tone}Text`]]}>
            {t('sync.banner.pendingCount', { count: pendingCount })}
          </Text>
        ) : null}
      </View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  banner: {
    minHeight: MIN_TOUCH_SIZE,
    justifyContent: 'center',
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.sm,
  },
  texts: { gap: spacing.xs },
  pressed: { opacity: 0.8 },
  info: { backgroundColor: colors.infoBackground },
  warning: { backgroundColor: colors.warningBackground },
  danger: { backgroundColor: colors.dangerBackground },
  infoText: { color: colors.info },
  warningText: { color: colors.warning },
  dangerText: { color: colors.danger },
  message: { ...typography.body, fontWeight: '600' },
  count: { ...typography.caption },
});
