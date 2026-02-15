# M&A Synergies Analysis Tool

**Purpose:** AI-powered tool to identify and quantify synergy opportunities in M&A transactions

**Test Project:** Weekend autonomous operation test using Kimi K2.5

---

## What This Tool Does

Analyzes potential synergies across business functions and provides:
- Research-backed synergy opportunities by function (IT, HR, Finance, Operations, Sales)
- Industry-specific patterns (Healthcare, Tech, Finance, Manufacturing, Retail)
- Historical examples and value estimates
- Interactive dashboard for exploration

---

## Project Structure

```
synergies-tool/
├── backend/          # Flask API and data models
├── frontend/         # HTML/JS dashboard
├── data/            # JSON data files
├── research/        # Research findings and sources
├── tests/           # Unit tests
└── docs/            # Documentation
```

---

## Tech Stack

- **Backend:** Python 3.11, Flask, SQLite
- **Frontend:** HTML5, Vanilla JS, Tailwind CSS
- **Research:** Web scraping (BeautifulSoup, requests)
- **Testing:** pytest

---

## Quick Start

```bash
# Install dependencies
pip install -r requirements.txt

# Run backend
python backend/api.py

# Open frontend
open frontend/index.html
```

---

## Test Scope (Weekend MVP)

**Saturday:**
- Data model shells
- Research engine
- Gather synergy patterns from web

**Sunday:**
- Build UI dashboard
- Populate with research data
- Create demo with dummy data

**Deliverable:** Working demo showing 20-30 synergy opportunities

---

## Success Metrics

- [ ] 5+ synergy types defined
- [ ] 7+ business functions covered
- [ ] 5+ industries researched
- [ ] 50+ synergy examples gathered
- [ ] Working UI with filters
- [ ] 20-30 synergies in demo
- [ ] Tests passing

---

## Autonomous Operation

This project is designed to be built autonomously by Kimi K2.5 over 8-12 hours.

See `PROJECT_SPEC.md` for detailed requirements.
See `EXECUTION_PLAN.md` for Saturday startup instructions.
