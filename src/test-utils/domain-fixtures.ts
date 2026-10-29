import type { z } from 'zod';

// Domain şema testleri için ortak örnek değerler.
export const IDS = {
  user: '0b6f2d3e-6f0a-4c1e-9d2b-1a2b3c4d5e01',
  business: '0b6f2d3e-6f0a-4c1e-9d2b-1a2b3c4d5e02',
  apiary: '0b6f2d3e-6f0a-4c1e-9d2b-1a2b3c4d5e03',
  apiary2: '0b6f2d3e-6f0a-4c1e-9d2b-1a2b3c4d5e04',
  hive: '0b6f2d3e-6f0a-4c1e-9d2b-1a2b3c4d5e05',
  record: '0b6f2d3e-6f0a-4c1e-9d2b-1a2b3c4d5e06',
  session: '0b6f2d3e-6f0a-4c1e-9d2b-1a2b3c4d5e07',
} as const;

export const SYNC_META = {
  createdAt: '2026-10-01T08:00:00Z',
  updatedAt: '2026-10-02T08:00:00Z',
  deletedAt: null,
};

/** Bir işletmeye ait kaydın ortak alanları. */
export const OWNED = { id: IDS.record, businessId: IDS.business, ...SYNC_META };

/** Doğrulama sonucundaki hata yollarını `a.b` biçiminde döndürür; başarılıysa boş liste. */
export function issuePaths(result: z.ZodSafeParseResult<unknown>): string[] {
  return result.success ? [] : result.error.issues.map((issue) => issue.path.join('.'));
}
