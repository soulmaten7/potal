#!/usr/bin/env python3
"""
7-Country National Tariff Codification
Phase 1: Structure analysis
Phase 2: Pattern extraction + codification
Phase 3: Validation
Phase 4: Comparison with existing data
"""
import csv, json, re, os
from collections import Counter, defaultdict

BASE = '/Volumes/soulmaten/POTAL/hs_national_rules'
EXISTING_BASE = 'app/lib/cost-engine/gri-classifier/data'
COUNTRIES = ['us', 'eu', 'gb', 'kr', 'jp', 'au', 'ca']

# ═══ Pattern detection regexes ═══
PATTERNS = {
    'PRICE_THRESHOLD': re.compile(r'(?:valued?\s+(?:not\s+)?over|exceeding)\s+\$?([\d,.]+)', re.I),
    'SIZE_CM': re.compile(r'(?:not\s+over|exceeding|less\s+than)\s+([\d,.]+)\s*(?:cm|centimeter)', re.I),
    'WEIGHT_KG': re.compile(r'(?:not\s+(?:over|exceeding)|weighing)\s+(?:more\s+than\s+)?([\d,.]+)\s*(?:kg|kilogram|g/m)', re.I),
    'GENDER': re.compile(r"\b(men'?s?|women'?s?|boy'?s?|girl'?s?|infant|bab(?:y|ies))\b", re.I),
    'MATERIAL_OF': re.compile(r'\bof\s+(cotton|wool|silk|polyester|nylon|linen|synthetic|man-made|steel|iron|aluminum|copper|glass|ceramic|plastic|rubber|leather|wood|paper)\b', re.I),
    'COMPOSITION_PCT': re.compile(r'(\d+)\s*(?:percent|%)\s*(?:or\s+more|or\s+less)?\s*(?:by\s+weight)?\s*(?:of\s+)?([\w\s]+)', re.I),
    'PROCESSING': re.compile(r'\b(knitted|crocheted|woven|bleached|unbleached|dyed|printed|frozen|dried|roasted|smoked|raw|assembled|forged|cast|molded)\b', re.I),
    'END_USE': re.compile(r'\b(?:for|suitable\s+for)\s+(food|drink|industrial|household|medical|agricultural|textile)\s+(?:use|contact|purpose)', re.I),
    'CATCH_ALL': re.compile(r'\b(other|not\s+elsewhere\s+specified|n\.?e\.?[cs]\.?|not\s+specified)\b', re.I),
}

def classify_description(desc, indent=0):
    """Classify a tariff description into pattern types"""
    if not desc:
        return {'pattern_types': ['UNKNOWN'], 'conditions': {}}

    detected = []
    conditions = {}

    # Price
    m = PATTERNS['PRICE_THRESHOLD'].search(desc)
    if m:
        detected.append('PRICE_THRESHOLD')
        val = m.group(1).replace(',', '')
        try:
            conditions['price_threshold'] = float(val)
        except:
            conditions['price_threshold_text'] = m.group(0)

    # Size
    m = PATTERNS['SIZE_CM'].search(desc)
    if m:
        detected.append('SIZE_THRESHOLD')
        try:
            conditions['size_cm'] = float(m.group(1).replace(',', ''))
        except:
            pass

    # Weight
    m = PATTERNS['WEIGHT_KG'].search(desc)
    if m:
        detected.append('WEIGHT_THRESHOLD')
        try:
            conditions['weight_threshold'] = m.group(0)
        except:
            pass

    # Gender
    m = PATTERNS['GENDER'].search(desc)
    if m:
        detected.append('GENDER')
        conditions['gender'] = m.group(1).lower()

    # Material
    m = PATTERNS['MATERIAL_OF'].search(desc)
    if m:
        detected.append('MATERIAL_DETAIL')
        conditions['material'] = m.group(1).lower()

    # Composition
    m = PATTERNS['COMPOSITION_PCT'].search(desc)
    if m:
        detected.append('COMPOSITION_PCT')
        conditions['composition_pct'] = int(m.group(1))
        conditions['composition_material'] = m.group(2).strip().lower()

    # Processing
    m = PATTERNS['PROCESSING'].search(desc)
    if m:
        detected.append('PROCESSING')
        conditions['processing'] = m.group(1).lower()

    # End use
    m = PATTERNS['END_USE'].search(desc)
    if m:
        detected.append('END_USE')
        conditions['end_use'] = m.group(1).lower()

    # Catch-all
    m = PATTERNS['CATCH_ALL'].search(desc)
    if m:
        detected.append('CATCH_ALL')

    # Extract keywords (words > 3 chars, excluding common stop words)
    STOP = {'the','and','for','with','not','over','from','than','such','this','that','each','other','more','less','which','into','have','been','their','they','were','being','made','used','type','kind','like','also','shall','does','containing','consisting','whether','including'}
    words = re.findall(r'\b[a-z]{4,}\b', desc.lower())
    keywords = [w for w in words if w not in STOP][:10]

    if indent > 0 and not detected:
        detected.append('INDENT_PARENT')

    if not detected:
        detected.append('GENERAL')

    return {
        'pattern_types': detected,
        'conditions': conditions,
        'keywords': keywords,
    }

