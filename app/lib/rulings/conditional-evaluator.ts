/**
 * CW34-S4: Conditional Rules Runtime Evaluator
 *
 * Evaluates JSONB DSL from customs_rulings.conditional_rules
 * against user-provided 10-field context.
 *
 * DSL schema (from Gold build-gold.mjs):
 * {
 *   type: 'if_else' | 'threshold' | 'weight_threshold',
 *   condition: { field: string, op: string, value: number },
 *   then: { ad_valorem?: number },
 *   else?: { ad_valorem?: number }
 * }
 */

export interface EvalContext {
  material?: string;
  materialComposition?: Record<string, number>;
  productForm?: string;
  intendedUse?: string;
  weightKg?: number;
  priceUsd?: number;
}

export interface ConditionalOutcome {
  matched: boolean;
  adValorem: number | null;
  reason: string;
}

export function evaluateConditionalRules(
  rules: Record<string, unknown> | null,
  ctx: EvalContext
): ConditionalOutcome {
  if (!rules) return { matched: false, adValorem: null, reason: 'no rules' };

  const r = rules as Record<string, unknown>;
  const condition = r.condition as Record<string, unknown> | undefined;
  if (!condition) return { matched: false, adValorem: null, reason: 'no condition' };

  const field = String(condition.field || '');
  const op = String(condition.op || '');
  const value = Number(condition.value ?? 0);

  let actual: number | null = null;

  // materialComposition.{material} field
  if (field.startsWith('materialComposition.')) {
    const mat = field.split('.')[1];
    actual = ctx.materialComposition?.[mat] ?? null;
  }
  // weightKg
  else if (field === 'weightKg') {
    actual = ctx.weightKg ?? null;
  }
  // priceUsd
  else if (field === 'priceUsd') {
    actual = ctx.priceUsd ?? null;
  }

  // If we can't resolve the field, no match
  if (actual === null) {
    return { matched: false, adValorem: null, reason: `field ${field} not available in context` };
  }

  const condMet = compare(actual, op, value);

  if (condMet) {
    const thenBlock = r.then as Record<string, unknown> | undefined;
    return {
      matched: true,
      adValorem: thenBlock?.ad_valorem != null ? Number(thenBlock.ad_valorem) : null,
      reason: `${field} ${op} ${value} → true (actual: ${actual})`,
    };
  }

  // else branch
  const elseBlock = r.else as Record<string, unknown> | undefined;
  if (elseBlock) {
    return {
      matched: true,
      adValorem: elseBlock.ad_valorem != null ? Number(elseBlock.ad_valorem) : null,
      reason: `${field} ${op} ${value} → false (actual: ${actual}), else branch`,
    };
  }

  return { matched: false, adValorem: null, reason: `${field} ${op} ${value} → false, no else` };
}

function compare(a: number, op: string, b: number): boolean {
  switch (op) {
    case '>=': return a >= b;
    case '>':  return a > b;
    case '<=': return a <= b;
    case '<':  return a < b;
    case '==': return a === b;
    case '!=': return a !== b;
    default:   return false;
  }
}
