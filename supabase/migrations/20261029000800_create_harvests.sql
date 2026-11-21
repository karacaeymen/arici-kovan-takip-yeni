-- Bal sağımı (src/domain/entities/harvest.ts).
create table public.harvests (
  id uuid primary key,
  business_id uuid not null references public.businesses (id) on delete cascade,
  hive_id uuid not null references public.hives (id) on delete cascade,
  harvested_on date not null,
  frame_count integer check (frame_count between 1 and 100),
  weight_kg numeric check (weight_kg > 0 and weight_kg <= 1000),
  withdrawal_warning_acknowledged boolean not null,
  notes text check (char_length(notes) <= 2000),
  created_at timestamptz not null,
  updated_at timestamptz not null check (updated_at >= created_at),
  deleted_at timestamptz check (deleted_at >= created_at),
  sync_seq bigint not null,
  constraint harvests_amount_present check (frame_count is not null or weight_kg is not null)
);

create index harvests_business_id_idx on public.harvests (business_id);
create index harvests_hive_id_idx on public.harvests (hive_id);
create index harvests_sync_seq_idx on public.harvests (sync_seq);

create trigger harvests_sync_touch
  before insert or update on public.harvests
  for each row execute function public.sync_touch();

alter table public.harvests enable row level security;
revoke all on public.harvests from anon;
