import type { Context } from 'hono';
import type { z } from 'zod';

import { badRequest, validationFailed } from '../http/errors.ts';

function check<S extends z.ZodType>(schema: S, value: unknown): z.infer<S> {
  const result = schema.safeParse(value);
  if (!result.success) {
    throw validationFailed(
      result.error.issues.map((issue) => ({ path: issue.path.join('.'), message: issue.message })),
    );
  }
  return result.data;
}

/** JSON gövdesini zod şemasıyla doğrular; hatada 400 validation_failed fırlatır. */
export async function parseBody<S extends z.ZodType>(c: Context, schema: S): Promise<z.infer<S>> {
  let body: unknown;
  try {
    body = await c.req.json();
  } catch {
    throw badRequest('Gövde geçerli bir JSON değil.');
  }
  return check(schema, body);
}

export function parseQuery<S extends z.ZodType>(c: Context, schema: S): z.infer<S> {
  return check(schema, c.req.query());
}

export function parseParams<S extends z.ZodType>(c: Context, schema: S): z.infer<S> {
  return check(schema, c.req.param());
}
