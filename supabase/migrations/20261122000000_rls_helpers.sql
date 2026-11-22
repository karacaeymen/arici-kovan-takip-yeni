-- RLS yardımcıları (TODO.md T1.3). Politikalar bu fonksiyonları kullanır.
--
-- `security definer`: fonksiyonlar tablo sahibinin yetkisiyle çalışır, böylece politika içinden
-- `businesses` tablosuna bakarken RLS tekrar devreye girmez (özyineleme ve satır başına ek
-- politika maliyeti olmaz). Yalnızca true/false döndürdükleri için veri sızdırmazlar.

-- Çağıran kullanıcı bu işletmenin sahibi mi?
create or replace function public.rls_owns_business(p_business_id uuid)
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select exists (
    select 1
      from public.businesses b
     where b.id = p_business_id
       and b.owner_id = (select auth.uid())
  );
$$;

-- Arılık başka bir işletmeye ait değil mi? Arılık yoksa (henüz gönderilmemiş ya da alan boş)
-- true döner: yokluğu yabancı anahtar yakalar (23503 → istemci tekrar dener), RLS değil.
create or replace function public.rls_apiary_in_business(p_apiary_id uuid, p_business_id uuid)
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select p_apiary_id is null or not exists (
    select 1
      from public.apiaries a
     where a.id = p_apiary_id
       and a.business_id <> p_business_id
  );
$$;

-- Kovan başka bir işletmeye ait değil mi? (Kurallar `rls_apiary_in_business` ile aynı.)
create or replace function public.rls_hive_in_business(p_hive_id uuid, p_business_id uuid)
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select p_hive_id is null or not exists (
    select 1
      from public.hives h
     where h.id = p_hive_id
       and h.business_id <> p_business_id
  );
$$;

revoke execute on function public.rls_owns_business(uuid) from public, anon;
revoke execute on function public.rls_apiary_in_business(uuid, uuid) from public, anon;
revoke execute on function public.rls_hive_in_business(uuid, uuid) from public, anon;
grant execute on function public.rls_owns_business(uuid) to authenticated, service_role;
grant execute on function public.rls_apiary_in_business(uuid, uuid) to authenticated, service_role;
grant execute on function public.rls_hive_in_business(uuid, uuid) to authenticated, service_role;
