/**
 * F069: Consolidated Clearance
 *
 * Consolidates multiple shipments into a single customs entry.
 * Checks eligibility, calculates combined duty vs individual duty,
 * and detects potential split-shipment abuse.
 */

export interface ConsolidationShipment {
  id: string;
  items: Array<{
    description: string;
    hsCode: string;
    value: number;
    quantity: number;
  }>;
  origin: string;
  destination: string;
  recipient: string;
  shipDate: string;
}

export interface ConsolidationResult {
  canConsolidate: boolean;
  reasons: string[];
  warnings: string[];
  consolidatedValue: number;
  consolidatedDuty: number;
  individualDuties: Array<{ id: string; value: number; duty: number }>;
  savings: number;
  savingsPercent: number;
  formalEntryRequired: boolean;
  splitShipmentRisk: boolean;
}

// ─── De Minimis Thresholds (formal entry required above) ──

const FORMAL_ENTRY_THRESHOLDS: Record<string, number> = {
  US: 800, CA: 20, AU: 1000, GB: 135, EU: 150,
  JP: 10000, KR: 150, CN: 50, MX: 50, BR: 50,
};

// ─── Consolidation Eligibility ──────────────────────

export function canConsolidate(shipments: ConsolidationShipment[]): {
  eligible: boolean;
  reasons: string[];
  warnings: string[];
} {
  if (shipments.length < 2) {
    return { eligible: false, reasons: ['Need at least 2 shipments to consolidate.'], warnings: [] };
  }

  const reasons: string[] = [];
  const warnings: string[] = [];

  // Same destination
  const destinations = new Set(shipments.map(s => s.destination));
  if (destinations.size > 1) {
    reasons.push(`Multiple destinations: ${Array.from(destinations).join(', ')}. Must be same destination.`);
  }

  // Same origin
  const origins = new Set(shipments.map(s => s.origin));
  if (origins.size > 1) {
    reasons.push(`Multiple origins: ${Array.from(origins).join(', ')}. Must be same origin.`);
  }

  // Same recipient
  const recipients = new Set(shipments.map(s => s.recipient.toLowerCase().trim()));
  if (recipients.size > 1) {
    reasons.push('Different recipients. Consolidation requires same consignee.');
  }

  // Ship date within 24 hours
  const dates = shipments.map(s => new Date(s.shipDate).getTime()).sort();
  const maxGap = dates[dates.length - 1] - dates[0];
  if (maxGap > 24 * 60 * 60 * 1000) {
    warnings.push('Shipments span more than 24 hours. Some customs authorities may not allow consolidation.');
  }

  // Total value check
  const dest = shipments[0]?.destination || 'US';
  const totalValue = shipments.reduce((sum, s) => sum + s.items.reduce((is, i) => is + i.value * i.quantity, 0), 0);
  const threshold = FORMAL_ENTRY_THRESHOLDS[dest] || 800;

  if (totalValue > threshold) {
    warnings.push(`Consolidated value $${totalValue.toFixed(2)} exceeds ${dest} de minimis threshold ($${threshold}). Formal entry required.`);
  }

  return {
    eligible: reasons.length === 0,
    reasons,
    warnings,
  };
}

// ─── Consolidated vs Individual Duty ────────────────

export function calculateConsolidatedDuty(shipments: ConsolidationShipment[]): ConsolidationResult {
  const eligibility = canConsolidate(shipments);
  const dest = shipments[0]?.destination || 'US';
  const threshold = FORMAL_ENTRY_THRESHOLDS[dest] || 800;

  // Individual duties
  const avgDutyRate = 0.05; // 5% average
  const individualDuties = shipments.map(s => {
    const value = s.items.reduce((sum, i) => sum + i.value * i.quantity, 0);
    const duty = value <= threshold ? 0 : Math.round(value * avgDutyRate * 100) / 100;
    return { id: s.id, value: Math.round(value * 100) / 100, duty };
  });

  const totalIndividualDuty = individualDuties.reduce((s, d) => s + d.duty, 0);
  const consolidatedValue = individualDuties.reduce((s, d) => s + d.value, 0);
  const formalEntryRequired = consolidatedValue > threshold;
  const consolidatedDuty = formalEntryRequired
    ? Math.round(consolidatedValue * avgDutyRate * 100) / 100
    : 0;

  const savings = Math.round((totalIndividualDuty - consolidatedDuty) * 100) / 100;

  return {
    canConsolidate: eligibility.eligible,
    reasons: eligibility.reasons,
    warnings: eligibility.warnings,
    consolidatedValue: Math.round(consolidatedValue * 100) / 100,
    consolidatedDuty,
    individualDuties,
    savings,
    savingsPercent: totalIndividualDuty > 0 ? Math.round(savings / totalIndividualDuty * 10000) / 100 : 0,
    formalEntryRequired,
    splitShipmentRisk: false,
  };
}

// ─── Split Shipment Detection ───────────────────────

export function detectSplitShipments(
  shipments: ConsolidationShipment[],
  windowDays: number = 7
): { detected: boolean; groups: Array<{ shipmentIds: string[]; totalValue: number; warning: string }> } {
  const groups: Array<{ shipmentIds: string[]; totalValue: number; warning: string }> = [];

  // Group by recipient + origin + destination
  const byKey = new Map<string, ConsolidationShipment[]>();
  for (const s of shipments) {
    const key = `${s.recipient.toLowerCase().trim()}|${s.origin}|${s.destination}`;
    const existing = byKey.get(key) || [];
    existing.push(s);
    byKey.set(key, existing);
  }

  for (const [, group] of byKey) {
    if (group.length < 2) continue;

    // Check if within window
    const sorted = group.sort((a, b) => new Date(a.shipDate).getTime() - new Date(b.shipDate).getTime());
    const firstDate = new Date(sorted[0].shipDate).getTime();
    const lastDate = new Date(sorted[sorted.length - 1].shipDate).getTime();
    const daysDiff = (lastDate - firstDate) / (1000 * 60 * 60 * 24);

    if (daysDiff <= windowDays) {
      const totalValue = group.reduce((sum, s) => sum + s.items.reduce((is, i) => is + i.value * i.quantity, 0), 0);
      const dest = group[0].destination;
      const threshold = FORMAL_ENTRY_THRESHOLDS[dest] || 800;

      if (totalValue > threshold && group.every(s => s.items.reduce((is, i) => is + i.value * i.quantity, 0) <= threshold)) {
        groups.push({
          shipmentIds: group.map(s => s.id),
          totalValue: Math.round(totalValue * 100) / 100,
          warning: `${group.length} shipments to same recipient within ${Math.ceil(daysDiff)} days totaling $${totalValue.toFixed(2)} (each under $${threshold} de minimis). Possible split shipment to avoid duties.`,
        });
      }
    }
  }

  return { detected: groups.length > 0, groups };
}
