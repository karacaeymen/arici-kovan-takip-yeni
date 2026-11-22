-- RLS: arılık kayıtları (TODO.md T1.3). Yalnızca sahibi olunan işletmenin kayıtları
-- görülür ve yazılır.
-- Silme politikası yoktur: kayıtlar `deleted_at` ile silinir.

create policy apiaries_select on public.apiaries
  for select to authenticated
  using (public.rls_owns_business(business_id));

create policy apiaries_insert on public.apiaries
  for insert to authenticated
  with check (
    public.rls_owns_business(business_id)
  );

create policy apiaries_update on public.apiaries
  for update to authenticated
  using (public.rls_owns_business(business_id))
  with check (
    public.rls_owns_business(business_id)
  );
