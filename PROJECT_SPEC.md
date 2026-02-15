# PROJECT SPECIFICATION: M&A Synergies Analysis Tool

**Project ID:** SYNERGY-MVP-001
**Timeline:** 8-12 hours (Weekend autonomous build)
**Builder:** Kimi K2.5 (autonomous AI agent)
**Escalation:** Claude Sonnet/Opus for complex architecture decisions

---

## MISSION

Build a working demo of an M&A Synergies Analysis Tool that:
1. Shows research-backed synergy opportunities by business function
2. Filters by industry to show relevant patterns
3. Provides value estimates based on historical examples
4. Has a clean, professional UI ready for stakeholder demo

---

## COMPONENTS TO BUILD

### 1. DATA MODEL (Backend - 2 hours)

**File:** `backend/data_model.py`

**Synergy Types:**
- Cost Reduction (headcount, systems consolidation, vendor optimization)
- Revenue Enhancement (cross-sell, market expansion, pricing power)
- Operational Efficiency (process improvement, shared services, automation)
- Strategic (market position, IP, talent acquisition)

**Business Functions:**
- IT (systems, infrastructure, headcount, vendors)
- HR (benefits, headcount, shared services, HRIS)
- Finance (AP/AR, treasury, systems, headcount)
- Sales (CRM, territories, compensation, headcount)
- Operations (facilities, supply chain, manufacturing, distribution)
- Legal (contracts, compliance, IP)
- R&D (product roadmap, talent, facilities)

**Industries:**
- Healthcare (hospitals, pharma, medtech)
- Technology (SaaS, hardware, services)
- Financial Services (banking, insurance, fintech)
- Manufacturing (discrete, process)
- Retail (brick-and-mortar, e-commerce)

**Database Schema (SQLite):**
```sql
CREATE TABLE synergies (
    id INTEGER PRIMARY KEY,
    name TEXT NOT NULL,
    function TEXT NOT NULL,
    synergy_type TEXT NOT NULL,
    industry TEXT,
    description TEXT,
    value_min INTEGER,
    value_max INTEGER,
    timeframe TEXT,
    complexity TEXT,
    risk_level TEXT,
    examples TEXT,
    sources TEXT,
    created_at TIMESTAMP
);

CREATE TABLE functions (
    id INTEGER PRIMARY KEY,
    name TEXT NOT NULL,
    description TEXT,
    typical_synergies TEXT
);

CREATE TABLE industries (
    id INTEGER PRIMARY KEY,
    name TEXT NOT NULL,
    characteristics TEXT,
    common_synergies TEXT
);
```

---

### 2. RESEARCH ENGINE (Backend - 3-4 hours)

**File:** `backend/research_engine.py`

**Objective:** Gather real synergy examples from public sources

**Research Sources:**
1. **Consulting Firm Reports:**
   - McKinsey M&A reports
   - BCG synergy studies
   - Deloitte M&A insights
   - Bain M&A toolkit

2. **Academic Papers:**
   - Harvard Business Review M&A articles
   - Journal of Finance M&A studies

3. **Public Company Filings:**
   - Merger proxy statements (synergy targets)
   - Investor presentations (realized synergies)

**What to Extract:**
- Synergy type and function
- Industry context
- Value estimate ($ or % of revenue)
- Timeframe to realize
- Success factors
- Risk factors

**Output:** `data/synergies_research.json`

**Minimum:** 50 synergy examples across all functions and industries

**Research Plan by Function:**

**IT Synergies:**
- Cloud/data center consolidation (cost reduction)
- Software vendor rationalization (cost reduction)
- IT headcount optimization (cost reduction)
- Legacy system retirement (cost reduction)
- Cybersecurity consolidation (cost + risk reduction)

**HR Synergies:**
- Benefits plan harmonization (cost reduction)
- HR shared services (cost reduction)
- Headcount optimization (cost reduction)
- HRIS consolidation (cost reduction)
- Talent retention programs (risk mitigation)

**Finance Synergies:**
- AP/AR consolidation (cost reduction)
- Treasury optimization (revenue enhancement)
- Tax structure optimization (cost reduction)
- Financial systems consolidation (cost reduction)
- Working capital optimization (cash flow)

