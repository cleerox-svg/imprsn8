-- ── imprsn8 PostgreSQL Schema ────────────────────────────────────
-- Run: psql $DATABASE_URL -f schema.sql

CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pg_trgm"; -- fuzzy text search

-- ── ENUMS ────────────────────────────────────────────────────────
CREATE TYPE user_role AS ENUM ('admin', 'soc_analyst', 'influencer', 'influencer_staff');
CREATE TYPE tenant_tier AS ENUM ('Starter', 'Pro', 'Enterprise');
CREATE TYPE tenant_status AS ENUM ('active', 'warning', 'critical', 'suspended');
CREATE TYPE threat_severity AS ENUM ('critical', 'high', 'medium', 'low');
CREATE TYPE threat_status AS ENUM ('pending_review', 'analyst_review', 'triaged', 'takedown_filed', 'dismissed');
CREATE TYPE threat_type AS ENUM ('ACCOUNT_LOOKALIKE', 'LIKENESS_CLONE', 'DISPLAY_NAME_CLONE', 'CHANNEL_IMPERSONATION', 'PHISHING_ACCOUNT', 'PERSISTENCE_ACCOUNT');
CREATE TYPE takedown_status AS ENUM ('awaiting_review', 'under_review', 'filed', 'dismissed');
CREATE TYPE takedown_report_type AS ENUM ('PLATFORM_TRUST_SAFETY', 'DMCA_NOTICE');
CREATE TYPE agent_type AS ENUM ('SENTINEL', 'RECON', 'VERITAS', 'NEXUS', 'ARBITER', 'WATCHDOG');
CREATE TYPE agent_status AS ENUM ('active', 'standby', 'paused', 'error');
CREATE TYPE platform_name AS ENUM ('instagram', 'tiktok', 'youtube', 'twitter', 'facebook', 'linkedin', 'threads', 'reddit', 'snapchat', 'pinterest', 'twitch');
CREATE TYPE feed_mode AS ENUM ('STREAM', 'POLL', 'REACTIVE', 'STREAM + POLL');

