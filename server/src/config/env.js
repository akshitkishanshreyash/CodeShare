import 'dotenv/config';
import { z } from 'zod';

const schema = z.object({
  NODE_ENV: z.enum(['development', 'test', 'production']).default('development'),
  PORT: z.coerce.number().default(5000),
  MONGODB_URI: z.string().min(1).default('mongodb://127.0.0.1:27017/codeshare'),
  SESSION_SECRET: z.string().min(16, 'SESSION_SECRET must be at least 16 characters'),
  CLIENT_URL: z.string().url().default('http://localhost:5173'),
  COOKIE_SAMESITE: z.enum(['lax', 'none', 'strict']).default('lax'),
  COOKIE_SECURE: z.enum(['true', 'false']).optional().or(z.literal('')),
  ANONYMOUS_ROOM_TTL_DAYS: z.coerce.number().default(30),
});

const parsed = schema.safeParse(process.env);
if (!parsed.success) {
  console.error('Invalid environment variables:\n', parsed.error.flatten().fieldErrors);
  process.exit(1);
}

const e = parsed.data;
const isProd = e.NODE_ENV === 'production';

export const env = {
  ...e,
  isProd,
  CLIENT_URL: e.CLIENT_URL.replace(/\/$/, ''),
  cookieSecure: e.COOKIE_SECURE ? e.COOKIE_SECURE === 'true' : isProd,
};
