/**
 * JP Country Agent — 9-digit classification.
 */
import type { CountryAgentResult } from '../types';
import { baseClassify } from './base-agent';

export async function classifyJP(hs6: string, keywords: string[] | Record<string, unknown>, price?: number, productName?: string): Promise<CountryAgentResult> {
  return baseClassify(hs6, keywords as any, 'JP', 9, price, productName);
}
