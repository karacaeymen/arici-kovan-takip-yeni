import { cors as honoCors } from 'hono/cors';

/** Tüm fonksiyonlar için ortak CORS ayarı (mobil istemci + Supabase Studio). */
export const cors = honoCors({
  origin: '*',
  allowHeaders: ['authorization', 'x-client-info', 'apikey', 'content-type'],
  allowMethods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
});
