# Synergy Tool — BZ Stress Test: Review, Response & Methodology FAQ

**Date:** March 10, 2026
**Context:** BZ ran a structured adversarial stress test against the platform and shared findings. This document summarizes what was valid, what was acted on, and includes an appendix FAQ for methodology questions the test surfaced.

---

## PART 1 — WHAT BZ TESTED

BZ loaded a $14.5B combined-revenue case with full functional baselines and a CECL-style fraud efficiency narrative (~52% reduction). The goal was to probe:

- Whether the tool anchors to benchmark medians vs. full dispersion
- Whether it produces a bounded, defensible L1 range
- Whether fraud efficiency translates mathematically, not just narratively
- Whether double-counting is flagged
- Whether a realization layer is applied

**BZ's overall verdict:** Core engine is solid. Benchmark math works. Narrative generation is coherent. Four specific gaps identified.

---

## PART 2 — WHAT WAS DONE IN RESPONSE

### ✅ Implemented immediately

**1. IQR anchor mode (P25–P75)**
The tool previously defaulted to the absolute minimum and maximum of the comparable dataset as the range. This is statistically valid but produces ranges too wide for IC use.

The default range is now the **interquartile range (P25–P75)** of comparable deals, calculated via linear interpolation. The full min–max is preserved and shown as "full dispersion" reference. Example for IT lever (7 comp deals):

| | Before | After |
|---|---|---|
| Range shown | 1.50% – 2.10% (min–max) | 1.60% – 1.85% (P25–P75) |
| $ on $565M deal | $8.5M – $11.9M | $9.0M – $10.5M |

**2. Realization layer (75% default)**
The tool now distinguishes between **theoretical synergy** (what the benchmark says is possible) and **realizable synergy** (what a team should expect to actually capture). A 75% default capture rate is applied to all levers. Both figures are surfaced — realizable as the headline, theoretical as reference.

The 75% rate is consistent with practitioner norms for L1 framing. It is stored per-lever and will be analyst-adjustable in a future update.

**3. Claude refinement prompt updated**
The AI refinement endpoint now explicitly anchors Claude to the IQR range rather than the full dispersion range. Full dispersion is surfaced as context, but deviation requires explicit justification in the rationale.

**4. Excel export updated**
The lever detail sheet now includes: Theoretical Low/High (P25/P75), Realizable Low/High (75%), IQR%, Realization Factor — 10 columns total, up from 7.

---

### 🔵 Not implemented — correctly out of scope

**Fraud/CECL translation**
BZ requested a structured block that applies a fraud improvement percentage to a fraud provision signal, computes the gap, and applies a realization rate to produce an L1 fraud savings number. This is a valid request for a **financial services-specific module** but is not part of the current lever taxonomy (IT, Finance, HR, Operations, Procurement, Real Estate, Revenue). Scoping this as a separate module is the right path.

**Double-counting guardrail**
Valid for FinServ deals where provision, write-offs, and terminated fraud can overlap. Not applicable to the current general M&A use case. Will be addressed as part of the fraud module scope.

---

### ⚠️ One finding BZ missed

The stress test used a $14.5B combined-revenue case. The benchmark dataset is currently 7 **mid-market technology acquisitions** with combined revenues of $450M–$720M. This is a 20–30× scale mismatch and an industry mismatch (FinServ vs. Tech).

The wide range BZ observed ($33M–$899M) was partly an anchoring bug (now fixed) and partly a consequence of applying tech-deal percentages to a FinServ deal at a fundamentally different scale. The IQR fix narrows the range, but the right long-term fix is a broader, industry-matched benchmark dataset — which is the top item on the product roadmap.

---

## PART 3 — APPENDIX: METHODOLOGY FAQ

### Q1: How does the tool estimate a dollar synergy value?

The estimate is benchmark-driven, not built up from first principles. The logic chain:

```
Benchmark P25–P75 (% of combined revenue)
  × Combined revenue of the two companies
  = Theoretical synergy opportunity

Theoretical × Realization factor (default 75%)
  = Realizable L1 estimate
```

The benchmark percentages come from comparable M&A transactions. Each transaction contributes one data point per lever (e.g., "IT synergies were 1.8% of combined revenue in that deal"). The IQR of those data points is the default range.

---

### Q2: What is the comparable deal dataset?

Currently: 7 synthetic but calibrated mid-market technology acquisitions (combined revenues $450M–$720M, closed 2022–2024). Labeled as APQC-sourced in the UI. These are placeholder comps — real APQC data intake is the top roadmap priority.

When real data is loaded, analysts will be able to filter comps by industry, deal size, geography, and deal type to ensure the benchmark set is appropriate for the transaction.

---

### Q3: Why P25–P75 and not median ± standard deviation?

With small comp sets (N=7), standard deviation is unstable — one outlier deal skews it significantly. The IQR (P25–P75) is non-parametric, robust to outliers, and maps cleanly to "what the middle half of comparable deals achieved." It is also the format practitioners recognize from APQC and BCG benchmarking outputs.

If an analyst needs the full range (e.g., to show maximum potential to a Board), full dispersion (min–max) is always available in the expanded math panel.

---

### Q4: What does "realization factor" mean and why 75%?

Realization factor = the percentage of theoretical synergy a management team can reasonably expect to capture within 3 years of close, accounting for:

