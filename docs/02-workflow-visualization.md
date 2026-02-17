# Workflow Visualization - Pipeline View

**Purpose:** Create visual pipeline showing synergy progression through M&A approval workflow (DRAFT → REVIEW → APPROVED → REALIZED)

**Business Value:** Answers "Where are we in the process?" and "What needs to happen next?" - critical for M&A deal visibility

**Dependencies:** `01-integration-patterns-mvp.md` (API hooks, types)

---

## 1. DESIGN APPROACH

### 1.1 Visualization Style: Horizontal Pipeline

**Chosen Approach:** Horizontal stepper/pipeline with glassmorphism cards

**Why:**
- ✅ Matches existing glassmorphism aesthetic
- ✅ Clear linear progression (left to right = past to future)
- ✅ Mobile responsive (stacks vertically on small screens)
- ✅ Can show multiple synergies in same format (dashboard overview)

**Alternatives Considered:**
- ❌ Kanban board - too much vertical space, not mobile friendly
- ❌ Flowchart - too complex for 5 simple states
- ❌ Timeline - implies time duration, but workflow is state-based

---

## 2. COMPONENT HIERARCHY

```
<WorkflowPipeline>           // Container component
  ├─ <WorkflowStage>         // Repeatable stage component (5x: DRAFT, REVIEW, etc.)
  │   ├─ <StageIcon>         // Visual indicator (icon + color)
  │   ├─ <StageLabel>        // State name
  │   ├─ <StageStatus>       // Active/Complete/Pending
  │   └─ <StageMeta>         // Timestamp, user (if transitioned)
  ├─ <StageConnector>        // Arrow/line between stages (4x)
  └─ <WorkflowTimeline>      // Collapsible detailed history (optional)
      └─ <TransitionCard>    // Individual transition with comment
```

---

## 3. WORKFLOW PIPELINE COMPONENT

### 3.1 Main Component

**File:** `frontend/components/workflow/WorkflowPipeline.tsx`

```typescript
'use client';

import { useWorkflowTransitions, useCurrentWorkflowState } from '@/hooks/useWorkflow';
import { WorkflowStage } from './WorkflowStage';
import { StageConnector } from './StageConnector';
import { WorkflowTimeline } from './WorkflowTimeline';
import type { WorkflowState } from '@/lib/types';

interface WorkflowPipelineProps {
  synergyId: number;
  showTimeline?: boolean; // Show detailed transition history
  compact?: boolean; // Compact mode for cards (smaller)
}

const WORKFLOW_STAGES: WorkflowState[] = [
  'draft',
  'review',
  'approved',
  'realized',
];

// Note: 'rejected' is a terminal state, shown separately

export function WorkflowPipeline({
  synergyId,
  showTimeline = false,
  compact = false
}: WorkflowPipelineProps) {
  const { data: transitions, isLoading, error } = useWorkflowTransitions(synergyId);
  const currentState = useCurrentWorkflowState(synergyId);

  if (isLoading) return <LoadingSpinner />;
  if (error) return <ErrorMessage error={error} />;

  // Find which transitions happened
  const stageTransitions = new Map<WorkflowState, typeof transitions[0]>();
  transitions?.forEach(transition => {
    if (!stageTransitions.has(transition.to_state)) {
      stageTransitions.set(transition.to_state, transition);
    }
  });

  // Determine stage status (complete, active, pending)
  const getStageStatus = (stage: WorkflowState): 'complete' | 'active' | 'pending' | 'rejected' => {
    if (currentState === 'rejected' && stage !== 'draft') return 'rejected';
    if (currentState === stage) return 'active';

    const stageIndex = WORKFLOW_STAGES.indexOf(stage);
    const currentIndex = WORKFLOW_STAGES.indexOf(currentState || 'draft');

    return stageIndex < currentIndex ? 'complete' : 'pending';
  };

  return (
    <div className="glass-card border-white/10 bg-white/5 backdrop-blur-lg p-6 rounded-2xl">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h3 className="text-lg font-semibold text-white">Workflow Status</h3>
          <p className="text-sm text-gray-400 mt-1">
            Current stage: <span className="text-emerald-400 font-medium capitalize">{currentState}</span>
          </p>
        </div>

        {/* Show rejected badge if applicable */}
        {currentState === 'rejected' && (
          <div className="glass-card border-red-500/20 bg-red-500/10 px-3 py-1 rounded-lg">
            <span className="text-sm text-red-400 font-medium">Rejected</span>
          </div>
        )}
      </div>

      {/* Pipeline */}
      <div className={`flex items-center gap-2 ${compact ? '' : 'overflow-x-auto pb-4'}`}>
        {WORKFLOW_STAGES.map((stage, index) => (
          <div key={stage} className="flex items-center">
            <WorkflowStage
              stage={stage}
              status={getStageStatus(stage)}
              transition={stageTransitions.get(stage)}
              compact={compact}
            />

            {/* Connector between stages */}
            {index < WORKFLOW_STAGES.length - 1 && (
              <StageConnector
                active={getStageStatus(stage) === 'complete'}
                compact={compact}
              />
            )}
          </div>
        ))}
      </div>

      {/* Detailed Timeline (Optional) */}
      {showTimeline && transitions && transitions.length > 0 && (
        <WorkflowTimeline transitions={transitions} className="mt-6 pt-6 border-t border-white/10" />
      )}
    </div>
  );
}
```

