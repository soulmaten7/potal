/**
 * Step 0.5 — GPT-4o-mini 기반 9-Field 자동 추출
 *
 * 어떤 플랫폼에서 어떤 형식으로 데이터가 오든,
 * 9field_reference.json을 참조해서 POTAL 9-field로 변환.
 *
 * 입력: 플랫폼에서 온 상품 데이터 (필드 구조 불명)
 * 출력: ClassifyInputV3 형식의 9-field JSON
 */

import { callLLM } from '../../utils/llm-call';
import type { ClassifyInputV3 } from '../../types';
// Load reference data (lazy — only when step 0.5 is used)
// Vercel serverless compatible — no fs
let _referenceData: string | null = null;

function getReferenceData(): string {
  if (_referenceData) return _referenceData;

  try {
    // eslint-disable-next-line @typescript-eslint/no-var-requires
    const data = require('../../data/9field_reference.json');

    // Build a compact reference string for the prompt
    // Focus on the most useful parts for field extraction
    const compact: any = {
      material_keywords: data.material_keywords?.data || {},
      processing_keywords: data.processing_keywords?.data || [],
      category_to_section: Object.keys(data.category_to_section?.data || {}),
      keyword_to_headings: Object.keys(data.keyword_to_headings?.data || {}),
    };

    _referenceData = JSON.stringify(compact);
    return _referenceData;
  } catch {
    // Fallback: inline minimal reference
    _referenceData = JSON.stringify({
      material_keywords: {
        leather: ['leather','cowhide','calfskin'],
        cotton: ['cotton','denim','canvas'],
        polyester: ['polyester','pet'],
        silk: ['silk','charmeuse'],
        wool: ['wool','merino','cashmere'],
        steel: ['steel','stainless steel'],
        aluminum: ['aluminum','aluminium'],
        plastic: ['plastic','pvc','polypropylene','abs','acrylic'],
        rubber: ['rubber','latex','silicone','neoprene'],
        wood: ['wood','bamboo','plywood','oak','pine'],
        glass: ['glass','tempered glass','crystal'],
        ceramic: ['ceramic','porcelain','stoneware'],
      },
      processing_keywords: ['raw','frozen','dried','knitted','woven','forged','cast','machined','molded','assembled','polished','roasted'],
    });
    return _referenceData;
  }
}

const SYSTEM_PROMPT = `You are an HS Code classification expert. Extract product information into exactly 9 fields.

FIELDS:
1. product_name: Product's name/title (what it IS)
2. material: Primary material/substance (e.g., cotton, steel, leather, plastic, glass, ceramic, rubber, wood)
3. category: Product category for HS classification (e.g., clothing, footwear, kitchenware, electronics, toys, jewelry)
4. description: Product features, function, intended use
5. processing: Manufacturing/processing state (e.g., knitted, woven, forged, frozen, roasted, molded)
6. composition: Material composition with percentages (e.g., "80% cotton, 20% polyester")
7. weight_spec: Weight, dimensions, size specifications
8. price: Price/value
9. origin_country: Country of origin/manufacture (ISO 2-letter code if possible)

RULES:
- Extract ONLY what is explicitly stated in the data
- Do NOT guess or infer — if not present, use null
- If one field contains multiple types of info, split into correct fields
- Translate any language to English
- Return JSON only with these 9 keys`;

export interface ExtractedFields {
  product_name: string | null;
  material: string | null;
  category: string | null;
  description: string | null;
  processing: string | null;
  composition: string | null;
  weight_spec: string | null;
  price: string | null;
  origin_country: string | null;
}

/**
 * Extract 9 fields from any platform data using GPT-4o-mini
 */
export async function extractNineFields(
  platformData: Record<string, any>
): Promise<ExtractedFields> {
  const refData = getReferenceData();

  const userPrompt = `Reference material keywords for HS classification:
${refData}

Extract 9 fields from this product data:
${JSON.stringify(platformData)}`;

  const result = await callLLM<ExtractedFields>({
    systemPrompt: SYSTEM_PROMPT,
    userPrompt,
    maxTokens: 500,
    temperature: 0,
    timeoutMs: 30000,
  });

  if (result.data) {
    return result.data;
  }

  // Fallback: return what we can parse from the raw data
  return fallbackExtract(platformData);
}

