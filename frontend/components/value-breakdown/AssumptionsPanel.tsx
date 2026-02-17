import { AlertTriangle, FileQuestion } from 'lucide-react';
import type { SynergyMetric } from '@/lib/types';

interface AssumptionsPanelProps {
  metrics: SynergyMetric[];
}

export function AssumptionsPanel({ metrics }: AssumptionsPanelProps) {
  // Identify metrics with low confidence or weak data sources
  const lowConfidenceMetrics = metrics.filter(m => m.confidence === 'low');
  const weakDataSources = metrics.filter(m =>
    m.data_source.toLowerCase().includes('estimate') ||
    m.data_source.toLowerCase().includes('assumption') ||
    m.data_source.toLowerCase().includes('unknown')
  );

  // Calculate total value at risk from low confidence metrics
  const valueAtRisk = lowConfidenceMetrics.reduce((sum, m) => sum + m.value, 0);

  const formatValue = (value: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(value);
  };

  if (lowConfidenceMetrics.length === 0 && weakDataSources.length === 0) {
    return (
      <div className="glass-confidence-high border-emerald-500/20 bg-emerald-500/5 p-4 rounded-lg">
        <div className="flex items-center gap-2 text-emerald-400">
          <div className="w-2 h-2 rounded-full bg-emerald-400" />
          <p className="text-sm font-medium">All estimates backed by strong data</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Data Quality Warning */}
      {lowConfidenceMetrics.length > 0 && (
        <div className="glass-card border-amber-500/20 bg-amber-500/5 p-4 rounded-lg">
          <div className="flex items-start gap-3">
            <AlertTriangle className="w-5 h-5 text-amber-400 flex-shrink-0 mt-0.5" />
            <div className="flex-1">
              <h4 className="text-sm font-medium text-amber-400 mb-2">
                Low Confidence Estimates
              </h4>
              <p className="text-xs text-gray-400 mb-3">
                {lowConfidenceMetrics.length} line item{lowConfidenceMetrics.length > 1 ? 's' : ''} have low confidence,
                representing {formatValue(valueAtRisk)} in value.
              </p>
              <ul className="space-y-1">
                {lowConfidenceMetrics.map(metric => (
                  <li key={metric.id} className="text-xs text-gray-300 flex items-start gap-2">
                    <span className="text-amber-400">•</span>
                    <span>
                      <strong>{metric.line_item}</strong> - {metric.assumption}
                    </span>
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </div>
      )}

      {/* Weak Data Sources */}
      {weakDataSources.length > 0 && (
        <div className="glass-card border-blue-500/20 bg-blue-500/5 p-4 rounded-lg">
          <div className="flex items-start gap-3">
            <FileQuestion className="w-5 h-5 text-blue-400 flex-shrink-0 mt-0.5" />
            <div className="flex-1">
              <h4 className="text-sm font-medium text-blue-400 mb-2">
                Data Gaps Identified
              </h4>
              <p className="text-xs text-gray-400 mb-3">
                {weakDataSources.length} estimate{weakDataSources.length > 1 ? 's' : ''} based on assumptions
                or incomplete data. Consider requesting these items from business units:
              </p>
              <ul className="space-y-1">
                {weakDataSources.map(metric => (
                  <li key={metric.id} className="text-xs text-gray-300 flex items-start gap-2">
                    <span className="text-blue-400">•</span>
                    <span>
                      <strong>{metric.category}</strong>: {metric.line_item}
                      <span className="text-gray-500"> (Source: {metric.data_source})</span>
                    </span>
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
