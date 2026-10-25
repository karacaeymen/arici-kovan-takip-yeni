import * as Sentry from '@sentry/react-native';

import { reportError, setErrorReporter } from './report';
import { initSentry } from './sentry';

jest.mock('@sentry/react-native', () => ({
  init: jest.fn(),
  captureException: jest.fn(),
  wrap: (component: unknown) => component,
}));

const BASE = {
  appVariant: 'preview' as const,
  supabaseUrl: 'https://abc.supabase.co',
  supabaseAnonKey: 'anon',
};

describe('initSentry', () => {
  beforeEach(() => jest.clearAllMocks());
  afterAll(() => setErrorReporter(undefined));

  it('DSN yoksa Sentry başlatılmaz', () => {
    expect(initSentry(BASE)).toBe(false);
    expect(Sentry.init).not.toHaveBeenCalled();
  });

  it('ortam adıyla başlatır ve hataları layer/feature etiketleriyle gönderir', () => {
    expect(initSentry({ ...BASE, sentryDsn: 'https://k@o1.ingest.sentry.io/2' })).toBe(true);
    expect(Sentry.init).toHaveBeenCalledWith(
      expect.objectContaining({ environment: 'preview', sendDefaultPii: false }),
    );

    const error = new Error('x');
    reportError(error, { layer: 'repository', feature: 'hive', operation: 'list' });
    expect(Sentry.captureException).toHaveBeenCalledWith(error, {
      tags: { layer: 'repository', feature: 'hive', operation: 'list' },
    });
  });
});
