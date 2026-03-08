/**
 * POTAL AI Classifier — Public API
 */

export { classifyWithAi, classifyWithVision, getAiClassifierConfig } from './claude-classifier';
export type { AiClassifierConfig } from './claude-classifier';
export {
  classifyProductAsync,
  classifyWithOverrideAsync,
} from './ai-classifier-wrapper';
