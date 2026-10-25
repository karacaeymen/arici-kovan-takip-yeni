import type { Context } from 'hono';

/** Başarılı yanıt yardımcıları. Route'lar yanıtı yalnızca bunlarla döner. */
export const ok = <T>(c: Context, data: T) => c.json(data, 200);
export const created = <T>(c: Context, data: T) => c.json(data, 201);
export const noContent = (c: Context) => c.body(null, 204);
