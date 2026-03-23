/**
 * Dependency Chain — "if A changes, B must also update."
 */

export interface DependencyChain {
  trigger: string;
  dependents: string[];
  action: 'recalculate' | 'rebuild_index' | 'invalidate_cache' | 'no_action_needed';
  priority: 'P0' | 'P1' | 'P2';
}

export const DEPENDENCY_CHAINS: DependencyChain[] = [
  {
    trigger: 'db:macmap_ntlc_rates',
    dependents: ['db:precomputed_landed_costs'],
    action: 'invalidate_cache',
    priority: 'P0',
  },
  {
    trigger: 'app/lib/cost-engine/section301-lookup.ts',
    dependents: ['db:precomputed_landed_costs'],
    action: 'invalidate_cache',
    priority: 'P0',
  },
  {
    trigger: 'db:sanctions_entries',
    dependents: ['db:sanctions_aliases', 'db:sanctions_addresses', 'db:sanctions_ids'],
    action: 'rebuild_index',
    priority: 'P0',
  },
  {
    trigger: 'db:vat_gst_rates',
    dependents: ['db:precomputed_landed_costs'],
    action: 'invalidate_cache',
    priority: 'P0',
  },
  {
    trigger: 'external:ecb_daily_xml',
    dependents: [],
    action: 'no_action_needed',
    priority: 'P1',
  },
  {
    trigger: 'db:gov_tariff_schedules',
    dependents: ['db:precomputed_landed_costs'],
    action: 'invalidate_cache',
    priority: 'P1',
  },
  {
    trigger: 'app/lib/cost-engine/gri-classifier/data/heading-descriptions.ts',
    dependents: [
      'app/lib/cost-engine/gri-classifier/data/conflict-patterns-data.ts',
      'db:product_hs_mappings',
    ],
    action: 'invalidate_cache',
    priority: 'P1',
  },
];

/** Get all dependents that need updating when trigger changes */
export function getDependents(trigger: string): DependencyChain | undefined {
  return DEPENDENCY_CHAINS.find(c => c.trigger === trigger);
}

/** Get all triggers that affect a given file */
export function getTriggers(dependent: string): DependencyChain[] {
  return DEPENDENCY_CHAINS.filter(c => c.dependents.includes(dependent));
}
