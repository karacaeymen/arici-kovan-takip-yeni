import { IDS, issuePaths, OWNED } from '@/test-utils/domain-fixtures';

import { inspectionSchema } from './inspection';

const valid = {
  ...OWNED,
  hiveId: IDS.hive,
  sessionId: IDS.session,
  inspectedAt: '2026-10-02T07:30:00Z',
  beeFrames: 8,
  broodFrames: 5,
  honeyFrames: 3,
  queenStatus: 'eggs_seen',
  varroaMethod: 'alcohol_wash',
  varroaMiteCount: 4,
  varroaSampleSize: 300,
  temperament: 'calm',
  notes: 'Sakin',
};

const minimal = {
  ...valid,
  sessionId: null,
  beeFrames: null,
  broodFrames: null,
  honeyFrames: null,
  queenStatus: null,
  varroaMethod: null,
  varroaMiteCount: null,
  varroaSampleSize: null,
  temperament: null,
  notes: null,
};

describe('inspectionSchema', () => {
  it('tam ve en az bilgiyle denetimi kabul eder', () => {
    expect(inspectionSchema.safeParse(valid).success).toBe(true);
    expect(inspectionSchema.safeParse(minimal).success).toBe(true);
  });

  it('yapışkan tabla yönteminde örnek sayısı istemez', () => {
    const board = { ...valid, varroaMethod: 'sticky_board', varroaSampleSize: null };
    expect(inspectionSchema.safeParse(board).success).toBe(true);
    expect(issuePaths(inspectionSchema.safeParse({ ...board, varroaSampleSize: 300 }))).toEqual([
      'varroaSampleSize',
    ]);
  });

  it('yıkama yönteminde örnek sayısını zorunlu tutar', () => {
    expect(issuePaths(inspectionSchema.safeParse({ ...valid, varroaSampleSize: null }))).toEqual([
      'varroaSampleSize',
    ]);
  });

  it('yöntem olmadan akar sayısını reddeder', () => {
    const result = inspectionSchema.safeParse({ ...minimal, varroaMiteCount: 3 });
    expect(issuePaths(result)).toEqual(['varroaMiteCount']);
  });

  it('akar sayısı olmadan yöntemi reddeder', () => {
    const result = inspectionSchema.safeParse({ ...valid, varroaMiteCount: null });
    expect(issuePaths(result)).toEqual(['varroaMiteCount']);
  });

  it('aralık dışı çerçeve sayısını reddeder', () => {
    expect(issuePaths(inspectionSchema.safeParse({ ...valid, broodFrames: 41 }))).toEqual([
      'broodFrames',
    ]);
    expect(issuePaths(inspectionSchema.safeParse({ ...valid, beeFrames: -1 }))).toEqual([
      'beeFrames',
    ]);
  });
});
