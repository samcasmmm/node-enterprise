import { z } from 'zod';
import dotenv from 'dotenv';
import path from 'path';

// Load dotenv based on current NODE_ENV
const nodeEnv = process.env.NODE_ENV || 'development';
dotenv.config({
  path: path.resolve(process.cwd(), `env/.env.${nodeEnv === 'production' ? 'prod' : 'dev'}`),
  override: true,
});

const envSchema = z.object({
  NODE_ENV: z.enum(['development', 'production', 'test']).default('development'),
  PORT: z
    .string()
    .default('3000')
    .transform((val) => parseInt(val, 10)),
  DATABASE_URL: z.string(),
  JWT_ACCESS_SECRET: z.string(),
  JWT_REFRESH_SECRET: z.string(),
  JWT_ACCESS_EXPIRATION: z.string().default('24h'),
  JWT_REFRESH_EXPIRATION: z.string().default('7d'),
  SMTP_HOST: z.string().optional(),
  SMTP_PORT: z
    .string()
    .default('587')
    .transform((val) => parseInt(val, 10)),
  SMTP_USER: z.string().optional(),
  SMTP_PASSWORD: z.string().optional(),
  MAIL_FROM: z.string().optional(),
  AWS_REGION: z.string().optional(),
  AWS_S3_BUCKET: z.string().optional(),
});

const parsed = envSchema.safeParse(process.env);

if (!parsed.success) {
  console.error('❌ Environment validation failed:', parsed.error.format());
  process.exit(1);
}

export const env = parsed.data;
export default env;
