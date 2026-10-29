-- pgTAP: senkron tabloları ve LWW fonksiyonları (TODO.md T1.2). Testler süper kullanıcıyla
-- koşar (RLS devre dışı); kullanıcı izolasyonu T1.3'ün rls_<tablo>_test.sql dosyalarındadır.
begin;
select plan(30);

-- Tablolar ve fonksiyonlar
select tables_are(
  'public',
  array['businesses', 'apiaries', 'hives', 'queens', 'inspections',
        'treatments', 'feedings', 'harvests', 'relocations', 'tasks'],
  'Senkron tabloları mevcut'
);
select ok(
  (select bool_and(c.relrowsecurity) from pg_class c join pg_namespace n on n.oid = c.relnamespace
    where n.nspname = 'public' and c.relname = any (public.sync_tables())),
  'Tüm senkron tablolarında RLS açık'
);
select ok(
  not has_table_privilege('anon', 'public.hives', 'select'),
  'anon senkron tablolarını okuyamaz'
);
select ok(
  not has_function_privilege('anon', 'public.sync_apply_changes(text, jsonb)', 'execute'),
  'anon sync_apply_changes çağıramaz'
);
select ok(
  has_function_privilege('authenticated', 'public.sync_changes_since(bigint, integer)', 'execute'),
  'authenticated sync_changes_since çağırabilir'
);

-- Örnek veriler
insert into auth.users (id) values ('00000000-0000-4000-8000-000000000001');

create temp table r on commit drop as
select * from public.sync_apply_changes('businesses', jsonb_build_array(jsonb_build_object(
  'id', '10000000-0000-4000-8000-000000000001',
  'owner_id', '00000000-0000-4000-8000-000000000001',
  'name', 'Karaca Arıcılık',
  'created_at', '2026-10-01T08:00:00Z',
  'updated_at', '2026-10-01T08:00:00Z',
  'deleted_at', null
)));
select is((select status from r), 'applied', 'Yeni işletme eklenir');

-- Yardımcı: bir kovan satırı üretir
create function pg_temp.hive(p_updated text, p_name text, p_number int default 1)
returns jsonb language sql as $$
  select jsonb_build_object(
    'id', '30000000-0000-4000-8000-000000000001',
    'business_id', '10000000-0000-4000-8000-000000000001',
    'apiary_id', '20000000-0000-4000-8000-000000000001',
    'number', p_number,
    'name', p_name,
    'status', 'active',
    'notes', null,
    'created_at', '2026-10-01T08:00:00Z',
    'updated_at', p_updated,
    'deleted_at', null
  );
$$;

select is(
  (select status from public.sync_apply_changes('apiaries', jsonb_build_array(jsonb_build_object(
    'id', '20000000-0000-4000-8000-000000000001',
    'business_id', '10000000-0000-4000-8000-000000000001',
    'name', 'Yayla',
    'climate_profile_code', null,
    'latitude', 40.9, 'longitude', 39.7, 'location_source', 'gps',
    'notes', null,
    'created_at', '2026-10-01T08:00:00Z',
    'updated_at', '2026-10-01T08:00:00Z',
    'deleted_at', null
  )))),
  'applied',
  'Arılık eklenir'
);

-- LWW
select is(
  (select status from public.sync_apply_changes('hives', jsonb_build_array(pg_temp.hive('2026-10-02T08:00:00Z', 'A')))),
  'applied', 'Yeni kovan eklenir'
);
select is(
  (select status from public.sync_apply_changes('hives', jsonb_build_array(pg_temp.hive('2026-10-02T08:00:00Z', 'A')))),
  'stale', 'Aynı sürüm tekrar gönderilirse stale döner (idempotent)'
);
select is(
  (select status from public.sync_apply_changes('hives', jsonb_build_array(pg_temp.hive('2026-10-01T09:00:00Z', 'Eski')))),
  'stale', 'Daha eski sürüm reddedilir'
);
select is((select name from public.hives), 'A', 'Eski sürüm veriyi değiştirmez');

select is(
  (select status from public.sync_apply_changes('hives', jsonb_build_array(pg_temp.hive('2026-10-03T08:00:00+03:00', 'Yeni', 7)))),
  'applied', 'Daha yeni sürüm uygulanır (saat dilimi farkıyla da)'
);
select results_eq(
  'select name, number from public.hives',
  $$values ('Yeni'::text, 7)$$,
  'Yeni sürümün alanları yazılır'
);

-- sync_seq her yazmada artar
create temp table seq_before on commit drop as select sync_seq from public.hives;
select public.sync_apply_changes('hives', jsonb_build_array(pg_temp.hive('2026-10-04T08:00:00Z', 'Daha yeni')));
select ok(
  (select h.sync_seq > b.sync_seq from public.hives h, seq_before b),
  'Güncelleme sync_seq değerini artırır'
);

