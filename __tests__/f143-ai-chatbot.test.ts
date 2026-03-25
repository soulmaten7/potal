/**
 * F143: AI Chatbot + Support — Test Suite
 * Tests: chat route, FAQ matching, feedback, utilities
 */

// ─── Chat route unit tests (function-level) ──────────

describe('F143: Support Chat', () => {
  test('message required — empty string rejected', async () => {
    const { POST } = await import('@/app/api/v1/support/chat/route');
    const req = new Request('http://localhost/api/v1/support/chat', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ message: '' }),
    });
    const res = await POST(req as never);
    expect(res.status).toBe(400);
  });

  test('message over 2000 chars — rejected', async () => {
    const { POST } = await import('@/app/api/v1/support/chat/route');
    const req = new Request('http://localhost/api/v1/support/chat', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ message: 'a'.repeat(2001) }),
    });
    const res = await POST(req as never);
    expect(res.status).toBe(400);
  });

  test('invalid JSON — returns 400', async () => {
    const { POST } = await import('@/app/api/v1/support/chat/route');
    const req = new Request('http://localhost/api/v1/support/chat', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: 'not json',
    });
    const res = await POST(req as never);
    expect(res.status).toBe(400);
  });

  test('messages history array is accepted', async () => {
    const { POST } = await import('@/app/api/v1/support/chat/route');
    const req = new Request('http://localhost/api/v1/support/chat', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        message: 'What is POTAL?',
        messages: [
          { role: 'user', content: 'Hello' },
          { role: 'assistant', content: 'Hi!' },
        ],
      }),
    });
    // Won't error on messages array parsing
    const res = await POST(req as never);
    expect([200, 429]).toContain(res.status);
  });
});

// ─── FAQ Support tests ──────────────────────────────

describe('F143: FAQ Support', () => {
  test('pricing question — matches pricing FAQ', async () => {
    const { POST } = await import('@/app/api/v1/support/route');
    const req = new Request('http://localhost/api/v1/support', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ question: 'What are the pricing plans?' }),
    });
    const res = await POST(req as never);
    const data = await res.json();
    expect(data.success).toBe(true);
    expect(data.data.answered).toBe(true);
    expect(data.data.category).toBe('pricing');
    expect(data.data.faqId).toBe('pricing');
  });

  test('API key question — matches api-key FAQ', async () => {
    const { POST } = await import('@/app/api/v1/support/route');
    const req = new Request('http://localhost/api/v1/support', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ question: 'How do I get an API key for authentication?' }),
    });
    const res = await POST(req as never);
    const data = await res.json();
    expect(data.data.answered).toBe(true);
  });

  test('nonsense input — matched: false with suggestions', async () => {
    const { POST } = await import('@/app/api/v1/support/route');
    const req = new Request('http://localhost/api/v1/support', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ question: 'asdfghjklzxcvbnm' }),
    });
    const res = await POST(req as never);
    const data = await res.json();
    expect(data.data.answered).toBe(false);
    expect(data.data.matched).toBe(false);
    expect(data.data).toHaveProperty('suggestions');
  });

  test('Korean language — returns Korean answer', async () => {
    const { POST } = await import('@/app/api/v1/support/route');
    const req = new Request('http://localhost/api/v1/support', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ question: '가격 요금제 알려주세요', language: 'ko' }),
    });
    const res = await POST(req as never);
    const data = await res.json();
    expect(data.data.answered).toBe(true);
    expect(data.data.language).toBe('ko');
  });

  test('free plan context + pricing — includes upgrade hint', async () => {
    const { POST } = await import('@/app/api/v1/support/route');
    const req = new Request('http://localhost/api/v1/support', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        question: 'What are the pricing plans?',
        context: { plan: 'free' },
      }),
    });
    const res = await POST(req as never);
    const data = await res.json();
    expect(data.data.answer).toContain('Upgrade');
  });

  test('empty question — returns 400', async () => {
    const { POST } = await import('@/app/api/v1/support/route');
    const req = new Request('http://localhost/api/v1/support', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ question: '' }),
    });
    const res = await POST(req as never);
    expect(res.status).toBe(400);
  });

  test('batch API question — matches batch FAQ', async () => {
    const { POST } = await import('@/app/api/v1/support/route');
    const req = new Request('http://localhost/api/v1/support', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ question: 'How does the batch API work for bulk calculations?' }),
    });
    const res = await POST(req as never);
    const data = await res.json();
    expect(data.data.answered).toBe(true);
    expect(data.data.faqId).toBe('batch');
  });

  test('sandbox question — matches sandbox FAQ', async () => {
    const { POST } = await import('@/app/api/v1/support/route');
    const req = new Request('http://localhost/api/v1/support', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ question: 'Is there a sandbox for testing?' }),
    });
    const res = await POST(req as never);
    const data = await res.json();
    expect(data.data.answered).toBe(true);
    expect(data.data.faqId).toBe('sandbox');
  });

  test('25 FAQs exist', async () => {
    // Import the module to check FAQ count via GET
    const { GET } = await import('@/app/api/v1/support/route');
    const res = await GET();
    const data = await res.json();
    expect(data.faqCount).toBeGreaterThanOrEqual(25);
  });
});

// ─── Feedback endpoint tests ────────────────────────

describe('F143: Chat Feedback', () => {
  test('missing log_id — returns 400', async () => {
    const { POST } = await import('@/app/api/v1/support/chat/feedback/route');
    const req = new Request('http://localhost/api/v1/support/chat/feedback', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ rating: 'helpful' }),
    });
    const res = await POST(req as never);
    expect(res.status).toBe(400);
  });

  test('invalid rating — returns 400', async () => {
    const { POST } = await import('@/app/api/v1/support/chat/feedback/route');
    const req = new Request('http://localhost/api/v1/support/chat/feedback', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ log_id: 'test-id', rating: 'invalid' }),
    });
    const res = await POST(req as never);
    expect(res.status).toBe(400);
  });
});
