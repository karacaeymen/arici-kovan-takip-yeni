import { Redirect } from 'expo-router';
import { ActivityIndicator, StyleSheet, View } from 'react-native';

import { t } from '../../../i18n';
import { colors } from '../../../theme';

// Kullanıcıyı olması gereken adıma götürür: karar verilemiyorsa (veri/ilk senkron bekleniyor)
// bekleme göstergesi, akış bittiyse ana sayfa, değilse ilgili adımın ekranı.

export type StepTarget = 'loading' | 'business-name' | 'first-apiary' | 'notifications' | 'done';

export function stepHref(step: Exclude<StepTarget, 'loading'>): string {
  return step === 'done' ? '/' : `/onboarding/${step}`;
}

export function StepRedirect({ step }: { step: StepTarget }) {
  if (step === 'loading') {
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
  return <Redirect href={stepHref(step)} />;
}

const styles = StyleSheet.create({
  loading: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.background,
  },
});
