// ── src/workers/rateGovernor.js ──────────────────────────────────
import { redis } from '../config/redis.js';
import { logger } from '../config/env.js';

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
const jitter = (ms) => Math.floor(Math.random() * ms);

export class RateGovernor {
  constructor(platform, config) {
    this.platform = platform;
    this.config = config; // { daily, monthly, unit, reservePct }
    this.backoffMs = 0;
    this.keyDaily = `quota:${platform}:daily`;
    this.keyHourly = `quota:${platform}:hourly`;
  }

  async getUsed() {
    const [daily, hourly] = await Promise.all([
      redis.get(this.keyDaily),
      redis.get(this.keyHourly),
    ]);
    return { daily: parseInt(daily || 0), hourly: parseInt(hourly || 0) };
  }

  async consume(cost = 1, lane = 'SENTINEL') {
    const used = await this.getUsed();
    const max = this.config.daily || this.config.monthly;

    if (max) {
      const reserveAmt = Math.floor(max * (this.config.reservePct || 20) / 100);
      const available = max - reserveAmt - used.daily;

      if (lane !== 'HIGH' && available <= 0) {
        logger.warn(`[RateGovernor] ${this.platform} quota exhausted for lane ${lane}`);
        return false;
      }
    }

    const multi = redis.multi();
    multi.incr(this.keyDaily);
    multi.expire(this.keyDaily, 86400);
    multi.incr(this.keyHourly);
    multi.expire(this.keyHourly, 3600);
    await multi.exec();
    return true;
  }

  async withBackoff(fn, priority = 'NORMAL') {
    while (true) {
      try {
        const canProceed = await this.consume(1, priority);
        if (!canProceed) {
          await sleep(60000 + jitter(5000));
          continue;
        }
        const result = await fn();
        this.backoffMs = 0;
        return result;
      } catch (err) {
        if (err.status === 429 || err.response?.status === 429) {
          this.backoffMs = Math.min((this.backoffMs || 60000) * 2, 900000);
          const delay = this.backoffMs + jitter(5000);
          logger.warn(`[RateGovernor] ${this.platform} 429 — backing off ${delay}ms`);
          await sleep(delay);
          continue;
        }
        throw err;
      }
    }
  }
}

// ── src/workers/feedIngestor.js ──────────────────────────────────
import axios from 'axios';
import { Queue, Worker } from 'bullmq';
import { redis } from '../config/redis.js';
import { query } from '../config/db.js';
import { env } from '../config/env.js';
import { RateGovernor } from './rateGovernor.js';
import { logger } from '../config/env.js';

// ── POLL SCHEDULES ────────────────────────────────────────────────
export const POLL_CONFIGS = {
  twitter: {
    daily: null, monthly: 1000000, unit: 'tweets', reservePct: 20,
    polls: [
      { name: 'user_lookup', intervalMs: 900000, fn: pollTwitterUsers },
      { name: 'recent_search', intervalMs: 300000, fn: pollTwitterSearch },
    ],
  },
  tiktok: {
    daily: 1000, monthly: null, unit: 'queries', reservePct: 20,
    polls: [
      { name: 'user_info', intervalMs: 3600000, fn: pollTikTokUsers },
      { name: 'video_query', intervalMs: 7200000, fn: pollTikTokVideos },
    ],
  },
  instagram: {
    daily: 4800, monthly: null, unit: 'calls', reservePct: 20,
    polls: [
      { name: 'business_discovery', intervalMs: 1800000, fn: pollInstagramDiscovery },
      { name: 'hashtag_media', intervalMs: 3600000, fn: pollInstagramHashtags },
      { name: 'mentions', intervalMs: 900000, fn: pollInstagramMentions },
    ],
  },
  facebook: {
    daily: null, monthly: null, unit: 'calls/hr', reservePct: 20,
    polls: [
      { name: 'page_search', intervalMs: 3600000, fn: pollFacebookPages },
    ],
  },
  youtube: {
    daily: 10000, monthly: null, unit: 'units', reservePct: 20,
    polls: [
      { name: 'channel_search', intervalMs: 3600000, fn: pollYouTubeChannels },
      { name: 'video_search', intervalMs: 7200000, fn: pollYouTubeVideos },
    ],
  },
  linkedin: {
    daily: 100, monthly: null, unit: 'calls', reservePct: 20,
    polls: [
      { name: 'company_search', intervalMs: 86400000, fn: pollLinkedInCompanies },
    ],
  },
  reddit: {
    daily: null, monthly: null, unit: 'req/min', reservePct: 0,
    polls: [
      { name: 'user_search', intervalMs: 3600000, fn: pollReddit },
    ],
  },
  threads: {
    daily: 4800, monthly: null, unit: 'calls', reservePct: 20,
    polls: [
      { name: 'user_posts', intervalMs: 3600000, fn: pollThreads },
    ],
  },
};

