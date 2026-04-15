/**
 * CW37-S6: LLM-Friendly Response Metadata
 *
 * 4 principles:
 * 1. Self-explanatory field names
 * 2. Clear hierarchy (important → detail → metadata)
 * 3. Enum documentation
 * 4. Rich metadata (source, confidence, freshness, disclaimer)
 */

export interface LlmMetadata {
  disclaimer: string;
  dataLastUpdated?: string;
  confidenceScore?: number;
  confidenceExplanation?: string;
  sources?: string[];
  apiVersion: string;
  responseGeneratedAt: string;
  availableEnums?: Record<string, string[]>;
}

const DEFAULT_DISCLAIMER = 'For informational use only. POTAL provides trade compliance data and calculations but does not constitute legal, tax, or customs brokerage advice. Verify critical decisions with licensed professionals.';

export function buildLlmMetadata(opts?: {
  disclaimer?: string;
  dataLastUpdated?: string;
  confidenceScore?: number;
  confidenceExplanation?: string;
  sources?: string[];
  enums?: Record<string, string[]>;
}): LlmMetadata {
  return {
    disclaimer: opts?.disclaimer || DEFAULT_DISCLAIMER,
    dataLastUpdated: opts?.dataLastUpdated || undefined,
    confidenceScore: opts?.confidenceScore,
    confidenceExplanation: opts?.confidenceExplanation,
    sources: opts?.sources,
    apiVersion: 'v1',
    responseGeneratedAt: new Date().toISOString(),
    availableEnums: opts?.enums,
  };
}

/** Standard enums for LLM documentation */
export const ENUMS = {
  dutyRateSource: ['precomputed_mfn', 'precomputed_agr', 'precomputed_min', 'macmap_ntlc', 'macmap_mfn', 'macmap_agr', 'macmap_min', 'live_db', 'external_api', 'db', 'ruling_conditional', 'hardcoded'],
  rateType: ['ad_valorem', 'specific', 'compound', 'mixed', 'alternate'],
  eligibilityVerdict: ['eligible', 'ineligible', 'indeterminate'],
  classificationMethod: ['override', 'cache', 'vector', 'keyword', 'ai', 'v3-pipeline', 'keyword_fallback', 'manual'],
  restrictionType: ['PROHIBITED', 'LICENSE_REQUIRED', 'QUOTA', 'HAZMAT', 'CONTROLLED', 'SANCTIONS'],
  incoterms: ['EXW', 'FCA', 'CPT', 'CIP', 'DAP', 'DPU', 'DDP', 'FAS', 'FOB', 'CFR', 'CIF'],
  documentType: ['commercial_invoice', 'packing_list', 'certificate_of_origin', 'customs_declaration'],
  screeningStatus: ['clear', 'match_found', 'potential_match'],
};
