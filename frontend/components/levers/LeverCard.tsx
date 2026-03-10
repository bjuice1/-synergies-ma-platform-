'use client';

import { useState, useRef, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import {
  ChevronDown, ChevronUp, CheckCircle2, Clock, Search, XCircle,
  Calculator, Save, Lightbulb, ClipboardList, AlertTriangle, MessageSquare,
} from 'lucide-react';
import { formatCompactNumber } from '@/lib/utils';
import { dealsApi, usersApi } from '@/lib/api';
import { LEVER_SUBTYPES, prePopulateChecklist } from '@/lib/leverSubtypes';
import type { DealLever, LeverWithPlaybook, Company, DealChatContext, LeverComment, User } from '@/lib/types';

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
  validated:   { label: 'Validated',   color: 'text-emerald-700', bg: 'bg-emerald-50 border-emerald-200', icon: CheckCircle2 },
  in_analysis: { label: 'In Analysis', color: 'text-amber-700',   bg: 'bg-amber-50 border-amber-200',     icon: Clock },
  identified:  { label: 'Identified',  color: 'text-sky-700',     bg: 'bg-sky-50 border-sky-200',         icon: Search },
  excluded:    { label: 'Excluded',    color: 'text-gray-500',    bg: 'bg-gray-100 border-gray-200',      icon: XCircle },
};

const CONFIDENCE_CONFIG = {
  high:   { label: 'High',   dot: 'bg-emerald-500' },
  medium: { label: 'Medium', dot: 'bg-amber-500' },
  low:    { label: 'Low',    dot: 'bg-gray-400' },
};

interface LeverCardProps {
  lever: DealLever;
  dealName: string;
  combinedRevenue: number;
  benchmarkN: number;
  playbook: LeverWithPlaybook | null;
  acquirer: Company | undefined;
  target: Company | undefined;
  onUpdated?: (updated: DealLever) => void;
}

