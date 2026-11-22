-- pgTAP: kraliçe tablosunda işletmeler arası veri izolasyonu (TODO.md T1.3).
-- Veriler süper kullanıcıyla eklenir; testler `authenticated` rolüyle, A kullanıcısının JWT'siyle koşar.
begin;
select plan(12);

create function pg_temp.row(
  p_id uuid, p_business uuid, p_apiary uuid, p_apiary2 uuid, p_hive uuid,
  p_updated text default '2026-11-01T08:00:00Z'
) returns jsonb language sql as $$
  select jsonb_build_object('id', p_id, 'business_id', p_business, 'hive_id', p_hive, 'birth_year', 2026, 'is_marked', false, 'origin', 'unknown', 'introduced_on', '2026-05-01', 'ended_on', null, 'end_reason', null, 'created_at', '2026-11-01T08:00:00Z', 'updated_at', p_updated, 'deleted_at', null);
$$;

-- Örnek veriler (süper kullanıcı, RLS devre dışı): A ve B kullanıcılarının birer işletmesi,
-- ikişer arılığı ve birer kovanı.
insert into auth.users (id) values ('00000000-0000-4000-8000-0000000000a1'), ('00000000-0000-4000-8000-0000000000b1');
insert into public.businesses (id, owner_id, name, created_at, updated_at)
values ('10000000-0000-4000-8000-0000000000a1', '00000000-0000-4000-8000-0000000000a1', 'A Arıcılık', '2026-11-01T08:00:00Z', '2026-11-01T08:00:00Z'),
       ('10000000-0000-4000-8000-0000000000b1', '00000000-0000-4000-8000-0000000000b1', 'B Arıcılık', '2026-11-01T08:00:00Z', '2026-11-01T08:00:00Z');
insert into public.apiaries (id, business_id, name, created_at, updated_at)
values ('20000000-0000-4000-8000-0000000000a1', '10000000-0000-4000-8000-0000000000a1', 'A1', '2026-11-01T08:00:00Z', '2026-11-01T08:00:00Z'),
       ('20000000-0000-4000-8000-0000000000a2', '10000000-0000-4000-8000-0000000000a1', 'A2', '2026-11-01T08:00:00Z', '2026-11-01T08:00:00Z'),
       ('20000000-0000-4000-8000-0000000000b1', '10000000-0000-4000-8000-0000000000b1', 'B1', '2026-11-01T08:00:00Z', '2026-11-01T08:00:00Z'),
       ('20000000-0000-4000-8000-0000000000b2', '10000000-0000-4000-8000-0000000000b1', 'B2', '2026-11-01T08:00:00Z', '2026-11-01T08:00:00Z');
insert into public.hives (id, business_id, apiary_id, number, status, created_at, updated_at)
values ('30000000-0000-4000-8000-0000000000a1', '10000000-0000-4000-8000-0000000000a1', '20000000-0000-4000-8000-0000000000a1', 1, 'active', '2026-11-01T08:00:00Z', '2026-11-01T08:00:00Z'),
       ('30000000-0000-4000-8000-0000000000b1', '10000000-0000-4000-8000-0000000000b1', '20000000-0000-4000-8000-0000000000b1', 1, 'active', '2026-11-01T08:00:00Z', '2026-11-01T08:00:00Z');
insert into public.queens select * from jsonb_populate_record(null::public.queens, pg_temp.row('40000000-0000-4000-8000-0000000000a1', '10000000-0000-4000-8000-0000000000a1', '20000000-0000-4000-8000-0000000000a1', '20000000-0000-4000-8000-0000000000a2', '30000000-0000-4000-8000-0000000000a1'));
insert into public.queens select * from jsonb_populate_record(null::public.queens, pg_temp.row('40000000-0000-4000-8000-0000000000b1', '10000000-0000-4000-8000-0000000000b1', '20000000-0000-4000-8000-0000000000b1', '20000000-0000-4000-8000-0000000000b2', '30000000-0000-4000-8000-0000000000b1'));

-- A kullanıcısı olarak
set local role authenticated;
select set_config('request.jwt.claims', '{"sub": "00000000-0000-4000-8000-0000000000a1", "role": "authenticated"}', true);

