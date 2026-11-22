import { formatMobileDigits, formatPhoneNumber } from './format';

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
