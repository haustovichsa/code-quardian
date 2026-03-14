import { Queue, Job } from 'bullmq';
import { injectable } from 'inversify';
import { logger } from '@/utils/logger.util';
import { env } from '@/utils/env.util';
import type { ScanJobPayload } from '@/types/scan-job';

export const ScanQueueServiceToken = Symbol.for('ScanQueueService');

@injectable()
export class ScanQueueService {
  private queue: Queue<ScanJobPayload>;
  private readonly queueName: string = 'scans';
  private readonly jobName: string = 'scan-repository';

  constructor() {
    this.queue = new Queue<ScanJobPayload>(this.queueName, {
      connection: {
        url: env.REDIS_URL,
      },
    });

    this.queue.on('error', (error: Error) => {
      logger.error({ error }, 'Queue connection error');
    });

    logger.info('Queue initialized');
  }

  async addScanJobToQueue({
    scanId,
    repositoryUrl,
  }: {
    scanId: string;
    repositoryUrl: string;
  }): Promise<Job<ScanJobPayload>> {
    try {
      const job = await this.queue.add(
        this.jobName,
        {
          scanId,
          repositoryUrl,
        },
        {
          attempts: 1,
          removeOnComplete: {
            age: 86400, // Keep completed jobs for 24 hours
            count: 1000,
          },
          removeOnFail: {
            age: 604800, // Keep failed jobs for 7 days
          },
        }
      );

      logger.info({ scanId, jobId: job.id }, 'Scan job added to queue');
      return job;
    } catch (error) {
      logger.error({ error, scanId }, 'Failed to add job to queue');
      throw new Error('Failed to enqueue scan job. Redis may be unavailable.');
    }
  }

  async close(): Promise<void> {
    await this.queue.close();
    logger.info('Scan queue closed');
  }
}
