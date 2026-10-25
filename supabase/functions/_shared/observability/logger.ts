type Level = 'debug' | 'info' | 'warn' | 'error';
type Fields = Record<string, unknown>;

export interface Logger {
  debug(msg: string, fields?: Fields): void;
  info(msg: string, fields?: Fields): void;
  warn(msg: string, fields?: Fields): void;
  error(msg: string, fields?: Fields): void;
  child(fields: Fields): Logger;
}

/**
 * Yapılandırılmış JSON log. Her satır `function` (ve varsa `route`) alanı taşır;
 * Supabase log ekranında bunlara göre filtrelenir.
 */
export function createLogger(context: { function: string; route?: string } & Fields): Logger {
  const write = (level: Level, msg: string, fields?: Fields) => {
    const line = JSON.stringify({
      level,
      time: new Date().toISOString(),
      ...context,
      msg,
      ...fields,
    });
    if (level === 'error') console.error(line);
    else if (level === 'warn') console.warn(line);
    else console.log(line);
  };
  return {
    debug: (msg, fields) => write('debug', msg, fields),
    info: (msg, fields) => write('info', msg, fields),
    warn: (msg, fields) => write('warn', msg, fields),
    error: (msg, fields) => write('error', msg, fields),
    child: (fields) => createLogger({ ...context, ...fields }),
  };
}
