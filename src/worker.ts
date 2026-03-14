import 'reflect-metadata';
import { createWorkerContainer } from '@/di/worker.container';
import {
  MongodbService,
  MongodbServiceToken,
} from '@/services/mongodb.service';
import {
  ScanWorkerService,
  ScanWorkerServiceToken,
} from '@/services/scan-worker.service';
import { logger } from '@/utils/logger.util';
import type { Container } from 'inversify';

let container: Container | null = null;

const startWorker = async (): Promise<void> => {
  try {
    logger.info('Starting Code Guardian Worker...');

    // Create DI container
    container = createWorkerContainer();

    // Resolve services
    const mongodbService = container.get<MongodbService>(MongodbServiceToken);

    // Connect to MongoDB
    await mongodbService.connect();

    // Resolve worker service (auto-starts in constructor)
    container.get<ScanWorkerService>(ScanWorkerServiceToken);

    logger.info('Code Guardian Worker started successfully');
  } catch (error) {
    logger.fatal({ error }, 'Failed to start worker');
    await cleanup();
    process.exit(1);
  }
};

const cleanup = async (): Promise<void> => {
  if (container) {
    const scanWorkerService = container.get<ScanWorkerService>(
      ScanWorkerServiceToken
    );
    const mongodbService = container.get<MongodbService>(MongodbServiceToken);

    await scanWorkerService.close();
    await mongodbService.disconnect();
  }
};

// Graceful shutdown
const shutdown = async (signal: string): Promise<void> => {
  logger.info({ signal }, 'Received shutdown signal');

  try {
    await cleanup();
    logger.info('Worker shutdown complete');
    process.exit(0);
  } catch (error) {
    logger.error({ error }, 'Error during shutdown');
    process.exit(1);
  }
};

process.on('SIGTERM', () => {
  void shutdown('SIGTERM');
});
process.on('SIGINT', () => {
  void shutdown('SIGINT');
});

void startWorker();
