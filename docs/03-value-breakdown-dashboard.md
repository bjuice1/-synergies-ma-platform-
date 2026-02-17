# Value Breakdown Dashboard - Estimate Transparency

**Purpose:** Show HOW synergy estimates were calculated with granular cost/revenue breakdown, assumptions, data sources, and confidence levels.

**Business Value:** Answers "Why $5M?" and "What data supports this?" - enables stakeholders to validate and improve estimates.

**Dependencies:** `01-integration-patterns-mvp.md` (useSynergyMetrics hook)

---

## 1. DESIGN APPROACH

### 1.1 Visual Strategy: Expandable Accordion

**Chosen Approach:** Collapsible accordion with category grouping

**Why:**
- ✅ Hides complexity by default (show summary, expand for details)
- ✅ Groups metrics by category (IT Costs, Revenue Enhancement, etc.)
- ✅ Allows deep drill-down without overwhelming the page
- ✅ Mobile-friendly (stack categories vertically)

**Alternatives Considered:**
- ❌ Flat table - too much data, hard to scan
- ❌ Separate page - breaks context from synergy
- ❌ Modal - limits ability to reference other info while viewing

---

## 2. COMPONENT HIERARCHY

```
<ValueBreakdown>                    // Container component
  ├─ <BreakdownSummary>             // Top-level total (value range + confidence)
  ├─ <CategoryGroup>                // Repeatable (e.g., "IT Costs")
  │   ├─ <CategoryHeader>           // Category name + subtotal
  │   ├─ <CategoryMetrics>          // List of line items (collapsible)
  │   │   └─ <MetricLineItem>       // Individual metric (repeatable)
  │   │       ├─ <MetricValue>      // $ amount + unit
  │   │       ├─ <MetricMeta>       // Confidence, assumption, data source
  │   │       └─ <MetricActions>    // Edit, flag, comment (v2)
  │   └─ <CategoryChart>            // Optional: pie chart of category breakdown
  └─ <AssumptionsPanel>             // Summary of all assumptions + data gaps
```

---

## 3. VALUE BREAKDOWN COMPONENT

### 3.1 Main Component

**File:** `frontend/components/synergies/ValueBreakdown.tsx`

