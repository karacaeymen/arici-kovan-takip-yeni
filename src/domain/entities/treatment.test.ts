import { IDS, issuePaths, OWNED } from '@/test-utils/domain-fixtures';

import { treatmentSchema } from './treatment';

const valid = {
  ...OWNED,
  hiveId: IDS.hive,
  productCode: 'oxalic_acid',
  startedOn: '2026-09-01',
  endedOn: '2026-09-15',
  dose: '2 şerit',
  withdrawalDays: 0,
  notes: null,
};

describe('treatmentSchema', () => {
  it('geçerli ilaçlamayı kabul eder', () => {
    expect(treatmentSchema.safeParse(valid).success).toBe(true);
    expect(treatmentSchema.safeParse({ ...valid, endedOn: null, dose: null }).success).toBe(true);
  });

  it('başlangıçtan önce biten ilaçlamayı reddeder', () => {
    expect(issuePaths(treatmentSchema.safeParse({ ...valid, endedOn: '2026-08-31' }))).toEqual([
      'endedOn',
    ]);
  });

  it('aynı gün biten ilaçlamayı kabul eder', () => {
    expect(treatmentSchema.safeParse({ ...valid, endedOn: valid.startedOn }).success).toBe(true);
  });

  it('negatif ya da kesirli arınma süresini reddeder', () => {
    expect(issuePaths(treatmentSchema.safeParse({ ...valid, withdrawalDays: -1 }))).toEqual([
      'withdrawalDays',
    ]);
    expect(issuePaths(treatmentSchema.safeParse({ ...valid, withdrawalDays: 1.5 }))).toEqual([
      'withdrawalDays',
    ]);
  });

  it('ürün kodu zorunludur', () => {
    expect(issuePaths(treatmentSchema.safeParse({ ...valid, productCode: ' ' }))).toEqual([
      'productCode',
    ]);
  });
});
