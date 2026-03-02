// ── src/routes/threats.js ────────────────────────────────────────
import { Router } from 'express';
import { z } from 'zod';
import { query } from '../config/db.js';
import { authenticate, requireRole, requireInfluencerAccess } from '../middleware/auth.js';

const router = Router();
router.use(authenticate);

// GET /api/threats — list with filters
router.get('/', async (req, res, next) => {
  try {
    const { severity, status, platform, influencer_id, limit = 50, offset = 0 } = req.query;

    let where = [];
    let params = [];
    let idx = 1;

    // Influencers only see their own
    if (req.user.role === 'influencer' || req.user.role === 'influencer_staff') {
      where.push(`t.influencer_id = $${idx++}`);
      params.push(req.user.influencer_id);
    } else if (influencer_id) {
      where.push(`t.influencer_id = $${idx++}`);
      params.push(influencer_id);
    }

    if (severity) { where.push(`t.severity = $${idx++}`); params.push(severity); }
    if (status) { where.push(`t.status = $${idx++}`); params.push(status); }
    if (platform) { where.push(`t.platform = $${idx++}`); params.push(platform); }

    const whereClause = where.length ? `WHERE ${where.join(' AND ')}` : '';

    const result = await query(
      `SELECT t.*, i.name as influencer_name, i.handle as influencer_handle, i.initials, i.color
       FROM threats t JOIN influencers i ON i.id = t.influencer_id
       ${whereClause}
       ORDER BY t.detected_at DESC
       LIMIT $${idx++} OFFSET $${idx++}`,
      [...params, parseInt(limit), parseInt(offset)]
    );

    const count = await query(`SELECT COUNT(*) FROM threats t ${whereClause}`, params);
    res.json({ threats: result.rows, total: parseInt(count.rows[0].count), limit, offset });
  } catch (err) { next(err); }
});

// GET /api/threats/:id
router.get('/:id', async (req, res, next) => {
  try {
    const result = await query(
      `SELECT t.*, i.name as influencer_name, i.handle as influencer_handle, i.initials, i.color, i.tier
       FROM threats t JOIN influencers i ON i.id = t.influencer_id
       WHERE t.id = $1`,
      [req.params.id]
    );
    if (!result.rows[0]) return res.status(404).json({ error: 'Threat not found' });
    res.json(result.rows[0]);
  } catch (err) { next(err); }
});

// PATCH /api/threats/:id — update status
router.patch('/:id', requireRole('admin', 'soc_analyst'), async (req, res, next) => {
  try {
    const { status, assigned_analyst_id } = req.body;
    const result = await query(
      `UPDATE threats SET status = COALESCE($1, status), assigned_analyst_id = COALESCE($2, assigned_analyst_id),
       resolved_at = CASE WHEN $1 IN ('dismissed','takedown_filed') THEN NOW() ELSE resolved_at END
       WHERE id = $3 RETURNING *`,
      [status, assigned_analyst_id, req.params.id]
    );
    if (!result.rows[0]) return res.status(404).json({ error: 'Threat not found' });

    await query(
      'INSERT INTO audit_log (actor_id, actor_name, action, entity_type, entity_id, metadata) VALUES ($1,$2,$3,$4,$5,$6)',
      [req.user.id, req.user.name, 'THREAT_UPDATED', 'threat', req.params.id, { status }]
    );

    res.json(result.rows[0]);
  } catch (err) { next(err); }
});

export { router as threatsRouter };

// ── src/routes/influencers.js ────────────────────────────────────
const influencerRouter = Router();
influencerRouter.use(authenticate);

