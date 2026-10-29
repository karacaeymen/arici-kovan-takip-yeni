import { IDS, issuePaths, OWNED } from '@/test-utils/domain-fixtures';

import { queenSchema } from './queen';

const valid = {
  ...OWNED,
  hiveId: IDS.hive,
  birthYear: 2026,
  isMarked: true,
  origin: 'own_rearing',
  introducedOn: '2026-05-10',
  endedOn: null,
  endReason: null,
  notes: null,
};

describe('queenSchema', () => {
  it('kovandaki mevcut kraliçeyi kabul eder', () => {
    expect(queenSchema.safeParse(valid).success).toBe(true);
  });

  it('bitmiş kraliçe kaydını kabul eder', () => {
    const ended = { ...valid, endedOn: '2026-09-01', endReason: 'replaced' };
    expect(queenSchema.safeParse(ended).success).toBe(true);
  });

  it('bitiş tarihi ile nedeni birlikte ister', () => {
    expect(issuePaths(queenSchema.safeParse({ ...valid, endedOn: '2026-09-01' }))).toEqual([
      'endReason',
    ]);
    expect(issuePaths(queenSchema.safeParse({ ...valid, endReason: 'died' }))).toEqual([
      'endReason',
    ]);
  });

  it('verilişten önce biten kaydı reddeder', () => {
    const result = queenSchema.safeParse({ ...valid, endedOn: '2026-05-09', endReason: 'died' });
    expect(issuePaths(result)).toEqual(['endedOn']);
  });

  it('aralık dışı doğum yılını reddeder', () => {
    expect(issuePaths(queenSchema.safeParse({ ...valid, birthYear: 1999 }))).toEqual(['birthYear']);
  });
});
