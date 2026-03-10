# Deployment Guide

**Last Updated:** 2026-03-09T00:00:00Z
**AI-Parseable:** Yes

---

## 🤖 AI Deployment Summary

**Platform:** Railway (both services)
**Backend builder:** Dockerfile (Python 3.11, non-root user)
**Frontend builder:** Nixpacks (Node.js, npm start)
**Database:** Railway-managed PostgreSQL
**Deploy trigger:** `railway up --detach` from CLI (no GitHub Actions CI/CD)
**Rollback:** Re-deploy previous commit via `railway up` or Railway dashboard
**Estimated deploy time:** Backend ~4min, Frontend ~2min

---

## Environments

### Production (only environment)
- **Backend:** https://backend-production-b4cc.up.railway.app
- **Frontend:** https://frontend-production-e530.up.railway.app
- **Database:** Railway Postgres (internal hostname + TCP proxy)
- **Railway Project ID:** `cef2a37f-4313-4974-8d59-77f6325bdd54`
- **Railway Environment ID:** `883c6fe4-6780-4ab5-bcf9-7732bc563a47`

### Local Development
- **Backend:** `http://localhost:5001` (run from project root with `flask run` or gunicorn)
- **Frontend:** `http://localhost:3000` (`npm run dev` in `frontend/`)
- **Database:** Railway Postgres TCP proxy (same DB, different hostname)
- **Env file:** `frontend/.env.local` — `NEXT_PUBLIC_API_URL=http://localhost:5001/api`

---

## Service IDs (Railway)

| Service | ID | Directory |
|---------|-----|-----------|
| Backend | `1515a398-e2d2-45c5-8b1f-cce1d6f85535` | `/` (project root) |
| Frontend | `8476b699-ce8f-4bcb-883a-ebc333fc7dd4` | `/frontend` |

---

## Deploy Commands

```bash
# Deploy backend (from project root /Users/JB/Documents/Synergies)
railway up --detach

# Deploy frontend (from frontend dir)
cd frontend && railway up --detach

# Check which service is linked
railway status
```

**⚠️ Context matters:** `railway up` deploys the service linked to the current directory. Backend is linked to root; frontend is linked to `frontend/`.

---

## Environment Variables

### Backend (Railway backend service)
| Variable | Purpose | How to set |
|----------|---------|-----------|
| `DATABASE_URL` | PostgreSQL connection string | Auto-set by Railway when Postgres is linked |
| `JWT_SECRET_KEY` | JWT signing key | `railway variables set JWT_SECRET_KEY=...` |
| `SECRET_KEY` | Flask session key | `railway variables set SECRET_KEY=...` |
| `ANTHROPIC_API_KEY` | Claude API key (brief extraction + refine) | `railway variables set ANTHROPIC_API_KEY=...` |
| `FLASK_ENV` | `production` | Set in Dockerfile or Railway |

### Frontend (Railway frontend service)
| Variable | Purpose | How to set |
|----------|---------|-----------|
| `NEXT_PUBLIC_API_URL` | Backend URL | `railway variables --service frontend set NEXT_PUBLIC_API_URL=...` |
| `ANTHROPIC_API_KEY` | Claude API key (chat route) | `railway variables --service frontend set ANTHROPIC_API_KEY=...` |

**⚠️ Critical gotcha:** `ANTHROPIC_API_KEY` must be set on **both** services independently. Missing it on frontend = chat 500. Missing it on backend = brief extraction and refine 500.

**⚠️ Variable name must be clean:** No leading spaces, no emoji prefix. Verify with `railway variables`.

---

## Dockerfile (Backend)

```
Base: python:3.11-slim
Non-root user: synergies (uid 1000)
Installs: requirements.txt from /workspace (project ROOT — NOT backend/requirements.txt)
Entry: /workspace/start.sh
```

**Key rules:**
- `CMD` uses shell form (`start.sh`) so `$PORT` expands — exec form `["gunicorn", ...]` would NOT expand `$PORT`
- `requirements.txt` at root is what gets installed — `backend/requirements.txt` is NOT used by Docker build
- Adding a new Python package → add to `/requirements.txt` (root), then redeploy

---

## railway.json (Backend)

```json
{
  "build": { "builder": "DOCKERFILE" },
  "deploy": {
    "releaseCommand": "python -c \"from backend.app import create_app; from backend.extensions import db; app = create_app('production'); ctx = app.app_context(); ctx.push(); db.create_all(); print('Schema ready')\" || echo 'DB init deferred'",
    "startCommand": "/workspace/start.sh",
    "healthcheckPath": "/health",
    "healthcheckTimeout": 300,
    "restartPolicyType": "ON_FAILURE",
    "restartPolicyMaxRetries": 3
  }
}
```

**releaseCommand rules:**
- Must always exit 0 — non-zero permanently blocks deployment
- `db.create_all()` only creates NEW tables — it does NOT run ALTER TABLE
- Schema changes (new columns) must be applied manually via psql against TCP proxy

---

## Schema Migration (Critical)

For any `ALTER TABLE` / new column:

```bash
# Connect directly to Railway Postgres
psql "postgresql://postgres:<password>@maglev.proxy.rlwy.net:47787/railway"

# Apply migration
ALTER TABLE deal_levers ADD COLUMN IF NOT EXISTS my_new_col TEXT;

# Verify
SELECT column_name FROM information_schema.columns WHERE table_name='deal_levers';
```

**Never use `db.create_all()` for ALTER TABLE** — it silently ignores existing tables.

---

## Health Checks

### Backend
- **Endpoint:** `GET /health`
- **Expected:** `{"status": "ok"}`
- **Checked by:** Railway every 30s; must respond within 300s post-deploy

### Frontend
- **Endpoint:** `GET /` (homepage)
- **Expected:** 200 OK
- **Timeout:** 120s

### Manual verification
```bash
curl https://backend-production-b4cc.up.railway.app/health
curl https://frontend-production-e530.up.railway.app/
```

---

## Rollback

1. Find the previous good commit: `git log --oneline`
2. Checkout: `git checkout <commit-sha>`
3. Redeploy: `railway up --detach` (backend) + `cd frontend && railway up --detach`
4. Verify: `curl /health`

**Estimated rollback time:** ~6 minutes (build + deploy)

---

## Demo Credentials

| Email | Password | Role |
|-------|---------|------|
| demo@synergies.ai | Demo1234! | admin |

---

## Common Deployment Issues

| Issue | Symptom | Root Cause | Fix |
|-------|---------|------------|-----|
| releaseCommand exits non-zero | Deploy permanently blocked | Python import error in `create_app` | Fix import, redeploy; releaseCommand always has `\|\| echo 'deferred'` fallback |
| $PORT not expanding | 500 on all requests | Dockerfile CMD uses exec form | Ensure CMD calls `start.sh` (shell form) |
| Models not found at startup | 500 on first query | SQLAlchemy mapper init fails silently | Import all models in `__init__.py` model block |
| Chat returning 500 | `/api/chat` fails | `ANTHROPIC_API_KEY` missing on frontend service | `railway variables --service frontend set ANTHROPIC_API_KEY=sk-ant-...` |
| Brief extraction returning 500 | `populate-from-brief` fails | `ANTHROPIC_API_KEY` missing on backend service | `railway variables set ANTHROPIC_API_KEY=sk-ant-...` |
| openpyxl ImportError | Excel export 500 | Package only in `backend/requirements.txt`, not root | Add to root `/requirements.txt` |

**AI Tags:** `#deployment`, `#railway`, `#dockerfile`, `#schema`, `#gotchas`
