#!/usr/bin/env python3
"""
Extract product_name + HS code mappings from CBP CROSS Rulings.
Source: /Volumes/soulmaten/POTAL/regulations/us/cross_rulings/batches/
Output: /Volumes/soulmaten/POTAL/cbp_cross_hs_mappings.csv

Expected yield: ~31,000+ mappings from 39,430 rulings (31,553 with tariffs).
Focus: industrial/specialty products that WDC consumer data doesn't cover.
"""

import json
import csv
import os
import re
import sys
from collections import Counter

BASE_DIR = '/Volumes/soulmaten/POTAL/regulations/us/cross_rulings/batches'
OUTPUT_CSV = '/Volumes/soulmaten/POTAL/cbp_cross_hs_mappings.csv'
OUTPUT_STATS = '/Volumes/soulmaten/POTAL/cbp_cross_extraction_stats.json'


def extract_product_name(ruling: dict) -> str:
    """Extract clean product name from ruling subject or RE: line."""
    subject = ruling.get('subject', '')
    text = ruling.get('text', '')

    # 1. Try RE: line in text (most precise)
    m = re.search(r'RE:\s*(?:The tariff classification of\s+)(.*?)(?:\s*Dear|\n)', text, re.IGNORECASE)
    if m:
        name = m.group(1).strip()
        if len(name) > 5:
            return clean_name(name)

    # 2. From subject field
    name = re.sub(
        r'^(Reconsideration of [A-Z0-9]+;?\s*|'
        r'Internal Advice:?\s*|'
        r'The tariff classification of\s+|'
        r'[Cc]lassification of\s+|'
        r'Revocation of [A-Z0-9]+;?\s*|'
        r'Modification of [A-Z0-9]+;?\s*)',
        '', subject, flags=re.IGNORECASE
    ).strip()

    if len(name) < 3:
        name = subject

    return clean_name(name)


def clean_name(name: str) -> str:
    """Clean product name."""
    # Remove origin country suffix
    name = re.sub(r'\s+from\s+[\w\s,]+$', '', name, flags=re.IGNORECASE)
    # Remove trailing periods/whitespace
    name = name.strip(' .\t\r\n')
    # Collapse whitespace
    name = re.sub(r'\s+', ' ', name)
    return name[:300]


def extract_description(text: str) -> str:
    """Extract product description from ruling text."""
    if not text:
        return ""

    text_clean = re.sub(r'\r+', '\n', text)

    patterns = [
        r'(The (?:subject |instant )?(?:merchandise|articles?|products?|items?|goods?)\s+(?:is|are|consists?|has been|under consideration)[^.]*\.(?:\s+[A-Z][^.]*\.)?)',
        r'(Item\s+#?\d+[^.]*?\.(?:\s+[A-Z][^.]*?\.)?)',
        r'(The (?:first|second|third)\s+(?:item|product|article|vehicle)[^.]*?\.(?:\s+[^.]*?\.)?)',
        r'(You (?:state|describe|indicate) that[^.]*?\.)',
        r'(It is (?:a |an )[^.]*?\.)',
    ]

    for pat in patterns:
        matches = re.findall(pat, text_clean, re.IGNORECASE | re.DOTALL)
        for m in matches:
            desc = re.sub(r'\s+', ' ', m.strip())
            if 30 < len(desc) < 600:
                return desc[:400]

    # Fallback: after "Dear ..."
    m = re.search(r'Dear\s+\w+\.?\s+\w+:?\s*\n*(.*?)(\n\n|\n[A-Z]{3,})', text_clean, re.DOTALL)
    if m:
        after = re.sub(r'\s+', ' ', m.group(1).strip())
        if len(after) > 30:
            return after[:400]

    return ""