```typescript
'use client';

import { useState } from 'react';
import { useSynergyMetrics } from '@/hooks/useMetrics';
import { BreakdownSummary } from './BreakdownSummary';
import { CategoryGroup } from './CategoryGroup';
import { AssumptionsPanel } from './AssumptionsPanel';
import { LoadingSpinner, ErrorMessage } from '@/components/ui';
import { ChevronDown, ChevronUp } from 'lucide-react';

interface ValueBreakdownProps {
  synergyId: number;
  defaultExpanded?: boolean;
}

export function ValueBreakdown({ synergyId, defaultExpanded = false }: ValueBreakdownProps) {
  const [isExpanded, setIsExpanded] = useState(defaultExpanded);
  const { data, isLoading, error } = useSynergyMetrics(synergyId);

  if (isLoading) return <LoadingSpinner />;
  if (error) return <ErrorMessage error={error} />;
  if (!data) return null;

  // Group metrics by category
  const categorizedMetrics = groupMetricsByCategory(data.metrics);
  const categories = Array.from(categorizedMetrics.keys());

  // Calculate total confidence (weighted average)
  const overallConfidence = calculateOverallConfidence(data.metrics);

  return (
    <div className="glass-card border-white/10 bg-white/5 backdrop-blur-lg rounded-2xl overflow-hidden">
      {/* Header - Always Visible */}
      <button
        onClick={() => setIsExpanded(!isExpanded)}
        className="w-full p-6 flex items-center justify-between hover:bg-white/5 transition-colors"
      >
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 rounded-full bg-emerald-500/10 flex items-center justify-center">
            <svg
              className="w-6 h-6 text-emerald-400"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M9 7h6m0 10v-3m-3 3h.01M9 17h.01M9 14h.01M12 14h.01M15 11h.01M12 11h.01M9 11h.01M7 21h10a2 2 0 002-2V5a2 2 0 00-2-2H7a2 2 0 00-2 2v14a2 2 0 002 2z"
              />
            </svg>
          </div>

          <div className="text-left">
            <h3 className="text-lg font-semibold text-white">Value Breakdown</h3>
            <p className="text-sm text-gray-400 mt-1">
              {categories.length} categories • {data.metrics.length} line items
            </p>
          </div>
        </div>

        {/* Summary Stats */}
        <div className="flex items-center gap-6">
          <BreakdownSummary
            valueLow={data.total_value_low}
            valueHigh={data.total_value_high}
            confidence={overallConfidence}
          />

          {/* Expand/Collapse Icon */}
          {isExpanded ? (
            <ChevronUp className="w-5 h-5 text-gray-400" />
          ) : (
            <ChevronDown className="w-5 h-5 text-gray-400" />
          )}
        </div>
      </button>

      {/* Expanded Content */}
      {isExpanded && (
        <div className="border-t border-white/10">
          {/* Categories */}
          <div className="p-6 space-y-4">
            {categories.map((category) => (
              <CategoryGroup
                key={category}
                category={category}
                metrics={categorizedMetrics.get(category) || []}
              />
            ))}
          </div>

          {/* Assumptions Summary */}
          <div className="border-t border-white/10 p-6 bg-white/5">
            <AssumptionsPanel metrics={data.metrics} />
          </div>
        </div>
      )}
    </div>
  );
}

// Helper functions
function groupMetricsByCategory(metrics: SynergyMetric[]): Map<string, SynergyMetric[]> {
  const grouped = new Map<string, SynergyMetric[]>();

  metrics.forEach((metric) => {
    const category = metric.category || 'Uncategorized';
    if (!grouped.has(category)) {
      grouped.set(category, []);
    }
    grouped.get(category)!.push(metric);
  });

  return grouped;
}

function calculateOverallConfidence(metrics: SynergyMetric[]): 'high' | 'medium' | 'low' {
  if (metrics.length === 0) return 'medium';

  const confidenceCounts = { high: 0, medium: 0, low: 0 };
  metrics.forEach((m) => {
    confidenceCounts[m.confidence]++;
  });

  // Weighted: if >50% high, return high; if >50% low, return low; else medium
  const total = metrics.length;
  if (confidenceCounts.high / total > 0.5) return 'high';
  if (confidenceCounts.low / total > 0.5) return 'low';
  return 'medium';
}
```

---

## 4. BREAKDOWN SUMMARY COMPONENT

**File:** `frontend/components/synergies/BreakdownSummary.tsx`

```typescript
import { formatCurrency } from '@/lib/utils';
import { TrendingUp, AlertCircle, CheckCircle2 } from 'lucide-react';

interface BreakdownSummaryProps {
  valueLow: number;
  valueHigh: number;
  confidence: 'high' | 'medium' | 'low';
}

const CONFIDENCE_CONFIG = {
  high: {
    icon: CheckCircle2,
    color: 'text-emerald-400',
    bg: 'bg-emerald-500/10',
    label: 'High Confidence',
  },
  medium: {
    icon: TrendingUp,
    color: 'text-amber-400',
    bg: 'bg-amber-500/10',
    label: 'Medium Confidence',
  },
  low: {
    icon: AlertCircle,
    color: 'text-red-400',
    bg: 'bg-red-500/10',
    label: 'Low Confidence',
  },
};

export function BreakdownSummary({ valueLow, valueHigh, confidence }: BreakdownSummaryProps) {
  const config = CONFIDENCE_CONFIG[confidence];
  const Icon = config.icon;
  const midpoint = (valueLow + valueHigh) / 2;

  return (
    <div className="flex items-center gap-4">
      {/* Value Range */}
      <div className="text-right">
        <p className="text-2xl font-bold text-white">
          {formatCurrency(midpoint)}
        </p>
        <p className="text-xs text-gray-400 mt-1">
          Range: {formatCurrency(valueLow)} - {formatCurrency(valueHigh)}
        </p>
      </div>

      {/* Confidence Badge */}
      <div className={`flex items-center gap-2 px-3 py-2 rounded-lg ${config.bg}`}>
        <Icon className={`w-4 h-4 ${config.color}`} />
        <span className={`text-xs font-medium ${config.color}`}>
          {config.label}
        </span>
      </div>
    </div>
  );
}
```

