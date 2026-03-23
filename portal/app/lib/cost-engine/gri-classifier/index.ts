/**
 * GRI Classification Engine — Public API
 *
 * Usage:
 *   import { classifyWithGRI } from '@/app/lib/cost-engine/gri-classifier';
 *   const result = await classifyWithGRI({ productName: 'Cotton T-Shirt', destinationCountry: 'US' });
 */

export { classifyWithGRI } from './pipeline';
export type {
  GriProductInput,
  GriClassificationResult,
  CountryAgentResult,
  ConflictPattern,
  DecisionStep,
} from './types';
