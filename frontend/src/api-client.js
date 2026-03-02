// ── src/api.js ─────────────────────────────────────────────────
// Drop this into your frontend src/ directory alongside App.jsx

const BASE = import.meta.env.VITE_API_URL || 'http://localhost:4000';

// ── Token management ──────────────────────────────────────────────
let accessToken = null;

export function setAccessToken(t) { accessToken = t; }
export function clearTokens() {
  accessToken = null;
  localStorage.removeItem('imprsn8_refresh');
}

function saveRefreshToken(t) { localStorage.setItem('imprsn8_refresh', t); }
function getRefreshToken() { return localStorage.getItem('imprsn8_refresh'); }

// ── Core fetch wrapper ────────────────────────────────────────────
async function request(path, options = {}) {
  const headers = { 'Content-Type': 'application/json', ...options.headers };
  if (accessToken) headers['Authorization'] = `Bearer ${accessToken}`;

  const res = await fetch(`${BASE}${path}`, { ...options, headers });

  // Auto-refresh on 401 TOKEN_EXPIRED
  if (res.status === 401) {
    const body = await res.clone().json().catch(() => ({}));
    if (body.code === 'TOKEN_EXPIRED') {
      const refreshed = await tryRefresh();
      if (refreshed) {
        headers['Authorization'] = `Bearer ${accessToken}`;
        const retry = await fetch(`${BASE}${path}`, { ...options, headers });
        if (!retry.ok) throw await retry.json();
        return retry.json();
      }
    }
    throw body;
  }

  if (!res.ok) {
    const err = await res.json().catch(() => ({ error: 'Network error' }));
    throw err;
  }

  return res.status === 204 ? null : res.json();
}

async function tryRefresh() {
  const refresh = getRefreshToken();
  if (!refresh) return false;
  try {
    const data = await fetch(`${BASE}/api/auth/refresh`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ refreshToken: refresh }),
    }).then(r => r.json());
    if (data.accessToken) {
      setAccessToken(data.accessToken);
      saveRefreshToken(data.refreshToken);
      return true;
    }
  } catch {}
  clearTokens();
  return false;
}

const get = (path) => request(path);
const post = (path, body) => request(path, { method: 'POST', body: JSON.stringify(body) });
const patch = (path, body) => request(path, { method: 'PATCH', body: JSON.stringify(body) });
const del = (path) => request(path, { method: 'DELETE' });

// ── Auth ──────────────────────────────────────────────────────────
export const auth = {
  async login(email, password) {
    const data = await post('/api/auth/login', { email, password });
    if (!data.requiresMFA) {
      setAccessToken(data.accessToken);
      saveRefreshToken(data.refreshToken);
    }
    return data;
  },
  async verifyMFA(mfaToken, code) {
    const data = await post('/api/auth/verify-mfa', { mfaToken, code });
    setAccessToken(data.accessToken);
    saveRefreshToken(data.refreshToken);
    return data;
  },
  async logout() {
    const refresh = getRefreshToken();
    await post('/api/auth/logout', { refreshToken: refresh }).catch(() => {});
    clearTokens();
  },
  async me() { return get('/api/auth/me'); },
  async setupMFA() { return post('/api/auth/setup-mfa', {}); },
  async confirmMFA(code) { return post('/api/auth/confirm-mfa', { code }); },
  async tryRestore() {
    const refreshToken = getRefreshToken();
    if (!refreshToken) return null;
    const ok = await tryRefresh();
    if (!ok) return null;
    const { user } = await auth.me();
    return user;
  },
};

// ── Threats ───────────────────────────────────────────────────────
export const threats = {
  list: (params = {}) => get(`/api/threats?${new URLSearchParams(params)}`),
  get: (id) => get(`/api/threats/${id}`),
  update: (id, data) => patch(`/api/threats/${id}`, data),
};

// ── Influencers ───────────────────────────────────────────────────
export const influencers = {
  list: () => get('/api/influencers'),
  get: (id) => get(`/api/influencers/${id}`),
  create: (data) => post('/api/influencers', data),
  update: (id, data) => patch(`/api/influencers/${id}`, data),
};

// ── Takedowns ─────────────────────────────────────────────────────
export const takedowns = {
  list: (params = {}) => get(`/api/takedowns?${new URLSearchParams(params)}`),
  get: (id) => get(`/api/takedowns/${id}`),
  authorise: (id, analyst_notes) => post(`/api/takedowns/${id}/authorise`, { analyst_notes }),
  dismiss: (id, reason) => post(`/api/takedowns/${id}/dismiss`, { reason }),
};

// ── Agents ────────────────────────────────────────────────────────
export const agents = {
  list: () => get('/api/agents'),
  get: (id) => get(`/api/agents/${id}`),
};

// ── OCI ───────────────────────────────────────────────────────────
export const oci = {
  list: (params = {}) => get(`/api/oci?${new URLSearchParams(params)}`),
  create: (data) => post('/api/oci', data),
};

// ── Feeds ─────────────────────────────────────────────────────────
export const feeds = {
  list: () => get('/api/feeds'),
  get: (id) => get(`/api/feeds/${id}`),
  update: (id, data) => patch(`/api/feeds/${id}`, data),
};

// ── Users ─────────────────────────────────────────────────────────
export const users = {
  list: () => get('/api/users'),
  create: (data) => post('/api/users', data),
  setStatus: (id, status) => patch(`/api/users/${id}/status`, { status }),
};

// ── Admin ─────────────────────────────────────────────────────────
export const admin = {
  stats: () => get('/api/admin/stats'),
  auditLog: (params = {}) => get(`/api/admin/audit-log?${new URLSearchParams(params)}`),
};

// ── Health ────────────────────────────────────────────────────────
export const health = () => fetch(`${BASE}/health`).then(r => r.json());
