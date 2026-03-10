# Codebase Overview

**Last Updated:** 2026-03-09T00:00:00Z
**AI-Parseable:** Yes

---

## 🤖 AI Codebase Summary

**Primary Language:** Python (backend) + TypeScript (frontend)
**Backend Framework:** Flask 3.0
**Frontend Framework:** Next.js 15 (App Router)
**Database ORM:** SQLAlchemy 2.0
**AI Integration:** Anthropic Python SDK (backend) + @ai-sdk/anthropic (frontend)
**Deployment:** Railway (Dockerfile + Nixpacks)
**Complexity Score:** 6/10 — non-trivial benchmark data model; otherwise clean Flask/React patterns
**Tech Debt Score:** 5/10 — fake benchmark data is primary debt; duplicate model definitions in backup dirs

---

## Tech Stack

### Backend
| Package | Version | Purpose |
|---------|---------|---------|
| Flask | 3.0.0 | Web framework |
| Flask-JWT-Extended | 4.6.0 | JWT authentication |
| Flask-SQLAlchemy | 3.1.1 | ORM |
| SQLAlchemy | 2.0.23 | Database queries |
| Flask-Limiter | 3.5.0 | Rate limiting |
| Flask-CORS | 4.0.0 | Cross-origin headers |
| Flask-Talisman | 1.1.0 | Security headers |
| Flask-Migrate / Alembic | 4.0.5 / 1.13.1 | Schema migrations (partially used) |
| gunicorn | 21.2.0 | WSGI server |
| psycopg2-binary | 2.9.9 | PostgreSQL driver |
| anthropic | >=0.75.0 | Claude API (brief extraction, refinement) |
| openpyxl | >=3.1.0 | Excel export |
| bcrypt | 4.1.2 | Password hashing |

### Frontend
| Package | Version | Purpose |
|---------|---------|---------|
| next | 15.x | App Router framework |
| react | 18.x | UI library |
| @tanstack/react-query | 5.x | Server state + caching |
| axios | latest | HTTP client |
| @ai-sdk/anthropic | ^3.0.50 | Claude streaming (chat) |
| @ai-sdk/react | latest | `useChat` hook (ai SDK v6) |
| tailwindcss | latest | Utility CSS |
| lucide-react | latest | Icons |
| framer-motion | latest | Animations |
| recharts | latest | Charts (analytics page) |
| zod | latest | Schema validation |
| zustand | latest | Client state (minimal use) |

---

## Database Schema (Active Tables)

### Core Business Tables
| Table | Purpose | Key Columns |
|-------|---------|-------------|
| `users` | Analyst accounts | `email`, `role` (analyst\|admin), `first_name`, `last_name` |
| `companies` | Acquirer/target companies | `name`, `revenue_usd`, `employees`, `products` (JSON), `tech_stack` (JSON) |
| `deals` | M&A transactions | `name`, `deal_type`, `deal_size_usd`, `acquirer_id`, `target_id`, `status`, `deal_briefing_document` |

### Lever/Benchmark Tables (Primary System)
| Table | Purpose | Key Columns |
|-------|---------|-------------|
| `synergy_levers` | Functional buckets (IT, Finance, HR…) | `name`, `lever_type` (cost\|revenue), `sort_order` |
| `benchmark_projects` | Comparable M&A deals | `name`, `combined_revenue_usd`, `industry` |
| `benchmark_datapoints` | project × lever × pct | `project_id`, `lever_id`, `synergy_pct` (% of combined rev) |
| `deal_cost_baselines` | Client spend per function | `deal_id`, `lever_id`, `company_id`, `annual_cost_usd` |
| `deal_levers` | Primary output per deal | `benchmark_pct_low/high/median`, `refined_pct_low/high`, `calculated_value_low/high`, `status`, `confidence`, `environment_data` (JSONB), `assigned_to_id` |
| `lever_comments` | Comment threads per lever | `deal_lever_id`, `user_id`, `body`, `created_at` |
| `lever_playbooks` | Methodology workspace | `lever_id`, `what_it_is`, `what_drives_it`, `diligence_questions` (JSON), `red_flags` (JSON), `team_notes` |

### Legacy Tables (Active but Secondary)
| Table | Purpose | Notes |
|-------|---------|-------|
| `synergies` | Synergy activity items | Linked to `deal_levers` via `deal_lever_id` FK; auto-generated from templates |
| `synergy_metrics` | Value breakdown per activity | Used by legacy metrics endpoint |
| `workflow_transitions` | Status history | Linked to synergies |

---

## Key Files Reference

