#!/usr/bin/env python3
"""
Expert Rules Verification — trace each of 476 rules through our rules data.
For each rule, verify: Section → Chapter → Heading → Subheading using
section-notes, chapter-notes, heading-descriptions, subheading-descriptions.
"""

import json, re, os, sys

OUTPUT = '/Volumes/soulmaten/POTAL/hs_correlation/expert_rules_verification.json'

# ─── Load all rules data ─────────────────────────────

def load_ts_dict(filepath, pattern):
    """Extract key-value pairs from TypeScript Record<string, string>."""
    with open(filepath, 'r', encoding='utf-8') as f:
        content = f.read()
    return dict(re.findall(pattern, content))

print("Loading rules data...")

# Heading descriptions: '0101': 'Horses, asses, mules...'
HEADINGS = load_ts_dict(
    'app/lib/cost-engine/gri-classifier/data/heading-descriptions.ts',
    r"'(\d{4})':\s*'([^']*(?:\\'[^']*)*)'")
print(f"  Headings: {len(HEADINGS)}")

# Subheading descriptions
SUBHEADINGS = load_ts_dict(
    'app/lib/cost-engine/gri-classifier/data/subheading-descriptions.ts',
    r"'(\d{6})':\s*'([^']*(?:\\'[^']*)*)'")
print(f"  Subheadings: {len(SUBHEADINGS)}")

# Chapter descriptions
CHAPTERS = {}
with open('app/lib/cost-engine/gri-classifier/data/chapter-descriptions.ts', 'r') as f:
    for m in re.finditer(r'(\d+):\s*\'([^\']*(?:\\\'[^\']*)*)\',', f.read()):
        CHAPTERS[int(m.group(1))] = m.group(2)
print(f"  Chapter descriptions: {len(CHAPTERS)}")

# Chapter → Section mapping
CH_TO_SEC = {}
with open('app/lib/cost-engine/gri-classifier/data/chapter-descriptions.ts', 'r') as f:
    content = f.read()
    for m in re.finditer(r'(\d+):\s*(\d+),', content[content.find('CHAPTER_TO_SECTION'):]):
        CH_TO_SEC[int(m.group(1))] = int(m.group(2))
print(f"  Chapter→Section mappings: {len(CH_TO_SEC)}")

# Section notes (extract from TS)
SECTION_NOTES = {}
with open('app/lib/cost-engine/gri-classifier/data/section-notes.ts', 'r', encoding='utf-8') as f:
    content = f.read()
    for m in re.finditer(r"section_number:\s*(\d+).*?section_note:\s*'(.*?)',\s*note_length", content, re.DOTALL):
        sec = int(m.group(1))
        note = m.group(2).replace('\\n', '\n').replace("\\'", "'")
        SECTION_NOTES[sec] = note
print(f"  Section notes loaded: {len([k for k,v in SECTION_NOTES.items() if v.strip()])}")

# Chapter notes (extract from TS)
CHAPTER_NOTES = {}
with open('app/lib/cost-engine/gri-classifier/data/chapter-notes.ts', 'r', encoding='utf-8') as f:
    content = f.read()
    for m in re.finditer(r"chapter_number:\s*(\d+).*?chapter_note:\s*'(.*?)',\s*note_length", content, re.DOTALL):
        ch = int(m.group(1))
        note = m.group(2).replace('\\n', '\n').replace("\\'", "'")
        CHAPTER_NOTES[ch] = note
print(f"  Chapter notes loaded: {len([k for k,v in CHAPTER_NOTES.items() if v.strip()])}")

# ─── GRI Rules ─────────────────────────────

GRI_RULES = {
    1: "Classification by terms of headings and section/chapter notes",
    2: "2(a) Incomplete/unfinished articles with essential character; 2(b) Mixtures/combinations of materials",
    3: "3(a) Most specific description; 3(b) Essential character for composites/sets; 3(c) Last in numerical order",
    4: "Goods most akin to similar articles",
    5: "5(a) Cases/containers classified with contents; 5(b) Packing materials with goods",
    6: "Subheading classification: apply GRI 1-5 mutatis mutandis at subheading level",
}

# Section title lookup
SEC_TITLES = {
    1: 'Live animals; animal products', 2: 'Vegetable products',
    3: 'Animal/vegetable fats and oils', 4: 'Prepared foodstuffs; beverages; tobacco',
    5: 'Mineral products', 6: 'Products of chemical or allied industries',
    7: 'Plastics and rubber', 8: 'Raw hides, leather, furskins',
    9: 'Wood and articles of wood', 10: 'Pulp, paper, printed matter',
    11: 'Textiles and textile articles', 12: 'Footwear, headgear, umbrellas',
    13: 'Stone, ceramic, glass', 14: 'Precious metals and stones',
    15: 'Base metals', 16: 'Machinery and electrical equipment',
    17: 'Vehicles, aircraft, vessels', 18: 'Instruments, clocks, musical',
    19: 'Arms and ammunition', 20: 'Miscellaneous manufactured articles',
    21: 'Works of art, antiques',
}

