import { createTestDatabase } from '../../../test-utils/test-database';

import { outbox, queens, SYNC_TABLE_NAMES, syncState } from './index';

// Sunucudaki `supabase/migrations/*_create_*.sql` tablolarının sütunları (`sync_seq` yerelde yok).
const BASE = ['id', 'business_id', 'created_at', 'updated_at', 'deleted_at'];
const EXPECTED_COLUMNS: Record<string, string[]> = {
  businesses: ['id', 'owner_id', 'name', 'created_at', 'updated_at', 'deleted_at'],
  apiaries: [
    ...BASE,
    'name',
    'climate_profile_code',
    'latitude',
    'longitude',
    'location_source',
    'notes',
  ],
  hives: [...BASE, 'apiary_id', 'number', 'name', 'status', 'notes'],
  queens: [
    ...BASE,
    'hive_id',
    'birth_year',
    'is_marked',
    'origin',
    'introduced_on',
    'ended_on',
    'end_reason',
    'notes',
  ],
  inspections: [
    ...BASE,
    'hive_id',
    'session_id',
    'inspected_at',
    'bee_frames',
    'brood_frames',
    'honey_frames',
    'queen_status',
    'varroa_method',
    'varroa_mite_count',
    'varroa_sample_size',
    'temperament',
    'notes',
  ],
  treatments: [
    ...BASE,
    'hive_id',
    'product_code',
    'started_on',
    'ended_on',
    'dose',
    'withdrawal_days',
    'notes',
  ],
  feedings: [...BASE, 'hive_id', 'fed_on', 'feed_type', 'amount', 'unit', 'notes'],
  harvests: [
    ...BASE,
    'hive_id',
    'harvested_on',
    'frame_count',
    'weight_kg',
    'withdrawal_warning_acknowledged',
    'notes',
  ],
  relocations: [...BASE, 'hive_id', 'from_apiary_id', 'to_apiary_id', 'moved_at', 'notes'],
  tasks: [
    ...BASE,
    'apiary_id',
    'hive_id',
    'source',
    'rule_id',
    'dedup_key',
    'title',
    'due_on',
    'status',
    'completed_at',
    'snoozed_until',
    'notes',
  ],
};

const IDS = {
  business: '0b6f2d3e-6f0a-4c1e-9d2b-1a2b3c4d5e02',
  hive: '0b6f2d3e-6f0a-4c1e-9d2b-1a2b3c4d5e05',
  queen: '0b6f2d3e-6f0a-4c1e-9d2b-1a2b3c4d5e06',
};

describe('yerel veritabanı şeması', () => {
  it('migration sonrası yalnızca beklenen tabloları içerir', () => {
    const { $client } = createTestDatabase();
    const rows = $client
      .prepare(
        "select name from sqlite_master where type = 'table' and name not like 'sqlite_%' and name not like '\\_\\_drizzle%' escape '\\'",
      )
      .all() as { name: string }[];

    expect(rows.map((r) => r.name).sort()).toEqual(
      [...SYNC_TABLE_NAMES, 'outbox', 'sync_state'].sort(),
    );
  });

  it.each(Object.entries(EXPECTED_COLUMNS))('%s sütunları sunucudakiyle aynıdır', (table, cols) => {
    const { $client } = createTestDatabase();
    const info = $client.prepare(`pragma table_info(${table})`).all() as { name: string }[];

    expect(info.map((c) => c.name).sort()).toEqual([...cols].sort());
  });

  it('boolean alanları 0/1 olarak saklar, okurken true/false döndürür', () => {
    const db = createTestDatabase();
    db.insert(queens)
      .values({
        id: IDS.queen,
        businessId: IDS.business,
        hiveId: IDS.hive,
        birthYear: null,
        isMarked: true,
        origin: 'purchased',
        introducedOn: '2026-05-01',
        endedOn: null,
        endReason: null,
        notes: null,
        createdAt: '2026-10-01T08:00:00Z',
        updatedAt: '2026-10-02T08:00:00Z',
        deletedAt: null,
      })
      .run();

    const stored = db.$client.prepare('select is_marked from queens').get() as {
      is_marked: number;
    };
    expect(stored.is_marked).toBe(1);
    expect(db.select().from(queens).all()[0]?.isMarked).toBe(true);
  });

  it('outbox kayıtları sıra numarasıyla eklenir, deneme sayısı 0 başlar', () => {
    const db = createTestDatabase();
    const row = { tableName: 'hives', rowId: IDS.hive, payload: '{}', enqueuedAt: 'x' } as const;
    db.insert(outbox).values(row).run();
    db.insert(outbox).values(row).run();

    const rows = db.select().from(outbox).all();
    expect(rows.map((r) => r.id)).toEqual([1, 2]);
    expect(rows.map((r) => r.attemptCount)).toEqual([0, 0]);
  });

  it('sync_state tek satırdır: varsayılan imleç 0, ikinci satır reddedilir', () => {
    const db = createTestDatabase();
    db.insert(syncState).values({}).run();

    expect(db.select().from(syncState).all()).toEqual([{ id: 1, cursor: 0, lastSyncedAt: null }]);
    expect(() => db.insert(syncState).values({ id: 2 }).run()).toThrow();
  });
});
