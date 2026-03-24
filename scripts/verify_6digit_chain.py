#!/usr/bin/env python3
"""
6-digit ground truth vs 7-country national codification verification
Phase 1: HS6 connectivity
Phase 2: HS4 connectivity
Phase 3: Section/Chapter consistency
Phase 4: Description consistency
Phase 5: Keyword connectivity
Phase 6: Full chain test (50 samples)
"""
import json, re, os, random
from collections import defaultdict

BASE = '/Volumes/soulmaten/POTAL/hs_national_rules'
DATA = 'app/lib/cost-engine/gri-classifier/data'
COUNTRIES = ['us', 'eu', 'gb', 'kr', 'jp', 'au', 'ca']

# ═══ Load ground truth (6-digit) ═══
print('Loading ground truth...')

# Extract HS6 codes from codified-subheadings.ts
cs_src = open(f'{DATA}/codified-subheadings.ts').read()
hs6_codes = set(re.findall(r'"code"\s*:\s*"(\d{6})"', cs_src))
print(f'  HS6 ground truth: {len(hs6_codes)} codes')

# Extract HS4 codes from heading-descriptions.ts
hd_src = open(f'{DATA}/heading-descriptions.ts').read()
hs4_codes = set(re.findall(r"'(\d{4})'", hd_src))
print(f'  HS4 ground truth: {len(hs4_codes)} headings')

# Extract HS6 descriptions from subheading-descriptions.ts (if exists)
sd_src = ''
sd_path = f'{DATA}/subheading-descriptions.ts'
if os.path.exists(sd_path):
    sd_src = open(sd_path).read()
hs6_descs = {}
for m in re.finditer(r"'(\d{6})'\s*:\s*'([^']*)'", sd_src):
    hs6_descs[m.group(1)] = m.group(2)
if not hs6_descs:
    # Try heading descriptions as fallback
    for m in re.finditer(r"'(\d{4})'\s*:\s*'([^']*)'", hd_src):
        hs6_descs[m.group(1)] = m.group(2)
print(f'  HS descriptions loaded: {len(hs6_descs)}')

# Chapter → Section mapping
CHAPTER_SECTION = {}
for ch in range(1, 98):
    if ch <= 5: CHAPTER_SECTION[ch] = 1
    elif ch <= 14: CHAPTER_SECTION[ch] = 2
    elif ch == 15: CHAPTER_SECTION[ch] = 3
    elif ch <= 24: CHAPTER_SECTION[ch] = 4
    elif ch <= 27: CHAPTER_SECTION[ch] = 5
    elif ch <= 38: CHAPTER_SECTION[ch] = 6
    elif ch <= 40: CHAPTER_SECTION[ch] = 7
    elif ch <= 43: CHAPTER_SECTION[ch] = 8
    elif ch <= 46: CHAPTER_SECTION[ch] = 9
    elif ch <= 49: CHAPTER_SECTION[ch] = 10
    elif ch <= 63: CHAPTER_SECTION[ch] = 11
    elif ch <= 67: CHAPTER_SECTION[ch] = 12
    elif ch <= 70: CHAPTER_SECTION[ch] = 13
    elif ch == 71: CHAPTER_SECTION[ch] = 14
    elif ch <= 83: CHAPTER_SECTION[ch] = 15
    elif ch <= 85: CHAPTER_SECTION[ch] = 16
    elif ch <= 89: CHAPTER_SECTION[ch] = 17
    elif ch <= 92: CHAPTER_SECTION[ch] = 18
    elif ch == 93: CHAPTER_SECTION[ch] = 19
    elif ch <= 96: CHAPTER_SECTION[ch] = 20
    elif ch == 97: CHAPTER_SECTION[ch] = 21

# ═══ Load 7-country v5 data ═══
print('\nLoading 7-country v5 codifications...')
all_national = {}
for c in COUNTRIES:
    path = f'{BASE}/{c}/codified_national_v5.json'
    if os.path.exists(path):
        data = json.load(open(path))
        all_national[c] = data.get('entries', [])
        print(f'  {c.upper()}: {len(all_national[c])} entries')

# ═══ Phase 1: HS6 Connectivity ═══
print('\n═══ Phase 1: HS6 Connectivity ═══')
p1_results = {}
p1_disconnected = []

