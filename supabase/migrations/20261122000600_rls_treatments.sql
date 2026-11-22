-- RLS: i̇laçlama kayıtları (TODO.md T1.3). Yalnızca sahibi olunan işletmenin kayıtları
-- görülür ve yazılır.
-- Bağlı kayıtlar (`hive_id`) da aynı işletmeye ait olmalıdır.
-- Silme politikası yoktur: kayıtlar `deleted_at` ile silinir.

create policy treatments_select on public.treatments
  for select to authenticated
  using (public.rls_owns_business(business_id));

create policy treatments_insert on public.treatments
  for insert to authenticated
  with check (
    public.rls_owns_business(business_id)
      and public.rls_hive_in_business(hive_id, business_id)
  );

create policy treatments_update on public.treatments
  for update to authenticated
  using (public.rls_owns_business(business_id))
  with check (
    public.rls_owns_business(business_id)
      and public.rls_hive_in_business(hive_id, business_id)
  );