/**
 * Convert ExtractedFields to ClassifyInputV3
 */
export function toClassifyInput(extracted: ExtractedFields): ClassifyInputV3 {
  return {
    product_name: extracted.product_name || 'unknown product',
    material: extracted.material || '',
    origin_country: extracted.origin_country || '',
    category: extracted.category || '',
    description: extracted.description || '',
    processing: extracted.processing || '',
    composition: extracted.composition || '',
    weight_spec: extracted.weight_spec || '',
    price: extracted.price ? parseFloat(extracted.price) || undefined : undefined,
  };
}

/**
 * Fallback extraction without LLM — basic field name matching
 */
function fallbackExtract(data: Record<string, any>): ExtractedFields {
  const result: ExtractedFields = {
    product_name: null, material: null, category: null, description: null,
    processing: null, composition: null, weight_spec: null, price: null, origin_country: null,
  };

  // Common field name patterns
  const nameKeys = ['product_name', 'title', 'name', 'item_name', 'subject', '商品名称', '品名', 'productName'];
  const materialKeys = ['material', 'Material', '材质', '材料', '面料', 'fabric_type', 'outer_material_type'];
  const categoryKeys = ['category', 'product_type', 'item_type', 'cate_lv1_desc', '类目', 'categoryName'];
  const descKeys = ['description', 'body_html', 'detail', '商品描述', '规格型号', 'product_description'];
  const weightKeys = ['weight', 'item_weight', 'gross_weight', '重量', 'package_weight'];
  const priceKeys = ['price', 'salePrice', 'standard_price', '价格', 'regular_price'];
  const originKeys = ['origin_country', 'country_of_origin', 'Origin', '原产地', '产地', 'originAreaCode'];

  for (const [key, val] of Object.entries(data)) {
    if (val == null || val === '') continue;
    const strVal = typeof val === 'object' ? JSON.stringify(val) : String(val);
    const keyLower = key.toLowerCase();

    if (!result.product_name && nameKeys.some(k => keyLower.includes(k.toLowerCase()))) result.product_name = strVal;
    if (!result.material && materialKeys.some(k => key === k || keyLower === k.toLowerCase())) result.material = strVal;
    if (!result.category && categoryKeys.some(k => keyLower.includes(k.toLowerCase()))) result.category = strVal;
    if (!result.description && descKeys.some(k => keyLower.includes(k.toLowerCase()))) result.description = strVal;
    if (!result.weight_spec && weightKeys.some(k => keyLower.includes(k.toLowerCase()))) result.weight_spec = strVal;
    if (!result.price && priceKeys.some(k => keyLower.includes(k.toLowerCase()))) result.price = strVal;
    if (!result.origin_country && originKeys.some(k => key === k || keyLower === k.toLowerCase())) result.origin_country = strVal;
  }

  // Check nested product_attributes (AliExpress pattern)
  if (data.product_attributes) {
    const attrs = typeof data.product_attributes === 'string'
      ? (() => { try { return JSON.parse(data.product_attributes); } catch { return {}; } })()
      : data.product_attributes;

    if (!result.material) {
      for (const k of materialKeys) {
        if (attrs[k]) { result.material = String(attrs[k]); break; }
      }
    }
    if (!result.origin_country) {
      for (const k of originKeys) {
        if (attrs[k]) {
          const v = String(attrs[k]);
          if (v.includes('China') || v.includes('中国')) result.origin_country = 'CN';
          else result.origin_country = v;
          break;
        }
      }
    }
  }

  // Build category from cate_lv fields (AliExpress pattern)
  if (!result.category && data.cate_lv1_desc) {
    result.category = [data.cate_lv1_desc, data.cate_lv2_desc, data.cate_lv3_desc]
      .filter(Boolean).join(' > ');
  }

  return result;
}
