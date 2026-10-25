import { systemClock, type Clock } from '../../_shared/clock.ts';
import {
  createHealthRepository,
  type HealthRepository,
} from '../repositories/health.repository.ts';

export type HealthReport = {
  status: 'ok' | 'degraded';
  time: string;
  checks: { database: 'ok' | 'error' };
};

export interface HealthService {
  check(): Promise<HealthReport>;
}

export function createHealthService(deps: {
  repository: HealthRepository;
  clock: Clock;
}): HealthService {
  return {
    async check() {
      const databaseUp = await deps.repository.ping().catch(() => false);
      return {
        status: databaseUp ? 'ok' : 'degraded',
        time: deps.clock.now().toISOString(),
        checks: { database: databaseUp ? 'ok' : 'error' },
      };
    },
  };
}

/** Gerçek bağımlılıklarla kurulmuş servis (index → route bunu kullanır). */
export function createDefaultHealthService(): HealthService {
  return createHealthService({ repository: createHealthRepository(), clock: systemClock });
}
