#!/usr/bin/env python3
"""
Layer 2 v7 — Code Intersection + LLM Selection
Phase 0: Load codified keywords from Layer 1
Phase 1: Keywordize 632 products
Phase 2: Code intersection → category candidates
Phase 3: Code intersection → material candidates
Phase 4: LLM selects from candidates
Phase 5: Description matching (optional)
Phase 6: Layer 1 benchmark
"""
import json, re, time, os, sys, urllib.request
from collections import Counter

BASE = '/Volumes/soulmaten/POTAL/7field_benchmark'

# ═══ Phase 0: Load codified keywords ═══
print('═══ Phase 0: Load codified keywords ═══')
kw_sets = json.load(open('/tmp/v7_keyword_sets.json'))

chapter_keywords = {int(k): set(v) for k, v in kw_sets['chapter_keywords'].items()}
material_keyword_sets = {k: set(v) for k, v in kw_sets['material_keyword_sets'].items()}
material_to_section = kw_sets.get('material_to_section', {})

print(f'  Chapters: {len(chapter_keywords)}, Materials: {len(material_keyword_sets)}')

# Chapter descriptions for LLM prompt
ch_desc = json.load(open('/tmp/layer1_codified_keywords.json'))['chapter_descriptions']

# ═══ Phase 1: Load & keywordize 632 products ═══
print('\n═══ Phase 1: Keywordize 632 products ═══')
raw = json.load(open(f'{BASE}/hscodecomp_raw.json'))
print(f'  Loaded {len(raw)} items')

STOPWORDS = {'and','the','of','or','for','in','to','not','a','an','with','by','on','at',
             'their','from','other','than','its','all','into','that','this','which','these',
             'those','been','being','such','any','each','only','also','but','nor','yet','so',
             'both','either','neither','new','hot','sale','free','shipping','high','quality',
             'fashion','style','women','men','size','color','pcs','set','wholesale','drop',
             'brand','gift','diy','2024','2025','2026','piece','pieces','pack','lot','item',
             'items','1pc','2pcs','3pcs','5pcs','10pcs','100pcs'}

def clean_and_split(text):
    """Extract meaningful words from text"""
    if not text:
        return set()
    words = set()
    for w in re.findall(r'[a-zA-Z][a-zA-Z0-9-]*', text.lower()):
        if len(w) > 2 and w not in STOPWORDS:
            words.add(w)
    return words

def parse_attrs(s):
    """Parse product_attributes JSON string"""
    try:
        return json.loads(s) if s else {}
    except:
        r = {}
        for m in re.finditer(r'"([^"]+)"\s*:\s*"([^"]*?)"', s or ''):
            r[m.group(1)] = m.group(2)
        return r

products = []
for i, item in enumerate(raw):
    keywords = set()

    # product_name
    name = item.get('product_name', '')
    keywords.update(clean_and_split(name))

    # product_attributes
    attrs = parse_attrs(item.get('product_attributes', '{}'))
    for k, v in attrs.items():
        keywords.update(clean_and_split(str(k)))
        keywords.update(clean_and_split(str(v)))

    # category 5 levels
    cats = []
    for j in range(1, 6):
        c = item.get(f'cate_lv{j}_desc', '')
        if c:
            cats.append(c)
            keywords.update(clean_and_split(c))

    hs_full = str(item.get('hs_code', '')).zfill(10)

    products.append({
        'idx': i,
        'product_name': name,
        'keywords': keywords,
        'keyword_count': len(keywords),
        'attrs': attrs,
        'category_full': ' > '.join(cats),
        'verified_chapter': int(hs_full[:2]),
        'verified_hs6': hs_full[:6],
        'verified_hs_full': hs_full,
    })

avg_kw = sum(p['keyword_count'] for p in products) / len(products)
print(f'  Average keywords per product: {avg_kw:.1f}')

# ═══ Phase 2: Category candidates (code intersection) ═══
print('\n═══ Phase 2: Category candidates (code intersection) ═══')

for p in products:
    candidates = []
    for ch, ch_kws in chapter_keywords.items():
        intersection = p['keywords'] & ch_kws
        if intersection:
            candidates.append({
                'chapter': ch,
                'matched': list(intersection)[:10],
                'count': len(intersection),
            })
    candidates.sort(key=lambda x: x['count'], reverse=True)
    p['cat_candidates'] = candidates[:10]  # top 10
    p['cat_candidate_count'] = len(candidates)

# Stats
has_candidates = sum(1 for p in products if p['cat_candidates'])
has_correct = sum(1 for p in products if any(c['chapter'] == p['verified_chapter'] for c in p['cat_candidates']))
avg_candidates = sum(p['cat_candidate_count'] for p in products) / len(products)
avg_top10 = sum(len(p['cat_candidates']) for p in products) / len(products)

