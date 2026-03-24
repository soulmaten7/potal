#!/usr/bin/env python3
"""
Stage 1: Extract conflict patterns from CBP CROSS + EU EBTI rulings.
Groups by HS chapter, finds products classified under different headings,
and creates structured conflict pattern JSON files.
"""

import csv
import json
import os
import re
import sys
from collections import defaultdict
from pathlib import Path

# Paths
CBP_CSV = "/Volumes/soulmaten/POTAL/cbp_cross_combined_mappings.csv"
EBTI_CSV = "/Volumes/soulmaten/POTAL/regulations/eu_ebti/ebti_for_db.csv"
SECTION_NOTES = "/Volumes/soulmaten/POTAL/hs_classification_rules/section_notes.json"
CHAPTER_NOTES = "/Volumes/soulmaten/POTAL/hs_classification_rules/chapter_notes.json"
OUTPUT_DIR = "/Volumes/soulmaten/POTAL/hs_classification_rules/conflict_patterns"

# Stopwords for keyword extraction
STOPWORDS = {
    'the', 'a', 'an', 'of', 'for', 'with', 'made', 'from', 'in', 'to', 'and',
    'or', 'is', 'are', 'was', 'were', 'be', 'been', 'being', 'has', 'have',
    'had', 'do', 'does', 'did', 'will', 'would', 'could', 'should', 'may',
    'might', 'shall', 'can', 'not', 'no', 'nor', 'but', 'so', 'yet', 'both',
    'each', 'every', 'all', 'any', 'few', 'more', 'most', 'other', 'some',
    'such', 'than', 'too', 'very', 'just', 'about', 'above', 'after', 'again',
    'against', 'between', 'into', 'through', 'during', 'before', 'after',
    'up', 'down', 'out', 'off', 'over', 'under', 'further', 'then', 'once',
    'here', 'there', 'when', 'where', 'why', 'how', 'this', 'that', 'these',
    'those', 'it', 'its', 'by', 'on', 'at', 'as', 'if', 'which', 'who',
    'whom', 'what', 'per', 'etc', 'also', 'used', 'using', 'use', 'type',
    'style', 'containing', 'consisting', 'composed', 'comprising', 'including',
    'application', 'protest', 'review', 'contesting', 'denial', 'deduction',
    'item', 'tsus', 'affirmed', 'ny', 'hq', 'value', 'classification',
}

# GRI rules mapping
GRI_RULES = {
    'essential_character': 'GRI 3(b) — essential character',
    'most_specific': 'GRI 3(a) — most specific description',
    'last_numerical': 'GRI 3(c) — last in numerical order',
    'heading_terms': 'GRI 1 — terms of headings and notes',
    'incomplete': 'GRI 2(a) — incomplete/unfinished articles',
    'mixtures': 'GRI 2(b) — mixtures and combinations',
    'containers': 'GRI 5 — containers and packing',
    'subheading': 'GRI 6 — subheading classification',
}


def extract_keywords(text):
    """Extract meaningful keywords from product name."""
    if not text or not isinstance(text, str):
        return []
    text = text.lower()
    text = re.sub(r'[^a-z0-9\s\-]', ' ', text)
    text = re.sub(r'\b(ny|hq)\s*[a-z]?\d+\b', '', text)  # Remove ruling refs
    text = re.sub(r'\b\d{4,}\b', '', text)  # Remove long numbers
    words = text.split()
    keywords = [w for w in words if w not in STOPWORDS and len(w) > 1]
    return list(dict.fromkeys(keywords))  # Dedupe preserving order


def clean_hs_code(code):
    """Clean HS code to get 6-digit and 4-digit versions."""
    if not code:
        return None, None
    code = str(code).strip().lstrip('(').rstrip(')')
    code = re.sub(r'[^0-9]', '', code)
    if len(code) < 4:
        return None, None
    hs6 = code[:6].ljust(6, '0')
    hs4 = code[:4]
    return hs6, hs4


def get_chapter(hs_code):
    """Extract chapter number from HS code."""
    hs6, _ = clean_hs_code(hs_code)
    if not hs6:
        return None
    try:
        ch = int(hs6[:2])
        return ch if 1 <= ch <= 97 else None
    except (ValueError, TypeError):
        return None


