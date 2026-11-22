-- RLS: denetim kayıtları (TODO.md T1.3). Yalnızca sahibi olunan işletmenin kayıtları
-- görülür ve yazılır.
-- Bağlı kayıtlar (`hive_id`) da aynı işletmeye ait olmalıdır.
-- Silme politikası yoktur: kayıtlar `deleted_at` ile silinir.

create policy inspections_select on public.inspections
  for select to authenticated
  using (public.rls_owns_business(business_id));

create policy inspections_insert on public.inspections
  for insert to authenticated
  with check (
    public.rls_owns_business(business_id)
      and public.rls_hive_in_business(hive_id, business_id)
  );

create policy inspections_update on public.inspections
  for update to authenticated
  using (public.rls_owns_business(business_id))
  with check (
    public.rls_owns_business(business_id)
      and public.rls_hive_in_business(hive_id, business_id)
  );
