'use client';

import { cn } from '@/lib/utils';
import type { Message } from 'ai';

interface ChatMessageProps {
  message: Message;
}

export function ChatMessage({ message }: ChatMessageProps) {
  const isUser = message.role === 'user';

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
            {isUser ? 'You' : 'AI Assistant'}
          </span>
        </div>

        {/* Message content */}
        <div className="whitespace-pre-wrap leading-relaxed">
          {message.content}
        </div>

        {/* Tool calls indicator */}
        {message.toolInvocations && message.toolInvocations.length > 0 && (
          <div className="mt-3 pt-3 border-t border-white/10">
            <div className="flex items-center gap-2 text-xs text-gray-400">
              <svg
                className="w-3 h-3 animate-spin"
                xmlns="http://www.w3.org/2000/svg"
                fill="none"
                viewBox="0 0 24 24"
              >
                <circle
                  className="opacity-25"
                  cx="12"
                  cy="12"
                  r="10"
                  stroke="currentColor"
                  strokeWidth="4"
                />
                <path
                  className="opacity-75"
                  fill="currentColor"
                  d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                />
              </svg>
              <span>Querying database...</span>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
