import { issuePaths, OWNED } from '@/test-utils/domain-fixtures';

import { apiarySchema } from './apiary';

const valid = {
  ...OWNED,
  name: 'Yayla',
  climateProfileCode: 'karadeniz_yayla',
  latitude: 40.9,
  longitude: 39.7,
  locationSource: 'gps',
  notes: null,
};

describe('apiarySchema', () => {
  it('konumlu arılığı kabul eder', () => {
    expect(apiarySchema.safeParse(valid).success).toBe(true);
  });

  it('konumsuz arılığı kabul eder', () => {
    const noLocation = { ...valid, latitude: null, longitude: null, locationSource: null };
    expect(apiarySchema.safeParse(noLocation).success).toBe(true);
  });

  it('yalnızca enlem girilmişse reddeder', () => {
    expect(issuePaths(apiarySchema.safeParse({ ...valid, longitude: null }))).toEqual([
      'longitude',
    ]);
  });

  it('yalnızca boylam girilmişse reddeder', () => {
    const result = apiarySchema.safeParse({ ...valid, latitude: null, locationSource: null });
    expect(issuePaths(result)).toEqual(['latitude']);
  });

  it('konum varken kaynak eksikse reddeder', () => {
    expect(issuePaths(apiarySchema.safeParse({ ...valid, locationSource: null }))).toEqual([
      'locationSource',
    ]);
  });

  it('aralık dışı koordinatı ve bilinmeyen kaynağı reddeder', () => {
    expect(issuePaths(apiarySchema.safeParse({ ...valid, latitude: 91 }))).toEqual(['latitude']);
    expect(issuePaths(apiarySchema.safeParse({ ...valid, longitude: -181 }))).toEqual([
      'longitude',
    ]);
    expect(issuePaths(apiarySchema.safeParse({ ...valid, locationSource: 'wifi' }))).toEqual([
      'locationSource',
    ]);
  });

  it('boş notu null yapar', () => {
    expect(apiarySchema.parse({ ...valid, notes: '  ' }).notes).toBeNull();
  });
});
