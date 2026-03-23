/**
 * EU Country Agent — 10-digit classification.
 */
import type { CountryAgentResult } from '../types';
import { baseClassify } from './base-agent';

export async function classifyEU(hs6: string, keywords: string[] | Record<string, unknown>, price?: number, productName?: string): Promise<CountryAgentResult> {
  return baseClassify(hs6, keywords as any, 'EU', 10, price, productName);
}
