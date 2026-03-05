'use client';

import { useEffect, useState, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useAuth } from '@/hooks/useAuth';
import { learnApi } from '@/lib/api';
import { LoadingSpinner } from '@/components/ui/loading-spinner';
import type { LeverWithPlaybook } from '@/lib/types';
import {
  AlertTriangle,
  BookOpen,
  Check,
  ChevronRight,
  Edit3,
  HelpCircle,
  Lightbulb,
  Plus,
  StickyNote,
  Trash2,
  X,
} from 'lucide-react';

const LEVER_ICONS: Record<string, string> = {
  IT:             '💻',
  Finance:        '📊',
  HR:             '👥',
  Operations:     '⚙️',
  Procurement:    '🔗',
  'Real Estate':  '🏢',
  Revenue:        '📈',
};

const NAV_LINKS = [
  { href: '/dashboard', label: 'Dashboard' },
  { href: '/deals',     label: 'Deals' },
  { href: '/learn',     label: 'Learn', active: true },
  { href: '/chat',      label: 'AI Chat' },
];

// --- Inline text editor ---
function EditableText({
  value,
  onSave,
  placeholder,
  disabled = false,
}: {
  value: string | null;
  onSave: (v: string) => void;
  placeholder: string;
  disabled?: boolean;
}) {
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState(value ?? '');

  const handleSave = () => { onSave(draft); setEditing(false); };
  const handleCancel = () => { setDraft(value ?? ''); setEditing(false); };

  if (editing) {
    return (
      <div className="space-y-2">
        <textarea
          className="w-full bg-white/5 border border-white/15 rounded-lg p-3 text-sm text-slate-200 resize-y focus:outline-none focus:border-orange-500/50 min-h-[120px] leading-relaxed"
          value={draft}
          onChange={(e) => setDraft(e.target.value)}
          placeholder={placeholder}
          autoFocus
        />
        <div className="flex gap-2">
          <button
            onClick={handleSave}
            className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium bg-orange-500/15 border border-orange-500/30 text-orange-400 rounded-lg hover:bg-orange-500/25 transition-colors"
          >
            <Check className="w-3 h-3" /> Save
          </button>
          <button
            onClick={handleCancel}
            className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium bg-white/5 border border-white/10 text-slate-400 rounded-lg hover:bg-white/10 transition-colors"
          >
            <X className="w-3 h-3" /> Cancel
          </button>
        </div>
      </div>
    );
  }

  return (
    <div
      className={`group relative rounded-lg p-4 border transition-colors ${
        value
          ? 'border-white/5 bg-white/3 hover:border-white/12 hover:bg-white/5'
          : 'border-dashed border-white/10 bg-white/2 hover:border-white/20'
      } ${disabled ? 'cursor-default' : 'cursor-pointer'}`}
      onClick={() => !disabled && setEditing(true)}
    >
      {value ? (
        <p className="text-sm text-slate-300 leading-relaxed whitespace-pre-wrap">{value}</p>
      ) : (
        <p className="text-sm text-slate-600 italic">{placeholder}</p>
      )}
      {!disabled && (
        <Edit3 className="absolute top-3 right-3 w-3.5 h-3.5 text-slate-600 opacity-0 group-hover:opacity-100 transition-opacity" />
      )}
    </div>
  );
}

