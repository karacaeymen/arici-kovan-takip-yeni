-- RLS: kovan taşıma kayıtları (TODO.md T1.3). Yalnızca sahibi olunan işletmenin kayıtları
-- görülür ve yazılır.
-- Bağlı kayıtlar (`hive_id`, `from_apiary_id`, `to_apiary_id`) da aynı işletmeye ait olmalıdır.
-- Silme politikası yoktur: kayıtlar `deleted_at` ile silinir.

create policy relocations_select on public.relocations
  for select to authenticated
  using (public.rls_owns_business(business_id));

create policy relocations_insert on public.relocations
  for insert to authenticated
  with check (
    public.rls_owns_business(business_id)
      and public.rls_hive_in_business(hive_id, business_id)
      and public.rls_apiary_in_business(from_apiary_id, business_id)
      and public.rls_apiary_in_business(to_apiary_id, business_id)
  );

create policy relocations_update on public.relocations
  for update to authenticated
  using (public.rls_owns_business(business_id))
  with check (
    public.rls_owns_business(business_id)
      and public.rls_hive_in_business(hive_id, business_id)
      and public.rls_apiary_in_business(from_apiary_id, business_id)
      and public.rls_apiary_in_business(to_apiary_id, business_id)
  );
