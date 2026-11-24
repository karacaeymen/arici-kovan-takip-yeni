import MaterialCommunityIcons from '@expo/vector-icons/MaterialCommunityIcons';
import { useRouter } from 'expo-router';
import { StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { t } from '../../../i18n';
import type { IconName } from '../../../components/ui/Button/Button';
import { colors, CONTROL_BORDER, radius, spacing, typography } from '../../../theme';
import { SyncBanner } from '../components/SyncBanner';
import { useSyncStatus } from '../hooks/useSyncStatus';

// Sekmelerin ortak başlığı (TODO.md T1.9): üstte senkron şeridi (gerekiyorsa), altında sayfa
// başlığı. `(tabs)/_layout.tsx` bunu `header` olarak verir. Şeride basınca senkron ayrıntıları açılır.

type Tab = 'index' | 'settings';

const TABS: Record<Tab, { title: () => string; icon: IconName }> = {
  index: { title: () => t('tabs.home'), icon: 'home-variant-outline' },
  settings: { title: () => t('tabs.settings'), icon: 'cog-outline' },
};

/** Sekme ikonu: etkin sekmede bal sarısı hap içinde (docs/tasarim "sekme çubuğu"). */
function TabIcon({ name, focused }: { name: IconName; focused: boolean }) {
  return (
    <View style={[styles.pill, focused && styles.pillActive]}>
      <MaterialCommunityIcons
        name={name}
        size={26}
        color={focused ? colors.onPrimary : colors.textMuted}
      />
    </View>
  );
}

/**
 * Sekmenin başlığı ve simgesi. Rota dosyası `i18n`'i import edemediği ve 30 satırı aşmaması
 * gerektiği için `(tabs)/_layout.tsx` sekme ayarlarını buradan alır.
 */
export function tabOptions(tab: Tab) {
  const { title, icon } = TABS[tab];
  return {
    title: title(),
    tabBarIcon: ({ focused }: { focused: boolean }) => <TabIcon name={icon} focused={focused} />,
  };
}

/** Bütün sekmelerin ortak ayarı: senkron şeritli başlık ve tasarımdaki sekme çubuğu. */
export const tabsScreenOptions = {
  tabBarActiveTintColor: colors.text,
  tabBarInactiveTintColor: colors.textMuted,
  tabBarLabelStyle: typography.label,
  tabBarStyle: { backgroundColor: colors.surface, borderTopColor: colors.border },
  tabBarItemStyle: { paddingVertical: spacing.xs },
  sceneStyle: { backgroundColor: colors.background },
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
    backgroundColor: colors.background,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  titleBar: { paddingHorizontal: spacing.screen, paddingVertical: spacing.md },
  title: { ...typography.title, color: colors.text },
  pill: {
    width: 60,
    height: 32,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: radius.full,
    borderWidth: CONTROL_BORDER,
    borderColor: 'transparent',
  },
  pillActive: { backgroundColor: colors.primary, borderColor: colors.primaryBorder },
});
