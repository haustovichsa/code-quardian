import express from 'express';
import { env } from '@/utils/env.util';
import { logger } from '@/utils/logger.util';
import { healthRoutes } from '@/routes/health.routes';
import { notFoundHandler, errorHandler } from '@/middlewares/error.middleware';
import { loggingHandler } from '@/middlewares/loggin.middleware';

const app = express();

// Middleware
app.use(express.json());

// Request logging middleware
app.use(loggingHandler);

// API routes
app.use('/api', healthRoutes);

// 404 handler
app.use(notFoundHandler);

// Error handler
app.use(errorHandler);

// Start server
app.listen(env.PORT, () => {
  logger.info(`Server running on port ${env.PORT}`);
});
