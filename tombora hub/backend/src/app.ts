import express from 'express';
import compression from 'compression';
import cookieParser from 'cookie-parser';
import cors from 'cors';
import helmet from 'helmet';
import rateLimit from 'express-rate-limit';
import pinoHttp from 'pino-http';
import swaggerUi from 'swagger-ui-express';
import { env } from './config/env';
import { logger } from './shared/logger';
import { errorHandler, notFoundHandler } from './shared/http';
import { requestIdMiddleware } from './shared/middleware';
import { registerRoutes } from './routes';
import { openApiDocument } from './docs/openapi';
import { uploadsDir } from './services/upload.service';

// Prisma money fields are BigInt — Express JSON cannot serialize them by default
(BigInt.prototype as unknown as { toJSON: () => string }).toJSON = function toJSON() {
  return this.toString();
};

export function createApp() {
  const app = express();

  app.set('trust proxy', 1);
  app.use(requestIdMiddleware);
  app.use(
    pinoHttp({
      logger,
      customProps: (req) => ({ requestId: req.requestId }),
      autoLogging: { ignore: (req) => req.url === `${env.API_PREFIX}/health` },
    }),
  );
  app.use(
    helmet({
      crossOriginResourcePolicy: { policy: 'cross-origin' },
    }),
  );
  app.use(
    cors({
      origin: env.CORS_ORIGIN.split(',').map((s) => s.trim()),
      credentials: true,
    }),
  );
  app.use(compression());
  app.use(express.json({ limit: '1mb' }));
  app.use(express.urlencoded({ extended: true }));
  app.use(cookieParser());
  app.use(
    rateLimit({
      windowMs: env.RATE_LIMIT_WINDOW_MS,
      max: env.RATE_LIMIT_MAX,
      standardHeaders: true,
      legacyHeaders: false,
    }),
  );

  app.use('/api/docs', swaggerUi.serve, swaggerUi.setup(openApiDocument));
  app.use(
    '/uploads',
    express.static(uploadsDir(), {
      setHeaders(res) {
        res.setHeader('Cross-Origin-Resource-Policy', 'cross-origin');
      },
    }),
  );
  registerRoutes(app);

  app.use(notFoundHandler);
  app.use(errorHandler);

  return app;
}
