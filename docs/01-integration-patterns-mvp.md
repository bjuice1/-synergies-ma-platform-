# Integration Patterns - Business Intelligence MVP

**Purpose:** Define API integration layer, React Query hooks, and state management patterns for workflow visualization and value breakdown features.

**Scope:** MVP only - workflow + value breakdown. Audit trail, collaboration, and data inventory deferred to v2.

**Tech Stack:**
- API Client: Axios (already in use)
- Data Fetching: React Query / TanStack Query (already in use)
- State Management: React Query cache + local component state
- Type Safety: TypeScript interfaces

---

## 1. NEW API ENDPOINTS (Added to Backend)

### 1.1 Workflow Transitions

```typescript
GET /api/synergies/:id/workflow

Response:
[
  {
    id: number;
    synergy_id: number;
    from_state: "draft" | "review" | "approved" | "realized" | "rejected";
    to_state: "draft" | "review" | "approved" | "realized" | "rejected";
    action: "submit" | "approve" | "reject" | "realize" | "return_to_draft";
    user_id: number;
    user_email: string;
    comment: string | null;
    created_at: string; // ISO 8601
  }
]
```

### 1.2 Synergy Metrics (Value Breakdown)

```typescript
GET /api/synergies/:id/metrics

Response:
{
  synergy_id: number;
  total_value_low: number;
  total_value_high: number;
  metrics: [
    {
      id: number;
      synergy_id: number;
      metric_type: string;
      category: string; // e.g., "IT Costs", "Revenue Enhancement"
      line_item: string; // e.g., "Server Consolidation", "Cross-sell Opportunity"
      value: number;
      unit: string; // e.g., "USD/year", "one-time"
      description: string;
      confidence: "high" | "medium" | "low";
      assumption: string; // e.g., "40% server overlap"
      data_source: string; // e.g., "IT Audit Q4 2025"
      created_at: string;
    }
  ]
}
```

---

## 2. TYPESCRIPT INTERFACES

Add to `frontend/lib/types.ts`:

```typescript
// Workflow Types
export type WorkflowState = "draft" | "review" | "approved" | "realized" | "rejected";
export type WorkflowAction = "submit" | "approve" | "reject" | "realize" | "return_to_draft";

export interface WorkflowTransition {
  id: number;
  synergy_id: number;
  from_state: WorkflowState;
  to_state: WorkflowState;
  action: WorkflowAction;
  user_id: number;
  user_email: string;
  comment: string | null;
  created_at: string;
}

// Metrics Types
export interface SynergyMetric {
  id: number;
  synergy_id: number;
  metric_type: string;
  category: string;
  line_item: string;
  value: number;
  unit: string;
  description: string;
  confidence: "high" | "medium" | "low";
  assumption: string;
  data_source: string;
  created_at: string;
}

export interface SynergyMetricsResponse {
  synergy_id: number;
  total_value_low: number;
  total_value_high: number;
  metrics: SynergyMetric[];
}

// Extend existing Synergy interface
export interface Synergy {
  // ... existing fields
  current_workflow_state?: WorkflowState; // Derived from latest transition
  workflow_transitions?: WorkflowTransition[];
  metrics?: SynergyMetric[];
}
```

---

## 3. API CLIENT METHODS

Add to `frontend/lib/api.ts`:

```typescript
// Workflow API
export const workflowApi = {
  getTransitions: async (synergyId: number): Promise<WorkflowTransition[]> => {
    const response = await api.get(`/synergies/${synergyId}/workflow`);
    return response.data;
  },
};

// Metrics API
export const metricsApi = {
  getMetrics: async (synergyId: number): Promise<SynergyMetricsResponse> => {
    const response = await api.get(`/synergies/${synergyId}/metrics`);
    return response.data;
  },
};
```

---

## 4. REACT QUERY HOOKS

Create `frontend/hooks/useWorkflow.ts`:

```typescript
import { useQuery, UseQueryResult } from '@tanstack/react-query';
import { workflowApi } from '@/lib/api';
import type { WorkflowTransition, WorkflowState } from '@/lib/types';

/**
 * Fetch workflow transition history for a synergy
 */
export function useWorkflowTransitions(
  synergyId: number | undefined
): UseQueryResult<WorkflowTransition[], Error> {
  return useQuery({
    queryKey: ['workflow', synergyId],
    queryFn: () => {
      if (!synergyId) throw new Error('Synergy ID required');
      return workflowApi.getTransitions(synergyId);
    },
    enabled: !!synergyId,
    staleTime: 30000, // 30 seconds - workflow changes infrequently
  });
}

/**
 * Derive current workflow state from transitions
 */
export function useCurrentWorkflowState(
  synergyId: number | undefined
): WorkflowState | undefined {
  const { data: transitions } = useWorkflowTransitions(synergyId);

  if (!transitions || transitions.length === 0) {
    return 'draft'; // Default state
  }

  // Latest transition = current state
  return transitions[transitions.length - 1].to_state;
}
```

Create `frontend/hooks/useMetrics.ts`:

