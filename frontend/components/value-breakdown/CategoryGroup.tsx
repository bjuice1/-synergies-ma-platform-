'use client';

import { ChevronDown, ChevronRight } from 'lucide-react';
import { useState } from 'react';
import type { SynergyMetric } from '@/lib/types';
import { MetricLineItem } from './MetricLineItem';

interface CategoryGroupProps {
  category: string;
  metrics: SynergyMetric[];
  defaultExpanded?: boolean;
}

export function CategoryGroup({ category, metrics, defaultExpanded = false }: CategoryGroupProps) {
  const [expanded, setExpanded] = useState(defaultExpanded);

  // Calculate category total
  const categoryTotal = metrics.reduce((sum, metric) => sum + metric.value, 0);

  // Format currency
  const formatValue = (value: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(value);
  };

  // Confidence distribution for category
  const confidenceDistribution = {
    high: metrics.filter(m => m.confidence === 'high').length,
    medium: metrics.filter(m => m.confidence === 'medium').length,
    low: metrics.filter(m => m.confidence === 'low').length,
  };

  return (
    <div className="glass-card border-white/10 bg-white/5 rounded-lg overflow-hidden">
      {/* Category Header (Clickable to expand/collapse) */}
      <button
        onClick={() => setExpanded(!expanded)}
        className="w-full p-4 flex items-center justify-between hover:bg-white/10 transition-colors"
      >
        <div className="flex items-center gap-3">
          {expanded ? (
            <ChevronDown className="w-5 h-5 text-emerald-400" />
          ) : (
            <ChevronRight className="w-5 h-5 text-gray-400" />
          )}
          <div className="text-left">
            <h3 className="text-base font-semibold text-white">{category}</h3>
            <p className="text-xs text-gray-400 mt-0.5">
              {metrics.length} line item{metrics.length > 1 ? 's' : ''} •{' '}
              {confidenceDistribution.high > 0 && (
                <span className="text-emerald-400">{confidenceDistribution.high} high</span>
              )}
              {confidenceDistribution.medium > 0 && (
                <>
                  {confidenceDistribution.high > 0 && ', '}
                  <span className="text-amber-400">{confidenceDistribution.medium} medium</span>
                </>
              )}
              {confidenceDistribution.low > 0 && (
                <>
                  {(confidenceDistribution.high > 0 || confidenceDistribution.medium > 0) && ', '}
                  <span className="text-red-400">{confidenceDistribution.low} low</span>
                </>
              )}
            </p>
          </div>
        </div>

        <div className="text-right">
          <span className="text-lg font-bold text-white font-mono-numbers">
            {formatValue(categoryTotal)}
          </span>
          <p className="text-xs text-gray-500">Total Value</p>
        </div>
      </button>

      {/* Expanded Metrics List */}
      {expanded && (
        <div className="border-t border-white/10 p-4 space-y-3 bg-black/10">
          {metrics.map(metric => (
            <MetricLineItem key={metric.id} metric={metric} showDetails />
          ))}
        </div>
      )}
    </div>
  );
}
