-- Temel eklentiler (TODO.md T0.4).
-- pgTAP: veritabanı testleri (supabase test db). Supabase'de eklentiler "extensions" şemasında durur.
create extension if not exists pgtap with schema extensions;
