import pino from 'pino';
import { env, isProd } from '../config/env';

export const logger = pino({
  level: isProd ? 'info' : 'debug',
  transport: isProd
    ? undefined
    : {
        target: 'pino-pretty',
        options: { colorize: true, translateTime: 'SYS:standard' },
      },
  redact: {
    paths: [
      'password',
      'passwordHash',
      'req.headers.authorization',
      'req.headers.cookie',
      'token',
      'refreshToken',
      'accessToken',
    ],
    remove: true,
  },
  base: { service: env.APP_NAME },
});
