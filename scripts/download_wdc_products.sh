#!/bin/bash
# ============================================================
# POTAL - Web Data Commons Product Data Downloader
# 5.95억 상품 데이터 다운로드 + 상품명 추출
# ============================================================
# 사용법:
#   chmod +x download_wdc_products.sh
#   ./download_wdc_products.sh /Volumes/soulmaten/POTAL/wdc-products
#
# 필요 디스크: ~400GB (원본 350GB + 추출 데이터)
# 예상 시간: 인터넷 속도에 따라 4~12시간
# ============================================================

set -e

# 저장 경로 설정
DEST_DIR="${1:-/Volumes/soulmaten/POTAL/wdc-products}"
RAW_DIR="$DEST_DIR/raw"
EXTRACTED_DIR="$DEST_DIR/extracted"
BASE_URL="https://data.dws.informatik.uni-mannheim.de/structureddata/2023-12/quads/classspecific/Product"

# 총 파일 수
TOTAL_PARTS=1899

echo "============================================"
echo "POTAL - WDC Product Data Downloader"
echo "============================================"
echo "저장 경로: $DEST_DIR"
echo "총 파일: ${TOTAL_PARTS}개 (각 ~186MB, 총 ~350GB)"
echo "============================================"

# 디렉토리 생성
mkdir -p "$RAW_DIR" "$EXTRACTED_DIR"

# 1단계: 도메인 통계 + 룩업 테이블 다운로드 (작은 파일들)
echo ""
echo "[1/3] 메타데이터 다운로드..."
if [ ! -f "$RAW_DIR/Product_domain_stats.csv" ]; then
    curl -L -o "$RAW_DIR/Product_domain_stats.csv" "$BASE_URL/Product_domain_stats.csv"
    echo "  ✅ domain_stats.csv (371MB)"
fi
if [ ! -f "$RAW_DIR/Product_lookup.csv" ]; then
    curl -L -o "$RAW_DIR/Product_lookup.csv" "$BASE_URL/Product_lookup.csv"
    echo "  ✅ lookup.csv (89MB)"
fi

# 2단계: 파트 파일 다운로드 (이어받기 지원)
echo ""
echo "[2/3] 상품 데이터 파일 다운로드 (${TOTAL_PARTS}개)..."
echo "  → 이미 다운로드된 파일은 건너뜁니다 (이어받기 가능)"

DOWNLOADED=0
SKIPPED=0

for i in $(seq 0 $((TOTAL_PARTS - 1))); do
    FILE="part_${i}.gz"

    if [ -f "$RAW_DIR/$FILE" ]; then
        SKIPPED=$((SKIPPED + 1))
        continue
    fi

    echo "  📥 [$((i + 1))/${TOTAL_PARTS}] $FILE"
    curl -L -C - -o "$RAW_DIR/$FILE" "$BASE_URL/$FILE" 2>/dev/null
    DOWNLOADED=$((DOWNLOADED + 1))

    # 50개마다 진행률 표시
    if [ $((i % 50)) -eq 0 ] && [ $i -gt 0 ]; then
        echo "  📊 진행: $i/${TOTAL_PARTS} ($(( i * 100 / TOTAL_PARTS ))%)"
    fi
done

echo "  ✅ 다운로드 완료: ${DOWNLOADED}개 신규, ${SKIPPED}개 건너뜀"

# 3단계: 상품명 추출
echo ""
echo "[3/3] 상품명 추출 중..."

PRODUCT_NAMES_FILE="$EXTRACTED_DIR/all_product_names.txt"
PRODUCT_COUNT=0

# 기존 추출 파일이 있으면 삭제
> "$PRODUCT_NAMES_FILE"

for i in $(seq 0 $((TOTAL_PARTS - 1))); do
    FILE="$RAW_DIR/part_${i}.gz"

    if [ ! -f "$FILE" ]; then
        continue
    fi

    # schema.org/name 에서 상품명만 추출
    zcat "$FILE" 2>/dev/null | grep '#product.*schema.org/name' | \
        sed 's/.*schema.org\/name> "//' | sed 's/" <.*//' >> "$PRODUCT_NAMES_FILE"

    CURRENT=$(wc -l < "$PRODUCT_NAMES_FILE")

    if [ $((i % 100)) -eq 0 ]; then
        echo "  📊 part_${i} 완료 — 누적 상품명: ${CURRENT}개"
    fi
done

# 중복 제거
echo ""
echo "  🔄 중복 제거 중..."
BEFORE=$(wc -l < "$PRODUCT_NAMES_FILE")
sort -u "$PRODUCT_NAMES_FILE" -o "$EXTRACTED_DIR/unique_product_names.txt"
AFTER=$(wc -l < "$EXTRACTED_DIR/unique_product_names.txt")

echo ""
echo "============================================"
echo "✅ 완료!"
echo "============================================"
echo "원본 상품명: ${BEFORE}개"
echo "중복 제거 후: ${AFTER}개"
echo "저장 위치: $EXTRACTED_DIR/unique_product_names.txt"
echo ""
echo "다음 단계:"
echo "  1. unique_product_names.txt → HS 코드 매핑"
echo "  2. python3 extract_with_categories.py (카테고리 포함 추출)"
echo "============================================"
