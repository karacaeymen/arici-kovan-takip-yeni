import { ok } from '../../_shared/http/response.ts';
import type { Router } from '../../_shared/http/router.ts';
import { createLogger } from '../../_shared/observability/logger.ts';
import { createDefaultHealthService, type HealthService } from '../services/health.service.ts';

const log = createLogger({ function: 'health', route: 'GET /health' });

/** GET /health — servis ve veritabanı ayakta mı? Veritabanı yoksa 503 döner. */
export function registerHealthRoute(
  app: Router,
  service: HealthService = createDefaultHealthService(),
): void {
  app.get('/', async (c) => {
    const report = await service.check();
    if (report.status !== 'ok') {
      log.warn('health_degraded', { checks: report.checks });
      return c.json(report, 503);
    }
    return ok(c, report);
  });
}
