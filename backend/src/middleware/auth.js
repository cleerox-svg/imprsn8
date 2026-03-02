import jwt from 'jsonwebtoken';
import { env } from '../config/env.js';
import { query } from '../config/db.js';

// Verify JWT and attach user to request
export async function authenticate(req, res, next) {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader?.startsWith('Bearer ')) {
      return res.status(401).json({ error: 'Missing or invalid authorization header' });
    }

    const token = authHeader.slice(7);
    let payload;
    try {
      payload = jwt.verify(token, env.JWT_SECRET);
    } catch (err) {
      if (err.name === 'TokenExpiredError') {
        return res.status(401).json({ error: 'Token expired', code: 'TOKEN_EXPIRED' });
      }
      return res.status(401).json({ error: 'Invalid token' });
    }

    // Load fresh user from DB on each request (catches revoked users)
    const result = await query(
      'SELECT id, name, email, role, status, mfa_enabled, influencer_id FROM users WHERE id = $1',
      [payload.sub]
    );

    if (!result.rows[0]) {
      return res.status(401).json({ error: 'User not found' });
    }

    const user = result.rows[0];
    if (user.status !== 'active') {
      return res.status(403).json({ error: 'Account is suspended' });
    }

    req.user = user;
    next();
  } catch (err) {
    next(err);
  }
}

// Role-based access control — pass allowed roles
export function requireRole(...roles) {
  return (req, res, next) => {
    if (!req.user) return res.status(401).json({ error: 'Unauthenticated' });
    if (!roles.includes(req.user.role)) {
      return res.status(403).json({
        error: 'Insufficient permissions',
        required: roles,
        current: req.user.role,
      });
    }
    next();
  };
}

// Influencer data isolation — influencers can only see their own data
export function requireInfluencerAccess(paramName = 'influencerId') {
  return (req, res, next) => {
    const { role, influencer_id } = req.user;
    // Admins and SOC analysts see all
    if (role === 'admin' || role === 'soc_analyst') return next();
    // Influencers and staff can only access their own tenant
    const requestedId = req.params[paramName] || req.query.influencerId;
    if (requestedId && requestedId !== influencer_id) {
      return res.status(403).json({ error: 'Access denied to this influencer data' });
    }
    next();
  };
}

// HITL guard — blocks ARBITER-class actions without SOC analyst or admin
export function requireHITL(req, res, next) {
  const { role } = req.user;
  if (role !== 'admin' && role !== 'soc_analyst') {
    return res.status(403).json({
      error: 'HITL Gate: This action requires SOC Analyst or Admin authorisation',
      code: 'HITL_REQUIRED',
    });
  }
  next();
}