def load_cbp_data():
    """Load CBP CROSS mappings."""
    records = []
    with open(CBP_CSV, 'r', encoding='utf-8', errors='replace') as f:
        reader = csv.DictReader(f)
        for row in reader:
            name = row.get('product_name', '').strip()
            hs6_raw = row.get('hs6_code', '')
            if not name or not hs6_raw:
                continue
            hs6, hs4 = clean_hs_code(hs6_raw)
            if not hs6 or not hs4:
                continue
            ch = get_chapter(hs6)
            if not ch:
                continue
            keywords = extract_keywords(name)
            if len(keywords) < 1:
                continue
            records.append({
                'product_name': name[:200],
                'hs6': hs6,
                'hs4': hs4,
                'chapter': ch,
                'keywords': keywords,
                'source': 'cbp',
                'ruling_ref': row.get('ruling_number', ''),
            })
    return records


def load_ebti_data():
    """Load EU EBTI mappings."""
    records = []
    try:
        with open(EBTI_CSV, 'r', encoding='utf-8', errors='replace') as f:
            reader = csv.DictReader(f)
            for row in reader:
                name = row.get('product_name', '').strip()
                hs6_raw = row.get('hs6_code', '')
                if not name or not hs6_raw:
                    continue
                hs6, hs4 = clean_hs_code(hs6_raw)
                if not hs6 or not hs4:
                    continue
                ch = get_chapter(hs6)
                if not ch:
                    continue
                keywords = extract_keywords(name)
                if len(keywords) < 1:
                    continue
                records.append({
                    'product_name': name[:200],
                    'hs6': hs6,
                    'hs4': hs4,
                    'chapter': ch,
                    'keywords': keywords,
                    'source': 'ebti',
                    'ruling_ref': row.get('ruling_ref', ''),
                })
    except Exception as e:
        print(f"  Warning: EBTI load error: {e}")
    return records


def find_keyword_overlaps(records_by_chapter):
    """Find products with similar keywords classified under different headings."""
    patterns = {}

    for chapter, records in records_by_chapter.items():
        if len(records) < 2:
            continue

        # Group by heading (4-digit)
        heading_groups = defaultdict(list)
        for r in records:
            heading_groups[r['hs4']].append(r)

        if len(heading_groups) < 2:
            continue

        # Build keyword → headings index
        keyword_headings = defaultdict(lambda: defaultdict(list))
        for r in records:
            for kw in r['keywords'][:10]:  # Limit keywords per record
                keyword_headings[kw][r['hs4']].append(r)

        # Find keywords that appear in 2+ different headings
        conflict_keywords = {}
        for kw, headings_dict in keyword_headings.items():
            if len(headings_dict) >= 2:
                total_count = sum(len(v) for v in headings_dict.values())
                if total_count >= 3:  # Minimum occurrences
                    conflict_keywords[kw] = headings_dict

        # Build conflict patterns from overlapping keywords
        chapter_patterns = []
        seen_heading_pairs = set()

        for kw, headings_dict in sorted(conflict_keywords.items(),
                                         key=lambda x: sum(len(v) for v in x[1].values()),
                                         reverse=True):
            sorted_headings = sorted(headings_dict.keys(),
                                      key=lambda h: len(headings_dict[h]),
                                      reverse=True)

            for i in range(len(sorted_headings)):
                for j in range(i + 1, min(i + 3, len(sorted_headings))):
                    h1, h2 = sorted_headings[i], sorted_headings[j]
                    pair_key = tuple(sorted([h1, h2]))
                    if pair_key in seen_heading_pairs:
                        continue
                    seen_heading_pairs.add(pair_key)

                    # Collect all keywords shared between these headings
                    shared_kws = []
                    for other_kw, other_hd in conflict_keywords.items():
                        if h1 in other_hd and h2 in other_hd:
                            shared_kws.append(other_kw)

                    if len(shared_kws) < 1:
                        continue

                    h1_count = len(headings_dict[h1])
                    h2_count = len(headings_dict[h2])
                    # The heading with more rulings is "correct" (majority rule)
                    correct = h1 if h1_count >= h2_count else h2
                    wrong = h2 if correct == h1 else h1

                    # Get sample descriptions
                    h1_samples = [r['product_name'] for r in headings_dict[h1][:3]]
                    h2_samples = [r['product_name'] for r in headings_dict[h2][:3]]

                    # Count by source
                    cbp_count = sum(1 for r in headings_dict[h1] + headings_dict[h2] if r['source'] == 'cbp')
                    ebti_count = sum(1 for r in headings_dict[h1] + headings_dict[h2] if r['source'] == 'ebti')

                    # Determine GRI rule
                    gri_rule = determine_gri_rule(h1, h2, shared_kws, chapter)

                    # Collect ruling refs
                    ruling_refs = []
                    for r in (headings_dict[h1] + headings_dict[h2])[:5]:
                        if r.get('ruling_ref'):
                            ruling_refs.append(str(r['ruling_ref']))

                    pattern_id = f"ch{chapter:02d}_{len(chapter_patterns)+1:03d}"
                    pattern = {
                        'pattern_id': pattern_id,
                        'chapter': chapter,
                        'pattern_name': f"'{' / '.join(shared_kws[:3])}' classified under {h1} vs {h2}",
                        'conflict_headings': [h1, h2],
                        'correct_heading': correct,
                        'decision_criteria': {
                            'primary': f"Majority of rulings ({max(h1_count,h2_count)} vs {min(h1_count,h2_count)}) classify under {correct}",
                            'indicators': [
                                f"Product primarily described as {correct}-type goods",
                                f"Keywords: {', '.join(shared_kws[:5])}",
                            ],
                        },
                        'rejection_reason': f"Heading {wrong} applies when the product's primary function/material aligns with {wrong} description",
                        'exceptions': [
                            f"If the product's essential character is {wrong}-type, classify under {wrong}",
                        ],
                        'related_rulings': ruling_refs,
                        'gri_rule_applied': gri_rule,
                        'keywords': shared_kws[:15],
                        'source_count': {'cbp': cbp_count, 'ebti': ebti_count},
                    }
                    chapter_patterns.append(pattern)

        patterns[chapter] = chapter_patterns

    return patterns


