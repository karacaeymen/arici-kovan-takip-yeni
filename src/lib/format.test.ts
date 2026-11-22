import { elapsedSince, formatMobileDigits, formatPhoneNumber } from './format';

describe('formatMobileDigits', () => {
  it.each([
    ['', ''],
    ['5', '5'],
    ['532', '532'],
    ['5321', '532 1'],
    ['532123', '532 123'],
    ['5321234', '532 123 4'],
    ['53212345', '532 123 45'],
    ['5321234567', '532 123 45 67'],
    ['532123456789', '532 123 45 67'],
    ['532-12a3', '532 123'],
  ])('%j → %j', (digits, expected) => {
    expect(formatMobileDigits(digits)).toBe(expected);
  });
});

describe('formatPhoneNumber', () => {
  it('Türkiye cep numarasını gruplar', () => {
    expect(formatPhoneNumber('+905321234567')).toBe('+90 532 123 45 67');
  });

  it('tanımadığı biçimi olduğu gibi bırakır', () => {
    expect(formatPhoneNumber('+4915112345678')).toBe('+4915112345678');
  });
});

describe('elapsedSince', () => {
  const now = new Date('2026-11-22T10:00:00Z');

  it.each([
    ['2026-11-22T09:59:30Z', { unit: 'justNow', value: 0 }],
    ['2026-11-22T10:05:00Z', { unit: 'justNow', value: 0 }],
    ['2026-11-22T09:55:00Z', { unit: 'minutes', value: 5 }],
    ['2026-11-22T09:00:01Z', { unit: 'minutes', value: 59 }],
    ['2026-11-22T08:00:00Z', { unit: 'hours', value: 2 }],
    ['2026-11-21T10:00:01Z', { unit: 'hours', value: 23 }],
    ['2026-11-19T10:00:00Z', { unit: 'days', value: 3 }],
    ['geçersiz', { unit: 'justNow', value: 0 }],
  ])('%s → %j', (from, expected) => {
    expect(elapsedSince(from, now)).toEqual(expected);
  });
});
