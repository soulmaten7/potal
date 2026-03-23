/**
 * AU Country Agent — 8-digit classification.
 */
import type { CountryAgentResult } from '../types';
import { baseClassify } from './base-agent';

export async function classifyAU(hs6: string, keywords: string[] | Record<string, unknown>, price?: number, productName?: string): Promise<CountryAgentResult> {
  return baseClassify(hs6, keywords as any, 'AU', 8, price, productName);
}