def determine_gri_rule(h1, h2, keywords, chapter):
    """Determine which GRI rule likely applies to resolve this conflict."""
    # Same chapter, different headings → usually GRI 1 or GRI 3(a)
    if h1[:2] == h2[:2]:
        # Check if keywords suggest mixture/composite
        material_kws = {'mixed', 'composite', 'combination', 'blend', 'alloy',
                       'mixture', 'combined', 'hybrid', 'multi'}
        if any(kw in material_kws for kw in keywords):
            return GRI_RULES['essential_character']

        part_kws = {'part', 'parts', 'component', 'accessory', 'accessories',
                    'attachment', 'fitting', 'fittings'}
        if any(kw in part_kws for kw in keywords):
            return GRI_RULES['heading_terms']

        set_kws = {'set', 'kit', 'assortment', 'collection', 'outfit'}
        if any(kw in set_kws for kw in keywords):
            return GRI_RULES['essential_character']

        return GRI_RULES['most_specific']

    # Different chapters → usually GRI 1 (section/chapter notes define scope)
    return GRI_RULES['heading_terms']


def load_chapter_notes():
    """Load chapter notes for enriching patterns."""
    try:
        with open(CHAPTER_NOTES, 'r') as f:
            return json.load(f)
    except Exception:
        return []


