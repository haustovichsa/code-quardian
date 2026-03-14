import { logger } from '@/utils/logger.util';
import simpleGit from 'simple-git';

export const cloneRepository = async ({
  repositoryUrl,
  targetDir,
}: {
  repositoryUrl: string;
  targetDir: string;
}) => {
  logger.info({ repositoryUrl }, 'Cloning repository');

  const git = simpleGit();

  try {
    await git.clone(repositoryUrl, targetDir, ['--depth', '1']);
    logger.info({ repositoryUrl, targetDir }, 'Repository cloned');
  } catch (error) {
    logger.error({ error, repositoryUrl }, 'Failed to clone repository');
    throw new Error(
      `Failed to clone repository: ${error instanceof Error ? error.message : 'Unknown error'}`
    );
  }
};
