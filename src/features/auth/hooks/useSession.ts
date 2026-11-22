import { useEffect, useSyncExternalStore } from 'react';

import { getAuthService, type SessionSnapshot } from '../../../services/auth';

/** Oturum durumu (`loading` / `signedIn` / `signedOut`); ilk kullanımda oturum servisini başlatır. */
export function useSession(): SessionSnapshot {
  const service = getAuthService();
  useEffect(() => {
    service.start();
  }, [service]);
  return useSyncExternalStore(service.subscribe, service.getSnapshot);
}