print(f'  Products with ≥1 candidate: {has_candidates}/{len(products)} ({has_candidates*100//len(products)}%)')
print(f'  Correct chapter in top-10 candidates: {has_correct}/{len(products)} ({has_correct*100//len(products)}%)')
print(f'  Average total candidates: {avg_candidates:.1f}, top-10: {avg_top10:.1f}')

# Check correct chapter rank
rank_dist = Counter()
for p in products:
    found = False
    for rank, c in enumerate(p['cat_candidates'], 1):
        if c['chapter'] == p['verified_chapter']:
            rank_dist[rank] = rank_dist.get(rank, 0) + 1
            found = True
            break
    if not found:
        rank_dist['not_in_top10'] = rank_dist.get('not_in_top10', 0) + 1

print(f'  Correct chapter rank distribution:')
for r in range(1, 6):
    print(f'    Rank {r}: {rank_dist.get(r, 0)}')
print(f'    Not in top 10: {rank_dist.get("not_in_top10", 0)}')

# ═══ Phase 3: Material candidates (code intersection) ═══
print('\n═══ Phase 3: Material candidates (code intersection) ═══')

for p in products:
    mat_candidates = []
    for mat, mat_kws in material_keyword_sets.items():
        intersection = p['keywords'] & mat_kws
        if intersection:
            mat_candidates.append({
                'material': mat,
                'matched': list(intersection)[:5],
                'count': len(intersection),
            })
    mat_candidates.sort(key=lambda x: x['count'], reverse=True)
    p['mat_candidates'] = mat_candidates[:10]

has_mat = sum(1 for p in products if p['mat_candidates'])
print(f'  Products with ≥1 material candidate: {has_mat}/{len(products)} ({has_mat*100//len(products)}%)')

# ═══ Phase 4: LLM Selection ═══
print('\n═══ Phase 4: LLM Selection (GPT-4o-mini) ═══')

OPENAI_KEY = open('/Users/maegbug/portal/.env.local').read().split('OPENAI_API_KEY=')[1].split('\n')[0].strip()

