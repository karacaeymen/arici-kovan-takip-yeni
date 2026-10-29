import type { Context } from 'hono';

import { unauthorized } from '../http/errors.ts';

/** Oturum açmış kullanıcının isteği. `authorization`, veritabanı istemcisine aynen iletilir (RLS). */
export interface AuthContext {
  userId: string;
  authorization: string;
}

/**
 * İsteğin oturum açmış bir kullanıcıdan geldiğini doğrular.
 *
 * JWT imzası Supabase ağ geçidinde doğrulanır (`config.toml` → `verify_jwt = true`); burada yalnızca
 * belirtecin bir kullanıcıya ait olduğu (`role = authenticated`, `sub` dolu) kontrol edilir.
 * Böylece yalnızca anon anahtarıyla gelen istekler veritabanına ulaşmadan 401 alır.
 */
export function requireUser(c: Context): AuthContext {
  const authorization = c.req.header('authorization') ?? '';
  const match = /^Bearer\s+(\S+)$/i.exec(authorization);
  const claims = match?.[1] ? decodeClaims(match[1]) : null;
  if (!claims || claims.role !== 'authenticated' || typeof claims.sub !== 'string' || !claims.sub) {
    throw unauthorized();
  }
  return { userId: claims.sub, authorization };
}

function decodeClaims(token: string): Record<string, unknown> | null {
  const payload = token.split('.')[1];
  if (!payload) return null;
  try {
    const base64 = payload.replace(/-/g, '+').replace(/_/g, '/');
    const json = new TextDecoder().decode(
      Uint8Array.from(atob(base64.padEnd(Math.ceil(base64.length / 4) * 4, '=')), (ch) =>
        ch.charCodeAt(0),
      ),
    );
    const claims: unknown = JSON.parse(json);
    return claims && typeof claims === 'object' ? (claims as Record<string, unknown>) : null;
  } catch {
    return null;
  }
}
