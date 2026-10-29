import { IDS } from '@/test-utils/domain-fixtures';

import { idSchema } from './ids';

describe('idSchema', () => {
  it('UUID kabul eder', () => {
    expect(idSchema.safeParse(IDS.hive).success).toBe(true);
  });

  it.each(['', 'abc', '123', `${IDS.hive}x`])('geçersiz kimliği reddeder: %p', (value) => {
    expect(idSchema.safeParse(value).success).toBe(false);
  });
});
