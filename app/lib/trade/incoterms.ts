/**
 * F026: Incoterms Support — S+ Grade
 */

export type Incoterm = 'EXW' | 'FCA' | 'CPT' | 'CIP' | 'DAP' | 'DPU' | 'DDP' | 'FAS' | 'FOB' | 'CFR' | 'CIF';

export interface CostAllocation {
  sellerPays: string[];
  buyerPays: string[];
  riskTransferPoint: string;
}

const ALLOCATIONS: Record<Incoterm, CostAllocation> = {
  EXW: { sellerPays: ['Packaging'], buyerPays: ['Loading', 'Export clearance', 'Freight', 'Insurance', 'Import clearance', 'Duties', 'Delivery'], riskTransferPoint: "Seller's premises" },
  FCA: { sellerPays: ['Packaging', 'Loading', 'Export clearance'], buyerPays: ['Freight', 'Insurance', 'Import clearance', 'Duties', 'Delivery'], riskTransferPoint: 'Named place (carrier)' },
  CPT: { sellerPays: ['Packaging', 'Loading', 'Export clearance', 'Freight to destination'], buyerPays: ['Insurance', 'Import clearance', 'Duties', 'Delivery'], riskTransferPoint: 'Carrier at origin' },
  CIP: { sellerPays: ['Packaging', 'Loading', 'Export clearance', 'Freight', 'Insurance'], buyerPays: ['Import clearance', 'Duties', 'Delivery'], riskTransferPoint: 'Carrier at origin' },
  DAP: { sellerPays: ['Packaging', 'Loading', 'Export clearance', 'Freight', 'Insurance'], buyerPays: ['Import clearance', 'Duties', 'Unloading'], riskTransferPoint: 'Named destination (before unloading)' },
  DPU: { sellerPays: ['Packaging', 'Loading', 'Export clearance', 'Freight', 'Insurance', 'Unloading'], buyerPays: ['Import clearance', 'Duties'], riskTransferPoint: 'Named destination (after unloading)' },
  DDP: { sellerPays: ['Packaging', 'Loading', 'Export clearance', 'Freight', 'Insurance', 'Import clearance', 'Duties', 'Delivery'], buyerPays: ['Unloading at final destination'], riskTransferPoint: "Buyer's premises" },
  FAS: { sellerPays: ['Packaging', 'Loading to port', 'Export clearance'], buyerPays: ['Loading on vessel', 'Freight', 'Insurance', 'Import clearance', 'Duties'], riskTransferPoint: 'Alongside vessel at port' },
  FOB: { sellerPays: ['Packaging', 'Loading', 'Export clearance', 'Loading on vessel'], buyerPays: ['Freight', 'Insurance', 'Import clearance', 'Duties'], riskTransferPoint: 'On board vessel at port' },
  CFR: { sellerPays: ['Packaging', 'Loading', 'Export clearance', 'Freight'], buyerPays: ['Insurance', 'Import clearance', 'Duties'], riskTransferPoint: 'On board vessel at port of shipment' },
  CIF: { sellerPays: ['Packaging', 'Loading', 'Export clearance', 'Freight', 'Insurance (min)'], buyerPays: ['Import clearance', 'Duties', 'Delivery from port'], riskTransferPoint: 'On board vessel at port of shipment' },
};

const SEA_ONLY: Set<Incoterm> = new Set(['FAS', 'FOB', 'CFR', 'CIF']);

export function getCostAllocation(incoterm: Incoterm): CostAllocation {
  return ALLOCATIONS[incoterm] || ALLOCATIONS['FOB'];
}

export function validateIncoterm(term: Incoterm, transportMode: string): { valid: boolean; issue?: string } {
  if (SEA_ONLY.has(term) && transportMode !== 'sea' && transportMode !== 'inland_waterway') {
    return { valid: false, issue: `${term} is only valid for sea/inland waterway transport. Consider ${term === 'FOB' ? 'FCA' : term === 'CIF' ? 'CIP' : 'CPT'} instead.` };
  }
  return { valid: true };
}

export function recommendIncoterm(params: {
  experienceLevel: 'beginner' | 'intermediate' | 'expert';
  transportMode: string;
  productType?: string;
}): { recommended: Incoterm; reason: string; alternatives: Array<{ term: Incoterm; pros: string; cons: string }> } {
  const { experienceLevel, transportMode } = params;
  const isSea = transportMode === 'sea';

  if (experienceLevel === 'beginner') {
    return {
      recommended: 'DDP',
      reason: 'DDP gives the buyer the simplest experience — seller handles everything including duties.',
      alternatives: [
        { term: 'DAP', pros: 'Seller handles shipping', cons: 'Buyer must clear customs and pay duties' },
        { term: isSea ? 'CIF' : 'CIP', pros: 'Balanced cost sharing', cons: 'Buyer handles import clearance' },
      ],
    };
  }

  if (experienceLevel === 'intermediate') {
    return {
      recommended: isSea ? 'CIF' : 'CIP',
      reason: 'Balanced risk/cost sharing. Seller covers freight and insurance, buyer handles import.',
      alternatives: [
        { term: isSea ? 'FOB' : 'FCA', pros: 'Lower seller cost', cons: 'Buyer arranges freight' },
        { term: 'DAP', pros: 'Seller delivers to destination', cons: 'Higher seller responsibility' },
      ],
    };
  }

  return {
    recommended: isSea ? 'FOB' : 'FCA',
    reason: 'Maximum buyer control over logistics. Lowest seller obligation.',
    alternatives: [
      { term: 'EXW', pros: 'Minimum seller responsibility', cons: 'Buyer handles everything from pickup' },
      { term: isSea ? 'CFR' : 'CPT', pros: 'Seller arranges freight', cons: 'Buyer must insure' },
    ],
  };
}