for c in COUNTRIES:
    entries = all_national.get(c, [])
    connected = 0
    disconnected = 0
    for e in entries:
        code = e.get('national_code', '')
        if len(code) >= 6:
            hs6 = code[:6]
            if hs6 in hs6_codes:
                connected += 1
            else:
                disconnected += 1
                if disconnected <= 3:
                    p1_disconnected.append({'country': c.upper(), 'code': code, 'hs6': hs6})
        else:
            # Short codes (heading-level entries in US) — check HS4
            if code[:4] in hs4_codes:
                connected += 1
            else:
                disconnected += 1

    total = connected + disconnected
    pct = connected * 100 // total if total > 0 else 0
    p1_results[c] = {'connected': connected, 'disconnected': disconnected, 'total': total, 'pct': pct}
    print(f'  {c.upper()}: {connected}/{total} ({pct}%) connected, {disconnected} disconnected')

# ═══ Phase 2: HS4 Connectivity ═══
print('\n═══ Phase 2: HS4 Connectivity ═══')
p2_results = {}

for c in COUNTRIES:
    entries = all_national.get(c, [])
    connected = 0
    disconnected = 0
    for e in entries:
        code = e.get('national_code', '')
        if len(code) >= 4:
            hs4 = code[:4]
            if hs4 in hs4_codes:
                connected += 1
            else:
                disconnected += 1
        else:
            disconnected += 1

    total = connected + disconnected
    pct = connected * 100 // total if total > 0 else 0
    p2_results[c] = {'connected': connected, 'disconnected': disconnected, 'pct': pct}
    print(f'  {c.upper()}: {connected}/{total} ({pct}%) connected')

# ═══ Phase 3: Section/Chapter Consistency ═══
print('\n═══ Phase 3: Section/Chapter Consistency ═══')
p3_errors = 0
for c in COUNTRIES:
    for e in all_national.get(c, []):
        code = e.get('national_code', '')
        if len(code) >= 2:
            try:
                ch = int(code[:2])
                section = CHAPTER_SECTION.get(ch)
                if section is None and ch <= 97:
                    p3_errors += 1
            except:
                pass
print(f'  Section/Chapter mapping errors: {p3_errors}')

# ═══ Phase 4: Description Consistency ═══
print('\n═══ Phase 4: Description Consistency ═══')
p4_match = 0
p4_mismatch = 0
p4_no_ground = 0
p4_mismatches = []

STOP = {'the','and','for','not','with','over','from','other','their','this','that','which'}

for c in COUNTRIES:
    for e in all_national.get(c, []):
        code = e.get('national_code', '')
        nat_desc = e.get('description', '').lower()
        if len(code) < 6:
            continue

        hs6 = code[:6]
        hs4 = code[:4]
        gt_desc = hs6_descs.get(hs6, hs6_descs.get(hs4, '')).lower()

        if not gt_desc:
            p4_no_ground += 1
            continue

        # Keyword overlap check
        gt_words = set(re.findall(r'\b[a-z]{4,}\b', gt_desc)) - STOP
        nat_words = set(re.findall(r'\b[a-z]{4,}\b', nat_desc)) - STOP

        if not gt_words:
            p4_no_ground += 1
            continue

        overlap = gt_words & nat_words
        overlap_pct = len(overlap) * 100 // len(gt_words) if gt_words else 0

        if overlap_pct >= 20 or len(overlap) >= 1:
            p4_match += 1
        else:
            p4_mismatch += 1
            if len(p4_mismatches) < 10:
                p4_mismatches.append({
                    'country': c.upper(), 'code': code,
                    'nat_desc': nat_desc[:60], 'gt_desc': gt_desc[:60],
                    'overlap': list(overlap)[:5],
                })

total_checked = p4_match + p4_mismatch
print(f'  Match: {p4_match}/{total_checked} ({p4_match*100//max(total_checked,1)}%)')
print(f'  Mismatch: {p4_mismatch}/{total_checked} ({p4_mismatch*100//max(total_checked,1)}%)')
print(f'  No ground truth: {p4_no_ground}')
if p4_mismatches:
    print('  Sample mismatches:')
    for mm in p4_mismatches[:5]:
        print(f'    {mm["country"]} {mm["code"]}: nat="{mm["nat_desc"]}" gt="{mm["gt_desc"]}" overlap={mm["overlap"]}')

# ═══ Phase 5: Keyword Connectivity ═══
print('\n═══ Phase 5: Keyword Connectivity ═══')
# Check if heading keywords appear in national keywords
ch_src = open(f'{DATA}/codified-headings.ts').read()
heading_keywords = {}
# Parse: each heading has keywords array
for m in re.finditer(r'"code"\s*:\s*"(\d{4})"[^}]*"keywords"\s*:\s*\[([^\]]*)\]', ch_src):
    h4 = m.group(1)
    kws = re.findall(r'"([^"]+)"', m.group(2))
    heading_keywords[h4] = set(kws)

