import { createRouter } from '../_shared/http/router.ts';
import { registerHealthRoute } from './routes/health.route.ts';

const app = createRouter('health');
registerHealthRoute(app);

Deno.serve(app.fetch);
