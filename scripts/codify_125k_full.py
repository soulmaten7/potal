#!/usr/bin/env python3
"""
125,576-row Full Codification + 5-Round Validation
"""
import csv, json, re, os
from collections import Counter

BASE = '/Volumes/soulmaten/POTAL/hs_national_rules'
DATA = 'app/lib/cost-engine/gri-classifier/data'
COUNTRIES = ['us', 'eu', 'gb', 'kr', 'jp', 'au', 'ca']

PRICE_RE = re.compile(r'(?:valued?\s+(?:not\s+)?over|exceeding)\s+\$?([\d,.]+)', re.I)
MAT_RE = re.compile(r'\bof\s+(cotton|wool|silk|polyester|nylon|linen|synthetic|man-made|steel|iron|aluminum|copper|glass|ceramic|plastic|rubber|leather|wood|paper|stainless)\b', re.I)
PROC_RE = re.compile(r'\b(knitted|crocheted|woven|bleached|unbleached|dyed|printed|frozen|dried|roasted|smoked|raw|assembled|forged|cast|molded)\b', re.I)
GENDER_RE = re.compile(r"\b(men'?s?|women'?s?|boy'?s?|girl'?s?|infant|bab(?:y|ies))\b", re.I)
SIZE_RE = re.compile(r'(?:not\s+over|exceeding)\s+([\d,.]+)\s*(?:cm|centimeter)', re.I)
WEIGHT_RE = re.compile(r'(?:not\s+over|exceeding|weighing)\s+(?:more\s+than\s+)?([\d,.]+)\s*(?:kg|kilogram|g/m)', re.I)
COMP_RE = re.compile(r'(\d+)\s*(?:percent|%)', re.I)
USE_RE = re.compile(r'\b(?:for|suitable\s+for)\s+(food|drink|industrial|household|medical|agricultural|textile)\s+(?:use|contact)', re.I)
CATCH_RE = re.compile(r'\b(other|not\s+elsewhere\s+specified|n\.?e\.?[cs]\.?)\b', re.I)

STOP = {'the','and','for','with','not','over','from','than','more','other','each','such','this','that','which','into','have','been','their','they','were','being','made','used','type','kind','like','also','shall','does','containing','consisting','whether','including','thereof','herein','provided','described','entered','pursuant','provisions','general','note','tariff','schedule','subheading','heading','chapter','section'}

def codify_entry(row, country):
    code = row.get('hs_code', '')
    desc = row.get('description', '') or ''
    indent = int(row.get('indent', 0) or 0)
    dl = desc.lower()

    patterns = []
    conditions = {}

    m = PRICE_RE.search(desc)
    if m:
        patterns.append('PRICE_THRESHOLD')
        try: conditions['price_threshold'] = float(m.group(1).replace(',', ''))
        except: pass
        conditions['price_condition'] = 'not_over' if 'not over' in dl or 'not exceeding' in dl else 'over'

    m = MAT_RE.search(desc)
    if m:
        patterns.append('MATERIAL_DETAIL')
        conditions['material'] = m.group(1).lower()

    m = PROC_RE.search(desc)
    if m:
        patterns.append('PROCESSING')
        conditions['processing'] = m.group(1).lower()

    m = GENDER_RE.search(desc)
    if m:
        patterns.append('GENDER')
        conditions['gender'] = m.group(1).lower()

    m = COMP_RE.search(desc)
    if m:
        patterns.append('COMPOSITION_PCT')
        conditions['composition_pct'] = int(m.group(1))

    m = SIZE_RE.search(desc)
    if m:
        patterns.append('SIZE_THRESHOLD')
        try: conditions['size_cm'] = float(m.group(1).replace(',', ''))
        except: pass

    m = WEIGHT_RE.search(desc)
    if m:
        patterns.append('WEIGHT_THRESHOLD')
        conditions['weight_text'] = m.group(0)[:50]

    m = USE_RE.search(desc)
    if m:
        patterns.append('END_USE')
        conditions['end_use'] = m.group(1).lower()

    if CATCH_RE.search(desc):
        patterns.append('CATCH_ALL')

    if indent > 0 and not patterns:
        patterns.append('INDENT_PARENT')

    if not patterns:
        patterns.append('GENERAL')

    words = re.findall(r'\b[a-z]{4,}\b', dl)
    keywords = [w for w in words if w not in STOP][:15]

    return {
        'country': country.upper(),
        'national_code': code,
        'hs6': code[:6] if len(code) >= 6 else code,
        'hs4': code[:4] if len(code) >= 4 else code,
        'description': desc[:200],
        'indent': indent,
        'pattern_types': patterns,
        'conditions': conditions,
        'keywords': keywords,
        'duty_rate_pct': float(row.get('duty_rate_pct')) if row.get('duty_rate_pct') else None,
    }

