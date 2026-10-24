import { createFixedClock, systemClock, type Clock } from './clock';

describe('systemClock', () => {
  it('gerçek zamanı döner', () => {
    const before = Date.now();
    const now = systemClock.now().getTime();
    expect(now).toBeGreaterThanOrEqual(before);
    expect(now).toBeLessThanOrEqual(Date.now());
  });
});

describe('createFixedClock', () => {
  it('verilen anı döner ve zaman kendiliğinden ilerlemez', () => {
    const clock = createFixedClock('2026-05-01T08:00:00Z');
    expect(clock.now().toISOString()).toBe('2026-05-01T08:00:00.000Z');
    expect(clock.now().toISOString()).toBe('2026-05-01T08:00:00.000Z');
  });

  it('advance ve set ile zaman değiştirilebilir', () => {
    const clock = createFixedClock(new Date('2026-05-01T00:00:00Z'));
    clock.advance(24 * 60 * 60 * 1000);
    expect(clock.now().toISOString()).toBe('2026-05-02T00:00:00.000Z');
    clock.set('2027-01-01T00:00:00Z');
    expect(clock.now().getUTCFullYear()).toBe(2027);
  });

  it('dönen Date kopyasını değiştirmek saati etkilemez', () => {
    const clock = createFixedClock('2026-05-01T00:00:00Z');
    clock.now().setUTCFullYear(1999);
    expect(clock.now().getUTCFullYear()).toBe(2026);
  });

  it('geçersiz tarihte hata verir', () => {
    expect(() => createFixedClock('tarih-degil')).toThrow('Geçersiz tarih');
  });
});

// Örnek: bağımlılıkları enjekte edilen bir servis saf Node ortamında, mock'larla test edilir.
// Gerçek servisler src/features/*/services ve src/services altında bu kalıbı izler.
describe('örnek servis testi (bağımlılık enjeksiyonu)', () => {
  type Inspection = { hiveId: string; inspectedAt: Date };
  interface InspectionRepository {
    save(inspection: Inspection): Promise<void>;
  }

  function createInspectionService(deps: { repository: InspectionRepository; clock: Clock }) {
    return {
      async record(hiveId: string): Promise<Inspection> {
        const inspection = { hiveId, inspectedAt: deps.clock.now() };
        await deps.repository.save(inspection);
        return inspection;
      },
    };
  }

  it('kaydı enjekte edilen saatle oluşturur ve repository üzerinden saklar', async () => {
    const repository: InspectionRepository = { save: jest.fn().mockResolvedValue(undefined) };
    const clock = createFixedClock('2026-05-01T09:30:00Z');
    const service = createInspectionService({ repository, clock });

    const result = await service.record('kovan-12');

    expect(result.inspectedAt.toISOString()).toBe('2026-05-01T09:30:00.000Z');
    expect(repository.save).toHaveBeenCalledWith(result);
  });
});
