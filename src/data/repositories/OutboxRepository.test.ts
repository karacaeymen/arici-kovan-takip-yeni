import { IDS } from '../../test-utils/domain-fixtures';
import { createTestDatabase } from '../../test-utils/test-database';

import { createOutboxRepository, discardChanges, enqueueChange } from './OutboxRepository';

const row = (id: string, updatedAt: string) => ({ id, updatedAt, name: 'Kovan' });

describe('OutboxRepository', () => {
  const setup = () => {
    const db = createTestDatabase();
    return { db, outbox: createOutboxRepository(db) };
  };

  it('değişiklikleri eklenme sırasıyla, satırı çözülmüş olarak döndürür', () => {
    const { db, outbox } = setup();
    enqueueChange(db, 'apiaries', row(IDS.apiary, 'a'), 't1');
    enqueueChange(db, 'hives', row(IDS.hive, 'b'), 't2');

    expect(outbox.peek()).toEqual([
      {
        id: 1,
        table: 'apiaries',
        row: row(IDS.apiary, 'a'),
        enqueuedAt: 't1',
        attemptCount: 0,
        lastError: null,
      },
      {
        id: 2,
        table: 'hives',
        row: row(IDS.hive, 'b'),
        enqueuedAt: 't2',
        attemptCount: 0,
        lastError: null,
      },
    ]);
    expect(outbox.peek(1)).toHaveLength(1);
    expect(outbox.count()).toBe(2);
  });

  it('aynı kaydın yeni değişikliği eskisinin yerine geçer ve kuyruğun sonuna gider', () => {
    const { db, outbox } = setup();
    enqueueChange(db, 'hives', row(IDS.hive, 'v1'), 't1');
    enqueueChange(db, 'apiaries', row(IDS.apiary, 'v1'), 't2');
    enqueueChange(db, 'hives', row(IDS.hive, 'v2'), 't3');

    expect(outbox.peek().map((c) => [c.table, c.row.updatedAt])).toEqual([
      ['apiaries', 'v1'],
      ['hives', 'v2'],
    ]);
  });

  it('gönderilenleri siler, başarısızların deneme sayısını artırıp hatayı yazar', () => {
    const { db, outbox } = setup();
    enqueueChange(db, 'hives', row(IDS.hive, 'a'), 't1');
    enqueueChange(db, 'apiaries', row(IDS.apiary, 'a'), 't2');
    const [first, second] = outbox.peek().map((c) => c.id);

    outbox.markFailed([second!], 'network');
    outbox.markFailed([second!], 'timeout');
    outbox.markSent([first!]);

    expect(outbox.peek()).toEqual([
      expect.objectContaining({ id: second, attemptCount: 2, lastError: 'timeout' }),
    ]);
  });

  it('boş listeyle çağrıldığında bir şey yapmaz', () => {
    const { db, outbox } = setup();
    enqueueChange(db, 'hives', row(IDS.hive, 'a'), 't1');
    outbox.markSent([]);
    outbox.markFailed([], 'x');

    expect(outbox.peek()).toEqual([expect.objectContaining({ attemptCount: 0, lastError: null })]);
  });

  it('bir kaydın bekleyen değişikliğini atar, diğerlerine dokunmaz', async () => {
    const { db, outbox } = setup();
    enqueueChange(db, 'hives', row(IDS.hive, 'a'), 't1');
    enqueueChange(db, 'hives', row(IDS.record, 'a'), 't1');
    discardChanges(db, 'hives', IDS.hive);

    expect((await outbox.watchPending()).map((e) => e.rowId)).toEqual([IDS.record]);
  });
});
