import { createSupabaseClient, getSupabaseClient } from './client';

const mockGetConfig = jest.fn(() => ({
  appVariant: 'development',
  supabaseUrl: 'https://ornek.supabase.co',
  supabaseAnonKey: 'anon-anahtari',
}));
jest.mock('../../lib/config', () => ({ getConfig: () => mockGetConfig() }));
jest.mock('expo-secure-store', () => ({
  getItemAsync: jest.fn(async () => null),
  setItemAsync: jest.fn(async () => {}),
  deleteItemAsync: jest.fn(async () => {}),
}));

describe('Supabase istemcisi', () => {
  it('verilen adres ve anahtarla Edge Function çağırabilen bir istemci kurar', () => {
    const client = createSupabaseClient({
      supabaseUrl: 'https://ornek.supabase.co',
      supabaseAnonKey: 'anon-anahtari',
    });

    expect(typeof client.functions.invoke).toBe('function');
    expect(typeof client.auth.getSession).toBe('function');
  });

  it('getSupabaseClient ayarları getConfig ile okur ve tek istemci döndürür', () => {
    const first = getSupabaseClient();
    const second = getSupabaseClient();

    expect(first).toBe(second);
    expect(mockGetConfig).toHaveBeenCalledTimes(1);
  });

  it('oturumu verilen depodan okur (telefonda güvenli depo)', async () => {
    const storage = {
      getItem: jest.fn(async () => null),
      setItem: jest.fn(async () => {}),
      removeItem: jest.fn(async () => {}),
    };
    const client = createSupabaseClient(
      { supabaseUrl: 'https://ornek.supabase.co', supabaseAnonKey: 'anon-anahtari' },
      storage,
    );

    await expect(client.auth.getSession()).resolves.toMatchObject({ data: { session: null } });
    expect(storage.getItem).toHaveBeenCalled();
    client.auth.stopAutoRefresh();
  });
});
