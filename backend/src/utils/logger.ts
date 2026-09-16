// ============================================
// Ale Motos — Logger estructurado (JSON)
// ============================================

type LogLevel = 'debug' | 'info' | 'warn' | 'error';

interface LogEntry {
  timestamp: string;
  level: LogLevel;
  message: string;
  correlationId?: string;
  module?: string;
  [key: string]: unknown;
}

class Logger {
  private createEntry(level: LogLevel, message: string, meta?: Record<string, unknown>): LogEntry {
    return {
      timestamp: new Date().toISOString(),
      level,
      message,
      ...meta,
    };
  }

  debug(message: string, meta?: Record<string, unknown>): void {
    if (process.env.NODE_ENV === 'production') return;
    const entry = this.createEntry('debug', message, meta);
    console.debug(JSON.stringify(entry));
  }

  info(message: string, meta?: Record<string, unknown>): void {
    const entry = this.createEntry('info', message, meta);
    console.info(JSON.stringify(entry));
  }

  warn(message: string, meta?: Record<string, unknown>): void {
    const entry = this.createEntry('warn', message, meta);
    console.warn(JSON.stringify(entry));
  }

  error(message: string, meta?: Record<string, unknown>): void {
    const entry = this.createEntry('error', message, meta);
    console.error(JSON.stringify(entry));
  }

  // Logger con contexto (para operaciones de sincronización)
  withCorrelation(correlationId: string, module?: string) {
    return {
      debug: (msg: string, meta?: Record<string, unknown>) =>
        this.debug(msg, { correlationId, module, ...meta }),
      info: (msg: string, meta?: Record<string, unknown>) =>
        this.info(msg, { correlationId, module, ...meta }),
      warn: (msg: string, meta?: Record<string, unknown>) =>
        this.warn(msg, { correlationId, module, ...meta }),
      error: (msg: string, meta?: Record<string, unknown>) =>
        this.error(msg, { correlationId, module, ...meta }),
    };
  }
}

export const logger = new Logger();