// --- Inline list editor ---
function EditableList({
  items,
  onSave,
  placeholder,
  emptyLabel,
  disabled = false,
}: {
  items: string[];
  onSave: (items: string[]) => void;
  placeholder: string;
  emptyLabel: string;
  disabled?: boolean;
}) {
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState<string[]>(items);
  const [newItem, setNewItem] = useState('');

  const handleSave = () => { onSave(draft.filter(Boolean)); setEditing(false); setNewItem(''); };
  const handleCancel = () => { setDraft(items); setEditing(false); setNewItem(''); };
  const addItem = () => { if (newItem.trim()) { setDraft([...draft, newItem.trim()]); setNewItem(''); } };
  const removeItem = (idx: number) => setDraft(draft.filter((_, i) => i !== idx));
  const updateItem = (idx: number, value: string) => setDraft(draft.map((item, i) => (i === idx ? value : item)));

  if (editing) {
    return (
      <div className="space-y-2">
        <div className="space-y-1.5">
          {draft.map((item, idx) => (
            <div key={idx} className="flex gap-2 items-start">
              <input
                className="flex-1 bg-white/5 border border-white/15 rounded-lg px-3 py-2 text-sm text-slate-200 focus:outline-none focus:border-orange-500/50"
                value={item}
                onChange={(e) => updateItem(idx, e.target.value)}
              />
              <button onClick={() => removeItem(idx)} className="mt-2 text-slate-600 hover:text-red-400 transition-colors flex-shrink-0">
                <Trash2 className="w-3.5 h-3.5" />
              </button>
            </div>
          ))}
        </div>
        <div className="flex gap-2 items-center">
          <input
            className="flex-1 bg-white/5 border border-dashed border-white/15 rounded-lg px-3 py-2 text-sm text-slate-400 placeholder-slate-600 focus:outline-none focus:border-orange-500/50 focus:text-slate-200"
            value={newItem}
            onChange={(e) => setNewItem(e.target.value)}
            placeholder={placeholder}
            onKeyDown={(e) => e.key === 'Enter' && addItem()}
          />
          <button
            onClick={addItem}
            className="flex items-center gap-1 px-2.5 py-2 text-xs text-slate-400 hover:text-white border border-white/10 hover:border-white/20 rounded-lg transition-colors"
          >
            <Plus className="w-3.5 h-3.5" />
          </button>
        </div>
        <div className="flex gap-2">
          <button
            onClick={handleSave}
            className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium bg-orange-500/15 border border-orange-500/30 text-orange-400 rounded-lg hover:bg-orange-500/25 transition-colors"
          >
            <Check className="w-3 h-3" /> Save
          </button>
          <button
            onClick={handleCancel}
            className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium bg-white/5 border border-white/10 text-slate-400 rounded-lg hover:bg-white/10 transition-colors"
          >
            <X className="w-3 h-3" /> Cancel
          </button>
        </div>
      </div>
    );
  }

  return (
    <div
      className={`group relative rounded-lg p-4 border transition-colors ${
        items.length > 0
          ? 'border-white/5 bg-white/3 hover:border-white/12 hover:bg-white/5'
          : 'border-dashed border-white/10 bg-white/2 hover:border-white/20'
      } ${disabled ? 'cursor-default' : 'cursor-pointer'}`}
      onClick={() => !disabled && setEditing(true)}
    >
      {items.length > 0 ? (
        <ol className="space-y-2">
          {items.map((item, idx) => (
            <li key={idx} className="flex gap-3 items-start">
              <span className="text-xs font-mono text-slate-600 mt-0.5 flex-shrink-0 w-4 text-right">{idx + 1}.</span>
              <span className="text-sm text-slate-300 leading-relaxed">{item}</span>
            </li>
          ))}
        </ol>
      ) : (
        <p className="text-sm text-slate-600 italic">{emptyLabel}</p>
      )}
      {!disabled && (
        <Edit3 className="absolute top-3 right-3 w-3.5 h-3.5 text-slate-600 opacity-0 group-hover:opacity-100 transition-opacity" />
      )}
    </div>
  );
}

// --- Section wrapper ---
function Section({
  icon: Icon,
  title,
  color,
  children,
}: {
  icon: React.ElementType;
  title: string;
  color: string;
  children: React.ReactNode;
}) {
  return (
    <div className="space-y-3">
      <div className="flex items-center gap-2">
        <Icon className={`w-3.5 h-3.5 ${color}`} />
        <h3 className="text-xs font-semibold text-slate-500 uppercase tracking-widest">{title}</h3>
      </div>
      {children}
    </div>
  );
}

