-- pgTAP: temel eklentiler ve health_ping (npm run db:test)
begin;
select plan(5);

select has_extension('pgtap', 'pgTAP eklentisi kurulu');
select has_function('public', 'health_ping', 'health_ping fonksiyonu var');
select is(public.health_ping(), true, 'health_ping true döner');
select ok(
  has_function_privilege('service_role', 'public.health_ping()', 'execute'),
  'service_role health_ping çağırabilir'
);
select ok(
  not has_function_privilege('anon', 'public.health_ping()', 'execute'),
  'anon health_ping çağıramaz'
);

select * from finish();
rollback;