def process_country(country):
    """Process one country's tariff CSV"""
    path = f'{BASE}/{country}/tariff_schedule.csv'
    if not os.path.exists(path):
        return None

    entries = []
    pattern_counts = Counter()

    with open(path, encoding='utf-8') as f:
        reader = csv.DictReader(f)
        for row in reader:
            code = row.get('hs_code', '')
            desc = row.get('description', '')
            indent = int(row.get('indent', 0) or 0)
            duty_text = row.get('duty_rate_text', '')
            duty_pct = row.get('duty_rate_pct', '')

            analysis = classify_description(desc, indent)

            entry = {
                'national_code': code,
                'hs6': code[:6] if len(code) >= 6 else code,
                'description': desc[:200],
                'indent': indent,
                'pattern_types': analysis['pattern_types'],
                'conditions': analysis['conditions'],
                'keywords': analysis['keywords'],
                'duty_rate_pct': float(duty_pct) if duty_pct else None,
            }
            entries.append(entry)

            for pt in analysis['pattern_types']:
                pattern_counts[pt] += 1

    return {
        'country': country.upper(),
        'total_entries': len(entries),
        'pattern_distribution': dict(pattern_counts),
        'entries': entries,
    }

# ═══ Phase 1-2: Process all countries ═══
print('═══ Phase 1-2: Codification ═══\n')

all_results = {}
for country in COUNTRIES:
    print(f'Processing {country.upper()}...', end=' ')
    result = process_country(country)
    if result:
        all_results[country] = result
        # Save JSON
        out_path = f'{BASE}/{country}/codified_national.json'
        # Save without entries to check size first
        summary = {k: v for k, v in result.items() if k != 'entries'}
        summary['entry_count'] = len(result['entries'])

        with open(out_path, 'w') as f:
            json.dump(result, f, indent=2, ensure_ascii=False, default=str)

        size_kb = os.path.getsize(out_path) // 1024
        print(f'{result["total_entries"]} entries, {size_kb}KB, patterns: {dict(result["pattern_distribution"])}')
    else:
        print('SKIP (no CSV)')

# ═══ Phase 3: Validation ═══
print('\n═══ Phase 3: Pattern Distribution ═══\n')

all_patterns = set()
for c, r in all_results.items():
    for p in r['pattern_distribution']:
        all_patterns.add(p)

all_patterns = sorted(all_patterns)
print(f'{"Pattern":<25}', end='')
for c in COUNTRIES:
    print(f'{c.upper():>8}', end='')
print()

for pattern in all_patterns:
    print(f'{pattern:<25}', end='')
    for c in COUNTRIES:
        cnt = all_results.get(c, {}).get('pattern_distribution', {}).get(pattern, 0)
        print(f'{cnt:>8}', end='')
    print()

# ═══ Phase 4: Compare with existing data ═══
print('\n═══ Phase 4: Comparison with Existing ═══\n')

# Load existing KEYWORD_TO_HEADINGS count
step3_src = open('app/lib/cost-engine/gri-classifier/steps/v3/step3-heading.ts').read()
existing_kw_count = len(re.findall(r"'[^']+'\s*:\s*\[", step3_src[step3_src.find('KEYWORD_TO_HEADINGS'):]))
print(f'Existing KEYWORD_TO_HEADINGS: {existing_kw_count} entries')

# Count new keywords from codification
new_keywords = set()
for c, r in all_results.items():
    for entry in r['entries']:
        for kw in entry.get('keywords', []):
            new_keywords.add(kw)
print(f'New keywords from codification: {len(new_keywords)}')

# Price thresholds
existing_price_rules = 18  # hs_price_break_rules table
new_price_rules = 0
for c, r in all_results.items():
    new_price_rules += r['pattern_distribution'].get('PRICE_THRESHOLD', 0)
print(f'Existing price break rules: {existing_price_rules}')
print(f'New PRICE_THRESHOLD entries (all countries): {new_price_rules}')

