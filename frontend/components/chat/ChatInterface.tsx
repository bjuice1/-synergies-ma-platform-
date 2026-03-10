'use client';

import { useChat } from '@ai-sdk/react';
import { DefaultChatTransport } from 'ai';
import { useQuery } from '@tanstack/react-query';
import { ChatMessage } from './ChatMessage';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useState, useEffect, useRef, useMemo } from 'react';
import { learnApi } from '@/lib/api';
import { formatCompactNumber } from '@/lib/utils';
import type { LeverWithPlaybook, DealChatContext } from '@/lib/types';

interface ChatInterfaceProps {
  dealContext?: DealChatContext | null;
}

function getDealSuggestedQueries(ctx: DealChatContext): string[] {
  const answered = Object.entries(ctx.environment_data ?? {}).filter(([, v]) => v?.trim());
  const queries = [
    `Help me scope the ${ctx.lever_name} lever for ${ctx.deal_name}`,
    answered.length
      ? `Based on what we know about the ${ctx.lever_name} environment, what are the top 3 specific synergies?`
      : `What data do I need to collect to move beyond the benchmark estimate for ${ctx.lever_name}?`,
    `What are the red flags to watch for in ${ctx.lever_name} integration?`,
    `What diligence questions should I prioritise in the next management meeting?`,
    `What's a realistic timeline to realise ${ctx.lever_name} synergies in this deal?`,
  ];
  return queries;
}

const GENERIC_QUERIES = [
  'What drives IT synergies in a tech acquisition?',
  'What are red flags for HR integration?',
  'What questions should I ask in procurement diligence?',
  'Explain the Real Estate lever',
  "What's a typical benchmark range for Finance synergies?",
];

