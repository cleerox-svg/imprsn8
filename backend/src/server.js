// ── src/app.js ───────────────────────────────────────────────────
import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import rateLimit from 'express-rate-limit';
import { env } from './config/env.js';
import { logger } from './config/env.js';

import authRouter from './routes/auth.js';
import { threatsRouter, influencerRouter, takedownRouter,
         agentRouter, ociRouter, feedRouter, userRouter, adminRouter } from './routes/index.js';

const app = express();

// ── SECURITY HEADERS ─────────────────────────────────────────────
app.use(helmet({
  crossOriginEmbedderPolicy: false,
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      connectSrc: ["'self'", env.FRONTEND_URL],
    },
  },
}));

// ── CORS ──────────────────────────────────────────────────────────
app.use(cors({
  origin: [env.FRONTEND_URL, 'https://imprsn8.com', 'https://www.imprsn8.com'],
  credentials: true,
  methods: ['GET', 'POST', 'PATCH', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization'],
}));

// ── BODY PARSING ─────────────────────────────────────────────────
app.use(express.json({ limit: '1mb' }));

// ── GLOBAL RATE LIMIT ─────────────────────────────────────────────
app.use('/api', rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 300,
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: 'Too many requests — please try again shortly' },
}));

// Stricter limit on auth endpoints
app.use('/api/auth', rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 20,
  message: { error: 'Too many auth attempts' },
}));

// ── HEALTH CHECK ─────────────────────────────────────────────────
app.get('/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString(), version: '1.0.0' });
});

// ── ROUTES ───────────────────────────────────────────────────────
app.use('/api/auth', authRouter);
app.use('/api/threats', threatsRouter);
app.use('/api/influencers', influencerRouter);
app.use('/api/takedowns', takedownRouter);
app.use('/api/agents', agentRouter);
app.use('/api/oci', ociRouter);
app.use('/api/feeds', feedRouter);
app.use('/api/users', userRouter);
app.use('/api/admin', adminRouter);

// ── 404 ───────────────────────────────────────────────────────────
app.use((req, res) => {
  res.status(404).json({ error: `Route not found: ${req.method} ${req.path}` });
});

// ── ERROR HANDLER ─────────────────────────────────────────────────
app.use((err, req, res, next) => {
  if (err.name === 'ZodError') {
    return res.status(400).json({ error: 'Validation error', details: err.flatten().fieldErrors });
  }
  if (err.code === '23505') { // Postgres unique violation
    return res.status(409).json({ error: 'Resource already exists' });
  }
  logger.error('Unhandled error', { error: err.message, stack: err.stack, path: req.path });
  res.status(500).json({ error: 'Internal server error' });
});

export default app;

