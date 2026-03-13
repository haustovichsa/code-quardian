import dotenv from 'dotenv';
import { z } from 'zod';
import { NodeEnv } from '@/types/NodeEnv';
import { LogLevel } from '@/types/LogLevel';

dotenv.config();

const envSchema = z.object({
  NODE_ENV: z.enum(Object.values(NodeEnv)),
  PORT: z.coerce.number(),
  LOG_LEVEL: z.enum(Object.values(LogLevel)),
});

export type Env = z.infer<typeof envSchema>;

export const env = envSchema.parse(process.env);
