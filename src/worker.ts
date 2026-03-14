import { env } from '@/utils/env.util';
import { logger } from '@/utils/logger.util';
import { mongodbService } from '@/services/mongodb.service';
import { ScanWorkerService } from '@/services/scan-worker.service';

let scanWorkerService: ScanWorkerService | null = null;

const startWorker = async (): Promise<void> => {
  try {
    logger.info('Starting Code Guardian Worker...');

    // Connect to MongoDB
    await mongodbService.connect();

    // Initialize worker service
    scanWorkerService = new ScanWorkerService(env.REDIS_URL);

    logger.info('Code Guardian Worker started successfully');
  } catch (error) {
    logger.fatal({ error }, 'Failed to start worker');
    if (scanWorkerService) {
      await scanWorkerService.close();
    }
    await mongodbService.disconnect();
    process.exit(1);
  }
};

// Graceful shutdown
const shutdown = async (signal: string): Promise<void> => {
  logger.info({ signal }, 'Received shutdown signal');

  try {
    if (scanWorkerService) {
      await scanWorkerService.close();
    }
    await mongodbService.disconnect();
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
