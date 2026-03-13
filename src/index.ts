import { env } from '@/utils/env.util';
import { logger } from '@/utils/logger.util';
import { connectMongoDb, disconnectMongoDb } from '@/utils/mongodb.util';
import { app } from '@/router';

const startServer = async (): Promise<void> => {
  try {
    await connectMongoDb();

    app.listen(env.PORT, () => {
      logger.info(`Server running on port ${env.PORT}`);
    });
  } catch (error) {
    logger.fatal({ error }, 'Failed to start server');
    await disconnectMongoDb();
  }
};

void startServer();
