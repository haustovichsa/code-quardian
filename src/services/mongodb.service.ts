import mongoose from 'mongoose';
import { injectable } from 'inversify';
import { logger } from '@/utils/logger.util';
import { env } from '@/utils/env.util';

export const MongodbServiceToken = Symbol.for('MongodbService');

@injectable()
export class MongodbService {
  async connect(): Promise<void> {
    try {
      await mongoose.connect(env.MONGO_URI, {
        maxPoolSize: 10,
        minPoolSize: 2,
      });
      logger.info('MongoDB connected successfully');

      mongoose.connection.on('error', (err) => {
        logger.error({ error: err }, 'MongoDB connection error');
      });

      mongoose.connection.on('disconnected', () => {
        logger.warn('MongoDB disconnected');
      });
    } catch (error) {
      logger.fatal({ error }, 'Failed to connect to MongoDB');
      throw error;
    }
  }

  async disconnect(): Promise<void> {
    try {
      await mongoose.connection.close();
      logger.info('MongoDB disconnected successfully');
    } catch (error) {
      logger.error({ error }, 'Error disconnecting from MongoDB');
    }
  }
}
