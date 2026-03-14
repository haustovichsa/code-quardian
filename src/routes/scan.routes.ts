import { Request, Response, Router } from 'express';
import { scanStore } from '@/stores/scan.store';
import { logger } from '@/utils/logger.util';
import { ScanStatus } from '@/types/scan-status';
import { z } from 'zod';
import { scanQueueService } from '@/services/scan-queue.service';
const router = Router();

const createScanSchema = z.object({
  repositoryUrl: z
    .url()
    .regex(/github\.com/, 'Must be a GitHub repository URL'),
});

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
      scanId: scan._id,
      repositoryUrl,
    });

    logger.info({ scan }, 'Scan created via API');

    res.status(200).json({
      scanId: scan._id,
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
      // TODO: not implemented yet
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

export const scanRoutes = router;
