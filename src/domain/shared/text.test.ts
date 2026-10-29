import { optionalText, requiredText } from './text';

describe('requiredText', () => {
  const schema = requiredText(5);

  it('boşlukları kırpar', () => {
    expect(schema.parse('  Arı  ')).toBe('Arı');
  });

  it('boş ya da yalnızca boşluk olan metni reddeder', () => {
    expect(schema.safeParse('').success).toBe(false);
    expect(schema.safeParse('   ').success).toBe(false);
  });

  it('üst sınırı aşan metni reddeder', () => {
    expect(schema.safeParse('123456').success).toBe(false);
  });
});

describe('optionalText', () => {
  const schema = optionalText(5);

  it('boş metni null yapar', () => {
    expect(schema.parse('   ')).toBeNull();
  });

  it('null kabul eder ve metni kırpar', () => {
    expect(schema.parse(null)).toBeNull();
    expect(schema.parse(' not ')).toBe('not');
  });

  it('üst sınırı aşan metni reddeder', () => {
    expect(schema.safeParse('123456').success).toBe(false);
  });
});
