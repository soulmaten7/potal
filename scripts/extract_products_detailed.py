#!/usr/bin/env python3
"""
POTAL - WDC Product Data Extractor (상세 버전)
상품명 + 카테고리 + 가격 + 설명 + 소스 URL 추출
이 정보가 있으면 HS 코드 매핑 정확도가 훨씬 높아짐

사용법:
    python3 extract_products_detailed.py /Volumes/soulmaten/POTAL/wdc-products

출력:
    extracted/products_detailed.jsonl  (상품별 JSON, 한 줄 한 건)
    extracted/products_summary.csv     (상품명 + 카테고리 CSV)
"""

import gzip
import json
import csv
import os
import sys
import re
from collections import defaultdict
from pathlib import Path

def parse_nquad_value(line):
    """N-Quad에서 값 추출"""
    # "값" 부분 추출
    match = re.search(r'>\s+"(.*?)"\s*(?:<|$)', line)
    if match:
        return match.group(1)
    return None

def extract_products_from_file(filepath):
    """하나의 gz 파일에서 상품 정보 추출"""
    products = defaultdict(dict)

    with gzip.open(filepath, 'rt', encoding='utf-8', errors='replace') as f:
        for line in f:
            # 상품 관련 속성만 필터
            if 'schema.org/' not in line:
                continue

            # 소스 URL 추출 (4번째 요소)
            source_match = re.search(r'<(https?://[^>]+)>\s*\.\s*$', line)
            source_url = source_match.group(1) if source_match else ""

            # Subject (상품 ID) 추출
            subject_match = re.match(r'(<[^>]+>|_:\w+)', line)
            if not subject_match:
                continue
            subject = subject_match.group(1)

            # #product 태그가 있는 항목만 (실제 상품)
            if '#product' not in subject and '/product/' not in source_url.lower():
                # 좀 더 넓게: Product type이 있는 것도 포함
                if 'schema.org/Product' not in line and '#product' not in line:
                    continue

            # 속성별 추출
            if 'schema.org/name>' in line:
                val = parse_nquad_value(line)
                if val and len(val) > 1 and len(val) < 500:
                    products[subject]['name'] = val
                    products[subject]['source'] = source_url

            elif 'schema.org/category>' in line:
                val = parse_nquad_value(line)
                if val:
                    products[subject]['category'] = val

            elif 'schema.org/description>' in line:
                val = parse_nquad_value(line)
                if val and len(val) < 1000:
                    products[subject]['description'] = val[:300]

            elif 'schema.org/brand>' in line:
                val = parse_nquad_value(line)
                if val:
                    products[subject]['brand'] = val

            elif 'schema.org/material>' in line:
                val = parse_nquad_value(line)
                if val:
                    products[subject]['material'] = val

            elif 'schema.org/sku>' in line:
                val = parse_nquad_value(line)
                if val:
                    products[subject]['sku'] = val

            elif 'schema.org/gtin' in line:  # gtin, gtin13, gtin8, etc.
                val = parse_nquad_value(line)
                if val:
                    products[subject]['gtin'] = val

    # name이 있는 것만 반환
    return {k: v for k, v in products.items() if 'name' in v and len(v['name']) > 1}


def main():
    base_dir = sys.argv[1] if len(sys.argv) > 1 else "/Volumes/soulmaten/POTAL/wdc-products"
    raw_dir = os.path.join(base_dir, "raw")
    out_dir = os.path.join(base_dir, "extracted")
    os.makedirs(out_dir, exist_ok=True)

    jsonl_path = os.path.join(out_dir, "products_detailed.jsonl")
    csv_path = os.path.join(out_dir, "products_summary.csv")

    # 파트 파일 찾기
    part_files = sorted(Path(raw_dir).glob("part_*.gz"))
    total = len(part_files)
    print(f"📁 {total}개 파트 파일 발견")

    total_products = 0
    with_category = 0
    with_material = 0
    with_brand = 0
    with_gtin = 0

    with open(jsonl_path, 'w', encoding='utf-8') as jf, \
         open(csv_path, 'w', encoding='utf-8', newline='') as cf:

        writer = csv.writer(cf)
        writer.writerow(['name', 'category', 'brand', 'material', 'gtin', 'source_url'])

        for i, part_file in enumerate(part_files):
            try:
                products = extract_products_from_file(part_file)

                for pid, pdata in products.items():
                    # JSONL 출력
                    jf.write(json.dumps(pdata, ensure_ascii=False) + '\n')

                    # CSV 출력
                    writer.writerow([
                        pdata.get('name', ''),
                        pdata.get('category', ''),
                        pdata.get('brand', ''),
                        pdata.get('material', ''),
                        pdata.get('gtin', ''),
                        pdata.get('source', ''),
                    ])

                    total_products += 1
                    if 'category' in pdata: with_category += 1
                    if 'material' in pdata: with_material += 1
                    if 'brand' in pdata: with_brand += 1
                    if 'gtin' in pdata: with_gtin += 1

                if i % 50 == 0:
                    print(f"  📊 [{i+1}/{total}] 누적: {total_products:,}개 "
                          f"(카테고리: {with_category:,}, 재질: {with_material:,}, "
                          f"브랜드: {with_brand:,}, GTIN: {with_gtin:,})")

            except Exception as e:
                print(f"  ⚠️ {part_file.name} 오류: {e}")
                continue

    print(f"\n{'='*60}")
    print(f"✅ 추출 완료!")
    print(f"{'='*60}")
    print(f"총 상품: {total_products:,}개")
    print(f"  카테고리 포함: {with_category:,}개 ({with_category*100//max(total_products,1)}%)")
    print(f"  재질 포함: {with_material:,}개 ({with_material*100//max(total_products,1)}%)")
    print(f"  브랜드 포함: {with_brand:,}개 ({with_brand*100//max(total_products,1)}%)")
    print(f"  GTIN 포함: {with_gtin:,}개 ({with_gtin*100//max(total_products,1)}%)")
    print(f"\n출력 파일:")
    print(f"  JSONL: {jsonl_path}")
    print(f"  CSV:   {csv_path}")
    print(f"\n💡 재질(material) 정보가 있는 상품은 HS 코드 자동 매핑 가능!")


if __name__ == "__main__":
    main()
