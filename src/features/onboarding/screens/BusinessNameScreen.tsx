import { useState } from 'react';

import { Button } from '../../../components/ui/Button/Button';
import { t } from '../../../i18n';
import { NameField } from '../components/NameField';
import { OnboardingStepLayout } from '../components/OnboardingStepLayout';
import { StepRedirect } from '../components/StepRedirect';
import { useOnboardingStep } from '../hooks/useOnboardingStep';

/** 1. adım: işletme adı. Kaydedilince adım kendiliğinden "ilk arılık"a geçer. */
export function BusinessNameScreen() {
  const onboarding = useOnboardingStep();
  const [name, setName] = useState('');

  if (onboarding.step !== 'business-name') return <StepRedirect step={onboarding.step} />;

  const submit = () => void onboarding.saveBusinessName(name);

  return (
    <OnboardingStepLayout
      step={1}
      total={3}
      title={t('onboarding.businessName.title')}
      subtitle={t('onboarding.businessName.subtitle')}
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
        label={t('onboarding.businessName.label')}
        placeholder={t('onboarding.businessName.placeholder')}
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