// ── IOI EVENT QUEUE ───────────────────────────────────────────────
export const ioiQueue = new Queue('ioi-events', {
  connection: redis,
  defaultJobOptions: { attempts: 3, backoff: { type: 'exponential', delay: 5000 } },
});

// ── PLATFORM POLL FUNCTIONS ───────────────────────────────────────
async function getWatchedHandles(platform) {
  const result = await query(
    `SELECT hv.variant, hv.influencer_id, i.name as influencer_name, i.handle as original_handle
     FROM handle_variants hv
     JOIN influencers i ON i.id = hv.influencer_id
     JOIN influencer_platforms ip ON ip.influencer_id = i.id AND ip.platform = $1
     WHERE hv.platform = $1 AND NOT hv.is_flagged`,
    [platform]
  );
  return result.rows;
}

async function raiseIOIAlert(data) {
  logger.info(`[SENTINEL] IOI Alert: ${data.platform} / ${data.fake_handle} (${data.ioi_type})`);
  await ioiQueue.add('ioi-alert', data, { priority: data.severity === 'critical' ? 1 : 3 });

  // Update feed config alerts counter
  await query(
    'UPDATE feed_configs SET alerts_today = alerts_today + 1 WHERE id = $1',
    [data.platform]
  );
}

// X/Twitter
async function pollTwitterUsers(governor) {
  if (!env.TWITTER_BEARER_TOKEN) return;
  const handles = await getWatchedHandles('twitter');
  const batches = [];
  for (let i = 0; i < handles.length; i += 100) batches.push(handles.slice(i, i + 100));

  for (const batch of batches) {
    await governor.withBackoff(async () => {
      const usernames = batch.map(h => h.variant).join(',');
      const res = await axios.get(`https://api.twitter.com/2/users/by`, {
        params: { usernames, 'user.fields': 'name,description,profile_image_url,verified,verified_type' },
        headers: { Authorization: `Bearer ${env.TWITTER_BEARER_TOKEN}` },
      });

      for (const twitterUser of (res.data.data || [])) {
        const matched = batch.find(h => h.variant.toLowerCase() === twitterUser.username.toLowerCase());
        if (matched) {
          await raiseIOIAlert({
            platform: 'twitter', influencer_id: matched.influencer_id,
            fake_handle: `@${twitterUser.username}`, ioi_type: 'HANDLE_TYPOSQUAT',
            severity: 'high', raw_profile: twitterUser,
          });
          await query('UPDATE handle_variants SET is_flagged=true WHERE influencer_id=$1 AND platform=$2 AND variant=$3',
            [matched.influencer_id, 'twitter', matched.variant]);
        }
      }
    });
  }
  await query("UPDATE feed_configs SET last_poll_at=NOW() WHERE id='twitter'");
}

async function pollTwitterSearch() { /* Stream handled separately */ }

