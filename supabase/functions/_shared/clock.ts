/**
 * Backend zaman soyutlaması (src/lib/clock.ts ile aynı sözleşme).
 * Servisler "şu an" bilgisini parametre olarak aldıkları Clock'tan okur.
 */
export interface Clock {
  now(): Date;
}

export interface FixedClock extends Clock {
  set(date: Date | string): void;
  advance(ms: number): void;
}

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
