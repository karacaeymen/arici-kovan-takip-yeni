-- Kovan (src/domain/entities/hive.ts).
create table public.hives (
  id uuid primary key,
  business_id uuid not null references public.businesses (id) on delete cascade,
  apiary_id uuid not null references public.apiaries (id) on delete cascade,
  number integer not null check (number between 1 and 99999),
  name text check (char_length(name) <= 50),
  status text not null check (status in ('active', 'dead', 'sold', 'merged')),
  notes text check (char_length(notes) <= 2000),
  created_at timestamptz not null,
  updated_at timestamptz not null check (updated_at >= created_at),
  deleted_at timestamptz check (deleted_at >= created_at),
  sync_seq bigint not null
);

create index hives_business_id_idx on public.hives (business_id);
create index hives_apiary_id_idx on public.hives (apiary_id);
create index hives_sync_seq_idx on public.hives (sync_seq);

create trigger hives_sync_touch
  before insert or update on public.hives
  for each row execute function public.sync_touch();

alter table public.hives enable row level security;
revoke all on public.hives from anon;
