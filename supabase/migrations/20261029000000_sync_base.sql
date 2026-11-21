-- Senkron altyapısı (TODO.md T1.2): tüm senkron tablolarının ortak sırası ve tetikleyicisi.
--
-- Her yazma, satıra global ve artan bir `sync_seq` verir. İstemci "şu numaradan sonraki
-- değişiklikleri ver" diye çeker (sync_changes_since). Numaralar ile commit sırasının aynı
-- olması için yazma, işletme başına bir kilit alır: aynı işletmeye yazan iki işlem sırayla
-- ilerler, böylece düşük numaralı bir satır, yüksek numaralı satır okunduktan sonra görünür
-- hale gelip kaçırılamaz.

create sequence public.sync_seq as bigint;

-- Uygulama kullanıcıları sıraya doğrudan erişmez; numarayı tetikleyici verir.
revoke all on sequence public.sync_seq from public, anon, authenticated;
grant usage on sequence public.sync_seq to authenticated, service_role;

create or replace function public.sync_touch()
returns trigger
language plpgsql
set search_path = ''
as $$
declare
  v_business_id uuid;
begin
  -- İşletme kaydında kilit anahtarı kendi kimliği, diğer tablolarda business_id'dir.
  if tg_table_name = 'businesses' then
    v_business_id := new.id;
  else
    v_business_id := new.business_id;
  end if;
  perform pg_advisory_xact_lock(hashtextextended(v_business_id::text, 0));
  new.sync_seq := nextval('public.sync_seq');
  return new;
end;
$$;

revoke execute on function public.sync_touch() from public, anon, authenticated;
