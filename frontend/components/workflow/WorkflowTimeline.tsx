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
