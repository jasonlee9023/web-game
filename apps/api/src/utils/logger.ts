import { env, type LogLevel } from '../config/env';

type LogMeta = Record<string, unknown>;

const logRanks: Record<LogLevel, number> = {
  silent: 0,
  error: 1,
  warn: 2,
  info: 3,
  debug: 4,
};

function shouldLog(level: Exclude<LogLevel, 'silent'>) {
  return logRanks[env.logLevel] >= logRanks[level];
}

function normalizeError(error: unknown) {
  if (!(error instanceof Error)) {
    return { message: String(error) };
  }

  return {
    name: error.name,
    message: error.message,
    stack: env.logErrorStacks ? error.stack : undefined,
  };
}

function serializeMeta(meta: LogMeta | undefined) {
  if (!meta) {
    return '';
  }

  try {
    const json = JSON.stringify(meta, (_key, value) => (value instanceof Error ? normalizeError(value) : value));
    if (!json) {
      return '';
    }

    return json.length > env.logMaxMetaChars ? `${json.slice(0, env.logMaxMetaChars)}...` : json;
  } catch {
    return '{"meta":"unserializable"}';
  }
}

function write(level: Exclude<LogLevel, 'silent'>, message: string, meta?: LogMeta) {
  if (!shouldLog(level)) {
    return;
  }

  const payload = serializeMeta(meta);
  const line = payload ? `${message} ${payload}` : message;
  if (level === 'error') {
    console.error(line);
    return;
  }
  if (level === 'warn') {
    console.warn(line);
    return;
  }
  console.log(line);
}

export const logger = {
  error(message: string, meta?: LogMeta) {
    write('error', message, meta);
  },
  warn(message: string, meta?: LogMeta) {
    write('warn', message, meta);
  },
  info(message: string, meta?: LogMeta) {
    write('info', message, meta);
  },
  debug(message: string, meta?: LogMeta) {
    write('debug', message, meta);
  },
};

export function errorToLogMeta(error: unknown) {
  return normalizeError(error);
}
