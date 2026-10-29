import { config } from '../config/env';

type Level = 'trace' | 'debug' | 'info' | 'warn' | 'error' | 'fatal';
type LogData = Record<string, unknown>;

const ORDER: Record<Level | 'silent', number> = {
  trace: 10,
  debug: 20,
  info: 30,
  warn: 40,
  error: 50,
  fatal: 60,
  silent: Infinity,
};

function serialize(data: LogData): LogData {
  const out: LogData = {};
  for (const [key, value] of Object.entries(data)) {
    out[key] =
      value instanceof Error
        ? { name: value.name, message: value.message, stack: value.stack }
        : value;
  }
  return out;
}

function emit(level: Level, data: LogData, msg?: string): void {
  const { LOG_LEVEL, APP_ENV } = config();
  if (ORDER[level] < ORDER[LOG_LEVEL]) return;
  const time = new Date().toISOString();
  const fields = serialize(data);
  const line =
    APP_ENV === 'development'
      ? `${time.slice(11, 19)} ${level.toUpperCase().padEnd(5)} ${msg ?? ''} ${
          Object.keys(fields).length > 0 ? JSON.stringify(fields) : ''
        }`.trimEnd()
      : JSON.stringify({ level, time, msg, ...fields });
  if (level === 'error' || level === 'fatal') console.error(line);
  else if (level === 'warn') console.warn(line);
  else console.log(line);
}

/**
 * Logger estruturado sem dependências (uma linha por evento, visível no Workers Logs),
 * com a forma de chamada `logger.info({ campo }, 'mensagem')`.
 */
export const logger = {
  trace: (data: LogData, msg?: string) => emit('trace', data, msg),
  debug: (data: LogData, msg?: string) => emit('debug', data, msg),
  info: (data: LogData, msg?: string) => emit('info', data, msg),
  warn: (data: LogData, msg?: string) => emit('warn', data, msg),
  error: (data: LogData, msg?: string) => emit('error', data, msg),
  fatal: (data: LogData, msg?: string) => emit('fatal', data, msg),
};
