import express from 'express';
import { env } from '@/utils/env.util';
import { logger } from '@/utils/logger.util';
import { healthCheck } from '@/controllers/health-check.controller';

const app = express();

// Middleware
app.use(express.json());

// Routes
app.get('/health', healthCheck);

// Start server
app.listen(env.PORT, () => {
  logger.info(`Server running on port ${env.PORT}`);
});
