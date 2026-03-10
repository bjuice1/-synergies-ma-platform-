# Data Flow Map

**Last Updated:** 2026-03-09T00:00:00Z
**AI-Parseable:** Yes

---

## 🤖 AI Flow Summary

**Sources:** 4 (deal brief text, APQC benchmark dataset, analyst diligence Q&A, Anthropic API)
**Transformations:** 5 (brief extraction, lever seeding, $ calculation, AI refinement, Excel export)
**Primary output:** `deal_levers.calculated_value_low/high` and `refined_pct_low/high`
**Critical bottleneck:** Sync Claude API calls (~2s, blocks Gunicorn thread)

---

## Core Pipeline

```
Deal Brief (text paste)
  → Claude Haiku: extract company fields (JSON)
  → companies.revenue_usd, employees, products, tech_stack

combined_revenue = acquirer.revenue_usd + target.revenue_usd

BenchmarkDataPoints (project × lever × synergy_pct)
  → min/median/max per lever
  → DealLever.benchmark_pct_low/high/median

DealLever.calculated_value_low  = benchmark_pct_low  × combined_revenue
DealLever.calculated_value_high = benchmark_pct_high × combined_revenue

Analyst fills diligence Q&A → environment_data {question: answer}

"Refine estimate ✦" button
  → Claude Haiku: Q&A + benchmark bounds → deal-specific pct + rationale
  → DealLever.refined_pct_low/high + refinement_rationale
  → DealLever.calculated_value_low/high UPDATED
```

---

## Data Sources

### 1. Deal Briefing Document
- **Storage:** `deals.deal_briefing_document` (TEXT)
- **Entered via:** `DealBriefExtractor` component (text paste) or deal form field
- **Processing:** `POST /api/deals/<id>/populate-from-brief` → Claude Haiku JSON extraction
- **Fields extracted:** revenue, employees, deal_size, deal_type, strategic_rationale, close_date, geography, products, tech_stack
- **Update policy:** Null-safe, never overwrites existing analyst data
- **AI Tags:** `#data-source`, `#unstructured`, `#llm-extraction`

### 2. APQC Benchmark Dataset
- **Storage:** `benchmark_projects` (7 rows) + `benchmark_datapoints` (~49 rows)
- **Schema:** `project_id × lever_id × synergy_pct` (% of combined revenue)
- **Populated by:** `backend/seed_data.py`
- **⚠️ Current state:** 7 fake synthetic deals — real APQC data NOT yet imported
- **Used by:** Lever seeding on deal creation; `min/median/max` per lever
- **AI Tags:** `#data-source`, `#benchmark`, `#technical-debt`

### 3. Analyst Diligence Q&A
- **Storage:** `deal_levers.environment_data` (JSONB, `{question: answer}`)
- **Entered via:** LeverCard inline inputs; autosave after 1.5s debounce
- **Pre-population:** `prePopulateChecklist()` in `leverSubtypes.ts` fills known answers from company fields
- **Also auto-filled:** `populate-from-brief` endpoint fills diligence questions from brief text
- **Triggers refinement:** When ≥1 answer filled, "Refine estimate ✦" button activates
- **AI Tags:** `#data-source`, `#analyst-input`, `#diligence`

### 4. Anthropic Claude Haiku
- **Backend calls (Python SDK `from anthropic import Anthropic`):**
  - Brief extraction: ~500 tokens in, ~300 out → ~$0.002/call
  - Lever refinement: ~400 tokens in, ~200 out → ~$0.001/call
- **Frontend calls (`@ai-sdk/anthropic` streaming):**
  - Chat: playbook context ~2000 tokens + conversation history → variable cost
- **Rate limit:** Not enforced; Haiku allows ~4000 req/min
- **Timeout:** None set explicitly ⚠️
- **AI Tags:** `#data-source`, `#external-api`, `#anthropic`

---

## Transformations

| Transform | File:Line | Input | Output | Duration | Failure Mode |
|-----------|-----------|-------|--------|----------|--------------|
| Brief extraction | `deals_routes.py:populate_from_brief` | Raw text | Company field updates | ~2s | Regex fallback; field-level try/except |
| Lever seeding | `deals_routes.py:seed_deal_levers` | BenchmarkDataPoints | DealLever rows | <100ms | `min/max/median` on empty set → null pcts |
| $ calculation | `deals_routes.py` | pct × combined_rev | `calculated_value_low/high` | <1ms | None if combined_rev=0 → values stay null |
| AI refinement | `deals_routes.py:refine_lever_estimate` | Q&A + benchmark | `refined_pct` + rationale | ~2s | JSON parse regex fallback |
| Excel export | `deals_routes.py:export_excel` | All DealLevers | `.xlsx` 3-sheet workbook | <500ms | `benchmark_pct None` guard required |

---

## Database Queries (Key Patterns)

| Query | Location | Index | Performance |
|-------|----------|-------|-------------|
| `DealLever.query.filter_by(deal_id=X)` | `get_deal_levers()` | `idx_deal_levers_deal_id` | 🟢 Fast |
| `BenchmarkDataPoint.query.filter_by(lever_id=X)` | Lever seeding | `idx_benchmark_datapoints_lever_id` | 🟢 Fast |
| `LeverComment.query.filter_by(deal_lever_id=X)` | `get_lever_comments()` | `idx_lever_comments_deal_lever_id` | 🟢 Fast |
| `Synergy.query.filter_by(deal_lever_id=X)` | Activity loading | `idx_synergies_deal_lever_id` | 🟢 Fast |
| `User.query.order_by(first_name, last_name)` | `list_users()` | No index on name | 🟢 OK (small table) |

---

## Destinations

### DealLever Table
- **Primary key output of platform** — stores all benchmark + refined estimates
- **React Query cache key:** `['deal-levers', dealId]` — invalidated on any lever mutation
- **Updated by:** Lever seeding, PATCH status/notes/Q&A, refine endpoint, company revenue edit

### Frontend Cards
- **LeverCard:** Shows benchmark bar, $ range (or "Deal estimate ✦" if refined), Q&A section, rationale, comments
- **Dashboard:** KPI tiles aggregate `total_value_low/high` across all deals
- **Deals list:** Per-deal synergy bar with portfolio summary

### Excel Workbook
- **Sheet 1:** Summary — deal metrics + synergy totals by lever
- **Sheet 2:** Lever Breakdown — benchmark pct, baseline, $ range, status per lever
- **Sheet 3:** Activities — specific synergy items under each lever
- **Styling:** PwC orange (`#D04A02`) palette via openpyxl

---

## 🤖 Bottleneck Analysis

1. 🟠 **Fake benchmark data** — All estimates derived from 7 synthetic deals. Product risk until real APQC data imported.
2. 🟡 **Sync Claude calls** — 2s blocking HTTP response; acceptable now, will need async queue at scale.
3. 🟢 **React Query caching** — Lever data cached; LeverCard Q&A changes debounce-save; no redundant refetches.

**AI Tags:** `#data-flow`, `#pipeline`, `#bottleneck`, `#benchmark`
