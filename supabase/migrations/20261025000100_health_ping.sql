-- health Edge Function'ının veritabanı kontrolü: tek satırlık, yan etkisiz sorgu.
-- Yalnızca sunucu tarafı (service_role) çağırabilir; uygulama kullanıcıları çağıramaz.
create or replace function public.health_ping()
returns boolean
language sql
stable
set search_path = ''
as $$
  select true;
$$;

revoke execute on function public.health_ping() from public, anon, authenticated;
grant execute on function public.health_ping() to service_role;
