# Research Plan for M&A Synergies

**Objective:** Gather 50+ real-world synergy examples from public sources

**Timeline:** Saturday afternoon (4 hours)

---

## Research Targets

### IT Synergies (10 examples)

**Search queries:**
- "M&A IT systems consolidation synergies"
- "Data center consolidation merger savings"
- "Cloud migration M&A synergies"
- "IT vendor rationalization acquisition"

**Expected findings:**
1. Data center consolidation (5+ examples)
2. Cloud migration synergies (3+ examples)
3. Vendor rationalization (2+ examples)

**Value ranges:** $500K - $50M depending on company size

---

### HR Synergies (8 examples)

**Search queries:**
- "M&A HR benefits harmonization"
- "Merger headcount optimization synergies"
- "HRIS consolidation acquisition savings"

**Expected findings:**
1. Benefits harmonization (3+ examples)
2. Headcount optimization (3+ examples)
3. HRIS consolidation (2+ examples)

**Value ranges:** $200K - $10M depending on company size

---

### Finance Synergies (8 examples)

**Search queries:**
- "M&A finance function consolidation"
- "Treasury optimization merger synergies"
- "AP AR consolidation acquisition"

**Expected findings:**
1. AP/AR consolidation (3+ examples)
2. Treasury optimization (2+ examples)
3. Financial systems consolidation (3+ examples)

**Value ranges:** $100K - $5M depending on company size

---

### Sales Synergies (6 examples)

**Search queries:**
- "M&A cross-selling synergies"
- "Sales force optimization merger"
- "CRM consolidation acquisition"

**Expected findings:**
1. Cross-selling opportunities (3+ examples)
2. Sales force optimization (2+ examples)
3. CRM consolidation (1+ examples)

**Value ranges:** $500K - $20M (revenue impact)

---

### Operations Synergies (8 examples)

**Search queries:**
- "Manufacturing footprint consolidation M&A"
- "Supply chain synergies merger"
- "Facility consolidation acquisition savings"

**Expected findings:**
1. Manufacturing/facility consolidation (4+ examples)
2. Supply chain optimization (3+ examples)
3. Logistics consolidation (1+ examples)

**Value ranges:** $1M - $50M depending on industry

---

### Legal Synergies (5 examples)

**Search queries:**
- "M&A legal department consolidation"
- "Contract management synergies merger"

**Expected findings:**
1. Contract management consolidation (2+ examples)
2. Compliance consolidation (2+ examples)
3. Shared legal services (1+ examples)

**Value ranges:** $100K - $2M

---

### R&D Synergies (5 examples)

**Search queries:**
- "R&D consolidation M&A synergies"
- "Product roadmap rationalization merger"
- "Innovation center consolidation acquisition"

**Expected findings:**
1. R&D facility consolidation (2+ examples)
2. Product roadmap rationalization (2+ examples)
3. Talent retention programs (1+ examples)

**Value ranges:** $500K - $10M

---

## Sources to Check

### Primary Sources (High Priority)
1. **McKinsey:** https://www.mckinsey.com/capabilities/mergers-and-acquisitions/insights
2. **BCG:** https://www.bcg.com/capabilities/mergers-acquisitions-transactions-pmi
3. **Deloitte:** https://www2.deloitte.com/us/en/pages/mergers-and-acquisitions/topics/m-and-a-consulting.html
4. **Bain:** https://www.bain.com/consulting-services/mergers-acquisitions/

### Secondary Sources
5. **Harvard Business Review:** Search for M&A synergy articles
6. **SEC Filings:** Merger proxy statements (search EDGAR for "synergies")
7. **Investor presentations:** Post-merger synergy realizations

### Industry-Specific Sources
8. **Healthcare:** HIMSS, Becker's Hospital Review
9. **Technology:** Gartner, Forrester
10. **Financial Services:** American Banker, The Financial Brand

---

## Data Extraction Template

For each synergy found, extract:

```json
{
  "name": "Short descriptive name",
  "function": "IT | HR | Finance | Sales | Operations | Legal | R&D",
  "synergy_type": "Cost Reduction | Revenue Enhancement | Operational Efficiency | Strategic",
  "industry": "Healthcare | Technology | Financial Services | Manufacturing | Retail",
  "description": "Detailed description of the synergy",
  "value_min": 0,  // Minimum value estimate in dollars
  "value_max": 0,  // Maximum value estimate in dollars
  "timeframe": "X-Y months to realize",
  "complexity": "Low | Medium | High",
  "risk_level": "Low | Medium | High",
  "examples": "Company X + Company Y achieved $NNM in savings",
  "sources": "McKinsey Report Title, Date"
}
```

---

## Quality Checklist

For each synergy example:
- [ ] Source is reputable (McKinsey, BCG, Deloitte, etc.)
- [ ] Value estimate is realistic (not aspirational)
- [ ] Industry context is specified
- [ ] Timeframe is included
- [ ] Historical example cited (if available)
- [ ] Source is cited (URL or report name)

---

## Fallback Strategy

If web scraping is too slow or blocked:
- Use manual research
- Focus on McKinsey/BCG/Deloitte white papers
- Extract from public company merger presentations
- Use industry averages where specific examples unavailable

Minimum viable: 30 synergies (vs target of 50)
