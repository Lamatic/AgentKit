type LogLevel = "info" | "warn" | "error";

interface LogPayload {
  message: string;
  correlationId?: string;
  context?: Record<string, unknown>;
  error?: unknown;
}

class Logger {
  private formatLog(level: LogLevel, payload: LogPayload) {
    const timestamp = new Date().toISOString();
    const correlationId = payload.correlationId || `req_${Math.random().toString(36).substring(2, 9)}`;

    let formattedError: string | undefined;
    if (payload.error) {
      formattedError = payload.error instanceof Error ? payload.error.message : String(payload.error);
    }

    const logEntry = {
      timestamp,
      level,
      correlationId,
      message: payload.message,
      ...(payload.context ? { context: payload.context } : {}),
      ...(formattedError ? { error: formattedError } : {}),
    };

    return JSON.stringify(logEntry);
  }

  info(message: string, context?: Record<string, unknown>, correlationId?: string) {
    console.log(this.formatLog("info", { message, context, correlationId }));
  }

  warn(message: string, context?: Record<string, unknown>, correlationId?: string) {
    console.warn(this.formatLog("warn", { message, context, correlationId }));
  }

  error(message: string, error?: unknown, context?: Record<string, unknown>, correlationId?: string) {
    console.error(this.formatLog("error", { message, error, context, correlationId }));
  }
}

export const logger = new Logger();
