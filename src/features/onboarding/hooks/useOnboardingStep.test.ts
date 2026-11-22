import { act, renderHook, waitFor } from '@testing-library/react-native';

import { createRepositories } from '@/data/repositories';
import { createFixedClock } from '@/lib/clock';
import { createSyncStore, type SyncStore } from '@/services/sync/syncStore';
import { createAuthServiceMock, TEST_USER } from '@/test-utils/auth-mock';
import { createTestDatabase } from '@/test-utils/test-database';

import {
  createOnboardingService,
  NOTIFICATIONS_ANSWERED_KEY,
  type OnboardingService,
} from '../services/OnboardingService';

import { useOnboardingStep } from './useOnboardingStep';

// Gerçek `expo-sqlite` telefondadır; yalnızca "tablo değişti" bildirimi taklit edilir.
type ChangeListener = (event: { tableName: string }) => void;
const mockListeners = new Set<ChangeListener>();
jest.mock('expo-sqlite', () => ({
  addDatabaseChangeListener: (listener: ChangeListener) => {
    mockListeners.add(listener);
    return { remove: () => mockListeners.delete(listener) };
  },
}));
const notifyAll = () =>
  ['businesses', 'apiaries'].forEach((tableName) =>
    mockListeners.forEach((listener) => listener({ tableName })),
  );

let mockService: OnboardingService;
jest.mock('../services', () => ({
  ...jest.requireActual('../services/OnboardingService'),
  getOnboardingService: () => mockService,
}));
let mockSyncStore: SyncStore;
jest.mock('@/services/sync', () => ({
  get syncStore() {
    return mockSyncStore;
  },
}));
const mockAuth = createAuthServiceMock({ status: 'signedIn', user: TEST_USER });
jest.mock('@/services/auth', () =>
  jest.requireActual('@/test-utils/auth-mock').authModuleMock(() => mockAuth.service),
);

let idCounter = 0;
function setup(options: { synced?: boolean; notificationsAnswered?: boolean } = {}) {
  const db = createTestDatabase();
  const repos = createRepositories(db, createFixedClock('2026-11-22T10:00:00Z'));
  const flags = new Map<string, string>();
  if (options.notificationsAnswered) flags.set(NOTIFICATIONS_ANSWERED_KEY, '1');
  const requestPermissionsAsync = jest.fn(async () => ({ granted: true }));
  mockService = createOnboardingService({
    businesses: repos.businesses,
    apiaries: repos.apiaries,
    createId: () => `0b6f2d3e-6f0a-4c1e-9d2b-${String(++idCounter).padStart(12, '0')}`,
    flags: {
      getItemAsync: async (key) => flags.get(key) ?? null,
      setItemAsync: async (key, value) => {
        flags.set(key, value);
      },
    },
    notifications: { requestPermissionsAsync },
  });
  mockSyncStore = createSyncStore({
    lastSyncedAt: options.synced === false ? null : '2026-11-22T09:00:00Z',
  });
  return { repos, requestPermissionsAsync };
}

const render = async () => {
  const hook = await renderHook(() => useOnboardingStep());
  return hook;
};

describe('useOnboardingStep', () => {
  beforeEach(() => mockListeners.clear());

  it('yeni hesapta işletme adıyla başlar; adımlar kaydettikçe ilerler ve biter', async () => {
    const t = setup();
    const { result } = await render();
    await waitFor(() => expect(result.current.step).toBe('business-name'));

    await act(async () => {
      expect(await result.current.saveBusinessName('Karaca Arıcılık')).toBe(true);
      notifyAll();
    });
    await waitFor(() => expect(result.current.step).toBe('first-apiary'));
    expect(t.repos.businesses.listByOwner(TEST_USER.id)[0]?.name).toBe('Karaca Arıcılık');

    await act(async () => {
      await result.current.saveFirstApiary('Yayla Arılığı');
      notifyAll();
    });
    await waitFor(() => expect(result.current.step).toBe('notifications'));

    await act(async () => {
      await result.current.allowNotifications();
    });
    expect(t.requestPermissionsAsync).toHaveBeenCalled();
    expect(result.current.step).toBe('done');
  });

  it('yarıda kalan akış kaldığı adımdan devam eder', async () => {
    const t = setup();
    const business = t.repos.businesses.create({
      id: '0b6f2d3e-6f0a-4c1e-9d2b-1a2b3c4d5e31',
      ownerId: TEST_USER.id,
      name: 'Karaca Arıcılık',
    });

    const { result } = await render();
    await waitFor(() => expect(result.current.step).toBe('first-apiary'));

    mockService.createFirstApiary(business.id, 'Yayla Arılığı');
    await act(async () => notifyAll());
    await waitFor(() => expect(result.current.step).toBe('notifications'));
  });

  it('bildirim adımı daha önce yanıtlandıysa ve veriler varsa bitmiş sayılır', async () => {
    const t = setup({ notificationsAnswered: true });
    const business = mockService.createBusiness(TEST_USER.id, 'Karaca Arıcılık');
    mockService.createFirstApiary(business.id, 'Yayla');
    expect(t.repos.apiaries.listByBusiness(business.id)).toHaveLength(1);

    const { result } = await render();

    await waitFor(() => expect(result.current.step).toBe('done'));
  });

  it('ilk senkron bitmeden işletme adı sorulmaz (işletme sunucudan inebilir)', async () => {
    setup({ synced: false });
    const { result } = await render();
    await act(async () => {});
    expect(result.current.step).toBe('loading');

    await act(async () => mockSyncStore.update({ status: 'offline' }));
    await waitFor(() => expect(result.current.step).toBe('business-name'));
  });

  it('geçersiz adda hata türünü verir; temizlenebilir', async () => {
    setup();
    const { result } = await render();
    await waitFor(() => expect(result.current.step).toBe('business-name'));

    await act(async () => {
      expect(await result.current.saveBusinessName('   ')).toBe(false);
    });
    expect(result.current.error).toBe('name_required');

    await act(async () => result.current.clearError());
    expect(result.current.error).toBeNull();
  });

  it('işletme yokken arılık kaydedilemez; "Şimdi değil" izin istemeden bitirir', async () => {
    const t = setup();
    const { result } = await render();
    await waitFor(() => expect(result.current.step).toBe('business-name'));

    await act(async () => {
      expect(await result.current.saveFirstApiary('Yayla')).toBe(false);
    });
    expect(result.current.error).toBe('unknown');

    await act(async () => {
      await result.current.skipNotifications();
    });
    expect(t.requestPermissionsAsync).not.toHaveBeenCalled();
  });
});
