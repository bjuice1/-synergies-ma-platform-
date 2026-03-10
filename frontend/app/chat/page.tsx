'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/hooks/useAuth';
import { ChatInterface } from '@/components/chat/ChatInterface';
import { LoadingSpinner } from '@/components/ui/loading-spinner';
import type { DealChatContext } from '@/lib/types';

const NAV_LINKS = [
  { href: '/dashboard', label: 'Dashboard' },
  { href: '/deals',     label: 'Deals' },
  { href: '/learn',     label: 'Learn' },
  { href: '/chat',      label: 'AI Chat', active: true },
];

export default function ChatPage() {
  const router = useRouter();
  const { isAuthenticated, loading: authLoading } = useAuth();
  const [dealContext, setDealContext] = useState<DealChatContext | null>(null);

  // Read lever context injected by "Scope with AI" button
  useEffect(() => {
    const raw = sessionStorage.getItem('leverChatContext');
    if (raw) {
      try {
        setDealContext(JSON.parse(raw));
      } catch {
        // malformed, ignore
      }
      sessionStorage.removeItem('leverChatContext');
    }
  }, []);

  useEffect(() => {
    if (!authLoading && !isAuthenticated) router.push('/login');
  }, [isAuthenticated, authLoading, router]);

  if (authLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-[#0C0F1A]">
        <LoadingSpinner size="lg" />
      </div>
    );
  }

  if (!isAuthenticated) return null;

  return (
    <div className="h-screen bg-[#0C0F1A] flex flex-col">

      <header className="border-b border-white/8 bg-[#0E1220] flex-shrink-0">
        <div className="max-w-7xl mx-auto px-6 lg:px-8">
          <div className="flex items-center justify-between h-14">
            <div className="flex items-center gap-3">
              <div className="w-1 h-6 bg-orange-500 rounded-full" />
              <span className="text-sm font-semibold text-white tracking-wide">SYNERGIES</span>
            </div>
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
      </header>

      <div className="border-b border-white/8 bg-[#0E1220] flex-shrink-0">
        <div className="max-w-7xl mx-auto px-6 lg:px-8 py-4">
          <p className="text-xs font-semibold text-orange-500 uppercase tracking-widest mb-0.5">Assistant</p>
          <h1 className="text-lg font-bold text-white">
            {dealContext ? `${dealContext.lever_name} Scoping — ${dealContext.deal_name}` : 'AI Chat'}
          </h1>
          <p className="text-xs text-slate-500 mt-0.5">
            {dealContext
              ? `${dealContext.acquirer_name} + ${dealContext.target_name} · deal context loaded`
              : 'Ask questions about M&A lever methodology and deal analysis'}
          </p>
        </div>
      </div>

      <div className="flex-1 overflow-hidden">
        <div className="h-full max-w-7xl mx-auto">
          <ChatInterface dealContext={dealContext} />
        </div>
      </div>
    </div>
  );
}