# US-specific price thresholds
us_prices = []
if 'us' in all_results:
    for entry in all_results['us']['entries']:
        if 'price_threshold' in entry.get('conditions', {}):
            us_prices.append({
                'code': entry['national_code'],
                'threshold': entry['conditions']['price_threshold'],
                'desc': entry['description'][:60],
            })
print(f'US price threshold entries with parsed value: {len(us_prices)}')
if us_prices:
    for p in us_prices[:5]:
        print(f'  {p["code"]}: ${p["threshold"]} — {p["desc"]}')

# Material keywords comparison
existing_materials = set()
step0_src = open('app/lib/cost-engine/gri-classifier/steps/v3/step0-input.ts').read()
for m in re.finditer(r"'([^']+)'", step0_src[step0_src.find('MATERIAL_KEYWORDS'):step0_src.find('PROCESSING_KEYWORDS')]):
    existing_materials.add(m.group(1).lower())

new_materials = set()
for c, r in all_results.items():
    for entry in r['entries']:
        mat = entry.get('conditions', {}).get('material')
        if mat:
            new_materials.add(mat)
overlap = existing_materials & new_materials
new_only = new_materials - existing_materials
print(f'\nMaterial keywords: existing={len(existing_materials)}, from codification={len(new_materials)}')
print(f'  Overlap: {len(overlap)}, New only: {len(new_only)}')
if new_only:
    print(f'  New materials not in MATERIAL_KEYWORDS: {sorted(new_only)[:20]}')

# HS6 connectivity
existing_hs6 = set()
hd_src = open('app/lib/cost-engine/gri-classifier/data/heading-descriptions.ts').read()
for m in re.finditer(r"'(\d{4})'", hd_src):
    existing_hs6.add(m.group(1))

national_hs6 = set()
for c, r in all_results.items():
    for entry in r['entries']:
        if len(entry['hs6']) == 6:
            national_hs6.add(entry['hs6'][:4])  # heading level

connected = existing_hs6 & national_hs6
print(f'\nHS heading connectivity: existing={len(existing_hs6)}, national={len(national_hs6)}, connected={len(connected)}')

# ═══ Summary ═══
print('\n═══ SUMMARY ═══')
total_entries = sum(r['total_entries'] for r in all_results.values())
total_price = sum(r['pattern_distribution'].get('PRICE_THRESHOLD', 0) for r in all_results.values())
total_size = sum(r['pattern_distribution'].get('SIZE_THRESHOLD', 0) for r in all_results.values())
total_weight = sum(r['pattern_distribution'].get('WEIGHT_THRESHOLD', 0) for r in all_results.values())
total_gender = sum(r['pattern_distribution'].get('GENDER', 0) for r in all_results.values())
total_material = sum(r['pattern_distribution'].get('MATERIAL_DETAIL', 0) for r in all_results.values())
total_processing = sum(r['pattern_distribution'].get('PROCESSING', 0) for r in all_results.values())
total_catch_all = sum(r['pattern_distribution'].get('CATCH_ALL', 0) for r in all_results.values())

print(f'Total codified: {total_entries} entries across 7 countries')
print(f'PRICE_THRESHOLD: {total_price} (existing: 18 in hs_price_break_rules)')
print(f'SIZE_THRESHOLD: {total_size}')
print(f'WEIGHT_THRESHOLD: {total_weight}')
print(f'GENDER: {total_gender}')
print(f'MATERIAL_DETAIL: {total_material}')
print(f'PROCESSING: {total_processing}')
print(f'CATCH_ALL: {total_catch_all}')
print(f'New keywords: {len(new_keywords)}')
print(f'New materials: {len(new_only)}')
print(f'US price rules with value: {len(us_prices)}')

# Save summary
summary_path = f'{BASE}/codification_summary.json'
json.dump({
    'total_entries': total_entries,
    'by_country': {c: {'entries': r['total_entries'], 'patterns': r['pattern_distribution']} for c, r in all_results.items()},
    'pattern_totals': {
        'PRICE_THRESHOLD': total_price, 'SIZE_THRESHOLD': total_size,
        'WEIGHT_THRESHOLD': total_weight, 'GENDER': total_gender,
        'MATERIAL_DETAIL': total_material, 'PROCESSING': total_processing,
        'CATCH_ALL': total_catch_all,
    },
    'new_keywords_count': len(new_keywords),
    'new_materials': sorted(new_only),
    'us_price_thresholds': us_prices[:20],
    'existing_comparison': {
        'keyword_to_headings': existing_kw_count,
        'material_keywords': len(existing_materials),
        'price_break_rules': existing_price_rules,
        'heading_hs6_connected': len(connected),
    },
}, open(summary_path, 'w'), indent=2, default=str)
print(f'\n✅ Summary: {summary_path}')
