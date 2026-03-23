/**
 * Step 7: Resolve heading conflicts.
 * Uses conflict patterns first, then AI as last resort.
 * AI calls: 0 (pattern match) or 1 (AI resolution).
 */

import type { HeadingCandidate, KeywordResult, ConflictResolution, GriProductInput } from '../types';
import { findMatchingPattern } from '../data/conflict-patterns';
import { getGriRule } from '../data/gri-rules';

export async function resolveConflict(
  headingCandidates: HeadingCandidate[],
  keywordResult: KeywordResult,
  input: GriProductInput
): Promise<ConflictResolution & { aiCalled: boolean }> {
  const { keywords } = keywordResult;
  const chapter = parseInt(headingCandidates[0]?.heading.substring(0, 2) || '0', 10);
  const candidateHeadings = headingCandidates.map(h => h.heading);

  // Step 1: Try conflict pattern matching
  const pattern = findMatchingPattern(chapter, keywords, candidateHeadings);

  if (pattern) {
    // Check if any exception applies
    const productStr = (input.productName + ' ' + (input.material || '')).toLowerCase();
    let exceptionApplies = false;

    for (const exception of pattern.exceptions || []) {
      const exLower = exception.toLowerCase();
      // Simple heuristic: if exception keywords appear in product
      const exWords = exLower.split(/\s+/).filter(w => w.length > 4);
      const matchCount = exWords.filter(w => productStr.includes(w)).length;
      if (matchCount >= 2) {
        exceptionApplies = true;
        break;
      }
    }

    if (!exceptionApplies) {
      return {
        resolvedHeading: pattern.correct_heading,
        method: 'pattern_match',
        reasoning: `Pattern "${pattern.pattern_name}" matched. ${pattern.decision_criteria.primary}`,
        griRuleApplied: pattern.gri_rule_applied,
        aiCalled: false,
      };
    }
  }

  // Step 2: Try GRI 3(a) — most specific description
  const topCandidate = headingCandidates[0];
  const secondCandidate = headingCandidates[1];

  if (topCandidate && secondCandidate) {
    const scoreDiff = topCandidate.score - secondCandidate.score;

    // If clear winner by score, use it
    if (scoreDiff >= 2) {
      return {
        resolvedHeading: topCandidate.heading,
        method: 'score_fallback',
        reasoning: `GRI 3(a): "${topCandidate.description}" is the most specific description (score ${topCandidate.score} vs ${secondCandidate.score})`,
        griRuleApplied: 'GRI 3(a) — most specific description',
        aiCalled: false,
      };
    }
  }

  // Step 3: AI resolution (last resort)
  try {
    const aiResult = await callAIForConflictResolution(headingCandidates, input);
    if (aiResult) {
      return { ...aiResult, aiCalled: true };
    }
  } catch {
    // AI failed, fall through to score fallback
  }

  // Step 4: Score fallback
  return {
    resolvedHeading: topCandidate?.heading || candidateHeadings[0] || '0000',
    method: 'score_fallback',
    reasoning: 'Fallback: selected highest-scoring heading candidate',
    griRuleApplied: 'GRI 3(c) — last in numerical order',
    aiCalled: false,
  };
}

async function callAIForConflictResolution(
  candidates: HeadingCandidate[],
  input: GriProductInput
): Promise<ConflictResolution | null> {
  const groqKey = process.env.GROQ_API_KEY;
  const openaiKey = process.env.OPENAI_API_KEY;

  if (!groqKey && !openaiKey) return null;

  const candidateList = candidates
    .slice(0, 5)
    .map(c => `${c.heading}: ${c.description}`)
    .join('\n');

  const prompt = `You are a WCO-certified customs classification expert.
Classify the following product according to GRI rules 1-5.

Product: ${input.productName}
${input.material ? `Material: ${input.material}` : ''}
${input.price ? `Price: $${input.price}` : ''}

Candidate headings:
${candidateList}

${getGriRule(1)}
${getGriRule(3)}

Respond in JSON only:
{"heading": "XXXX", "gri_rule": "GRI X(x)", "reasoning": "one sentence"}`;

  try {
    // Try Groq first (faster, cheaper)
    if (groqKey) {
      const response = await fetch('https://api.groq.com/openai/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${groqKey}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          model: 'llama-3.3-70b-versatile',
          messages: [{ role: 'user', content: prompt }],
          temperature: 0,
          max_tokens: 200,
          response_format: { type: 'json_object' },
        }),
      });

      if (response.ok) {
        const data = await response.json();
        const content = data.choices?.[0]?.message?.content;
        if (content) {
          const parsed = JSON.parse(content);
          if (parsed.heading) {
            return {
              resolvedHeading: String(parsed.heading),
              method: 'ai_resolution',
              reasoning: parsed.reasoning || 'AI-resolved conflict',
              griRuleApplied: parsed.gri_rule || 'GRI 3(a)',
            };
          }
        }
      }
    }

    // Fallback to OpenAI
    if (openaiKey) {
      const response = await fetch('https://api.openai.com/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${openaiKey}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          model: 'gpt-4o-mini',
          messages: [{ role: 'user', content: prompt }],
          temperature: 0,
          max_tokens: 200,
          response_format: { type: 'json_object' },
        }),
      });

      if (response.ok) {
        const data = await response.json();
        const content = data.choices?.[0]?.message?.content;
        if (content) {
          const parsed = JSON.parse(content);
          if (parsed.heading) {
            return {
              resolvedHeading: String(parsed.heading),
              method: 'ai_resolution',
              reasoning: parsed.reasoning || 'AI-resolved conflict',
              griRuleApplied: parsed.gri_rule || 'GRI 3(a)',
            };
          }
        }
      }
    }
  } catch {
    // AI call failed
  }

  return null;
}
