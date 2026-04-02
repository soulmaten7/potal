# 터미널 3 — 동의어 사전 플라이휠 Phase 1
# CBP 22만 + EBTI 27만건에서 키워드 → HS6 매핑 자동 추출
# 결과: 외장하드 /Volumes/soulmaten/POTAL/7field_benchmark/synonym_dict_expanded.json
# 현재 동의어 사전: 50개 → 목표: 수천~수만 개

## 실행 명령어 (한 번에 복사-붙여넣기)

```bash
# ═══════════════════════════════════════════════════════════
# 플라이휠 Phase 1: CBP + EBTI → 동의어 사전 자동 확장
# AI 호출 0회, 비용 $0, 순수 텍스트 처리
# ═══════════════════════════════════════════════════════════

cd /Volumes/soulmaten/POTAL

# Step 1: CBP CROSS에서 product_name → hs_code 매핑 추출
# CBP CROSS rulings에서 subject(상품명)과 hs_code를 추출하여
# 자주 등장하는 키워드-HS6 패턴을 사전으로 구축

cat << 'SCRIPT' > 7field_benchmark/extract_synonym_dict.py
#!/usr/bin/env python3
"""
POTAL 동의어 사전 플라이휠 Phase 1
CBP CROSS 22만 + EU EBTI 27만건에서 키워드 → HS6 매핑 자동 추출

원리:
1. 각 ruling에서 product_name(subject)과 hs_code(6자리) 추출
2. product_name을 단어/구(phrase)로 분해
3. 특정 키워드가 항상 같은 HS6로 분류되면 → 동의어 사전에 추가
4. 일관성(consistency) 95%+ 이상인 키워드만 채택

결과: synonym_dict_expanded.json (step4-subheading.ts에 바로 사용 가능한 형식)
"""

import json
import csv
import os
import re
from collections import defaultdict, Counter
from pathlib import Path

BASE = Path("/Volumes/soulmaten/POTAL")
OUTPUT = BASE / "7field_benchmark" / "synonym_dict_expanded.json"
STATS = BASE / "7field_benchmark" / "synonym_dict_stats.json"

# ═══ 불용어 (HS 분류에 무의미한 일반 단어) ═══
STOPWORDS = {
    'the','a','an','of','for','and','or','in','on','at','to','with','from',
    'by','is','are','was','were','be','been','being','have','has','had',
    'do','does','did','will','would','shall','should','may','might','can',
    'could','not','no','nor','but','if','than','that','this','these','those',
    'it','its','they','them','their','we','our','you','your','he','she',
    'him','her','his','who','which','what','where','when','how','all','each',
    'every','both','few','more','most','other','some','such','only','own',
    'same','so','too','very','just','also','into','over','under','about',
    'between','through','during','before','after','above','below','up','down',
    'out','off','then','once','here','there','why','per','etc','ie','eg',
    'new','used','made','type','style','set','sets','size','sizes','model',
    'item','items','product','products','piece','pieces','part','parts',
    'article','articles','good','goods','material','materials','other',
    'n.e.c.','n.e.s.','nesoi','nesi','thereof','therein','herein',
    'elsewhere','specified','classified','provided','described','including',
    'containing','consisting','whether','similar','like','kind','various',
    'general','specific','special','certain','particular','different',
    'approximate','approximately','total','gross','net','weight','value',
    'number','quantity','unit','units','one','two','three','four','five',
    'six','seven','eight','nine','ten','hundred','thousand','million',
    'chapter','heading','subheading','section','note','notes',
    'import','export','entry','customs','tariff','duty','rate',
}

# ═══ 최소 조건 ═══
MIN_OCCURRENCES = 3       # 최소 3번 이상 등장
MIN_CONSISTENCY = 0.90    # 90%+ 일관성 (같은 HS6로 분류)
MIN_WORD_LENGTH = 3       # 최소 3글자
MAX_PHRASE_WORDS = 3      # 최대 3단어 구

def clean_text(text):
    """텍스트 정규화"""
    if not text:
        return ""
    text = text.lower().strip()
    # 특수문자 제거 (하이픈, 슬래시는 공백으로)
    text = re.sub(r'[,;:!?()[\]{}"\']', '', text)
    text = re.sub(r'[-/]', ' ', text)
    text = re.sub(r'\s+', ' ', text)
    return text.strip()

def extract_keywords(text):
    """텍스트에서 단어 + 2-word/3-word 구 추출"""
    words = [w for w in text.split() if len(w) >= MIN_WORD_LENGTH and w not in STOPWORDS]

    keywords = set()
    # 단일 단어
    for w in words:
        if not w.isdigit() and not re.match(r'^\d+[\.\-]\d+$', w):
            keywords.add(w)

    # 2-word phrases
    for i in range(len(words) - 1):
        phrase = words[i] + ' ' + words[i+1]
        keywords.add(phrase)

    # 3-word phrases
    for i in range(len(words) - 2):
        phrase = words[i] + ' ' + words[i+1] + ' ' + words[i+2]
        keywords.add(phrase)

    return keywords

def load_cbp_cross():
    """CBP CROSS 매핑 데이터 로드"""
    mappings = []

    # 방법 1: cbp_cross_combined_mappings.csv (142,251건)
    csv_path = BASE / "cbp_cross_combined_mappings.csv"
    if csv_path.exists():
        print(f"Loading CBP CROSS from {csv_path}...")
        with open(csv_path, 'r', encoding='utf-8') as f:
            reader = csv.DictReader(f)
            for row in reader:
                name = row.get('product_name') or row.get('name') or row.get('subject', '')
                hs = row.get('hs_code') or row.get('hs6', '')
                if name and hs and len(hs) >= 6:
                    mappings.append((clean_text(name), hs[:6]))
        print(f"  → {len(mappings)} CBP mappings loaded")
        return mappings

    # 방법 2: 7field_benchmark 폴더의 JSON 파일들
    for fname in ['merged_7of7_with_category.json', 'merged_6of7_with_category.json']:
        fpath = BASE / "7field_benchmark" / fname
        if fpath.exists():
            print(f"Loading CBP from {fpath}...")
            with open(fpath, 'r', encoding='utf-8') as f:
                data = json.load(f)
                for item in data:
                    name = item.get('product_name', '') or item.get('subject', '')
                    hs = item.get('hs_code', '') or item.get('hs6', '')
                    if name and hs and len(hs) >= 6:
                        mappings.append((clean_text(name), hs[:6]))

    # 방법 3: regulations 폴더
    rulings_dir = BASE / "regulations" / "cbp_cross"
    if rulings_dir.exists():
        print(f"Scanning CBP CROSS rulings directory...")
        for fpath in sorted(rulings_dir.glob("*.json")):
            try:
                with open(fpath, 'r', encoding='utf-8') as f:
                    data = json.load(f)
                    if isinstance(data, list):
                        items = data
                    elif isinstance(data, dict):
                        items = data.get('rulings', [data])
                    else:
                        continue
                    for item in items:
                        name = item.get('subject', '') or item.get('product_name', '') or item.get('description', '')
                        hs = item.get('hs_code', '') or item.get('tariff_number', '') or item.get('hts', '')
                        if name and hs and len(str(hs)) >= 6:
                            mappings.append((clean_text(str(name)), str(hs)[:6]))
            except:
                continue

    print(f"  → {len(mappings)} CBP mappings loaded total")
    return mappings

def load_ebti():
    """EU EBTI 매핑 데이터 로드"""
    mappings = []

    ebti_dir = BASE / "regulations" / "eu_ebti"
    if not ebti_dir.exists():
        print("EBTI directory not found, skipping...")
        return mappings

    print(f"Scanning EU EBTI directory...")
    for fpath in sorted(ebti_dir.glob("*.json")):
        try:
            with open(fpath, 'r', encoding='utf-8') as f:
                data = json.load(f)
                if isinstance(data, list):
                    items = data
                elif isinstance(data, dict):
                    items = data.get('rulings', data.get('results', [data]))
                else:
                    continue
                for item in items:
                    name = item.get('goods_description', '') or item.get('product_name', '') or item.get('description', '')
                    hs = item.get('nomenclature_code', '') or item.get('hs_code', '') or item.get('cn_code', '')
                    if name and hs and len(str(hs)) >= 6:
                        mappings.append((clean_text(str(name)), str(hs)[:6]))
        except:
            continue

    # EBTI CSV도 체크
    for csv_name in ['ebti_mappings.csv', 'eu_ebti_mappings.csv']:
        csv_path = BASE / csv_name
        if not csv_path.exists():
            csv_path = ebti_dir / csv_name
        if csv_path.exists():
            print(f"Loading EBTI CSV from {csv_path}...")
            try:
                with open(csv_path, 'r', encoding='utf-8') as f:
                    reader = csv.DictReader(f)
                    for row in reader:
                        name = row.get('goods_description', '') or row.get('product_name', '')
                        hs = row.get('nomenclature_code', '') or row.get('hs_code', '') or row.get('cn_code', '')
                        if name and hs and len(hs) >= 6:
                            mappings.append((clean_text(name), hs[:6]))
            except:
                pass

    print(f"  → {len(mappings)} EBTI mappings loaded total")
    return mappings

def build_dictionary(mappings):
    """키워드 → HS6 사전 구축"""
    print(f"\n═══ Building synonym dictionary from {len(mappings)} mappings ═══\n")

    # 키워드별 HS6 빈도 집계
    keyword_hs6: dict[str, Counter] = defaultdict(Counter)

    for i, (name, hs6) in enumerate(mappings):
        if i % 50000 == 0 and i > 0:
            print(f"  Processing {i}/{len(mappings)}...")

        keywords = extract_keywords(name)
        for kw in keywords:
            keyword_hs6[kw][hs6] += 1

    print(f"  → {len(keyword_hs6)} unique keywords found")

    # 일관성 필터링
    dictionary = {}
    rejected = {"low_count": 0, "low_consistency": 0, "ambiguous": 0}

    for kw, hs6_counts in keyword_hs6.items():
        total = sum(hs6_counts.values())

        # 최소 등장 횟수
        if total < MIN_OCCURRENCES:
            rejected["low_count"] += 1
            continue

        # 최빈 HS6
        top_hs6, top_count = hs6_counts.most_common(1)[0]
        consistency = top_count / total

        # 일관성 체크
        if consistency < MIN_CONSISTENCY:
            rejected["low_consistency"] += 1
            continue

        # 2위와 차이가 너무 적으면 ambiguous
        if len(hs6_counts) > 1:
            second_hs6, second_count = hs6_counts.most_common(2)[1]
            if second_count >= top_count * 0.3:  # 2위가 1위의 30% 이상이면 애매
                rejected["ambiguous"] += 1
                continue

        dictionary[kw] = {
            "code": top_hs6,
            "count": top_count,
            "total": total,
            "consistency": round(consistency, 4),
            "alternatives": dict(hs6_counts.most_common(3))
        }

    print(f"\n═══ Results ═══")
    print(f"  Accepted: {len(dictionary)} keywords")
    print(f"  Rejected: {sum(rejected.values())} total")
    print(f"    - Low count (<{MIN_OCCURRENCES}): {rejected['low_count']}")
    print(f"    - Low consistency (<{MIN_CONSISTENCY*100}%): {rejected['low_consistency']}")
    print(f"    - Ambiguous (2nd >= 30% of 1st): {rejected['ambiguous']}")

    return dictionary

def format_for_typescript(dictionary):
    """step4-subheading.ts에 바로 사용 가능한 형식으로 변환"""
    ts_dict = {}

    # 일관성 높은 순, 등장 횟수 많은 순으로 정렬
    sorted_items = sorted(
        dictionary.items(),
        key=lambda x: (-x[1]['consistency'], -x[1]['count'])
    )

    for kw, info in sorted_items:
        ts_dict[kw] = [{
            "code": info["code"],
            "desc": f"Auto-extracted (consistency: {info['consistency']}, count: {info['count']})"
        }]

    return ts_dict

def main():
    print("═" * 60)
    print("POTAL 동의어 사전 플라이휠 Phase 1")
    print("CBP CROSS + EU EBTI → 키워드 자동 추출")
    print("═" * 60)

    # 데이터 로드
    cbp_mappings = load_cbp_cross()
    ebti_mappings = load_ebti()
    all_mappings = cbp_mappings + ebti_mappings

    if not all_mappings:
        print("\n⚠️ No mappings found! Check data paths.")
        print("Expected locations:")
        print(f"  CBP: {BASE}/cbp_cross_combined_mappings.csv")
        print(f"  CBP: {BASE}/7field_benchmark/merged_*.json")
        print(f"  CBP: {BASE}/regulations/cbp_cross/")
        print(f"  EBTI: {BASE}/regulations/eu_ebti/")
        return

    print(f"\n총 {len(all_mappings)} mappings (CBP: {len(cbp_mappings)}, EBTI: {len(ebti_mappings)})")

    # 사전 구축
    dictionary = build_dictionary(all_mappings)

    if not dictionary:
        print("\n⚠️ No keywords passed the filter! Try lowering thresholds.")
        return

    # TypeScript 형식 변환
    ts_dict = format_for_typescript(dictionary)

    # 저장
    output_data = {
        "metadata": {
            "generated": "flywheel_phase1",
            "cbp_count": len(cbp_mappings),
            "ebti_count": len(ebti_mappings),
            "total_mappings": len(all_mappings),
            "dictionary_size": len(dictionary),
            "min_occurrences": MIN_OCCURRENCES,
            "min_consistency": MIN_CONSISTENCY,
        },
        "typescript_format": ts_dict,
        "full_stats": dictionary
    }

    os.makedirs(OUTPUT.parent, exist_ok=True)
    with open(OUTPUT, 'w', encoding='utf-8') as f:
        json.dump(output_data, f, indent=2, ensure_ascii=False)

    with open(STATS, 'w', encoding='utf-8') as f:
        # 통계 요약
        stats = {
            "total_keywords": len(dictionary),
            "by_consistency": {
                "100%": len([v for v in dictionary.values() if v['consistency'] == 1.0]),
                "95-99%": len([v for v in dictionary.values() if 0.95 <= v['consistency'] < 1.0]),
                "90-94%": len([v for v in dictionary.values() if 0.90 <= v['consistency'] < 0.95]),
            },
            "by_count": {
                "100+": len([v for v in dictionary.values() if v['count'] >= 100]),
                "50-99": len([v for v in dictionary.values() if 50 <= v['count'] < 100]),
                "10-49": len([v for v in dictionary.values() if 10 <= v['count'] < 50]),
                "3-9": len([v for v in dictionary.values() if v['count'] < 10]),
            },
            "top_20_by_count": [
                {"keyword": kw, **info}
                for kw, info in sorted(dictionary.items(), key=lambda x: -x[1]['count'])[:20]
            ],
            "unique_hs6_codes": len(set(v['code'] for v in dictionary.values())),
            "by_chapter": dict(Counter(v['code'][:2] for v in dictionary.values()).most_common(20)),
        }
        json.dump(stats, f, indent=2, ensure_ascii=False)

    print(f"\n═══ Saved ═══")
    print(f"  Dictionary: {OUTPUT} ({os.path.getsize(OUTPUT) / 1024:.1f} KB)")
    print(f"  Stats: {STATS}")
    print(f"\n═══ Top 10 keywords (by count) ═══")
    for kw, info in sorted(dictionary.items(), key=lambda x: -x[1]['count'])[:10]:
        print(f"  '{kw}' → {info['code']} (count: {info['count']}, consistency: {info['consistency']*100:.1f}%)")

    print(f"\n═══ Chapter distribution (top 10) ═══")
    ch_counts = Counter(v['code'][:2] for v in dictionary.values())
    for ch, cnt in ch_counts.most_common(10):
        print(f"  Chapter {ch}: {cnt} keywords")

    print(f"\n✅ Done! {len(dictionary)} keywords extracted.")
    print(f"   기존 동의어 사전: 50개 → 확장: {len(dictionary)}개")
    print(f"   이 파일을 step4-subheading.ts의 SUBHEADING_SYNONYMS에 머지하면 됩니다.")

if __name__ == "__main__":
    main()
SCRIPT

# 실행 (nice -n 15 = CPU 최하위, Mac 정상 사용 가능)
nice -n 15 python3 7field_benchmark/extract_synonym_dict.py 2>&1 | tee 7field_benchmark/flywheel_phase1.log

echo ""
echo "═══════════════════════════════════════════════════════════"
echo "완료! 결과 파일:"
echo "  사전: /Volumes/soulmaten/POTAL/7field_benchmark/synonym_dict_expanded.json"
echo "  통계: /Volumes/soulmaten/POTAL/7field_benchmark/synonym_dict_stats.json"
echo "  로그: /Volumes/soulmaten/POTAL/7field_benchmark/flywheel_phase1.log"
echo "═══════════════════════════════════════════════════════════"
```

## 완료 후 확인 명령어
```bash
# 결과 확인
cat /Volumes/soulmaten/POTAL/7field_benchmark/synonym_dict_stats.json | python3 -m json.tool | head -50

# 사전 크기 확인
wc -l /Volumes/soulmaten/POTAL/7field_benchmark/synonym_dict_expanded.json
ls -lh /Volumes/soulmaten/POTAL/7field_benchmark/synonym_dict_expanded.json
```

## 예상 소요 시간
- CBP 14만 + EBTI 27만 = ~41만건 텍스트 처리
- 순수 Python 텍스트 처리 (AI 0회, 네트워크 0회)
- 예상: 5~15분 (Mac 성능에 따라)
- CPU 최하위(nice -n 15)이므로 Mac 정상 사용 가능
