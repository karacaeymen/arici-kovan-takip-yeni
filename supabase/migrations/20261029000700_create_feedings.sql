-- Besleme (src/domain/entities/feeding.ts).
create table public.feedings (
  id uuid primary key,
  business_id uuid not null references public.businesses (id) on delete cascade,
  hive_id uuid not null references public.hives (id) on delete cascade,
  fed_on date not null,
  feed_type text not null check (
    feed_type in ('sugar_syrup', 'fondant', 'pollen_patty', 'honey', 'other')
  ),
  amount numeric not null check (amount > 0 and amount <= 1000),
  unit text not null check (unit in ('kg', 'l')),
  notes text check (char_length(notes) <= 2000),
  created_at timestamptz not null,
  updated_at timestamptz not null check (updated_at >= created_at),
  deleted_at timestamptz check (deleted_at >= created_at),
  sync_seq bigint not null
);

create index feedings_business_id_idx on public.feedings (business_id);
create index feedings_hive_id_idx on public.feedings (hive_id);
create index feedings_sync_seq_idx on public.feedings (sync_seq);

create trigger feedings_sync_touch
  before insert or update on public.feedings
  for each row execute function public.sync_touch();

alter table public.feedings enable row level security;
revoke all on public.feedings from anon;
