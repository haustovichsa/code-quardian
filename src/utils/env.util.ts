import dotenv from 'dotenv';
import { z } from 'zod';
import { NodeEnv } from '@/types/node-env';
import { LogLevel } from '@/types/log-level';

dotenv.config();

const envSchema = z.object({
  NODE_ENV: z.enum(Object.values(NodeEnv)),
  PORT: z.coerce.number().default(3000),
  GRAPHQL_PORT: z.coerce.number().default(4000),
  LOG_LEVEL: z.enum(Object.values(LogLevel)),
  MONGO_URI: z.url(),
  REDIS_URL: z.url(),
});

export type Env = z.infer<typeof envSchema>;

export const env = envSchema.parse(process.env);
