import { NextFunction, Request, Response } from 'express';
import { logger } from '@/utils/logger.util';

export const logHandler = (req: Request, _: Response, next: NextFunction) => {
  logger.info({ method: req.method, url: req.url }, 'Incoming request');
  next();
};
