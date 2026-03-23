/**
 * KR Country Agent — 10-digit classification.
 */
import type { CountryAgentResult } from '../types';
import { baseClassify } from './base-agent';

export async function classifyKR(hs6: string, keywords: string[] | Record<string, unknown>, price?: number, productName?: string): Promise<CountryAgentResult> {
  return baseClassify(hs6, keywords as any, 'KR', 10, price, productName);
}