---

## 4. WORKFLOW STAGE COMPONENT

**File:** `frontend/components/workflow/WorkflowStage.tsx`

```typescript
import { CheckCircle2, Circle, Clock, XCircle, User } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import type { WorkflowState, WorkflowTransition } from '@/lib/types';

interface WorkflowStageProps {
  stage: WorkflowState;
  status: 'complete' | 'active' | 'pending' | 'rejected';
  transition?: WorkflowTransition;
  compact?: boolean;
}

const STAGE_CONFIG: Record<WorkflowState, { label: string; icon: typeof Circle }> = {
  draft: { label: 'Draft', icon: Circle },
  review: { label: 'Review', icon: Clock },
  approved: { label: 'Approved', icon: CheckCircle2 },
  realized: { label: 'Realized', icon: CheckCircle2 },
  rejected: { label: 'Rejected', icon: XCircle },
};

export function WorkflowStage({ stage, status, transition, compact }: WorkflowStageProps) {
  const config = STAGE_CONFIG[stage];
  const Icon = config.icon;

  // Status-based styling
  const statusStyles = {
    complete: 'glass-workflow-approved border-emerald-500/30 bg-emerald-500/10',
    active: 'glass-card border-blue-500/30 bg-blue-500/10 ring-2 ring-blue-500/20',
    pending: 'glass-card border-white/10 bg-white/5 opacity-50',
    rejected: 'glass-card border-red-500/30 bg-red-500/10 opacity-50',
  };

  const iconStyles = {
    complete: 'text-emerald-400',
    active: 'text-blue-400',
    pending: 'text-gray-500',
    rejected: 'text-red-400',
  };

  return (
    <div
      className={`
        ${statusStyles[status]}
        backdrop-blur-lg rounded-lg transition-all
        ${compact ? 'p-3 min-w-[100px]' : 'p-4 min-w-[140px]'}
      `}
    >
      {/* Icon + Label */}
      <div className="flex flex-col items-center gap-2">
        <Icon className={`${compact ? 'w-6 h-6' : 'w-8 h-8'} ${iconStyles[status]}`} />
        <span className={`font-medium text-white ${compact ? 'text-xs' : 'text-sm'}`}>
          {config.label}
        </span>
      </div>

      {/* Transition Metadata (if complete) */}
      {!compact && transition && status === 'complete' && (
        <div className="mt-3 pt-3 border-t border-white/10 space-y-1">
          <div className="flex items-center gap-1 text-xs text-gray-400">
            <User className="w-3 h-3" />
            <span className="truncate">{transition.user_email?.split('@')[0]}</span>
          </div>
          <p className="text-xs text-gray-500">
            {formatDistanceToNow(new Date(transition.created_at), { addSuffix: true })}
          </p>
        </div>
      )}

      {/* Active indicator pulse */}
      {status === 'active' && (
        <div className="mt-2 flex justify-center">
          <div className="w-2 h-2 rounded-full bg-blue-400 animate-pulse" />
        </div>
      )}
    </div>
  );
}
```

---

## 5. STAGE CONNECTOR COMPONENT

**File:** `frontend/components/workflow/StageConnector.tsx`

```typescript
import { ArrowRight } from 'lucide-react';

interface StageConnectorProps {
  active: boolean; // true if transition to next stage occurred
  compact?: boolean;
}

export function StageConnector({ active, compact }: StageConnectorProps) {
  return (
    <div className={`flex items-center ${compact ? 'mx-1' : 'mx-2'}`}>
      <ArrowRight
        className={`
          ${compact ? 'w-5 h-5' : 'w-6 h-6'}
          transition-colors
          ${active ? 'text-emerald-400' : 'text-gray-600'}
        `}
      />
    </div>
  );
}
```

---

## 6. WORKFLOW TIMELINE (Detailed History)

**File:** `frontend/components/workflow/WorkflowTimeline.tsx`

```typescript
import { formatDistanceToNow } from 'date-fns';
import type { WorkflowTransition } from '@/lib/types';

interface WorkflowTimelineProps {
  transitions: WorkflowTransition[];
  className?: string;
}

export function WorkflowTimeline({ transitions, className }: WorkflowTimelineProps) {
  return (
    <div className={className}>
      <h4 className="text-sm font-medium text-white mb-4">Transition History</h4>

      <div className="space-y-3">
        {transitions.map((transition, index) => (
          <div key={transition.id} className="flex gap-3">
            {/* Timeline line */}
            <div className="flex flex-col items-center">
              <div className="w-2 h-2 rounded-full bg-emerald-400" />
              {index < transitions.length - 1 && (
                <div className="w-0.5 h-full bg-gradient-to-b from-emerald-400 to-transparent" />
              )}
            </div>

            {/* Transition card */}
            <div className="glass-card border-white/10 bg-white/5 p-3 rounded-lg flex-1 mb-3">
              <div className="flex items-start justify-between gap-2">
                <div className="flex-1">
                  <p className="text-sm text-white font-medium">
                    {transition.action.replace('_', ' ').toUpperCase()}:{' '}
                    <span className="capitalize">{transition.from_state}</span> → {' '}
                    <span className="capitalize">{transition.to_state}</span>
                  </p>
                  <p className="text-xs text-gray-400 mt-1">
                    by {transition.user_email} • {' '}
                    {formatDistanceToNow(new Date(transition.created_at), { addSuffix: true })}
                  </p>

                  {transition.comment && (
                    <p className="text-sm text-gray-300 mt-2 italic">
                      "{transition.comment}"
                    </p>
                  )}
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
```

