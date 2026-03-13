import mongoose from 'mongoose';
import { logger } from '@/utils/logger.util';
import { env } from '@/utils/env.util';

export const connectMongoDb = async (): Promise<void> => {
  try {
    await mongoose.connect(env.MONGO_URI);
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
};

export const disconnectMongoDb = async (): Promise<void> => {
  try {
    await mongoose.connection.close();
    logger.info('MongoDB disconnected successfully');
  } catch (error) {
    logger.error({ error }, 'Error disconnecting from MongoDB');
  }
};