-- Değişmeyen alanlar
select public.sync_apply_changes('hives', jsonb_build_array(
  pg_temp.hive('2026-10-05T08:00:00Z', 'X') || jsonb_build_object(
    'business_id', '19999999-0000-4000-8000-000000000001',
    'created_at', '2026-09-01T08:00:00Z'
  )
));
select results_eq(
  'select business_id::text, created_at from public.hives',
  $$values ('10000000-0000-4000-8000-000000000001'::text, '2026-10-01T08:00:00Z'::timestamptz)$$,
  'Güncellemede business_id ve created_at değişmez'
);

-- Yumuşak silme de bir güncellemedir
select is(
  (select status from public.sync_apply_changes('hives', jsonb_build_array(
    pg_temp.hive('2026-10-06T08:00:00Z', 'X') || jsonb_build_object('deleted_at', '2026-10-06T08:00:00Z')
  ))),
  'applied', 'Silme işareti uygulanır'
);
select isnt((select deleted_at from public.hives), null, 'Kayıt silinmiş olarak işaretlenir');

-- Reddedilen satırlar
select is(
  (select error from public.sync_apply_changes('hives', jsonb_build_array(
    pg_temp.hive((now() + interval '1 hour')::text, 'Gelecek')
  ))),
  'clock_skew', 'Cihaz saati çok ileride ise reddedilir'
);
select results_eq(
  $$select status, error from public.sync_apply_changes('hives', jsonb_build_array(
    pg_temp.hive('2026-10-07T08:00:00Z', 'Y', 0)
  ))$$,
  $$values ('rejected'::text, '23514'::text)$$,
  'Kural dışı değer (kovan no 0) reddedilir'
);
select results_eq(
  $$select status, error from public.sync_apply_changes('hives', jsonb_build_array(
    pg_temp.hive('2026-10-07T08:00:00Z', 'Y') || jsonb_build_object(
      'id', '30000000-0000-4000-8000-000000000002',
      'apiary_id', '29999999-0000-4000-8000-000000000001')
  ))$$,
  $$values ('rejected'::text, '23503'::text)$$,
  'Olmayan arılığa bağlı kovan reddedilir'
);
select results_eq(
  $$select status, error from public.sync_apply_changes('hives', jsonb_build_array(
    jsonb_build_object('id', 'kimlik-degil', 'updated_at', '2026-10-07T08:00:00Z')
  ))$$,
  $$values ('rejected'::text, '22P02'::text)$$,
  'Geçersiz kimlik reddedilir'
);

-- Toplu uygulama: hatalı satır diğerlerini engellemez
select results_eq(
  $$select status from public.sync_apply_changes('hives', jsonb_build_array(
    pg_temp.hive('2026-10-08T08:00:00Z', 'Z', 0),
    pg_temp.hive('2026-10-08T08:00:00Z', 'Z', 3)
  ))$$,
  $$values ('rejected'::text), ('applied'::text)$$,
  'Bir satırın hatası aynı partideki diğer satırları etkilemez'
);

select throws_ok(
  $$select * from public.sync_apply_changes('auth_users', '[]'::jsonb)$$,
  '22023', null, 'Bilinmeyen tablo reddedilir'
);
select throws_ok(
  $$select * from public.sync_apply_changes('hives', '{}'::jsonb)$$,
  '22023', null, 'Dizi olmayan gövde reddedilir'
);

-- sync_changes_since
select results_eq(
  'select table_name from public.sync_changes_since(0, 100) order by seq',
  $$values ('businesses'::text), ('apiaries'::text), ('hives'::text)$$,
  'Değişiklikler yazılma sırasıyla, her kayıt en son hâliyle bir kez gelir'
);
select is(
  (select count(*)::int from public.sync_changes_since(0, 2)),
  2, 'Limit uygulanır'
);
select is(
  (select count(*)::int from public.sync_changes_since((select max(sync_seq) from public.hives), 100)),
  0, 'İmleçten sonra değişiklik yoksa boş döner'
);
select ok(
  (select not (row_data ? 'sync_seq') and row_data ->> 'name' = 'Z'
     from public.sync_changes_since(0, 100) where table_name = 'hives'),
  'Satır JSON olarak, sync_seq olmadan gelir'
);
select throws_ok(
  'select * from public.sync_changes_since(-1, 10)', '22023', null, 'Negatif imleç reddedilir'
);
select throws_ok(
  'select * from public.sync_changes_since(0, 1001)', '22023', null, 'Çok büyük limit reddedilir'
);

select * from finish();
rollback;
