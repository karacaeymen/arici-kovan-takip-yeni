import { text } from 'drizzle-orm/sqlite-core';

// Yerel tabloların ortak sütunları. Sunucudaki `supabase/migrations/*_create_*.sql` ile birebir aynıdır;
// tek fark `sync_seq`: sunucu tarafı sıra numarası yerelde tutulmaz (imleç `sync_state` tablosundadır).
// Zaman damgaları saat dilimli ISO metni, takvim günleri `YYYY-MM-DD` metnidir.

/** Her kaydın değişmez kimliği (UUID metni; cihazda üretilir). */
export const idColumn = () => text('id').primaryKey();

/** Senkron meta alanları. Silme, `deleted_at` doldurularak yapılır; satır fiziksel silinmez. */
export const syncColumns = () => ({
  createdAt: text('created_at').notNull(),
  updatedAt: text('updated_at').notNull(),
  deletedAt: text('deleted_at'),
});

/** Bir işletmeye ait kaydın ortak sütunları (işletme tablosunun kendisi hariç). */
export const ownedColumns = () => ({
  id: idColumn(),
  businessId: text('business_id').notNull(),
  ...syncColumns(),
});
