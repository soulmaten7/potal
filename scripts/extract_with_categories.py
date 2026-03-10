#!/usr/bin/env python3
"""
WDC 상품 데이터에서 카테고리 포함 상세 추출 (extract_products_detailed.py 래퍼)

사용법 (Mac):
    cd ~/portal
    nohup python3 scripts/extract_with_categories.py /Volumes/soulmaten/POTAL/wdc-products > wdc_extract.log 2>&1 &

    # 진행 확인
    tail -5 wdc_extract.log

출력 (외장하드에 저장):
    extracted/products_detailed.jsonl  — 상품별 JSON (name, category, brand, material, gtin, source)
    extracted/products_summary.csv     — CSV 요약
    extracted/category_stats.json      — 카테고리별 통계

이 스크립트는 extract_products_detailed.py를 개선한 버전:
- 진행 상태 저장 (재시작 가능)
- 카테고리별 통계 출력
- 메모리 효율 개선 (파일별 처리 후 즉시 flush)
"""
import gzip
import json
import csv
import os
import sys
import re
from collections import defaultdict
from pathlib import Path
from datetime import datetime

def log(msg):
    print(f"[{datetime.now().strftime('%Y-%m-%d %H:%M:%S')}] {msg}", flush=True)

def parse_nquad_value(line):
    match = re.search(r'>\s+"(.*?)"\s*(?:<|$)', line)
    return match.group(1) if match else None

def extract_products_from_file(filepath):
    products = defaultdict(dict)
    with gzip.open(filepath, 'rt', encoding='utf-8', errors='replace') as f:
        for line in f:
            if 'schema.org/' not in line:
                continue
            source_match = re.search(r'<(https?://[^>]+)>\s*\.\s*$', line)
            source_url = source_match.group(1) if source_match else ""
            subject_match = re.match(r'(<[^>]+>|_:\w+)', line)
            if not subject_match:
                continue
            subject = subject_match.group(1)

            if 'schema.org/name>' in line:
                val = parse_nquad_value(line)
                if val and 1 < len(val) < 500:
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
            elif 'schema.org/gtin' in line:
                val = parse_nquad_value(line)
                if val:
                    products[subject]['gtin'] = val

    return {k: v for k, v in products.items() if 'name' in v and len(v['name']) > 1}

def main():
    base_dir = sys.argv[1] if len(sys.argv) > 1 else "/Volumes/soulmaten/POTAL/wdc-products"
    raw_dir = os.path.join(base_dir, "raw")
    out_dir = os.path.join(base_dir, "extracted")
    os.makedirs(out_dir, exist_ok=True)

    progress_file = os.path.join(out_dir, "extract_progress.json")
    jsonl_path = os.path.join(out_dir, "products_detailed.jsonl")
    csv_path = os.path.join(out_dir, "products_summary.csv")
    stats_path = os.path.join(out_dir, "category_stats.json")

    # 진행 상태 로드
    done_parts = set()
    if os.path.exists(progress_file):
        with open(progress_file) as f:
            progress = json.load(f)
            done_parts = set(progress.get('done_parts', []))
        log(f"이전 진행: {len(done_parts)}개 파트 완료, 이어서 진행")

    part_files = sorted(Path(raw_dir).glob("part_*.gz"))
    total = len(part_files)
    log(f"총 {total}개 파트 파일 발견, {len(done_parts)}개 이미 완료")

    stats = defaultdict(int)
    total_products = 0
    with_category = 0
    with_material = 0
    with_brand = 0
    with_gtin = 0

    # append 모드 (이어쓰기)
    mode = 'a' if done_parts else 'w'
    write_header = not done_parts

    with open(jsonl_path, mode, encoding='utf-8') as jf, \
         open(csv_path, mode, encoding='utf-8', newline='') as cf:

        writer = csv.writer(cf)
        if write_header:
            writer.writerow(['name', 'category', 'brand', 'material', 'gtin', 'source_url'])

        for i, part_file in enumerate(part_files):
            if part_file.name in done_parts:
                continue

            try:
                products = extract_products_from_file(part_file)

                for pid, pdata in products.items():
                    jf.write(json.dumps(pdata, ensure_ascii=False) + '\n')
                    writer.writerow([
                        pdata.get('name', ''),
                        pdata.get('category', ''),
                        pdata.get('brand', ''),
                        pdata.get('material', ''),
                        pdata.get('gtin', ''),
                        pdata.get('source', ''),
                    ])
                    total_products += 1
                    cat = pdata.get('category', '')
                    if cat:
                        with_category += 1
                        top_cat = cat.split('>')[0].split('/')[0].strip()
                        stats[top_cat] += 1
                    if 'material' in pdata: with_material += 1
                    if 'brand' in pdata: with_brand += 1
                    if 'gtin' in pdata: with_gtin += 1

                done_parts.add(part_file.name)

                if (i + 1) % 10 == 0:
                    jf.flush()
                    cf.flush()
                    with open(progress_file, 'w') as pf:
                        json.dump({'done_parts': list(done_parts), 'total_products': total_products}, pf)
                    log(f"[{len(done_parts)}/{total}] 누적: {total_products:,}개 "
                        f"(cat: {with_category:,}, mat: {with_material:,}, brand: {with_brand:,})")

            except Exception as e:
                log(f"  {part_file.name} 오류: {e}")
                continue

    # 최종 진행 저장
    with open(progress_file, 'w') as pf:
        json.dump({'done_parts': list(done_parts), 'total_products': total_products, 'status': 'done'}, pf)

    # 카테고리 통계 저장
    sorted_stats = dict(sorted(stats.items(), key=lambda x: -x[1])[:100])
    with open(stats_path, 'w', encoding='utf-8') as f:
        json.dump(sorted_stats, f, ensure_ascii=False, indent=2)

    log("=" * 60)
    log(f"추출 완료! 총 상품: {total_products:,}개")
    log(f"  카테고리: {with_category:,} ({with_category*100//max(total_products,1)}%)")
    log(f"  재질: {with_material:,} ({with_material*100//max(total_products,1)}%)")
    log(f"  브랜드: {with_brand:,} ({with_brand*100//max(total_products,1)}%)")
    log(f"  GTIN: {with_gtin:,} ({with_gtin*100//max(total_products,1)}%)")
    log(f"출력: {jsonl_path}")
    log(f"통계: {stats_path}")
    log("=" * 60)
    log("다음 단계:")
    log("  1. products_summary.csv → HS 코드 매핑 파이프라인")
    log("  2. category_stats.json → 카테고리-HS 매핑 테이블 설계")

if __name__ == "__main__":
    main()