# ─── Verification Logic ─────────────────────

def verify_rule(rule, chapter):
    """Verify a single expert rule against our rules data."""
    hs_code = str(rule.get('then_heading', '')).replace('.', '').replace('HS ', '').replace('HS', '').strip()
    condition = rule.get('if_condition', '')
    because = rule.get('because', '')
    watch_out = rule.get('watch_out', '')

    result = {
        'rule_id': rule.get('rule_id', ''),
        'chapter': chapter,
        'hs_code': hs_code,
        'condition': condition[:120],
        'steps': {},
        'gri_applied': [],
        'verification': 'unexplained',
        'gaps': [],
    }

    hs6 = hs_code.ljust(6, '0')[:6]
    hs4 = hs_code[:4] if len(hs_code) >= 4 else ''
    ch = chapter
    sec = CH_TO_SEC.get(ch, 0)

    explained_steps = 0

    # ─── Step 1: Section ─────
    sec_title = SEC_TITLES.get(sec, '?')
    sec_note = SECTION_NOTES.get(sec, '')
    sec_note_relevant = ''

    # Check if section note has relevant include/exclude
    cond_lower = condition.lower()
    because_lower = because.lower()
    product_words = set(re.findall(r'[a-z]{3,}', cond_lower + ' ' + because_lower))

    if sec_note:
        note_lower = sec_note.lower()
        # Find matching sentences
        for sent in re.split(r'[.;]', sec_note):
            sent_lower = sent.lower().strip()
            if not sent_lower:
                continue
            matching_words = product_words & set(re.findall(r'[a-z]{3,}', sent_lower))
            if len(matching_words) >= 2:
                sec_note_relevant = sent.strip()[:200]
                break

    result['steps']['1_section'] = {
        'section': sec,
        'title': sec_title,
        'note_relevant': sec_note_relevant if sec_note_relevant else 'No specific note matched',
        'explained': sec > 0,
    }
    if sec > 0:
        explained_steps += 1

    # ─── Step 2: Chapter ─────
    ch_desc = CHAPTERS.get(ch, '')
    ch_note = CHAPTER_NOTES.get(ch, '')
    ch_note_relevant = ''

    if ch_note:
        note_lower = ch_note.lower()
        for sent in re.split(r'[.;]', ch_note):
            sent_lower = sent.lower().strip()
            if not sent_lower:
                continue
            matching_words = product_words & set(re.findall(r'[a-z]{3,}', sent_lower))
            if len(matching_words) >= 2:
                ch_note_relevant = sent.strip()[:200]
                break

        # Also check for definition clauses
        defs = re.findall(r"['\u201c]([^'\u201d]+)['\u201d]\s*means?\s+([^.]+)", ch_note, re.I)
        for term, definition in defs:
            if term.lower() in cond_lower or term.lower() in because_lower:
                ch_note_relevant = f"Definition: '{term}' means {definition[:120]}"
                break

    result['steps']['2_chapter'] = {
        'chapter': ch,
        'description': ch_desc[:80],
        'note_relevant': ch_note_relevant if ch_note_relevant else 'No specific note matched',
        'explained': bool(ch_desc),
    }
    if ch_desc:
        explained_steps += 1

    # ─── Step 3: Heading ─────
    heading_desc = HEADINGS.get(hs4, '')
    heading_match_quality = 'none'

    if heading_desc:
        hdesc_lower = heading_desc.lower()
        matching_words = product_words & set(re.findall(r'[a-z]{3,}', hdesc_lower))
        if len(matching_words) >= 3:
            heading_match_quality = 'strong'
        elif len(matching_words) >= 1:
            heading_match_quality = 'partial'
        else:
            heading_match_quality = 'weak'

    # Find competing headings in same chapter
    ch_str = str(ch).zfill(2)
    competing = []
    for h_code, h_desc in HEADINGS.items():
        if h_code.startswith(ch_str) and h_code != hs4:
            h_lower = h_desc.lower()
            h_match = product_words & set(re.findall(r'[a-z]{3,}', h_lower))
            if len(h_match) >= 2:
                competing.append({'code': h_code, 'desc': h_desc[:60], 'shared_words': len(h_match)})

    competing.sort(key=lambda x: x['shared_words'], reverse=True)

    result['steps']['3_heading'] = {
        'heading': hs4,
        'description': heading_desc[:100],
        'match_quality': heading_match_quality,
        'competing_headings': competing[:3],
        'distinguishing_criterion': watch_out[:100] if watch_out else because[:100],
        'explained': heading_match_quality in ('strong', 'partial'),
    }
    if heading_match_quality in ('strong', 'partial'):
        explained_steps += 1

    # ─── Step 4: Subheading ─────
    sub_desc = SUBHEADINGS.get(hs6, '')
    sub_match_quality = 'none'

    if sub_desc:
        sdesc_lower = sub_desc.lower()
        matching_words = product_words & set(re.findall(r'[a-z]{3,}', sdesc_lower))
        if len(matching_words) >= 2:
            sub_match_quality = 'strong'
        elif len(matching_words) >= 1:
            sub_match_quality = 'partial'
        else:
            sub_match_quality = 'weak'

    # Determine subheading distinction criteria
    sibling_subs = {k: v for k, v in SUBHEADINGS.items() if k.startswith(hs4)}
    distinction = ''
    if len(sibling_subs) > 1:
        # Analyze what differentiates subheadings
        all_sub_descs = ' '.join(sibling_subs.values()).lower()
        if any(w in all_sub_descs for w in ['fresh', 'frozen', 'dried', 'preserved', 'crude', 'refined']):
            distinction = 'processing_level'
        elif any(w in all_sub_descs for w in ['cotton', 'wool', 'silk', 'synthetic', 'man-made', 'polyester']):
            distinction = 'material'
        elif any(w in all_sub_descs for w in ['men', 'women', 'boys', 'girls']):
            distinction = 'gender'
        elif any(w in all_sub_descs for w in ['valued', 'weight', 'exceeding', 'not exceeding']):
            distinction = 'threshold'
        elif 'other' in all_sub_descs:
            distinction = 'specificity'
        else:
            distinction = 'type'

    result['steps']['4_subheading'] = {
        'hs6': hs6,
        'description': sub_desc[:100] if sub_desc else 'Not found in HS 2022 data',
        'match_quality': sub_match_quality,
        'sibling_count': len(sibling_subs),
        'distinction_criterion': distinction,
        'explained': sub_match_quality in ('strong', 'partial') or len(hs_code) <= 4,
    }
    if sub_match_quality in ('strong', 'partial') or len(hs_code) <= 4:
        explained_steps += 1

    # ─── Step 5: GRI Rules ─────
    gri_applied = []

    # GRI 1 always applies
    gri_applied.append({'rule': 'GRI 1', 'reason': f'Heading {hs4} terms match: {heading_desc[:60]}'})

    # Check for GRI 2-6 indicators
    composite_words = {'composite', 'mixture', 'combined', 'blend', 'alloy', 'multi', 'set', 'kit'}
    incomplete_words = {'incomplete', 'unfinished', 'blank', 'semi', 'rough', 'crude'}
    container_words = {'case', 'box', 'container', 'package', 'packing'}
    part_words = {'part', 'parts', 'component', 'accessory', 'accessories'}

    all_text = (condition + ' ' + because + ' ' + watch_out).lower()

    if composite_words & set(all_text.split()):
        gri_applied.append({'rule': 'GRI 3(b)', 'reason': 'Composite/mixture: classify by essential character'})
    if incomplete_words & set(all_text.split()):
        gri_applied.append({'rule': 'GRI 2(a)', 'reason': 'Incomplete/unfinished article'})
    if container_words & set(all_text.split()):
        gri_applied.append({'rule': 'GRI 5', 'reason': 'Container/packing classified with contents'})
    if part_words & set(all_text.split()):
        gri_applied.append({'rule': 'GRI 1 + Section XVI Note 2', 'reason': 'Parts classification per section notes'})
    if len(competing) >= 2:
        gri_applied.append({'rule': 'GRI 3(a)', 'reason': f'Multiple competing headings; most specific wins'})

    # GRI 6 for subheading
    if len(hs_code) >= 6 and sub_desc:
        gri_applied.append({'rule': 'GRI 6', 'reason': 'Subheading determined by GRI 1-5 at sub-level'})

    gri_sufficient = len(gri_applied) >= 1 and gri_applied[0]['rule'] == 'GRI 1'

    result['steps']['5_gri'] = {
        'rules_applied': gri_applied,
        'gri1_sufficient': len(gri_applied) == 1 or (len(gri_applied) == 2 and gri_applied[-1]['rule'] == 'GRI 6'),
        'needs_gri2_6': len(gri_applied) > 2,
    }
    result['gri_applied'] = [g['rule'] for g in gri_applied]
    explained_steps += 1  # GRI always applies

    # ─── Final Verdict ─────
    if explained_steps >= 4:
        result['verification'] = 'verified'
    elif explained_steps >= 2:
        result['verification'] = 'partial'
    else:
        result['verification'] = 'unexplained'

    # Identify gaps
    if not sec_note_relevant or sec_note_relevant == 'No specific note matched':
        result['gaps'].append('No Section Note matched product keywords')
    if not ch_note_relevant or ch_note_relevant == 'No specific note matched':
        result['gaps'].append('No Chapter Note matched product keywords')
    if heading_match_quality == 'weak':
        result['gaps'].append(f'Heading {hs4} description has weak keyword match with product')
    if heading_match_quality == 'none':
        result['gaps'].append(f'Heading {hs4} not found in heading-descriptions data')
    if sub_match_quality == 'none' and len(hs_code) >= 6:
        result['gaps'].append(f'Subheading {hs6} not found in subheading-descriptions data')
    if len(competing) >= 3:
        result['gaps'].append(f'{len(competing)} competing headings — conflict resolution needed')

    return result


