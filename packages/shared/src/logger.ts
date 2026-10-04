export interface StructuredLog {
  timestamp: string;
  level: 'info' | 'warn' | 'error' | 'debug';
  message: string;
  context?: string;
  assessmentId?: string;
  candidateId?: string;
  assessorId?: string;
  eventId?: string;
  data?: Record<string, any>;
}

const REDACT_KEYS = ['password', 'token', 'secret', 'jwt', 'authorization', 'apiKey', 'credential'];

export function redactSensitiveData(obj: any): any {
  if (obj === null || obj === undefined) return obj;
  if (typeof obj !== 'object') return obj;
  if (Array.isArray(obj)) return obj.map(redactSensitiveData);

  const cleaned: Record<string, any> = {};
  for (const [key, value] of Object.entries(obj)) {
    const isSensitive = REDACT_KEYS.some(k => key.toLowerCase().includes(k.toLowerCase()));
    if (isSensitive) {
      cleaned[key] = '[REDACTED]';
    } else if (typeof value === 'object') {
      cleaned[key] = redactSensitiveData(value);
    } else {
      cleaned[key] = value;
    }
  }
  return cleaned;
}

export const logger = {
  info(message: string, meta?: Partial<StructuredLog>) {
    const log: StructuredLog = {
      timestamp: new Date().toISOString(),
      level: 'info',
      message,
      ...meta,
      data: meta?.data ? redactSensitiveData(meta.data) : undefined
    };
    console.log(JSON.stringify(log));
  },
  warn(message: string, meta?: Partial<StructuredLog>) {
    const log: StructuredLog = {
      timestamp: new Date().toISOString(),
      level: 'warn',
      message,
      ...meta,
      data: meta?.data ? redactSensitiveData(meta.data) : undefined
    };
    console.warn(JSON.stringify(log));
  },
  error(message: string, error?: any, meta?: Partial<StructuredLog>) {
    const log: StructuredLog = {
      timestamp: new Date().toISOString(),
      level: 'error',
      message,
      ...meta,
      data: {
        error: error?.message || error,
        stack: process.env.NODE_ENV === 'production' ? undefined : error?.stack,
        ...redactSensitiveData(meta?.data || {})
      }
    };
    console.error(JSON.stringify(log));
  }
};
