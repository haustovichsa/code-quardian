import { injectable } from 'inversify';
import { logger } from '@/utils/logger.util';
import { spawn } from 'child_process';

export const TrivyToolServiceToken = Symbol.for('TrivyToolService');

@injectable()
export class TrivyToolService {
  private readonly cliTrivyPath: string = 'trivy';

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

      trivy.on('close', (code, signal) => {
        if (code === 0) {
          logger.info({ repositoryPath, outputPath }, 'Trivy scan completed');
          resolve();
        } else {
          if (signal) {
            logger.error(
              { signal, stderr },
              'Trivy process killed by signal (possible OOM)'
            );
            reject(
              new Error(
                `Trivy process killed by signal ${signal} (likely out of memory). Consider increasing memory limits. Details: ${stderr}`
              )
            );
          } else {
            logger.error({ code, stderr }, 'Trivy scan failed');
            reject(new Error(`Trivy scan failed with code ${code}: ${stderr}`));
          }
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