influencerRouter.get('/', async (req, res, next) => {
  try {
    const isRestricted = ['influencer', 'influencer_staff'].includes(req.user.role);
    let sql = `
      SELECT i.*,
        COUNT(DISTINCT t.id) FILTER (WHERE t.status NOT IN ('dismissed','takedown_filed')) AS active_threats,
        COUNT(DISTINCT t.id) FILTER (WHERE t.status = 'dismissed' OR t.status = 'takedown_filed') AS resolved,
        ARRAY_AGG(DISTINCT ip.platform) FILTER (WHERE ip.platform IS NOT NULL) AS platforms
      FROM influencers i
      LEFT JOIN threats t ON t.influencer_id = i.id
      LEFT JOIN influencer_platforms ip ON ip.influencer_id = i.id
    `;
    const params = [];
    if (isRestricted) {
      sql += ' WHERE i.id = $1';
      params.push(req.user.influencer_id);
    }
    sql += ' GROUP BY i.id ORDER BY i.name';
    const result = await query(sql, params);
    res.json(result.rows);
  } catch (err) { next(err); }
});

influencerRouter.get('/:id', async (req, res, next) => {
  try {
    const result = await query(
      `SELECT i.*,
        ARRAY_AGG(DISTINCT ip.platform) FILTER (WHERE ip.platform IS NOT NULL) AS platforms
       FROM influencers i LEFT JOIN influencer_platforms ip ON ip.influencer_id = i.id
       WHERE i.id = $1 GROUP BY i.id`,
      [req.params.id]
    );
    if (!result.rows[0]) return res.status(404).json({ error: 'Not found' });
    res.json(result.rows[0]);
  } catch (err) { next(err); }
});

influencerRouter.post('/', requireRole('admin'), async (req, res, next) => {
  try {
    const schema = z.object({
      name: z.string().min(1), handle: z.string().min(1), email: z.string().email().optional(),
      followers: z.string().optional(), tier: z.enum(['Starter','Pro','Enterprise']).default('Starter'),
      bio: z.string().optional(), initials: z.string().max(5).optional(), color: z.string().optional(),
    });
    const data = schema.parse(req.body);
    const result = await query(
      'INSERT INTO influencers (name,handle,email,followers,tier,bio,initials,color) VALUES ($1,$2,$3,$4,$5,$6,$7,$8) RETURNING *',
      [data.name,data.handle,data.email,data.followers,data.tier,data.bio,data.initials||data.name.slice(0,2).toUpperCase(),data.color||'#7B3FE4']
    );
    res.status(201).json(result.rows[0]);
  } catch (err) { next(err); }
});

influencerRouter.patch('/:id', requireRole('admin'), async (req, res, next) => {
  try {
    const { name, handle, email, followers, tier, status, bio, color } = req.body;
    const result = await query(
      `UPDATE influencers SET
        name=COALESCE($1,name), handle=COALESCE($2,handle), email=COALESCE($3,email),
        followers=COALESCE($4,followers), tier=COALESCE($5,tier), status=COALESCE($6,status),
        bio=COALESCE($7,bio), color=COALESCE($8,color)
       WHERE id=$9 RETURNING *`,
      [name,handle,email,followers,tier,status,bio,color,req.params.id]
    );
    if (!result.rows[0]) return res.status(404).json({ error: 'Not found' });
    res.json(result.rows[0]);
  } catch (err) { next(err); }
});

export { influencerRouter };

// ── src/routes/takedowns.js ──────────────────────────────────────
const takedownRouter = Router();
takedownRouter.use(authenticate);

takedownRouter.get('/', async (req, res, next) => {
  try {
    const { status } = req.query;
    const isRestricted = ['influencer','influencer_staff'].includes(req.user.role);
    let where = [];
    let params = [];
    let idx = 1;
    if (isRestricted) { where.push(`td.influencer_id = $${idx++}`); params.push(req.user.influencer_id); }
    if (status) { where.push(`td.status = $${idx++}`); params.push(status); }
    const whereClause = where.length ? `WHERE ${where.join(' AND ')}` : '';
    const result = await query(
      `SELECT td.*, i.name as influencer_name, u.name as analyst_name, a.name as authorised_by_name
       FROM takedowns td
       JOIN influencers i ON i.id = td.influencer_id
       LEFT JOIN users u ON u.id = td.assigned_analyst_id
       LEFT JOIN users a ON a.id = td.authorised_by_id
       ${whereClause} ORDER BY td.created_at DESC`,
      params
    );
    res.json(result.rows);
  } catch (err) { next(err); }
});

