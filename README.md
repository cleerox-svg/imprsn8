# imprsn8 — Influencer Identity Protection Platform

## Structure
- `frontend/` — React app (Cloudflare Pages)
- `backend/` — Node.js API (Railway)

## Quick start (local)
See the deployment guide for full instructions.

### Frontend
```
cd frontend
npm install
npm run dev  →  http://localhost:5173
```

### Backend
```
cd backend
cp .env.example .env   # fill in values
npm install
node src/db/migrate.js
node src/db/seed.js
npm run dev  →  http://localhost:4000
```

## Demo accounts
- admin@imprsn8.io / admin123
- soc@imprsn8.io / soc1234
- aria@ariavale.com / influencer1
- zoe@zoehartley.com / influencer2
