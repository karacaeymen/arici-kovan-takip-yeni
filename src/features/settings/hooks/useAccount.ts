import { useState, useSyncExternalStore } from 'react';

import { formatPhoneNumber, getAuthService } from '../../../services/auth';

/** Ayarlardaki hesap bölümü: giriş yapılan numara ve çıkış. */
export function useAccount() {
  const service = getAuthService();
  const { user } = useSyncExternalStore(service.subscribe, service.getSnapshot);
  const [signingOut, setSigningOut] = useState(false);
  const [failed, setFailed] = useState(false);

  const signOut = async () => {
    if (signingOut) return;
    setSigningOut(true);
    setFailed(false);
    try {
      // Başarılı olunca oturum kapısı giriş ekranına yönlendirir.
      await service.signOut();
    } catch {
      setFailed(true);
    } finally {
      setSigningOut(false);
    }
  };

  return {
    phone: user?.phone ? formatPhoneNumber(`+${user.phone}`) : null,
    signOut,
    signingOut,
    failed,
  };
}
