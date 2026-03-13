import express from 'express';
import { healthRoutes } from '@/routes/health.routes';
import { notFoundHandler, errorHandler } from '@/middlewares/error.middleware';
import { loggingHandler } from '@/middlewares/loggin.middleware';

export const app = express();

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
