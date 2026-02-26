'use client';

import { useState } from 'react';
import { ChevronDown, ChevronUp, TrendingUp, DollarSign, BarChart3, CheckCircle2, Clock, Search, XCircle } from 'lucide-react';
import { formatCompactNumber } from '@/lib/utils';
import type { DealLever } from '@/lib/types';

const LEVER_ICONS: Record<string, string> = {
  IT: '💻',
  Finance: '📊',
  HR: '👥',
  Operations: '⚙️',
  Procurement: '🔗',
  'Real Estate': '🏢',
  Revenue: '📈',
};

const STATUS_CONFIG = {
  validated: {
    label: 'Validated',
    color: 'text-emerald-400',
    bg: 'bg-emerald-500/10 border-emerald-500/20',
    icon: CheckCircle2,
  },
  in_analysis: {
    label: 'In Analysis',
    color: 'text-amber-400',
    bg: 'bg-amber-500/10 border-amber-500/20',
    icon: Clock,
  },
  identified: {
    label: 'Identified',
    color: 'text-blue-400',
    bg: 'bg-blue-500/10 border-blue-500/20',
    icon: Search,
  },
  excluded: {
    label: 'Excluded',
    color: 'text-gray-500',
    bg: 'bg-gray-500/10 border-gray-500/20',
    icon: XCircle,
  },
};

const CONFIDENCE_CONFIG = {
  high: { label: 'High confidence', color: 'text-emerald-400', dot: 'bg-emerald-400' },
  medium: { label: 'Medium confidence', color: 'text-amber-400', dot: 'bg-amber-400' },
  low: { label: 'Low confidence', color: 'text-red-400', dot: 'bg-red-400' },
};

interface LeverCardProps {
  lever: DealLever;
  combinedRevenue: number;
  benchmarkN: number;
}

export function LeverCard({ lever, combinedRevenue, benchmarkN }: LeverCardProps) {
  const [expanded, setExpanded] = useState(false);

  const status = STATUS_CONFIG[lever.status] || STATUS_CONFIG.identified;
  const confidence = CONFIDENCE_CONFIG[lever.confidence] || CONFIDENCE_CONFIG.medium;
  const StatusIcon = status.icon;
  const icon = LEVER_ICONS[lever.lever_name] || '📋';
  const isExcluded = lever.status === 'excluded';

  const valueLow = lever.calculated_value_low;
  const valueHigh = lever.calculated_value_high;
  const pctLow = lever.benchmark_pct_low;
  const pctHigh = lever.benchmark_pct_high;

  // Width for the benchmark bar (visual indicator of range magnitude)
  const maxPct = 3.0;
  const barWidth = Math.min((pctHigh / maxPct) * 100, 100);
  const barStart = Math.min((pctLow / maxPct) * 100, 100);

  return (
    <div className={`rounded-2xl border backdrop-blur-lg transition-all duration-200 ${
      isExcluded
        ? 'bg-white/2 border-white/5 opacity-50'
        : 'bg-white/5 border-white/10 hover:border-white/20'
    }`}>
      {/* Main row */}
      <div className="p-5">
        <div className="flex items-start justify-between gap-4">
          {/* Left: lever name + status */}
          <div className="flex items-start gap-3 min-w-0">
            <span className="text-2xl mt-0.5 flex-shrink-0">{icon}</span>
            <div className="min-w-0">
              <div className="flex items-center gap-2 flex-wrap">
                <h3 className="text-lg font-bold text-white">{lever.lever_name}</h3>
                <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium border ${status.bg} ${status.color}`}>
                  <StatusIcon className="w-3 h-3" />
                  {status.label}
                </span>
              </div>
              <div className="flex items-center gap-1 mt-1">
                <span className={`w-1.5 h-1.5 rounded-full flex-shrink-0 ${confidence.dot}`} />
                <span className={`text-xs ${confidence.color}`}>{confidence.label}</span>
                <span className="text-gray-600 text-xs mx-1">·</span>
                <span className="text-xs text-gray-500">{benchmarkN} comparable deals</span>
              </div>
            </div>
          </div>

          {/* Right: $ opportunity */}
          {!isExcluded && (
            <div className="text-right flex-shrink-0">
              <p className="text-xs text-gray-500 mb-1">Synergy opportunity</p>
              <p className="text-xl font-bold text-white font-mono">
                {formatCompactNumber(valueLow)}
                <span className="text-gray-500 font-normal"> – </span>
                {formatCompactNumber(valueHigh)}
              </p>
              <p className="text-xs text-gray-500 mt-0.5">
                {pctLow}–{pctHigh}% of combined revenue
              </p>
            </div>
          )}
        </div>

        {/* Benchmark bar */}
        {!isExcluded && (
          <div className="mt-4 mb-1">
            <div className="flex items-center justify-between text-xs text-gray-500 mb-1.5">
              <span className="flex items-center gap-1">
                <BarChart3 className="w-3 h-3" />
                Benchmark range
              </span>
              <span className="font-mono text-gray-400">{pctLow}% – {pctHigh}%</span>
            </div>
            <div className="h-1.5 bg-white/5 rounded-full overflow-hidden relative">
              <div
                className={`absolute h-full rounded-full ${
                  lever.lever_type === 'revenue' ? 'bg-blue-500/60' : 'bg-emerald-500/60'
                }`}
                style={{ left: `${barStart}%`, width: `${barWidth - barStart}%` }}
              />
            </div>
          </div>
        )}

        {/* Baseline row */}
        {!isExcluded && lever.combined_baseline_usd && (
          <div className="mt-3 flex items-center gap-4 text-xs text-gray-500">
            <span className="flex items-center gap-1">
              <DollarSign className="w-3 h-3" />
              Combined cost baseline:
              <span className="text-gray-300 font-mono ml-1">
                {formatCompactNumber(lever.combined_baseline_usd)}
              </span>
            </span>
          </div>
        )}

        {/* Expand toggle */}
        {(lever.advisor_notes || lever.activities.length > 0) && (
          <button
            onClick={() => setExpanded(!expanded)}
            className="mt-4 flex items-center gap-1.5 text-xs text-gray-500 hover:text-gray-300 transition-colors"
          >
            {expanded ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
            {expanded ? 'Hide details' : `Show details${lever.activities.length > 0 ? ` · ${lever.activities.length} activit${lever.activities.length === 1 ? 'y' : 'ies'}` : ''}`}
          </button>
        )}
      </div>

      {/* Expanded content */}
      {expanded && (
        <div className="border-t border-white/5 px-5 pb-5 pt-4 space-y-4">
          {/* Advisor notes */}
          {lever.advisor_notes && (
            <div className="bg-white/3 rounded-xl p-4">
              <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-2">Analyst Notes</p>
              <p className="text-sm text-gray-300 leading-relaxed">{lever.advisor_notes}</p>
            </div>
          )}

          {/* Activities */}
          {lever.activities.length > 0 && (
            <div>
              <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-3">Specific Opportunities</p>
              <div className="space-y-2">
                {lever.activities.map((activity) => (
                  <div key={activity.id} className="bg-white/3 rounded-lg p-3">
                    <div className="flex items-start justify-between gap-3">
                      <p className="text-sm text-gray-300 leading-relaxed flex-1">{activity.description}</p>
                      <div className="text-right flex-shrink-0">
                        <p className="text-sm font-semibold text-white font-mono">
                          {formatCompactNumber(activity.value_low)}–{formatCompactNumber(activity.value_high)}
                        </p>
                        <p className="text-xs text-gray-500 mt-0.5 capitalize">
                          {activity.synergy_type.replace('_', ' ')}
                        </p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
