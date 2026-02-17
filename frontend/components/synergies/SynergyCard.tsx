'use client';

import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { formatCompactNumber, getStatusColor, getConfidenceColor } from '@/lib/utils';
import type { Synergy } from '@/lib/types';

interface SynergyCardProps {
  synergy: Synergy;
  onEdit?: (synergy: Synergy) => void;
  onDelete?: (id: number) => void;
}

export function SynergyCard({ synergy, onEdit, onDelete }: SynergyCardProps) {
  return (
    <Card className="glass-card border-white/10 bg-white/5 backdrop-blur-lg hover:bg-white/10 transition-all duration-300">
      <CardContent className="p-6">
        <div className="flex items-start justify-between mb-4">
          <div className="flex-1">
            <div className="flex items-center gap-2 mb-2">
              <h3 className="text-lg font-semibold text-white">{synergy.synergy_type}</h3>
              <span className={`px-2 py-1 text-xs font-medium rounded-full ${getStatusColor(synergy.status)}`}>
                {synergy.status.replace('_', ' ')}
              </span>
            </div>
            <p className="text-sm text-gray-300 mb-3">{synergy.description}</p>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-4 mb-4">
          <div>
            <p className="text-xs text-gray-400 mb-1">Value Range</p>
            <p className="text-lg font-semibold text-emerald-400 font-mono">
              {formatCompactNumber(synergy.value_low)} - {formatCompactNumber(synergy.value_high)}
            </p>
          </div>
          <div>
            <p className="text-xs text-gray-400 mb-1">Timeline</p>
            <p className="text-sm text-white">{synergy.realization_timeline}</p>
          </div>
        </div>

        <div className="flex items-center justify-between pt-4 border-t border-white/10">
          <div className="flex items-center gap-4 text-xs text-gray-400">
            <span className={getConfidenceColor(synergy.confidence_level)}>
              {synergy.confidence_level} confidence
            </span>
            {synergy.industry && <span>• {synergy.industry.name}</span>}
            {synergy.function && <span>• {synergy.function.name}</span>}
          </div>
          <div className="flex gap-2">
            {onEdit && (
              <Button
                size="sm"
                variant="outline"
                onClick={() => onEdit(synergy)}
                className="bg-white/10 border-white/20 text-white hover:bg-white/20"
              >
                Edit
              </Button>
            )}
            {onDelete && (
              <Button
                size="sm"
                variant="destructive"
                onClick={() => onDelete(synergy.id)}
                className="bg-red-500/20 border-red-500/20 text-red-300 hover:bg-red-500/30"
              >
                Delete
              </Button>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
