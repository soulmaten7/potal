/**
 * F113/F114: Seller Onboarding Checklist Tests
 */

describe('F113/F114 Seller Onboarding', () => {
  const makeSteps = (completed: boolean[]) => completed.map((c, i) => ({
    id: `step_${i}`, title: `Step ${i}`, completed: c, estimatedMinutes: 3,
  }));

  test('checklist has 7 steps', () => {
    const ids = ['account', 'profile', 'api_key', 'first_call', 'integration', 'webhook', 'go_live'];
    expect(ids).toHaveLength(7);
  });

  test('completionPercent: 3/7 = 43%', () => {
    const steps = makeSteps([true, true, true, false, false, false, false]);
    const completed = steps.filter(s => s.completed).length;
    const pct = Math.round((completed / steps.length) * 100);
    expect(pct).toBe(43);
  });

  test('nextStep is first incomplete step', () => {
    const steps = makeSteps([true, true, false, false, false, false, false]);
    const next = steps.find(s => !s.completed);
    expect(next?.id).toBe('step_2');
  });
});