---

## 7. USAGE EXAMPLES

### 7.1 In Synergy Detail Page

```typescript
// frontend/app/synergies/[id]/page.tsx

import { WorkflowPipeline } from '@/components/workflow/WorkflowPipeline';

export default function SynergyDetailPage({ params }: { params: { id: string } }) {
  const synergyId = parseInt(params.id);

  return (
    <div className="space-y-6">
      {/* Workflow Pipeline */}
      <WorkflowPipeline
        synergyId={synergyId}
        showTimeline={true}
      />

      {/* Other synergy details... */}
    </div>
  );
}
```

### 7.2 In Dashboard (Compact Mode)

```typescript
// frontend/components/dashboard/RecentSynergies.tsx

<div className="space-y-4">
  {synergies.map(synergy => (
    <div key={synergy.id} className="glass-card p-4">
      <h4>{synergy.description}</h4>
      <WorkflowPipeline
        synergyId={synergy.id}
        compact={true}
        showTimeline={false}
      />
    </div>
  ))}
</div>
```

---

## 8. MOBILE RESPONSIVE BEHAVIOR

**Desktop (>768px):**
- Horizontal pipeline, all stages visible
- Full metadata shown (user, timestamp)

**Tablet (768px - 1024px):**
- Horizontal pipeline, compact mode
- Reduced metadata

**Mobile (<768px):**
- Stack vertically (flex-col)
- Connectors rotate 90° (down arrows instead of right)
- Compact mode enforced

```css
/* Add to globals.css */
@media (max-width: 768px) {
  .workflow-pipeline-container {
    @apply flex-col;
  }

  .workflow-connector {
    @apply rotate-90 my-2;
  }
}
```

---

## 9. ACCESSIBILITY

- ✅ Semantic HTML (`<nav role="navigation">` for pipeline)
- ✅ ARIA labels for stage status
- ✅ Keyboard navigation (tab through stages)
- ✅ Screen reader announcements ("Stage 2 of 4: Review - Active")
- ✅ Color is not the only indicator (icons + text)

```typescript
<div
  role="navigation"
  aria-label="Synergy workflow pipeline"
  aria-current={status === 'active' ? 'step' : undefined}
>
  {/* Stage content */}
</div>
```

---

## 10. ACCEPTANCE CRITERIA

✅ **Workflow visualization is complete when:**

1. Pipeline displays all 5 workflow states (draft, review, approved, realized, rejected)
2. Current state is visually highlighted (ring, pulse animation)
3. Completed stages show green checkmarks
4. Pending stages are grayed out
5. Transition metadata (user, timestamp) shown on completed stages
6. Optional timeline view shows detailed history with comments
7. Component is responsive (horizontal on desktop, vertical on mobile)
8. Compact mode works for dashboard overview
9. Loading/error states handled gracefully
10. All TypeScript types are correct, no `any`

---

## 11. TESTING CHECKLIST

- [ ] Test with synergy in each state (draft, review, approved, realized, rejected)
- [ ] Test with 0 transitions (brand new synergy)
- [ ] Test with many transitions (10+)
- [ ] Test compact mode vs full mode
- [ ] Test timeline toggle
- [ ] Test responsive behavior (resize browser)
- [ ] Test with long user emails (truncation)
- [ ] Test with long comments (word wrap)
- [ ] Test loading state
- [ ] Test error state (invalid synergy ID)

---

## 12. ESTIMATED TIME

- WorkflowPipeline component: 2 hours
- WorkflowStage component: 1.5 hours
- StageConnector component: 30 min
- WorkflowTimeline component: 1.5 hours
- Responsive CSS: 1 hour
- Testing & polish: 1.5 hours

**Total: ~8-9 hours**

---

## 13. KNOWN LIMITATIONS (Future Enhancements)

**V1 Limitations:**
- Read-only (cannot trigger state transitions from UI)
- No approval gate rules displayed (e.g., "CFO approval required for >$10M")
- No notifications when workflow state changes

**V2 Enhancements:**
- Add transition action buttons ("Submit for Review", "Approve", "Reject")
- Display workflow rules inline ("This stage requires VP approval")
- Real-time updates via WebSocket when state changes
- Bulk workflow operations (approve multiple synergies)

---

## NEXT STEP

After this component is built, proceed to **03-value-breakdown-dashboard.md** for the second MVP feature.
