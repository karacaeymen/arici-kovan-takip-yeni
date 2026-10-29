import { z } from 'zod';

/**
 * Tüm kayıt kimlikleri UUID'dir. Kimlikler istemcide üretilir (çevrimdışı oluşturma için);
 * üretim işi servis katmanındadır, domain yalnızca biçimi doğrular.
 */
export const idSchema = z.uuid({ error: 'Geçersiz kimlik' });

export type Id = z.infer<typeof idSchema>;
