'use client';

import { useState, useEffect, useCallback } from 'react';
import { benchmarksApi, dealsApi } from '@/lib/api';
import type { BenchmarkSummary, CompFilters, DealLeversResponse } from '@/lib/types';

interface Props {
  dealId: number;
  currentN: number;
  onLeversUpdated: (response: DealLeversResponse) => void;
}

function fmt(n: number | null | undefined): string {
  if (n == null) return '—';
  if (n >= 1_000_000_000) return `$${(n / 1_000_000_000).toFixed(1)}B`;
  if (n >= 1_000_000) return `$${Math.round(n / 1_000_000)}M`;
  return `$${n.toLocaleString()}`;
}

export default function CompSetPanel({ dealId, currentN, onLeversUpdated }: Props) {
  const [summary, setSummary] = useState<BenchmarkSummary | null>(null);
  const [filters, setFilters] = useState<CompFilters>({});
  const [previewCount, setPreviewCount] = useState<number | null>(null);
  const [expanded, setExpanded] = useState(false);
  const [regenerating, setRegenerating] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    setLoading(true);
    benchmarksApi.getSummary()
      .then(data => {
        setSummary(data);
        setPreviewCount(data.total_projects);
      })
      .catch(e => setError(e.message))
      .finally(() => setLoading(false));
  }, []);

  // Preview filtered count whenever filters change
  const updatePreview = useCallback((newFilters: CompFilters) => {
    if (!summary) return;
    benchmarksApi.getSummary(newFilters)
      .then(data => setPreviewCount(data.filtered_count))
      .catch(() => {});
  }, [summary]);

  const setIndustry = (name: string, checked: boolean) => {
    const current = filters.industries || [];
    const next = checked
      ? [...current, name]
      : current.filter(i => i !== name);
    const newFilters = { ...filters, industries: next.length ? next : undefined };
    setFilters(newFilters);
    updatePreview(newFilters);
  };

  const setSizeMin = (val: string) => {
    const n = val ? parseInt(val) * 1_000_000 : undefined;
    const newFilters = { ...filters, deal_size_min: n };
    setFilters(newFilters);
    updatePreview(newFilters);
  };

  const setSizeMax = (val: string) => {
    const n = val ? parseInt(val) * 1_000_000 : undefined;
    const newFilters = { ...filters, deal_size_max: n };
    setFilters(newFilters);
    updatePreview(newFilters);
  };

  const setYearMin = (val: string) => {
    const n = val ? parseInt(val) : undefined;
    const newFilters = { ...filters, year_min: n };
    setFilters(newFilters);
    updatePreview(newFilters);
  };

  const setYearMax = (val: string) => {
    const n = val ? parseInt(val) : undefined;
    const newFilters = { ...filters, year_max: n };
    setFilters(newFilters);
    updatePreview(newFilters);
  };

  const hasFilters = !!(
    filters.industries?.length ||
    filters.deal_size_min != null ||
    filters.deal_size_max != null ||
    filters.year_min != null ||
    filters.year_max != null
  );

  const handleRegenerate = async () => {
    setRegenerating(true);
    setError(null);
    try {
      const result = await dealsApi.regenerateLevers(dealId, hasFilters ? filters : undefined);
      onLeversUpdated(result);
      setExpanded(false);
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : 'Regeneration failed');
    } finally {
      setRegenerating(false);
    }
  };

  const handleReset = () => {
    const newFilters = {};
    setFilters(newFilters);
    if (summary) setPreviewCount(summary.total_projects);
  };

  if (loading) return null;

  const totalN = summary?.total_projects ?? currentN;
  const activeN = previewCount ?? totalN;
  const industries = summary?.available_industries ?? [];
  const sizeRange = summary?.deal_size_range;
  const yearRange = summary?.year_range;

  return (
    <div className="border border-gray-200 rounded-lg bg-white overflow-hidden">
      {/* Header — always visible */}
      <button
        onClick={() => setExpanded(e => !e)}
        className="w-full flex items-center justify-between px-4 py-3 text-left hover:bg-gray-50 transition-colors"
      >
        <div className="flex items-center gap-3">
          <span className="text-xs font-semibold text-gray-500 uppercase tracking-wider">Comp Set</span>
          <div className="flex items-center gap-1.5">
            <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-[#d04a02] text-white">
              {activeN} comparables
            </span>
            {hasFilters && (
              <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-amber-100 text-amber-800">
                filtered
              </span>
            )}
          </div>
          {industries.length > 0 && !hasFilters && (
            <span className="text-xs text-gray-500">
              {industries.map(i => i.name).join(', ')}
              {sizeRange?.min != null && ` · ${fmt(sizeRange.min)}–${fmt(sizeRange.max)}`}
              {yearRange?.min != null && ` · ${yearRange.min}–${yearRange.max}`}
            </span>
          )}
        </div>
        <svg
          className={`w-4 h-4 text-gray-400 transition-transform ${expanded ? 'rotate-180' : ''}`}
          fill="none" stroke="currentColor" viewBox="0 0 24 24"
        >
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
        </svg>
      </button>

      {/* Expanded filters */}
      {expanded && (
        <div className="border-t border-gray-200 px-4 py-4 space-y-4">
          {error && (
            <p className="text-xs text-red-600 bg-red-50 rounded px-3 py-2">{error}</p>
          )}

          {/* Industry filter */}
          {industries.length > 0 && (
            <div>
              <p className="text-xs font-semibold text-gray-600 mb-2">Industry</p>
              <div className="flex flex-wrap gap-2">
                {industries.map(ind => {
                  const checked = filters.industries?.includes(ind.name) ?? false;
                  return (
                    <label
                      key={ind.name}
                      className={`flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs cursor-pointer border transition-colors ${
                        checked
                          ? 'border-[#d04a02] bg-orange-50 text-[#d04a02]'
                          : 'border-gray-200 bg-white text-gray-600 hover:border-gray-300'
                      }`}
                    >
                      <input
                        type="checkbox"
                        className="hidden"
                        checked={checked}
                        onChange={e => setIndustry(ind.name, e.target.checked)}
                      />
                      {ind.name}
                      <span className="text-gray-400">({ind.count})</span>
                    </label>
                  );
                })}
              </div>
            </div>
          )}

          {/* Deal size filter */}
          <div>
            <p className="text-xs font-semibold text-gray-600 mb-2">
              Combined Revenue Range
              {sizeRange?.min != null && (
                <span className="font-normal text-gray-400 ml-1">
                  (dataset: {fmt(sizeRange.min)}–{fmt(sizeRange.max)})
                </span>
              )}
            </p>
            <div className="flex items-center gap-2">
              <input
                type="number"
                placeholder="Min ($M)"
                className="w-28 px-2 py-1.5 text-xs border border-gray-200 rounded focus:outline-none focus:border-[#d04a02]"
                onChange={e => setSizeMin(e.target.value)}
              />
              <span className="text-gray-400 text-xs">to</span>
              <input
                type="number"
                placeholder="Max ($M)"
                className="w-28 px-2 py-1.5 text-xs border border-gray-200 rounded focus:outline-none focus:border-[#d04a02]"
                onChange={e => setSizeMax(e.target.value)}
              />
            </div>
          </div>

          {/* Year filter */}
          <div>
            <p className="text-xs font-semibold text-gray-600 mb-2">
              Close Year
              {yearRange?.min != null && (
                <span className="font-normal text-gray-400 ml-1">
                  (dataset: {yearRange.min}–{yearRange.max})
                </span>
              )}
            </p>
            <div className="flex items-center gap-2">
              <input
                type="number"
                placeholder="From"
                className="w-24 px-2 py-1.5 text-xs border border-gray-200 rounded focus:outline-none focus:border-[#d04a02]"
                onChange={e => setYearMin(e.target.value)}
              />
              <span className="text-gray-400 text-xs">to</span>
              <input
                type="number"
                placeholder="To"
                className="w-24 px-2 py-1.5 text-xs border border-gray-200 rounded focus:outline-none focus:border-[#d04a02]"
                onChange={e => setYearMax(e.target.value)}
              />
            </div>
          </div>

          {/* Projects table */}
          {summary && (
            <div>
              <p className="text-xs font-semibold text-gray-600 mb-2">
                Comparables
                {hasFilters && (
                  <span className="font-normal text-gray-400 ml-1">
                    — showing {activeN} of {totalN}
                  </span>
                )}
              </p>
              <div className="overflow-x-auto rounded border border-gray-100">
                <table className="w-full text-xs">
                  <thead>
                    <tr className="bg-gray-50 border-b border-gray-100">
                      <th className="text-left px-3 py-2 font-semibold text-gray-500">Deal</th>
                      <th className="text-left px-3 py-2 font-semibold text-gray-500">Industry</th>
                      <th className="text-right px-3 py-2 font-semibold text-gray-500">Rev</th>
                      <th className="text-right px-3 py-2 font-semibold text-gray-500">Year</th>
                      <th className="text-right px-3 py-2 font-semibold text-gray-500">Total %</th>
                    </tr>
                  </thead>
                  <tbody>
                    {(hasFilters ? summary.filtered_projects : summary.projects).map(p => (
                      <tr key={p.id} className="border-b border-gray-50 hover:bg-gray-50">
                        <td className="px-3 py-2 text-gray-700">{p.name}</td>
                        <td className="px-3 py-2 text-gray-500">{p.industry ?? '—'}</td>
                        <td className="px-3 py-2 text-right text-gray-500">{fmt(p.combined_revenue_usd)}</td>
                        <td className="px-3 py-2 text-right text-gray-500">{p.close_year ?? '—'}</td>
                        <td className="px-3 py-2 text-right text-gray-600">
                          {p.total_synergy_pct != null ? `${p.total_synergy_pct.toFixed(1)}%` : '—'}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* Actions */}
          <div className="flex items-center justify-between pt-1">
            <div className="flex items-center gap-2">
              {hasFilters && (
                <button
                  onClick={handleReset}
                  className="text-xs text-gray-500 hover:text-gray-700 underline"
                >
                  Reset filters
                </button>
              )}
              {hasFilters && previewCount != null && (
                <span className="text-xs text-gray-500">
                  → {previewCount} comp{previewCount !== 1 ? 's' : ''} selected
                </span>
              )}
            </div>
            <button
              onClick={handleRegenerate}
              disabled={regenerating || (hasFilters && previewCount === 0)}
              className="flex items-center gap-1.5 px-3 py-1.5 bg-[#d04a02] text-white text-xs font-medium rounded hover:bg-[#b33d00] disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              {regenerating ? (
                <>
                  <svg className="w-3 h-3 animate-spin" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                  </svg>
                  Regenerating…
                </>
              ) : (
                <>
                  <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                  </svg>
                  Regenerate levers
                </>
              )}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