def process_all_batches():
    """Process all batch files and extract mappings."""
    all_mappings = []
    stats = Counter()
    chapter_counts = Counter()
    seen_names = set()  # Dedup by (product_name_lower, hs6)

    batch_files = sorted(f for f in os.listdir(BASE_DIR) if f.endswith('.json'))
    print(f"Processing {len(batch_files)} batch files...")

    for bf in batch_files:
        path = os.path.join(BASE_DIR, bf)
        with open(path) as f:
            rulings = json.load(f)

        stats['total_rulings'] += len(rulings)

        for ruling in rulings:
            tariffs = ruling.get('tariffs', [])
            if not tariffs:
                stats['no_tariffs'] += 1
                continue

            # Filter valid tariffs (8+ digits, not chapter 99/98)
            valid_tariffs = []
            for t in tariffs:
                digits = t.replace('.', '')
                if len(digits) >= 6 and not t.startswith('99') and not t.startswith('98'):
                    valid_tariffs.append(t)

            if not valid_tariffs:
                stats['only_ch99_98'] += 1
                continue

            product_name = extract_product_name(ruling)
            if len(product_name) < 3:
                stats['name_too_short'] += 1
                continue

            description = extract_description(ruling.get('text', ''))

            # Use primary tariff
            hts_code = valid_tariffs[0]
            hs6 = hts_code.replace('.', '')[:6]
            chapter = hs6[:2]

            # Dedup
            dedup_key = (product_name.lower().strip(), hs6)
            if dedup_key in seen_names:
                stats['duplicates'] += 1
                continue
            seen_names.add(dedup_key)

            chapter_counts[chapter] += 1
            stats['extracted'] += 1

            all_mappings.append({
                'product_name': product_name,
                'description': description,
                'hts_code': hts_code,
                'hs6_code': hs6,
                'hs_chapter': chapter,
                'ruling_number': ruling.get('rulingNumber', ''),
                'ruling_date': ruling.get('rulingDate', ''),
                'source': 'cbp_cross',
                'all_tariffs': '|'.join(valid_tariffs),
            })

        print(f"  {bf}: {len(rulings)} rulings → {stats['extracted']} total extracted so far")

    return all_mappings, stats, chapter_counts


def main():
    print("=" * 60)
    print("CBP CROSS Rulings → HS Mapping Extraction")
    print("=" * 60)

    mappings, stats, chapters = process_all_batches()

    # Sort by chapter
    mappings.sort(key=lambda x: (x['hs_chapter'], x['product_name']))

    # Write CSV
    print(f"\nWriting {len(mappings)} mappings to {OUTPUT_CSV}...")
    with open(OUTPUT_CSV, 'w', newline='', encoding='utf-8') as f:
        writer = csv.DictWriter(f, fieldnames=[
            'product_name', 'description', 'hts_code', 'hs6_code',
            'hs_chapter', 'ruling_number', 'ruling_date', 'source', 'all_tariffs'
        ])
        writer.writeheader()
        writer.writerows(mappings)

    # Industrial chapters analysis
    industrial_chapters = {
        '28': 'Inorganic chemicals',
        '29': 'Organic chemicals',
        '30': 'Pharmaceuticals',
        '31': 'Fertilizers',
        '32': 'Dyes/pigments',
        '34': 'Soap/wax',
        '38': 'Chemical products',
        '39': 'Plastics',
        '40': 'Rubber',
        '72': 'Iron/steel',
        '73': 'Iron/steel articles',
        '74': 'Copper',
        '75': 'Nickel',
        '76': 'Aluminum',
        '81': 'Base metals',
        '82': 'Tools',
        '83': 'Metal articles',
        '84': 'Machinery',
        '85': 'Electrical machinery',
        '86': 'Railway',
        '87': 'Vehicles',
        '88': 'Aircraft',
        '89': 'Ships',
        '90': 'Instruments',
    }

    industrial_count = sum(chapters.get(ch, 0) for ch in industrial_chapters)

    # Stats
    stats_output = {
        'total_rulings': stats['total_rulings'],
        'no_tariffs': stats['no_tariffs'],
        'only_ch99_98': stats['only_ch99_98'],
        'name_too_short': stats['name_too_short'],
        'duplicates': stats['duplicates'],
        'extracted': stats['extracted'],
        'industrial_mappings': industrial_count,
        'consumer_mappings': stats['extracted'] - industrial_count,
        'chapters_covered': len(chapters),
        'top_chapters': dict(chapters.most_common(20)),
        'industrial_breakdown': {ch: chapters.get(ch, 0) for ch in sorted(industrial_chapters) if chapters.get(ch, 0) > 0},
    }

    with open(OUTPUT_STATS, 'w') as f:
        json.dump(stats_output, f, indent=2)

    print(f"\n{'=' * 60}")
    print(f"EXTRACTION COMPLETE")
    print(f"{'=' * 60}")
    print(f"Total rulings processed: {stats['total_rulings']:,}")
    print(f"Extracted mappings:      {stats['extracted']:,}")
    print(f"  Industrial:            {industrial_count:,}")
    print(f"  Consumer/other:        {stats['extracted'] - industrial_count:,}")
    print(f"Duplicates removed:      {stats['duplicates']:,}")
    print(f"HS chapters covered:     {len(chapters)}")
    print(f"\nOutput: {OUTPUT_CSV}")
    print(f"Stats:  {OUTPUT_STATS}")

    print(f"\nTop 15 chapters:")
    for ch, cnt in chapters.most_common(15):
        label = industrial_chapters.get(ch, '')
        ind = ' [INDUSTRIAL]' if ch in industrial_chapters else ''
        print(f"  Ch.{ch}: {cnt:,} mappings{ind} {label}")


if __name__ == '__main__':
    main()
