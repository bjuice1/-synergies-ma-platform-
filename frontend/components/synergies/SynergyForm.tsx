'use client';

import { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import type { Synergy, CreateSynergyInput } from '@/lib/types';

interface SynergyFormProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSubmit: (data: CreateSynergyInput) => void;
  synergy?: Synergy | null;
  loading?: boolean;
}

export function SynergyForm({ open, onOpenChange, onSubmit, synergy, loading }: SynergyFormProps) {
  const [formData, setFormData] = useState<CreateSynergyInput>({
    source_entity_id: 1,
    target_entity_id: 2,
    synergy_type: '',
    value_low: 0,
    value_high: 0,
    description: '',
    realization_timeline: '',
    confidence_level: 'MEDIUM',
    status: 'IDENTIFIED',
  });

  useEffect(() => {
    if (synergy) {
      setFormData({
        source_entity_id: synergy.source_entity_id,
        target_entity_id: synergy.target_entity_id,
        synergy_type: synergy.synergy_type,
        value_low: synergy.value_low,
        value_high: synergy.value_high,
        description: synergy.description,
        realization_timeline: synergy.realization_timeline,
        confidence_level: synergy.confidence_level,
        status: synergy.status,
        industry_id: synergy.industry_id,
        function_id: synergy.function_id,
        category_id: synergy.category_id,
      });
    } else {
      setFormData({
        source_entity_id: 1,
        target_entity_id: 2,
        synergy_type: '',
        value_low: 0,
        value_high: 0,
        description: '',
        realization_timeline: '',
        confidence_level: 'MEDIUM',
        status: 'IDENTIFIED',
      });
    }
  }, [synergy, open]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSubmit(formData);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl bg-slate-900 border-white/20 text-white">
        <DialogHeader>
          <DialogTitle>{synergy ? 'Edit Synergy' : 'Create New Synergy'}</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label htmlFor="synergy_type">Synergy Type *</Label>
              <Input
                id="synergy_type"
                value={formData.synergy_type}
                onChange={(e) => setFormData({ ...formData, synergy_type: e.target.value })}
                required
                className="bg-white/10 border-white/20 text-white"
              />
            </div>
            <div>
              <Label htmlFor="realization_timeline">Timeline *</Label>
              <Input
                id="realization_timeline"
                value={formData.realization_timeline}
                onChange={(e) => setFormData({ ...formData, realization_timeline: e.target.value })}
                required
                placeholder="e.g., 12-18 months"
                className="bg-white/10 border-white/20 text-white"
              />
            </div>
          </div>

          <div>
            <Label htmlFor="description">Description *</Label>
            <Textarea
              id="description"
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              required
              rows={3}
              className="bg-white/10 border-white/20 text-white"
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label htmlFor="value_low">Value Low ($) *</Label>
              <Input
                id="value_low"
                type="number"
                value={formData.value_low}
                onChange={(e) => setFormData({ ...formData, value_low: Number(e.target.value) })}
                required
                className="bg-white/10 border-white/20 text-white"
              />
            </div>
            <div>
              <Label htmlFor="value_high">Value High ($) *</Label>
              <Input
                id="value_high"
                type="number"
                value={formData.value_high}
                onChange={(e) => setFormData({ ...formData, value_high: Number(e.target.value) })}
                required
                className="bg-white/10 border-white/20 text-white"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label htmlFor="confidence_level">Confidence Level *</Label>
              <Select
                value={formData.confidence_level}
                onValueChange={(value) => setFormData({ ...formData, confidence_level: value })}
              >
                <SelectTrigger className="bg-white/10 border-white/20 text-white">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="HIGH">High</SelectItem>
                  <SelectItem value="MEDIUM">Medium</SelectItem>
                  <SelectItem value="LOW">Low</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label htmlFor="status">Status *</Label>
              <Select
                value={formData.status}
                onValueChange={(value: any) => setFormData({ ...formData, status: value })}
              >
                <SelectTrigger className="bg-white/10 border-white/20 text-white">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="IDENTIFIED">Identified</SelectItem>
                  <SelectItem value="IN_PROGRESS">In Progress</SelectItem>
                  <SelectItem value="REALIZED">Realized</SelectItem>
                  <SelectItem value="AT_RISK">At Risk</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
              className="bg-white/10 border-white/20 text-white hover:bg-white/20"
            >
              Cancel
            </Button>
            <Button
              type="submit"
              className="bg-emerald-600 hover:bg-emerald-700 text-white"
              disabled={loading}
            >
              {loading ? 'Saving...' : synergy ? 'Update' : 'Create'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
