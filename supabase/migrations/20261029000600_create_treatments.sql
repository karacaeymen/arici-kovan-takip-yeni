-- İlaçlama (src/domain/entities/treatment.ts).
create table public.treatments (
  id uuid primary key,
  business_id uuid not null references public.businesses (id) on delete cascade,
  hive_id uuid not null references public.hives (id) on delete cascade,
  product_code text not null check (char_length(product_code) between 1 and 50),
  started_on date not null,
  ended_on date check (ended_on >= started_on),
  dose text check (char_length(dose) <= 100),
  withdrawal_days integer not null check (withdrawal_days between 0 and 365),
  notes text check (char_length(notes) <= 2000),
  created_at timestamptz not null,
  updated_at timestamptz not null check (updated_at >= created_at),
  deleted_at timestamptz check (deleted_at >= created_at),
  sync_seq bigint not null
);

create index treatments_business_id_idx on public.treatments (business_id);
create index treatments_hive_id_idx on public.treatments (hive_id);
create index treatments_sync_seq_idx on public.treatments (sync_seq);

create trigger treatments_sync_touch
  before insert or update on public.treatments
  for each row execute function public.sync_touch();

alter table public.treatments enable row level security;
revoke all on public.treatments from anon;
