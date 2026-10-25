import { setErrorReporter } from './report';
import { withServiceErrors } from './withServiceErrors';

describe('withServiceErrors', () => {
  const reporter = jest.fn();

  beforeEach(() => {
    reporter.mockReset();
    setErrorReporter(reporter);
  });
  afterAll(() => setErrorReporter(undefined));

  it('başarılı çağrıların sonucunu değiştirmez', async () => {
    const service = withServiceErrors(
      { sum: (a: number, b: number) => a + b, later: async () => 'ok' },
      { feature: 'apiary' },
    );
    expect(service.sum(2, 3)).toBe(5);
    await expect(service.later()).resolves.toBe('ok');
    expect(reporter).not.toHaveBeenCalled();
  });

  it('async hatayı etiketleyip aynen tekrar fırlatır', async () => {
    const error = new Error('db yok');
    const service = withServiceErrors(
      {
        async create() {
          throw error;
        },
      },
      { feature: 'apiary' },
    );
    await expect(service.create()).rejects.toBe(error);
    expect(reporter).toHaveBeenCalledWith(error, {
      layer: 'service',
      feature: 'apiary',
      operation: 'create',
    });
  });

  it('senkron hatayı repository katmanıyla bildirir', () => {
    const error = new Error('bozuk satır');
    const repository = withServiceErrors(
      {
        parse() {
          throw error;
        },
      },
      { feature: 'hive', layer: 'repository' },
    );
    expect(() => repository.parse()).toThrow(error);
    expect(reporter).toHaveBeenCalledWith(error, {
      layer: 'repository',
      feature: 'hive',
      operation: 'parse',
    });
  });

  it('metodlar this üzerinden birbirini çağırabilir, fonksiyon olmayan alanlar korunur', () => {
    const service = withServiceErrors(
      {
        name: 'apiary',
        base() {
          return 10;
        },
        double() {
          return this.base() * 2;
        },
      },
      { feature: 'apiary' },
    );
    expect(service.name).toBe('apiary');
    expect(service.double()).toBe(20);
  });
});