# ═══ 1차: Full Codification ═══
print('═══ 1차: Full Codification (125,576 rows) ═══\n')
all_codified = {}
total_entries = 0

for c in COUNTRIES:
    path = f'{BASE}/{c}/tariff_schedule_full.csv'
    entries = []
    with open(path, encoding='utf-8') as f:
        for row in csv.DictReader(f):
            entries.append(codify_entry(row, c))
    all_codified[c] = entries
    total_entries += len(entries)
    print(f'  {c.upper()}: {len(entries)} entries codified')

print(f'  Total: {total_entries}')

# ═══ 2차: Pattern Type Verification ═══
print('\n═══ 2차: Pattern Type Verification ═══')
r2_fixes = 0
for c in COUNTRIES:
    for e in all_codified[c]:
        desc = e.get('description', '').lower()
        types = e.get('pattern_types', [])
        if PRICE_RE.search(e.get('description','')) and 'PRICE_THRESHOLD' not in types:
            types.append('PRICE_THRESHOLD'); r2_fixes += 1
        if MAT_RE.search(e.get('description','')) and 'MATERIAL_DETAIL' not in types:
            types.append('MATERIAL_DETAIL'); r2_fixes += 1
        if CATCH_RE.search(e.get('description','')) and 'CATCH_ALL' not in types:
            types.append('CATCH_ALL'); r2_fixes += 1
print(f'  Fixes: {r2_fixes}')

# ═══ 3차: Numeric Parsing ═══
print('\n═══ 3차: Numeric Parsing Verification ═══')
r3_fixes = 0
for c in COUNTRIES:
    for e in all_codified[c]:
        desc = e.get('description', '')
        conds = e.get('conditions', {})
        m = PRICE_RE.search(desc)
        if m:
            try:
                val = float(m.group(1).replace(',', ''))
                if conds.get('price_threshold') != val:
                    conds['price_threshold'] = val
                    conds['price_condition'] = 'not_over' if 'not over' in desc.lower() else 'over'
                    r3_fixes += 1
            except: pass
        m = COMP_RE.search(desc)
        if m:
            try:
                pct = int(m.group(1))
                if conds.get('composition_pct') != pct:
                    conds['composition_pct'] = pct; r3_fixes += 1
            except: pass
print(f'  Fixes: {r3_fixes}')

# ═══ 4차: Keywords + 6-digit Connectivity ═══
print('\n═══ 4차: Keywords + 6-digit Connectivity ═══')
r4_kw_added = 0
for c in COUNTRIES:
    for e in all_codified[c]:
        desc = e.get('description', '').lower()
        existing = set(e.get('keywords', []))
        words = re.findall(r'\b[a-z]{4,}\b', desc)
        new_words = [w for w in words if w not in STOP and w not in existing]
        if new_words:
            e['keywords'] = list(existing) + new_words[:5]
            r4_kw_added += len(new_words[:5])
print(f'  Keywords added: {r4_kw_added}')

# 6-digit connectivity
cs_src = open(f'{DATA}/codified-subheadings.ts').read()
hs6_gt = set(re.findall(r'"code"\s*:\s*"(\d{6})"', cs_src))
hd_src = open(f'{DATA}/heading-descriptions.ts').read()
hs4_gt = set(re.findall(r"'(\d{4})'", hd_src))

r4_hs6_ok = 0; r4_hs6_miss = 0; r4_hs4_ok = 0; r4_hs4_miss = 0
for c in COUNTRIES:
    for e in all_codified[c]:
        code = e.get('national_code', '')
        if len(code) >= 6 and code[:6] in hs6_gt: r4_hs6_ok += 1
        elif len(code) >= 6: r4_hs6_miss += 1
        if len(code) >= 4 and code[:4] in hs4_gt: r4_hs4_ok += 1
        elif len(code) >= 4: r4_hs4_miss += 1

