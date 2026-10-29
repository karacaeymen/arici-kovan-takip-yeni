import { z } from 'zod';

import { issuePaths, SYNC_META } from '@/test-utils/domain-fixtures';

import { checkSyncMeta, isDeleted, syncMetaShape } from './sync-meta';

const schema = z.object(syncMetaShape).superRefine(checkSyncMeta);

describe('checkSyncMeta', () => {
  it('tutarlı meta alanlarını kabul eder', () => {
    expect(schema.safeParse(SYNC_META).success).toBe(true);
    expect(schema.safeParse({ ...SYNC_META, deletedAt: '2026-10-03T08:00:00Z' }).success).toBe(
      true,
    );
  });

  it('oluşturulmadan önce güncellenmiş kaydı reddeder', () => {
    const result = schema.safeParse({ ...SYNC_META, updatedAt: '2026-09-30T08:00:00Z' });
    expect(issuePaths(result)).toEqual(['updatedAt']);
  });

  it('oluşturulmadan önce silinmiş kaydı reddeder', () => {
    const result = schema.safeParse({ ...SYNC_META, deletedAt: '2026-09-30T08:00:00Z' });
    expect(issuePaths(result)).toEqual(['deletedAt']);
  });

  it('createdAt ile aynı anda güncellenen kaydı kabul eder', () => {
    expect(schema.safeParse({ ...SYNC_META, updatedAt: SYNC_META.createdAt }).success).toBe(true);
  });
});

describe('isDeleted', () => {
  it('deletedAt doluysa true döner', () => {
    expect(isDeleted({ deletedAt: null })).toBe(false);
    expect(isDeleted({ deletedAt: '2026-10-03T08:00:00Z' })).toBe(true);
  });
});
