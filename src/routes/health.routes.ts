import { Request, Response, Router } from 'express';
import mongoose from 'mongoose';

const router = Router();

const healthRoute = (_: Request, res: Response): void => {
  const dbStatus: number = mongoose.connection.readyState;
  const dbStatusMap: Record<number, string> = {
    0: 'disconnected',
    1: 'connected',
    2: 'connecting',
    3: 'disconnecting',
  };

  res.json({
    status: 'ok',
    mongoDb: {
      status: dbStatusMap[dbStatus] ?? 'unknown',
    },
    timestamp: new Date().toISOString(),
  });
};

router.get('/health', healthRoute);

export const healthRoutes = router;
