import { Info } from 'lucide-react';
import type { SynergyMetric } from '@/lib/types';
import { useState } from 'react';

interface MetricLineItemProps {
  metric: SynergyMetric;
  showDetails?: boolean;
}

export function MetricLineItem({ metric, showDetails = false }: MetricLineItemProps) {
  const [expanded, setExpanded] = useState(false);

  // Confidence badge styling
  const confidenceStyles = {
    high: 'glass-confidence-high border-emerald-500/30 text-emerald-400',
    medium: 'glass-confidence-medium border-amber-500/30 text-amber-400',
    low: 'glass-confidence-low border-red-500/30 text-red-400',
  };

  // Format currency
  const formatValue = (value: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(value);
  };

  return (
    <div className="glass-card border-white/10 bg-white/5 p-4 rounded-lg hover:bg-white/10 transition-colors">
      <div className="flex items-start justify-between gap-4">
        {/* Line item and description */}
        <div className="flex-1">
          <div className="flex items-center gap-2 mb-1">
            <h4 className="text-sm font-medium text-white">{metric.line_item}</h4>
            {showDetails && (
              <button
                onClick={() => setExpanded(!expanded)}
                className="text-gray-400 hover:text-white transition-colors"
                aria-label="Toggle details"
              >
                <Info className="w-4 h-4" />
              </button>
            )}
          </div>
          <p className="text-xs text-gray-400">{metric.description}</p>

          {/* Expanded details */}
          {expanded && showDetails && (
            <div className="mt-3 pt-3 border-t border-white/10 space-y-2">
              <div>
                <span className="text-xs text-gray-500">Assumption:</span>
                <p className="text-xs text-gray-300 mt-1">{metric.assumption}</p>
              </div>
              <div>
                <span className="text-xs text-gray-500">Data Source:</span>
                <p className="text-xs text-gray-300 mt-1">{metric.data_source}</p>
              </div>
            </div>
          )}
        </div>

        {/* Value and confidence */}
        <div className="flex flex-col items-end gap-2">
          <span className="text-sm font-semibold text-white font-mono-numbers">
            {formatValue(metric.value)}
          </span>
          <span className="text-xs text-gray-500">{metric.unit}</span>
          <span
            className={`
              px-2 py-0.5 rounded text-xs font-medium
              ${confidenceStyles[metric.confidence]}
            `}
          >
            {metric.confidence.toUpperCase()}
          </span>
        </div>
      </div>
    </div>
  );
}
