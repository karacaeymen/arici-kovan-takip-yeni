import { createServiceClient, type DbClient } from '../../_shared/db/client.ts';

export interface HealthRepository {
  /** Veritabanına kısa bir sorgu atar; cevap gelirse true. */
  ping(): Promise<boolean>;
}

export function createHealthRepository(client: DbClient = createServiceClient()): HealthRepository {
  return {
    async ping() {
      const { data, error } = await client.rpc('health_ping');
      return !error && data === true;
    },
  };
}
