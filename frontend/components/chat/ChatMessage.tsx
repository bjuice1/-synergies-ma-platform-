'use client';

import { cn } from '@/lib/utils';
import type { UIMessage } from 'ai';

interface ChatMessageProps {
  message: UIMessage;
}

export function ChatMessage({ message }: ChatMessageProps) {
  const isUser = message.role === 'user';

  const textContent = message.parts
    .filter((p): p is Extract<typeof p, { type: 'text' }> => p.type === 'text')
    .map((p) => p.text)
    .join('');

  return (
    <div
      className={cn(
        'flex w-full mb-4 animate-slide-in',
        isUser ? 'justify-end' : 'justify-start'
      )}
    >
      <div
        className={cn(
          'max-w-[80%] rounded-lg px-4 py-3 text-sm',
          isUser
            ? 'bg-emerald-600 text-white'
            : 'glass-card border-white/10 bg-white/5 backdrop-blur-lg text-white'
        )}
      >
        {/* Role label */}
        <div className="flex items-center gap-2 mb-1">
          <div
            className={cn(
              'w-2 h-2 rounded-full',
              isUser ? 'bg-white/60' : 'bg-emerald-400'
            )}
          />
          <span
            className={cn(
              'text-xs font-medium',
              isUser ? 'text-white/80' : 'text-gray-400'
            )}
          >
            {isUser ? 'You' : 'Claude'}
          </span>
        </div>

        {/* Message content */}
        <div className="whitespace-pre-wrap leading-relaxed">
          {textContent}
        </div>
      </div>
    </div>
  );
}
