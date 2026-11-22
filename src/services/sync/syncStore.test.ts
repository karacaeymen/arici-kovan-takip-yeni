import { createSyncStore, INITIAL_SYNC_SNAPSHOT, syncStore } from './syncStore';

describe('syncStore', () => {
  it('boşta başlar; verilen başlangıç değerlerini alır', () => {
    expect(createSyncStore().getSnapshot()).toEqual(INITIAL_SYNC_SNAPSHOT);
    expect(createSyncStore({ lastSyncedAt: '2026-11-01T08:00:00Z' }).getSnapshot()).toMatchObject({
      status: 'idle',
      lastSyncedAt: '2026-11-01T08:00:00Z',
    });
    expect(syncStore.getSnapshot().status).toBe('idle');
  });

  it('değişiklikte yeni durumu abonelere bildirir', () => {
    const store = createSyncStore();
    const listener = jest.fn();
    store.subscribe(listener);

    store.update({ status: 'syncing' });

    expect(listener).toHaveBeenCalledWith(expect.objectContaining({ status: 'syncing' }));
    expect(store.getSnapshot().status).toBe('syncing');
  });

  it('değer değişmediyse bildirmez ve aynı nesneyi döndürür (useSyncExternalStore için)', () => {
    const store = createSyncStore();
    const listener = jest.fn();
    store.subscribe(listener);
    const before = store.getSnapshot();

    store.update({ status: 'idle', issue: null });

    expect(listener).not.toHaveBeenCalled();
    expect(store.getSnapshot()).toBe(before);
  });

  it('abonelik kaldırılınca bildirim gelmez', () => {
    const store = createSyncStore();
    const listener = jest.fn();
    const unsubscribe = store.subscribe(listener);

    unsubscribe();
    store.update({ status: 'offline' });

    expect(listener).not.toHaveBeenCalled();
  });
});
