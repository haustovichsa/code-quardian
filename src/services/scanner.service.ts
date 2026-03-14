import * as fs from 'node:fs/promises';
import { injectable, inject } from 'inversify';
import { logger } from '@/utils/logger.util';
import path from 'path';
import { cloneRepository } from '@/utils/git.util';
import { Vulnerability } from '@/models/scan.model';
import { TrivyToolService, TrivyToolServiceToken } from './trivy-tool.service';
import {
  VulnerabilityJsonParserService,
  VulnerabilityJsonParserServiceToken,
} from './vulnerability-json-parser.service';

export const ScannerServiceToken = Symbol.for('ScannerService');

@injectable()
export class ScannerService {
  private readonly tmpDir: string;

  constructor(
    @inject(TrivyToolServiceToken) private trivyToolService: TrivyToolService,
    @inject(VulnerabilityJsonParserServiceToken)
    private vulnerabilityJsonParserService: VulnerabilityJsonParserService
  ) {
    this.tmpDir = './tmp';
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
      await this.trivyToolService.runTrivyScan({
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
        await this.vulnerabilityJsonParserService.getCriticalVulnerabilities(
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
