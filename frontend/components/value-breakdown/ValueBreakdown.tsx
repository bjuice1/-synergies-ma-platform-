'use client';

import { useSynergyMetrics } from '@/hooks/useMetrics';
import { CategoryGroup } from './CategoryGroup';
import { AssumptionsPanel } from './AssumptionsPanel';
import { LoadingSpinner } from '@/components/ui/loading-spinner';
import { ErrorMessage } from '@/components/ui/error-message';
import { TrendingUp, TrendingDown } from 'lucide-react';

interface ValueBreakdownProps {
  synergyId: number;
  showAssumptions?: boolean;
}

export function ValueBreakdown({ synergyId, showAssumptions = true }: ValueBreakdownProps) {
  const { data, isLoading, error, refetch } = useSynergyMetrics(synergyId);

  if (isLoading) return <LoadingSpinner />;
  if (error) return <ErrorMessage error={error} retry={refetch} />;
  if (!data) return null;

  // Group metrics by category
  const metricsByCategory = data.metrics.reduce((acc, metric) => {
    if (!acc[metric.category]) {
      acc[metric.category] = [];
    }
    acc[metric.category].push(metric);
    return acc;
  }, {} as Record<string, typeof data.metrics>);

  // Sort categories by total value (descending)
  const sortedCategories = Object.entries(metricsByCategory).sort(
    ([, metricsA], [, metricsB]) => {
      const totalA = metricsA.reduce((sum, m) => sum + m.value, 0);
      const totalB = metricsB.reduce((sum, m) => sum + m.value, 0);
      return totalB - totalA;
    }
  );

  // Format currency
  const formatValue = (value: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(value);
  };

  // Calculate value range midpoint
  const estimatedValue = (data.total_value_low + data.total_value_high) / 2;

  return (
    <div className="space-y-6">
      {/* Header with value summary */}
      <div className="glass-card border-white/10 bg-white/5 backdrop-blur-lg p-6 rounded-2xl">
        <div className="flex items-start justify-between mb-6">
          <div>
            <h3 className="text-lg font-semibold text-white mb-1">Value Breakdown</h3>
            <p className="text-sm text-gray-400">
              Detailed breakdown of synergy value calculation
            </p>
          </div>
          <div className="text-right">
            <p className="text-xs text-gray-500 mb-1">Estimated Value</p>
            <p className="text-2xl font-bold text-emerald-400 font-mono-numbers">
              {formatValue(estimatedValue)}
            </p>
          </div>
        </div>

        {/* Value Range */}
        <div className="grid grid-cols-2 gap-4">
          <div className="glass-card border-green-500/20 bg-green-500/5 p-4 rounded-lg">
            <div className="flex items-center gap-2 mb-2">
              <TrendingUp className="w-4 h-4 text-green-400" />
              <span className="text-xs text-gray-400">High Estimate</span>
            </div>
            <p className="text-lg font-semibold text-white font-mono-numbers">
              {formatValue(data.total_value_high)}
            </p>
          </div>

          <div className="glass-card border-amber-500/20 bg-amber-500/5 p-4 rounded-lg">
            <div className="flex items-center gap-2 mb-2">
              <TrendingDown className="w-4 h-4 text-amber-400" />
              <span className="text-xs text-gray-400">Low Estimate</span>
            </div>
            <p className="text-lg font-semibold text-white font-mono-numbers">
              {formatValue(data.total_value_low)}
            </p>
          </div>
        </div>

        {/* Metric count */}
        <div className="mt-4 pt-4 border-t border-white/10">
          <p className="text-xs text-gray-400">
            Based on <span className="text-white font-medium">{data.metrics.length}</span> line items
            across <span className="text-white font-medium">{sortedCategories.length}</span> categories
          </p>
        </div>
      </div>

      {/* Category Groups */}
      <div className="space-y-4">
        {sortedCategories.map(([category, metrics]) => (
          <CategoryGroup
            key={category}
            category={category}
            metrics={metrics}
            defaultExpanded={false}
          />
        ))}
      </div>

      {/* Assumptions Panel */}
      {showAssumptions && (
        <div>
          <h4 className="text-sm font-semibold text-white mb-3">Data Quality Assessment</h4>
          <AssumptionsPanel metrics={data.metrics} />
        </div>
      )}
    </div>
  );
}
