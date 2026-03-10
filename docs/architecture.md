# Architecture Overview

**Last Updated:** 2026-03-09T00:00:00Z
**AI-Parseable:** Yes
**Analysis Confidence:** High

---

## 🤖 AI Summary

Synergies is a two-tier SaaS application: a Next.js 15 frontend (Railway Nixpacks) and a Flask 3.0 REST API (Railway Dockerfile), both connected to a Railway-managed PostgreSQL. Claude Haiku is called from **both** tiers for AI-assisted workflows.

**Verdict:** ⚠️ Sound for current scale (small team, <50 deals). Primary risks: no DB connection pooler, sync AI calls block Gunicorn threads, ANTHROPIC_API_KEY must be set on both Railway services independently.

---

## Components

### Frontend — Next.js 15 (Railway Nixpacks)
- **URL:** https://frontend-production-e530.up.railway.app
- **Entry:** `frontend/app/layout.tsx`
- **State:** React Query for server state; `useState` for UI
- **HTTP:** `axios` via `frontend/lib/api.ts` — JWT Bearer token injected via interceptor
- **AI:** `@ai-sdk/react` v6 `useChat` + `@ai-sdk/anthropic` — streaming via Next.js route handler at `/api/chat`
- **Auth:** JWT in localStorage; 401 interceptor → `/login`

### Backend — Flask 3.0 (Railway Dockerfile)
- **URL:** https://backend-production-b4cc.up.railway.app
- **Entry:** `backend/app/__init__.py → create_app()`
- **WSGI:** Gunicorn via `start.sh` (workers = 2×CPU+1)
- **Auth:** Flask-JWT-Extended; identity = `str(user.id)`, decoded with `int(get_jwt_identity())`
- **Critical:** ALL imports use `backend.app.*` — never `app.*`
- **Critical:** ALL SQLAlchemy models imported in `__init__.py` model block or mapper init fails silently

### Database — PostgreSQL (Railway)
- **Proxy:** `maglev.proxy.rlwy.net:47787`
- **ORM:** SQLAlchemy 2.0 + Flask-SQLAlchemy
- **Schema migrations:** `ALTER TABLE` directly against TCP proxy — Alembic releaseCommand only handles new tables via `db.create_all()`

### External — Anthropic Claude Haiku
- **Model:** `claude-haiku-4-5-20251001`
- **Backend uses:** `populate-from-brief` (brief extraction) + `refine` (diligence → estimate)
- **Frontend uses:** `/api/chat` route handler (knowledge assistant)
- **⚠️ Gotcha:** `ANTHROPIC_API_KEY` must be set on BOTH Railway services separately

---

## Architectural Decisions (Locked In)

| Decision | What | Why |
|----------|------|-----|
| Lever-first model | `DealLever` is primary output | Benchmark-grounded before advisory decomposition |
| % of combined revenue | All synergy = `pct × combined_revenue` | No cost baseline needed; consistent |
| Context injection (not tools) | Playbook text in system prompt | Simpler, faster for knowledge assistant |
| Sync AI calls | No background queue | ~2s OK now; async queue = future work |
| Rule-based lever auto-gen | `LEVER_ACTIVITY_TEMPLATES` dict | Fast, debuggable; LLM upgrade later |

---

## Directory Structure

```
/Users/JB/Documents/Synergies/
├── backend/
│   ├── app/
│   │   ├── __init__.py          # create_app() factory — critical
│   │   ├── models/              # Canonical SQLAlchemy models
│   │   │   ├── lever.py         # SynergyLever, DealLever, BenchmarkProject, LeverComment
│   │   │   ├── deal.py          # Deal
│   │   │   ├── company.py       # Company (revenue, employees, products, tech_stack)
│   │   │   ├── user.py          # User (role: analyst|admin)
│   │   │   ├── synergy.py       # Legacy activity tracking
│   │   │   └── playbook.py      # LeverPlaybook
│   │   └── extensions.py        # db, jwt singletons
│   ├── routes/                  # Flask blueprints (url_prefix=/api/*)
│   │   ├── deals_routes.py      # Deals CRUD, lever engine, AI endpoints
│   │   ├── auth_routes.py       # JWT login/refresh/me
│   │   ├── learn_routes.py      # Playbook CRUD (GET is PUBLIC for chatbot)
│   │   ├── users_routes.py      # User list
│   │   └── synergies_routes.py  # Legacy synergy CRUD
│   └── utils/auth_decorators.py # @require_role('analyst', 'admin')
├── frontend/
│   ├── app/
│   │   ├── api/chat/route.ts    # Streaming chat handler — calls Anthropic directly
│   │   ├── dashboard/page.tsx   # KPI overview + deal pipeline table
│   │   ├── deals/[id]/page.tsx  # Deal detail with lever cards + company inline edit
│   │   ├── deals/new/page.tsx   # New deal form + DealBriefExtractor
│   │   ├── learn/page.tsx       # Lever playbook workspace (inline editing)
│   │   └── chat/page.tsx        # AI knowledge assistant
│   ├── components/
│   │   ├── levers/LeverCard.tsx        # Core UI: benchmark bar, $ range, Q&A, refine, comments
│   │   └── deals/DealBriefExtractor.tsx # Brief paste → Claude extraction
│   └── lib/
│       ├── api.ts               # All axios API calls
│       ├── types.ts             # TypeScript interfaces
│       └── leverSubtypes.ts     # Sub-type breakdowns per lever
├── requirements.txt             # ROOT — used by Dockerfile (NOT backend/requirements.txt)
├── Dockerfile                   # Non-root user; copies start.sh
├── start.sh                     # Gunicorn with $PORT expansion
└── railway.json                 # Backend: releaseCommand + healthcheck
```

---

## 🤖 Bottleneck Indicators

- 🟡 **No PgBouncer** — direct psycopg2 to Railway Postgres; pool exhaustion at scale
- 🟡 **Sync Claude calls** — `populate-from-brief` and `refine` block HTTP threads ~2s each
- 🟡 **Single Gunicorn instance** — no horizontal scaling configured
- 🟢 **React Query caching** — reduces redundant API calls
- 🟢 **Lazy loading** — comments/users loaded only on expand

### Scale Readiness: 6/10
- ✅ Works for: 2–10 analysts, <50 concurrent deals, <100 levers
- ⚠️ Needs work at: >100 concurrent users, >5 AI calls/min sustained

**AI Tags:** `#architecture`, `#flask`, `#nextjs`, `#postgresql`, `#railway`, `#anthropic`
