#!/usr/bin/env python3
"""
HS Code Correlation & Conversion
- Parses UN HS 2022↔2017↔2012 correlation tables
- Converts CBP CROSS (142K) + EBTI (232K) HS codes to HS 2022
- Reports: (1) unchanged, (2) auto-converted 1:1, (3) split/needs judgment
"""

import openpyxl
import csv
import json
import os
import re
from collections import defaultdict

# Paths
HS2022_2017 = '/tmp/HS2022_to_HS2017.xlsx'
HS2022_2012 = '/tmp/HS2022_to_HS2012.xlsx'
HS2017_2012 = '/tmp/HS2017_to_HS2012.xlsx'
CBP_CSV = '/Volumes/soulmaten/POTAL/cbp_cross_combined_mappings.csv'
EBTI_CSV = '/Volumes/soulmaten/POTAL/regulations/eu_ebti/ebti_for_db.csv'
OUTPUT_DIR = '/Volumes/soulmaten/POTAL/hs_correlation'

os.makedirs(OUTPUT_DIR, exist_ok=True)


def parse_correlation_sheet(filepath, sheet_name, from_col_name, to_col_name):
    """Parse a correlation sheet into forward and reverse maps."""
    wb = openpyxl.load_workbook(filepath, read_only=True)
    ws = wb[sheet_name]

    # Build mappings: old→new (reverse of table since table is HS2022→older)
    # Actually the table lists HS2022 in col A and older in col B
    # So to go FROM older TO HS2022, we reverse: col B → col A

    forward = defaultdict(list)  # older_hs6 → [hs2022_codes]
    relationships = {}  # (older, newer) → relationship type

    header_found = False
    for row in ws.iter_rows(values_only=True):
        if not row or not row[0]:
            continue

        col_a = str(row[0]).strip()
        col_b = str(row[1]).strip() if row[1] else ''
        rel = str(row[2]).strip() if len(row) > 2 and row[2] else '1:1'

        # Skip header rows
        if 'HS' in col_a.upper() or 'FROM' in col_a.upper() or 'BETWEEN' in col_a.upper():
            header_found = True
            continue

        if not col_b or not col_a:
            continue

        # Clean codes
        hs2022 = re.sub(r'[^0-9]', '', col_a).ljust(6, '0')[:6]
        older = re.sub(r'[^0-9]', '', col_b).ljust(6, '0')[:6]

        if len(hs2022) >= 4 and len(older) >= 4:
            forward[older].append(hs2022)
            relationships[(older, hs2022)] = rel

    wb.close()
    return dict(forward), relationships


def build_conversion_maps():
    """Build older→HS2022 conversion maps."""
    print("Parsing UN HS Correlation Tables...")

    # HS2017→HS2022 (from HS2022→HS2017 correlation, reversed)
    map_2017_to_2022, rel_2017 = parse_correlation_sheet(
        HS2022_2017, 'HS2022-HS2017 Correlations', 'HS2022', 'HS2017')
    print(f"  HS2017→HS2022: {len(map_2017_to_2022)} entries")

    # HS2012→HS2022 (from HS2022→HS2012 correlation, reversed)
    map_2012_to_2022, rel_2012 = parse_correlation_sheet(
        HS2022_2012, 'HS2022-HS2012 Correlations', 'HS2022', 'HS2012')
    print(f"  HS2012→HS2022: {len(map_2012_to_2022)} entries")

    # HS2012→HS2017 (from HS2017→HS2012, reversed)
    map_2012_to_2017, rel_2012_17 = parse_correlation_sheet(
        HS2017_2012, 'Correlation HS17-HS12', 'HS 2017', 'HS 2012')
    print(f"  HS2012→HS2017: {len(map_2012_to_2017)} entries")

    # Count relationship types
    for name, rels in [("2017→2022", rel_2017), ("2012→2022", rel_2012)]:
        types = defaultdict(int)
        for v in rels.values():
            types[v] += 1
        print(f"  {name} relationships: {dict(types)}")

    return map_2017_to_2022, map_2012_to_2022, map_2012_to_2017