| File | Purpose | Criticality |
|------|---------|-------------|
| `backend/app/__init__.py` | App factory; blueprint registration; model imports | 🔴 Critical |
| `backend/app/models/lever.py` | DealLever, SynergyLever, BenchmarkProject, LeverComment, DealCostBaseline | 🔴 Critical |
| `backend/routes/deals_routes.py` | Deal CRUD, lever engine, AI endpoints, Excel export | 🔴 Critical |
| `backend/routes/learn_routes.py` | Playbook CRUD (GET is public) | 🟠 High |
| `backend/routes/auth_routes.py` | JWT login/refresh; identity must be string | 🟠 High |
| `backend/utils/auth_decorators.py` | `@require_role` decorator | 🟠 High |
| `frontend/app/api/chat/route.ts` | Streaming chat handler; ai SDK v6 | 🟠 High |
| `frontend/components/levers/LeverCard.tsx` | Core UI: benchmark, Q&A, refine, comments, assignment | 🟠 High |
| `frontend/app/deals/[id]/page.tsx` | Deal detail page: lever cards + company inline edit | 🟠 High |
| `frontend/lib/api.ts` | All axios API calls; JWT interceptor | 🟠 High |
| `frontend/lib/types.ts` | TypeScript interfaces for all entities | 🟡 Medium |
| `frontend/lib/leverSubtypes.ts` | Sub-type breakdowns + `prePopulateChecklist()` | 🟡 Medium |
| `requirements.txt` (ROOT) | Python deps used by Dockerfile | 🔴 Critical — NOT `backend/requirements.txt` |
| `start.sh` | Gunicorn entrypoint with $PORT expansion | 🔴 Critical |

---

## Coding Patterns

### Backend

**Blueprint pattern:**
```python
from flask import Blueprint
bp = Blueprint('deals', __name__, url_prefix='/api/deals')

@bp.route('/<int:deal_id>/levers', methods=['GET'])
@require_role('analyst', 'admin')
def get_deal_levers(deal_id):
    ...
```

**Import prefix (mandatory):**
```python
from backend.app.models.lever import DealLever  # ✅
from app.models.lever import DealLever           # ❌ breaks pre-flight validation
```

**Auth decorator:**
```python
from backend.utils.auth_decorators import require_role
from flask_jwt_extended import get_jwt_identity

user_id = int(get_jwt_identity())  # identity stored as string, must cast to int
```

**Error handling:**
```python
try:
    # ...
    db.session.commit()
    return jsonify(result), 200
except Exception as e:
    db.session.rollback()
    logger.error(f"...: {e}", exc_info=True)
    return jsonify({'error': 'Internal server error'}), 500
```

### Frontend

**React Query pattern:**
```typescript
const { data: leversData, isLoading } = useQuery({
  queryKey: ['deal-levers', dealId],
  queryFn: () => dealsApi.getLevers(dealId),
  enabled: !!dealId,
});
```

**Optimistic UI + rollback:**
```typescript
const prev = currentStatus;
setCurrentStatus(newStatus);  // optimistic
try {
  const updated = await dealsApi.updateLever(lever.deal_id, lever.id, { status: newStatus });
  onUpdated?.(updated);
} catch {
  setCurrentStatus(prev);  // rollback
}
```

**ai SDK v6 (BREAKING changes from v3):**
```typescript
// ✅ v6
const { messages, sendMessage, status } = useChat({ transport: new DefaultChatTransport({...}) });
sendMessage({ text: input });
// message.parts[] (not message.content string)

// ❌ v3 (does NOT work)
const { input, handleSubmit, isLoading } = useChat();
```

---

## Directory Structure — What to Ignore

```
/Users/JB/Documents/Synergies/
├── backup_20260216_*/    # Old backup snapshots — DO NOT MODIFY
├── frontend/.next/       # Next.js build output — gitignored
├── frontend/node_modules/ # npm packages — gitignored
├── backend/__pycache__/  # Python cache — gitignored
├── drift_history.json    # Import consistency tracking (31 duplicate model defs in backups)
├── prd.json              # Task list (statuses unreliable — use git log instead)
└── *.png                 # Screenshot archives from development sessions
```

---

## 🤖 Technical Debt

| Item | Severity | Effort | Impact |
|------|----------|--------|--------|
| Fake benchmark data (7 synthetic deals) | 🟠 High | 2 weeks | All estimates are fabricated comparables |
| Duplicate model definitions in backup dirs | 🟡 Medium | 1 day | Confusing, inflates file count |
| No Alembic migrations (manual ALTER TABLE) | 🟡 Medium | 1 week | Schema changes require psql access |
| No background jobs for AI calls | 🟡 Medium | 1 week | Sync calls block Gunicorn threads |
| Legacy synergy tables rarely used | 🟢 Low | 2 days | Dead weight; could be archived |
| No API versioning | 🟢 Low | 3 days | Breaking changes would affect frontend |

**AI Tags:** `#codebase`, `#flask`, `#nextjs`, `#sqlalchemy`, `#technical-debt`, `#patterns`