---

## 5. CATEGORY GROUP COMPONENT

**File:** `frontend/components/synergies/CategoryGroup.tsx`

```typescript
import { useState } from 'react';
import { ChevronDown, ChevronRight } from 'lucide-react';
import { MetricLineItem } from './MetricLineItem';
import type { SynergyMetric } from '@/lib/types';

interface CategoryGroupProps {
  category: string;
  metrics: SynergyMetric[];
}

export function CategoryGroup({ category, metrics }: CategoryGroupProps) {
  const [isExpanded, setIsExpanded] = useState(true);

  // Calculate category subtotal
  const subtotal = metrics.reduce((sum, m) => sum + m.value, 0);

  return (
    <div className="glass-card border-white/10 bg-white/5 rounded-lg overflow-hidden">
      {/* Category Header */}
      <button
        onClick={() => setIsExpanded(!isExpanded)}
        className="w-full px-4 py-3 flex items-center justify-between hover:bg-white/5 transition-colors"
      >
        <div className="flex items-center gap-2">
          {isExpanded ? (
            <ChevronDown className="w-4 h-4 text-gray-400" />
          ) : (
            <ChevronRight className="w-4 h-4 text-gray-400" />
          )}
          <h4 className="text-sm font-semibold text-white">{category}</h4>
          <span className="text-xs text-gray-500">({metrics.length} items)</span>
        </div>

        <p className="text-sm font-mono text-emerald-400">
          ${subtotal.toLocaleString()}
        </p>
      </button>

      {/* Metrics List */}
      {isExpanded && (
        <div className="border-t border-white/10 divide-y divide-white/10">
          {metrics.map((metric) => (
            <MetricLineItem key={metric.id} metric={metric} />
          ))}
        </div>
      )}
    </div>
  );
}
```

---

## 6. METRIC LINE ITEM COMPONENT

**File:** `frontend/components/synergies/MetricLineItem.tsx`

```typescript
import { Database, TrendingUp, FileText } from 'lucide-react';
import type { SynergyMetric } from '@/lib/types';

interface MetricLineItemProps {
  metric: SynergyMetric;
}

const CONFIDENCE_COLORS = {
  high: 'border-emerald-500/20 bg-emerald-500/5',
  medium: 'border-amber-500/20 bg-amber-500/5',
  low: 'border-red-500/20 bg-red-500/5',
};

export function MetricLineItem({ metric }: MetricLineItemProps) {
  return (
    <div className="p-4 hover:bg-white/5 transition-colors">
      <div className="flex items-start justify-between gap-4">
        {/* Line Item Details */}
        <div className="flex-1 space-y-2">
          <div className="flex items-center gap-2">
            <h5 className="text-sm font-medium text-white">{metric.line_item}</h5>
            <span
              className={`
                px-2 py-0.5 rounded text-xs font-medium
                ${CONFIDENCE_COLORS[metric.confidence]}
              `}
            >
              {metric.confidence}
            </span>
          </div>

          <p className="text-xs text-gray-400">{metric.description}</p>

          {/* Metadata Grid */}
          <div className="grid grid-cols-2 gap-3 mt-3">
            {/* Assumption */}
            {metric.assumption && (
              <div className="flex items-start gap-2">
                <TrendingUp className="w-4 h-4 text-gray-500 flex-shrink-0 mt-0.5" />
                <div>
                  <p className="text-xs text-gray-500 font-medium">Assumption</p>
                  <p className="text-xs text-gray-300 mt-0.5">{metric.assumption}</p>
                </div>
              </div>
            )}

            {/* Data Source */}
            {metric.data_source && (
              <div className="flex items-start gap-2">
                <Database className="w-4 h-4 text-gray-500 flex-shrink-0 mt-0.5" />
                <div>
                  <p className="text-xs text-gray-500 font-medium">Data Source</p>
                  <p className="text-xs text-gray-300 mt-0.5">{metric.data_source}</p>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Value */}
        <div className="text-right flex-shrink-0">
          <p className="text-lg font-mono font-bold text-white">
            ${metric.value.toLocaleString()}
          </p>
          <p className="text-xs text-gray-500 mt-1">{metric.unit}</p>
        </div>
      </div>
    </div>
  );
}
```

