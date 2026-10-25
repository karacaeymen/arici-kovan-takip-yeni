import { Hono } from 'hono';

import { cors } from './cors.ts';
import { notFound, toErrorResponse } from './errors.ts';

export type Router = Hono;

/**
 * Bir Edge Function için router kurar. Supabase isteği `/<fonksiyon-adı>/...` yoluyla iletir,
 * bu yüzden basePath fonksiyon adıdır. CORS, 404 ve hata → JSON eşlemesi burada bağlanır.
 */
export function createRouter(functionName: string): Router {
  const app = new Hono({ strict: false }).basePath(`/${functionName}`);
  app.use('*', cors);
  app.notFound((c) => toErrorResponse(notFound(), c));
  app.onError((err, c) => toErrorResponse(err, c));
  return app;
}
