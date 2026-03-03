import bcrypt from 'bcryptjs';
import pg from 'pg';
import 'dotenv/config';

const { Pool } = pg;

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false,
});

async function query(text, params) {
  const client = await pool.connect();
  try {
    return await client.query(text, params);
  } finally {
    client.release();
  }
}

async function seed() {
  console.log('🌱 Seeding database...');

  try {
    // Password hashes
    const adminHash     = await bcrypt.hash('admin123',     12);
    const socHash       = await bcrypt.hash('soc1234',      12);
    const infHash       = await bcrypt.hash('influencer1',  12);
    const inf2Hash      = await bcrypt.hash('influencer2',  12);

    // ── Influencers ──────────────────────────────────────────────
    const { rows: [aria] } = await query(`
      INSERT INTO influencers (name, handle, email, followers, tier, status, bio, initials, color)
      VALUES ('Aria Vale','@ariavale','aria@ariavale.com','4.2M','Enterprise','active',
              'Lifestyle & Fashion | LA based','AV','#C8A84B')
      ON CONFLICT DO NOTHING RETURNING id
    `);

    const { rows: [zoe] } = await query(`
      INSERT INTO influencers (name, handle, email, followers, tier, status, bio, initials, color)
      VALUES ('Zoe Hartley','@zoehartley','zoe@zoehartley.com','9.1M','Enterprise','critical',
              'Beauty creator NYC','ZH','#7B3FE4')
      ON CONFLICT DO NOTHING RETURNING id
    `);

    const { rows: [marcus] } = await query(`
      INSERT INTO influencers (name, handle, email, followers, tier, status, bio, initials, color)
      VALUES ('Marcus Obi','@marcusobi','marcus@marcusobi.com','1.8M','Pro','active',
              'Tech reviews and lifestyle','MO','#10B981')
      ON CONFLICT DO NOTHING RETURNING id
    `);

    console.log('  ✓ Influencers created');

    // ── Users ────────────────────────────────────────────────────
    await query(`
      INSERT INTO users (name, email, password_hash, role, mfa_enabled)
      VALUES
        ('Maria Chen',    'admin@imprsn8.io', $1, 'admin',        true),
        ('James Okonkwo', 'soc@imprsn8.io',   $2, 'soc_analyst',  true)
      ON CONFLICT (email) DO NOTHING
    `, [adminHash, socHash]);

    if (aria?.id) {
      await query(`
        INSERT INTO users (name, email, password_hash, role, mfa_enabled, influencer_id)
        VALUES ('Aria Vale', 'aria@ariavale.com', $1, 'influencer', true, $2)
        ON CONFLICT (email) DO NOTHING
      `, [infHash, aria.id]);
    }

    if (zoe?.id) {
      await query(`
        INSERT INTO users (name, email, password_hash, role, mfa_enabled, influencer_id)
        VALUES ('Zoe Hartley', 'zoe@zoehartley.com', $1, 'influencer', true, $2)
        ON CONFLICT (email) DO NOTHING
      `, [inf2Hash, zoe.id]);
    }

    console.log('  ✓ Users created');

    // ── Influencer platforms ──────────────────────────────────────
    const platformData = [
      [aria?.id,   ['instagram','tiktok','youtube']],
      [zoe?.id,    ['instagram','tiktok','youtube','twitter']],
      [marcus?.id, ['instagram','twitter']],
    ];

    for (const [iid, platforms] of platformData) {
      if (!iid) continue;
      for (const p of platforms) {
        await query(
          `INSERT INTO influencer_platforms (influencer_id, platform)
           VALUES ($1, $2) ON CONFLICT DO NOTHING`,
          [iid, p]
        );
      }
    }

    console.log('  ✓ Platforms linked');

    // ── Sample threat ─────────────────────────────────────────────
    if (zoe?.id) {
      await query(`
        INSERT INTO threats
          (influencer_id, platform, type, severity, status, fake_handle,
           fake_display_name, oci_score, ioi_indicators, ttps)
        VALUES
          ($1, 'instagram', 'ACCOUNT_LOOKALIKE', 'critical', 'pending_review',
           '@zoehart1ey_real', 'Zoe Hartley', 94,
           ARRAY['HANDLE_TYPOSQUAT','AVATAR_CLONE','BIO_MIRROR'],
           'Avatar Hijack + Handle Typosquat')
        ON CONFLICT DO NOTHING
      `, [zoe.id]);

      console.log('  ✓ Sample threat created');
    }

    // ── Agents ────────────────────────────────────────────────────
    await query(`
      INSERT INTO agents
        (id, name, type, platform, status, health_pct, cpu_pct, mem_pct,
         tasks_completed, alerts_raised, scan_rate,
         approved_scopes, blocked_scopes, hitl_required, description)
      VALUES
        ('SEN-01','SENTINEL Alpha','SENTINEL','all','active',99,14,28,18821,7,'4,200/hr',
         ARRAY['READ_FEED','READ_PROFILE','COMPUTE_DELTA'],
         ARRAY[]::text[], false,
         'Continuous passive perimeter monitoring across all registered influencer handles.'),
        ('RCN-01','RECON Delta','RECON','all','standby',97,0,12,4201,0,'on-demand',
         ARRAY['READ_PROFILE','READ_POSTS','ENUMERATE_FOLLOWERS'],
         ARRAY[]::text[], false,
         'Deep-crawl agent. Activated on high-confidence IOI signals for full profile analysis.'),
        ('VRT-01','VERITAS Engine','VERITAS','all','active',100,31,44,9823,0,'on-demand',
         ARRAY['READ_AVATAR','COMPUTE_PHASH','COMPUTE_DHASH','COMPARE_VECTORS'],
         ARRAY[]::text[], false,
         'Likeness and biometric similarity analysis. Computes perceptual hashes and OCI confidence scores.'),
        ('NXS-01','NEXUS Correlator','NEXUS','all','active',98,18,29,6621,3,'continuous',
         ARRAY['READ_INTEL_DB','WRITE_ACTOR_GRAPH','CORRELATE_TTPS'],
         ARRAY[]::text[], false,
         'Cross-platform threat correlation. Links threat actors across platforms and builds attribution chains.'),
        ('ARB-01','ARBITER Queue','ARBITER','all','standby',100,2,14,0,0,'N/A',
         ARRAY['READ_INTEL_DB','DRAFT_TAKEDOWN'],
         ARRAY['SUBMIT_TAKEDOWN','CONTACT_PLATFORM'], true,
         'HUMAN-IN-THE-LOOP ENFORCED. Prepares takedown packages — cannot submit without SOC Analyst authorisation.'),
        ('WDG-01','WATCHDOG Compliance','WATCHDOG','all','active',100,8,19,1203,1,'continuous',
         ARRAY['AUDIT_ALL_AGENTS','WRITE_COMPLIANCE_LOG'],
         ARRAY[]::text[], false,
         'Agent behavioural auditor. Monitors all agent actions against approved TTP boundaries.')
      ON CONFLICT (id) DO NOTHING
    `);

    console.log('  ✓ Agents created');

    // ── Feed configs ──────────────────────────────────────────────
    const feeds = [
      ['twitter',   'X / Twitter', '𝕏', '#1DA1F2', 'STREAM + POLL', true,  'OAuth 2.0 Bearer',       'Pro',       null, 1000000, 'tweets',   182440, 23, 847],
      ['tiktok',    'TikTok',      '♪', '#FF0050', 'POLL',          true,  'OAuth 2.0 Research API', 'Research',  1000, null,    'queries',  342,    14, 623],
      ['instagram', 'Instagram',   '◈', '#E1306C', 'POLL',          true,  'OAuth 2.0 Graph API',    'Business',  4800, null,    'calls',    1204,   31, 1204],
      ['facebook',  'Facebook',    'ƒ', '#1877F2', 'POLL',          true,  'OAuth 2.0 PPCA',         'Business',  null, null,    'calls/hr', 44,     6,  412],
      ['youtube',   'YouTube',     '▶', '#FF0000', 'POLL',          true,  'API Key Pool',           'Free',      10000,null,   'units',    3840,   9,  289],
      ['linkedin',  'LinkedIn',    'in','#0A66C2', 'POLL',          true,  'OAuth 2.0 Partner',      'Partner',   100,  null,    'calls',    12,     2,  89],
      ['threads',   'Threads',     '@', '#000000', 'POLL',          true,  'OAuth 2.0 Meta',         'Graph API', 4800, null,    'calls',    203,    4,  341],
      ['reddit',    'Reddit',      '👽','#FF4500', 'POLL',          true,  'OAuth 2.0 App',          'Free',      null, null,    'req/min',  8,      1,  156],
      ['snapchat',  'Snapchat',    '👻','#FFFC00', 'REACTIVE',      false, 'Snap Kit',               'Limited',   null, null,    'N/A',      0,      0,  0],
    ];

    for (const [id, name, icon, color, mode, connected, auth, tier,
                 daily, monthly, unit, used, alerts, variants] of feeds) {
      await query(`
        INSERT INTO feed_configs
          (id, display_name, icon, color, mode, connected, auth_type, tier_label,
           quota_daily, quota_monthly, quota_unit, quota_used, alerts_today, variants_watched)
        VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14)
        ON CONFLICT (id) DO NOTHING
      `, [id, name, icon, color, mode, connected, auth, tier,
          daily, monthly, unit, used, alerts, variants]);
    }

    console.log('  ✓ Feed configs created');
    console.log('');
    console.log('✅ Seed complete');
    console.log('');
    console.log('Demo accounts:');
    console.log('  admin@imprsn8.io     / admin123     (Admin)');
    console.log('  soc@imprsn8.io       / soc1234      (SOC Analyst)');
    console.log('  aria@ariavale.com    / influencer1  (Influencer)');
    console.log('  zoe@zoehartley.com   / influencer2  (Influencer)');

  } catch (err) {
    console.error('❌ Seed error:', err.message);
    throw err;
  } finally {
    await pool.end();
  }
}

seed().catch((err) => {
  console.error(err);
  process.exit(1);
});
