import { Request, Response, Router } from 'express';
import { Container } from 'inversify';
import { ScanStore, ScanStoreToken } from '@/stores/scan.store';
import {
  ScanQueueService,
  ScanQueueServiceToken,
} from '@/services/scan-queue.service';
import { logger } from '@/utils/logger.util';
import { ScanStatus } from '@/types/scan-status';
import { z } from 'zod';

const createScanSchema = z.object({
  repositoryUrl: z.url().refine(
    (url) => {
      try {
        const parsed = new URL(url);
        return (
          parsed.protocol === 'https:' &&
          parsed.hostname === 'github.com' &&
          parsed.pathname.match(
            /^\/[a-zA-Z0-9_-]+\/[a-zA-Z0-9_-]+(\.git)?\/?$/
          ) !== null
        );
      } catch {
        return false;
      }
    },
    {
      message:
        'Must be a valid GitHub repository URL (https://github.com/owner/repo)',
    }
  ),
});

export const createScanRoutes = (container: Container): Router => {
  const router = Router();

  // Resolve services from container
  const scanStore = container.get<ScanStore>(ScanStoreToken);
  const scanQueueService = container.get<ScanQueueService>(
    ScanQueueServiceToken
  );

  const createScan = async (req: Request, res: Response): Promise<void> => {
    try {
      const validation = createScanSchema.safeParse(req.body);

      if (!validation.success) {
        res.status(400).json({
          error: 'Invalid request',
          details: validation.error.issues,
        });
        return;
      }

      const { repositoryUrl } = validation.data;

      const scan = await scanStore.createScan(repositoryUrl);

      await scanQueueService.addScanJobToQueue({
        scanId: scan._id.toString(),
        repositoryUrl,
      });

      logger.info({ scan }, 'Scan created via API');

      res.status(200).json({
        scanId: scan._id.toString(),
        status: scan.status,
      });
    } catch (error) {
      logger.error({ error }, 'Error creating scan');
      res.status(500).json({
        error: 'Internal server error',
        message: error instanceof Error ? error.message : 'Unknown error',
      });
    }
  };

  const getScanRoute = async (req: Request, res: Response): Promise<void> => {
    try {
      const scanId = req.params.scanId as string;

      const scan = await scanStore.getScanById(scanId);

      if (!scan) {
        res.status(404).json({
          error: 'Scan not found',
        });
        return;
      }

      res.status(200).json({
        status: scan.status,
        ...(scan.status === ScanStatus.Finished && {
          vulnerabilities: scan.vulnerabilities,
        }),
      });
    } catch (error) {
      logger.error({ error }, 'Error getting scan status');
      res.status(500).json({
        error: 'Internal server error',
        message: error instanceof Error ? error.message : 'Unknown error',
      });
    }
  };

  /**
   * Trigger a new security scan.
   */
  router.post('/scan', createScan);

  /**
   * Get scan status with critical vulnerabilities.
   */
  router.get('/scan/:scanId', getScanRoute);

  return router;
};
