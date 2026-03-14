import { Worker, Job } from 'bullmq';
import { injectable, inject } from 'inversify';
import { logger } from '@/utils/logger.util';
import { ScanStatus } from '@/types/scan-status';
import type { ScanJobPayload } from '@/types/scan-job';
import { env } from '@/utils/env.util';
import { ScanStore, ScanStoreToken } from '@/stores/scan.store';
import { ScannerService, ScannerServiceToken } from './scanner.service';

export const ScanWorkerServiceToken = Symbol.for('ScanWorkerService');

@injectable()
export class ScanWorkerService {
  private worker: Worker<ScanJobPayload>;
  private readonly queueName: string = 'scans';

  constructor(
    @inject(ScanStoreToken) private scanStore: ScanStore,
    @inject(ScannerServiceToken) private scannerService: ScannerService
  ) {
    this.worker = new Worker<ScanJobPayload>(
      this.queueName,
      async (job: Job<ScanJobPayload>) => {
        await this.processScanJob(job);
      },
      {
        connection: {
          url: env.REDIS_URL,
        },
        concurrency: 3, // Process up to 3 scans concurrently per worker
      }
    );

    this.worker.on('completed', (job: Job) => {
      logger.info({ job }, 'Scan job completed successfully');
    });

    this.worker.on('failed', (job: Job | undefined, error: Error) => {
      logger.error({ job, error }, 'Scan job failed');
    });

    logger.info('Scan worker initialized and ready');
  }

  private async processScanJob(job: Job<ScanJobPayload>): Promise<void> {
    const { scanId, repositoryUrl } = job.data;

    logger.info({ scanId, repositoryUrl }, 'Processing scan job');

    try {
      // Update status to Scanning
      await this.scanStore.updateScanStatus(scanId, ScanStatus.Scanning, {
        startedAt: new Date(),
      });

      logger.info({ scanId }, 'Updated scan status to Scanning');

      // Run scanner (clone, Trivy, stream parse)
      const vulnerabilities = await this.scannerService.scanRepository(
        scanId,
        repositoryUrl
      );

      // Update status to Finished with vulnerabilities
      await this.scanStore.updateScanStatus(scanId, ScanStatus.Finished, {
        finishedAt: new Date(),
        vulnerabilities,
      });

      logger.info(
        { scanId, vulnerabilitiesCount: vulnerabilities.length },
        'Scan completed successfully'
      );
    } catch (error) {
      logger.error({ scanId, error }, 'Scan failed');

      // Update status to Failed with error message
      await this.scanStore.updateScanStatus(scanId, ScanStatus.Failed, {
        finishedAt: new Date(),
        error: error instanceof Error ? error.message : 'Unknown error',
      });

      // throw an error to let BullMQ handle retry logic
      throw error;
    }
  }

  async close(): Promise<void> {
    await this.worker.close();
    logger.info('Scan worker closed');
  }
}