def main():
    print("=" * 60)
    print("Stage 1: Conflict Pattern Extraction")
    print("=" * 60)

    # Step 1: Load data
    print("\nStep 1: Loading data...")
    cbp_records = load_cbp_data()
    print(f"  CBP CROSS: {len(cbp_records)} records loaded")

    ebti_records = load_ebti_data()
    print(f"  EU EBTI:   {len(ebti_records)} records loaded")

    all_records = cbp_records + ebti_records
    print(f"  Total:     {len(all_records)} records")

    # Group by chapter
    records_by_chapter = defaultdict(list)
    for r in all_records:
        records_by_chapter[r['chapter']].append(r)

    print(f"\n  Chapters with data: {len(records_by_chapter)}")
    top_chapters = sorted(records_by_chapter.items(), key=lambda x: len(x[1]), reverse=True)[:10]
    print("  Top 10 chapters by record count:")
    for ch, recs in top_chapters:
        print(f"    Ch.{ch:02d}: {len(recs)} records")

    # Step 2: Extract conflict patterns
    print("\nStep 2: Extracting conflict patterns...")
    patterns = find_keyword_overlaps(records_by_chapter)

    total_patterns = sum(len(p) for p in patterns.values())
    print(f"  Total conflict patterns found: {total_patterns}")

    # Step 3-5: Save patterns
    print("\nStep 3-5: Saving patterns...")
    index_data = {
        'total_patterns': 0,
        'total_chapters_with_patterns': 0,
        'total_hs_codes_covered': 0,
        'chapters': {},
        'gri_rule_distribution': defaultdict(int),
    }

    all_hs_codes = set()
    chapters_processed = 0

    for ch_num in range(1, 98):
        ch_patterns = patterns.get(ch_num, [])

        # Count HS codes covered
        for p in ch_patterns:
            for h in p.get('conflict_headings', []):
                all_hs_codes.add(h)
            index_data['gri_rule_distribution'][p.get('gri_rule_applied', 'unknown')] += 1

        ch_file = {
            'chapter': ch_num,
            'pattern_count': len(ch_patterns),
            'patterns': ch_patterns if ch_patterns else [],
        }

        if not ch_patterns:
            ch_file['no_conflicts_found'] = True

        filepath = os.path.join(OUTPUT_DIR, f"ch{ch_num:02d}_patterns.json")
        with open(filepath, 'w', encoding='utf-8') as f:
            json.dump(ch_file, f, indent=2, ensure_ascii=False)

        index_data['chapters'][ch_num] = {
            'pattern_count': len(ch_patterns),
            'file': f"ch{ch_num:02d}_patterns.json",
        }

        chapters_processed += 1
        if chapters_processed % 10 == 0:
            print(f"  Processed {chapters_processed}/97 chapters...")

    index_data['total_patterns'] = total_patterns
    index_data['total_chapters_with_patterns'] = sum(1 for p in patterns.values() if p)
    index_data['total_hs_codes_covered'] = len(all_hs_codes)
    index_data['gri_rule_distribution'] = dict(index_data['gri_rule_distribution'])

    # Save index
    with open(os.path.join(OUTPUT_DIR, 'index.json'), 'w') as f:
        json.dump(index_data, f, indent=2)

    # Top 10 chapters by pattern count
    top_pattern_chapters = sorted(
        [(ch, len(p)) for ch, p in patterns.items() if p],
        key=lambda x: x[1], reverse=True
    )[:10]

    # Save summary
    summary_lines = [
        "# Conflict Pattern Summary",
        f"\n**Generated:** 2026-03-17",
        f"**Data Sources:** CBP CROSS ({len(cbp_records)} records) + EU EBTI ({len(ebti_records)} records)",
        f"\n## Statistics",
        f"- Total conflict patterns: **{total_patterns}**",
        f"- Chapters with patterns: **{index_data['total_chapters_with_patterns']}** / 97",
        f"- HS Headings covered: **{len(all_hs_codes)}**",
        f"\n## Top 10 Chapters by Pattern Count",
    ]
    for ch, cnt in top_pattern_chapters:
        summary_lines.append(f"- Ch.{ch:02d}: {cnt} patterns")

    summary_lines.append(f"\n## GRI Rule Distribution")
    for rule, cnt in sorted(index_data['gri_rule_distribution'].items(), key=lambda x: x[1], reverse=True):
        summary_lines.append(f"- {rule}: {cnt}")

    with open(os.path.join(OUTPUT_DIR, 'SUMMARY.md'), 'w') as f:
        f.write('\n'.join(summary_lines))

    # Final output
    print(f"\n{'='*60}")
    print(f"Stage 1 Results:")
    print(f"  Total patterns: {total_patterns}")
    print(f"  Chapters with patterns: {index_data['total_chapters_with_patterns']}/97")
    print(f"  HS Headings covered: {len(all_hs_codes)}")
    print(f"\n  Top 10 chapters:")
    for ch, cnt in top_pattern_chapters:
        print(f"    Ch.{ch:02d}: {cnt} patterns")
    print(f"\n  GRI Rule Distribution:")
    for rule, cnt in sorted(index_data['gri_rule_distribution'].items(), key=lambda x: x[1], reverse=True):
        print(f"    {rule}: {cnt}")
    print(f"\n  Files saved to: {OUTPUT_DIR}")
    print(f"  97 chapter files + index.json + SUMMARY.md")


if __name__ == '__main__':
    main()
