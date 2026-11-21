-- Kovan denetimi (src/domain/entities/inspection.ts).
create table public.inspections (
  id uuid primary key,
  business_id uuid not null references public.businesses (id) on delete cascade,
  hive_id uuid not null references public.hives (id) on delete cascade,
  session_id uuid,
  inspected_at timestamptz not null,
  bee_frames integer check (bee_frames between 0 and 40),
  brood_frames integer check (brood_frames between 0 and 40),
  honey_frames integer check (honey_frames between 0 and 40),
  queen_status text check (queen_status in ('seen', 'eggs_seen', 'not_seen', 'queenless')),
  varroa_method text check (varroa_method in ('alcohol_wash', 'sugar_roll', 'sticky_board')),
  varroa_mite_count integer check (varroa_mite_count between 0 and 10000),
  varroa_sample_size integer check (varroa_sample_size between 1 and 10000),
  temperament text check (temperament in ('calm', 'nervous', 'aggressive')),
  notes text check (char_length(notes) <= 2000),
  created_at timestamptz not null,
  updated_at timestamptz not null check (updated_at >= created_at),
  deleted_at timestamptz check (deleted_at >= created_at),
  sync_seq bigint not null,
  constraint inspections_varroa_count check ((varroa_method is null) = (varroa_mite_count is null)),
  -- Örnek arı sayısı yalnızca yıkama ve pudra şekeri yönteminde girilir.
  constraint inspections_varroa_sample check (
    (varroa_sample_size is not null) = coalesce(varroa_method in ('alcohol_wash', 'sugar_roll'), false)
  )
);

create index inspections_business_id_idx on public.inspections (business_id);
create index inspections_hive_id_idx on public.inspections (hive_id);
create index inspections_sync_seq_idx on public.inspections (sync_seq);

create trigger inspections_sync_touch
  before insert or update on public.inspections
  for each row execute function public.sync_touch();

alter table public.inspections enable row level security;
revoke all on public.inspections from anon;
