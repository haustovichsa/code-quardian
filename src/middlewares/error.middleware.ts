import { Request, Response, NextFunction } from 'express';
import { logger } from '@/utils/logger.util';

// 404 handler
export const notFoundHandler = (_req: Request, res: Response) => {
  res.status(404).json({
    error: 'Not found',
  });
};

// Error handler
export const errorHandler = (
  err: Error,
  _req: Request,
  res: Response,
  _next: NextFunction
) => {
  logger.error({ error: err }, 'Unhandled error');
  res.status(500).json({
    error: 'Internal server error',
    message: err.message,
  });
};
