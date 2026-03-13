#!/usr/bin/env python3
"""
WDC products_detailed.jsonl에서 고유 카테고리별 대표 상품명 추출.
680M줄 전체를 읽지 않고 처음 50M줄만 샘플링하여 카테고리→상품명 매핑 생성.

출력: ~/portal/data/wdc_category_samples.jsonl
"""
import json
import sys
import re
from collections import defaultdict
from pathlib import Path

JSONL_PATH = "/Volumes/soulmaten/POTAL/wdc-products/extracted/products_detailed.jsonl"
OUTPUT_PATH = Path.home() / "portal" / "data" / "wdc_category_samples.jsonl"
MAX_LINES = 50_000_000  # 50M lines
MAX_SAMPLES_PER_CATEGORY = 5
MIN_NAME_LEN = 5
MAX_NAME_LEN = 150

def is_english(text):
    """Check if text is primarily ASCII/English"""
    ascii_count = sum(1 for c in text if ord(c) < 128)
    return ascii_count / max(len(text), 1) > 0.7

def clean_category(cat):
    """Normalize category text"""
    cat = cat.strip()
    # Take top-level category
    for sep in ['>', '/', '|', '»']:
        if sep in cat:
            parts = [p.strip() for p in cat.split(sep)]
            # Keep first 2 levels max
            cat = ' > '.join(parts[:2])
            break
    return cat

def main():
    OUTPUT_PATH.parent.mkdir(parents=True, exist_ok=True)

    categories = defaultdict(list)  # category -> [product_names]
    seen_names = set()

    print(f"Reading {JSONL_PATH}...")
    print(f"Sampling first {MAX_LINES:,} lines")

    count = 0
    with_cat = 0
    english_cat = 0

    with open(JSONL_PATH, 'r', encoding='utf-8', errors='replace') as f:
        for line in f:
            count += 1
            if count > MAX_LINES:
                break
            if count % 5_000_000 == 0:
                print(f"  {count/1_000_000:.0f}M lines, {len(categories)} categories, {english_cat} English samples")

            try:
                obj = json.loads(line)
            except:
                continue

            cat = obj.get('category', '').strip()
            name = obj.get('name', '').strip()

            if not cat or not name:
                continue
            with_cat += 1

            if len(name) < MIN_NAME_LEN or len(name) > MAX_NAME_LEN:
                continue
            if not is_english(name) or not is_english(cat):
                continue

            # Skip store names, brands-only, generic
            if name.lower() in seen_names:
                continue
            if len(name.split()) < 2:
                continue

            clean_cat = clean_category(cat)
            if len(clean_cat) < 3:
                continue

            if len(categories[clean_cat]) < MAX_SAMPLES_PER_CATEGORY:
                categories[clean_cat].append({
                    'name': name,
                    'category': clean_cat,
                    'brand': obj.get('brand', ''),
                    'material': obj.get('material', ''),
                })
                seen_names.add(name.lower())
                english_cat += 1

    print(f"\nTotal lines: {count:,}")
    print(f"With category: {with_cat:,}")
    print(f"Unique English categories: {len(categories)}")
    print(f"Total samples: {english_cat}")

    # Filter: only categories with at least 2 samples (more reliable)
    good_cats = {k: v for k, v in categories.items() if len(v) >= 2}
    print(f"Categories with 2+ samples: {len(good_cats)}")

    # Write output
    with open(OUTPUT_PATH, 'w', encoding='utf-8') as f:
        for cat, samples in sorted(good_cats.items()):
            for s in samples:
                f.write(json.dumps(s, ensure_ascii=False) + '\n')

    total_samples = sum(len(v) for v in good_cats.values())
    print(f"\nOutput: {OUTPUT_PATH}")
    print(f"Written: {total_samples} samples across {len(good_cats)} categories")

    # Also write category summary
    summary_path = OUTPUT_PATH.parent / "wdc_category_summary.json"
    summary = {cat: len(samples) for cat, samples in sorted(good_cats.items())}
    with open(summary_path, 'w', encoding='utf-8') as f:
        json.dump(summary, f, ensure_ascii=False, indent=2)
    print(f"Summary: {summary_path}")

if __name__ == "__main__":
    main()
