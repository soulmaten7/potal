/**
 * CA Country Agent — 10-digit classification.
 */
import type { CountryAgentResult } from '../types';
import { baseClassify } from './base-agent';

export async function classifyCA(hs6: string, keywords: string[] | Record<string, unknown>, price?: number, productName?: string): Promise<CountryAgentResult> {
  return baseClassify(hs6, keywords as any, 'CA', 10, price, productName);
}