takedownRouter.get('/:id', async (req, res, next) => {
  try {
    const result = await query(
      `SELECT td.*, i.name as influencer_name, u.name as analyst_name
       FROM takedowns td JOIN influencers i ON i.id = td.influencer_id
       LEFT JOIN users u ON u.id = td.assigned_analyst_id
       WHERE td.id = $1`, [req.params.id]
    );
    if (!result.rows[0]) return res.status(404).json({ error: 'Not found' });
    res.json(result.rows[0]);
  } catch (err) { next(err); }
});

// HITL: Authorise takedown — SOC analyst/admin only
takedownRouter.post('/:id/authorise', requireRole('admin','soc_analyst'), async (req, res, next) => {
  try {
    const { analyst_notes } = z.object({ analyst_notes: z.string().min(10) }).parse(req.body);
    const result = await query(
      `UPDATE takedowns SET
        status = 'filed', analyst_notes = $1, authorised_by_id = $2,
        authorised_at = NOW(), filed_at = NOW()
       WHERE id = $3 AND status IN ('awaiting_review','under_review')
       RETURNING *`,
      [analyst_notes, req.user.id, req.params.id]
    );
    if (!result.rows[0]) return res.status(404).json({ error: 'Takedown not found or already completed' });

    // Update linked threat status
    await query("UPDATE threats SET status = 'takedown_filed' WHERE id = $1", [result.rows[0].threat_id]);

    await query(
      'INSERT INTO audit_log (actor_id,actor_name,action,entity_type,entity_id,metadata) VALUES ($1,$2,$3,$4,$5,$6)',
      [req.user.id, req.user.name, 'TAKEDOWN_AUTHORISED', 'takedown', req.params.id, { platform: result.rows[0].platform, target: result.rows[0].fake_handle }]
    );

    res.json(result.rows[0]);
  } catch (err) { next(err); }
});

// HITL: Dismiss takedown
takedownRouter.post('/:id/dismiss', requireRole('admin','soc_analyst'), async (req, res, next) => {
  try {
    const { reason } = z.object({ reason: z.string().optional() }).parse(req.body);
    const result = await query(
      `UPDATE takedowns SET status='dismissed', dismissed_at=NOW(), dismiss_reason=$1, authorised_by_id=$2
       WHERE id=$3 AND status IN ('awaiting_review','under_review') RETURNING *`,
      [reason, req.user.id, req.params.id]
    );
    if (!result.rows[0]) return res.status(404).json({ error: 'Not found or already completed' });
    await query(
      'INSERT INTO audit_log (actor_id,actor_name,action,entity_type,entity_id,metadata) VALUES ($1,$2,$3,$4,$5,$6)',
      [req.user.id, req.user.name, 'TAKEDOWN_DISMISSED', 'takedown', req.params.id, { reason }]
    );
    res.json(result.rows[0]);
  } catch (err) { next(err); }
});

export { takedownRouter };

// ── src/routes/agents.js ─────────────────────────────────────────
const agentRouter = Router();
agentRouter.use(authenticate, requireRole('admin','soc_analyst'));

agentRouter.get('/', async (req, res, next) => {
  try {
    const result = await query('SELECT * FROM agents ORDER BY type, id');
    res.json(result.rows);
  } catch (err) { next(err); }
});

agentRouter.get('/:id', async (req, res, next) => {
  try {
    const result = await query('SELECT * FROM agents WHERE id = $1', [req.params.id]);
    if (!result.rows[0]) return res.status(404).json({ error: 'Agent not found' });
    res.json(result.rows[0]);
  } catch (err) { next(err); }
});

