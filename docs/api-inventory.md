# API Inventory

**Last Updated:** 2026-03-09T00:00:00Z
**AI-Parseable:** Yes

---

## 🤖 AI API Summary

**Internal endpoints (backend):** 33
**Internal endpoints (frontend):** 1 (streaming chat)
**External APIs called:** 1 (Anthropic Claude Haiku)
**Authentication methods:** JWT Bearer (all protected endpoints), None (GET /api/learn is public)
**Rate limiting:** Flask-Limiter configured; specific limits not audited per-endpoint
**Excel export:** ✅ Implemented (openpyxl, 3-sheet workbook)

---

## Authentication

- **Method:** JWT (Flask-JWT-Extended)
- **Login:** `POST /api/auth/login` — returns `access_token` + `refresh_token`
- **Token:** Bearer token in `Authorization` header
- **Expiry:** Access token: 1 day; Refresh token: 30 days
- **Storage:** Frontend localStorage
- **Identity:** `str(user.id)` in JWT sub; decoded with `int(get_jwt_identity())`
- **Guard decorator:** `@require_role('analyst', 'admin')` in `backend/utils/auth_decorators.py`
- **⚠️ Exception:** `GET /api/learn` and `GET /api/learn/<lever_id>` are **PUBLIC** — no auth required (chatbot reads playbooks without JWT)

---

## Internal Endpoints — Backend (Flask, base: /api)

### Auth (`backend/routes/auth_routes.py`)

| Method | Path | Auth | Purpose |
|--------|------|------|---------|
| POST | `/auth/login` | None | Email/password login → JWT tokens |
| POST | `/auth/refresh` | Refresh JWT | Rotate access token |
| GET | `/auth/me` | JWT | Current user info |

### Deals (`backend/routes/deals_routes.py`, prefix: `/deals`)

| Method | Path | Auth | Purpose |
|--------|------|------|---------|
| GET | `/deals` | JWT | List all deals with optional status/acquirer/target filters |
| POST | `/deals` | JWT | Create deal (with acquirer + target companies) |
| GET | `/deals/<id>` | JWT | Get deal with companies, synergies, lever summary |
| PUT | `/deals/<id>` | JWT | Update deal fields |
| DELETE | `/deals/<id>` | JWT | Delete deal |
| POST | `/deals/<id>/generate-synergies` | JWT | Rule-based synergy activity generation |
| GET | `/deals/<id>/levers` | JWT | Get all DealLevers with activities, benchmark data, summary stats |
| PATCH | `/deals/<id>/levers/<lever_id>` | JWT | Update lever: status, confidence, advisor_notes, environment_data, assigned_to_id |
| GET | `/deals/<id>/levers/<lever_id>/comments` | JWT | List comments on a lever |
| POST | `/deals/<id>/levers/<lever_id>/comments` | JWT | Post comment on a lever |
| POST | `/deals/<id>/levers/<lever_id>/refine` | JWT | AI estimate refinement from diligence Q&A |
| POST | `/deals/<id>/populate-from-brief` | JWT | Extract company fields from deal brief via Claude |
| GET | `/deals/<id>/export/excel` | JWT | Download 3-sheet Excel workbook |
| PATCH | `/deals/companies/<company_id>` | JWT | Update company revenue, employees, name |

#### Key Response Shapes

**GET /deals/<id>/levers:**
```json
{
  "deal_id": 1,
  "levers": [{
    "id": 29, "lever_name": "IT", "lever_type": "cost",
    "benchmark_pct_low": 0.85, "benchmark_pct_high": 1.93, "benchmark_pct_median": 1.4,
    "benchmark_n": 7,
    "calculated_value_low": 4800000, "calculated_value_high": 10900000,
    "refined_pct_low": 0.85, "refined_pct_high": 1.55,
    "refinement_rationale": "...",
    "status": "in_analysis", "confidence": "medium",
    "advisor_notes": "...", "environment_data": {"Q": "A"},
    "assigned_to_id": 2, "assigned_to_name": "Jane Smith",
    "activities": [{"id": 1, "description": "...", "value_low": 1000000, ...}]
  }],
  "summary": {
    "total_cost_synergy_low": 25400000,
    "total_cost_synergy_high": 38400000,
    "combined_revenue": 565000000
  }
}
```

### Learn / Playbooks (`backend/routes/learn_routes.py`, prefix: `/learn`)

| Method | Path | Auth | Purpose |
|--------|------|------|---------|
| GET | `/learn` | **None** | List all levers with playbook content (public — chatbot reads this) |
| GET | `/learn/<lever_id>` | **None** | Get single lever + playbook (public) |
| PUT | `/learn/<lever_id>` | JWT | Update playbook fields (analyst/admin only) |

