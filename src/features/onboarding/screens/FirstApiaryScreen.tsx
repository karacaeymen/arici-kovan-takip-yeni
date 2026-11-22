import { useState } from 'react';

import { Button } from '../../../components/ui/Button/Button';
import { t } from '../../../i18n';
import { NameField } from '../components/NameField';
import { OnboardingStepLayout } from '../components/OnboardingStepLayout';
import { StepRedirect } from '../components/StepRedirect';
import { useOnboardingStep } from '../hooks/useOnboardingStep';

/** 2. adım: ilk arılığın adı. Konum ve iklim bölgesi arılık ekranında eklenir (T2.1–T2.2). */
export function FirstApiaryScreen() {
  const onboarding = useOnboardingStep();
  const [name, setName] = useState('');

  if (onboarding.step !== 'first-apiary') return <StepRedirect step={onboarding.step} />;

  const submit = () => void onboarding.saveFirstApiary(name);

  return (
    <OnboardingStepLayout
      step={2}
      total={3}
      title={t('onboarding.firstApiary.title')}
      subtitle={t('onboarding.firstApiary.subtitle')}
      actions={
        <Button
          label={t('common.continue')}
          onPress={submit}
          disabled={name.trim().length === 0}
          loading={onboarding.saving}
        />
      }
    >
      <NameField
        label={t('onboarding.firstApiary.label')}
        placeholder={t('onboarding.firstApiary.placeholder')}
        value={name}
        onChangeText={(text) => {
          setName(text);
          onboarding.clearError();
        }}
        onSubmit={submit}
        error={onboarding.error ? t(`onboarding.errors.${onboarding.error}`) : null}
        editable={!onboarding.saving}
      />
    </OnboardingStepLayout>
  );
}