// Agent heartbeat (called by agent workers internally)
agentRouter.post('/:id/heartbeat', requireRole('admin'), async (req, res, next) => {
  try {
    const { health_pct, cpu_pct, mem_pct, tasks_completed, alerts_raised } = req.body;
    await query(
      `UPDATE agents SET health_pct=COALESCE($1,health_pct), cpu_pct=COALESCE($2,cpu_pct),
        mem_pct=COALESCE($3,mem_pct), tasks_completed=COALESCE($4,tasks_completed),
        alerts_raised=COALESCE($5,alerts_raised), last_heartbeat_at=NOW()
       WHERE id=$6`,
      [health_pct,cpu_pct,mem_pct,tasks_completed,alerts_raised,req.params.id]
    );
    res.json({ ok: true });
  } catch (err) { next(err); }
});

export { agentRouter };

// ── src/routes/oci.js ────────────────────────────────────────────
const ociRouter = Router();
ociRouter.use(authenticate);

ociRouter.get('/', async (req, res, next) => {
  try {
    const isRestricted = ['influencer','influencer_staff'].includes(req.user.role);
    const { is_clone, influencer_id } = req.query;
    let where = [];
    let params = [];
    let idx = 1;
    if (isRestricted) { where.push(`op.influencer_id = $${idx++}`); params.push(req.user.influencer_id); }
    else if (influencer_id) { where.push(`op.influencer_id = $${idx++}`); params.push(influencer_id); }
    if (is_clone !== undefined) { where.push(`op.is_clone = $${idx++}`); params.push(is_clone === 'true'); }
    const whereClause = where.length ? `WHERE ${where.join(' AND ')}` : '';
    const result = await query(
      `SELECT op.*, i.name as influencer_name, i.color FROM oci_profiles op
       JOIN influencers i ON i.id = op.influencer_id
       ${whereClause} ORDER BY op.captured_at DESC`, params
    );
    res.json(result.rows);
  } catch (err) { next(err); }
});

ociRouter.post('/', requireRole('admin','soc_analyst'), async (req, res, next) => {
  try {
    const data = z.object({
      influencer_id: z.string().uuid(),
      platform: z.string(),
      handle: z.string(),
      display_name: z.string().optional(),
      bio: z.string().optional(),
      followers: z.string().optional(),
      avatar_url: z.string().url().optional(),
      phash: z.string().optional(),
      dhash: z.string().optional(),
      is_verified: z.boolean().default(false),
    }).parse(req.body);

    const vectorId = `BIV-${Date.now()}`;
    const result = await query(
      `INSERT INTO oci_profiles (influencer_id,platform,handle,display_name,bio,followers,avatar_url,phash,dhash,vector_id,is_verified)
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11) RETURNING *`,
      [data.influencer_id,data.platform,data.handle,data.display_name,data.bio,data.followers,data.avatar_url,data.phash,data.dhash,vectorId,data.is_verified]
    );
    res.status(201).json(result.rows[0]);
  } catch (err) { next(err); }
});

export { ociRouter };

// ── src/routes/feeds.js ──────────────────────────────────────────
const feedRouter = Router();
feedRouter.use(authenticate, requireRole('admin','soc_analyst'));

feedRouter.get('/', async (req, res, next) => {
  try {
    const result = await query('SELECT * FROM feed_configs ORDER BY display_name');
    res.json(result.rows);
  } catch (err) { next(err); }
});

feedRouter.get('/:id', async (req, res, next) => {
  try {
    const result = await query('SELECT * FROM feed_configs WHERE id = $1', [req.params.id]);
    if (!result.rows[0]) return res.status(404).json({ error: 'Feed not found' });
    res.json(result.rows[0]);
  } catch (err) { next(err); }
});

feedRouter.patch('/:id', requireRole('admin'), async (req, res, next) => {
  try {
    const { connected, auto_config, endpoints } = req.body;
    const result = await query(
      'UPDATE feed_configs SET connected=COALESCE($1,connected), auto_config=COALESCE($2,auto_config), endpoints=COALESCE($3,endpoints) WHERE id=$4 RETURNING *',
      [connected, auto_config ? JSON.stringify(auto_config) : null, endpoints ? JSON.stringify(endpoints) : null, req.params.id]
    );
    res.json(result.rows[0]);
  } catch (err) { next(err); }
});