export function ChatInterface({ dealContext }: ChatInterfaceProps) {
  const { data: leverContext, isLoading: leversLoading } = useQuery({
    queryKey: ['learn'],
    queryFn: learnApi.getAll,
    staleTime: 5 * 60 * 1000,
  });

  const leverContextRef = useRef<LeverWithPlaybook[] | undefined>(leverContext);
  const dealContextRef = useRef<DealChatContext | null | undefined>(dealContext);
  useEffect(() => { leverContextRef.current = leverContext; }, [leverContext]);
  useEffect(() => { dealContextRef.current = dealContext; }, [dealContext]);

  const transport = useMemo(
    () =>
      new DefaultChatTransport({
        api: '/api/chat',
        body: () => ({
          leverContext: leverContextRef.current ?? [],
          dealContext: dealContextRef.current ?? null,
        }),
      }),
    []
  );

  const { messages, sendMessage, status } = useChat({ transport });
  const isLoading = status === 'streaming' || status === 'submitted';
  const [input, setInput] = useState('');
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim()) return;
    sendMessage({ text: input });
    setInput('');
  };

  const suggestedQueries = dealContext
    ? getDealSuggestedQueries(dealContext)
    : GENERIC_QUERIES;

  return (
    <div className="flex flex-col h-full">
      {/* Deal context banner */}
      {dealContext && (
        <div className="flex-shrink-0 border-b border-orange-500/20 bg-orange-500/5 px-6 py-3">
          <div className="max-w-4xl mx-auto flex items-center gap-4 flex-wrap">
            <div className="flex items-center gap-2">
              <div className="w-1.5 h-1.5 rounded-full bg-orange-400" />
              <span className="text-xs font-semibold text-orange-400 uppercase tracking-wide">{dealContext.lever_name} Lever</span>
            </div>
            <span className="text-xs text-slate-400">{dealContext.deal_name}</span>
            <span className="text-xs text-slate-600">·</span>
            <span className="text-xs text-slate-400 font-mono">
              {formatCompactNumber(dealContext.value_low)}–{formatCompactNumber(dealContext.value_high)} opportunity
            </span>
            <span className="text-xs text-slate-600">·</span>
            <span className="text-xs text-slate-400">
              {Object.values(dealContext.environment_data ?? {}).filter(v => v?.trim()).length} environment data points loaded
            </span>
          </div>
        </div>
      )}

      {/* Messages area */}
      <div className="flex-1 overflow-y-auto px-4 py-6 space-y-4">
        {messages.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full text-center">
            <div className="glass-card border-white/10 bg-white/5 backdrop-blur-lg p-8 rounded-2xl max-w-2xl w-full">
              <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-emerald-500/10 flex items-center justify-center">
                <svg className="w-8 h-8 text-emerald-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                    d="M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5l-5 5v-5z" />
                </svg>
              </div>

              {dealContext ? (
                <>
                  <h2 className="text-xl font-bold text-white mb-1">{dealContext.lever_name} Scoping Assistant</h2>
                  <p className="text-slate-400 text-sm mb-1">{dealContext.deal_name}</p>
                  <p className="text-slate-500 text-xs mb-6">
                    {dealContext.acquirer_name} + {dealContext.target_name} ·{' '}
                    {formatCompactNumber(dealContext.value_low)}–{formatCompactNumber(dealContext.value_high)} benchmark range
                  </p>
                </>
              ) : (
                <>
                  <h2 className="text-2xl font-bold text-white mb-2">Lever Knowledge Assistant</h2>
                  <p className="text-gray-400 mb-6">
                    Ask me anything about M&A lever methodology — IT, Finance, HR, Operations, Procurement, Real Estate, and Revenue synergies.
                  </p>
                </>
              )}

              {leversLoading ? (
                <div className="space-y-2">
                  {[...Array(4)].map((_, i) => (
                    <div key={i} className="h-9 rounded-lg bg-white/5 animate-pulse" />
                  ))}
                </div>
              ) : (
                <div className="space-y-2 text-left">
                  <p className="text-sm text-gray-500 mb-3">Try asking:</p>
                  {suggestedQueries.map((query, index) => (
                    <button
                      key={index}
                      onClick={() => sendMessage({ text: query })}
                      className="block w-full text-left px-4 py-2 rounded-lg bg-white/5 hover:bg-white/10 border border-white/10 transition-colors text-sm text-gray-300"
                    >
                      {query}
                    </button>
                  ))}
                </div>
              )}
            </div>
          </div>
        ) : (
          <>
            {messages.map((message) => (
              <ChatMessage key={message.id} message={message} />
            ))}
            <div ref={messagesEndRef} />
          </>
        )}

        {isLoading && messages[messages.length - 1]?.role === 'user' && (
          <div className="flex justify-start">
            <div className="glass-card border-white/10 bg-white/5 backdrop-blur-lg rounded-lg px-4 py-3">
              <div className="flex items-center gap-2 text-gray-400">
                <div className="flex space-x-1">
                  {[0, 150, 300].map(delay => (
                    <div key={delay} className="w-2 h-2 bg-emerald-400 rounded-full animate-bounce" style={{ animationDelay: `${delay}ms` }} />
                  ))}
                </div>
                <span className="text-sm">Thinking...</span>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Input */}
      <div className="border-t border-white/10 bg-black/20 backdrop-blur-md p-4 flex-shrink-0">
        <form onSubmit={handleSubmit} className="flex gap-2 max-w-4xl mx-auto">
          <Input
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder={dealContext
              ? `Ask about ${dealContext.lever_name} for ${dealContext.deal_name}...`
              : 'Ask about lever methodology...'}
            className="flex-1 bg-white/5 border-white/10 text-white placeholder:text-gray-500"
            disabled={isLoading}
          />
          <Button
            type="submit"
            disabled={isLoading || !input.trim()}
            className="bg-emerald-600 hover:bg-emerald-700 text-white"
          >
            {isLoading ? (
              <svg className="w-5 h-5 animate-spin" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
              </svg>
            ) : (
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
              </svg>
            )}
          </Button>
        </form>
        <p className="text-xs text-gray-500 text-center mt-2">
          Powered by Claude · {dealContext ? `${dealContext.lever_name} context loaded` : 'Lever knowledge assistant'}
        </p>
      </div>
    </div>
  );
}
