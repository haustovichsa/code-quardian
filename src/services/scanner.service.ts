import * as fs from 'node:fs/promises';
import { logger } from '@/utils/logger.util';
import path from 'path';
import { cloneRepository } from '@/utils/git.util';
import { trivyToolService } from '@/services/trivy-tool.service';
import { vulnerabilityJsonParserService } from '@/services/vulnerability-json-parser.service';
import { Vulnerability } from '@/models/scan.model';

class ScannerService {
  private readonly tmpDir: string;

  constructor() {
    this.tmpDir = './tmp'; // TODO: move to config
  }

  async scanRepository(
    scanId: string,
    repositoryUrl: string
  ): Promise<Vulnerability[]> {
    const scanDir = path.join(this.tmpDir, scanId);
    const repoDir = path.join(scanDir, 'repo');
    const outputPath = path.join(scanDir, 'scan-result.json');

    try {
      // Create scan directory
      await fs.mkdir(scanDir, { recursive: true });
      logger.info({ scanId, scanDir }, 'Created scan directory');

      // Clone repository
      await cloneRepository({ repositoryUrl, targetDir: repoDir });

      // Memory monitoring: Before Trivy scan
      const memBefore = process.memoryUsage();
      logger.info({ memBefore, scanId }, 'Memory before Trivy scan');

      // Run Trivy scan
      await trivyToolService.runTrivyScan({
        repositoryPath: repoDir,
        outputPath,
      });

      // Memory monitoring: After Trivy scan
      const memAfter = process.memoryUsage();
      logger.info(
        {
          memAfter,
          scanId,
          delta: {
            heapUsed: (memAfter.heapUsed - memBefore.heapUsed) / 1024 / 1024, // Trivy scan increased heap
            rss: (memAfter.rss - memBefore.rss) / 1024 / 1024, //  // Process memory increased
          },
        },
        'Memory after Trivy scan (MB)'
      );

      // Stream parse JSON and extract CRITICAL vulnerabilities
      const vulnerabilities =
        await vulnerabilityJsonParserService.getCriticalVulnerabilities(
          outputPath
        );

      logger.info(
        { scanId, count: vulnerabilities.length },
        'Extracted CRITICAL vulnerabilities'
      );

      return vulnerabilities;
    } finally {
      await this.cleanup(scanDir);
    }
  }

  private async cleanup(scanDir: string): Promise<void> {
    try {
      await fs.rm(scanDir, { recursive: true, force: true });
      logger.info({ scanDir }, 'Cleaned up scan directory');
    } catch (error) {
      logger.error({ error, scanDir }, 'Failed to cleanup scan directory');
    }
  }
}

export const scannerService = new ScannerService();
