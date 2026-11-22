import { createSupabaseClient, getSupabaseClient } from './client';

const mockGetConfig = jest.fn(() => ({
  appVariant: 'development',
  supabaseUrl: 'https://ornek.supabase.co',
  supabaseAnonKey: 'anon-anahtari',
}));
jest.mock('../../lib/config', () => ({ getConfig: () => mockGetConfig() }));

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
});
