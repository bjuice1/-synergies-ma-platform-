'use client';

import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Label } from '@/components/ui/label';
import type { SynergyFilters } from '@/lib/types';

interface SynergyFiltersProps {
  filters: SynergyFilters;
  onFiltersChange: (filters: SynergyFilters) => void;
}

export function SynergyFiltersComponent({ filters, onFiltersChange }: SynergyFiltersProps) {
  return (
    <div className="glass-card border-white/10 bg-white/5 backdrop-blur-lg p-6 mb-6">
      <h3 className="text-lg font-semibold text-white mb-4">Filters</h3>
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        {/* Search */}
        <div>
          <Label htmlFor="search" className="text-white mb-2 block">
            Search
          </Label>
          <Input
            id="search"
            placeholder="Search synergies..."
            value={filters.search || ''}
            onChange={(e) =>
              onFiltersChange({ ...filters, search: e.target.value || undefined })
            }
            className="bg-white/10 border-white/20 text-white placeholder:text-gray-400"
          />
        </div>

        {/* Status Filter */}
        <div>
          <Label htmlFor="status" className="text-white mb-2 block">
            Status
          </Label>
          <Select
            value={filters.status || 'all'}
            onValueChange={(value) =>
              onFiltersChange({
                ...filters,
                status: value === 'all' ? undefined : (value as any),
              })
            }
          >
            <SelectTrigger className="bg-white/10 border-white/20 text-white">
              <SelectValue placeholder="All statuses" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All statuses</SelectItem>
              <SelectItem value="IDENTIFIED">Identified</SelectItem>
              <SelectItem value="IN_PROGRESS">In Progress</SelectItem>
              <SelectItem value="REALIZED">Realized</SelectItem>
              <SelectItem value="AT_RISK">At Risk</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {/* Sort By */}
        <div>
          <Label htmlFor="sort" className="text-white mb-2 block">
            Sort By
          </Label>
          <Select
            value={filters.sort_by || 'created_at'}
            onValueChange={(value) =>
              onFiltersChange({ ...filters, sort_by: value })
            }
          >
            <SelectTrigger className="bg-white/10 border-white/20 text-white">
              <SelectValue placeholder="Sort by..." />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="created_at">Date Created</SelectItem>
              <SelectItem value="value_high">Value (High)</SelectItem>
              <SelectItem value="value_low">Value (Low)</SelectItem>
              <SelectItem value="synergy_type">Type</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {/* Sort Order */}
        <div>
          <Label htmlFor="order" className="text-white mb-2 block">
            Order
          </Label>
          <Select
            value={filters.sort_order || 'desc'}
            onValueChange={(value: 'asc' | 'desc') =>
              onFiltersChange({ ...filters, sort_order: value })
            }
          >
            <SelectTrigger className="bg-white/10 border-white/20 text-white">
              <SelectValue placeholder="Order..." />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="desc">Descending</SelectItem>
              <SelectItem value="asc">Ascending</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>
    </div>
  );
}
