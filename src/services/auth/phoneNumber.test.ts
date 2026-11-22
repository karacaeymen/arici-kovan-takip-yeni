import { normalizeOtpCode, normalizeTurkishMobile } from './phoneNumber';

describe('normalizeTurkishMobile', () => {
  it.each([
    '5321234567',
    '532 123 45 67',
    '0532 123 45 67',
    '05321234567',
    '+90 532 123 45 67',
    '905321234567',
    '(532) 123-45-67',
  ])('%s → +905321234567', (input) => {
    expect(normalizeTurkishMobile(input)).toBe('+905321234567');
  });

  it.each(['', '532123456', '53212345678', '2121234567', '0212 123 45 67', 'abc'])(
    '%j geçersizdir',
    (input) => {
      expect(normalizeTurkishMobile(input)).toBeNull();
    },
  );
});

describe('normalizeOtpCode', () => {
  it('6 rakamı kabul eder, boşlukları atar', () => {
    expect(normalizeOtpCode('123456')).toBe('123456');
    expect(normalizeOtpCode(' 123 456 ')).toBe('123456');
  });

  it.each(['12345', '1234567', '12a456', ''])('%j geçersizdir', (input) => {
    expect(normalizeOtpCode(input)).toBeNull();
  });
});
