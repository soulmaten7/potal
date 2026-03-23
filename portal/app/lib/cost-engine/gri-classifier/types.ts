/**
 * GRI Classification Engine — Type Definitions
 *
 * Types for the GRI 1-6 based HS code classification pipeline.
 * v3 types added: 8-field input, step outputs
 */

// ─── v2 Types (unchanged) ────────────────────────────────

export interface GriProductInput {
  productName: string;
  description?: string;
  material?: string;
  price?: number;
  weight?: number;
  originCountry?: string;
  destinationCountry?: string;
  imageUrl?: string;
  // v3 9-field additions
  category?: string;
  processing?: string;
  composition?: string;
  weightSpec?: string;
}

export interface GriClassificationResult {
  hsCode: string;
  hsCodePrecision: 'HS10' | 'HS8' | 'HS6';
  description: string;
  confidence: number;

  decisionPath: DecisionStep[];

  griRulesApplied: {
    rule: string;
    reason: string;
  }[];

  alternatives?: {
    hsCode: string;
    description: string;
    confidence: number;
    rejectionReason: string;
  }[];

  classificationMethod: 'gri_pipeline';
  aiCallCount: number;
  processingTimeMs: number;

  countrySpecific?: {
    country: string;
    nationalCode: string;
    dutyRate?: number;
    additionalNotes?: string;
  };
}

export interface DecisionStep {
  step: number;
  name: string;
  input: string;
  output: string;
  method: 'code' | 'pattern_match' | 'ai';
  timeMs: number;
}

export interface KeywordResult {
  keywords: string[];
  material?: string;
  productType?: string;
  originalName: string;
  productUnderstood?: string;
  materialSecondary?: string | null;
  processingLevel?: 'raw' | 'semi-processed' | 'finished';
  isWaste?: boolean;
  isComposite?: boolean;
  hsNotes?: string;
}

export interface SectionCandidate {
  section: number;
  score: number;
  chapters: number[];
  title: string;
}

export interface ChapterCandidate {
  chapter: number;
  score: number;
  description: string;
}

export interface HeadingCandidate {
  heading: string;
  description: string;
  score: number;
}

export interface ConflictResolution {
  resolvedHeading: string;
  method: 'pattern_match' | 'ai_resolution' | 'score_fallback';
  reasoning: string;
  griRuleApplied?: string;
}

export interface SubheadingResult {
  hs6: string;
  description: string;
  confidence: number;
}

export interface CountryAgentResult {
  nationalCode: string;
  codePrecision: number;
  description: string;
  dutyRate?: number;
  additionalDuties?: string[];
  confidence: number;
  method: 'exact_match' | 'keyword_match' | 'price_break' | 'ai_selection' | 'pattern_single' | 'pattern_strong' | 'pattern_match' | 'pattern_catch_all' | 'db_keyword_match';
  aiCallCount: number;
}

export interface ConflictPattern {
  pattern_id: string;
  chapter: number;
  pattern_name: string;
  conflict_headings: string[];
  correct_heading: string;
  decision_criteria: {
    primary: string;
    indicators: string[];
  };
  rejection_reason: string;
  exceptions: string[];
  related_rulings: string[];
  gri_rule_applied: string;
  keywords: string[];
  source_count?: { cbp: number; ebti: number };
}

export interface SectionNote {
  section_number: number;
  section_numeral: string;
  title: string;
  chapter_from: string;
  chapter_to: string;
  section_note: string;
  note_length: number;
}

export interface ChapterNote {
  chapter_number: number;
  chapter_code: string;
  description: string;
  chapter_note: string;
  note_length: number;
}

// ─── v3 Types ────────────────────────────────────────────

/** v3 9-field input — seller's customs declaration data */
export interface ClassifyInputV3 {
  product_name: string;
  material: string;
  origin_country: string;
  destination_country?: string;  // Step 4 Country Router — 7개국 10자리 확장용
  category?: string;
  description?: string;
  processing?: string;
  composition?: string;
  weight_spec?: string;
  price?: number;
}

/** Normalized input after Step 0 */
export interface NormalizedInputV3 {
  product_name: string;
  material_primary: string;
  material_keywords: string[];
  origin_country: string;
  category_tokens: string[];
  description_tokens: string[];
  processing_states: string[];
  composition_parsed: CompositionEntry[];
  composition_raw: string;
  weight_spec: string | null;
  price: number | null;
  /** Extracted from composition: is it an alloy? */
  is_alloy: boolean;
  /** Extracted from composition: outsole material (for footwear) */
  outsole_material: string | null;
  /** Extracted from composition: upper material (for footwear) */
  upper_material: string | null;
}

export interface CompositionEntry {
  material: string;
  pct: number;
}

/** Step 2-1 output: Section candidates */
export interface Step2_1_Output {
  section_candidates: {
    section: number;
    title: string;
    score: number;
    matched_by: string;
    chapters: number[];
  }[];
}

/** Step 2-2 output: Section confirmed via Notes */
export interface Step2_2_Output {
  confirmed_section: number;
  section_title: string;
  chapters_in_section: number[];
  chapter_hints: { chapter: number; reason: string }[];
  rules_applied: { source: string; type: string; action: string }[];
  excluded_sections: { section: number; reason: string }[];
}

/** Step 2-3 output: Chapter candidates */
export interface Step2_3_Output {
  chapter_candidates: {
    chapter: number;
    score: number;
    matched_by: string;
  }[];
}

/** Step 2-4 output: Chapter confirmed via Notes */
export interface Step2_4_Output {
  confirmed_chapter: number;
  chapter_description: string;
  rules_applied: { source: string; type: string; action: string }[];
  excluded_chapters: { chapter: number; reason: string }[];
}

/** v3 Pipeline final output */
export interface V3PipelineResult {
  confirmed_section: number;
  confirmed_chapter: number;
  confirmed_heading?: string;
  confirmed_hs6?: string;
  // Step 4-6 결과
  final_hs_code?: string;
  hs_code_precision?: 'HS10' | 'HS8' | 'HS6';
  country_specific?: {
    country: string;
    national_code: string;
    duty_rate?: number;
    additional_duties?: string[];
    method: string;
  } | null;
  price_break_applied?: boolean;
  price_break_rule?: string;
  ai_call_count?: number;
  // 기존 필드
  headings_list: { heading: string; description: string }[];
  confidence: number;
  decision_path: V3DecisionStep[];
  cache_hit: boolean;
  processing_time_ms: number;
}

export interface V3DecisionStep {
  step: string;
  input_summary: string;
  output_summary: string;
  rules_applied: string[];
  time_ms: number;
}

/** Codified rule from Notes */
export interface CodifiedRule {
  source: string;
  type: 'exclusion' | 'inclusion' | 'numeric_threshold' | 'definition' | 'material_condition' | 'ai_derived_rule' | 'ai_required';
  original_text?: string;
  action?: {
    type: string;
    target_heading?: string;
    target_headings?: string[];
    target_chapters?: number[];
    target_sections?: string[];
  };
  threshold?: string;
  condition?: { value?: string; unit?: string; field?: string; operator?: string; values?: string[] };
  term?: string;
  definition?: string;
  material?: string;
  logic?: string;
  code_rule?: string;
  field_needed?: string;
  verified?: boolean;
}
