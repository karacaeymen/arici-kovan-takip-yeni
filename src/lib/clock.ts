/**
 * Zaman soyutlaması. "Şu an" bilgisine ihtiyaç duyan kod `new Date()` yerine
 * dışarıdan verilen bir Clock kullanır; böylece testlerde zaman sabitlenebilir.
 */
export interface Clock {
  now(): Date;
}

/** Testlerde kullanılan, elle ileri alınabilen saat. */
export interface FixedClock extends Clock {
  set(date: Date | string): void;
  advance(ms: number): void;
}

/** Uygulamanın gerçek saati. */
export const systemClock: Clock = {
  now: () => new Date(),
};

export function createFixedClock(initial: Date | string): FixedClock {
  let current = toTime(initial);
  return {
    now: () => new Date(current),
    set: (date) => {
      current = toTime(date);
    },
    advance: (ms) => {
      current += ms;
    },
  };
}

function toTime(value: Date | string): number {
  const time = new Date(value).getTime();
  if (Number.isNaN(time)) {
    throw new Error(`Geçersiz tarih: ${String(value)}`);
  }
  return time;
}
