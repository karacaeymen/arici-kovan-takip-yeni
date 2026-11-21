-- Takvim görevi (src/domain/entities/task.ts).
create table public.tasks (
  id uuid primary key,
  business_id uuid not null references public.businesses (id) on delete cascade,
  apiary_id uuid references public.apiaries (id) on delete cascade,
  hive_id uuid references public.hives (id) on delete cascade,
  source text not null check (source in ('rule', 'manual')),
  rule_id text check (char_length(rule_id) between 1 and 100),
  dedup_key text check (char_length(dedup_key) between 1 and 200),
  title text not null check (char_length(title) between 1 and 200 and title = btrim(title)),
  due_on date not null,
  status text not null check (status in ('pending', 'done', 'snoozed', 'dismissed')),
  completed_at timestamptz,
  snoozed_until date check (snoozed_until > due_on),
  notes text check (char_length(notes) <= 2000),
  created_at timestamptz not null,
  updated_at timestamptz not null check (updated_at >= created_at),
  deleted_at timestamptz check (deleted_at >= created_at),
  sync_seq bigint not null,
  constraint tasks_rule_info check (
    case source
      when 'rule' then rule_id is not null and dedup_key is not null
      else rule_id is null and dedup_key is null
    end
  ),
  constraint tasks_completed check ((status = 'done') = (completed_at is not null)),
  constraint tasks_snoozed check ((status = 'snoozed') = (snoozed_until is not null))
);

create index tasks_business_id_idx on public.tasks (business_id);
create index tasks_apiary_id_idx on public.tasks (apiary_id);
create index tasks_hive_id_idx on public.tasks (hive_id);
create index tasks_sync_seq_idx on public.tasks (sync_seq);

create trigger tasks_sync_touch
  before insert or update on public.tasks
  for each row execute function public.sync_touch();

alter table public.tasks enable row level security;
revoke all on public.tasks from anon;