export function LeverCard({ lever, dealName, combinedRevenue, benchmarkN, playbook, acquirer, target, onUpdated }: LeverCardProps) {
  const router = useRouter();
  const questions = playbook?.playbook?.diligence_questions ?? [];
  const redFlags  = playbook?.playbook?.red_flags ?? [];

  const [currentStatus, setCurrentStatus]   = useState(lever.status);
  const [currentConfidence, setCurrentConfidence] = useState(lever.confidence);
  const [envData, setEnvData]   = useState<Record<string, string>>(lever.environment_data ?? {});
  const [notes, setNotes]       = useState(lever.advisor_notes ?? '');
  const [expanded, setExpanded] = useState(false);
  const [saving, setSaving]     = useState(false);
  const [saved, setSaved]       = useState(false);
  const [refining, setRefining]     = useState(false);
  const [refinedLow, setRefinedLow]   = useState<number | null>(lever.refined_pct_low ?? null);
  const [refinedHigh, setRefinedHigh]  = useState<number | null>(lever.refined_pct_high ?? null);
  const [refinedRationale, setRefinedRationale] = useState<string | null>(lever.refinement_rationale ?? null);
  const [refinedValueLow, setRefinedValueLow]   = useState<number | null>(null);
  const [refinedValueHigh, setRefinedValueHigh]  = useState<number | null>(null);
  const saveTimer  = useRef<ReturnType<typeof setTimeout> | null>(null);
  const prePopDone = useRef(false);
  const notesRef   = useRef(notes);
  notesRef.current = notes;

  // Team review state
  const [assignedTo, setAssignedTo]     = useState<number | null>(lever.assigned_to_id ?? null);
  const [assignedName, setAssignedName] = useState<string | null>(lever.assigned_to_name ?? null);
  const [users, setUsers]               = useState<User[]>([]);
  const [assignOpen, setAssignOpen]     = useState(false);
  const [comments, setComments]         = useState<LeverComment[]>([]);
  const [commentsLoaded, setCommentsLoaded] = useState(false);
  const [newComment, setNewComment]     = useState('');
  const [posting, setPosting]           = useState(false);
  const usersLoaded = useRef(false);

  const status     = STATUS_CONFIG[currentStatus]     || STATUS_CONFIG.identified;
  const confidence = CONFIDENCE_CONFIG[currentConfidence] || CONFIDENCE_CONFIG.medium;
  const StatusIcon = status.icon;
  const icon       = LEVER_ICONS[lever.lever_name] || '📋';
  const isExcluded = lever.status === 'excluded';
  const isRevenue  = lever.lever_type === 'revenue';

  const subtypes      = LEVER_SUBTYPES[lever.lever_name] ?? [];
  const answeredCount = questions.filter(q => envData[q]?.trim()).length;

  const pctLow    = lever.benchmark_pct_low;
  const pctHigh   = lever.benchmark_pct_high;
  const pctMedian = lever.benchmark_pct_median;
  const maxPct    = isRevenue ? 8.0 : 3.0;
  const barStart  = Math.min((pctLow  / maxPct) * 100, 100);
  const barWidth  = Math.min((pctHigh / maxPct) * 100, 100) - barStart;
  const medianPos = pctMedian != null ? Math.min((pctMedian / maxPct) * 100, 100) : null;
  const barColor  = isRevenue ? 'bg-sky-500' : 'bg-[#D04A02]';
  const medianValue = (combinedRevenue && pctMedian != null)
    ? Math.round(combinedRevenue * pctMedian / 100) : null;

  useEffect(() => {
    if (prePopDone.current || !questions.length) return;
    prePopDone.current = true;
    const prePopped = prePopulateChecklist(lever.lever_name, questions, acquirer, target);
    if (!Object.keys(prePopped).length) return;
    const saved = lever.environment_data ?? {};
    const newKeys = Object.keys(prePopped).filter(k => !saved[k]);
    if (!newKeys.length) return;
    const merged = { ...saved };
    newKeys.forEach(k => { merged[k] = prePopped[k]; });
    setEnvData(merged);
    dealsApi.updateLever(lever.deal_id, lever.id, { environment_data: merged })
      .then(updated => onUpdated?.(updated))
      .catch(() => {});
  }, [questions.length]); // eslint-disable-line react-hooks/exhaustive-deps

  function scheduleSave(newNotes: string, newEnv: Record<string, string>) {
    setSaved(false);
    if (saveTimer.current) clearTimeout(saveTimer.current);
    saveTimer.current = setTimeout(() => persist(newNotes, newEnv), 1500);
  }

  function handleNotesChange(val: string) {
    setNotes(val);
    scheduleSave(val, envData);
  }

  function handleEnvChange(question: string, answer: string) {
    const updated = { ...envData, [question]: answer };
    setEnvData(updated);
    scheduleSave(notesRef.current, updated);
  }

  async function persist(currentNotes: string, currentEnv: Record<string, string>) {
    setSaving(true);
    try {
      const updated = await dealsApi.updateLever(lever.deal_id, lever.id, {
        advisor_notes: currentNotes,
        environment_data: currentEnv,
      });
      onUpdated?.(updated);
      setSaved(true);
      setTimeout(() => setSaved(false), 2000);
    } catch {
      // silent fail
    } finally {
      setSaving(false);
    }
  }

  // Validation gate: what's needed to reach each status
  const answeredQuestions = questions.filter(q => envData[q]?.trim()).length;
  const hasNotes = notes.trim().length > 10;
  const validationGate: Record<string, { ok: boolean; reason?: string }> = {
    identified:  { ok: true },
    in_analysis: { ok: answeredQuestions >= 1, reason: 'Answer at least 1 diligence question to begin analysis' },
    validated:   { ok: answeredQuestions >= Math.ceil(questions.length * 0.6) && hasNotes,
                   reason: `Need ≥60% of diligence answered (${answeredQuestions}/${questions.length}) and an analyst note to validate` },
    excluded:    { ok: true },
  };

  async function handleStatusChange(newStatus: DealLever['status']) {
    const gate = validationGate[newStatus];
    if (!gate.ok) return; // button is disabled — shouldn't reach here
    const prev = currentStatus;
    setCurrentStatus(newStatus);
    try {
      const updated = await dealsApi.updateLever(lever.deal_id, lever.id, { status: newStatus });
      onUpdated?.(updated);
    } catch {
      setCurrentStatus(prev);
    }
  }

  async function handleConfidenceChange(newConf: DealLever['confidence']) {
    const prev = currentConfidence;
    setCurrentConfidence(newConf);
    try {
      const updated = await dealsApi.updateLever(lever.deal_id, lever.id, { confidence: newConf });
      onUpdated?.(updated);
    } catch {
      setCurrentConfidence(prev);
    }
  }

  // Load users + comments lazily on first expand
  useEffect(() => {
    if (!expanded) return;
    if (!usersLoaded.current) {
      usersLoaded.current = true;
      usersApi.getAll().then(setUsers).catch(() => {});
    }
    if (!commentsLoaded) {
      setCommentsLoaded(true);
      dealsApi.getComments(lever.deal_id, lever.id).then(setComments).catch(() => {});
    }
  }, [expanded]); // eslint-disable-line react-hooks/exhaustive-deps

  async function handleAssign(userId: number | null) {
    setAssignOpen(false);
    const prev = { id: assignedTo, name: assignedName };
    const user = users.find(u => u.id === userId) ?? null;
    setAssignedTo(userId);
    setAssignedName(user ? `${user.first_name} ${user.last_name}` : null);
    try {
      const updated = await dealsApi.updateLever(lever.deal_id, lever.id, { assigned_to_id: userId });
      onUpdated?.(updated);
    } catch {
      setAssignedTo(prev.id);
      setAssignedName(prev.name);
    }
  }

  async function handlePostComment(e: React.MouseEvent) {
    e.stopPropagation();
    const body = newComment.trim();
    if (!body) return;
    setPosting(true);
    try {
      const comment = await dealsApi.postComment(lever.deal_id, lever.id, body);
      setComments(prev => [...prev, comment]);
      setNewComment('');
    } catch {
      // silent fail
    } finally {
      setPosting(false);
    }
  }

  async function handleRefine(e: React.MouseEvent) {
    e.stopPropagation();
    setRefining(true);
    try {
      const updated = await dealsApi.refineLever(lever.deal_id, lever.id);
      setRefinedLow(updated.refined_pct_low ?? null);
      setRefinedHigh(updated.refined_pct_high ?? null);
      setRefinedRationale(updated.refinement_rationale ?? null);
      setRefinedValueLow(updated.calculated_value_low ?? null);
      setRefinedValueHigh(updated.calculated_value_high ?? null);
      onUpdated?.(updated);
    } catch {
      // silent fail
    } finally {
      setRefining(false);
    }
  }

  function handleScopeWithAI(e: React.MouseEvent) {
    e.stopPropagation();
    const context: DealChatContext = {
      deal_name: dealName,
      acquirer_name: acquirer?.name ?? '',
      acquirer_revenue: acquirer?.revenue_usd ?? null,
      target_name: target?.name ?? '',
      target_revenue: target?.revenue_usd ?? null,
      lever_name: lever.lever_name,
      lever_type: lever.lever_type,
      value_low: lever.calculated_value_low,
      value_high: lever.calculated_value_high,
      pct_low: lever.benchmark_pct_low,
      pct_high: lever.benchmark_pct_high,
      benchmark_n: lever.benchmark_n,
      environment_data: envData,
      subtypes: subtypes,
    };
    sessionStorage.setItem('leverChatContext', JSON.stringify(context));
    router.push('/chat');
  }

  useEffect(() => () => { if (saveTimer.current) clearTimeout(saveTimer.current); }, []);

  return (
    <div className={`rounded-xl border bg-white transition-all duration-150 ${
      isExcluded ? 'opacity-40 border-gray-200' : 'border-gray-200 hover:border-gray-300 shadow-sm hover:shadow'
    }`}>

      {/* Header */}
      <div className="p-5 cursor-pointer select-none" onClick={() => setExpanded(e => !e)}>
        <div className="flex items-start justify-between gap-4">
          <div className="flex items-start gap-3 min-w-0">
            <span className="text-xl mt-0.5 flex-shrink-0">{icon}</span>
            <div className="min-w-0 relative">
              <div className="flex items-center gap-2 flex-wrap">
                <h3 className="text-base font-bold text-gray-900">{lever.lever_name}</h3>

                {/* Status selector */}
                <div className="relative" onClick={e => e.stopPropagation()}>
                  <select
                    value={currentStatus}
                    onChange={e => handleStatusChange(e.target.value as DealLever['status'])}
                    className={`appearance-none inline-flex items-center gap-1 pl-2 pr-5 py-0.5 rounded-full text-xs font-medium border cursor-pointer focus:outline-none ${status.bg} ${status.color}`}
                    style={{ backgroundImage: 'none' }}
                  >
                    {(Object.entries(STATUS_CONFIG) as [DealLever['status'], typeof STATUS_CONFIG[keyof typeof STATUS_CONFIG]][]).map(([key, cfg]) => {
                      const gate = validationGate[key];
                      return (
                        <option key={key} value={key} disabled={!gate.ok} title={gate.reason}>
                          {cfg.label}{!gate.ok ? ' 🔒' : ''}
                        </option>
                      );
                    })}
                  </select>
                </div>
              </div>

              <div className="flex items-center gap-1.5 mt-1 flex-wrap">
                {/* Confidence selector */}
                <div className="relative flex items-center gap-1" onClick={e => e.stopPropagation()}>
                  <span className={`w-1.5 h-1.5 rounded-full flex-shrink-0 ${confidence.dot}`} />
                  <select
                    value={currentConfidence}
                    onChange={e => handleConfidenceChange(e.target.value as DealLever['confidence'])}
                    className="text-xs text-gray-500 bg-transparent border-none cursor-pointer focus:outline-none pr-3 appearance-none"
                    style={{ backgroundImage: 'none' }}
                  >
                    {Object.entries(CONFIDENCE_CONFIG).map(([key, cfg]) => (
                      <option key={key} value={key}>{cfg.label} confidence</option>
                    ))}
                  </select>
                </div>
                <span className="text-gray-300 text-xs mx-0.5">·</span>
                <span className="text-xs text-gray-500">{benchmarkN} comparable deals</span>
                {questions.length > 0 && (
                  <>
                    <span className="text-gray-300 text-xs mx-0.5">·</span>
                    <span className={`text-xs font-medium ${answeredCount === questions.length ? 'text-emerald-600' : 'text-amber-600'}`}>
                      {answeredCount}/{questions.length} data points
                    </span>
                  </>
                )}
                <span className="text-gray-300 text-xs mx-0.5">·</span>
                {assignedName ? (
                  <button
                    onClick={e => { e.stopPropagation(); setAssignOpen(v => !v); }}
                    className="text-xs text-[#D04A02] font-medium hover:underline"
                  >
                    {assignedName}
                  </button>
                ) : (
                  <button
                    onClick={e => { e.stopPropagation(); setAssignOpen(v => !v); }}
                    className="text-xs text-gray-400 hover:text-gray-600"
                  >
                    + Assign
                  </button>
                )}
                {assignOpen && (
                  <div className="absolute z-10 mt-1 bg-white border border-gray-200 rounded-lg shadow-lg py-1 min-w-[160px]"
                    onClick={e => e.stopPropagation()}
                  >
                    <button
                      className="w-full text-left px-3 py-1.5 text-xs text-gray-500 hover:bg-gray-50"
                      onClick={() => handleAssign(null)}
                    >
                      Unassign
                    </button>
                    {users.map(u => (
                      <button
                        key={u.id}
                        className={`w-full text-left px-3 py-1.5 text-xs hover:bg-gray-50 ${assignedTo === u.id ? 'text-[#D04A02] font-medium' : 'text-gray-700'}`}
                        onClick={() => handleAssign(u.id)}
                      >
                        {u.first_name} {u.last_name}
                      </button>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </div>

          <div className="flex items-start gap-3 flex-shrink-0">
            {!isExcluded && (
              <div className="text-right">
                {refinedLow != null ? (
                  <>
                    <p className="text-xs text-emerald-600 font-medium mb-1">Deal estimate ✦</p>
                    <p className="text-xl font-bold text-gray-900 font-mono tabular-nums">
                      {formatCompactNumber(refinedValueLow ?? lever.calculated_value_low)}
                      <span className="text-gray-300 font-normal text-base mx-1.5">–</span>
                      {formatCompactNumber(refinedValueHigh ?? lever.calculated_value_high)}
                    </p>
                    <p className="text-xs text-emerald-600 mt-0.5 font-mono">
                      {refinedLow.toFixed(2)}–{refinedHigh!.toFixed(2)}%
                      <span className="text-gray-400 ml-1">· bmark {pctLow}–{pctHigh}%</span>
                    </p>
                  </>
                ) : (
                  <>
                    <p className="text-xs text-gray-400 mb-1">Synergy opportunity</p>
                    <p className="text-xl font-bold text-gray-900 font-mono tabular-nums">
                      {formatCompactNumber(lever.calculated_value_low)}
                      <span className="text-gray-300 font-normal text-base mx-1.5">–</span>
                      {formatCompactNumber(lever.calculated_value_high)}
                    </p>
                    <p className="text-xs text-gray-400 mt-0.5 font-mono">
                      {pctLow}–{pctHigh}% of combined rev
                    </p>
                  </>
                )}
              </div>
            )}
            <div className="mt-1 text-gray-400">
              {expanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
            </div>
          </div>
        </div>

        {!isExcluded && (
          <div className="mt-4">
            <div className="flex items-center justify-between text-xs text-gray-400 mb-1.5">
              <span>Benchmark range</span>
              <span className="font-mono text-gray-500">{pctLow}% – {pctHigh}%</span>
            </div>
            <div className="h-1.5 bg-gray-100 rounded-full overflow-visible relative">
              <div
                className={`absolute h-full rounded-full ${barColor} opacity-70`}
                style={{ left: `${barStart}%`, width: `${Math.max(barWidth, 1)}%` }}
              />
              {medianPos != null && (
                <div
                  className="absolute top-1/2 -translate-y-1/2 w-0.5 h-3 bg-gray-500 rounded-full"
                  style={{ left: `${medianPos}%` }}
                  title={`Median: ${pctMedian}%`}
                />
              )}
            </div>
          </div>
        )}
      </div>

      {/* Expanded panel */}
      {expanded && !isExcluded && (
        <div className="border-t border-gray-100 px-5 pb-5 pt-4 space-y-5">

          {/* Sub-type breakdown */}
          {subtypes.length > 0 && (
            <div className="bg-gray-50 rounded-lg p-4 border border-gray-100">
              <div className="flex items-center gap-1.5 mb-3">
                <Lightbulb className="w-3.5 h-3.5 text-gray-400" />
                <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide">
                  Typical {lever.lever_name} Savings Breakdown
                </p>
              </div>
              <div className="space-y-3">
                {subtypes.map(st => {
                  const stValue = medianValue ? Math.round(medianValue * st.typical_pct / 100) : null;
                  return (
                    <div key={st.name}>
                      <div className="flex items-center justify-between mb-1">
                        <span className="text-sm text-gray-700 font-medium">{st.name}</span>
                        <div className="flex items-center gap-3">
                          {stValue && <span className="text-xs font-mono text-gray-500">~{formatCompactNumber(stValue)}</span>}
                          <span className="text-xs text-gray-400 font-mono w-8 text-right">{st.typical_pct}%</span>
                        </div>
                      </div>
                      <div className="h-1 bg-gray-200 rounded-full overflow-hidden">
                        <div className={`h-full rounded-full ${barColor} opacity-60`} style={{ width: `${st.typical_pct}%` }} />
                      </div>
                      <p className="text-xs text-gray-400 mt-1">{st.description}</p>
                    </div>
                  );
                })}
              </div>
              <p className="text-xs text-gray-400 mt-3 pt-3 border-t border-gray-200">
                Typical distribution based on comparable {lever.lever_name} consolidations.
              </p>
            </div>
          )}

          {/* Deal environment checklist */}
          {questions.length > 0 && (
            <div className="bg-gray-50 rounded-lg p-4 border border-gray-100">
              <div className="flex items-center justify-between mb-1">
                <div className="flex items-center gap-1.5">
                  <ClipboardList className="w-3.5 h-3.5 text-gray-400" />
                  <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide">Deal Environment</p>
                </div>
                <div className="flex items-center gap-2">
                  {saving && <span className="text-xs text-gray-400">Saving...</span>}
                  {saved && <span className="text-xs text-emerald-600 flex items-center gap-1"><Save className="w-3 h-3" />Saved</span>}
                  <span className={`text-xs font-medium ${answeredCount === questions.length ? 'text-emerald-600' : 'text-amber-600'}`}>
                    {answeredCount}/{questions.length} answered
                  </span>
                </div>
              </div>
              <p className="text-xs text-gray-400 mb-4">
                Answer these to move from benchmark estimate to deal-specific scoping. Fields marked <span className="text-emerald-600">auto</span> are pre-filled from company data.
              </p>
              <div className="space-y-3">
                {questions.map((q, i) => {
                  const val = envData[q] ?? '';
                  const isPreFilled = !!val && !(lever.environment_data?.[q]);
                  return (
                    <div key={i}>
                      <div className="flex items-start justify-between gap-2 mb-1">
                        <label className="text-xs text-gray-500 leading-relaxed flex-1">{q}</label>
                        {isPreFilled && <span className="text-xs text-emerald-600 flex-shrink-0 mt-0.5">auto</span>}
                      </div>
                      <input
                        type="text"
                        value={val}
                        onChange={e => handleEnvChange(q, e.target.value)}
                        onClick={e => e.stopPropagation()}
                        placeholder="Add your findings..."
                        className="w-full bg-white border border-gray-200 rounded-md px-3 py-1.5 text-sm text-gray-700 placeholder-gray-400 focus:outline-none focus:border-gray-400"
                      />
                    </div>
                  );
                })}
              </div>
              {/* Refine estimate button */}
              <div className="mt-4 flex flex-col gap-2">
                <button
                  onClick={handleRefine}
                  disabled={refining || answeredCount === 0}
                  className="w-full flex items-center justify-center gap-2 px-3 py-2 rounded-lg bg-emerald-50 border border-emerald-200 text-emerald-700 text-xs font-medium hover:bg-emerald-100 transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
                >
                  {refining ? (
                    <>
                      <span className="w-3.5 h-3.5 border-2 border-emerald-400 border-t-transparent rounded-full animate-spin" />
                      Refining estimate...
                    </>
                  ) : (
                    <>
                      <span className="text-sm">✦</span>
                      Refine estimate from diligence Q&A
                    </>
                  )}
                </button>
                {answeredCount === 0 && (
                  <p className="text-xs text-gray-400 text-center">Answer at least one diligence question to refine the estimate</p>
                )}
                {refinedRationale && (
                  <div className="bg-emerald-50 border border-emerald-200 rounded-lg p-3">
                    <p className="text-xs font-semibold text-emerald-700 mb-1">Refinement rationale</p>
                    <p className="text-xs text-gray-700 leading-relaxed">{refinedRationale}</p>
                    <p className="text-xs text-emerald-600 mt-2 font-mono">
                      Deal-specific: {refinedLow?.toFixed(2)}%–{refinedHigh?.toFixed(2)}%
                      <span className="text-gray-400 ml-1">(benchmark: {pctLow}%–{pctHigh}%)</span>
                    </p>
                  </div>
                )}
              </div>

              <button
                onClick={handleScopeWithAI}
                className="w-full flex items-center justify-center gap-2 px-3 py-2 rounded-lg bg-orange-50 border border-orange-200 text-[#D04A02] text-xs font-medium hover:bg-orange-100 transition-colors"
              >
                <MessageSquare className="w-3.5 h-3.5" />
                Scope with AI — ask about this {lever.lever_name} lever
              </button>
            </div>
          )}

          {/* Red flags */}
          {redFlags.length > 0 && (
            <div className="bg-red-50 rounded-lg p-4 border border-red-100">
              <div className="flex items-center gap-1.5 mb-3">
                <AlertTriangle className="w-3.5 h-3.5 text-red-500" />
                <p className="text-xs font-semibold text-red-600 uppercase tracking-wide">Red Flags</p>
              </div>
              <ul className="space-y-1.5">
                {redFlags.map((flag, i) => (
                  <li key={i} className="flex items-start gap-2">
                    <span className="text-red-400 mt-0.5 flex-shrink-0 text-xs">▸</span>
                    <span className="text-sm text-gray-700">{flag}</span>
                  </li>
                ))}
              </ul>
            </div>
          )}

          {/* Math breakdown */}
          <div className="bg-gray-50 rounded-lg p-4 border border-gray-100">
            <div className="flex items-center gap-1.5 mb-3">
              <Calculator className="w-3.5 h-3.5 text-gray-400" />
              <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide">How This Is Calculated</p>
            </div>
            <div className="space-y-2 font-mono text-sm">
              <div className="flex items-center justify-between">
                <span className="text-gray-500">Combined revenue</span>
                <span className="text-gray-700">{formatCompactNumber(combinedRevenue)}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-gray-500">Benchmark low ({pctLow}%)</span>
                <span className="text-gray-900">{formatCompactNumber(lever.calculated_value_low)}</span>
              </div>
              {medianValue != null && (
                <div className="flex items-center justify-between">
                  <span className="text-gray-500">Benchmark median ({pctMedian}%)</span>
                  <span className={isRevenue ? 'text-sky-600' : 'text-[#D04A02]'}>{formatCompactNumber(medianValue)}</span>
                </div>
              )}
              <div className="flex items-center justify-between border-t border-gray-200 pt-2 mt-2">
                <span className="text-gray-500">Benchmark high ({pctHigh}%)</span>
                <span className="text-gray-900 font-bold">{formatCompactNumber(lever.calculated_value_high)}</span>
              </div>
            </div>
            <p className="text-xs text-gray-400 mt-3">
              Based on {benchmarkN} comparable transactions. Figures = benchmark % × combined revenue.
            </p>
          </div>

          {/* Notes */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide">Analyst Notes</p>
              {!questions.length && saving && <span className="text-xs text-gray-400">Saving...</span>}
              {!questions.length && saved && <span className="text-xs text-emerald-600 flex items-center gap-1"><Save className="w-3 h-3" />Saved</span>}
            </div>
            <textarea
              value={notes}
              onChange={e => handleNotesChange(e.target.value)}
              onClick={e => e.stopPropagation()}
              placeholder="Dependencies, timing considerations, stakeholder dynamics..."
              rows={3}
              className="w-full bg-white border border-gray-200 rounded-lg px-3 py-2.5 text-sm text-gray-700 placeholder-gray-400 focus:outline-none focus:border-gray-400 resize-none leading-relaxed"
            />
          </div>

          {/* Discussion / comments */}
          <div className="bg-gray-50 rounded-lg p-4 border border-gray-100">
            <div className="flex items-center gap-1.5 mb-3">
              <MessageSquare className="w-3.5 h-3.5 text-gray-400" />
              <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide">
                Discussion{comments.length > 0 ? ` (${comments.length})` : ''}
              </p>
            </div>

            {comments.length === 0 && commentsLoaded && (
              <p className="text-xs text-gray-400 mb-3">No comments yet. Be the first to add context.</p>
            )}

            {comments.length > 0 && (
              <div className="space-y-3 mb-3">
                {comments.map(c => (
                  <div key={c.id} className="flex gap-2">
                    <div className="w-6 h-6 rounded-full bg-[#D04A02] text-white text-xs flex items-center justify-center flex-shrink-0 font-medium">
                      {c.author_name.charAt(0)}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-baseline gap-2">
                        <span className="text-xs font-semibold text-gray-800">{c.author_name}</span>
                        <span className="text-xs text-gray-400">
                          {new Date(c.created_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                        </span>
                      </div>
                      <p className="text-sm text-gray-700 mt-0.5 leading-relaxed">{c.body}</p>
                    </div>
                  </div>
                ))}
              </div>
            )}

            <div className="flex gap-2" onClick={e => e.stopPropagation()}>
              <textarea
                value={newComment}
                onChange={e => setNewComment(e.target.value)}
                onKeyDown={e => { if (e.key === 'Enter' && (e.metaKey || e.ctrlKey)) handlePostComment(e as any); }}
                placeholder="Add a comment..."
                rows={2}
                className="flex-1 bg-white border border-gray-200 rounded-lg px-3 py-2 text-sm text-gray-700 placeholder-gray-400 focus:outline-none focus:border-gray-400 resize-none"
              />
              <button
                onClick={handlePostComment}
                disabled={posting || !newComment.trim()}
                className="self-end px-3 py-2 rounded-lg bg-[#D04A02] text-white text-xs font-medium hover:bg-orange-700 transition-colors disabled:opacity-40"
              >
                {posting ? '...' : 'Post'}
              </button>
            </div>
          </div>

          {/* Specific opportunities */}
          {lever.activities.length > 0 && (
            <div>
              <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-3">
                Specific Opportunities ({lever.activities.length})
              </p>
              <div className="space-y-2">
                {lever.activities.map((activity) => (
                  <div key={activity.id} className="bg-gray-50 rounded-lg p-3 border border-gray-100">
                    <div className="flex items-start justify-between gap-3">
                      <p className="text-sm text-gray-700 leading-relaxed flex-1">{activity.description}</p>
                      <div className="text-right flex-shrink-0">
                        <p className="text-sm font-semibold text-gray-900 font-mono tabular-nums">
                          {formatCompactNumber(activity.value_low)}–{formatCompactNumber(activity.value_high)}
                        </p>
                        <p className="text-xs text-gray-400 mt-0.5 capitalize">
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
