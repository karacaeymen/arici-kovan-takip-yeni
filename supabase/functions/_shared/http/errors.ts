import type { Context } from 'hono';
import type { ContentfulStatusCode } from 'hono/utils/http-status';

/** Uygulamanın bilinen hataları. Route ve servisler bunu fırlatır; HTTP yanıtına burada çevrilir. */
export class AppError extends Error {
  constructor(
    readonly code: string,
    readonly status: ContentfulStatusCode,
    message: string,
    readonly details?: unknown,
  ) {
    super(message);
    this.name = 'AppError';
  }
}

export const badRequest = (message: string, details?: unknown) =>
  new AppError('bad_request', 400, message, details);
export const validationFailed = (details: unknown) =>
  new AppError('validation_failed', 400, 'İstek verisi geçersiz.', details);
export const unauthorized = (message = 'Oturum gerekli.') =>
  new AppError('unauthorized', 401, message);
export const forbidden = (message = 'Bu işlem için yetkiniz yok.') =>
  new AppError('forbidden', 403, message);
export const notFound = (message = 'Kaynak bulunamadı.') => new AppError('not_found', 404, message);

/** Tüm hata yanıtlarının ortak JSON biçimi: { error: { code, message, details? } } */
export type ErrorBody = { error: { code: string; message: string; details?: unknown } };

export function toErrorResponse(err: unknown, c: Context): Response {
  if (err instanceof AppError) {
    const body: ErrorBody = { error: { code: err.code, message: err.message } };
    if (err.details !== undefined) body.error.details = err.details;
    return c.json(body, err.status);
  }
  console.error(
    JSON.stringify({
      level: 'error',
      msg: 'unhandled_error',
      path: c.req.path,
      error: err instanceof Error ? err.message : String(err),
    }),
  );
  const body: ErrorBody = {
    error: { code: 'internal_error', message: 'Beklenmeyen bir hata oluştu.' },
  };
  return c.json(body, 500);
}
