import type { IconName } from '../../../components/ui/Button/Button';
import { type BannerTone, OfflineBanner } from '../../../components/ui/OfflineBanner/OfflineBanner';
import { t } from '../../../i18n';

// Ekranın üstündeki senkron şeridi (TODO.md T1.9). Yalnızca props alır; durumu bilen
// `useSyncStatus`'tur. Her şey yolundayken (idle) görünmez. Görünümü ortak `OfflineBanner`'dır;
// ton ve ikonlar docs/tasarim/prototip.html "Senkron şeridi" bölümünden.

export type SyncBannerStatus =
  'idle' | 'syncing' | 'offline' | 'error' | 'signedOut' | 'updateRequired';

export interface SyncBannerProps {
  status: SyncBannerStatus;
  /** `error` durumunda: kuyrukta tekrar denenecek kayıt kaldıysa `pending_retry`. */
  issue?: string | null;
  pendingCount: number;
  onPress?: () => void;
}

const LOOK: Record<Exclude<SyncBannerStatus, 'idle'>, { tone: BannerTone; icon: IconName }> = {
  syncing: { tone: 'info', icon: 'sync' },
  offline: { tone: 'neutral', icon: 'wifi-off' },
  error: { tone: 'warning', icon: 'sync-alert' },
  updateRequired: { tone: 'warning', icon: 'cellphone-arrow-down' },
  signedOut: { tone: 'danger', icon: 'login' },
};

function bannerMessage(status: Exclude<SyncBannerStatus, 'idle'>, issue?: string | null) {
  if (status === 'error' && issue === 'pending_retry') return t('sync.banner.pendingRetry');
  return t(`sync.banner.${status}`);
}

export function SyncBanner({ status, issue, pendingCount, onPress }: SyncBannerProps) {
  if (status === 'idle') return null;
  const showCount = pendingCount > 0 && status !== 'syncing';
  return (
    <OfflineBanner
      {...LOOK[status]}
      message={bannerMessage(status, issue)}
      detail={showCount ? t('sync.banner.pendingCount', { count: pendingCount }) : null}
      actionLabel={t('sync.banner.details')}
      onPress={onPress}
      hint={t('sync.banner.openDetails')}
    />
  );
}