def get_hs2022_codes():
    """Get set of valid HS 2022 codes from our subheading-descriptions."""
    try:
        # Parse from the TypeScript file
        ts_path = 'app/lib/cost-engine/gri-classifier/data/subheading-descriptions.ts'
        with open(ts_path, 'r') as f:
            content = f.read()
        codes = set(re.findall(r"'(\d{6})':", content))
        print(f"  HS 2022 valid codes: {len(codes)}")
        return codes
    except Exception as e:
        print(f"  Warning: Could not load HS 2022 codes: {e}")
        return set()


def clean_hs6(code):
    """Clean HS code to 6 digits."""
    if not code:
        return None
    code = str(code).strip().lstrip('(').rstrip(')')
    code = re.sub(r'[^0-9]', '', code)
    if len(code) < 4:
        return None
    return code[:6].ljust(6, '0')


def convert_code(hs6, hs2022_codes, map_2017, map_2012):
    """
    Convert an HS code to HS 2022.
    Returns (converted_code, status, details)
    Status: 'unchanged' | 'auto_1to1' | 'split_judgment' | 'not_found'
    """
    if not hs6 or len(hs6) < 6:
        return hs6, 'invalid', 'Code too short'

    # 1. Already HS 2022?
    if hs6 in hs2022_codes:
        return hs6, 'unchanged', 'Valid HS 2022 code'

    # 2. Try HS2017→HS2022 mapping
    if hs6 in map_2017:
        targets = map_2017[hs6]
        unique_targets = list(set(targets))
        if len(unique_targets) == 1:
            return unique_targets[0], 'auto_1to1', f'HS2017→HS2022: {hs6}→{unique_targets[0]}'
        else:
            return unique_targets[0], 'split_judgment', f'HS2017→HS2022 split: {hs6}→{",".join(unique_targets[:5])}'

    # 3. Try HS2012→HS2022 mapping
    if hs6 in map_2012:
        targets = map_2012[hs6]
        unique_targets = list(set(targets))
        if len(unique_targets) == 1:
            return unique_targets[0], 'auto_1to1', f'HS2012→HS2022: {hs6}→{unique_targets[0]}'
        else:
            return unique_targets[0], 'split_judgment', f'HS2012→HS2022 split: {hs6}→{",".join(unique_targets[:5])}'

    # 4. Not found in any mapping — might be a valid HS 2022 code with slightly different format
    # Try matching by first 4 digits
    hs4 = hs6[:4]
    for valid_code in hs2022_codes:
        if valid_code.startswith(hs4):
            return hs6, 'unchanged', f'Heading {hs4} exists in HS 2022, keeping original'

    return hs6, 'not_found', f'Code {hs6} not in any conversion table'


def process_cbp():
    """Process CBP CROSS mappings."""
    print("\n" + "="*60)
    print("Processing CBP CROSS...")
    records = []
    with open(CBP_CSV, 'r', encoding='utf-8', errors='replace') as f:
        reader = csv.DictReader(f)
        for row in reader:
            hs6 = clean_hs6(row.get('hs6_code', ''))
            if hs6:
                records.append({
                    'product_name': row.get('product_name', '')[:200],
                    'original_hs6': hs6,
                    'hts_code': row.get('hts_code', ''),
                    'ruling_number': row.get('ruling_number', ''),
                    'source': 'cbp_cross',
                })
    print(f"  Loaded: {len(records)} records")
    return records


