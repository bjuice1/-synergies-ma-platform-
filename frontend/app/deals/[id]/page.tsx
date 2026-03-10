'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { useAuth } from '@/hooks/useAuth';
import { useDeal } from '@/hooks/useDeals';
import { dealsApi, learnApi, companiesApi } from '@/lib/api';
import { LeverCard } from '@/components/levers/LeverCard';
import CompSetPanel from '@/components/deals/CompSetPanel';
import { Button } from '@/components/ui/button';
import { LoadingSpinner } from '@/components/ui/loading-spinner';
import { ArrowLeft, TrendingUp, Database, MessageSquare, FileText, Sparkles, ChevronDown, ChevronUp, AlertCircle, Download, Pencil, Check, X, Users } from 'lucide-react';
import type { DealPerspective, DealLeversResponse } from '@/lib/types';
import { formatCompactNumber } from '@/lib/utils';

const NAV_LINKS = [
  { href: '/dashboard', label: 'Dashboard' },
  { href: '/deals',     label: 'Deals' },
  { href: '/learn',     label: 'Learn' },
  { href: '/chat',      label: 'AI Chat' },
];

interface DealProfile {
  acquirer_view: {
    headline: string;
    strategic_goals: string[];
    integration_approach: string;
    key_risks: string[];
  };
  target_view: {
    headline: string;
    value_drivers: string[];
    vulnerabilities: string[];
    retention_priorities: string[];
  };
  integration_environment: {
    complexity: 'low' | 'medium' | 'high';
    complexity_rationale: string;
    critical_first_100_days: string[];
    cultural_considerations: string;
    timeline_pressure: string;
  };
}