// --- Main page ---
export default function LearnPage() {
  const router = useRouter();
  const { isAuthenticated, loading: authLoading, user } = useAuth();
  const queryClient = useQueryClient();
  const [selectedLeverId, setSelectedLeverId] = useState<number | null>(null);
  const [saveStatus, setSaveStatus] = useState<'idle' | 'saving' | 'saved' | 'error'>('idle');

  const { data: levers, isLoading } = useQuery({
    queryKey: ['learn'],
    queryFn: () => learnApi.getAll(),
    enabled: isAuthenticated,
  });

  const mutation = useMutation({
    mutationFn: ({ leverId, data }: { leverId: number; data: Parameters<typeof learnApi.update>[1] }) =>
      learnApi.update(leverId, data),
    onMutate: () => setSaveStatus('saving'),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['learn'] });
      setSaveStatus('saved');
      setTimeout(() => setSaveStatus('idle'), 2000);
    },
    onError: () => {
      setSaveStatus('error');
      setTimeout(() => setSaveStatus('idle'), 3000);
    },
  });

  useEffect(() => {
    if (!authLoading && !isAuthenticated) router.push('/login');
  }, [isAuthenticated, authLoading, router]);

  useEffect(() => {
    if (levers && levers.length > 0 && selectedLeverId === null) {
      setSelectedLeverId(levers[0].lever_id);
    }
  }, [levers, selectedLeverId]);

  const selected = levers?.find((l) => l.lever_id === selectedLeverId) ?? null;
  const canEdit = user?.role === 'analyst' || user?.role === 'admin';

  const handleSave = useCallback(
    (field: string, value: string | string[]) => {
      if (!selectedLeverId) return;
      mutation.mutate({ leverId: selectedLeverId, data: { [field]: value } });
    },
    [selectedLeverId, mutation]
  );

  if (authLoading || isLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-[#0C0F1A]">
        <LoadingSpinner size="lg" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#0C0F1A] flex flex-col">

      {/* Top nav */}
      <header className="border-b border-white/8 bg-[#0E1220] flex-shrink-0">
        <div className="max-w-screen-xl mx-auto px-6 lg:px-8">
          <div className="flex items-center justify-between h-14">
            <div className="flex items-center gap-3">
              <div className="w-1 h-6 bg-orange-500 rounded-full" />
              <span className="text-sm font-semibold text-white tracking-wide">SYNERGIES</span>
            </div>
            <div className="flex items-center gap-4">
              {saveStatus === 'saving' && (
                <span className="text-xs text-slate-500 flex items-center gap-1.5">
                  <span className="w-1.5 h-1.5 rounded-full bg-amber-400 animate-pulse" />
                  Saving…
                </span>
              )}
              {saveStatus === 'saved' && (
                <span className="text-xs text-emerald-400 flex items-center gap-1.5">
                  <Check className="w-3 h-3" /> Saved
                </span>
              )}
              {saveStatus === 'error' && (
                <span className="text-xs text-red-400 flex items-center gap-1.5">
                  <X className="w-3 h-3" /> Save failed
                </span>
              )}
              <nav className="flex items-center gap-1">
                {NAV_LINKS.map(link => (
                  <a
                    key={link.href}
                    href={link.href}
                    className={`px-4 py-2 text-sm font-medium rounded-md transition-colors ${
                      link.active
                        ? 'text-orange-400 bg-orange-500/10'
                        : 'text-slate-400 hover:text-white hover:bg-white/5'
                    }`}
                  >
                    {link.label}
                  </a>
                ))}
              </nav>
            </div>
          </div>
        </div>
      </header>

      {/* Page header band */}
      <div className="border-b border-white/8 bg-[#0E1220] flex-shrink-0">
        <div className="max-w-screen-xl mx-auto px-6 lg:px-8 py-5">
          <div className="flex items-center gap-3">
            <BookOpen className="w-4 h-4 text-orange-400" />
            <div>
              <p className="text-xs font-semibold text-orange-500 uppercase tracking-widest">Methodology</p>
              <h1 className="text-lg font-bold text-white leading-tight">Lever Playbooks</h1>
            </div>
            {!canEdit && (
              <span className="ml-auto text-xs text-slate-600 italic">View only — analyst role required to edit</span>
            )}
          </div>
        </div>
      </div>

      {/* Body: sidebar + main */}
      <div className="flex flex-1 max-w-screen-xl mx-auto w-full px-6 lg:px-8 py-6 gap-6 min-h-0">

        {/* Sidebar */}
        <aside className="w-52 flex-shrink-0">
          <p className="text-xs font-semibold text-slate-600 uppercase tracking-widest mb-3 px-2">Cost Levers</p>
          <nav className="space-y-0.5">
            {levers
              ?.filter((l) => l.lever_type === 'cost')
              .map((lever) => (
                <button
                  key={lever.lever_id}
                  onClick={() => setSelectedLeverId(lever.lever_id)}
                  className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-left transition-colors ${
                    selectedLeverId === lever.lever_id
                      ? 'bg-orange-500/10 text-orange-300'
                      : 'text-slate-400 hover:text-white hover:bg-white/5'
                  }`}
                >
                  <span className="text-base flex-shrink-0">{LEVER_ICONS[lever.lever_name] || '📋'}</span>
                  <span className="text-sm font-medium truncate flex-1">{lever.lever_name}</span>
                  {lever.playbook && (
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 flex-shrink-0" title="Has content" />
                  )}
                </button>
              ))}
          </nav>

          {levers?.some((l) => l.lever_type === 'revenue') && (
            <>
              <p className="text-xs font-semibold text-slate-600 uppercase tracking-widest mb-3 mt-5 px-2">Revenue Levers</p>
              <nav className="space-y-0.5">
                {levers
                  .filter((l) => l.lever_type === 'revenue')
                  .map((lever) => (
                    <button
                      key={lever.lever_id}
                      onClick={() => setSelectedLeverId(lever.lever_id)}
                      className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-left transition-colors ${
                        selectedLeverId === lever.lever_id
                          ? 'bg-sky-500/10 text-sky-300'
                          : 'text-slate-400 hover:text-white hover:bg-white/5'
                      }`}
                    >
                      <span className="text-base flex-shrink-0">{LEVER_ICONS[lever.lever_name] || '📋'}</span>
                      <span className="text-sm font-medium truncate flex-1">{lever.lever_name}</span>
                      {lever.playbook && (
                        <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 flex-shrink-0" title="Has content" />
                      )}
                    </button>
                  ))}
              </nav>
            </>
          )}
        </aside>

        {/* Main content */}
        <main className="flex-1 min-w-0 overflow-y-auto">
          {!selected ? (
            <div className="flex items-center justify-center h-64">
              <LoadingSpinner size="md" />
            </div>
          ) : (
            <div className="space-y-7 max-w-2xl">
              {/* Lever header */}
              <div className="flex items-center gap-4">
                <span className="text-3xl">{LEVER_ICONS[selected.lever_name] || '📋'}</span>
                <div>
                  <h2 className="text-xl font-bold text-white">{selected.lever_name}</h2>
                  {selected.description && (
                    <p className="text-sm text-slate-400 mt-0.5">{selected.description}</p>
                  )}
                </div>
              </div>

              {/* Sections */}
              <div className="space-y-6">
                <Section icon={Lightbulb} title="What it is" color="text-amber-400">
                  <EditableText
                    value={selected.playbook?.what_it_is ?? null}
                    onSave={(v) => handleSave('what_it_is', v)}
                    placeholder="Describe what this lever is and where the savings come from…"
                    disabled={!canEdit}
                  />
                </Section>

                <Section icon={BookOpen} title="What drives it" color="text-sky-400">
                  <EditableText
                    value={selected.playbook?.what_drives_it ?? null}
                    onSave={(v) => handleSave('what_drives_it', v)}
                    placeholder="List the key variables that determine the size of this lever…"
                    disabled={!canEdit}
                  />
                </Section>

                <Section icon={HelpCircle} title="Diligence questions" color="text-slate-400">
                  <EditableList
                    items={selected.playbook?.diligence_questions ?? []}
                    onSave={(items) => handleSave('diligence_questions', items)}
                    placeholder="Add a diligence question…"
                    emptyLabel="No questions yet — click to add diligence questions for this lever"
                    disabled={!canEdit}
                  />
                </Section>

                <Section icon={AlertTriangle} title="Red flags" color="text-red-400">
                  <EditableList
                    items={selected.playbook?.red_flags ?? []}
                    onSave={(items) => handleSave('red_flags', items)}
                    placeholder="Add a red flag…"
                    emptyLabel="No red flags documented yet — click to add"
                    disabled={!canEdit}
                  />
                </Section>

                <Section icon={StickyNote} title="Team notes" color="text-emerald-400">
                  <EditableText
                    value={selected.playbook?.team_notes ?? null}
                    onSave={(v) => handleSave('team_notes', v)}
                    placeholder="Living notes from the team — lessons learned, war stories, rules of thumb…"
                    disabled={!canEdit}
                  />
                  {selected.playbook?.last_edited_by && (
                    <p className="text-xs text-slate-600 mt-1 px-1">
                      Last edited by {selected.playbook.last_edited_by}
                      {selected.playbook.updated_at &&
                        ` · ${new Date(selected.playbook.updated_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}`}
                    </p>
                  )}
                </Section>
              </div>
            </div>
          )}
        </main>
      </div>
    </div>
  );
}
