-- RLS: kovan kayıtları (TODO.md T1.3). Yalnızca sahibi olunan işletmenin kayıtları
-- görülür ve yazılır.
-- Bağlı kayıtlar (`apiary_id`) da aynı işletmeye ait olmalıdır.
-- Silme politikası yoktur: kayıtlar `deleted_at` ile silinir.

create policy hives_select on public.hives
  for select to authenticated
  using (public.rls_owns_business(business_id));

create policy hives_insert on public.hives
  for insert to authenticated
  with check (
    public.rls_owns_business(business_id)
      and public.rls_apiary_in_business(apiary_id, business_id)
  );

create policy hives_update on public.hives
  for update to authenticated
  using (public.rls_owns_business(business_id))
  with check (
    public.rls_owns_business(business_id)
      and public.rls_apiary_in_business(apiary_id, business_id)
  );
