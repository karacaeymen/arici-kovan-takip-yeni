-- RLS: görev kayıtları (TODO.md T1.3). Yalnızca sahibi olunan işletmenin kayıtları
-- görülür ve yazılır.
-- Bağlı kayıtlar (`apiary_id`, `hive_id`) da aynı işletmeye ait olmalıdır.
-- Silme politikası yoktur: kayıtlar `deleted_at` ile silinir.

create policy tasks_select on public.tasks
  for select to authenticated
  using (public.rls_owns_business(business_id));

create policy tasks_insert on public.tasks
  for insert to authenticated
  with check (
    public.rls_owns_business(business_id)
      and public.rls_apiary_in_business(apiary_id, business_id)
      and public.rls_hive_in_business(hive_id, business_id)
  );

create policy tasks_update on public.tasks
  for update to authenticated
  using (public.rls_owns_business(business_id))
  with check (
    public.rls_owns_business(business_id)
      and public.rls_apiary_in_business(apiary_id, business_id)
      and public.rls_hive_in_business(hive_id, business_id)
  );
