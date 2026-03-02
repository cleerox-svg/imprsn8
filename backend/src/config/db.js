import pg from 'pg';
import { env } from './env.js';
import { logger } from '../utils/logger.js';

const { Pool } = pg;

export const pool = new Pool({
  connectionString: env.DATABASE_URL,
  min: parseInt(env.DB_POOL_MIN || '2'),
  max: parseInt(env.DB_POOL_MAX || '10'),
  idleTimeoutMillis: 30000,
  connectionTimeoutMillis: 5000,
});

pool.on('error', (err) => {
  logger.error('PostgreSQL pool error', { error: err.message });
});

pool.on('connect', () => {
  logger.debug('New PostgreSQL connection established');
});

// Helper: query with automatic client checkout
export async function query(text, params) {
  const start = Date.now();
  try {
    const result = await pool.query(text, params);
    const duration = Date.now() - start;
    logger.debug('DB query executed', { query: text.slice(0, 80), duration, rows: result.rowCount });
    return result;
  } catch (err) {
    logger.error('DB query error', { query: text.slice(0, 80), error: err.message });
    throw err;
  }
}

// Helper: transaction wrapper
export async function withTransaction(fn) {
  const client = await pool.connect();
  try {
    await client.query('BEGIN');
    const result = await fn(client);
    await client.query('COMMIT');
    return result;
  } catch (err) {
    await client.query('ROLLBACK');
    throw err;
  } finally {
    client.release();
  }
}

export async function testConnection() {
  const result = await query('SELECT NOW() as now');
  logger.info('PostgreSQL connected', { time: result.rows[0].now });
}
