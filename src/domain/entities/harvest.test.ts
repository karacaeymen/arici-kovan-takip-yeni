import { IDS, issuePaths, OWNED } from '@/test-utils/domain-fixtures';

import { harvestSchema } from './harvest';

const valid = {
  ...OWNED,
  hiveId: IDS.hive,
  harvestedOn: '2026-08-20',
  frameCount: 6,
  weightKg: 12.5,
  withdrawalWarningAcknowledged: false,
  notes: null,
};

describe('harvestSchema', () => {
  it('geçerli hasadı kabul eder', () => {
    expect(harvestSchema.safeParse(valid).success).toBe(true);
    expect(harvestSchema.safeParse({ ...valid, frameCount: null }).success).toBe(true);
    expect(harvestSchema.safeParse({ ...valid, weightKg: null }).success).toBe(true);
  });

  it('çerçeve sayısı ve ağırlık birlikte boşsa reddeder', () => {
    const result = harvestSchema.safeParse({ ...valid, frameCount: null, weightKg: null });
    expect(issuePaths(result)).toEqual(['weightKg']);
  });

  it('sıfır ya da negatif ağırlığı reddeder', () => {
    expect(issuePaths(harvestSchema.safeParse({ ...valid, weightKg: 0 }))).toEqual(['weightKg']);
  });

  it('uyarı onayı alanı zorunludur', () => {
    const { withdrawalWarningAcknowledged: _omit, ...rest } = valid;
    expect(issuePaths(harvestSchema.safeParse(rest))).toEqual(['withdrawalWarningAcknowledged']);
  });
});
