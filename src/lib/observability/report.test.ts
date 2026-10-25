import { type ErrorReporter, reportError, reportScreenError, setErrorReporter } from './report';

describe('reportError', () => {
  const reporter = jest.fn<ReturnType<ErrorReporter>, Parameters<ErrorReporter>>();

  beforeEach(() => {
    reporter.mockReset();
    setErrorReporter(reporter);
  });
  afterAll(() => setErrorReporter(undefined));

  it('hatayı etiketleriyle reporter’a iletir', () => {
    const error = new Error('x');
    reportError(error, { layer: 'service', feature: 'apiary', operation: 'create' });
    expect(reporter).toHaveBeenCalledWith(error, {
      layer: 'service',
      feature: 'apiary',
      operation: 'create',
    });
  });

  it('aynı hata nesnesini ikinci kez bildirmez', () => {
    const error = new Error('x');
    reportError(error, { layer: 'repository', feature: 'apiary' });
    reportError(error, { layer: 'service', feature: 'apiary' });
    expect(reporter).toHaveBeenCalledTimes(1);
  });

  it('reporter hata verse bile çağıranı düşürmez', () => {
    setErrorReporter(() => {
      throw new Error('sentry çöktü');
    });
    expect(() => reportError(new Error('x'), { layer: 'service', feature: 'a' })).not.toThrow();
  });

  it('reportScreenError screen katmanı ve rota grubuyla bildirir', () => {
    const error = new Error('ekran');
    reportScreenError('tabs')(error);
    expect(reporter).toHaveBeenCalledWith(error, { layer: 'screen', feature: 'tabs' });
  });
});
