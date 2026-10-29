import {
  calendarDateSchema,
  compareCalendarDates,
  compareTimestamps,
  timestampSchema,
} from './timestamps';

describe('timestampSchema', () => {
  it.each(['2026-10-29T10:00:00Z', '2026-10-29T10:00:00.123Z', '2026-10-29T13:00:00+03:00'])(
    'saat dilimli zamanı kabul eder: %p',
    (value) => {
      expect(timestampSchema.safeParse(value).success).toBe(true);
    },
  );

  it.each(['2026-10-29', '2026-10-29T10:00:00', 'dün', ''])(
    'geçersiz zamanı reddeder: %p',
    (value) => {
      expect(timestampSchema.safeParse(value).success).toBe(false);
    },
  );
});

describe('calendarDateSchema', () => {
  it('YYYY-MM-DD kabul eder', () => {
    expect(calendarDateSchema.safeParse('2026-02-28').success).toBe(true);
  });

  it.each(['2026-02-30', '29.10.2026', '2026-10-29T10:00:00Z'])(
    'geçersiz tarihi reddeder: %p',
    (value) => {
      expect(calendarDateSchema.safeParse(value).success).toBe(false);
    },
  );
});

describe('compareTimestamps', () => {
  it('farklı saat dilimlerindeki aynı anı eşit sayar', () => {
    expect(compareTimestamps('2026-10-29T13:00:00+03:00', '2026-10-29T10:00:00Z')).toBe(0);
  });

  it('sırayı doğru verir', () => {
    expect(compareTimestamps('2026-10-29T09:00:00Z', '2026-10-29T10:00:00Z')).toBeLessThan(0);
    expect(compareTimestamps('2026-10-29T11:00:00Z', '2026-10-29T10:00:00Z')).toBeGreaterThan(0);
  });
});

describe('compareCalendarDates', () => {
  it('sırayı doğru verir', () => {
    expect(compareCalendarDates('2026-01-09', '2026-01-10')).toBe(-1);
    expect(compareCalendarDates('2026-01-10', '2026-01-10')).toBe(0);
    expect(compareCalendarDates('2026-02-01', '2026-01-31')).toBe(1);
  });
});