export { feedRouter };

// ── src/routes/users.js ──────────────────────────────────────────
const userRouter = Router();
userRouter.use(authenticate, requireRole('admin'));

userRouter.get('/', async (req, res, next) => {
  try {
    const result = await query(
      `SELECT u.id,u.name,u.email,u.role,u.status,u.mfa_enabled,u.last_login_at,u.influencer_id,i.name as influencer_name
       FROM users u LEFT JOIN influencers i ON i.id = u.influencer_id ORDER BY u.created_at`
    );
    res.json(result.rows);
  } catch (err) { next(err); }
});

userRouter.post('/', async (req, res, next) => {
  try {
    const data = z.object({
      name: z.string().min(1),
      email: z.string().email(),
      password: z.string().min(8),
      role: z.enum(['admin','soc_analyst','influencer','influencer_staff']),
      influencer_id: z.string().uuid().optional(),
    }).parse(req.body);
    const hash = await bcrypt.hash(data.password, 12);
    const result = await query(
      'INSERT INTO users (name,email,password_hash,role,influencer_id) VALUES ($1,$2,$3,$4,$5) RETURNING id,name,email,role,status',
      [data.name,data.email,hash,data.role,data.influencer_id]
    );
    res.status(201).json(result.rows[0]);
  } catch (err) { next(err); }
});

userRouter.patch('/:id/status', async (req, res, next) => {
  try {
    const { status } = z.object({ status: z.enum(['active','suspended']) }).parse(req.body);
    await query('UPDATE users SET status=$1 WHERE id=$2', [status, req.params.id]);
    await query(
      'INSERT INTO audit_log (actor_id,actor_name,action,entity_type,entity_id,metadata) VALUES ($1,$2,$3,$4,$5,$6)',
      [req.user.id,req.user.name,'USER_STATUS_CHANGED','user',req.params.id,{ status }]
    );
    res.json({ ok: true });
  } catch (err) { next(err); }
});

import bcrypt from 'bcryptjs';
export { userRouter };

// ── src/routes/admin.js ──────────────────────────────────────────
const adminRouter = Router();
adminRouter.use(authenticate, requireRole('admin'));

adminRouter.get('/stats', async (req, res, next) => {
  try {
    const [agents, threats, takedowns, users, influencers, auditLog] = await Promise.all([
      query('SELECT status, COUNT(*) FROM agents GROUP BY status'),
      query('SELECT severity, COUNT(*) FROM threats GROUP BY severity'),
      query('SELECT status, COUNT(*) FROM takedowns GROUP BY status'),
      query('SELECT COUNT(*) FROM users WHERE status = $1', ['active']),
      query('SELECT COUNT(*) FROM influencers'),
      query('SELECT * FROM audit_log ORDER BY created_at DESC LIMIT 20'),
    ]);
    res.json({
      agents: agents.rows,
      threats: threats.rows,
      takedowns: takedowns.rows,
      activeUsers: parseInt(users.rows[0].count),
      totalInfluencers: parseInt(influencers.rows[0].count),
      auditLog: auditLog.rows,
    });
  } catch (err) { next(err); }
});

adminRouter.get('/audit-log', async (req, res, next) => {
  try {
    const { limit = 50, offset = 0, action } = req.query;
    let where = action ? `WHERE action = $3` : '';
    const params = action ? [parseInt(limit), parseInt(offset), action] : [parseInt(limit), parseInt(offset)];
    const result = await query(
      `SELECT * FROM audit_log ${where} ORDER BY created_at DESC LIMIT $1 OFFSET $2`, params
    );
    res.json(result.rows);
  } catch (err) { next(err); }
});

export { adminRouter };
