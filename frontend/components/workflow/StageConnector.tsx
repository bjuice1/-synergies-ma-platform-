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