def process_ebti():
    """Process EU EBTI mappings."""
    print("\nProcessing EU EBTI...")
    records = []
    with open(EBTI_CSV, 'r', encoding='utf-8', errors='replace') as f:
        reader = csv.DictReader(f)
        for row in reader:
            hs6 = clean_hs6(row.get('hs6_code', ''))
            if hs6:
                records.append({
                    'product_name': row.get('product_name', '')[:200],
                    'original_hs6': hs6,
                    'ruling_ref': row.get('ruling_ref', ''),
                    'source': 'eu_ebti',
                })
    print(f"  Loaded: {len(records)} records")
    return records


def main():
    print("="*60)
    print("HS Code Correlation & Conversion to HS 2022")
    print("="*60)

    # Build conversion maps
    map_2017, map_2012, map_2012_17 = build_conversion_maps()

    # Get valid HS 2022 codes
    hs2022_codes = get_hs2022_codes()

    # Process CBP
    cbp_records = process_cbp()

    # Process EBTI
    ebti_records = process_ebti()

    # Convert all records
    all_records = cbp_records + ebti_records
    print(f"\nTotal records to convert: {len(all_records)}")

    stats = {
        'total': len(all_records),
        'unchanged': 0,
        'auto_1to1': 0,
        'split_judgment': 0,
        'not_found': 0,
        'invalid': 0,
    }

    cbp_stats = {'unchanged': 0, 'auto_1to1': 0, 'split_judgment': 0, 'not_found': 0, 'invalid': 0}
    ebti_stats = {'unchanged': 0, 'auto_1to1': 0, 'split_judgment': 0, 'not_found': 0, 'invalid': 0}

    converted_records = []
    split_records = []

    for i, rec in enumerate(all_records):
        hs6 = rec['original_hs6']
        new_hs6, status, details = convert_code(hs6, hs2022_codes, map_2017, map_2012)

        rec['converted_hs6'] = new_hs6
        rec['conversion_status'] = status
        rec['conversion_details'] = details

        stats[status] += 1
        if rec['source'] == 'cbp_cross':
            cbp_stats[status] += 1
        else:
            ebti_stats[status] += 1

        converted_records.append(rec)
        if status == 'split_judgment':
            split_records.append(rec)

        if (i + 1) % 50000 == 0:
            print(f"  Processed {i+1}/{len(all_records)}...")

    # Save results
    print("\nSaving results...")

    # 1. Converted CBP
    cbp_converted = [r for r in converted_records if r['source'] == 'cbp_cross']
    with open(os.path.join(OUTPUT_DIR, 'cbp_cross_hs2022.csv'), 'w', newline='', encoding='utf-8') as f:
        writer = csv.DictWriter(f, fieldnames=['product_name', 'original_hs6', 'converted_hs6', 'conversion_status', 'conversion_details', 'hts_code', 'ruling_number', 'source'])
        writer.writeheader()
        writer.writerows(cbp_converted)

    # 2. Converted EBTI
    ebti_converted = [r for r in converted_records if r['source'] == 'eu_ebti']
    with open(os.path.join(OUTPUT_DIR, 'ebti_hs2022.csv'), 'w', newline='', encoding='utf-8') as f:
        writer = csv.DictWriter(f, fieldnames=['product_name', 'original_hs6', 'converted_hs6', 'conversion_status', 'conversion_details', 'ruling_ref', 'source'])
        writer.writeheader()
        writer.writerows(ebti_converted)

    # 3. Split/judgment records
    with open(os.path.join(OUTPUT_DIR, 'split_judgment_records.csv'), 'w', newline='', encoding='utf-8') as f:
        writer = csv.DictWriter(f, fieldnames=['product_name', 'original_hs6', 'converted_hs6', 'conversion_details', 'source'])
        writer.writeheader()
        for r in split_records:
            writer.writerow({k: r.get(k, '') for k in ['product_name', 'original_hs6', 'converted_hs6', 'conversion_details', 'source']})

    # 4. Conversion maps
    with open(os.path.join(OUTPUT_DIR, 'hs2017_to_hs2022_map.json'), 'w') as f:
        json.dump(map_2017, f, indent=2)
    with open(os.path.join(OUTPUT_DIR, 'hs2012_to_hs2022_map.json'), 'w') as f:
        json.dump(map_2012, f, indent=2)

    # 5. Statistics
    stats_report = {
        'total': stats,
        'cbp_cross': cbp_stats,
        'eu_ebti': ebti_stats,
        'conversion_maps': {
            'hs2017_to_hs2022_entries': len(map_2017),
            'hs2012_to_hs2022_entries': len(map_2012),
        },
    }
    with open(os.path.join(OUTPUT_DIR, 'conversion_stats.json'), 'w') as f:
        json.dump(stats_report, f, indent=2)

    # Print report
    print("\n" + "="*60)
    print("HS CODE CONVERSION REPORT")
    print("="*60)

    print(f"\n전체 통계 ({stats['total']}건):")
    print(f"  (1) 그대로 유지 (이미 HS 2022):    {stats['unchanged']:>8}건  ({stats['unchanged']/stats['total']*100:.1f}%)")
    print(f"  (2) 1:1 자동 변환:                  {stats['auto_1to1']:>8}건  ({stats['auto_1to1']/stats['total']*100:.1f}%)")
    print(f"  (3) 분할 (판단 필요):               {stats['split_judgment']:>8}건  ({stats['split_judgment']/stats['total']*100:.1f}%)")
    print(f"  (4) 변환표에 없음:                   {stats['not_found']:>8}건  ({stats['not_found']/stats['total']*100:.1f}%)")

    cbp_total = sum(cbp_stats.values())
    ebti_total = sum(ebti_stats.values())

    print(f"\nCBP CROSS ({cbp_total}건):")
    print(f"  그대로 유지:  {cbp_stats['unchanged']:>8}건  ({cbp_stats['unchanged']/cbp_total*100:.1f}%)")
    print(f"  1:1 자동변환: {cbp_stats['auto_1to1']:>8}건  ({cbp_stats['auto_1to1']/cbp_total*100:.1f}%)")
    print(f"  분할/판단:    {cbp_stats['split_judgment']:>8}건  ({cbp_stats['split_judgment']/cbp_total*100:.1f}%)")
    print(f"  미발견:       {cbp_stats['not_found']:>8}건  ({cbp_stats['not_found']/cbp_total*100:.1f}%)")

    print(f"\nEU EBTI ({ebti_total}건):")
    print(f"  그대로 유지:  {ebti_stats['unchanged']:>8}건  ({ebti_stats['unchanged']/ebti_total*100:.1f}%)")
    print(f"  1:1 자동변환: {ebti_stats['auto_1to1']:>8}건  ({ebti_stats['auto_1to1']/ebti_total*100:.1f}%)")
    print(f"  분할/판단:    {ebti_stats['split_judgment']:>8}건  ({ebti_stats['split_judgment']/ebti_total*100:.1f}%)")
    print(f"  미발견:       {ebti_stats['not_found']:>8}건  ({ebti_stats['not_found']/ebti_total*100:.1f}%)")

    print(f"\n변환 맵 크기:")
    print(f"  HS2017→HS2022: {len(map_2017)} entries")
    print(f"  HS2012→HS2022: {len(map_2012)} entries")

    # Sample split records
    if split_records:
        print(f"\n분할 판단 필요 건수 샘플 (상위 10건):")
        for r in split_records[:10]:
            print(f"  {r['original_hs6']} → {r['conversion_details'][:80]}")
            print(f"    Product: {r['product_name'][:60]}")

    print(f"\n저장 위치: {OUTPUT_DIR}")
    print(f"  cbp_cross_hs2022.csv")
    print(f"  ebti_hs2022.csv")
    print(f"  split_judgment_records.csv")
    print(f"  hs2017_to_hs2022_map.json")
    print(f"  hs2012_to_hs2022_map.json")
    print(f"  conversion_stats.json")


if __name__ == '__main__':
    main()
