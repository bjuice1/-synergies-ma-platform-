'use client';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { formatCompactNumber, getStatusColor, formatRelativeTime } from '@/lib/utils';
import type { Synergy } from '@/lib/types';
import Link from 'next/link';

interface RecentSynergiesProps {
  synergies: Synergy[];
}

export function RecentSynergies({ synergies }: RecentSynergiesProps) {
  return (
    <Card className="glass-card border-white/20 bg-white/10 backdrop-blur-md">
      <CardHeader>
        <CardTitle className="text-white">Recent Synergies</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-3">
          {synergies.length === 0 ? (
            <p className="text-center text-gray-400 py-8">No synergies found</p>
          ) : (
            synergies.map((synergy) => (
              <Link
                key={synergy.id}
                href={`/synergies/${synergy.id}`}
                className="block p-4 rounded-lg bg-white/5 hover:bg-white/10 border border-white/10 transition-all duration-200"
              >
                <div className="flex items-start justify-between">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <h4 className="text-sm font-medium text-white truncate">
                        {synergy.synergy_type}
                      </h4>
                      <span
                        className={`px-2 py-0.5 text-xs font-medium rounded-full ${getStatusColor(
                          synergy.status
                        )}`}
                      >
                        {synergy.status.replace('_', ' ')}
                      </span>
                    </div>
                    <p className="text-xs text-gray-400 line-clamp-2 mb-2">
                      {synergy.description}
                    </p>
                    <div className="flex items-center gap-3 text-xs text-gray-500">
                      <span>{synergy.realization_timeline}</span>
                      <span>•</span>
                      <span className="capitalize">{synergy.confidence_level} confidence</span>
                    </div>
                  </div>
                  <div className="ml-4 text-right flex-shrink-0">
                    <div className="text-sm font-semibold text-emerald-400 font-mono">
                      {formatCompactNumber((synergy.value_low + synergy.value_high) / 2)}
                    </div>
                    <div className="text-xs text-gray-500 mt-1">
                      {formatRelativeTime(synergy.created_at)}
                    </div>
                  </div>
                </div>
              </Link>
            ))
          )}
        </div>
      </CardContent>
    </Card>
  );
}
