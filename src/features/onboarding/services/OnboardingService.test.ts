import { setErrorReporter } from '../../../lib/observability/report';
import { IDS } from '../../../test-utils/domain-fixtures';
import { setupSyncTest } from '../../../test-utils/sync-fixtures';

import {
  createOnboardingService,
  isSyncReady,
  NOTIFICATIONS_ANSWERED_KEY,
  OnboardingError,
  resolveOnboardingStep,
  type StepInput,
  validateName,
} from './OnboardingService';

jest.mock('expo-secure-store', () => ({}));
jest.mock('expo-sqlite', () => ({ openDatabaseSync: jest.fn() }));

const ready: StepInput = {
  loaded: true,
  syncReady: true,
  hasBusiness: true,
  hasApiary: true,
  notificationsAnswered: true,
};

describe('resolveOnboardingStep', () => {
  it.each([
    [{ ...ready, loaded: false }, 'loading'],
    [{ ...ready, notificationsAnswered: null }, 'loading'],
    [{ ...ready, hasBusiness: false, syncReady: false }, 'loading'],
    [{ ...ready, hasBusiness: false }, 'business-name'],
    [{ ...ready, hasApiary: false }, 'first-apiary'],
    [{ ...ready, hasApiary: false, syncReady: false }, 'first-apiary'],
    [{ ...ready, notificationsAnswered: false }, 'notifications'],
    [ready, 'done'],
  ] as const)('%j → %s', (input, step) => {
    expect(resolveOnboardingStep(input)).toBe(step);
  });
});

describe('isSyncReady', () => {
  it('ilk senkron bittiyse ya da beklemek anlamsızsa hazırdır', () => {
    expect(isSyncReady({ status: 'idle', lastSyncedAt: '2026-11-22T10:00:00Z' })).toBe(true);
    expect(isSyncReady({ status: 'offline', lastSyncedAt: null })).toBe(true);
    expect(isSyncReady({ status: 'error', lastSyncedAt: null })).toBe(true);
    expect(isSyncReady({ status: 'idle', lastSyncedAt: null })).toBe(false);
    expect(isSyncReady({ status: 'syncing', lastSyncedAt: null })).toBe(false);
  });
});

describe('validateName', () => {
  it('boşlukları kırpar; boş ve 100 karakterden uzun adı reddeder', () => {
    expect(validateName('  Karaca Arıcılık ')).toBe('Karaca Arıcılık');
    expect(() => validateName('   ')).toThrow(new OnboardingError('name_required'));
    expect(() => validateName('a'.repeat(101))).toThrow(new OnboardingError('name_too_long'));
    expect(validateName('a'.repeat(100))).toHaveLength(100);
  });
});

function setup(options: { flag?: string | null; granted?: boolean } = {}) {
  const ctx = setupSyncTest();
  const flags = new Map<string, string>();
  if (options.flag) flags.set(NOTIFICATIONS_ANSWERED_KEY, options.flag);
  const ids = ['0b6f2d3e-6f0a-4c1e-9d2b-1a2b3c4d5e21', '0b6f2d3e-6f0a-4c1e-9d2b-1a2b3c4d5e22'];
  const deps = {
    businesses: ctx.repos.businesses,
    apiaries: ctx.repos.apiaries,
    createId: jest.fn(() => ids.shift()!),
    flags: {
      getItemAsync: jest.fn(async (key: string) => flags.get(key) ?? null),
      setItemAsync: jest.fn(async (key: string, value: string) => {
        flags.set(key, value);
      }),
    },
    notifications: {
      requestPermissionsAsync: jest.fn(async () => ({ granted: options.granted ?? true })),
    },
  };
  return { ...ctx, deps, flags, service: createOnboardingService(deps) };
}

describe('OnboardingService', () => {
  const reporter = jest.fn();
  beforeEach(() => {
    reporter.mockReset();
    setErrorReporter(reporter);
  });
  afterAll(() => setErrorReporter(undefined));

  it('işletmeyi kullanıcıya ait, yeni kimlikle ve kuyruğa alınarak kaydeder', async () => {
    const t = setup();

    const business = t.service.createBusiness(IDS.user, '  Karaca Arıcılık ');

    expect(business).toMatchObject({
      id: '0b6f2d3e-6f0a-4c1e-9d2b-1a2b3c4d5e21',
      ownerId: IDS.user,
      name: 'Karaca Arıcılık',
    });
    expect(await t.service.watchBusinesses(IDS.user)).toEqual([business]);
    expect(t.repos.outbox.peek()[0]).toMatchObject({ table: 'businesses' });
  });

  it('ilk arılığı yalnızca adla, konumsuz kaydeder', async () => {
    const t = setup();
    const business = t.service.createBusiness(IDS.user, 'Karaca Arıcılık');

    const apiary = t.service.createFirstApiary(business.id, 'Yayla Arılığı');

    expect(apiary).toMatchObject({
      businessId: business.id,
      name: 'Yayla Arılığı',
      latitude: null,
      longitude: null,
      locationSource: null,
      climateProfileCode: null,
    });
    expect(await t.service.watchApiaries(business.id)).toEqual([apiary]);
  });

  it('geçersiz adda kayıt yapmaz', () => {
    const t = setup();
    expect(() => t.service.createBusiness(IDS.user, ' ')).toThrow(OnboardingError);
    expect(() => t.service.createFirstApiary(IDS.business, '')).toThrow(OnboardingError);
    expect(t.repos.outbox.count()).toBe(0);
  });

  it('bildirim adımının yanıtlanıp yanıtlanmadığını hatırlar', async () => {
    expect(await setup().service.isNotificationsAnswered()).toBe(false);
    expect(await setup({ flag: '1' }).service.isNotificationsAnswered()).toBe(true);
  });

  it('depo okunamazsa adımı yanıtlanmamış sayar', async () => {
    const t = setup();
    t.deps.flags.getItemAsync.mockRejectedValueOnce(new Error('depo yok'));
    expect(await t.service.isNotificationsAnswered()).toBe(false);
  });

  it('izin ister; verilse de verilmese de adımı tamamlar', async () => {
    const granted = setup({ granted: true });
    expect(await granted.service.requestNotifications()).toBe(true);
    expect(await granted.service.isNotificationsAnswered()).toBe(true);

    const denied = setup({ granted: false });
    expect(await denied.service.requestNotifications()).toBe(false);
    expect(await denied.service.isNotificationsAnswered()).toBe(true);
  });

  it('izin istenemezse hatayı bildirir ama adımı yine tamamlar', async () => {
    const t = setup();
    const error = new Error('izin servisi yok');
    t.deps.notifications.requestPermissionsAsync.mockRejectedValueOnce(error);

    expect(await t.service.requestNotifications()).toBe(false);

    expect(await t.service.isNotificationsAnswered()).toBe(true);
    expect(reporter).toHaveBeenCalledWith(error, {
      layer: 'service',
      feature: 'onboarding',
      operation: 'requestNotifications',
    });
  });

  it('"Şimdi değil" izin istemeden adımı tamamlar', async () => {
    const t = setup();
    await t.service.skipNotifications();
    expect(t.deps.notifications.requestPermissionsAsync).not.toHaveBeenCalled();
    expect(await t.service.isNotificationsAnswered()).toBe(true);
  });
});
