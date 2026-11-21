-- İşletme (src/domain/entities/business.ts). Diğer tüm kayıtlar bir işletmeye bağlıdır.
create table public.businesses (
  id uuid primary key,
  owner_id uuid not null references auth.users (id) on delete cascade,
  name text not null check (char_length(name) between 1 and 100 and name = btrim(name)),
  created_at timestamptz not null,
  updated_at timestamptz not null check (updated_at >= created_at),
  deleted_at timestamptz check (deleted_at >= created_at),
  sync_seq bigint not null
);

create index businesses_owner_id_idx on public.businesses (owner_id);
create index businesses_sync_seq_idx on public.businesses (sync_seq);

create trigger businesses_sync_touch
  before insert or update on public.businesses
  for each row execute function public.sync_touch();

-- Politikalar T1.3'te eklenir; o zamana kadar RLS her erişimi kapatır.
alter table public.businesses enable row level security;
revoke all on public.businesses from anon;
