import { IDS, issuePaths, SYNC_META } from '@/test-utils/domain-fixtures';

import { businessSchema } from './business';

const valid = { id: IDS.business, ownerId: IDS.user, name: 'Karaca Arıcılık', ...SYNC_META };

describe('businessSchema', () => {
  it('geçerli işletmeyi kabul eder ve adı kırpar', () => {
    expect(businessSchema.parse({ ...valid, name: '  Karaca Arıcılık ' }).name).toBe(
      'Karaca Arıcılık',
    );
  });

  it('boş adı reddeder', () => {
    expect(issuePaths(businessSchema.safeParse({ ...valid, name: ' ' }))).toEqual(['name']);
  });

  it('geçersiz sahip kimliğini reddeder', () => {
    expect(issuePaths(businessSchema.safeParse({ ...valid, ownerId: 'x' }))).toEqual(['ownerId']);
  });

  it('senkron meta tutarlılığını denetler', () => {
    const result = businessSchema.safeParse({ ...valid, updatedAt: '2026-01-01T00:00:00Z' });
    expect(issuePaths(result)).toEqual(['updatedAt']);
  });
});