```typescript
import { useQuery, UseQueryResult } from '@tanstack/react-query';
import { metricsApi } from '@/lib/api';
import type { SynergyMetricsResponse } from '@/lib/types';

/**
 * Fetch detailed value breakdown for a synergy
 */
export function useSynergyMetrics(
  synergyId: number | undefined
): UseQueryResult<SynergyMetricsResponse, Error> {
  return useQuery({
    queryKey: ['metrics', synergyId],
    queryFn: () => {
      if (!synergyId) throw new Error('Synergy ID required');
      return metricsApi.getMetrics(synergyId);
    },
    enabled: !!synergyId,
    staleTime: 60000, // 1 minute - metrics change less frequently than synergies
  });
}
```

---

## 5. ERROR HANDLING PATTERN

All hooks follow this pattern:

```typescript
const { data, isLoading, error } = useWorkflowTransitions(synergyId);

if (isLoading) return <LoadingSpinner />;
if (error) return <ErrorMessage error={error} />;
if (!data) return null;

// Use data safely
```

Create `frontend/components/ErrorMessage.tsx`:

```typescript
interface ErrorMessageProps {
  error: Error;
  retry?: () => void;
}

export function ErrorMessage({ error, retry }: ErrorMessageProps) {
  return (
    <div className="glass-card border-red-500/20 bg-red-500/5 p-4 rounded-lg">
      <div className="flex items-center gap-2 text-red-400 mb-2">
        <AlertCircle className="w-5 h-5" />
        <p className="font-medium">Failed to load data</p>
      </div>
      <p className="text-sm text-gray-400 mb-3">{error.message}</p>
      {retry && (
        <Button onClick={retry} variant="outline" size="sm">
          Try Again
        </Button>
      )}
    </div>
  );
}
```

---

## 6. LOADING STATES (Glassmorphism)

Create `frontend/components/LoadingSpinner.tsx`:

```typescript
export function LoadingSpinner({ size = 'md' }: { size?: 'sm' | 'md' | 'lg' }) {
  const sizeClasses = {
    sm: 'w-4 h-4',
    md: 'w-8 h-8',
    lg: 'w-12 h-12',
  };

  return (
    <div className="flex items-center justify-center p-8">
      <div
        className={`${sizeClasses[size]} rounded-full border-4 border-emerald-400/30 border-t-emerald-400 animate-spin`}
      />
    </div>
  );
}
```

---

## 7. SHARED GLASSMORPHISM STYLES

Add to `frontend/styles/globals.css`:

```css
/* Workflow-specific glass variants */
.glass-workflow-draft {
  @apply bg-slate-500/5 border-slate-500/20;
}

.glass-workflow-review {
  @apply bg-blue-500/5 border-blue-500/20;
}

.glass-workflow-approved {
  @apply bg-emerald-500/5 border-emerald-500/20;
}

.glass-workflow-realized {
  @apply bg-green-500/5 border-green-500/20;
}

.glass-workflow-rejected {
  @apply bg-red-500/5 border-red-500/20;
}

/* Metric confidence levels */
.glass-confidence-high {
  @apply bg-emerald-500/5 border-emerald-500/20;
}

.glass-confidence-medium {
  @apply bg-amber-500/5 border-amber-500/20;
}

.glass-confidence-low {
  @apply bg-red-500/5 border-red-500/20;
}
```

---

## 8. CACHE INVALIDATION STRATEGY

When synergies are updated, invalidate related caches:

```typescript
import { useQueryClient } from '@tanstack/react-query';

// After updating a synergy
const queryClient = useQueryClient();

// Invalidate synergy data
queryClient.invalidateQueries({ queryKey: ['synergies', synergyId] });

// Invalidate workflow if state changed
queryClient.invalidateQueries({ queryKey: ['workflow', synergyId] });

// Metrics usually don't change with synergy updates, so no need to invalidate
```

---

## 9. ACCEPTANCE CRITERIA

✅ **Integration is complete when:**

1. TypeScript interfaces defined for WorkflowTransition and SynergyMetric
2. API client methods created and tested (workflowApi, metricsApi)
3. React Query hooks created (useWorkflowTransitions, useSynergyMetrics)
4. Error handling components built (ErrorMessage, LoadingSpinner)
5. Glassmorphism style variants added for workflow states
6. Cache invalidation strategy documented
7. All code compiles without TypeScript errors

---

## 10. TESTING CHECKLIST

Before moving to component development:

- [ ] Test API endpoints with Postman/curl (verify response structure)
- [ ] Test React Query hooks in isolation (Storybook or dev page)
- [ ] Verify error states display correctly
- [ ] Verify loading states display correctly
- [ ] Test cache invalidation (update synergy, check if data refreshes)

---

## ESTIMATED TIME

- TypeScript interfaces: 15 min
- API client methods: 15 min
- React Query hooks: 30 min
- Error/loading components: 30 min
- Glassmorphism styles: 15 min
- Testing: 30 min

**Total: ~2.5 hours**

---

## NEXT STEPS

After this integration layer is complete:
1. Build workflow visualization component (spec 02)
2. Build value breakdown dashboard (spec 03)

Both components will consume these hooks and follow these patterns.
