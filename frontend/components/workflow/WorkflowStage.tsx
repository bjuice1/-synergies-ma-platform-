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
