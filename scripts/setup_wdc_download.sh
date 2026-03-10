#!/bin/bash
# 이 스크립트를 터미널에 붙여넣으면 외장하드에 다운로드 스크립트를 생성합니다

DEST="/Volumes/soulmaten/POTAL"

# scripts 폴더 생성
mkdir -p "$DEST/wdc-products/raw"
mkdir -p "$DEST/wdc-products/extracted"

cat > "$DEST/download_wdc.sh" << 'SCRIPT'
#!/bin/bash
set -e
DEST_DIR="/Volumes/soulmaten/POTAL/wdc-products"
RAW_DIR="$DEST_DIR/raw"
BASE_URL="https://data.dws.informatik.uni-mannheim.de/structureddata/2023-12/quads/classspecific/Product"
TOTAL_PARTS=1899

echo "============================================"
echo "POTAL - WDC Product Data Downloader"
echo "총 파일: ${TOTAL_PARTS}개 (각 ~186MB, 총 ~350GB)"
echo "============================================"

mkdir -p "$RAW_DIR"

for i in $(seq 0 $((TOTAL_PARTS - 1))); do
    FILE="part_${i}.gz"
    if [ -f "$RAW_DIR/$FILE" ]; then
        continue
    fi
    echo "📥 [$((i + 1))/${TOTAL_PARTS}] $FILE"
    curl -L -C - -o "$RAW_DIR/$FILE" "$BASE_URL/$FILE" 2>/dev/null
    if [ $((i % 50)) -eq 0 ] && [ $i -gt 0 ]; then
        echo "📊 진행: $i/${TOTAL_PARTS} ($(( i * 100 / TOTAL_PARTS ))%)"
    fi
done
echo "✅ 다운로드 완료!"
SCRIPT

chmod +x "$DEST/download_wdc.sh"
echo "✅ 스크립트 생성 완료: $DEST/download_wdc.sh"
echo "실행: cd $DEST && ./download_wdc.sh"
