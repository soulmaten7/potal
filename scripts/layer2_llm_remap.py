#!/usr/bin/env python3
"""
Layer 2: LLM keyword→9-field mapping + HSCodeComp 632 benchmark
Phase 1: Extract keywords from all fields
Phase 2: GPT-4o-mini maps keywords to 9-field
Phase 3: Run Layer 1 pipeline benchmark
"""
import json, re, time, os, sys

BASE = '/Volumes/soulmaten/POTAL/7field_benchmark'

# Load data
data = json.load(open(f'{BASE}/hscodecomp_raw.json'))
print(f'Loaded {len(data)} items')

# ═══ Phase 1: Keyword extraction ═══
print('\n═══ Phase 1: Keyword Extraction ═══')

def parse_attrs(s):
    try: return json.loads(s)
    except:
        r = {}
        for m in re.finditer(r'"([^"]+)"\s*:\s*"([^"]*?)"', s or ''):
            r[m.group(1)] = m.group(2)
        return r

def extract_keywords(item):
    result = {}
    name = item.get('product_name', '')
    result['product_name'] = name

    attrs = parse_attrs(item.get('product_attributes', '{}'))
    # Key attributes only (not package dimensions etc)
    important_attrs = {}
    for k in ['Material', 'material', 'Origin', 'Gender', 'Metals Type', 'Fabric Type',
              'Main Material', 'Type', 'Style', 'Item Type', 'Fine or Fashion',
              'Craft of Weaving', 'Pattern Type', 'Department Name', 'Size', 'Color',
              'Certification', 'Model Number', 'Brand Name']:
        if attrs.get(k):
            important_attrs[k] = attrs[k]
    result['attributes'] = important_attrs

    cats = []
    for i in range(1, 6):
        c = item.get(f'cate_lv{i}_desc', '')
        if c: cats.append(c)
    result['category'] = ' > '.join(cats)

    if item.get('price'):
        result['price'] = str(item['price'])
        result['currency'] = item.get('currency_code', '')

    return result

# ═══ Phase 2: LLM Mapping ═══
print('\n═══ Phase 2: LLM 9-field Mapping ═══')

OPENAI_KEY = open('.env.local').read().split('OPENAI_API_KEY=')[1].split('\n')[0].strip()

SYSTEM_PROMPT = """You are an HS Code classification expert. Map product keywords to exactly 9 fields for customs classification.

FIELDS:
1. product_name: Core product name only (nouns). NOT adjectives/brands. Examples: "pendant necklace", "t-shirt", "water bottle"
2. material: Primary material for HS Section determination. Use standard terms: cotton, polyester, silk, wool, leather, steel, iron, aluminum, copper, glass, ceramic, plastic, rubber, wood, paper, gold, silver, alloy. NOT adjectives like "high-quality".
3. origin_country: ISO 2-letter code. "Mainland China"→"CN", "India"→"IN"
4. category: Most specific product category. Example: "jewelry > pendants", "clothing > t-shirts"
5. description: Features, use, characteristics. Adjectives and descriptors go here.
6. processing: Manufacturing method: knitted, woven, forged, cast, molded, plated, roasted
7. composition: Material ratios: "95% cotton 5% elastane", "18K gold plated"
8. weight_spec: Weight, size, dimensions
9. price: Price in USD (number or null)

RULES:
- Extract ONLY what's explicitly in the data. Don't guess.
- material must be a standard material term, not an adjective
- product_name = what the product IS (2-4 words max)
- Everything else goes to description
- Return JSON only."""

import urllib.request

def call_gpt(product_info):
    body = json.dumps({
        "model": "gpt-4o-mini",
        "messages": [
            {"role": "system", "content": SYSTEM_PROMPT},
            {"role": "user", "content": f"Map to 9 fields:\n{json.dumps(product_info, ensure_ascii=False)}"}
        ],
        "temperature": 0,
        "max_tokens": 300,
        "response_format": {"type": "json_object"}
    }).encode()

    req = urllib.request.Request('https://api.openai.com/v1/chat/completions',
        data=body,
        headers={'Authorization': f'Bearer {OPENAI_KEY}', 'Content-Type': 'application/json'})

    try:
        with urllib.request.urlopen(req, timeout=30) as resp:
            result = json.loads(resp.read())
            content = result['choices'][0]['message']['content']
            return json.loads(content)
    except Exception as e:
        return None

# Process all 632 items
llm_mapped = []
errors = 0
for i, item in enumerate(data):
    keywords = extract_keywords(item)
    result = call_gpt(keywords)

    if result:
        # Add ground truth
        hs_full = str(item.get('hs_code', '')).zfill(10)
        result['verified_hs6'] = hs_full[:6]
        result['verified_hs_full'] = hs_full
        result['verified_chapter'] = int(hs_full[:2])
        llm_mapped.append(result)
    else:
        errors += 1
        # Fallback: basic mapping
        attrs = parse_attrs(item.get('product_attributes', '{}'))
        hs_full = str(item.get('hs_code', '')).zfill(10)
        llm_mapped.append({
            'product_name': item.get('product_name', ''),
            'material': attrs.get('Material', '') or attrs.get('Metals Type', ''),
            'origin_country': 'CN',
            'category': ' > '.join(item.get(f'cate_lv{j}_desc', '') for j in range(1, 4)),
            'description': '', 'processing': '', 'composition': '', 'weight_spec': '',
            'price': float(item['price']) / 7.2 if item.get('price') and item.get('currency_code') == 'CNY' else (float(item['price']) if item.get('price') else None),
            'verified_hs6': hs_full[:6], 'verified_hs_full': hs_full, 'verified_chapter': int(hs_full[:2]),
        })

    if (i + 1) % 50 == 0:
        print(f'  {i+1}/632 (errors: {errors})')
    time.sleep(0.3)

print(f'  Done: {len(llm_mapped)} mapped, {errors} LLM errors (fallback used)')

# Save
json.dump(llm_mapped, open(f'{BASE}/hscodecomp_layer2_llm_mapped.json', 'w'), ensure_ascii=False, indent=2)

# Field fill rates
print('\n=== LLM Mapped Field Rates ===')
fields9 = ['product_name', 'material', 'origin_country', 'category', 'description', 'processing', 'composition', 'weight_spec', 'price']
for f in fields9:
    filled = sum(1 for m in llm_mapped if m.get(f) and str(m[f]).strip() and m[f] != 'null' and m[f] is not None)
    print(f'  {f}: {filled}/{len(llm_mapped)} ({filled*100//len(llm_mapped)}%)')

# Compare with previous simple mapping
prev = json.load(open(f'{BASE}/hscodecomp_9field_mapped.json'))
print('\n=== Field Rate Comparison ===')
print(f'{"Field":<15} {"Simple":>8} {"LLM":>8}')
for f in fields9:
    s_cnt = sum(1 for m in prev if m.get(f) and str(m[f]).strip() and m[f] != 0)
    l_cnt = sum(1 for m in llm_mapped if m.get(f) and str(m[f]).strip() and m[f] != 'null' and m[f] is not None)
    print(f'{f:<15} {s_cnt:>8} {l_cnt:>8}')

print(f'\n✅ Saved: {BASE}/hscodecomp_layer2_llm_mapped.json')
