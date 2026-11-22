import { Redirect } from 'expo-router';
import type { ReactNode } from 'react';
import { ActivityIndicator, StyleSheet, View } from 'react-native';

import { t } from '../../../i18n';
import { colors } from '../../../theme';
import { useSession } from '../hooks/useSession';

// Oturum kapısı (TODO.md T1.7): rota grubunun düzeni (`_layout.tsx`) bununla sarılır.
// `(tabs)` oturum ister; oturum yoksa girişe gider. `(auth)` oturumsuz ister; oturum açılınca
// ana sayfaya gider. Depodaki oturum okunurken bekleme göstergesi görünür.

export interface SessionGateProps {
  require: 'signedIn' | 'signedOut';
  children: ReactNode;
}

export function SessionGate({ require, children }: SessionGateProps) {
  const { status } = useSession();

  if (status === 'loading') {
    return (
      <View style={styles.loading}>
        <ActivityIndicator
          size="large"
          color={colors.primary}
          accessibilityLabel={t('common.loading')}
        />
      </View>
    );
  }
  if (status !== require) {
    return <Redirect href={require === 'signedIn' ? '/login' : '/'} />;
  }
  return <>{children}</>;
}

const styles = StyleSheet.create({
  loading: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.background,
  },
});
