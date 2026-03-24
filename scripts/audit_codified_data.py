#!/usr/bin/env python3
"""
v3 Pipeline Codified Data Full Audit
Reads all TypeScript data files, extracts constants, checks coverage.
"""
import re, json, os

BASE = 'app/lib/cost-engine/gri-classifier'
STEPS = f'{BASE}/steps/v3'
DATA = f'{BASE}/data'

def read(path):
    try: return open(path).read()
    except: return ''

def extract_keys(src, pattern):
    """Extract keys from TypeScript object literal"""
    keys = re.findall(pattern, src)
    return [k.strip("'\"") for k in keys]

print('═══ POTAL v3 Codified Data Full Audit ═══\n')
audit = {}

# ═══ Phase 1: MATERIAL_KEYWORDS ═══
print('Phase 1: MATERIAL_KEYWORDS (step0-input.ts)')
src = read(f'{STEPS}/step0-input.ts')
# Extract: keyword_group: [variants...]
mat_groups = {}
for m in re.finditer(r"(\w+)\s*:\s*\[([^\]]+)\]", src[src.find('MATERIAL_KEYWORDS'):src.find('PROCESSING_KEYWORDS')]):
    group = m.group(1)
    variants = re.findall(r"'([^']+)'", m.group(2))
    mat_groups[group] = variants

print(f'  Groups: {len(mat_groups)}')
for g, v in sorted(mat_groups.items()):
    print(f'    {g}: {len(v)} variants ({", ".join(v[:3])}...)')

# Section coverage
SECTION_MATERIALS = {
    1: ['meat', 'fish', 'shrimp', 'seafood', 'poultry', 'dairy', 'animal', 'honey', 'egg'],
    2: ['plant', 'vegetable', 'grain', 'rice', 'wheat', 'seed', 'coffee', 'tea', 'spice', 'herb', 'cocoa', 'fruit', 'flower'],
    3: ['fat', 'oil', 'wax', 'tallow', 'lard', 'margarine'],
    4: ['sugar', 'chocolate', 'cocoa', 'tobacco', 'beverage', 'alcohol', 'cereal', 'flour'],
    5: ['mineral', 'ore', 'cement', 'salt', 'sand', 'gravel', 'petroleum', 'coal'],
    6: ['chemical', 'pharmaceutical', 'acid', 'medicine', 'drug', 'soap', 'perfume', 'cosmetic', 'fertilizer', 'explosive'],
    7: ['plastic', 'rubber', 'silicone', 'foam', 'resin', 'pvc', 'polypropylene', 'polyethylene'],
    8: ['leather', 'fur', 'skin', 'hide'],
    9: ['wood', 'bamboo', 'cork', 'timber', 'plywood'],
    10: ['paper', 'cardboard', 'pulp'],
    11: ['cotton', 'polyester', 'silk', 'wool', 'nylon', 'linen', 'fabric', 'textile', 'fiber'],
    12: ['footwear', 'shoe', 'hat', 'umbrella', 'feather'],
    13: ['ceramic', 'stoneware', 'porcelain', 'glass', 'stone', 'marble', 'granite'],
    14: ['gold', 'silver', 'platinum', 'pearl', 'diamond', 'jewelry'],
    15: ['steel', 'iron', 'aluminum', 'copper', 'zinc', 'tin', 'titanium', 'brass', 'bronze'],
    16: ['machinery', 'motor', 'engine', 'electric', 'electronic', 'computer', 'battery'],
    17: ['vehicle', 'automobile', 'bicycle', 'aircraft', 'ship', 'boat', 'tire'],
    18: ['optical', 'lens', 'watch', 'clock', 'camera', 'microscope', 'medical'],
    19: ['weapon', 'ammunition', 'explosive', 'firearm'],
    20: ['furniture', 'toy', 'game', 'mattress', 'lamp', 'brush'],
    21: ['painting', 'sculpture', 'antique', 'art'],
}

