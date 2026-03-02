import { Router } from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import speakeasy from 'speakeasy';
import QRCode from 'qrcode';
import { createHash, randomBytes } from 'crypto';
import { z } from 'zod';
import { query, withTransaction } from '../config/db.js';
import { env } from '../config/env.js';
import { logger } from '../config/env.js';
import { authenticate } from '../middleware/auth.js';

const router = Router();

// ── Token helpers ────────────────────────────────────────────────
function signAccessToken(user) {
  return jwt.sign(
    { sub: user.id, role: user.role, name: user.name },
    env.JWT_SECRET,
    { expiresIn: env.JWT_ACCESS_EXPIRES }
  );
}

function signRefreshToken(user) {
  const token = randomBytes(48).toString('hex');
  const hash = createHash('sha256').update(token).digest('hex');
  return { raw: token, hash };
}

async function storeRefreshToken(userId, hash, req) {
  const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);
  await query(
    'INSERT INTO refresh_tokens (user_id, token_hash, expires_at, ip_address, user_agent) VALUES ($1,$2,$3,$4,$5)',
    [userId, hash, expiresAt, req.ip, req.headers['user-agent']]
  );
}

// ── POST /api/auth/login ─────────────────────────────────────────
router.post('/login', async (req, res, next) => {
  try {
    const schema = z.object({
      email: z.string().email(),
      password: z.string().min(1),
    });
    const { email, password } = schema.parse(req.body);

    const result = await query(
      'SELECT id, name, email, password_hash, role, status, mfa_enabled, mfa_secret, influencer_id FROM users WHERE email = $1',
      [email.toLowerCase()]
    );

    const user = result.rows[0];
    if (!user) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }
    if (user.status !== 'active') {
      return res.status(403).json({ error: 'Account suspended' });
    }

    const valid = await bcrypt.compare(password, user.password_hash);
    if (!valid) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }

    // Update last login
    await query('UPDATE users SET last_login_at = NOW() WHERE id = $1', [user.id]);

    if (user.mfa_enabled) {
      // Return a short-lived MFA challenge token
      const mfaToken = jwt.sign({ sub: user.id, type: 'mfa_challenge' }, env.JWT_SECRET, { expiresIn: '5m' });
      return res.json({ requiresMFA: true, mfaToken });
    }

    // No MFA — issue full tokens
    const accessToken = signAccessToken(user);
    const { raw: refreshRaw, hash: refreshHash } = signRefreshToken(user);
    await storeRefreshToken(user.id, refreshHash, req);

    res.json({
      accessToken,
      refreshToken: refreshRaw,
      user: { id: user.id, name: user.name, email: user.email, role: user.role, influencer_id: user.influencer_id },
    });
  } catch (err) {
    next(err);
  }
});

// ── POST /api/auth/verify-mfa ────────────────────────────────────
router.post('/verify-mfa', async (req, res, next) => {
  try {
    const { mfaToken, code } = z.object({
      mfaToken: z.string(),
      code: z.string().length(6),
    }).parse(req.body);

    let payload;
    try {
      payload = jwt.verify(mfaToken, env.JWT_SECRET);
    } catch {
      return res.status(401).json({ error: 'Invalid or expired MFA challenge' });
    }

    if (payload.type !== 'mfa_challenge') {
      return res.status(401).json({ error: 'Invalid token type' });
    }

    const result = await query(
      'SELECT id, name, email, role, mfa_secret, status, influencer_id FROM users WHERE id = $1',
      [payload.sub]
    );
    const user = result.rows[0];
    if (!user) return res.status(401).json({ error: 'User not found' });

    const valid = speakeasy.totp.verify({
      secret: user.mfa_secret,
      encoding: 'base32',
      token: code,
      window: 1,
    });

    if (!valid) {
      return res.status(401).json({ error: 'Invalid MFA code' });
    }

    const accessToken = signAccessToken(user);
    const { raw: refreshRaw, hash: refreshHash } = signRefreshToken(user);
    await storeRefreshToken(user.id, refreshHash, req);

    res.json({
      accessToken,
      refreshToken: refreshRaw,
      user: { id: user.id, name: user.name, email: user.email, role: user.role, influencer_id: user.influencer_id },
    });
  } catch (err) {
    next(err);
  }
});

// ── POST /api/auth/refresh ───────────────────────────────────────
router.post('/refresh', async (req, res, next) => {
  try {
    const { refreshToken } = z.object({ refreshToken: z.string() }).parse(req.body);
    const hash = createHash('sha256').update(refreshToken).digest('hex');

    const result = await query(
      `SELECT rt.*, u.id as uid, u.name, u.email, u.role, u.status, u.influencer_id
       FROM refresh_tokens rt JOIN users u ON u.id = rt.user_id
       WHERE rt.token_hash = $1 AND rt.revoked_at IS NULL AND rt.expires_at > NOW()`,
      [hash]
    );

    if (!result.rows[0]) {
      return res.status(401).json({ error: 'Invalid or expired refresh token' });
    }

    const row = result.rows[0];
    const user = { id: row.uid, name: row.name, email: row.email, role: row.role, influencer_id: row.influencer_id };

    // Rotate: revoke old, issue new
    await query('UPDATE refresh_tokens SET revoked_at = NOW() WHERE id = $1', [row.id]);
    const accessToken = signAccessToken(user);
    const { raw: refreshRaw, hash: newHash } = signRefreshToken(user);
    await storeRefreshToken(user.id, newHash, req);

    res.json({ accessToken, refreshToken: refreshRaw, user });
  } catch (err) {
    next(err);
  }
});

// ── POST /api/auth/logout ────────────────────────────────────────
router.post('/logout', authenticate, async (req, res, next) => {
  try {
    const { refreshToken } = req.body;
    if (refreshToken) {
      const hash = createHash('sha256').update(refreshToken).digest('hex');
      await query('UPDATE refresh_tokens SET revoked_at = NOW() WHERE token_hash = $1', [hash]);
    }
    res.json({ message: 'Logged out' });
  } catch (err) {
    next(err);
  }
});

// ── POST /api/auth/setup-mfa ─────────────────────────────────────
router.post('/setup-mfa', authenticate, async (req, res, next) => {
  try {
    const secret = speakeasy.generateSecret({ name: `${env.MFA_APP_NAME} (${req.user.email})`, length: 20 });
    // Store secret temporarily (user must verify before it's activated)
    await query('UPDATE users SET mfa_secret = $1 WHERE id = $2', [secret.base32, req.user.id]);
    const qrCode = await QRCode.toDataURL(secret.otpauth_url);
    res.json({ secret: secret.base32, qrCode });
  } catch (err) {
    next(err);
  }
});

// ── POST /api/auth/confirm-mfa ───────────────────────────────────
router.post('/confirm-mfa', authenticate, async (req, res, next) => {
  try {
    const { code } = z.object({ code: z.string().length(6) }).parse(req.body);
    const result = await query('SELECT mfa_secret FROM users WHERE id = $1', [req.user.id]);
    const { mfa_secret } = result.rows[0];

    const valid = speakeasy.totp.verify({ secret: mfa_secret, encoding: 'base32', token: code, window: 1 });
    if (!valid) return res.status(400).json({ error: 'Invalid code — please try again' });

    await query('UPDATE users SET mfa_enabled = true WHERE id = $1', [req.user.id]);
    res.json({ message: 'MFA enabled successfully' });
  } catch (err) {
    next(err);
  }
});

// ── GET /api/auth/me ─────────────────────────────────────────────
router.get('/me', authenticate, async (req, res) => {
  res.json({ user: req.user });
});

export default router;
