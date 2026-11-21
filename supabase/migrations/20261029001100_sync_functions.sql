-- Senkron SQL fonksiyonları (TODO.md T1.2). İstemci bunlara `sync` Edge Function'ı üzerinden ulaşır.
-- İkisi de çağıranın yetkisiyle (security invoker) çalışır; böylece RLS politikaları (T1.3) geçerlidir.

-- Senkronlanan tablolar, ebeveynden çocuğa doğru (push bu sırayla uygulanır).
create or replace function public.sync_tables()
returns text[]
language sql
immutable
set search_path = ''
as $$
  select array[
    'businesses', 'apiaries', 'hives', 'queens', 'inspections',
    'treatments', 'feedings', 'harvests', 'relocations', 'tasks'
  ]::text[];
$$;

-- Bir tablonun satırlarını "son yazan kazanır" (LWW) kuralıyla uygular.
-- Her satır kendi alt işleminde denenir; biri hata verirse yalnızca o satır reddedilir.
-- Sonuç, satır başına: applied (yazıldı), stale (sunucudaki kayıt aynı ya da daha yeni),
-- rejected (geçersiz; error alanında SQLSTATE ya da 'clock_skew').
create or replace function public.sync_apply_changes(p_table text, p_rows jsonb)
returns table (id uuid, status text, error text)
language plpgsql
security invoker
set search_path = ''
as $$
declare
  v_row jsonb;
  v_id uuid;
  v_updated_at timestamptz;
  v_set text;
  v_applied boolean;
  -- Cihaz saati bundan fazla ilerideyse kayıt reddedilir; yoksa o kayıt LWW'de hep kazanırdı.
  v_max_skew constant interval := interval '10 minutes';
begin
  if p_table is null or not (p_table = any (public.sync_tables())) then
    raise exception 'Bilinmeyen senkron tablosu: %', p_table using errcode = '22023';
  end if;
  if jsonb_typeof(p_rows) is distinct from 'array' then
    raise exception 'p_rows bir JSON dizisi olmalı' using errcode = '22023';
  end if;

  -- Güncellemede değişmeyen alanlar: kimlik, sahiplik ve oluşturulma zamanı.
  select string_agg(format('%1$I = excluded.%1$I', c.column_name), ', ' order by c.ordinal_position)
    into v_set
    from information_schema.columns c
   where c.table_schema = 'public'
     and c.table_name = p_table
     and c.column_name not in ('id', 'business_id', 'owner_id', 'created_at', 'sync_seq');

  for v_row in select value from jsonb_array_elements(p_rows) loop
    v_id := null;
    begin
      v_id := (v_row ->> 'id')::uuid;
      v_updated_at := (v_row ->> 'updated_at')::timestamptz;

      if v_updated_at > now() + v_max_skew then
        id := v_id; status := 'rejected'; error := 'clock_skew';
        return next;
        continue;
      end if;

      v_applied := false;
      execute format(
        'insert into public.%1$I
           select * from jsonb_populate_record(null::public.%1$I, $1)
         on conflict (id) do update set %2$s
           where %1$I.updated_at < excluded.updated_at
         returning true',
        p_table, v_set
      ) using v_row into v_applied;

      id := v_id;
      status := case when coalesce(v_applied, false) then 'applied' else 'stale' end;
      error := null;
      return next;
    exception when others then
      id := v_id; status := 'rejected'; error := sqlstate;
      return next;
    end;
  end loop;
end;
$$;

-- Bir imleçten (sync_seq) sonraki değişiklikleri, sırayla ve en fazla p_limit kadar döndürür.
-- Satırlar JSON olarak, sync_seq alanı çıkarılmış hâlde gelir; silinmiş kayıtlar da dahildir.
create or replace function public.sync_changes_since(p_cursor bigint, p_limit integer)
returns table (table_name text, seq bigint, row_data jsonb)
language plpgsql
stable
security invoker
set search_path = ''
as $$
declare
  v_table text;
  v_parts text[] := '{}';
begin
  if p_cursor is null or p_cursor < 0 then
    raise exception 'Geçersiz imleç: %', p_cursor using errcode = '22023';
  end if;
  if p_limit is null or p_limit < 1 or p_limit > 1000 then
    raise exception 'Geçersiz limit: %', p_limit using errcode = '22023';
  end if;

  -- Her tablodan en fazla p_limit satır alınır, sonra birleşik liste sıralanıp kesilir.
  foreach v_table in array public.sync_tables() loop
    v_parts := v_parts || format(
      '(select %1$L::text, t.sync_seq, to_jsonb(t) - ''sync_seq''
          from public.%1$I t
         where t.sync_seq > $1
         order by t.sync_seq
         limit $2)',
      v_table
    );
  end loop;

  return query execute
    'select * from (' || array_to_string(v_parts, ' union all ') || ') u order by 2 limit $2'
    using p_cursor, p_limit;
end;
$$;

revoke execute on function public.sync_tables() from public, anon;
revoke execute on function public.sync_apply_changes(text, jsonb) from public, anon;
revoke execute on function public.sync_changes_since(bigint, integer) from public, anon;
grant execute on function public.sync_tables() to authenticated, service_role;
grant execute on function public.sync_apply_changes(text, jsonb) to authenticated, service_role;
grant execute on function public.sync_changes_since(bigint, integer) to authenticated, service_role;
