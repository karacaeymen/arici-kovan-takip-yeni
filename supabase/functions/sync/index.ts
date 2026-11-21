import { createRouter } from '../_shared/http/router.ts';
import { registerPullRoute } from './routes/pull.route.ts';
import { registerPushRoute } from './routes/push.route.ts';

const app = createRouter('sync');
registerPushRoute(app);
registerPullRoute(app);

Deno.serve(app.fetch);
