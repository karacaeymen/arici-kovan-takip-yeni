import { useLiveQuery } from 'drizzle-orm/expo-sqlite';
import { useCallback, useEffect, useMemo, useState, useSyncExternalStore } from 'react';

import { getAuthService } from '../../../services/auth';
import { syncStore } from '../../../services/sync';
import {
  getOnboardingService,
  isSyncReady,
  OnboardingError,
  type OnboardingErrorKind,
  resolveOnboardingStep,
} from '../services';

/**
 * İlk açılışın hangi adımda olduğu ve adımların eylemleri (TODO.md T1.8). Adım, yerel veriden
 * canlı çıkarılır: işletme kaydedilince adım kendiliğinden "ilk arılık"a geçer.
 */
export function useOnboardingStep() {
  const service = getOnboardingService();
  const auth = getAuthService();
  const { user } = useSyncExternalStore(auth.subscribe, auth.getSnapshot);
  const sync = useSyncExternalStore(syncStore.subscribe, syncStore.getSnapshot);
  const ownerId = user?.id ?? '';

  const businessesQuery = useMemo(() => service.watchBusinesses(ownerId), [service, ownerId]);
  const businesses = useLiveQuery(businessesQuery, [ownerId]);
  const business = businesses.data[0] ?? null;
  const businessId = business?.id ?? '';

  const apiariesQuery = useMemo(() => service.watchApiaries(businessId), [service, businessId]);
  const apiaries = useLiveQuery(apiariesQuery, [businessId]);

  const [notificationsAnswered, setNotificationsAnswered] = useState<boolean | null>(null);
  useEffect(() => {
    let active = true;
    void service.isNotificationsAnswered().then((answered) => {
      if (active) setNotificationsAnswered(answered);
    });
    return () => {
      active = false;
    };
  }, [service]);

  const step = resolveOnboardingStep({
    loaded: businesses.updatedAt !== undefined && apiaries.updatedAt !== undefined,
    syncReady: isSyncReady(sync),
    hasBusiness: business !== null,
    hasApiary: apiaries.data.length > 0,
    notificationsAnswered,
  });

  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<OnboardingErrorKind | null>(null);

  const run = useCallback(async (action: () => unknown | Promise<unknown>): Promise<boolean> => {
    setSaving(true);
    setError(null);
    try {
      await action();
      return true;
    } catch (e) {
      setError(e instanceof OnboardingError ? e.kind : 'unknown');
      return false;
    } finally {
      setSaving(false);
    }
  }, []);

  return {
    step,
    saving,
    error,
    clearError: () => setError(null),
    saveBusinessName: (name: string) => run(() => service.createBusiness(ownerId, name)),
    saveFirstApiary: (name: string) =>
      run(() => {
        if (!business) throw new OnboardingError('unknown');
        return service.createFirstApiary(business.id, name);
      }),
    allowNotifications: () =>
      run(async () => {
        await service.requestNotifications();
        setNotificationsAnswered(true);
      }),
    skipNotifications: () =>
      run(async () => {
        await service.skipNotifications();
        setNotificationsAnswered(true);
      }),
  };
}

export type OnboardingView = ReturnType<typeof useOnboardingStep>;
