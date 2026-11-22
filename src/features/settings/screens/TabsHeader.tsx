import Ionicons from '@expo/vector-icons/Ionicons';
import { useRouter } from 'expo-router';
import { type ColorValue, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { t } from '../../../i18n';
import { colors, spacing, typography } from '../../../theme';
import { SyncBanner } from '../components/SyncBanner';
import { useSyncStatus } from '../hooks/useSyncStatus';

// Sekmelerin ortak başlığı (TODO.md T1.9): üstte senkron şeridi (gerekiyorsa), altında sayfa
// başlığı. `(tabs)/_layout.tsx` bunu `header` olarak verir. Şeride basınca senkron ayrıntıları açılır.

type Tab = 'index' | 'settings';

const TABS: Record<Tab, { title: () => string; icon: keyof typeof Ionicons.glyphMap }> = {
  index: { title: () => t('tabs.home'), icon: 'home-outline' },
  settings: { title: () => t('tabs.settings'), icon: 'settings-outline' },
};

/**
 * Sekmenin başlığı ve simgesi. Rota dosyası `i18n`'i import edemediği ve 30 satırı aşmaması
 * gerektiği için `(tabs)/_layout.tsx` sekme ayarlarını buradan alır.
 */
export function tabOptions(tab: Tab) {
  const { title, icon } = TABS[tab];
  return {
    title: title(),
    tabBarIcon: ({ color, size }: { color: ColorValue; size: number }) => (
      <Ionicons name={icon} color={typeof color === 'string' ? color : undefined} size={size} />
    ),
  };
}

/** Bütün sekmelerin ortak ayarı: senkron şeritli başlık. */
export const tabsScreenOptions = {
  header: ({ options }: { options: { title?: string } }) => (
    <TabsHeader title={options.title ?? ''} />
  ),
};

export interface TabsHeaderProps {
  title: string;
}

export function TabsHeader({ title }: TabsHeaderProps) {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const sync = useSyncStatus();

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      <SyncBanner
        status={sync.status}
        issue={sync.issue}
        pendingCount={sync.pendingCount}
        onPress={() => router.push('/settings/sync-status')}
      />
      <View style={styles.titleBar}>
        <Text accessibilityRole="header" style={styles.title}>
          {title}
        </Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: colors.surface,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: colors.border,
  },
  titleBar: { paddingHorizontal: spacing.lg, paddingVertical: spacing.md },
  title: { ...typography.subtitle, color: colors.text },
});
