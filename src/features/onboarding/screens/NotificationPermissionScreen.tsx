import { StyleSheet, Text } from 'react-native';

import { Button } from '../../../components/ui/Button/Button';
import { t } from '../../../i18n';
import { colors, typography } from '../../../theme';
import { OnboardingStepLayout } from '../components/OnboardingStepLayout';
import { StepRedirect } from '../components/StepRedirect';
import { useOnboardingStep } from '../hooks/useOnboardingStep';

/** 3. adım: bildirim izni. İzin verilse de verilmese de akış biter ve ana sayfa açılır. */
export function NotificationPermissionScreen() {
  const onboarding = useOnboardingStep();

  if (onboarding.step !== 'notifications') return <StepRedirect step={onboarding.step} />;

  return (
    <OnboardingStepLayout
      step={3}
      total={3}
      title={t('onboarding.notifications.title')}
      subtitle={t('onboarding.notifications.subtitle')}
      actions={
        <>
          <Button
            label={t('onboarding.notifications.allow')}
            onPress={() => void onboarding.allowNotifications()}
            loading={onboarding.saving}
          />
          <Button
            variant="text"
            label={t('onboarding.notifications.skip')}
            onPress={() => void onboarding.skipNotifications()}
            disabled={onboarding.saving}
          />
        </>
      }
    >
      <Text style={styles.note}>{t('onboarding.notifications.later')}</Text>
      {onboarding.error ? (
        <Text accessibilityRole="alert" style={styles.error}>
          {t(`onboarding.errors.${onboarding.error}`)}
        </Text>
      ) : null}
    </OnboardingStepLayout>
  );
}

const styles = StyleSheet.create({
  note: { ...typography.caption, color: colors.textMuted },
  error: { ...typography.caption, color: colors.danger },
});
