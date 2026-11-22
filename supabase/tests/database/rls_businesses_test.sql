-- pgTAP: i̇şletme tablosunda işletmeler arası veri izolasyonu (TODO.md T1.3).
-- Veriler süper kullanıcıyla eklenir; testler `authenticated` rolüyle, A kullanıcısının JWT'siyle koşar.
begin;
select plan(10);

create function pg_temp.row(p_id uuid, p_owner uuid, p_updated text default '2026-11-01T08:00:00Z')
returns jsonb language sql as $$
  select jsonb_build_object('id', p_id, 'owner_id', p_owner, 'name', 'İşletme', 'created_at', '2026-11-01T08:00:00Z', 'updated_at', p_updated, 'deleted_at', null);
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

-- A kullanıcısı olarak
set local role authenticated;
select set_config('request.jwt.claims', '{"sub": "00000000-0000-4000-8000-0000000000a1", "role": "authenticated"}', true);

select results_eq(
  'select id from public.businesses order by id',
  $$values ('10000000-0000-4000-8000-0000000000a1'::uuid)$$,
  'A yalnızca kendi işletmesini görür'
);
select results_eq(
  $$select seq is not null, row_data ->> 'id' from public.sync_changes_since(0, 1000) where table_name = 'businesses'$$,
  $$values (true, '10000000-0000-4000-8000-0000000000a1')$$,
  'pull yalnızca A''nın işletmesini döndürür'
);
select is(
  (select status || ':' || coalesce(error, '') from public.sync_apply_changes('businesses', jsonb_build_array(pg_temp.row('10000000-0000-4000-8000-0000000000a9', '00000000-0000-4000-8000-0000000000a1')))),
  'applied:',
  'A kendi adına yeni işletme açabilir'
);
select is(
  (select status || ':' || coalesce(error, '') from public.sync_apply_changes('businesses', jsonb_build_array(pg_temp.row('10000000-0000-4000-8000-0000000000a8', '00000000-0000-4000-8000-0000000000b1')))),
  'rejected:42501',
  'A başkası adına işletme açamaz'
);
select is(
  (select status || ':' || coalesce(error, '') from public.sync_apply_changes('businesses', jsonb_build_array(pg_temp.row('10000000-0000-4000-8000-0000000000b1', '00000000-0000-4000-8000-0000000000a1', '2026-11-02T08:00:00Z')))),
  'rejected:42501',
  'A, B''nin işletmesinin kimliğiyle gönderim yaparak onu ezemez'
);
select is_empty(
  $$update public.businesses set name = 'Ele geçirildi' where id = '10000000-0000-4000-8000-0000000000b1' returning id$$,
  'A, B''nin işletmesini doğrudan güncelleyemez'
);
select throws_ok(
  $$update public.businesses set owner_id = '00000000-0000-4000-8000-0000000000b1' where id = '10000000-0000-4000-8000-0000000000a1'$$,
  '42501',
  null,
  'A kendi işletmesini başkasına devredemez'
);
select is_empty(
  $$delete from public.businesses where id = '10000000-0000-4000-8000-0000000000a1' returning id$$,
  'Kayıt fiziksel olarak silinemez (silme politikası yok)'
);

-- Süper kullanıcıya dönüp B'nin verisinin bozulmadığını doğrula
reset role;
select is(
  (select name from public.businesses where id = '10000000-0000-4000-8000-0000000000b1'),
  'B Arıcılık',
  'B''nin işletmesi değişmedi'
);
select is(
  (select count(*)::int from public.businesses where id = '10000000-0000-4000-8000-0000000000a1'),
  1,
  'A''nın işletmesi silinmedi'
);

select * from finish();
rollback;
