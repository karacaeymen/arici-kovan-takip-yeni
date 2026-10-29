import { z } from 'zod';

/** Baştaki/sondaki boşlukları atılmış, uzunluğu sınırlı zorunlu metin (ör. arılık adı). */
export function requiredText(max: number) {
  return z
    .string()
    .trim()
    .min(1, { error: 'Bu alan boş bırakılamaz' })
    .max(max, { error: `En fazla ${max} karakter olabilir` });
}

/** İsteğe bağlı serbest metin (ör. notlar). Boş metin `null` olarak saklanır. */
export function optionalText(max: number) {
  return z
    .string()
    .trim()
    .max(max, { error: `En fazla ${max} karakter olabilir` })
    .transform((value) => (value === '' ? null : value))
    .nullable();
}

/** Not alanları için ortak üst sınır. */
export const NOTES_MAX_LENGTH = 2000;
