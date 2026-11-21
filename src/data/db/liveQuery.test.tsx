import { act, renderHook, waitFor } from '@testing-library/react-native';
import { useLiveQuery } from 'drizzle-orm/expo-sqlite';

import { createFixedClock } from '../../lib/clock';
import { createTestDatabase } from '../../test-utils/test-database';
import { createHiveRepository } from '../repositories/HiveRepository';

import { businesses } from './schema';

const APIARY = '0b6f2d3e-6f0a-4c1e-9d2b-1a2b3c4d5e03';

// Gerçek `expo-sqlite` telefondadır; burada yalnızca "tablo değişti" bildirimini taklit ediyoruz.
type ChangeListener = (event: { tableName: string }) => void;
const mockListeners = new Set<ChangeListener>();
jest.mock('expo-sqlite', () => ({
  addDatabaseChangeListener: (listener: ChangeListener) => {
    mockListeners.add(listener);
    return { remove: () => mockListeners.delete(listener) };
  },
}));

const notifyChange = (tableName: string) => {
  mockListeners.forEach((listener) => listener({ tableName }));
};

const business = {
  id: '0b6f2d3e-6f0a-4c1e-9d2b-1a2b3c4d5e02',
  ownerId: '0b6f2d3e-6f0a-4c1e-9d2b-1a2b3c4d5e01',
  name: 'Karaca Arıcılık',
  createdAt: '2026-10-01T08:00:00Z',
  updatedAt: '2026-10-01T08:00:00Z',
  deletedAt: null,
};

describe('useLiveQuery (canlı dinleme)', () => {
  beforeEach(() => mockListeners.clear());

  it('ilgili tablo değişince sorguyu yeniden çalıştırıp yeni veriyi verir', async () => {
    const db = createTestDatabase();
    const { result } = await renderHook(() => useLiveQuery(db.select().from(businesses)));
    await waitFor(() => expect(result.current.updatedAt).toBeDefined());
    expect(result.current.data).toEqual([]);

    db.insert(businesses).values(business).run();
    await act(async () => notifyChange('businesses'));

    await waitFor(() => expect(result.current.data).toHaveLength(1));
    expect(result.current.data[0]?.name).toBe('Karaca Arıcılık');
  });

  it('başka bir tablo değişince yeniden sorgulamaz', async () => {
    const db = createTestDatabase();
    const { result } = await renderHook(() => useLiveQuery(db.select().from(businesses)));
    await waitFor(() => expect(result.current.updatedAt).toBeDefined());

    db.insert(businesses).values(business).run();
    await act(async () => notifyChange('hives'));

    expect(result.current.data).toEqual([]);
  });

  it("repository'nin watch* sorgusu useLiveQuery ile canlı dinlenir (T1.5)", async () => {
    const db = createTestDatabase();
    const hivesRepo = createHiveRepository(db, createFixedClock('2026-11-01T08:00:00Z'));
    const { result } = await renderHook(() => useLiveQuery(hivesRepo.watchByApiary(APIARY)));
    await waitFor(() => expect(result.current.updatedAt).toBeDefined());

    hivesRepo.create({
      id: business.id,
      businessId: business.id,
      apiaryId: APIARY,
      number: 4,
      name: null,
      status: 'active',
      notes: null,
    });
    await act(async () => notifyChange('hives'));

    await waitFor(() => expect(result.current.data.map((h) => h.number)).toEqual([4]));
  });

  it('bileşen kaldırılınca dinleyici temizlenir', async () => {
    const db = createTestDatabase();
    const { unmount } = await renderHook(() => useLiveQuery(db.select().from(businesses)));
    expect(mockListeners.size).toBe(1);

    await unmount();

    expect(mockListeners.size).toBe(0);
  });
});
