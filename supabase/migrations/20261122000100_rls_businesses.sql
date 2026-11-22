-- RLS: işletmeler (TODO.md T1.3). Kullanıcı yalnızca sahibi olduğu işletmeyi görür ve yazar.
-- Silme politikası yoktur: kayıtlar `deleted_at` ile silinir; hesap silme (T6.5) service-role ile
-- yapılır ve auth.users'tan zincirleme siler.

create policy businesses_select on public.businesses
  for select to authenticated
  using (owner_id = (select auth.uid()));

create policy businesses_insert on public.businesses
  for insert to authenticated
  with check (owner_id = (select auth.uid()));

create policy businesses_update on public.businesses
  for update to authenticated
  using (owner_id = (select auth.uid()))
  with check (owner_id = (select auth.uid()));