select results_eq(
  'select id from public.queens order by id',
  $$values ('40000000-0000-4000-8000-0000000000a1'::uuid)$$,
  'A yalnızca kendi işletmesinin kayıtlarını görür'
);
select is(
  (select count(*)::int from public.sync_changes_since(0, 1000)
    where table_name = 'queens' and (row_data ->> 'business_id')::uuid <> '10000000-0000-4000-8000-0000000000a1'),
  0,
  'pull başka işletmenin kaydını döndürmez'
);
select is(
  (select status || ':' || coalesce(error, '') from public.sync_apply_changes('queens', jsonb_build_array(pg_temp.row('40000000-0000-4000-8000-0000000000a9', '10000000-0000-4000-8000-0000000000a1', '20000000-0000-4000-8000-0000000000a1', '20000000-0000-4000-8000-0000000000a2', '30000000-0000-4000-8000-0000000000a1')))),
  'applied:',
  'A kendi işletmesine kayıt ekleyebilir'
);
select is(
  (select status || ':' || coalesce(error, '') from public.sync_apply_changes('queens', jsonb_build_array(pg_temp.row('40000000-0000-4000-8000-0000000000a8', '10000000-0000-4000-8000-0000000000b1', '20000000-0000-4000-8000-0000000000b1', '20000000-0000-4000-8000-0000000000b2', '30000000-0000-4000-8000-0000000000b1')))),
  'rejected:42501',
  'A, B''nin işletmesine kayıt ekleyemez'
);
select is(
  (select status || ':' || coalesce(error, '') from public.sync_apply_changes('queens', jsonb_build_array(pg_temp.row('40000000-0000-4000-8000-0000000000b1', '10000000-0000-4000-8000-0000000000a1', '20000000-0000-4000-8000-0000000000a1', '20000000-0000-4000-8000-0000000000a2', '30000000-0000-4000-8000-0000000000a1', '2026-11-02T08:00:00Z')))),
  'rejected:42501',
  'A, B''nin kaydının kimliğiyle gönderim yaparak onu ezemez'
);
select is_empty(
  $$update public.queens set updated_at = '2026-11-03T08:00:00Z' where id = '40000000-0000-4000-8000-0000000000b1' returning id$$,
  'A, B''nin kaydını doğrudan güncelleyemez'
);
select throws_ok(
  $$update public.queens set business_id = '10000000-0000-4000-8000-0000000000b1' where id = '40000000-0000-4000-8000-0000000000a1'$$,
  '42501',
  null,
  'A kendi kaydını B''nin işletmesine taşıyamaz'
);
select is_empty(
  $$delete from public.queens where id = '40000000-0000-4000-8000-0000000000a1' returning id$$,
  'Kayıt fiziksel olarak silinemez (silme politikası yok)'
);
select is(
  (select status || ':' || coalesce(error, '') from public.sync_apply_changes('queens', jsonb_build_array(pg_temp.row('40000000-0000-4000-8000-0000000000c1', '10000000-0000-4000-8000-0000000000a1', '20000000-0000-4000-8000-0000000000a1', '20000000-0000-4000-8000-0000000000a2', '30000000-0000-4000-8000-0000000000b1')))),
  'rejected:42501',
  'A kendi kaydını B''nin kovanına bağlayamaz (hive_id)'
);
select is(
  (select status || ':' || coalesce(error, '') from public.sync_apply_changes('queens', jsonb_build_array(pg_temp.row('40000000-0000-4000-8000-0000000000f1', '10000000-0000-4000-8000-0000000000a1', '20000000-0000-4000-8000-0000000000a1', '20000000-0000-4000-8000-0000000000a2', '30000000-0000-4000-8000-0000000000f9')))),
  'rejected:23503',
  'Henüz gelmemiş bağlı kayıt RLS değil yabancı anahtar hatası verir (istemci tekrar dener)'
);

-- Süper kullanıcıya dönüp B'nin verisinin bozulmadığını doğrula
reset role;
select is(
  (select updated_at from public.queens where id = '40000000-0000-4000-8000-0000000000b1'),
  '2026-11-01T08:00:00Z'::timestamptz,
  'B''nin kaydı değişmedi'
);
select is(
  (select business_id from public.queens where id = '40000000-0000-4000-8000-0000000000a1'),
  '10000000-0000-4000-8000-0000000000a1'::uuid,
  'A''nın kaydı hâlâ A''nın işletmesinde'
);

select * from finish();
rollback;
