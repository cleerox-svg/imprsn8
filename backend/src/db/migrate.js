// src/db/migrate.js
// Runs automatically on every Railway deploy (preDeployCommand)
// Safe to run repeatedly — uses IF NOT EXISTS and CREATE OR REPLACE

import { readFileSync } from 'fs';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import pg from 'pg';

const __dirname = dirname(fileURLToPath(import.meta.url));
const { Pool } = pg;

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false,
  connectionTimeoutMillis: 10000,
});

async function migrate() {
  const client = await pool.connect();
  try {
    console.log('🔄 Running migrations...');

    // Create migrations tracking table
    await client.query(`
      CREATE TABLE IF NOT EXISTS _migrations (
        id SERIAL PRIMARY KEY,
        name VARCHAR(255) UNIQUE NOT NULL,
        run_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
      )
    `);

    // Load and run schema if not already applied
    const { rows } = await client.query(
      "SELECT name FROM _migrations WHERE name = 'initial_schema'"
    );

    if (!rows.length) {
      console.log('  → Applying initial_schema...');
      const schema = readFileSync(join(__dirname, 'schema.sql'), 'utf8');
      await client.query(schema);
      await client.query(
        "INSERT INTO _migrations (name) VALUES ('initial_schema')"
      );
      console.log('  ✓ initial_schema applied');
    } else {
      console.log('  ✓ initial_schema already applied — skipping');
    }

    // Future migrations go here as numbered entries:
    // const migrations = [
    //   { name: '001_add_column_x', sql: `ALTER TABLE threats ADD COLUMN IF NOT EXISTS x TEXT` },
    // ];
    // for (const m of migrations) {
    //   const { rows } = await client.query('SELECT name FROM _migrations WHERE name = $1', [m.name]);
    //   if (!rows.length) {
    //     await client.query(m.sql);
    //     await client.query('INSERT INTO _migrations (name) VALUES ($1)', [m.name]);
    //     console.log(`  ✓ ${m.name} applied`);
    //   }
    // }

    console.log('✅ Migrations complete');
  } finally {
    client.release();
    await pool.end();
  }
}

migrate().catch((err) => {
  console.error('❌ Migration failed:', err.message);
  process.exit(1);
});
