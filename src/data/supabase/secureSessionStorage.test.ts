import { createSecureSessionStorage, type SecureKeyValueStore } from './secureSessionStorage';

jest.mock('expo-secure-store', () => ({}));

function fakeSecureStore() {
  const data = new Map<string, string>();
  const store: SecureKeyValueStore = {
    getItemAsync: async (key) => data.get(key) ?? null,
    setItemAsync: async (key, value) => {
      data.set(key, value);
    },
    deleteItemAsync: async (key) => {
      data.delete(key);
    },
  };
  return { data, store };
}

describe('güvenli oturum deposu', () => {
  it('yazılan değeri aynen geri okur', async () => {
    const { store } = fakeSecureStore();
    const storage = createSecureSessionStorage(store);

    await storage.setItem('sb-auth-token', '{"access_token":"abc"}');

    await expect(storage.getItem('sb-auth-token')).resolves.toBe('{"access_token":"abc"}');
  });

  it('büyük değeri parçalara bölerek saklar', async () => {
    const { data, store } = fakeSecureStore();
    const storage = createSecureSessionStorage(store, 4);

    await storage.setItem('k', 'abcdefghij');

    expect(data.get('k.chunks')).toBe('3');
    expect([data.get('k.0'), data.get('k.1'), data.get('k.2')]).toEqual(['abcd', 'efgh', 'ij']);
    await expect(storage.getItem('k')).resolves.toBe('abcdefghij');
  });

  it('kısalan değerde eski fazla parçaları siler', async () => {
    const { data, store } = fakeSecureStore();
    const storage = createSecureSessionStorage(store, 4);

    await storage.setItem('k', 'abcdefghij');
    await storage.setItem('k', 'xy');

    expect([...data.keys()].sort()).toEqual(['k.0', 'k.chunks']);
    await expect(storage.getItem('k')).resolves.toBe('xy');
  });

  it('boş değeri de saklar', async () => {
    const { store } = fakeSecureStore();
    const storage = createSecureSessionStorage(store);
    await storage.setItem('k', '');
    await expect(storage.getItem('k')).resolves.toBe('');
  });

  it('silinen ya da hiç yazılmamış değer için null döner', async () => {
    const { data, store } = fakeSecureStore();
    const storage = createSecureSessionStorage(store, 4);

    await expect(storage.getItem('yok')).resolves.toBeNull();
    await storage.setItem('k', 'abcdefghij');
    await storage.removeItem('k');

    expect(data.size).toBe(0);
    await expect(storage.getItem('k')).resolves.toBeNull();
  });

  it('parçası eksik değeri okumaz', async () => {
    const { data, store } = fakeSecureStore();
    const storage = createSecureSessionStorage(store, 4);
    await storage.setItem('k', 'abcdefghij');

    data.delete('k.1');

    await expect(storage.getItem('k')).resolves.toBeNull();
  });
});