p5_connected = 0
p5_missing = 0
for c in COUNTRIES:
    for e in all_national.get(c, []):
        code = e.get('national_code', '')
        if len(code) < 4:
            continue
        hs4 = code[:4]
        h_kw = heading_keywords.get(hs4, set())
        n_kw = set(e.get('keywords', []))
        if h_kw and n_kw:
            overlap = h_kw & n_kw
            if overlap:
                p5_connected += 1
            else:
                p5_missing += 1

print(f'  Keyword connected: {p5_connected}')
print(f'  No keyword overlap with heading: {p5_missing}')

# ═══ Phase 6: Full Chain Test (50 samples) ═══
print('\n═══ Phase 6: Full Chain Test (50 samples) ═══')
# Pick 50 random entries from US (most complex)
us_entries = all_national.get('us', [])
us_with_10 = [e for e in us_entries if len(e.get('national_code','')) >= 10]
samples = random.sample(us_with_10, min(50, len(us_with_10)))

chain_complete = 0
chain_partial = 0
chain_results = []

for e in samples:
    code = e['national_code']
    hs4 = code[:4]
    hs6 = code[:6]
    ch = int(code[:2]) if code[:2].isdigit() else 0
    sec = CHAPTER_SECTION.get(ch, 0)

    has_hs4 = hs4 in hs4_codes
    has_hs6 = hs6 in hs6_codes
    has_section = sec > 0
    has_desc_overlap = False

    gt_desc = hs6_descs.get(hs6, hs6_descs.get(hs4, '')).lower()
    nat_desc = e.get('description', '').lower()
    if gt_desc:
        gt_w = set(re.findall(r'\b[a-z]{4,}\b', gt_desc)) - STOP
        nat_w = set(re.findall(r'\b[a-z]{4,}\b', nat_desc)) - STOP
        if gt_w & nat_w:
            has_desc_overlap = True

    complete = has_hs4 and has_hs6 and has_section and has_desc_overlap
    if complete:
        chain_complete += 1
    else:
        chain_partial += 1

    chain_results.append({
        'code': code, 'hs4': hs4, 'hs6': hs6, 'chapter': ch, 'section': sec,
        'has_hs4': has_hs4, 'has_hs6': has_hs6, 'has_section': has_section,
        'has_desc_overlap': has_desc_overlap, 'complete': complete,
        'desc': e.get('description', '')[:50],
    })

print(f'  Complete chain: {chain_complete}/50 ({chain_complete*2}%)')
print(f'  Partial chain: {chain_partial}/50')
if chain_partial > 0:
    broken = [r for r in chain_results if not r['complete']][:5]
    for b in broken:
        print(f'    {b["code"]}: hs4={b["has_hs4"]} hs6={b["has_hs6"]} sec={b["has_section"]} desc={b["has_desc_overlap"]}')

# ═══ Summary ═══
print('\n═══ VERIFICATION SUMMARY ═══')
total_entries = sum(len(v) for v in all_national.values())
total_hs6_connected = sum(v['connected'] for v in p1_results.values())
total_hs6_total = sum(v['total'] for v in p1_results.values())
total_hs4_connected = sum(v['connected'] for v in p2_results.values())

print(f'Total entries: {total_entries}')
print(f'HS6 connected: {total_hs6_connected}/{total_hs6_total} ({total_hs6_connected*100//total_hs6_total}%)')
print(f'HS4 connected: {total_hs4_connected}/{total_hs6_total} ({total_hs4_connected*100//total_hs6_total}%)')
print(f'Section/Chapter errors: {p3_errors}')
print(f'Description match: {p4_match}/{total_checked} ({p4_match*100//max(total_checked,1)}%)')
print(f'Description mismatch: {p4_mismatch}')
print(f'Chain complete: {chain_complete}/50')

# Save
results = {
    'hs6_connectivity': p1_results,
    'hs4_connectivity': p2_results,
    'section_chapter_errors': p3_errors,
    'description_match': p4_match,
    'description_mismatch': p4_mismatch,
    'description_mismatches_sample': p4_mismatches,
    'keyword_connected': p5_connected,
    'keyword_missing': p5_missing,
    'chain_complete': chain_complete,
    'chain_results': chain_results[:20],
}
json.dump(results, open(f'{BASE}/6digit_verification.json', 'w'), indent=2, default=str)
print(f'\n✅ Saved: {BASE}/6digit_verification.json')