**Sales Synergies:**
- Cross-selling products (revenue enhancement)
- Sales territory optimization (revenue enhancement)
- CRM consolidation (cost reduction)
- Sales force optimization (cost reduction)

**Operations Synergies:**
- Manufacturing footprint optimization (cost reduction)
- Supply chain consolidation (cost reduction)
- Facilities consolidation (cost reduction)
- Logistics optimization (cost reduction)

---

### 3. BACKEND API (Flask - 2 hours)

**File:** `backend/api.py`

**Endpoints:**

```python
# Health check
GET /api/health

# Get all synergies (with filters)
GET /api/synergies?function=IT&industry=Healthcare

# Get synergy by ID
GET /api/synergies/<id>

# Get all functions
GET /api/functions

# Get all industries
GET /api/industries

# Get synergy summary stats
GET /api/stats
```

**Example Response:**
```json
{
  "synergies": [
    {
      "id": 1,
      "name": "Data Center Consolidation",
      "function": "IT",
      "synergy_type": "Cost Reduction",
      "industry": "Technology",
      "description": "Consolidate 5 data centers into 2, migrate to cloud",
      "value_min": 2000000,
      "value_max": 5000000,
      "timeframe": "12-18 months",
      "complexity": "High",
      "risk_level": "Medium",
      "examples": "Microsoft-LinkedIn saved $500M over 3 years",
      "sources": "McKinsey M&A Report 2023"
    }
  ],
  "count": 1
}
```

---

### 4. FRONTEND UI (HTML/JS - 3 hours)

**File:** `frontend/index.html`

**Pages:**

**Main Dashboard:**
```
┌─────────────────────────────────────────────────┐
│  M&A Synergies Analysis Tool                    │
├─────────────────────────────────────────────────┤
│                                                 │
│  Filters:                                       │
│  [Function ▼] [Industry ▼] [Synergy Type ▼]   │
│                                                 │
│  ┌──────────────────────────────────────────┐  │
│  │ Synergy Opportunities (32 found)         │  │
│  ├──────────────────────────────────────────┤  │
│  │ 💻 IT - Data Center Consolidation       │  │
│  │    $2M - $5M | 12-18 months | Healthcare │  │
│  ├──────────────────────────────────────────┤  │
│  │ 👥 HR - Benefits Harmonization          │  │
│  │    $500K - $1.5M | 6-12 months | All    │  │
│  ├──────────────────────────────────────────┤  │
│  │ 💰 Finance - AP/AR Consolidation        │  │
│  │    $300K - $800K | 3-6 months | All     │  │
│  └──────────────────────────────────────────┘  │
│                                                 │
│  Summary:                                       │
│  Total Value: $15M - $45M                      │
│  Functions: 7 | Industries: 5                  │
│                                                 │
└─────────────────────────────────────────────────┘
```

**Detail View (Modal or Slide-out):**
```
┌─────────────────────────────────────────────┐
│  Data Center Consolidation                  │
├─────────────────────────────────────────────┤
│  Function: IT                               │
│  Type: Cost Reduction                       │
│  Industry: Technology                       │
│                                             │
│  Description:                               │
│  Consolidate 5 data centers into 2 modern  │
│  facilities and migrate non-critical       │
│  workloads to cloud. Reduce power, cooling,│
│  and real estate costs.                    │
│                                             │
│  Value: $2M - $5M annually                 │
│  Timeframe: 12-18 months                   │
│  Complexity: High                          │
│  Risk: Medium                              │
│                                             │
│  Historical Examples:                      │
│  • Microsoft-LinkedIn: $500M over 3 years  │
│  • Salesforce-Slack: $400M over 2 years   │
│                                             │
│  Sources:                                   │
│  McKinsey M&A Report 2023                  │
│                                             │
│  [Close]                                    │
└─────────────────────────────────────────────┘
```

**Design Requirements:**
- Clean, professional appearance (use Tailwind CSS)
- Responsive (works on desktop and tablet)
- Fast filtering (client-side, no page reload)
- Color-coded by synergy type
- Icons for each function

---

### 5. DUMMY DATA (1 hour)

**File:** `data/dummy_data.json`