---

## 7. ASSUMPTIONS PANEL COMPONENT

**File:** `frontend/components/synergies/AssumptionsPanel.tsx`

```typescript
import { AlertCircle, Database, CheckCircle2 } from 'lucide-react';
import type { SynergyMetric } from '@/lib/types';

interface AssumptionsPanelProps {
  metrics: SynergyMetric[];
}

export function AssumptionsPanel({ metrics }: AssumptionsPanelProps) {
  // Extract unique assumptions and data sources
  const assumptions = Array.from(new Set(metrics.map((m) => m.assumption).filter(Boolean)));
  const dataSources = Array.from(new Set(metrics.map((m) => m.data_source).filter(Boolean)));

  // Identify data gaps (metrics with low confidence or missing sources)
  const dataGaps = metrics.filter(
    (m) => m.confidence === 'low' || !m.data_source || !m.assumption
  );

  return (
    <div className="space-y-4">
      <h4 className="text-sm font-semibold text-white flex items-center gap-2">
        <FileText className="w-4 h-4" />
        Assumptions & Data Quality
      </h4>

      <div className="grid grid-cols-3 gap-4">
        {/* Key Assumptions */}
        <div className="glass-card border-white/10 bg-white/5 p-4 rounded-lg">
          <div className="flex items-center gap-2 text-blue-400 mb-3">
            <AlertCircle className="w-4 h-4" />
            <h5 className="text-xs font-medium">Key Assumptions</h5>
          </div>
          <ul className="space-y-2">
            {assumptions.slice(0, 3).map((assumption, i) => (
              <li key={i} className="text-xs text-gray-300 flex items-start gap-2">
                <span className="text-gray-500">•</span>
                <span>{assumption}</span>
              </li>
            ))}
            {assumptions.length > 3 && (
              <li className="text-xs text-gray-500 italic">
                +{assumptions.length - 3} more...
              </li>
            )}
          </ul>
        </div>

        {/* Data Sources */}
        <div className="glass-card border-white/10 bg-white/5 p-4 rounded-lg">
          <div className="flex items-center gap-2 text-emerald-400 mb-3">
            <Database className="w-4 h-4" />
            <h5 className="text-xs font-medium">Data Sources</h5>
          </div>
          <ul className="space-y-2">
            {dataSources.slice(0, 3).map((source, i) => (
              <li key={i} className="text-xs text-gray-300 flex items-start gap-2">
                <CheckCircle2 className="w-3 h-3 text-emerald-500 flex-shrink-0 mt-0.5" />
                <span>{source}</span>
              </li>
            ))}
            {dataSources.length > 3 && (
              <li className="text-xs text-gray-500 italic">
                +{dataSources.length - 3} more...
              </li>
            )}
          </ul>
        </div>

        {/* Data Gaps */}
        <div className="glass-card border-amber-500/20 bg-amber-500/5 p-4 rounded-lg">
          <div className="flex items-center gap-2 text-amber-400 mb-3">
            <AlertCircle className="w-4 h-4" />
            <h5 className="text-xs font-medium">Data Gaps</h5>
          </div>
          {dataGaps.length === 0 ? (
            <p className="text-xs text-gray-400">No gaps identified ✓</p>
          ) : (
            <ul className="space-y-2">
              {dataGaps.slice(0, 2).map((gap) => (
                <li key={gap.id} className="text-xs text-amber-300">
                  {gap.line_item} - {gap.confidence} confidence
                </li>
              ))}
              {dataGaps.length > 2 && (
                <p className="text-xs text-amber-400 font-medium mt-2">
                  +{dataGaps.length - 2} items need better data
                </p>
              )}
            </ul>
          )}
        </div>
      </div>
    </div>
  );
}
```

