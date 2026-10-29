import { z } from 'zod';

import { checkSyncMeta, ownedEntityShape } from '../shared/sync-meta';
import { NOTES_MAX_LENGTH, optionalText, requiredText } from '../shared/text';

/** Konumun nereden geldiği: cihaz konumu ya da kullanıcının elle girdiği değer (T2.1). */
export const locationSourceSchema = z.enum(['gps', 'manual']);

/** Arılık: kovanların bulunduğu yer. */
export const apiaryFields = z.object({
  ...ownedEntityShape,
  name: requiredText(100),
  /** Referans içerikteki iklim profili kodu (T4.1–T4.2); henüz seçilmediyse `null`. */
  climateProfileCode: z.string().trim().min(1).max(50).nullable(),
  latitude: z.number().min(-90).max(90).nullable(),
  longitude: z.number().min(-180).max(180).nullable(),
  locationSource: locationSourceSchema.nullable(),
  notes: optionalText(NOTES_MAX_LENGTH),
});

export const apiarySchema = apiaryFields.superRefine((value, ctx) => {
  checkSyncMeta(value, ctx);
  const hasLatitude = value.latitude !== null;
  const hasLongitude = value.longitude !== null;
  if (hasLatitude !== hasLongitude) {
    ctx.addIssue({
      code: 'custom',
      path: [hasLatitude ? 'longitude' : 'latitude'],
      message: 'Enlem ve boylam birlikte girilmeli',
    });
  }
  if (hasLatitude !== (value.locationSource !== null)) {
    ctx.addIssue({
      code: 'custom',
      path: ['locationSource'],
      message: 'Konum kaynağı yalnızca konum girildiğinde belirtilir',
    });
  }
});

export type LocationSource = z.infer<typeof locationSourceSchema>;
export type Apiary = z.infer<typeof apiarySchema>;
