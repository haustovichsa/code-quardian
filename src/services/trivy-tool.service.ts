import { logger } from '@/utils/logger.util';
import { spawn } from 'child_process';

class TrivyToolService {
  private readonly cliTrivyPath: string = 'trivy'; // TODO: move to config

  async runTrivyScan({
    repositoryPath,
    outputPath,
  }: {
    repositoryPath: string;
    outputPath: string;
  }): Promise<void> {
    logger.info({ repositoryPath }, 'Running Trivy scan');

    return new Promise((resolve, reject) => {
      const trivy = spawn(this.cliTrivyPath, [
        'fs',
        '--format',
        'json',
        '--output',
        outputPath,
        repositoryPath,
      ]);

      let stderr = '';

      trivy.stderr.on('data', (data: Buffer) => {
        stderr += data.toString();
      });

      trivy.on('close', (code) => {
        if (code === 0) {
          logger.info({ repositoryPath, outputPath }, 'Trivy scan completed');
          resolve();
        } else {
          logger.error({ code, stderr }, 'Trivy scan failed');
          reject(new Error(`Trivy scan failed with code ${code}: ${stderr}`));
        }
      });

      trivy.on('error', (error) => {
        logger.error({ error }, 'Failed to spawn Trivy process');
        reject(
          new Error(
            `Failed to run Trivy: ${error instanceof Error ? error.message : 'Unknown error'}`
          )
        );
      });
    });
  }
}

export const trivyToolService = new TrivyToolService();