export default function DealDetailPage({ params }: { params: { id: string } }) {
  const router = useRouter();
  const queryClient = useQueryClient();
  const { isAuthenticated, loading: authLoading } = useAuth();
  const dealId = parseInt(params.id);

  const [exporting, setExporting] = useState(false);
  const [populatingBrief, setPopulatingBrief] = useState(false);
  const [populateError, setPopulateError]     = useState<string | null>(null);
  const [populateDone, setPopulateDone]        = useState(false);
  const [perspective, setPerspective]          = useState<DealPerspective>('combined');

  // Company inline edit state
  const [editingCompany, setEditingCompany] = useState<'acquirer' | 'target' | null>(null);
  const [editRevenue, setEditRevenue]       = useState('');
  const [editEmployees, setEditEmployees]   = useState('');
  const [savingCompany, setSavingCompany]   = useState(false);

  const [profile, setProfile]             = useState<DealProfile | null>(null);
  const [profileLoading, setProfileLoading] = useState(false);
  const [profileError, setProfileError]   = useState<string | null>(null);
  const [profileOpen, setProfileOpen]     = useState(false);

  const { data: deal, isLoading: dealLoading, error: dealError } = useDeal(dealId);
  const { data: leversData, isLoading: leversLoading } = useQuery({
    queryKey: ['deal-levers', dealId],
    queryFn: () => dealsApi.getLevers(dealId),
    enabled: !!dealId && isAuthenticated,
  });

  const { data: playbooks } = useQuery({
    queryKey: ['learn-playbooks'],
    queryFn: () => learnApi.getAll(),
    staleTime: 5 * 60 * 1000,
  });

  useEffect(() => {
    if (!authLoading && !isAuthenticated) router.push('/login');
  }, [isAuthenticated, authLoading, router]);

  if (authLoading || dealLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-gray-50">
        <LoadingSpinner size="lg" />
      </div>
    );
  }

  if (dealError || !deal) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="border border-red-200 bg-red-50 p-8 rounded-xl max-w-md text-center">
          <h2 className="text-xl font-bold text-red-600 mb-2">Deal Not Found</h2>
          <p className="text-gray-500 mb-4">The deal you are looking for does not exist.</p>
          <Button onClick={() => router.push('/deals')} variant="outline">
            <ArrowLeft className="w-4 h-4 mr-2" /> Back to Deals
          </Button>
        </div>
      </div>
    );
  }

  const summary      = leversData?.summary;
  const levers       = leversData?.levers ?? [];
  const costLevers   = levers.filter(l => l.lever_type === 'cost');
  const revenueLevers = levers.filter(l => l.lever_type === 'revenue');

  const acqRev = deal?.acquirer?.revenue_usd ?? 0;
  const tgtRev = deal?.target?.revenue_usd   ?? 0;
  const combinedRev = acqRev + tgtRev;
  const perspectiveScale = perspective === 'acquirer' && combinedRev > 0
    ? acqRev / combinedRev
    : perspective === 'target' && combinedRev > 0
    ? tgtRev / combinedRev
    : 1;
  function scaleSummary(v: number | null | undefined): number {
    if (v == null) return 0;
    return Math.round(v * perspectiveScale);
  }

  async function handleExport() {
    if (!deal) return;
    setExporting(true);
    try {
      await dealsApi.exportExcel(dealId, deal.name);
    } catch (err) {
      console.error('Export failed', err);
    } finally {
      setExporting(false);
    }
  }

  async function handlePopulateFromBrief() {
    setPopulatingBrief(true);
    setPopulateError(null);
    try {
      await dealsApi.populateFromBrief(dealId);
      await queryClient.invalidateQueries({ queryKey: ['deal-levers', dealId] });
      setPopulateDone(true);
    } catch (err: any) {
      setPopulateError(err?.response?.data?.error ?? err.message ?? 'Failed to populate');
    } finally {
      setPopulatingBrief(false);
    }
  }

  function handleLeversUpdated(newData: DealLeversResponse) {
    queryClient.setQueryData(['deal-levers', dealId], newData);
  }

  async function handleGenerateProfile() {
    if (!deal?.deal_briefing_document) return;
    setProfileLoading(true);
    setProfileError(null);
    setProfileOpen(true);
    try {
      const res = await fetch('/api/deal-profile', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          brief: deal.deal_briefing_document,
          dealName: deal.name,
          acquirerName: deal.acquirer?.name ?? '',
          targetName: deal.target?.name ?? '',
        }),
      });
      if (!res.ok) {
        const body = await res.json().catch(() => ({}));
        throw new Error(body.error ?? `HTTP ${res.status}`);
      }
      setProfile(await res.json());
    } catch (err: any) {
      setProfileError(err.message ?? 'Profile generation failed');
    } finally {
      setProfileLoading(false);
    }
  }

  function startEditCompany(role: 'acquirer' | 'target') {
    const company = role === 'acquirer' ? deal?.acquirer : deal?.target;
    if (!company) return;
    setEditRevenue(company.revenue_usd ? String(company.revenue_usd / 1_000_000) : '');
    setEditEmployees(company.employees ? String(company.employees) : '');
    setEditingCompany(role);
  }

  async function saveCompany() {
    if (!editingCompany || !deal) return;
    const company = editingCompany === 'acquirer' ? deal.acquirer : deal.target;
    if (!company) return;
    setSavingCompany(true);
    try {
      const revNum = editRevenue ? Math.round(parseFloat(editRevenue) * 1_000_000) : null;
      const empNum = editEmployees ? parseInt(editEmployees) : null;
      await companiesApi.update(company.id, { revenue_usd: revNum, employees: empNum });
      queryClient.invalidateQueries({ queryKey: ['deal', dealId] });
      queryClient.invalidateQueries({ queryKey: ['deal-levers', dealId] });
      setEditingCompany(null);
    } catch {
      // silent fail — values revert on next render
    } finally {
      setSavingCompany(false);
    }
  }

  function handleAskAIAboutDeal() {
    if (!summary || !deal) return;
    const context = {
      deal_name: deal.name,
      acquirer_name: deal.acquirer?.name ?? '',
      acquirer_revenue: deal.acquirer?.revenue_usd ?? null,
      target_name: deal.target?.name ?? '',
      target_revenue: deal.target?.revenue_usd ?? null,
      lever_name: 'All Levers',
      lever_type: 'overview',
      value_low: summary.total_cost_synergy_low,
      value_high: summary.total_cost_synergy_high,
      pct_low: summary.total_pct_low,
      pct_high: summary.total_pct_high,
      benchmark_n: summary.benchmark_n,
      environment_data: {},
      subtypes: costLevers.map(l => ({
        name: l.lever_name,
        typical_pct: l.benchmark_pct_median,
        description: `${formatCompactNumber(l.calculated_value_low)}–${formatCompactNumber(l.calculated_value_high)}`,
      })),
    };
    sessionStorage.setItem('leverChatContext', JSON.stringify(context));
    router.push('/chat');
  }

  return (
    <div className="min-h-screen bg-gray-50">

      {/* Top nav */}
      <header className="border-b border-gray-200 bg-white">
        <div className="max-w-7xl mx-auto px-6 lg:px-8">
          <div className="flex items-center justify-between h-14">
            <div className="flex items-center gap-3">
              <button
                onClick={() => router.push('/deals')}
                className="p-1.5 text-gray-400 hover:text-gray-900 hover:bg-gray-100 rounded-md transition-colors"
              >
                <ArrowLeft className="w-4 h-4" />
              </button>
              <div className="w-px h-4 bg-gray-200" />
              <div className="w-1 h-6 bg-[#D04A02] rounded-full" />
              <span className="text-sm font-semibold text-gray-900 tracking-wide">SYNERGIES</span>
            </div>
            <nav className="flex items-center gap-1">
              {NAV_LINKS.map(link => (
                <a
                  key={link.href}
                  href={link.href}
                  className="px-4 py-2 text-sm font-medium text-gray-500 hover:text-gray-900 hover:bg-gray-100 rounded-md transition-colors"
                >
                  {link.label}
                </a>
              ))}
            </nav>
          </div>
        </div>
      </header>

      {/* Deal header band */}
      <div className="border-b border-gray-200 bg-white">
        <div className="max-w-7xl mx-auto px-6 lg:px-8 py-6">
          <p className="text-xs font-semibold text-[#D04A02] uppercase tracking-widest mb-1.5 capitalize">
            {deal.deal_type} &middot; {deal.status}
          </p>
          <h1 className="text-2xl font-bold text-gray-900 mb-5">{deal.name}</h1>

          <div className="flex items-center gap-10 flex-wrap">
            {(['acquirer', 'target'] as const).map(role => {
              const company = deal[role];
              if (!company) return null;
              const dot = role === 'acquirer' ? 'bg-[#D04A02]' : 'bg-sky-500';
              const isEditing = editingCompany === role;
              return (
                <div key={role}>
                  <p className="text-xs text-gray-400 mb-1 capitalize">{role}</p>
                  {isEditing ? (
                    <div className="flex items-center gap-2" onClick={e => e.stopPropagation()}>
                      <div className={`w-2 h-2 rounded-full flex-shrink-0 ${dot}`} />
                      <span className="text-sm font-semibold text-gray-900">{company.name}</span>
                      <input
                        type="number"
                        value={editRevenue}
                        onChange={e => setEditRevenue(e.target.value)}
                        placeholder="Revenue $M"
                        className="w-24 border border-gray-300 rounded px-2 py-0.5 text-xs font-mono focus:outline-none focus:border-[#D04A02]"
                        autoFocus
                      />
                      <span className="text-xs text-gray-400">$M rev</span>
                      <input
                        type="number"
                        value={editEmployees}
                        onChange={e => setEditEmployees(e.target.value)}
                        placeholder="Employees"
                        className="w-24 border border-gray-300 rounded px-2 py-0.5 text-xs font-mono focus:outline-none focus:border-[#D04A02]"
                      />
                      <span className="text-xs text-gray-400">emp</span>
                      <button onClick={saveCompany} disabled={savingCompany} className="p-1 rounded text-emerald-600 hover:bg-emerald-50 disabled:opacity-40">
                        <Check className="w-3.5 h-3.5" />
                      </button>
                      <button onClick={() => setEditingCompany(null)} className="p-1 rounded text-gray-400 hover:bg-gray-100">
                        <X className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  ) : (
                    <div className="flex items-center gap-2 group/company">
                      <div className={`w-2 h-2 rounded-full ${dot}`} />
                      <p className="text-sm font-semibold text-gray-900">{company.name}</p>
                      {company.revenue_usd && (
                        <span className="text-xs text-gray-500 font-mono">
                          {formatCompactNumber(company.revenue_usd)} rev
                        </span>
                      )}
                      {company.employees && (
                        <span className="text-xs text-gray-400 font-mono flex items-center gap-1">
                          <Users className="w-3 h-3" />{company.employees.toLocaleString()}
                        </span>
                      )}
                      <button
                        onClick={() => startEditCompany(role)}
                        className="opacity-0 group-hover/company:opacity-100 transition-opacity p-0.5 rounded text-gray-400 hover:text-gray-700"
                        title="Edit revenue & headcount"
                      >
                        <Pencil className="w-3 h-3" />
                      </button>
                    </div>
                  )}
                </div>
              );
            })}
            {deal.deal_size_usd && (
              <div>
                <p className="text-xs text-gray-400 mb-1">Deal Size</p>
                <p className="text-sm font-bold text-gray-900 font-mono">{formatCompactNumber(deal.deal_size_usd)}</p>
              </div>
            )}
            {deal.close_date && (
              <div>
                <p className="text-xs text-gray-400 mb-1">Expected Close</p>
                <p className="text-sm font-semibold text-gray-900">
                  {new Date(deal.close_date).toLocaleDateString('en-US', { year: 'numeric', month: 'short' })}
                </p>
              </div>
            )}
          </div>
        </div>
      </div>

      <main className="max-w-7xl mx-auto px-6 lg:px-8 py-8 space-y-8">

        {/* Synergy opportunity hero */}
        {summary && (
          <div className="rounded-xl border border-orange-200 bg-gradient-to-r from-orange-50 via-orange-50/40 to-white p-6">
            <div className="flex items-start justify-between flex-wrap gap-6">
              <div>
                <div className="flex items-center gap-3 mb-3">
                  <p className="text-xs font-semibold text-[#D04A02] uppercase tracking-widest">
                    Cost Synergy Opportunity
                  </p>
                  {/* Deal-level perspective toggle */}
                  <div className="flex items-center gap-1 rounded-lg bg-white border border-gray-200 p-0.5">
                    {([
                      { key: 'combined', label: 'Combined' },
                      { key: 'acquirer', label: deal.acquirer?.name?.split(' ')[0] ?? 'Acquirer' },
                      { key: 'target',   label: deal.target?.name?.split(' ')[0]   ?? 'Target'   },
                    ] as { key: DealPerspective; label: string }[]).map(({ key, label }) => (
                      <button
                        key={key}
                        onClick={() => setPerspective(key)}
                        className={`px-2.5 py-1 rounded-md text-xs font-medium transition-all ${
                          perspective === key
                            ? 'bg-gray-900 text-white shadow-sm'
                            : 'text-gray-500 hover:text-gray-800'
                        }`}
                      >
                        {label}
                      </button>
                    ))}
                  </div>
                </div>
                <p className="text-5xl font-bold text-gray-900 font-mono tracking-tight leading-none">
                  {formatCompactNumber(scaleSummary(summary.total_realizable_low ?? summary.total_cost_synergy_low))}
                  <span className="text-gray-300 font-normal text-3xl mx-3">–</span>
                  {formatCompactNumber(scaleSummary(summary.total_realizable_high ?? summary.total_cost_synergy_high))}
                </p>
                <p className="text-sm text-gray-500 mt-3">
                  <span className="text-[#D04A02] font-semibold font-mono">
                    Realizable ({Math.round((summary.realization_factor ?? 0.75) * 100)}% capture)
                    {perspective !== 'combined' && ` · ${perspective === 'acquirer' ? deal.acquirer?.name : deal.target?.name} view`}
                  </span>
                  {' · '}
                  <span className="font-mono text-gray-400">
                    theoretical {formatCompactNumber(scaleSummary(summary.total_cost_synergy_low))}–{formatCompactNumber(scaleSummary(summary.total_cost_synergy_high))}
                  </span>
                </p>
                <p className="text-xs text-gray-400 mt-1">
                  <span className="font-mono">
                    {summary.total_pct_low}–{summary.total_pct_high}% IQR
                  </span>
                  {' '}of{' '}
                  <span className="font-mono">{formatCompactNumber(summary.combined_revenue)}</span>
                  {' '}combined revenue
                </p>

                {/* Lever jump links */}
                {costLevers.length > 0 && (
                  <div className="flex flex-wrap gap-1.5 mt-4 pt-4 border-t border-orange-100">
                    {costLevers.map(l => (
                      <a
                        key={l.id}
                        href={`#lever-${l.id}`}
                        onClick={e => {
                          e.preventDefault();
                          document.getElementById(`lever-${l.id}`)?.scrollIntoView({ behavior: 'smooth', block: 'center' });
                        }}
                        className="px-2.5 py-1 rounded-full bg-white border border-orange-200 text-xs font-medium text-gray-600 hover:border-[#D04A02] hover:text-[#D04A02] transition-colors"
                      >
                        {l.lever_name}
                        <span className="ml-1.5 font-mono text-gray-400">
                          {formatCompactNumber(scaleSummary(l.realizable_value_low ?? l.calculated_value_low))}–{formatCompactNumber(scaleSummary(l.realizable_value_high ?? l.calculated_value_high))}
                        </span>
                      </a>
                    ))}
                  </div>
                )}
              </div>
              <div className="flex flex-col items-end gap-4">
                <div className="text-right">
                  <p className="text-xs text-gray-400 mb-2 flex items-center gap-1.5 justify-end">
                    <Database className="w-3.5 h-3.5" />
                    Benchmark basis
                  </p>
                  <p className="text-4xl font-bold text-gray-900">{summary.benchmark_n}</p>
                  <p className="text-xs text-gray-400 mt-1">comparable transactions</p>
                </div>
                <div className="flex items-center gap-2">
                  <button
                    onClick={handleExport}
                    disabled={exporting}
                    className="flex items-center gap-2 px-4 py-2 border border-gray-200 bg-white hover:bg-gray-50 disabled:opacity-50 text-gray-700 text-sm font-medium rounded-lg transition-all"
                  >
                    {exporting ? (
                      <span className="w-4 h-4 rounded-full border-2 border-gray-400 border-t-transparent animate-spin" />
                    ) : (
                      <Download className="w-4 h-4" />
                    )}
                    Export Excel
                  </button>
                  <button
                    onClick={handleAskAIAboutDeal}
                    className="flex items-center gap-2 px-4 py-2 bg-[#D04A02] hover:bg-orange-700 text-white text-sm font-medium rounded-lg transition-all"
                  >
                    <MessageSquare className="w-4 h-4" />
                    Ask AI about this deal
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Comp set panel */}
        {summary && (
          <CompSetPanel
            dealId={dealId}
            currentN={summary.benchmark_n}
            onLeversUpdated={handleLeversUpdated}
          />
        )}

        {/* Auto-populate from brief banner */}
        {deal.deal_briefing_document && !populateDone && (
          <div className="rounded-xl border border-amber-200 bg-amber-50 p-4 flex items-start gap-4">
            <div className="w-8 h-8 rounded-lg bg-amber-100 flex items-center justify-center flex-shrink-0 mt-0.5">
              <FileText className="w-4 h-4 text-amber-600" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-semibold text-gray-900">Deal brief uploaded</p>
              <p className="text-xs text-gray-500 mt-0.5">
                Run AI analysis to pre-populate the diligence checklist for each lever from your uploaded document.
              </p>
              {populateError && (
                <p className="text-xs text-red-600 mt-2 flex items-center gap-1">
                  <AlertCircle className="w-3.5 h-3.5" />{populateError}
                </p>
              )}
            </div>
            <button
              onClick={handlePopulateFromBrief}
              disabled={populatingBrief}
              className="flex items-center gap-2 px-3 py-2 bg-amber-600 hover:bg-amber-700 disabled:opacity-50 text-white text-xs font-semibold rounded-lg transition-colors flex-shrink-0"
            >
              {populatingBrief ? (
                <><span className="w-3.5 h-3.5 rounded-full border-2 border-white border-t-transparent animate-spin" />Analysing...</>
              ) : (
                <><Sparkles className="w-3.5 h-3.5" />Auto-fill diligence</>
              )}
            </button>
          </div>
        )}
        {populateDone && (
          <div className="rounded-xl border border-emerald-200 bg-emerald-50 p-3 flex items-center gap-3 text-sm text-emerald-700">
            <Sparkles className="w-4 h-4 flex-shrink-0" />
            Diligence checklist populated from deal brief — expand any lever to review
          </div>
        )}

        {/* Cost levers */}
        {leversLoading ? (
          <div className="flex items-center justify-center py-16">
            <LoadingSpinner size="lg" />
          </div>
        ) : costLevers.length > 0 ? (
          <section>
            <div className="flex items-center gap-3 mb-5">
              <div className="w-1 h-5 bg-[#D04A02] rounded-full" />
              <h2 className="text-xs font-semibold text-gray-500 uppercase tracking-widest">Cost Levers</h2>
            </div>
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
              {costLevers.map((lever) => (
                <div key={lever.id} id={`lever-${lever.id}`}>
                  <LeverCard
                    lever={lever}
                    combinedRevenue={summary?.combined_revenue ?? 0}
                    benchmarkN={summary?.benchmark_n ?? 0}
                    dealName={deal.name}
                    playbook={playbooks?.find(p => p.lever_name === lever.lever_name) ?? null}
                    acquirer={deal.acquirer}
                    target={deal.target}
                    perspective={perspective}
                  />
                </div>
              ))}
            </div>
          </section>
        ) : null}

        {/* Revenue levers */}
        {revenueLevers.length > 0 && (
          <section>
            <div className="flex items-center gap-3 mb-5">
              <div className="w-1 h-5 bg-sky-500 rounded-full" />
              <h2 className="text-xs font-semibold text-gray-500 uppercase tracking-widest">Revenue Levers</h2>
            </div>
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
              {revenueLevers.map((lever) => (
                <div key={lever.id} id={`lever-${lever.id}`}>
                <LeverCard
                  lever={lever}
                  combinedRevenue={summary?.combined_revenue ?? 0}
                  benchmarkN={summary?.benchmark_n ?? 0}
                  dealName={deal.name}
                  playbook={playbooks?.find(p => p.lever_name === lever.lever_name) ?? null}
                  perspective={perspective}
                  acquirer={deal.acquirer}
                  target={deal.target}
                />
                </div>
              ))}
            </div>
          </section>
        )}

        {/* Empty state */}
        {!leversLoading && levers.length === 0 && (
          <div className="border border-gray-200 bg-white rounded-xl p-12 text-center">
            <TrendingUp className="w-10 h-10 text-gray-300 mx-auto mb-3" />
            <h3 className="text-base font-semibold text-gray-900 mb-1">No Lever Analysis Yet</h3>
            <p className="text-gray-500 text-sm">Add acquirer and target revenue figures to generate benchmark-driven lever analysis.</p>
          </div>
        )}

        {/* Deal Profile */}
        {deal.deal_briefing_document && (
          <section className="border border-gray-200 bg-white rounded-xl overflow-hidden">
            <button
              type="button"
              onClick={() => { if (!profile && !profileLoading) handleGenerateProfile(); else setProfileOpen(o => !o); }}
              className="w-full flex items-center justify-between px-6 py-4 hover:bg-gray-50 transition-colors text-left"
            >
              <div className="flex items-center gap-3">
                <div className="w-1 h-5 bg-[#D04A02] rounded-full" />
                <div>
                  <p className="text-xs font-semibold text-gray-500 uppercase tracking-widest">Deal Profile</p>
                  {!profile && !profileLoading && (
                    <p className="text-xs text-gray-400 mt-0.5">Buyer, seller & integration environment — AI-synthesised from deal brief</p>
                  )}
                </div>
              </div>
              <div className="flex items-center gap-2">
                {!profile && !profileLoading && (
                  <span className="flex items-center gap-1.5 text-xs font-semibold text-[#D04A02]">
                    <Sparkles className="w-3.5 h-3.5" />Generate
                  </span>
                )}
                {profile && (profileOpen ? <ChevronUp className="w-4 h-4 text-gray-400" /> : <ChevronDown className="w-4 h-4 text-gray-400" />)}
              </div>
            </button>

            {profileLoading && (
              <div className="px-6 pb-6 flex items-center gap-3 text-sm text-gray-500">
                <span className="w-4 h-4 rounded-full border-2 border-[#D04A02] border-t-transparent animate-spin" />
                Synthesising deal profile from brief...
              </div>
            )}

            {profileError && (
              <div className="px-6 pb-4 text-xs text-red-600 flex items-center gap-1.5">
                <AlertCircle className="w-3.5 h-3.5" />{profileError}
              </div>
            )}

            {profile && profileOpen && (
              <div className="px-6 pb-6 border-t border-gray-100 grid grid-cols-1 lg:grid-cols-3 gap-6 pt-6">
                {/* Acquirer view */}
                <div>
                  <div className="flex items-center gap-2 mb-3">
                    <div className="w-2 h-2 rounded-full bg-[#D04A02]" />
                    <p className="text-xs font-bold text-gray-700 uppercase tracking-widest">Acquirer</p>
                  </div>
                  <p className="text-sm font-semibold text-gray-900 mb-3 leading-snug">{profile.acquirer_view.headline}</p>
                  <div className="space-y-4">
                    <div>
                      <p className="text-xs text-gray-400 font-semibold mb-1.5 uppercase tracking-wider">Strategic goals</p>
                      <ul className="space-y-1">
                        {profile.acquirer_view.strategic_goals.map((g, i) => (
                          <li key={i} className="text-xs text-gray-700 flex items-start gap-1.5">
                            <span className="text-[#D04A02] mt-0.5">·</span>{g}
                          </li>
                        ))}
                      </ul>
                    </div>
                    <div>
                      <p className="text-xs text-gray-400 font-semibold mb-1.5 uppercase tracking-wider">Key risks</p>
                      <ul className="space-y-1">
                        {profile.acquirer_view.key_risks.map((r, i) => (
                          <li key={i} className="text-xs text-gray-600 flex items-start gap-1.5">
                            <span className="text-amber-500 mt-0.5">▲</span>{r}
                          </li>
                        ))}
                      </ul>
                    </div>
                  </div>
                </div>

                {/* Target view */}
                <div>
                  <div className="flex items-center gap-2 mb-3">
                    <div className="w-2 h-2 rounded-full bg-sky-500" />
                    <p className="text-xs font-bold text-gray-700 uppercase tracking-widest">Target</p>
                  </div>
                  <p className="text-sm font-semibold text-gray-900 mb-3 leading-snug">{profile.target_view.headline}</p>
                  <div className="space-y-4">
                    <div>
                      <p className="text-xs text-gray-400 font-semibold mb-1.5 uppercase tracking-wider">Value drivers</p>
                      <ul className="space-y-1">
                        {profile.target_view.value_drivers.map((v, i) => (
                          <li key={i} className="text-xs text-gray-700 flex items-start gap-1.5">
                            <span className="text-sky-500 mt-0.5">·</span>{v}
                          </li>
                        ))}
                      </ul>
                    </div>
                    <div>
                      <p className="text-xs text-gray-400 font-semibold mb-1.5 uppercase tracking-wider">Retention priorities</p>
                      <ul className="space-y-1">
                        {profile.target_view.retention_priorities.map((r, i) => (
                          <li key={i} className="text-xs text-gray-600 flex items-start gap-1.5">
                            <span className="text-emerald-500 mt-0.5">✓</span>{r}
                          </li>
                        ))}
                      </ul>
                    </div>
                  </div>
                </div>

                {/* Integration environment */}
                <div>
                  <div className="flex items-center gap-2 mb-3">
                    <div className={`w-2 h-2 rounded-full ${profile.integration_environment.complexity === 'high' ? 'bg-red-500' : profile.integration_environment.complexity === 'medium' ? 'bg-amber-500' : 'bg-emerald-500'}`} />
                    <p className="text-xs font-bold text-gray-700 uppercase tracking-widest">Integration Environment</p>
                  </div>
                  <div className="flex items-center gap-2 mb-3">
                    <span className={`text-xs font-bold px-2 py-0.5 rounded-full border ${
                      profile.integration_environment.complexity === 'high'
                        ? 'bg-red-50 border-red-200 text-red-700'
                        : profile.integration_environment.complexity === 'medium'
                        ? 'bg-amber-50 border-amber-200 text-amber-700'
                        : 'bg-emerald-50 border-emerald-200 text-emerald-700'
                    }`}>
                      {profile.integration_environment.complexity.toUpperCase()} COMPLEXITY
                    </span>
                  </div>
                  <p className="text-xs text-gray-600 mb-4 leading-relaxed">{profile.integration_environment.complexity_rationale}</p>
                  <div className="space-y-4">
                    <div>
                      <p className="text-xs text-gray-400 font-semibold mb-1.5 uppercase tracking-wider">First 100 days</p>
                      <ul className="space-y-1">
                        {profile.integration_environment.critical_first_100_days.map((a, i) => (
                          <li key={i} className="text-xs text-gray-700 flex items-start gap-1.5">
                            <span className="text-gray-400 font-mono mt-0.5">{i + 1}.</span>{a}
                          </li>
                        ))}
                      </ul>
                    </div>
                    <div>
                      <p className="text-xs text-gray-400 font-semibold mb-1 uppercase tracking-wider">Timeline pressure</p>
                      <p className="text-xs text-gray-600">{profile.integration_environment.timeline_pressure}</p>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </section>
        )}

        {/* Strategic rationale */}
        {deal.strategic_rationale && (
          <section className="border border-gray-200 bg-white rounded-xl p-6">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-1 h-5 bg-gray-300 rounded-full" />
              <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-widest">Strategic Rationale</h3>
            </div>
            <p className="text-gray-700 leading-relaxed text-sm">{deal.strategic_rationale}</p>
          </section>
        )}

      </main>
    </div>
  );
}