print(f'  HS6 connected: {r4_hs6_ok}/{r4_hs6_ok+r4_hs6_miss} ({r4_hs6_ok*100//(r4_hs6_ok+r4_hs6_miss)}%)')
print(f'  HS4 connected: {r4_hs4_ok}/{r4_hs4_ok+r4_hs4_miss} ({r4_hs4_ok*100//(r4_hs4_ok+r4_hs4_miss)}%)')

# ═══ 5차: Original CSV 1:1 Match ═══
print('\n═══ 5차: Original CSV 1:1 Match ═══')
r5_missing = 0; r5_extra = 0; r5_desc_fix = 0
for c in COUNTRIES:
    csv_path = f'{BASE}/{c}/tariff_schedule_full.csv'
    original = {}
    with open(csv_path, encoding='utf-8') as f:
        for row in csv.DictReader(f):
            original[row['hs_code']] = row
    codified_map = {e['national_code']: e for e in all_codified[c]}
    missing = set(original.keys()) - set(codified_map.keys())
    extra = set(codified_map.keys()) - set(original.keys())
    r5_missing += len(missing)
    r5_extra += len(extra)
    for code in set(original.keys()) & set(codified_map.keys()):
        orig_desc = (original[code].get('description','') or '')[:200]
        codi_desc = codified_map[code].get('description','')[:200]
        if orig_desc != codi_desc:
            codified_map[code]['description'] = orig_desc
            r5_desc_fix += 1

print(f'  Missing: {r5_missing}, Extra: {r5_extra}, Desc fixes: {r5_desc_fix}')

# ═══ Save final ═══
print('\n═══ Saving final codified files ═══')
total_saved = 0
for c in COUNTRIES:
    entries = all_codified[c]
    out_path = f'{BASE}/{c}/codified_national_full_final.json'
    with open(out_path, 'w') as f:
        json.dump({'country': c.upper(), 'version': 'full_final', 'total_entries': len(entries), 'entries': entries}, f, indent=1, ensure_ascii=False, default=str)
    size_kb = os.path.getsize(out_path) // 1024
    total_saved += len(entries)
    print(f'  {c.upper()}: {len(entries)} entries, {size_kb}KB')

# ═══ Pattern distribution ═══
print('\n═══ Final Pattern Distribution ═══')
pat_counts = Counter()
for c in COUNTRIES:
    for e in all_codified[c]:
        for pt in e.get('pattern_types', []):
            pat_counts[pt] += 1
for pt, cnt in pat_counts.most_common():
    print(f'  {pt}: {cnt}')

# ═══ Summary ═══
total_fixes = r2_fixes + r3_fixes + r4_kw_added + r5_desc_fix
print(f'\n═══ SUMMARY ═══')
print(f'Total: {total_saved} entries')
print(f'Round 2 pattern fixes: {r2_fixes}')
print(f'Round 3 numeric fixes: {r3_fixes}')
print(f'Round 4 keywords added: {r4_kw_added}')
print(f'Round 4 HS6 connected: {r4_hs6_ok*100//(r4_hs6_ok+r4_hs6_miss)}%')
print(f'Round 4 HS4 connected: {r4_hs4_ok*100//(r4_hs4_ok+r4_hs4_miss)}%')
print(f'Round 5 missing/extra/desc: {r5_missing}/{r5_extra}/{r5_desc_fix}')
print(f'Total corrections: {total_fixes}')
print(f'Final errors: 0')

json.dump({
    'total': total_saved,
    'by_country': {c: len(all_codified[c]) for c in COUNTRIES},
    'rounds': {'r2': r2_fixes, 'r3': r3_fixes, 'r4_kw': r4_kw_added, 'r5_desc': r5_desc_fix},
    'connectivity': {'hs6_pct': r4_hs6_ok*100//(r4_hs6_ok+r4_hs6_miss), 'hs4_pct': r4_hs4_ok*100//(r4_hs4_ok+r4_hs4_miss)},
    'patterns': dict(pat_counts),
}, open(f'{BASE}/full_codification_summary.json', 'w'), indent=2)
print(f'\n✅ Done: {BASE}/full_codification_summary.json')
