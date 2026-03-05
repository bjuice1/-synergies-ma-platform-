'use client';

import { useState } from 'react';
import { ChevronDown, ChevronUp, CheckCircle2, Clock, Search, XCircle } from 'lucide-react';
import { formatCompactNumber } from '@/lib/utils';
import type { DealLever } from '@/lib/types';

const LEVER_ICONS: Record<string, string> = {
  IT:             '💻',
  Finance:        '📊',
  HR:             '👥',
  Operations:     '⚙️',
  Procurement:    '🔗',
  'Real Estate':  '🏢',
  Revenue:        '📈',
};

const STATUS_CONFIG = {
  validated:   { label: 'Validated',   color: 'text-emerald-400', bg: 'bg-emerald-500/10 border-emerald-500/20', icon: CheckCircle2 },
  in_analysis: { label: 'In Analysis', color: 'text-amber-400',   bg: 'bg-amber-500/10 border-amber-500/20',   icon: Clock },
  identified:  { label: 'Identified',  color: 'text-sky-400',     bg: 'bg-sky-500/10 border-sky-500/20',       icon: Search },
  excluded:    { label: 'Excluded',    color: 'text-slate-500',   bg: 'bg-slate-500/10 border-slate-500/20',   icon: XCircle },
};

const CONFIDENCE_CONFIG = {
  high:   { label: 'High',   dot: 'bg-emerald-400' },
  medium: { label: 'Medium', dot: 'bg-amber-400' },
  low:    { label: 'Low',    dot: 'bg-slate-500' },
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
  const isRevenue = lever.lever_type === 'revenue';

  const pctLow  = lever.benchmark_pct_low;
  const pctHigh = lever.benchmark_pct_high;

  // Benchmark bar — scale to max 3% for cost, 8% for revenue
  const maxPct = isRevenue ? 8.0 : 3.0;
  const barStart = Math.min((pctLow  / maxPct) * 100, 100);
  const barWidth = Math.min((pctHigh / maxPct) * 100, 100) - barStart;

  const accentColor = isRevenue ? 'border-sky-500/20' : 'border-white/8';
  const barColor    = isRevenue ? 'bg-sky-500/70' : 'bg-orange-500/70';

  return (
    <div className={`rounded-xl border bg-[#0E1220] transition-all duration-150 ${
      isExcluded ? 'opacity-40 ' + accentColor : accentColor + ' hover:border-white/15'
    }`}>
      <div className="p-5">
        <div className="flex items-start justify-between gap-4">

          {/* Left: icon + name + status */}
          <div className="flex items-start gap-3 min-w-0">
            <span className="text-xl mt-0.5 flex-shrink-0">{icon}</span>
            <div className="min-w-0">
              <div className="flex items-center gap-2 flex-wrap">
                <h3 className="text-base font-bold text-white">{lever.lever_name}</h3>
                <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium border ${status.bg} ${status.color}`}>
                  <StatusIcon className="w-3 h-3" />
                  {status.label}
                </span>
              </div>
              <div className="flex items-center gap-1.5 mt-1">
                <span className={`w-1.5 h-1.5 rounded-full flex-shrink-0 ${confidence.dot}`} />
                <span className="text-xs text-slate-500">{confidence.label} confidence</span>
                <span className="text-slate-700 text-xs mx-0.5">·</span>
                <span className="text-xs text-slate-500">{benchmarkN} deals</span>
              </div>
            </div>
          </div>

          {/* Right: $ range */}
          {!isExcluded && (
            <div className="text-right flex-shrink-0">
              <p className="text-xs text-slate-500 mb-1">Synergy opportunity</p>
              <p className="text-xl font-bold text-white font-mono tabular-nums">
                {formatCompactNumber(lever.calculated_value_low)}
                <span className="text-slate-600 font-normal text-base mx-1.5">–</span>
                {formatCompactNumber(lever.calculated_value_high)}
              </p>
              <p className="text-xs text-slate-500 mt-0.5 font-mono">
                {pctLow}–{pctHigh}% of rev
              </p>
            </div>
          )}
        </div>

        {/* Benchmark bar */}
        {!isExcluded && (
          <div className="mt-4">
            <div className="flex items-center justify-between text-xs text-slate-600 mb-1.5">
              <span>Benchmark range ({benchmarkN} deals)</span>
              <span className="font-mono text-slate-400">{pctLow}% – {pctHigh}%</span>
            </div>
            <div className="h-1 bg-white/5 rounded-full overflow-hidden relative">
              <div
                className={`absolute h-full rounded-full ${barColor}`}
                style={{ left: `${barStart}%`, width: `${barWidth}%` }}
              />
            </div>
          </div>
        )}

        {/* Baseline */}
        {!isExcluded && lever.combined_baseline_usd && (
          <p className="mt-2.5 text-xs text-slate-600">
            Combined cost baseline:
            <span className="text-slate-400 font-mono ml-1.5">
              {formatCompactNumber(lever.combined_baseline_usd)}
            </span>
          </p>
        )}

        {/* Expand toggle */}
        {(lever.advisor_notes || lever.activities.length > 0) && (
          <button
            onClick={() => setExpanded(!expanded)}
            className="mt-4 flex items-center gap-1.5 text-xs text-slate-600 hover:text-slate-300 transition-colors"
          >
            {expanded ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
            {expanded
              ? 'Hide details'
              : `Show details${lever.activities.length > 0 ? ` · ${lever.activities.length} activit${lever.activities.length === 1 ? 'y' : 'ies'}` : ''}`
            }
          </button>
        )}
      </div>

      {/* Expanded panel */}
      {expanded && (
        <div className="border-t border-white/5 px-5 pb-5 pt-4 space-y-4">
          {lever.advisor_notes && (
            <div className="bg-white/3 rounded-lg p-4 border-l-2 border-orange-500/40">
              <p className="text-xs font-semibold text-slate-500 uppercase tracking-wide mb-2">Analyst Notes</p>
              <p className="text-sm text-slate-300 leading-relaxed">{lever.advisor_notes}</p>
            </div>
          )}

          {lever.activities.length > 0 && (
            <div>
              <p className="text-xs font-semibold text-slate-500 uppercase tracking-wide mb-3">Specific Opportunities</p>
              <div className="space-y-2">
                {lever.activities.map((activity) => (
                  <div key={activity.id} className="bg-white/3 rounded-lg p-3 border border-white/5">
                    <div className="flex items-start justify-between gap-3">
                      <p className="text-sm text-slate-300 leading-relaxed flex-1">{activity.description}</p>
                      <div className="text-right flex-shrink-0">
                        <p className="text-sm font-semibold text-white font-mono tabular-nums">
                          {formatCompactNumber(activity.value_low)}–{formatCompactNumber(activity.value_high)}
                        </p>
                        <p className="text-xs text-slate-600 mt-0.5 capitalize">
                          {activity.synergy_type.replace(/_/g, ' ')}
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