-- ── USERS ────────────────────────────────────────────────────────
CREATE TABLE users (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name VARCHAR(255) NOT NULL,
  email VARCHAR(255) UNIQUE NOT NULL,
  password_hash VARCHAR(255) NOT NULL,
  role user_role NOT NULL DEFAULT 'influencer',
  status VARCHAR(50) NOT NULL DEFAULT 'active',
  mfa_secret VARCHAR(255),
  mfa_enabled BOOLEAN NOT NULL DEFAULT false,
  influencer_id UUID, -- FK added after influencers table
  last_login_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ── INFLUENCERS (tenants) ────────────────────────────────────────
CREATE TABLE influencers (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name VARCHAR(255) NOT NULL,
  handle VARCHAR(255) NOT NULL,
  email VARCHAR(255),
  followers VARCHAR(50),
  tier tenant_tier NOT NULL DEFAULT 'Starter',
  status tenant_status NOT NULL DEFAULT 'active',
  bio TEXT,
  initials VARCHAR(5),
  color VARCHAR(20) DEFAULT '#7B3FE4',
  joined_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

ALTER TABLE users ADD CONSTRAINT fk_user_influencer
  FOREIGN KEY (influencer_id) REFERENCES influencers(id) ON DELETE SET NULL;

-- ── INFLUENCER PLATFORMS ──────────────────────────────────────────
CREATE TABLE influencer_platforms (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  influencer_id UUID NOT NULL REFERENCES influencers(id) ON DELETE CASCADE,
  platform platform_name NOT NULL,
  handle VARCHAR(255),
  platform_user_id VARCHAR(255),
  access_token TEXT,
  token_expires_at TIMESTAMPTZ,
  status VARCHAR(50) NOT NULL DEFAULT 'active',
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(influencer_id, platform)
);

-- ── THREAT ACTORS ────────────────────────────────────────────────
CREATE TABLE threat_actors (
  id VARCHAR(50) PRIMARY KEY, -- e.g. TA-2841
  ttps TEXT[],
  linked_count INT DEFAULT 0,
  first_seen_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  last_seen_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  notes TEXT
);

-- ── THREATS (IOI Alerts) ──────────────────────────────────────────
CREATE TABLE threats (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  influencer_id UUID NOT NULL REFERENCES influencers(id) ON DELETE CASCADE,
  platform platform_name NOT NULL,
  type threat_type NOT NULL,
  severity threat_severity NOT NULL,
  status threat_status NOT NULL DEFAULT 'pending_review',
  -- Threat account details
  fake_handle VARCHAR(255) NOT NULL,
  fake_display_name VARCHAR(255),
  fake_url VARCHAR(500),
  fake_avatar_url VARCHAR(500),
  fake_posts INT DEFAULT 0,
  fake_followers VARCHAR(50),
  -- Detection
  oci_score SMALLINT NOT NULL DEFAULT 0, -- 0-100
  ioi_indicators TEXT[] NOT NULL DEFAULT '{}',
  ttps VARCHAR(255),
  threat_actor_id VARCHAR(50) REFERENCES threat_actors(id),
  -- Assignment
  assigned_analyst_id UUID REFERENCES users(id),
  detected_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  resolved_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_threats_influencer ON threats(influencer_id);
CREATE INDEX idx_threats_status ON threats(status);
CREATE INDEX idx_threats_severity ON threats(severity);
CREATE INDEX idx_threats_detected ON threats(detected_at DESC);

-- ── OCI PROFILES (Likeness Vault) ────────────────────────────────
CREATE TABLE oci_profiles (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  influencer_id UUID NOT NULL REFERENCES influencers(id) ON DELETE CASCADE,
  platform platform_name NOT NULL,
  handle VARCHAR(255) NOT NULL,
  display_name VARCHAR(255),
  bio TEXT,
  followers VARCHAR(50),
  avatar_url VARCHAR(500),
  -- Perceptual fingerprints
  phash VARCHAR(64),
  dhash VARCHAR(64),
  vector_id VARCHAR(100) UNIQUE,
  -- Flags
  is_verified BOOLEAN DEFAULT false,
  is_clone BOOLEAN DEFAULT false,
  similarity_score SMALLINT, -- if clone: 0-100
  threat_id UUID REFERENCES threats(id),
  captured_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_oci_influencer ON oci_profiles(influencer_id);
CREATE INDEX idx_oci_clones ON oci_profiles(is_clone) WHERE is_clone = true;

-- ── TAKEDOWN QUEUE ───────────────────────────────────────────────
CREATE TABLE takedowns (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  threat_id UUID NOT NULL REFERENCES threats(id),
  influencer_id UUID NOT NULL REFERENCES influencers(id),
  platform platform_name NOT NULL,
  report_type takedown_report_type NOT NULL,
  status takedown_status NOT NULL DEFAULT 'awaiting_review',
  priority threat_severity NOT NULL DEFAULT 'high',
  -- Prepared by ARBITER
  fake_handle VARCHAR(255) NOT NULL,
  oci_score SMALLINT,
  evidence TEXT[] NOT NULL DEFAULT '{}',
  agent_id VARCHAR(50),
  -- HITL: analyst review
  assigned_analyst_id UUID REFERENCES users(id),
  analyst_notes TEXT,
  authorised_by_id UUID REFERENCES users(id),
  authorised_at TIMESTAMPTZ,
  filed_at TIMESTAMPTZ,
  dismissed_at TIMESTAMPTZ,
  dismiss_reason TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_takedowns_status ON takedowns(status);
CREATE INDEX idx_takedowns_influencer ON takedowns(influencer_id);

-- ── AI AGENTS ────────────────────────────────────────────────────
CREATE TABLE agents (
  id VARCHAR(50) PRIMARY KEY, -- e.g. SEN-01
  name VARCHAR(100) NOT NULL,
  type agent_type NOT NULL,
  platform VARCHAR(50) DEFAULT 'all',
  status agent_status NOT NULL DEFAULT 'standby',
  description TEXT,
  -- Metrics (updated by agent heartbeat)
  health_pct SMALLINT DEFAULT 100,
  cpu_pct SMALLINT DEFAULT 0,
  mem_pct SMALLINT DEFAULT 0,
  tasks_completed INT DEFAULT 0,
  alerts_raised INT DEFAULT 0,
  scan_rate VARCHAR(50),
  last_heartbeat_at TIMESTAMPTZ,
  -- Permissions
  approved_scopes TEXT[] NOT NULL DEFAULT '{}',
  blocked_scopes TEXT[] NOT NULL DEFAULT '{}',
  hitl_required BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ── FEED CONFIGURATIONS ──────────────────────────────────────────
CREATE TABLE feed_configs (
  id platform_name PRIMARY KEY,
  display_name VARCHAR(100) NOT NULL,
  icon VARCHAR(20),
  color VARCHAR(20),
  mode feed_mode NOT NULL DEFAULT 'POLL',
  connected BOOLEAN NOT NULL DEFAULT false,
  auth_type VARCHAR(100),
  tier_label VARCHAR(100),
  -- Quota tracking
  quota_daily INT,
  quota_monthly INT,
  quota_unit VARCHAR(50) DEFAULT 'calls',
  quota_used INT NOT NULL DEFAULT 0,
  quota_reset_at TIMESTAMPTZ,
  -- Metrics
  alerts_today INT NOT NULL DEFAULT 0,
  variants_watched INT NOT NULL DEFAULT 0,
  last_poll_at TIMESTAMPTZ,
  -- Config JSON (endpoints, rate limits, auto config)
  endpoints JSONB NOT NULL DEFAULT '[]',
  rate_limits JSONB NOT NULL DEFAULT '{}',
  auto_config JSONB NOT NULL DEFAULT '{}',
  ioi_signals TEXT[] NOT NULL DEFAULT '{}',
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ── HANDLE VARIANTS (typosquat watchlist) ────────────────────────
CREATE TABLE handle_variants (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  influencer_id UUID NOT NULL REFERENCES influencers(id) ON DELETE CASCADE,
  platform platform_name NOT NULL,
  original_handle VARCHAR(255) NOT NULL,
  variant VARCHAR(255) NOT NULL,
  variant_type VARCHAR(50) NOT NULL, -- TYPOSQUAT, SEPARATOR, SUFFIX, HOMOGLYPH, DISPLAY_NAME, TRUNCATION
  is_flagged BOOLEAN DEFAULT false,
  threat_id UUID REFERENCES threats(id),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(influencer_id, platform, variant)
);

CREATE INDEX idx_variants_influencer ON handle_variants(influencer_id);
CREATE INDEX idx_variants_flagged ON handle_variants(is_flagged) WHERE is_flagged = true;

-- ── AUDIT LOG ────────────────────────────────────────────────────
CREATE TABLE audit_log (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  actor_id UUID REFERENCES users(id),
  actor_name VARCHAR(255),
  action VARCHAR(100) NOT NULL, -- e.g. TAKEDOWN_AUTHORISED, THREAT_DISMISSED
  entity_type VARCHAR(50), -- takedown, threat, agent, user
  entity_id UUID,
  metadata JSONB,
  ip_address INET,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_audit_actor ON audit_log(actor_id);
CREATE INDEX idx_audit_action ON audit_log(action);
CREATE INDEX idx_audit_created ON audit_log(created_at DESC);

-- ── REFRESH TOKENS ───────────────────────────────────────────────
CREATE TABLE refresh_tokens (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  token_hash VARCHAR(255) NOT NULL UNIQUE,
  expires_at TIMESTAMPTZ NOT NULL,
  revoked_at TIMESTAMPTZ,
  ip_address INET,
  user_agent TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_refresh_tokens_user ON refresh_tokens(user_id);
CREATE INDEX idx_refresh_tokens_hash ON refresh_tokens(token_hash);

-- ── UPDATED_AT TRIGGER ───────────────────────────────────────────
CREATE OR REPLACE FUNCTION update_updated_at()
RETURNS TRIGGER AS $$
BEGIN NEW.updated_at = NOW(); RETURN NEW; END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_users_updated BEFORE UPDATE ON users FOR EACH ROW EXECUTE FUNCTION update_updated_at();
CREATE TRIGGER trg_influencers_updated BEFORE UPDATE ON influencers FOR EACH ROW EXECUTE FUNCTION update_updated_at();
CREATE TRIGGER trg_threats_updated BEFORE UPDATE ON threats FOR EACH ROW EXECUTE FUNCTION update_updated_at();
CREATE TRIGGER trg_takedowns_updated BEFORE UPDATE ON takedowns FOR EACH ROW EXECUTE FUNCTION update_updated_at();
CREATE TRIGGER trg_agents_updated BEFORE UPDATE ON agents FOR EACH ROW EXECUTE FUNCTION update_updated_at();
CREATE TRIGGER trg_feeds_updated BEFORE UPDATE ON feed_configs FOR EACH ROW EXECUTE FUNCTION update_updated_at();
