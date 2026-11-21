import { useMigrations } from 'drizzle-orm/expo-sqlite/migrator';
import type { ReactNode } from 'react';

import migrations from '../../../drizzle/migrations';

import { getDatabase } from './client';

/**
 * Uygulama açılışında yerel migration'ları uygular; bitene kadar altındaki ekranları göstermez.
 * Migration hata verirse hatayı fırlatır; kök hata ekranı (ErrorBoundary) yakalar.
 */
export function DatabaseGate({ children }: { children: ReactNode }) {
  const { success, error } = useMigrations(getDatabase(), migrations);
  if (error) throw error;
  if (!success) return null;
  return <>{children}</>;
}
