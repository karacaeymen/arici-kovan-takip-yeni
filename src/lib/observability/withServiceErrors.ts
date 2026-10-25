import { type Layer, reportError } from './report';

interface Options {
  feature: string;
  /** Varsayılan `service`. Repository'yi sararken `repository` verilir. */
  layer?: Extract<Layer, 'service' | 'repository'>;
}

type AnyFunction = (...args: unknown[]) => unknown;

const isThenable = (value: unknown): value is PromiseLike<unknown> =>
  typeof value === 'object' &&
  value !== null &&
  typeof (value as { then?: unknown }).then === 'function';

/**
 * Servis (ya da repository) nesnesinin her metodunu sarar: fırlatılan ya da reddedilen hata
 * `layer`, `feature` ve `operation` etiketleriyle bildirilir, sonra aynen tekrar fırlatılır.
 * Davranış değişmez; yalnızca hata görünür olur.
 *
 *   export const createApiaryService = (deps: Deps) =>
 *     withServiceErrors({ async create(input) { ... } }, { feature: 'apiary' });
 */
export function withServiceErrors<T extends object>(target: T, options: Options): T {
  const layer = options.layer ?? 'service';
  const wrapped = { ...target } as Record<string, unknown>;

  for (const [operation, value] of Object.entries(target)) {
    if (typeof value !== 'function') continue;
    const method = value as AnyFunction;
    const tags = { layer, feature: options.feature, operation };

    wrapped[operation] = (...args: unknown[]) => {
      try {
        const result = method.apply(target, args);
        if (!isThenable(result)) return result;
        return Promise.resolve(result).catch((error: unknown) => {
          reportError(error, tags);
          throw error;
        });
      } catch (error) {
        reportError(error, tags);
        throw error;
      }
    };
  }

  return wrapped as T;
}