mat_flat = set()
for g, v in mat_groups.items():
    mat_flat.add(g.lower())
    for vv in v:
        mat_flat.add(vv.lower())

section_coverage = {}
for sec, expected in SECTION_MATERIALS.items():
    found = [k for k in expected if k in mat_flat]
    missing = [k for k in expected if k not in mat_flat]
    section_coverage[sec] = {'found': found, 'missing': missing, 'pct': len(found)*100//max(len(expected),1)}

print(f'\n  Section Coverage:')
total_missing = []
for sec in range(1, 22):
    info = section_coverage.get(sec, {'found': [], 'missing': [], 'pct': 0})
    status = '✅' if info['pct'] >= 50 else '❌'
    print(f'    S{sec:2d}: {info["pct"]:3d}% ({len(info["found"])}/{len(info["found"])+len(info["missing"])}) {status} missing: {info["missing"][:5]}')
    total_missing.extend([(sec, m) for m in info['missing']])

audit['material_keywords'] = {'groups': len(mat_groups), 'total_variants': sum(len(v) for v in mat_groups.values()), 'section_coverage': section_coverage, 'total_missing': len(total_missing)}

# PROCESSING_KEYWORDS
proc_match = re.search(r'PROCESSING_KEYWORDS\s*=\s*\[([^\]]+)\]', src)
proc_kw = re.findall(r"'([^']+)'", proc_match.group(1)) if proc_match else []
print(f'\n  PROCESSING_KEYWORDS: {len(proc_kw)} keywords')
audit['processing_keywords'] = len(proc_kw)

# ═══ Phase 2: MATERIAL_TO_SECTION + CATEGORY_TO_SECTION ═══
print('\nPhase 2: MATERIAL_TO_SECTION + CATEGORY_TO_SECTION (step2-1)')
src21 = read(f'{STEPS}/step2-1-section-candidate.ts')

# MATERIAL_TO_SECTION
mat_sec = {}
for m in re.finditer(r"(\w+)\s*:\s*\[\s*\{\s*section:\s*(\d+)", src21[:src21.find('CATEGORY_TO_SECTION')]):
    mat_sec[m.group(1)] = int(m.group(2))
print(f'  MATERIAL_TO_SECTION: {len(mat_sec)} entries')

# Check section coverage
sec_from_mat = set(mat_sec.values())
missing_sec_mat = [s for s in range(1, 22) if s not in sec_from_mat]
print(f'  Sections covered: {len(sec_from_mat)}/21, missing: {missing_sec_mat}')
audit['mat_to_section'] = {'entries': len(mat_sec), 'sections_covered': len(sec_from_mat), 'missing_sections': missing_sec_mat}

# CATEGORY_TO_SECTION
cat_sec = {}
for m in re.finditer(r"(\w+)\s*:\s*\{\s*section:\s*(\d+),\s*score:\s*([\d.]+)\s*\}", src21[src21.find('CATEGORY_TO_SECTION'):]):
    cat_sec[m.group(1)] = {'section': int(m.group(2)), 'score': float(m.group(3))}
print(f'  CATEGORY_TO_SECTION: {len(cat_sec)} entries')

sec_from_cat = set(v['section'] for v in cat_sec.values())
missing_sec_cat = [s for s in range(1, 22) if s not in sec_from_cat]
print(f'  Sections covered: {len(sec_from_cat)}/21, missing: {missing_sec_cat}')
audit['cat_to_section'] = {'entries': len(cat_sec), 'sections_covered': len(sec_from_cat), 'missing_sections': missing_sec_cat}

# PASSIVE_ACCESSORY_WORDS
passive_match = re.search(r"PASSIVE_ACCESSORY_WORDS\s*=\s*\[([^\]]+)\]", src21)
passive_words = re.findall(r"'([^']+)'", passive_match.group(1)) if passive_match else []
print(f'  PASSIVE_ACCESSORY_WORDS: {len(passive_words)} words: {passive_words}')
audit['passive_words'] = len(passive_words)

# ═══ Phase 3: Chapter mappings ═══
print('\nPhase 3: Chapter mappings (step2-3)')
src23 = read(f'{STEPS}/step2-3-chapter-candidate.ts')

mat_ch = re.findall(r"(\w+)\s*:\s*\{\s*'(\d+)'\s*:\s*\[([^\]]+)\]", src23[:src23.find('PROCESSING_CHAPTER_MAP')])
print(f'  MATERIAL_CHAPTER_MAP: {len(mat_ch)} entries')

proc_ch = re.findall(r"(\w+)\s*:\s*\{\s*(\d+)\s*:\s*(\d+)\s*\}", src23[src23.find('PROCESSING_CHAPTER_MAP'):src23.find('export function')])
print(f'  PROCESSING_CHAPTER_MAP: {len(proc_ch)} entries')

article_match = re.search(r"ARTICLE_KEYWORDS\s*=\s*\[([^\]]+)\]", src23)
article_kw = re.findall(r"'([^']+)'", article_match.group(1)) if article_match else []
print(f'  ARTICLE_KEYWORDS: {len(article_kw)} keywords')
audit['chapter_maps'] = {'mat_ch': len(mat_ch), 'proc_ch': len(proc_ch), 'article_kw': len(article_kw)}

# ═══ Phase 4: KEYWORD_TO_HEADINGS ═══
print('\nPhase 4: KEYWORD_TO_HEADINGS (step3-heading.ts)')
src3 = read(f'{STEPS}/step3-heading.ts')
kw_headings = {}
for m in re.finditer(r"'([^']+)'\s*:\s*\[([^\]]+)\]", src3[src3.find('KEYWORD_TO_HEADINGS'):src3.find('};', src3.find('KEYWORD_TO_HEADINGS'))+2]):
    key = m.group(1)
    vals = re.findall(r"'([^']+)'", m.group(2))
    kw_headings[key] = vals
print(f'  Keywords: {len(kw_headings)}')
all_heading_codes = set()
for v in kw_headings.values():
    all_heading_codes.update(v)
print(f'  Unique heading codes referenced: {len(all_heading_codes)}')
audit['kw_to_headings'] = {'keywords': len(kw_headings), 'unique_headings': len(all_heading_codes)}

# ═══ Phase 5: heading-descriptions.ts ═══
print('\nPhase 5: heading-descriptions.ts')
hd_src = read(f'{DATA}/heading-descriptions.ts')
hd_count = len(re.findall(r"'\d{4}'", hd_src))
print(f'  Heading descriptions: {hd_count}')
# Headings NOT covered by KEYWORD_TO_HEADINGS
all_hd_codes = set(re.findall(r"'(\d{4})'", hd_src))
uncovered_headings = all_hd_codes - all_heading_codes
print(f'  Covered by KEYWORD_TO_HEADINGS: {len(all_heading_codes)}/{len(all_hd_codes)} ({len(all_heading_codes)*100//max(len(all_hd_codes),1)}%)')
print(f'  Uncovered headings: {len(uncovered_headings)}')
audit['heading_descriptions'] = {'total': hd_count, 'covered': len(all_heading_codes), 'uncovered': len(uncovered_headings)}

# ═══ Phase 6: codified-rules.ts ═══
print('\nPhase 6: codified-rules.ts')
cr_src = read(f'{DATA}/codified-rules.ts')
rule_types = re.findall(r"type:\s*'([^']+)'", cr_src)
from collections import Counter
type_counts = Counter(rule_types)
total_rules = len(rule_types)
print(f'  Total rules: {total_rules}')
for t, c in type_counts.most_common():
    print(f'    {t}: {c}')
audit['codified_rules'] = {'total': total_rules, 'by_type': dict(type_counts)}

# ═══ Phase 7: codified-headings.ts + codified-subheadings.ts ═══
print('\nPhase 7: codified-headings + subheadings')
ch_src = read(f'{DATA}/codified-headings.ts')
ch_count = ch_src.count('"code"')
print(f'  codified-headings: {ch_count} entries')

cs_src = read(f'{DATA}/codified-subheadings.ts')
cs_count = cs_src.count('"code"')
print(f'  codified-subheadings: {cs_count} entries')
audit['codified_headings'] = ch_count
audit['codified_subheadings'] = cs_count

# ═══ Phase 8: conflict-patterns-data.ts ═══
print('\nPhase 8: conflict-patterns-data.ts')
cp_src = read(f'{DATA}/conflict-patterns-data.ts')
cp_count = cp_src.count('"pattern_id"')
print(f'  Conflict patterns: {cp_count}')
audit['conflict_patterns'] = cp_count

# ═══ Phase 9: heading-method-tags.ts ═══
print('\nPhase 9: heading-method-tags.ts')
hmt_src = read(f'{DATA}/heading-method-tags.ts')
hmt_voting = hmt_src.count('"voting"')
hmt_elimination = hmt_src.count('"elimination"')
hmt_both = hmt_src.count('"both"')
print(f'  voting: {hmt_voting}, elimination: {hmt_elimination}, both: {hmt_both}, total: {hmt_voting+hmt_elimination+hmt_both}')
audit['method_tags'] = {'voting': hmt_voting, 'elimination': hmt_elimination, 'both': hmt_both}

# ═══ Phase 10: Bench failure analysis ═══
print('\nPhase 10: 173-item bench Section 0 failures')
try:
    bench = json.load(open('/Volumes/soulmaten/POTAL/7field_benchmark/amazon_9field_bench_result.json'))
    sec0 = [r for r in bench if r.get('section') == 0 and 'error' not in r]
    print(f'  Section 0 items: {len(sec0)}')
    for item in sec0:
        print(f'    "{item.get("product_name","")[:40]}" mat="{item.get("material","")}" cat="{str(item.get("query",""))[:20]}"')
    audit['section0_failures'] = [{'name': r.get('product_name','')[:40], 'material': r.get('material',''), 'query': r.get('query','')} for r in sec0]
except:
    print('  Bench results not found')

# ═══ Summary ═══
print('\n═══ AUDIT SUMMARY ═══')
print(f'MATERIAL_KEYWORDS: {audit["material_keywords"]["groups"]} groups, {audit["material_keywords"]["total_variants"]} variants')
print(f'  Section coverage: {21-len(total_missing)}/21 fully covered, {len(total_missing)} missing keywords')
print(f'MATERIAL_TO_SECTION: {audit["mat_to_section"]["entries"]} entries, missing sections: {audit["mat_to_section"]["missing_sections"]}')
print(f'CATEGORY_TO_SECTION: {audit["cat_to_section"]["entries"]} entries, missing sections: {audit["cat_to_section"]["missing_sections"]}')
print(f'KEYWORD_TO_HEADINGS: {audit["kw_to_headings"]["keywords"]} keywords → {audit["kw_to_headings"]["unique_headings"]} headings')
print(f'  Coverage: {audit["heading_descriptions"]["covered"]}/{audit["heading_descriptions"]["total"]} headings ({audit["heading_descriptions"]["covered"]*100//audit["heading_descriptions"]["total"]}%)')
print(f'  Uncovered: {audit["heading_descriptions"]["uncovered"]} headings')
print(f'Codified rules: {audit["codified_rules"]["total"]}')
print(f'Codified headings: {audit["codified_headings"]}, subheadings: {audit["codified_subheadings"]}')
print(f'Conflict patterns: {audit["conflict_patterns"]}')

# Save
json.dump(audit, open('/tmp/v3_audit_result.json', 'w'), indent=2, default=str)
json.dump({'section_coverage': section_coverage, 'total_missing': total_missing, 'mat_to_section_missing': missing_sec_mat, 'cat_to_section_missing': missing_sec_cat, 'kw_headings_count': len(kw_headings), 'uncovered_headings_count': len(uncovered_headings)}, open('/tmp/v3_audit_summary.json', 'w'), indent=2, default=str)
print(f'\nAudit saved to /tmp/v3_audit_result.json')