def call_gpt(prompt, max_tokens=200):
    body = json.dumps({
        "model": "gpt-4o-mini",
        "messages": [
            {"role": "system", "content": "You are an HS Code classification expert. Select the best category and material from the given candidates based on the product name. Return JSON only."},
            {"role": "user", "content": prompt}
        ],
        "temperature": 0,
        "max_tokens": max_tokens,
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

errors = 0
for i, p in enumerate(products):
    # Build prompt
    cat_list = []
    for c in p['cat_candidates'][:7]:
        desc = ch_desc.get(str(c['chapter']), '')
        cat_list.append(f"  Ch.{c['chapter']} ({desc[:60]}) — matched: {', '.join(c['matched'][:5])}")

    mat_list = []
    for m in p['mat_candidates'][:7]:
        mat_list.append(f"  {m['material']} — matched: {', '.join(m['matched'][:3])}")

    if not cat_list:
        cat_list = ["  (no candidates found)"]
    if not mat_list:
        mat_list = ["  (no candidates found)"]

    prompt = f"""Read this product name and understand what it is. Then select the best category and material from the candidates.

Product name: {p['product_name'][:200]}

Category candidates (by keyword overlap):
{chr(10).join(cat_list)}

Material candidates (by keyword overlap):
{chr(10).join(mat_list)}

Select the best match. If none fit, use "none".
Return JSON: {{"category": "Ch.XX", "material": "xxx"}}"""

    result = call_gpt(prompt)

    if result:
        p['llm_category'] = result.get('category', 'none')
        p['llm_material'] = result.get('material', 'none')

        # Parse chapter number
        cat_str = str(p['llm_category'])
        ch_match = re.search(r'(\d+)', cat_str)
        p['llm_chapter'] = int(ch_match.group(1)) if ch_match else 0
    else:
        p['llm_category'] = 'error'
        p['llm_material'] = 'error'
        p['llm_chapter'] = 0
        errors += 1

    if (i + 1) % 50 == 0:
        correct_so_far = sum(1 for pp in products[:i+1] if pp.get('llm_chapter') == pp['verified_chapter'])
        print(f'  {i+1}/632 (errors: {errors}, chapter_correct: {correct_so_far}/{i+1})')

    time.sleep(0.3)

print(f'  Done: {errors} LLM errors')

# ═══ Phase 5: Description matching (skip for now — focus on category/material) ═══
# Description matching adds +2% and is less critical than category/material accuracy

# ═══ Phase 6: Benchmark ═══
print('\n═══ Phase 6: Benchmark Results ═══')

# Chapter accuracy
ch_correct = sum(1 for p in products if p.get('llm_chapter') == p['verified_chapter'])
ch_pct = ch_correct * 100 // len(products)

# Section accuracy (derive from chapter)
def ch_to_section(ch):
    if ch <= 5: return 1
    if ch <= 14: return 2
    if ch == 15: return 3
    if ch <= 24: return 4
    if ch <= 27: return 5
    if ch <= 38: return 6
    if ch <= 40: return 7
    if ch <= 43: return 8
    if ch <= 46: return 9
    if ch <= 49: return 10
    if ch <= 63: return 11
    if ch <= 67: return 12
    if ch <= 70: return 13
    if ch == 71: return 14
    if ch <= 83: return 15
    if ch <= 85: return 16
    if ch <= 89: return 17
    if ch <= 92: return 18
    if ch == 93: return 19
    if ch <= 96: return 20
    return 21

sec_correct = sum(1 for p in products if ch_to_section(p.get('llm_chapter',0)) == ch_to_section(p['verified_chapter']))
sec_pct = sec_correct * 100 // len(products)

# Material validity (check if selected material is in MATERIAL_KEYWORDS)
mat_valid = sum(1 for p in products if p.get('llm_material','') in material_keyword_sets)
mat_valid_pct = mat_valid * 100 // len(products)

print(f'  Section: {sec_correct}/{len(products)} ({sec_pct}%)')
print(f'  Chapter: {ch_correct}/{len(products)} ({ch_pct}%)')
print(f'  Material valid: {mat_valid}/{len(products)} ({mat_valid_pct}%)')

# ═══ Phase 7: Analysis ═══
print('\n═══ Phase 7: Analysis ═══')

# Was correct chapter in candidates?
correct_in_candidates = sum(1 for p in products if any(c['chapter'] == p['verified_chapter'] for c in p['cat_candidates']))
llm_picked_correct = ch_correct
correct_in_but_llm_missed = sum(1 for p in products
    if any(c['chapter'] == p['verified_chapter'] for c in p['cat_candidates'])
    and p.get('llm_chapter') != p['verified_chapter'])
not_in_candidates = len(products) - correct_in_candidates

print(f'  Correct chapter in top-10 candidates: {correct_in_candidates}/{len(products)} ({correct_in_candidates*100//len(products)}%)')
print(f'  LLM picked correct from candidates: {llm_picked_correct}/{len(products)} ({llm_picked_correct*100//len(products)}%)')
print(f'  Correct in candidates but LLM missed: {correct_in_but_llm_missed}')
print(f'  Correct NOT in candidates (code limit): {not_in_candidates}')

# Comparison table
print('\n═══ Comparison Table ═══')
print(f'{"Scenario":<25} {"Section":<12} {"Chapter":<12}')
print(f'{"B (simple map)":<25} {"56%":<12} {"43%":<12}')
print(f'{"D (LLM v2 material)":<25} {"57%":<12} {"46%":<12}')
print(f'{"H (LLM v6 raw text)":<25} {"65%":<12} {"43%":<12}')
print(f'{"I (v7 intersection)":<25} {f"{sec_pct}%":<12} {f"{ch_pct}%":<12}')

# Save results
results = {
    'v7_stats': {
        'section_correct': sec_correct, 'section_pct': sec_pct,
        'chapter_correct': ch_correct, 'chapter_pct': ch_pct,
        'material_valid': mat_valid, 'material_valid_pct': mat_valid_pct,
        'correct_in_candidates': correct_in_candidates,
        'correct_in_candidates_pct': correct_in_candidates * 100 // len(products),
        'llm_picked_correct': llm_picked_correct,
        'correct_in_but_missed': correct_in_but_llm_missed,
        'not_in_candidates': not_in_candidates,
        'errors': errors,
    },
    'items': [{
        'idx': p['idx'],
        'product_name': p['product_name'][:200],
        'keyword_count': p['keyword_count'],
        'cat_candidate_count': p['cat_candidate_count'],
        'cat_candidates_top5': [{'ch': c['chapter'], 'count': c['count'], 'matched': c['matched'][:5]} for c in p['cat_candidates'][:5]],
        'mat_candidates_top3': [{'mat': m['material'], 'count': m['count'], 'matched': m['matched'][:3]} for m in p['mat_candidates'][:3]],
        'llm_category': p.get('llm_category',''),
        'llm_chapter': p.get('llm_chapter', 0),
        'llm_material': p.get('llm_material',''),
        'verified_chapter': p['verified_chapter'],
        'verified_hs6': p['verified_hs6'],
        'chapter_correct': p.get('llm_chapter') == p['verified_chapter'],
        'correct_in_candidates': any(c['chapter'] == p['verified_chapter'] for c in p['cat_candidates']),
        'category_full': p['category_full'],
    } for p in products],
}

json.dump(results, open(f'{BASE}/hscodecomp_layer2_v7_results.json', 'w'), ensure_ascii=False, indent=2)
print(f'\n✅ Saved: {BASE}/hscodecomp_layer2_v7_results.json')
PYEOF
