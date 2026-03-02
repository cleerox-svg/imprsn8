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

// ── src/server.js ────────────────────────────────────────────────
import { testConnection } from './config/db.js';
import { testRedis } from './config/redis.js';
import { startFeedIngestors } from './workers/feedIngestor.js';

const PORT = parseInt(env.PORT || '4000');

async function start() {
  try {
    logger.info('🛡  imprsn8 API starting...');
    await testConnection();
    await testRedis();

    app.listen(PORT, () => {
      logger.info(`🚀 Server running on http://localhost:${PORT}`);
      logger.info(`📡 CORS allowed: ${env.FRONTEND_URL}`);
    });

    // Start feed ingestors after server is up
    if (env.NODE_ENV !== 'test') {
      await startFeedIngestors();
    }
  } catch (err) {
    logger.error('Startup failed', { error: err.message });
    process.exit(1);
  }
}

start();

// ── src/db/seed.js ───────────────────────────────────────────────
import bcrypt from 'bcryptjs';
import { pool, query } from '../config/db.js';

async function seed() {
  console.log('🌱 Seeding database...');

  // Users
  const adminHash = await bcrypt.hash('admin123', 12);
  const socHash = await bcrypt.hash('soc1234', 12);
  const infHash = await bcrypt.hash('influencer1', 12);
  const inf2Hash = await bcrypt.hash('influencer2', 12);

  // Influencers first
  const { rows: [aria] } = await query(
    `INSERT INTO influencers (name,handle,email,followers,tier,status,bio,initials,color)
     VALUES ('Aria Vale','@ariavale','aria@ariavale.com','4.2M','Enterprise','active',
             '✨ Lifestyle & Fashion | LA based','AV','#C8A84B')
     ON CONFLICT DO NOTHING RETURNING id`
  );
  const { rows: [zoe] } = await query(
    `INSERT INTO influencers (name,handle,email,followers,tier,status,bio,initials,color)
     VALUES ('Zoe Hartley','@zoehartley','zoe@zoehartley.com','9.1M','Enterprise','critical',
             'Beauty creator 🌸 NYC','ZH','#7B3FE4')
     ON CONFLICT DO NOTHING RETURNING id`
  );
  const { rows: [marcus] } = await query(
    `INSERT INTO influencers (name,handle,email,followers,tier,status,bio,initials,color)
     VALUES ('Marcus Obi','@marcusobi','marcus@marcusobi.com','1.8M','Pro','active',
             'Tech reviews & lifestyle','MO','#10B981')
     ON CONFLICT DO NOTHING RETURNING id`
  );

  if (aria?.id) {
    // Seed users
    await query(
      `INSERT INTO users (name,email,password_hash,role,mfa_enabled) VALUES
       ('Maria Chen','admin@imprsn8.io',$1,'admin',true),
       ('James Okonkwo','soc@imprsn8.io',$2,'soc_analyst',true)
       ON CONFLICT (email) DO NOTHING`,
      [adminHash, socHash]
    );
    await query(
      `INSERT INTO users (name,email,password_hash,role,mfa_enabled,influencer_id) VALUES
       ('Aria Vale','aria@ariavale.com',$1,'influencer',true,$2),
       ('Zoe Hartley','zoe@zoehartley.com',$3,'influencer',true,$4)
       ON CONFLICT (email) DO NOTHING`,
      [infHash, aria.id, inf2Hash, zoe.id]
    );

    // Platforms
    for (const [iid, plats] of [[aria.id,['instagram','tiktok','youtube']],[zoe.id,['instagram','tiktok','youtube','twitter']],[marcus.id,['instagram','twitter']]]) {
      for (const p of plats) {
        await query('INSERT INTO influencer_platforms (influencer_id,platform) VALUES ($1,$2) ON CONFLICT DO NOTHING', [iid, p]);
      }
    }

    // Sample threats
    await query(
      `INSERT INTO threats (influencer_id,platform,type,severity,status,fake_handle,fake_display_name,oci_score,ioi_indicators,ttps)
       VALUES ($1,'instagram','ACCOUNT_LOOKALIKE','critical','pending_review',
               '@zoehart1ey_real','Zoe Hartley ✓',94,
               ARRAY['HANDLE_TYPOSQUAT','AVATAR_CLONE','BIO_MIRROR'],
               'Avatar Hijack + Handle Typosquat')
       ON CONFLICT DO NOTHING`,
      [zoe.id]
    );
  }

  // Agents
  const agents = [
    ['SEN-01','SENTINEL Alpha','SENTINEL','all','active',99,14,28,18821,7,'4,200/hr',
     ARRAY['READ_FEED','READ_PROFILE','COMPUTE_DELTA'],ARRAY[],false,
     'Continuous passive perimeter monitoring across all registered influencer handles.'],
    ['ARB-01','ARBITER Queue','ARBITER','all','standby',100,2,14,0,0,'N/A',
     ARRAY['READ_INTEL_DB','DRAFT_TAKEDOWN'],ARRAY['SUBMIT_TAKEDOWN','CONTACT_PLATFORM'],true,
     '⚠ HUMAN-IN-THE-LOOP ENFORCED. Prepares takedown packages — cannot submit without SOC Analyst authorisation.'],
    ['WDG-01','WATCHDOG Compliance','WATCHDOG','all','active',100,8,19,1203,1,'continuous',
     ARRAY['AUDIT_ALL_AGENTS','WRITE_COMPLIANCE_LOG'],ARRAY[],false,
     'Agent behavioural auditor. Monitors all agent actions against approved TTP boundaries.'],
  ];

  for (const [id,name,type,platform,status,health,cpu,mem,tasks,alerts,rate,approved,blocked,hitl,desc] of agents) {
    await query(
      `INSERT INTO agents (id,name,type,platform,status,health_pct,cpu_pct,mem_pct,tasks_completed,alerts_raised,scan_rate,approved_scopes,blocked_scopes,hitl_required,description)
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14,$15)
       ON CONFLICT (id) DO NOTHING`,
      [id,name,type,platform,status,health,cpu,mem,tasks,alerts,rate,approved,blocked,hitl,desc]
    );
  }

  // Feed configs
  const feeds = [
    ['twitter','X / Twitter','𝕏','#1DA1F2','STREAM + POLL',true,'OAuth 2.0 Bearer','Pro ($5,000/mo)',null,1000000,'tweets',182440,null,23,847],
    ['tiktok','TikTok','♪','#FF0050','POLL',true,'OAuth 2.0 (Research API)','Research Approved',1000,null,'queries',342,null,14,623],
    ['instagram','Instagram','◈','#E1306C','POLL',true,'OAuth 2.0 (Business Graph)','Business',4800,null,'calls',1204,null,31,1204],
    ['facebook','Facebook','ƒ','#1877F2','POLL',true,'OAuth 2.0 (PPCA)','Business',null,null,'calls/hr',44,null,6,412],
    ['youtube','YouTube','▶','#FF0000','POLL',true,'API Key Pool','Free (10K units/day)',10000,null,'units',3840,null,9,289],
    ['linkedin','LinkedIn','in','#0A66C2','POLL',true,'OAuth 2.0 Partner','Partner',100,null,'calls',12,null,2,89],
    ['threads','Threads','@','#000000','POLL',true,'OAuth 2.0 (Meta)','Graph API',4800,null,'calls',203,null,4,341],
    ['reddit','Reddit','👽','#FF4500','POLL',true,'OAuth 2.0 App','Free',null,null,'req/min',8,null,1,156],
    ['snapchat','Snapchat','👻','#FFFC00','REACTIVE',false,'Snap Kit','Not connected',null,null,'N/A',0,null,0,0],
  ];

  for (const [id,name,icon,color,mode,connected,auth,tier,daily,monthly,unit,used,resetAt,alerts,variants] of feeds) {
    await query(
      `INSERT INTO feed_configs (id,display_name,icon,color,mode,connected,auth_type,tier_label,quota_daily,quota_monthly,quota_unit,quota_used,quota_reset_at,alerts_today,variants_watched)
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14,$15)
       ON CONFLICT (id) DO NOTHING`,
      [id,name,icon,color,mode,connected,auth,tier,daily,monthly,unit,used,resetAt,alerts,variants]
    );
  }

  console.log('✅ Seed complete');
  await pool.end();
}

seed().catch((err) => { console.error(err); process.exit(1); });
