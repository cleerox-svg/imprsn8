// ── src/config/env.js ────────────────────────────────────────────
import 'dotenv/config';
import { z } from 'zod';

const schema = z.object({
  NODE_ENV: z.enum(['development', 'production', 'test']).default('development'),
  PORT: z.string().default('4000'),
  FRONTEND_URL: z.string().default('http://localhost:5173'),
  DATABASE_URL: z.string().min(1),
  REDIS_URL: z.string().default('redis://localhost:6379'),
  JWT_SECRET: z.string().min(32),
  JWT_ACCESS_EXPIRES: z.string().default('15m'),
  JWT_REFRESH_EXPIRES: z.string().default('7d'),
  MFA_APP_NAME: z.string().default('imprsn8'),
  DB_POOL_MIN: z.string().default('2'),
  DB_POOL_MAX: z.string().default('10'),
  QUOTA_RESERVE_PCT: z.string().default('20'),
  // Social APIs (optional — won't break startup if missing)
  TWITTER_BEARER_TOKEN: z.string().optional(),
  TIKTOK_CLIENT_KEY: z.string().optional(),
  TIKTOK_CLIENT_SECRET: z.string().optional(),
  META_APP_ID: z.string().optional(),
  META_APP_SECRET: z.string().optional(),
  INSTAGRAM_ACCESS_TOKEN: z.string().optional(),
  INSTAGRAM_ACCESS_TOKEN_2: z.string().optional(),
  INSTAGRAM_ACCESS_TOKEN_3: z.string().optional(),
  FACEBOOK_PAGE_TOKEN: z.string().optional(),
  YOUTUBE_API_KEY_1: z.string().optional(),
  YOUTUBE_API_KEY_2: z.string().optional(),
  YOUTUBE_API_KEY_3: z.string().optional(),
  YOUTUBE_API_KEY_4: z.string().optional(),
  LINKEDIN_ACCESS_TOKEN: z.string().optional(),
  REDDIT_CLIENT_ID: z.string().optional(),
  REDDIT_CLIENT_SECRET: z.string().optional(),
  REDDIT_USER_AGENT: z.string().default('imprsn8-bot/1.0'),
});

const parsed = schema.safeParse(process.env);
if (!parsed.success) {
  console.error('❌ Invalid environment variables:');
  console.error(parsed.error.flatten().fieldErrors);
  process.exit(1);
}

export const env = parsed.data;

// ── src/utils/logger.js ──────────────────────────────────────────
import winston from 'winston';

const { combine, timestamp, colorize, printf, json } = winston.format;

const devFormat = combine(
  colorize(),
  timestamp({ format: 'HH:mm:ss' }),
  printf(({ level, message, timestamp: ts, ...meta }) => {
    const metaStr = Object.keys(meta).length ? ` ${JSON.stringify(meta)}` : '';
    return `${ts} [${level}] ${message}${metaStr}`;
  })
);

export const logger = winston.createLogger({
  level: process.env.NODE_ENV === 'production' ? 'info' : 'debug',
  format: process.env.NODE_ENV === 'production' ? combine(timestamp(), json()) : devFormat,
  transports: [new winston.transports.Console()],
});
