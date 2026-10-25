import { type Clock, systemClock } from '../clock.ts';

type Level = 'debug' | 'info' | 'warn' | 'error';
type Fields = Record<string, unknown>;

export interface LogContext extends Fields {
  /** Edge Function adı, ör. `health`. */
  function: string;
  /** `METOT /yol`, ör. `GET /health`. */
  route?: string;
}

export interface Logger {
  debug(msg: string, fields?: Fields): void;
  info(msg: string, fields?: Fields): void;
  warn(msg: string, fields?: Fields): void;
  error(msg: string, fields?: Fields): void;
  child(fields: Fields): Logger;
}

/** Bir log satırının yazıldığı yer; varsayılan konsol, testlerde dizi. */
export type LogSink = (level: Level, line: string) => void;

export interface LoggerOptions {
  clock?: Clock;
  sink?: LogSink;
}

const consoleSink: LogSink = (level, line) => {
  if (level === 'error') console.error(line);
  else if (level === 'warn') console.warn(line);
  else console.log(line);
};

/** Error nesneleri JSON'a boş `{}` olarak düşer; adı, mesajı ve yığını açıkça yazılır. */
function serialize(fields: Fields | undefined): Fields | undefined {
  if (!fields) return fields;
  const out: Fields = {};
  for (const [key, value] of Object.entries(fields)) {
    out[key] =
      value instanceof Error
        ? { name: value.name, message: value.message, stack: value.stack }
        : value;
  }
  return out;
}

/**
 * Yapılandırılmış JSON log (TODO.md T0.7). Her satır `level`, `time`, `function` ve varsa `route`
 * alanı taşır; Supabase log ekranında bunlara göre filtrelenir.
 */
export function createLogger(context: LogContext, options: LoggerOptions = {}): Logger {
  const { clock = systemClock, sink = consoleSink } = options;
  const write = (level: Level, msg: string, fields?: Fields) => {
    const line = JSON.stringify({
      level,
      time: clock.now().toISOString(),
      ...context,
      msg,
      ...serialize(fields),
    });
    sink(level, line);
  };
  return {
    debug: (msg, fields) => write('debug', msg, fields),
    info: (msg, fields) => write('info', msg, fields),
    warn: (msg, fields) => write('warn', msg, fields),
    error: (msg, fields) => write('error', msg, fields),
    child: (fields) => createLogger({ ...context, ...fields }, options),
  };
}