// TikTok
async function pollTikTokUsers(governor) {
  if (!env.TIKTOK_CLIENT_KEY) return;
  // Get token first
  let token;
  try {
    const tokenRes = await axios.post('https://open.tiktokapis.com/v2/oauth/token/', {
      client_key: env.TIKTOK_CLIENT_KEY, client_secret: env.TIKTOK_CLIENT_SECRET,
      grant_type: 'client_credentials',
    });
    token = tokenRes.data.access_token;
  } catch (err) {
    logger.error('[TikTok] Token error', { error: err.message });
    return;
  }

  const handles = await getWatchedHandles('tiktok');
  for (const h of handles.slice(0, 50)) { // TikTok: 1 per request
    await governor.withBackoff(async () => {
      const res = await axios.post('https://open.tiktokapis.com/v2/research/user/info/',
        { username: h.variant, fields: 'display_name,bio_description,avatar_url,follower_count' },
        { headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' } }
      );
      if (res.data.data?.user) {
        await raiseIOIAlert({
          platform: 'tiktok', influencer_id: h.influencer_id,
          fake_handle: `@${h.variant}`, ioi_type: 'HANDLE_VARIANT', severity: 'medium',
          raw_profile: res.data.data.user,
        });
      }
    });
  }
  await query("UPDATE feed_configs SET last_poll_at=NOW() WHERE id='tiktok'");
}

async function pollTikTokVideos(governor) { /* video keyword search */ }

// Instagram
async function pollInstagramDiscovery(governor) {
  const tokens = [env.INSTAGRAM_ACCESS_TOKEN, env.INSTAGRAM_ACCESS_TOKEN_2, env.INSTAGRAM_ACCESS_TOKEN_3].filter(Boolean);
  if (!tokens.length) return;
  let tokenIdx = 0;
  const getToken = () => tokens[tokenIdx++ % tokens.length];

  const handles = await getWatchedHandles('instagram');
  for (const h of handles.slice(0, 30)) {
    await governor.withBackoff(async () => {
      const token = getToken();
      try {
        const res = await axios.get(`https://graph.instagram.com/v21.0/me`, {
          params: {
            fields: `business_discovery.fields(name,biography,profile_picture_url,followers_count,username)`,
            username: h.variant, access_token: token,
          },
        });
        if (res.data.business_discovery) {
          await raiseIOIAlert({
            platform: 'instagram', influencer_id: h.influencer_id,
            fake_handle: `@${h.variant}`, ioi_type: 'HANDLE_VARIANT', severity: 'medium',
            raw_profile: res.data.business_discovery,
          });
        }
      } catch (err) {
        if (err.response?.status !== 404) throw err;
      }
    });
  }
  await query("UPDATE feed_configs SET last_poll_at=NOW() WHERE id='instagram'");
}

async function pollInstagramHashtags(governor) { /* hashtag monitoring */ }
async function pollInstagramMentions(governor) { /* mention monitoring */ }

// Facebook
async function pollFacebookPages(governor) {
  if (!env.FACEBOOK_PAGE_TOKEN) return;
  const influencers = (await query('SELECT name FROM influencers WHERE status != $1', ['suspended'])).rows;
  for (const inf of influencers) {
    await governor.withBackoff(async () => {
      const res = await axios.get('https://graph.facebook.com/v21.0/search', {
        params: { type: 'page', q: inf.name, fields: 'name,category,fan_count,verification_status', access_token: env.FACEBOOK_PAGE_TOKEN },
      });
      for (const page of (res.data.data || [])) {
        if (page.name.toLowerCase().includes(inf.name.toLowerCase()) && !page.verification_status) {
          logger.info(`[Facebook] Potential impersonator page: ${page.name}`);
        }
      }
    });
  }
  await query("UPDATE feed_configs SET last_poll_at=NOW() WHERE id='facebook'");
}

// YouTube
async function pollYouTubeChannels(governor) {
  const keys = [env.YOUTUBE_API_KEY_1, env.YOUTUBE_API_KEY_2, env.YOUTUBE_API_KEY_3, env.YOUTUBE_API_KEY_4].filter(Boolean);
  if (!keys.length) return;
  let keyIdx = 0;
  const getKey = () => keys[keyIdx++ % keys.length];
  const influencers = (await query('SELECT name, id FROM influencers')).rows;
  for (const inf of influencers) {
    await governor.withBackoff(async () => {
      const res = await axios.get('https://www.googleapis.com/youtube/v3/search', {
        params: { part: 'snippet', type: 'channel', q: inf.name, maxResults: 20, key: getKey() },
      });
      for (const item of (res.data.items || [])) {
        if (item.snippet.channelTitle.toLowerCase().includes(inf.name.toLowerCase())) {
          logger.info(`[YouTube] Potential impersonator channel: ${item.snippet.channelTitle}`);
        }
      }
    });
  }
  await query("UPDATE feed_configs SET last_poll_at=NOW() WHERE id='youtube'");
}

async function pollYouTubeVideos(governor) { /* video search */ }
async function pollLinkedInCompanies(governor) { /* company search */ }
async function pollReddit(governor) { /* user/subreddit search */ }
async function pollThreads(governor) { /* posts search */ }

// ── INGESTOR ORCHESTRATOR ─────────────────────────────────────────
export async function startFeedIngestors() {
  logger.info('[FeedIngestor] Starting all platform ingestors...');

  for (const [platform, config] of Object.entries(POLL_CONFIGS)) {
    const governor = new RateGovernor(platform, config);

    for (const poll of config.polls) {
      let running = false;

      const run = async () => {
        if (running) return;
        running = true;
        try {
          logger.debug(`[${platform}] Running ${poll.name}`);
          await poll.fn(governor);
        } catch (err) {
          logger.error(`[${platform}] ${poll.name} error`, { error: err.message });
        } finally {
          running = false;
        }
      };

      // Run immediately on start, then on interval
      run();
      setInterval(run, poll.intervalMs);
      logger.info(`[${platform}] ${poll.name} scheduled every ${poll.intervalMs / 60000}min`);
    }
  }
}

// ── IOI EVENT PROCESSOR ───────────────────────────────────────────
export const ioiWorker = new Worker('ioi-events', async (job) => {
  const data = job.data;
  logger.info('[IOI Worker] Processing alert', { platform: data.platform, handle: data.fake_handle });

  // Check if threat already exists
  const existing = await query(
    'SELECT id FROM threats WHERE fake_handle = $1 AND influencer_id = $2 AND platform = $3',
    [data.fake_handle, data.influencer_id, data.platform]
  );
  if (existing.rows[0]) return; // Dedup

  // Create threat record
  const threatResult = await query(
    `INSERT INTO threats (influencer_id, platform, type, severity, status, fake_handle, oci_score, ioi_indicators)
     VALUES ($1,$2,$3,$4,'pending_review',$5,$6,$7) RETURNING id`,
    [
      data.influencer_id, data.platform,
      data.ioi_type === 'HANDLE_TYPOSQUAT' ? 'ACCOUNT_LOOKALIKE' : 'ACCOUNT_LOOKALIKE',
      data.severity || 'medium', data.fake_handle,
      0, [data.ioi_type],
    ]
  );

  // Queue for ARBITER if OCI score is high enough
  if ((data.oci_score || 0) >= 70) {
    await query(
      `INSERT INTO takedowns (threat_id, influencer_id, platform, report_type, fake_handle, oci_score, evidence, agent_id)
       VALUES ($1,$2,$3,'PLATFORM_TRUST_SAFETY',$4,$5,$6,'ARBITER-01')`,
      [threatResult.rows[0].id, data.influencer_id, data.platform, data.fake_handle, data.oci_score, [data.ioi_type]]
    );
  }
}, { connection: redis, concurrency: 5 });
