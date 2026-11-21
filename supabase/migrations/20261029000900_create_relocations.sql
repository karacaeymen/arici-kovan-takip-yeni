-- Kovan taşıma (src/domain/entities/relocation.ts).
create table public.relocations (
  id uuid primary key,
  business_id uuid not null references public.businesses (id) on delete cascade,
  hive_id uuid not null references public.hives (id) on delete cascade,
  from_apiary_id uuid not null references public.apiaries (id) on delete cascade,
  to_apiary_id uuid not null references public.apiaries (id) on delete cascade,
  moved_at timestamptz not null,
  notes text check (char_length(notes) <= 2000),
  created_at timestamptz not null,
  updated_at timestamptz not null check (updated_at >= created_at),
  deleted_at timestamptz check (deleted_at >= created_at),
  sync_seq bigint not null,
  constraint relocations_different_apiary check (from_apiary_id <> to_apiary_id)
);

create index relocations_business_id_idx on public.relocations (business_id);
create index relocations_hive_id_idx on public.relocations (hive_id);
create index relocations_from_apiary_id_idx on public.relocations (from_apiary_id);
create index relocations_to_apiary_id_idx on public.relocations (to_apiary_id);
create index relocations_sync_seq_idx on public.relocations (sync_seq);

create trigger relocations_sync_touch
  before insert or update on public.relocations
  for each row execute function public.sync_touch();

alter table public.relocations enable row level security;
revoke all on public.relocations from anon;
