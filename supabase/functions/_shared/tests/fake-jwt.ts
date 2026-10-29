/** İmzasız test belirteci üretir (gerçekte imzayı Supabase ağ geçidi doğrular). */
export function fakeJwt(claims: Record<string, unknown>): string {
  const encode = (value: unknown) => {
    const bytes = new TextEncoder().encode(JSON.stringify(value));
    return btoa(String.fromCharCode(...bytes))
      .replace(/=+$/, '')
      .replace(/\+/g, '-')
      .replace(/\//g, '_');
  };
  return `${encode({ alg: 'HS256', typ: 'JWT' })}.${encode(claims)}.imza`;
}

/** Oturum açmış kullanıcının `Authorization` başlığı. */
export const userAuthorization = (sub = '00000000-0000-4000-8000-000000000001') =>
  `Bearer ${fakeJwt({ sub, role: 'authenticated' })}`;