def main():
    # Load expert rules
    with open('/Volumes/soulmaten/POTAL/hs_correlation/chapter_expert_rules.json') as f:
        expert_rules = json.load(f)

    print(f"\nVerifying 476 expert rules against rules data...")

    all_verifications = []
    stats = {'verified': 0, 'partial': 0, 'unexplained': 0}
    gri_stats = {}
    gap_stats = {}

    for ch_str, data in sorted(expert_rules.items(), key=lambda x: int(x[0])):
        if 'error' in data:
            continue
        ch = int(ch_str)
        for rule in data.get('decision_rules', []):
            v = verify_rule(rule, ch)
            all_verifications.append(v)
            stats[v['verification']] += 1

            for g in v['gri_applied']:
                gri_stats[g] = gri_stats.get(g, 0) + 1
            for gap in v['gaps']:
                gap_key = gap.split(':')[0] if ':' in gap else gap[:40]
                gap_stats[gap_key] = gap_stats.get(gap_key, 0) + 1

        if ch % 20 == 0:
            print(f"  Processed through Ch.{ch:02d}...")

    # Save
    output = {
        'summary': {
            'total_rules': len(all_verifications),
            'verified': stats['verified'],
            'partial': stats['partial'],
            'unexplained': stats['unexplained'],
            'verified_pct': round(stats['verified'] / len(all_verifications) * 100, 1),
            'partial_pct': round(stats['partial'] / len(all_verifications) * 100, 1),
            'unexplained_pct': round(stats['unexplained'] / len(all_verifications) * 100, 1),
        },
        'gri_distribution': dict(sorted(gri_stats.items(), key=lambda x: x[1], reverse=True)),
        'common_gaps': dict(sorted(gap_stats.items(), key=lambda x: x[1], reverse=True)[:15]),
        'verifications': all_verifications,
    }

    with open(OUTPUT, 'w', encoding='utf-8') as f:
        json.dump(output, f, indent=2, ensure_ascii=False)

    # Print report
    print(f"\n{'='*60}")
    print("EXPERT RULES VERIFICATION REPORT")
    print(f"{'='*60}")
    print(f"\nTotal rules verified: {len(all_verifications)}")
    print(f"  ✅ Verified (fully explained):  {stats['verified']} ({stats['verified']/len(all_verifications)*100:.1f}%)")
    print(f"  ⚠️  Partial (some gaps):         {stats['partial']} ({stats['partial']/len(all_verifications)*100:.1f}%)")
    print(f"  ❌ Unexplained:                  {stats['unexplained']} ({stats['unexplained']/len(all_verifications)*100:.1f}%)")

    print(f"\nGRI Rule Distribution:")
    for rule, count in sorted(gri_stats.items(), key=lambda x: x[1], reverse=True)[:8]:
        print(f"  {rule}: {count} rules")

    print(f"\nMost Common Gaps (rules data limitations):")
    for gap, count in sorted(gap_stats.items(), key=lambda x: x[1], reverse=True)[:10]:
        print(f"  {gap[:55]}: {count}")

    # Show samples of each category
    for cat in ['verified', 'partial', 'unexplained']:
        samples = [v for v in all_verifications if v['verification'] == cat][:3]
        if samples:
            print(f"\n{'─'*60}")
            print(f"Sample {cat.upper()} rules:")
            for s in samples:
                print(f"  [{s['rule_id']}] Ch.{s['chapter']:02d} → {s['hs_code']}")
                print(f"    Condition: {s['condition'][:70]}")
                h_step = s['steps'].get('3_heading', {})
                print(f"    Heading match: {h_step.get('match_quality','?')} — {h_step.get('description','')[:50]}")
                print(f"    GRI: {', '.join(s['gri_applied'][:3])}")
                if s['gaps']:
                    print(f"    Gaps: {s['gaps'][0][:60]}")

    print(f"\nSaved: {OUTPUT}")


if __name__ == '__main__':
    main()
