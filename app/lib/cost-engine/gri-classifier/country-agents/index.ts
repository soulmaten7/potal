/**
 * Country Agent Router — routes to the appropriate country agent.
 * Supports both legacy (string[]) and enhanced input formats.
 */

import type { CountryAgentResult } from '../types';
import { classifyUS } from './us-agent';
import { classifyEU } from './eu-agent';
import { classifyUK } from './uk-agent';
import { classifyKR } from './kr-agent';
import { classifyJP } from './jp-agent';
import { classifyAU } from './au-agent';
import { classifyCA } from './ca-agent';

type AgentFn = (hs6: string, keywords: string[] | Record<string, unknown>, price?: number, productName?: string) => Promise<CountryAgentResult>;

const COUNTRY_AGENTS: Record<string, AgentFn> = {
  'US': classifyUS,
  'EU': classifyEU,
  'GB': classifyUK,
  'KR': classifyKR,
  'JP': classifyJP,
  'AU': classifyAU,
  'CA': classifyCA,
};

export async function routeToCountryAgent(
  hs6: string,
  destinationCountry: string,
  keywords: string[] | Record<string, unknown>,
  price?: number,
  productName?: string
): Promise<CountryAgentResult | null> {
  const country = destinationCountry.toUpperCase();
  const agent = COUNTRY_AGENTS[country];

  if (!agent) return null;

  return await agent(hs6, keywords, price, productName);
}