- Integration execution risk (resource constraints, competing priorities)
- Organizational friction (attrition, cultural resistance)
- Deal-specific complexity (cross-border, carve-out, hostile)
- Typical "slippage" between deal model assumptions and realized outcomes

75% is consistent with practitioner benchmarks from Oliver Wyman, McKinsey, and KPMG post-merger integration studies. It means: if the benchmark says $10M is achievable, present $7.5M to the IC as the expected outcome.

The 75% default applies to cost levers. Revenue levers typically use a lower realization rate (50–60%) due to higher execution risk — this is a planned enhancement.

---

### Q5: How does the tool handle cloud consolidation or ERP consolidation specifically?

Cloud and ERP consolidation are not estimated as standalone line items. They are implicit components of the IT lever, which is estimated as a % of combined revenue from the benchmark dataset. Within the IT lever, the tool surfaces a subtype breakdown:

| Sub-driver | Typical share of IT savings |
|---|---|
| Infrastructure & cloud | ~40% |
| Application rationalization (incl. ERP) | ~35% |
| Vendor & licensing (SaaS, EA) | ~25% |

These percentages are indicative splits based on practitioner norms, not deal-specific calculations. They provide directional guidance for workstream planning — not a second valuation.

If a deal has specific known facts (e.g., both companies are on AWS, or both run SAP), the diligence Q&A layer surfaces this and Claude incorporates it when positioning the deal within the IQR. The pre-populate logic auto-detects overlapping cloud platforms and ERP systems from company tech stack data.

---

### Q6: What is the diligence Q&A layer and how does it affect the estimate?

Each lever has a set of standard diligence questions drawn from the Learning section (playbooks). Analysts fill in answers as they conduct diligence. When enough questions are answered, they can trigger the "Refine estimate" function.

Claude (Haiku) reads the filled Q&A and deal context, then positions the deal within the IQR range — returning a deal-specific low/high % and a 2–4 sentence rationale. The refined estimate replaces the default IQR-based estimate for that lever.

The AI is explicitly instructed to:
- Stay within the IQR unless findings strongly justify deviation
- Document the reasoning for any deviation toward full dispersion
- Cite specific diligence findings, not generic commentary

---

### Q7: What is the difference between the estimate shown on the card vs. in the IC summary?

| Label | Definition | When to use |
|---|---|---|
| **Realizable** | IQR × combined revenue × 75% | IC presentation, management discussion, deal model |
| **Theoretical** | IQR × combined revenue (no haircut) | Internal reference, upside scenario, auditor support |
| **Full dispersion** | Min–max × combined revenue | Range of outcomes framing, sensitivity analysis |
| **Deal estimate ✦** | Claude-refined % × combined revenue × 75% | Post-diligence, when Q&A is substantially complete |

The headline number in both the deal detail page and the Excel export is **Realizable**. Theoretical and full dispersion are shown as reference.

---

### Q8: Can the realization factor be adjusted per lever?

Not through the UI yet — all levers default to 75%. The data model already stores `realization_factor` per DealLever row, so analyst-level adjustment is a UI-only addition when needed. Priority will be adding a lower default (50–60%) for the Revenue lever, which has higher execution risk.

---

### Q9: How should we think about deals larger than the comp set?

This is the most important limitation to communicate. The benchmark dataset is currently mid-market tech ($450M–$720M combined revenue). Applying these percentages to a $5B or $14B deal introduces meaningful basis risk — the absolute dollar outputs scale linearly, but synergy dynamics at large deal sizes often differ structurally (more complex integration, regulatory constraints, longer realization timelines).

Until industry-matched and size-matched APQC data is loaded, the tool should be used for directional L1 framing on deals broadly similar in scale and sector to the comp set. For significantly larger or different-industry deals, flag the benchmark basis explicitly when presenting.

---

### Q10: What about revenue synergies — are they handled differently?

Revenue synergies are a separate lever with their own benchmark data (currently empty in the demo dataset — the Revenue lever shows no comparable data until real APQC data is loaded). The sub-driver breakdown is:

| Sub-driver | Typical share of revenue synergies |
|---|---|
| Cross-sell & upsell | ~50% |
| Geographic expansion | ~30% |
| Pricing & retention | ~20% |

Revenue synergies are structurally harder to benchmark because they depend heavily on go-to-market fit, sales capacity, and product overlap — factors that vary more across deals than cost structure does. For this reason, most practitioners present revenue synergies separately from cost synergies and apply a more conservative realization factor. The tool tracks them separately; a lower default realization rate for the Revenue lever is a planned enhancement.

---

### Q11: What is NOT in scope for this tool?

| Capability | Status |
|---|---|
| Fraud / CECL provision translation | Not in scope — FinServ-specific module, planned |
| Bottom-up build (e.g., license-by-license IT cost model) | Not in scope — L2 diligence work |
| Deal-size or industry-adjusted benchmark filtering | Planned — requires real APQC data |
| Per-lever realization factor adjustment (UI) | Planned — data model supports it |
| Double-counting detection across levers | Planned as part of fraud module |
| Revenue synergy benchmark data | Pending APQC data intake |

---

*For questions about the methodology, reach out to the team. For platform feedback, use the chat or comment features in the tool directly.*
