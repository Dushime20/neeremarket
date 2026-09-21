import { createApp } from './app';
import { env } from './config/env';
import { logger } from './shared/logger';
import { prisma } from './shared/prisma';
import { registerNotificationListeners } from './services/notification.service';

async function main() {
  registerNotificationListeners();
  const app = createApp();

  const server = app.listen(env.PORT, () => {
    logger.info(`NeereMarket API listening on port ${env.PORT} (${env.NODE_ENV})`);
  });

  const shutdown = async (signal: string) => {
    logger.info({ signal }, 'Shutting down');
    server.close(async () => {
      await prisma.$disconnect();
      process.exit(0);
    });
  };

  process.on('SIGINT', () => void shutdown('SIGINT'));
  process.on('SIGTERM', () => void shutdown('SIGTERM'));
}

main().catch((err) => {
  logger.error({ err }, 'Failed to start server');
  process.exit(1);
});
