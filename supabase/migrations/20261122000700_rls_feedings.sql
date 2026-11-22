-- RLS: besleme kayıtları (TODO.md T1.3). Yalnızca sahibi olunan işletmenin kayıtları
-- görülür ve yazılır.
-- Bağlı kayıtlar (`hive_id`) da aynı işletmeye ait olmalıdır.
-- Silme politikası yoktur: kayıtlar `deleted_at` ile silinir.

create policy feedings_select on public.feedings
  for select to authenticated
  using (public.rls_owns_business(business_id));

create policy feedings_insert on public.feedings
  for insert to authenticated
  with check (
    public.rls_owns_business(business_id)
      and public.rls_hive_in_business(hive_id, business_id)
  );

create policy feedings_update on public.feedings
  for update to authenticated
  using (public.rls_owns_business(business_id))
  with check (
    public.rls_owns_business(business_id)
      and public.rls_hive_in_business(hive_id, business_id)
  );
