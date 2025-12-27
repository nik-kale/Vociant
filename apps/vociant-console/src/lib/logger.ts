import pino from 'pino';

export const logger = pino({
  level: process.env.LOG_LEVEL || 'info',
  formatters: {
    level: (label) => ({ level: label }),
  },
  redact: {
    paths: ['apiKey', 'token', 'password', 'secret', 'authorization', 'cookie'],
    remove: true,
  },
  transport: process.env.NODE_ENV === 'development' ? {
    target: 'pino-pretty',
    options: {
      colorize: true,
    },
  } : undefined,
});

export function createRequestLogger(requestId: string, extraContext: Record<string, any> = {}) {
  return logger.child({ requestId, ...extraContext });
}

