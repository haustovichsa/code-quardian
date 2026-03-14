import express, { Express } from 'express';
import { Container } from 'inversify';
import { healthRoutes } from '@/routes/health.routes';
import { notFoundHandler, errorHandler } from '@/middlewares/error.middleware';
import { loggingHandler } from '@/middlewares/loggin.middleware';
import { createScanRoutes } from '@/routes/scan.routes';

export const createApp = (container: Container): Express => {
  const app = express();

  // Middleware
  app.use(express.json());

  // Request logging middleware
  app.use(loggingHandler);

  // API routes
  app.use('/api', healthRoutes);
  app.use('/api', createScanRoutes(container));

  // 404 handler
  app.use(notFoundHandler);

  // Error handler
  app.use(errorHandler);

  return app;
};
