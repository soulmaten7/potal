import OpenAI from 'openai';
import type { Product } from '@/app/types/product';

const client = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

/** Input minification: id, name, price, site only (token saving) */
function toMinifiedItems(products: Product[]): { id: string; name: string; price: string; site: string }[] {
  return products.map((p) => ({
    id: p.id,
    name: p.name ?? '',
    price: String(p.price ?? ''),
    site: p.site ?? '',
  }));
}

const SYSTEM_PROMPT_TEMPLATE = (query: string) =>
  `You are a strict shopping assistant. The user is searching for '${query}'. Filter out accessories (cases, stands, cables), parts, or irrelevant items from the list.
Return ONLY a JSON object with a key 'validIds' containing the array of IDs for the MAIN products that match the user's search intent. No explanation, no markdown.`;

const AI_FILTER_TIMEOUT_MS = 2000;

/**
 * AI Shopping Agent: filters products to keep only main/relevant items (e.g. remove $2 cases, earpads when searching "Sony Headphone").
 * Time-boxed: 2s timeout → skip filter and return original. Fail-safe: on API error, returns original list.
 */
export async function filterProducts(query: string, products: Product[]): Promise<Product[]> {
  if (!query?.trim() || !products.length) {
    return products;
  }

  const minified = toMinifiedItems(products);
  const listJson = JSON.stringify(minified);

  const aiCall = client.chat.completions.create({
    model: 'gpt-4o-mini',
    temperature: 0,
    messages: [
      { role: 'system', content: SYSTEM_PROMPT_TEMPLATE(query.trim()) },
      { role: 'user', content: `Product list:\n${listJson}` },
    ],
  });

  const timeoutPromise = new Promise<never>((_, reject) => {
    setTimeout(() => reject(new Error('Timeout')), AI_FILTER_TIMEOUT_MS);
  });

  try {
    const completion = await Promise.race([aiCall, timeoutPromise]);

    const raw = completion.choices[0]?.message?.content?.trim();
    if (!raw) {
      return products;
    }

    const parsed = JSON.parse(raw) as { validIds?: string[] };
    const validIds = Array.isArray(parsed?.validIds) ? new Set(parsed.validIds) : null;
    if (!validIds || validIds.size === 0) {
      return products;
    }

    return products.filter((p) => validIds.has(p.id));
  } catch (err) {
    if (err instanceof Error && err.message === 'Timeout') {
      // AI Filter Timeout - return original products
    } else {
      console.error('AIFilterService.filterProducts failed, returning original list.', err);
    }
    return products;
  }
}
