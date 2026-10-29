-- Kraliçe (src/domain/entities/queen.ts).
create table public.queens (
  id uuid primary key,
  business_id uuid not null references public.businesses (id) on delete cascade,
  hive_id uuid not null references public.hives (id) on delete cascade,
  birth_year integer check (birth_year between 2000 and 2100),
  is_marked boolean not null,
  origin text not null check (origin in ('own_rearing', 'purchased', 'swarm', 'unknown')),
  introduced_on date not null,
  ended_on date check (ended_on >= introduced_on),
  end_reason text check (end_reason in ('replaced', 'died', 'swarmed', 'unknown')),
  notes text check (char_length(notes) <= 2000),
  created_at timestamptz not null,
  updated_at timestamptz not null check (updated_at >= created_at),
  deleted_at timestamptz check (deleted_at >= created_at),
  sync_seq bigint not null,
  constraint queens_end_complete check ((ended_on is null) = (end_reason is null))
);

create index queens_business_id_idx on public.queens (business_id);
create index queens_hive_id_idx on public.queens (hive_id);
create index queens_sync_seq_idx on public.queens (sync_seq);

create trigger queens_sync_touch
  before insert or update on public.queens
  for each row execute function public.sync_touch();

alter table public.queens enable row level security;
revoke all on public.queens from anon;