**Scenario:**
- **Target Company:** "TechCorp" (500 employees, $50M revenue, SaaS)
- **Acquirer:** "BigCo" (2000 employees, $200M revenue, Enterprise Software)
- **Industry:** Technology

**Populate with:**
- 20-30 specific synergies identified
- Mix across all functions
- Realistic value estimates based on company size
- Specific to tech industry where applicable

---

### 6. TESTS (1 hour)

**File:** `tests/test_api.py`

**Test Coverage:**
- API endpoints (health, synergies, functions, industries)
- Database operations (CRUD)
- Filtering logic
- Data validation

**Minimum:** 15 tests, 80% coverage

---

## RESEARCH REQUIREMENTS

### Minimum Research Targets

| Function | Min Examples | Industries |
|----------|--------------|------------|
| IT | 10 | All 5 |
| HR | 8 | All 5 |
| Finance | 8 | All 5 |
| Sales | 6 | Tech, Retail, Financial Services |
| Operations | 8 | Manufacturing, Retail, Healthcare |
| Legal | 5 | All 5 |
| R&D | 5 | Tech, Healthcare, Manufacturing |

**Total:** 50+ synergy examples

### Value Estimation Guidelines

Use these ranges based on company size:

**Small ($10M-50M revenue):**
- IT synergies: $50K - $500K
- HR synergies: $100K - $300K
- Finance synergies: $50K - $200K

**Mid ($50M-500M revenue):**
- IT synergies: $500K - $5M
- HR synergies: $300K - $2M
- Finance synergies: $200K - $1M

**Large ($500M+ revenue):**
- IT synergies: $5M - $50M
- HR synergies: $2M - $10M
- Finance synergies: $1M - $10M

---

## QUALITY STANDARDS

### Code Quality
- [ ] All functions documented
- [ ] Type hints where applicable
- [ ] Error handling for API calls
- [ ] Logging for debugging

### Data Quality
- [ ] All synergies have sources cited
- [ ] Value estimates are realistic
- [ ] Industry context is accurate
- [ ] Examples are from reputable sources

### UI Quality
- [ ] Professional appearance
- [ ] No broken links or images
- [ ] Filters work correctly
- [ ] Responsive on 1440px+ screens

---

## PROGRESS TRACKING

### Git Commits
- Commit every 30 minutes with descriptive messages
- Use conventional commit format: `feat:`, `fix:`, `docs:`

### Session Log
Update `SESSION_LOG.md` every hour with:
- Tasks completed
- Blockers encountered
- Next steps

### Kill Switch
Check for `STOP_NOW` file every 15 minutes

---

## ESCALATION CRITERIA

**Escalate to Claude Sonnet if:**
- Research sources are paywalled or inaccessible
- Architecture decision needed (database design, API structure)
- Complex bug that can't be fixed in 30 minutes

**Escalate to Claude Opus if:**
- Fundamental design flaw discovered
- Major technical blocker (can't proceed)

---

## DELIVERABLE CHECKLIST

**By end of weekend:**
- [ ] Database with 50+ synergies
- [ ] Working Flask API (5 endpoints)
- [ ] Frontend dashboard with filters
- [ ] Dummy data for demo company
- [ ] 15+ tests passing
- [ ] README with demo instructions
- [ ] SESSION_LOG.md with findings
- [ ] Git repo with 20+ commits

---

## SUCCESS = DEMO-READY

**Can you show this to a stakeholder and:**
1. Filter synergies by IT function → See 10+ opportunities
2. Filter by Healthcare industry → See relevant examples
3. Click a synergy → See detailed description, value, timeline
4. Show total potential value → $15M-$45M across all synergies

**If YES → Success**
**If NO → Document what's missing for next iteration**

---

## TIME BUDGET

| Component | Time | Priority |
|-----------|------|----------|
| Data model | 2h | P0 |
| Research engine | 4h | P0 |
| Backend API | 2h | P0 |
| Frontend UI | 3h | P0 |
| Dummy data | 1h | P0 |
| Tests | 1h | P1 |
| Polish | 1h | P2 |

**Total:** 12-14 hours over weekend

---

**START BUILDING. PROGRESS OVER PERFECTION. SHIP THE DEMO.**