**Playbook fields:** `what_it_is`, `what_drives_it`, `diligence_questions` (JSON array), `red_flags` (JSON array), `team_notes`

### Users (`backend/routes/users_routes.py`, prefix: `/users`)

| Method | Path | Auth | Purpose |
|--------|------|------|---------|
| GET | `/users` | JWT | List all users (for assignment dropdown) |

### Synergies (legacy, `backend/routes/synergies_routes.py`, prefix: `/synergies`)

| Method | Path | Auth | Purpose |
|--------|------|------|---------|
| GET | `/synergies` | JWT | List synergy activities (with filters) |
| POST | `/synergies` | JWT | Create synergy activity |
| GET | `/synergies/<id>` | JWT | Get synergy + metrics + workflow |
| PUT | `/synergies/<id>` | JWT | Update synergy |
| DELETE | `/synergies/<id>` | JWT | Delete synergy |
| GET | `/synergies/<id>/metrics` | JWT | Get value breakdown metrics |
| GET | `/synergies/<id>/workflow` | JWT | Get workflow transition history |

### Industries (legacy, `backend/routes/industries_routes.py`)

| Method | Path | Auth | Purpose |
|--------|------|------|---------|
| GET | `/industries` | JWT | List industries |
| POST | `/industries` | JWT | Create industry |
| GET | `/industries/<id>` | JWT | Get industry |
| PUT | `/industries/<id>` | JWT | Update industry |
| DELETE | `/industries/<id>` | JWT | Delete industry |

---

## Internal Endpoint — Frontend (Next.js)

### Chat Route (`frontend/app/api/chat/route.ts`)

| Method | Path | Auth | Purpose |
|--------|------|------|---------|
| POST | `/api/chat` | None (frontend-only) | Streaming AI chat via Anthropic; playbook context fetched from `/api/learn` on every request |

**Request body (ai SDK v6 format):**
```json
{
  "messages": [...UIMessage objects...],
  "playbookContext": "...lever playbook text injected as system prompt..."
}
```

**Response:** Server-sent events stream (`toUIMessageStreamResponse()`)

**AI SDK version:** `@ai-sdk/anthropic ^3.0.50` — uses `DefaultChatTransport`, `sendMessage({text})`, `UIMessage.parts[]`, `await convertToModelMessages(messages)`

---

## External API — Anthropic Claude

| Call | From | Model | Purpose | Approx Cost |
|------|------|-------|---------|-------------|
| Brief extraction | Backend (Python SDK) | claude-haiku-4-5-20251001 | JSON field extraction from unstructured brief | ~$0.002 |
| Lever refinement | Backend (Python SDK) | claude-haiku-4-5-20251001 | Deal-specific pct from diligence Q&A | ~$0.001 |
| Chat response | Frontend (ai SDK stream) | claude-haiku-4-5-20251001 | Knowledge assistant over playbook content | ~$0.003–0.01/message |

**Authentication:**
- Backend: `ANTHROPIC_API_KEY` env var on Railway **backend** service
- Frontend: `ANTHROPIC_API_KEY` env var on Railway **frontend** service (separate — must be set independently)

**⚠️ No circuit breaker** — Claude API failures propagate directly as 500 errors. No retry logic, no fallback.

---

## Frontend API Client (`frontend/lib/api.ts`)

All backend calls go through `axios` instance with:
- `baseURL: process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5001/api'`
- JWT injected via request interceptor
- 401 → remove token + redirect to `/login`

**API object exports:**
- `authApi` — login, logout
- `dealsApi` — full deal + lever operations
- `companiesApi` — company field updates
- `learnApi` — playbook CRUD
- `usersApi` — user list
- `synergiesApi`, `industriesApi`, `functionsApi`, `categoriesApi` — legacy

---

## 🤖 AI API Health Analysis

### Security Concerns
- 🟡 `GET /learn` is intentionally public — acceptable for knowledge assistant, but leaks lever methodology to unauthenticated requests
- 🟢 All write operations require `analyst` or `admin` role
- 🟢 JWT with reasonable expiry
- 🟡 No rate limiting confirmed on AI endpoints (`/populate-from-brief`, `/refine`) — could be expensive if abused

### Missing Patterns
- ❌ No circuit breaker for Anthropic API calls
- ❌ No timeout set on Claude API calls
- ❌ No retry logic for transient Anthropic failures
- ❌ No API versioning (`/api/v1/...`)

### Recommendations
1. Add `@limiter.limit("10/hour")` to `populate-from-brief` and `refine` endpoints
2. Add `timeout=30` to Anthropic client calls
3. Add try/except with user-friendly error message for Anthropic failures

**AI Tags:** `#api`, `#endpoints`, `#jwt`, `#anthropic`, `#security`
