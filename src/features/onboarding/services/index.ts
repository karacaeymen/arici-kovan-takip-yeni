import { randomUUID } from 'expo-crypto';
import * as Notifications from 'expo-notifications';
import * as SecureStore from 'expo-secure-store';

import { getRepositories } from '../../../data/repositories';
import { systemClock } from '../../../lib/clock';

import { createOnboardingService, type OnboardingService } from './OnboardingService';

// İlk açılış servisinin gerçek bağımlılıklarla kurulduğu yer (TODO.md T1.8).

let service: OnboardingService | undefined;

export function getOnboardingService(): OnboardingService {
  if (!service) {
    const repositories = getRepositories(systemClock);
    service = createOnboardingService({
      businesses: repositories.businesses,
      apiaries: repositories.apiaries,
      createId: randomUUID,
      flags: SecureStore,
      notifications: Notifications,
    });
  }
  return service;
}

export {
  isSyncReady,
  OnboardingError,
  resolveOnboardingStep,
  type OnboardingErrorKind,
  type OnboardingService,
  type OnboardingStep,
  type OnboardingStepName,
} from './OnboardingService';
