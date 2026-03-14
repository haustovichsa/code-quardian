import 'reflect-metadata';
import { createApiContainer } from '@/di/api.container';
import {
  MongodbService,
  MongodbServiceToken,
} from '@/services/mongodb.service';
import {
  ScanQueueService,
  ScanQueueServiceToken,
} from '@/services/scan-queue.service';
import { env } from '@/utils/env.util';
import { logger } from '@/utils/logger.util';
import { createApp } from '@/router';
import type { Server } from 'http';
import type { Container } from 'inversify';

let server: Server | null = null;
let container: Container | null = null;

const startServer = async (): Promise<void> => {
  try {
    // Create DI container
    container = createApiContainer();

    // Resolve services
    const mongodbService = container.get<MongodbService>(MongodbServiceToken);

    // Connect to MongoDB
    await mongodbService.connect();

    // Create Express app with container
    const app = createApp(container);

    // Start HTTP server
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

  if (container) {
    // Resolve services for cleanup
    const scanQueueService = container.get<ScanQueueService>(
      ScanQueueServiceToken
    );
    const mongodbService = container.get<MongodbService>(MongodbServiceToken);

    // Close connections
    await scanQueueService.close();
    await mongodbService.disconnect();
  }
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
