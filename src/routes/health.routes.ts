import { Request, Response, Router } from 'express';

const router = Router();

const healthRoute = (_: Request, res: Response): void => {
  res.json({ status: 'ok' });
};

router.get('/health', healthRoute);

export const healthRoutes = router;
