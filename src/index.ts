import { env } from '@/utils/env.util';
import { logger } from '@/utils/logger.util';
import { mongodbService } from '@/services/mongodb.service';
import { scanQueueService } from '@/services/scan-queue.service';
import { app } from '@/router';
import type { Server } from 'http';

let server: Server | null = null;

const startServer = async (): Promise<void> => {
  try {
    await mongodbService.connect();

    server = app.listen(env.PORT, () => {
      logger.info(`API started on http://localhost:${env.PORT}`);
    });
  } catch (error) {
    logger.fatal({ error }, 'Failed to start server');
    await cleanup();
    process.exit(1);
  }
};

const cleanup = async (): Promise<void> => {
  // Close HTTP server
  if (server) {
    await new Promise((resolve) => server!.close(resolve));
  }

  // Close queue connection
  await scanQueueService.close();

  // Close database
  await mongodbService.disconnect();
};

const shutdown = async (signal: string): Promise<void> => {
  logger.info({ signal }, 'Received shutdown signal');

  try {
    await cleanup();
    logger.info('Shutdown complete');
    process.exit(0);
  } catch (error) {
    logger.error({ error }, 'Error during shutdown');
    process.exit(1);
  }
};

// Register shutdown handlers
process.on('SIGTERM', () => {
  void shutdown('SIGTERM');
});
process.on('SIGINT', () => {
  void shutdown('SIGINT');
});

// Handle uncaught errors
process.on('uncaughtException', (error) => {
  logger.fatal({ error }, 'Uncaught exception');
  void cleanup().finally(() => process.exit(1));
});

process.on('unhandledRejection', (reason) => {
  logger.fatal({ reason }, 'Unhandled rejection');
  void cleanup().finally(() => process.exit(1));
});

void startServer();
