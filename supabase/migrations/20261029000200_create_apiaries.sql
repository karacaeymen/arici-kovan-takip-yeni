-- Arılık (src/domain/entities/apiary.ts).
create table public.apiaries (
  id uuid primary key,
  business_id uuid not null references public.businesses (id) on delete cascade,
  name text not null check (char_length(name) between 1 and 100 and name = btrim(name)),
  climate_profile_code text check (char_length(climate_profile_code) between 1 and 50),
  latitude double precision check (latitude between -90 and 90),
  longitude double precision check (longitude between -180 and 180),
  location_source text check (location_source in ('gps', 'manual')),
  notes text check (char_length(notes) <= 2000),
  created_at timestamptz not null,
  updated_at timestamptz not null check (updated_at >= created_at),
  deleted_at timestamptz check (deleted_at >= created_at),
  sync_seq bigint not null,
  constraint apiaries_location_complete check (
    (latitude is null) = (longitude is null) and (latitude is null) = (location_source is null)
  )
);

create index apiaries_business_id_idx on public.apiaries (business_id);
create index apiaries_sync_seq_idx on public.apiaries (sync_seq);

create trigger apiaries_sync_touch
  before insert or update on public.apiaries
  for each row execute function public.sync_touch();

alter table public.apiaries enable row level security;
revoke all on public.apiaries from anon;
