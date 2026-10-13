import { createApp } from './app';
import { env } from './config/env';
import { logger } from './shared/logger';
import { prisma } from './shared/prisma';
import { registerNotificationListeners } from './services/notification.service';
import { fdiConfigured, fdiWebhookUrl } from './providers/payment/fdi.client';

async function main() {
  if (!fdiConfigured()) {
    logger.error('FDI credentials are missing: checkout, seller payouts and refunds will fail');
  } else if (!fdiWebhookUrl()) {
    logger.warn('FDI_CALLBACK_BASE_URL is not public; payments rely on polling and payouts/refunds need "Check status"');
  }
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
