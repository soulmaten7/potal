/**
 * Priority Manager — defines data recovery priorities.
 * P0: immediate (service-breaking), P1: 24h, P2: 1 week, P3: 1 month.
 */

import { DATA_REGISTRY, type DataFile } from './data-registry';

export type Priority = 'P0' | 'P1' | 'P2' | 'P3';

export const PRIORITY_SLA: Record<Priority, { label: string; maxDowntimeHours: number }> = {
  P0: { label: 'Immediate — service-breaking', maxDowntimeHours: 1 },
  P1: { label: '24 hours — accuracy impact', maxDowntimeHours: 24 },
  P2: { label: '1 week — feature enhancement', maxDowntimeHours: 168 },
  P3: { label: '1 month — nice to have', maxDowntimeHours: 720 },
};

/** Get all files at a given priority */
export function getByPriority(priority: Priority): DataFile[] {
  return DATA_REGISTRY.filter(f => f.priority === priority);
}

/** Get priority summary counts */
export function getPrioritySummary(): Record<Priority, number> {
  const summary: Record<Priority, number> = { P0: 0, P1: 0, P2: 0, P3: 0 };
  for (const f of DATA_REGISTRY) {
    summary[f.priority]++;
  }
  return summary;
}