---

## 8. USAGE EXAMPLES

### 8.1 In Synergy Detail Page

```typescript
// frontend/app/synergies/[id]/page.tsx

import { ValueBreakdown } from '@/components/synergies/ValueBreakdown';

export default function SynergyDetailPage({ params }: { params: { id: string } }) {
  const synergyId = parseInt(params.id);

  return (
    <div className="space-y-6">
      {/* Synergy overview... */}

      {/* Value Breakdown */}
      <ValueBreakdown synergyId={synergyId} defaultExpanded={true} />

      {/* Other sections... */}
    </div>
  );
}
```

### 8.2 In Synergy Card (Collapsed Preview)

```typescript
// frontend/components/synergies/SynergyCard.tsx

<SynergyCard synergy={synergy}>
  <ValueBreakdown
    synergyId={synergy.id}
    defaultExpanded={false} // Collapsed by default
  />
</SynergyCard>
```

---

## 9. MOBILE RESPONSIVE BEHAVIOR

**Desktop (>1024px):**
- 3-column assumptions grid
- All metadata visible

**Tablet (768px - 1024px):**
- 2-column assumptions grid
- Abbreviated metadata

**Mobile (<768px):**
- 1-column stacked layout
- Assumptions panel stacks vertically
- Values shown on separate line from labels

---

## 10. ACCEPTANCE CRITERIA

✅ **Value breakdown is complete when:**

1. Total value and range displayed prominently
2. Overall confidence calculated and displayed
3. Metrics grouped by category (collapsible)
4. Each metric shows: line item, value, unit, description
5. Metadata displayed: assumption, data source, confidence
6. Assumptions panel summarizes all assumptions
7. Data gaps identified and highlighted
8. Loading/error states handled
9. Component is responsive (mobile-friendly)
10. All TypeScript types correct

---

## 11. TESTING CHECKLIST

- [ ] Test with 0 metrics (empty state)
- [ ] Test with 1 category
- [ ] Test with 10+ categories
- [ ] Test with missing assumptions/data sources
- [ ] Test with all high confidence
- [ ] Test with all low confidence
- [ ] Test expand/collapse all categories
- [ ] Test mobile responsive
- [ ] Test long category names (truncation)
- [ ] Test large values ($1B+) formatting

---

## 12. ESTIMATED TIME

- ValueBreakdown container: 2 hours
- BreakdownSummary: 1 hour
- CategoryGroup: 1.5 hours
- MetricLineItem: 2 hours
- AssumptionsPanel: 2 hours
- Responsive CSS: 1 hour
- Testing & polish: 1.5 hours

**Total: ~10-11 hours**

---

## 13. KNOWN LIMITATIONS (V2 Enhancements)

**V1 Limitations:**
- Read-only (cannot edit metrics/assumptions)
- No "flag for review" feature (business users can't suggest changes)
- No comparison between synergies
- No export to Excel

**V2 Enhancements:**
- Inline editing of assumptions (with approval workflow)
- "Flag for review" button → creates comment thread
- Side-by-side synergy comparison view
- Export breakdown to Excel with charts
- "What-if" scenario modeling (adjust assumptions, see impact)

---

## FINAL NOTES

This component is the **core value proposition** of the BI layer - it transforms "black box estimates" into transparent, data-backed calculations. Users can now answer:

- ✅ "How did we get to $5M?" (See the line items)
- ✅ "What assumptions drive this?" (See the assumptions panel)
- ✅ "Can I trust this number?" (See confidence levels)
- ✅ "What data am I missing?" (See data gaps)

**This is the difference between a database UI and a decision intelligence tool.**

---

## 🎉 MVP COMPLETE

With this spec, the Business Intelligence MVP is fully defined:

1. ✅ **Integration Layer** - API hooks, types, error handling
2. ✅ **Workflow Visualization** - Pipeline showing DRAFT→REALIZED progression
3. ✅ **Value Breakdown** - Transparent estimate calculator

**Total Estimated Time:** 20-22 hours of implementation

**Next Step:** Begin development with `01-integration-patterns-mvp.md`
