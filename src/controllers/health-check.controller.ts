import { Request, Response } from 'express';

export const healthCheck = (_: Request, res: Response): void => {
  res.json({ status: 'ok' });
};
