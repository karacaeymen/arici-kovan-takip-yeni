import * as SecureStore from 'expo-secure-store';

// Supabase oturumunu telefonun güvenli deposunda (iOS Keychain / Android Keystore) tutan
// depolama (TODO.md T1.7). Güvenli depo tek değerde ~2 KB'tan büyük veriyi sorunlu saklar; oturum
// bunu aşabildiği için değer parçalara bölünür: `<anahtar>.chunks` parça sayısını, `<anahtar>.<n>`
// parçaları tutar.

/** `expo-secure-store`'un kullandığımız kısmı (testlerde sahtesi verilir). */
export interface SecureKeyValueStore {
  getItemAsync(key: string): Promise<string | null>;
  setItemAsync(key: string, value: string): Promise<void>;
  deleteItemAsync(key: string): Promise<void>;
}

/** Supabase istemcisinin beklediği depolama arayüzü. */
export interface SessionStorage {
  getItem(key: string): Promise<string | null>;
  setItem(key: string, value: string): Promise<void>;
  removeItem(key: string): Promise<void>;
}

export const SECURE_STORE_CHUNK_SIZE = 1800;

export function createSecureSessionStorage(
  store: SecureKeyValueStore = SecureStore,
  chunkSize = SECURE_STORE_CHUNK_SIZE,
): SessionStorage {
  const countKey = (key: string) => `${key}.chunks`;
  const chunkKey = (key: string, index: number) => `${key}.${index}`;

  const readCount = async (key: string) => {
    const count = Number(await store.getItemAsync(countKey(key)));
    return Number.isInteger(count) && count > 0 ? count : 0;
  };

  const removeItem = async (key: string) => {
    const count = await readCount(key);
    // Önce sayaç silinir: yarıda kalırsa eksik parçalar okunmaz.
    await store.deleteItemAsync(countKey(key));
    await Promise.all(
      Array.from({ length: count }, (_, i) => store.deleteItemAsync(chunkKey(key, i))),
    );
  };

  return {
    async getItem(key) {
      const count = await readCount(key);
      if (count === 0) return null;
      const parts = await Promise.all(
        Array.from({ length: count }, (_, i) => store.getItemAsync(chunkKey(key, i))),
      );
      return parts.every((part) => part !== null) ? parts.join('') : null;
    },

    async setItem(key, value) {
      await removeItem(key);
      const chunks: string[] = [];
      for (let i = 0; i < value.length; i += chunkSize) chunks.push(value.slice(i, i + chunkSize));
      if (chunks.length === 0) chunks.push('');
      await Promise.all(chunks.map((chunk, i) => store.setItemAsync(chunkKey(key, i), chunk)));
      // Sayaç en son yazılır: parçalar eksikken değer okunmaz.
      await store.setItemAsync(countKey(key), String(chunks.length));
    },

    removeItem,
  };
}
