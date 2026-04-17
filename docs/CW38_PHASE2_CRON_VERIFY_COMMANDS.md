# CW38 Phase 2 Cron 수동 검증
# 실행: 터미널1 (Opus) 또는 터미널3 (Opus)
# 예상 소요: 10~15분
# 마지막 업데이트: 2026-04-17

---

## 목적

Phase 2에서 만든 3개 cron이 **실제로 작동하는지** 스케줄 도달 전에 수동 호출로 확인한다.
각 cron의 route.ts를 로컬에서 직접 실행하여 외부 API 응답, 파싱 로직, DB 기록을 검증한다.

---

## 사전 설정

```bash
cd ~/potal
source .env.local 2>/dev/null || true
export SB_URL=$NEXT_PUBLIC_SUPABASE_URL
export SB_KEY=$SUPABASE_SERVICE_ROLE_KEY

# Vercel에서 배포된 URL 확인
echo "앱 URL: $NEXT_PUBLIC_APP_URL"

# CRON_SECRET 확인 (Vercel env에만 있을 수 있음)
grep "CRON_SECRET" .env.local 2>/dev/null || echo "⚠️ CRON_SECRET이 .env.local에 없음"
```

만약 CRON_SECRET이 .env.local에 없으면:
```bash
# Vercel에서 가져오기
vercel env pull .env.local
# 또는 Vercel 대시보드 > Settings > Environment Variables 에서 CRON_SECRET 복사 후:
echo 'CRON_SECRET=여기에붙여넣기' >> .env.local
source .env.local
```

---

## Cron 1: vat-rate-monitor (OECD API 검증)

### 1-A: OECD API가 실제로 응답하는지 확인

```bash
# 코드에서 사용하는 OECD 엔드포인트 확인
grep -n "oecd\|OECD\|stats.oecd" app/api/v1/cron/vat-rate-monitor/route.ts

# OECD API 직접 호출 테스트
curl -s -o /dev/null -w "HTTP %{http_code}, Size: %{size_download} bytes, Time: %{time_total}s\n" \
  "https://stats.oecd.org/SDMX-JSON/data/TABLE4.1/AUS+AUT+BEL+CAN+CHL+COL+CRI+CZE+DNK+EST+FIN+FRA+DEU+GRC+HUN+ISL+IRL+ISR+ITA+JPN+KOR+LVA+LTU+LUX+MEX+NLD+NZL+NOR+POL+PRT+SVK+SVN+ESP+SWE+CHE+TUR+GBR.VATRATE/all?startTime=2025&endTime=2026"
```

만약 200이 아니면 (OECD가 API를 이전했을 수 있음):
```bash
# 대체 OECD API 엔드포인트 시도
curl -s -o /dev/null -w "HTTP %{http_code}\n" \
  "https://sdmx.oecd.org/public/rest/data/OECD.CTP.TPS,DSD_tax_rates@DF_TABLE4_1/all?startPeriod=2025"

# 또는 OECD Data Explorer
curl -s -o /dev/null -w "HTTP %{http_code}\n" \
  "https://data-explorer.oecd.org/vis?df[ds]=DisseminateFinalDMZ&df[id]=DSD_TAX%40DF_TABLE4_1"
```

### 1-B: 실제 응답 데이터 파싱 확인

```bash
# OECD JSON 응답을 받아서 파싱 가능한지 확인
node -e "
fetch('https://stats.oecd.org/SDMX-JSON/data/TABLE4.1/KOR+JPN+DEU.VATRATE/all?startTime=2025&endTime=2026')
.then(r => {
  console.log('Status:', r.status);
  console.log('Content-Type:', r.headers.get('content-type'));
  return r.text();
})
.then(text => {
  console.log('Response length:', text.length);
  console.log('First 500 chars:', text.substring(0, 500));
  try {
    const json = JSON.parse(text);
    console.log('JSON 파싱: ✅ 성공');
    // SDMX 구조 확인
    if (json.dataSets) console.log('DataSets:', json.dataSets.length);
    if (json.structure) console.log('Structure keys:', Object.keys(json.structure));
  } catch(e) {
    console.log('JSON 파싱: ❌ 실패 -', e.message);
  }
})
.catch(e => console.error('❌ Fetch 실패:', e.message));
"
```

### 1-C: cron route 전체 실행 (로컬 또는 배포 URL)

```bash
# 방법 1: 배포된 Vercel URL로 호출 (CRON_SECRET 필요)
curl -s -w "\nHTTP %{http_code}\n" \
  -H "Authorization: Bearer $CRON_SECRET" \
  "$NEXT_PUBLIC_APP_URL/api/v1/cron/vat-rate-monitor" | head -50

# 방법 2: 로컬 dev 서버로 테스트 (별도 터미널에서 npm run dev 필요)
# curl -s "http://localhost:3000/api/v1/cron/vat-rate-monitor" | head -50
```

### 1-D: 결과 판정

```bash
echo "=== VAT Rate Monitor 판정 ==="
echo ""
echo "OECD API 응답: [200 OK / 에러코드 / 타임아웃]"
echo "JSON 파싱: [성공 / 실패]"
echo "VAT 세율 추출: [X개국 / 0개]"
echo "cron route 실행: [성공 / 실패]"
echo ""
echo "판정: [✅ 작동 확인 / ⚠️ API 변경으로 수정 필요 / ❌ 완전 실패]"
```

---

## Cron 2: de-minimis-monitor (HEAD 요청 검증)

### 2-A: 코드에서 모니터링하는 사이트 URL 확인

```bash
# 어떤 사이트들을 모니터링하는지 확인
grep -n "http\|url\|URL\|fetch\|HEAD" app/api/v1/cron/de-minimis-monitor/route.ts | head -20
```

### 2-B: 각 사이트 HEAD 요청 테스트

```bash
echo "=== De Minimis 모니터링 대상 사이트 HEAD 요청 테스트 ==="
echo ""

# Global Express Association (주요 소스)
echo "--- Global Express Association ---"
curl -sI -o /dev/null -w "HTTP %{http_code}, Last-Modified: " \
  "https://global-express.org/assets/files/Customs%20Committee/de-minimis/GEA_overview_of_de_minimis_value_2024.pdf"
curl -sI "https://global-express.org/assets/files/Customs%20Committee/de-minimis/GEA_overview_of_de_minimis_value_2024.pdf" | grep -i "last-modified\|content-length\|etag"
echo ""

# US CBP
echo "--- US CBP (de minimis) ---"
curl -sI -o /dev/null -w "HTTP %{http_code}\n" \
  "https://www.cbp.gov/trade/basic-import-export/internet-purchases"
curl -sI "https://www.cbp.gov/trade/basic-import-export/internet-purchases" | grep -i "last-modified\|content-length\|etag"
echo ""

# EU Customs
echo "--- EU Customs ---"
curl -sI -o /dev/null -w "HTTP %{http_code}\n" \
  "https://taxation-customs.ec.europa.eu/customs-4/customs-duties_en"
curl -sI "https://taxation-customs.ec.europa.eu/customs-4/customs-duties_en" | grep -i "last-modified\|content-length\|etag"
echo ""

# Canada CBSA
echo "--- Canada CBSA ---"
curl -sI -o /dev/null -w "HTTP %{http_code}\n" \
  "https://www.cbsa-asfc.gc.ca/travel-voyage/dte-acl/est-cal-eng.html"
curl -sI "https://www.cbsa-asfc.gc.ca/travel-voyage/dte-acl/est-cal-eng.html" | grep -i "last-modified\|content-length\|etag"
echo ""

# Australia ABF
echo "--- Australia ABF ---"
curl -sI -o /dev/null -w "HTTP %{http_code}\n" \
  "https://www.abf.gov.au/importing-exporting-and-manufacturing/importing/cost-of-importing-goods"
curl -sI "https://www.abf.gov.au/importing-exporting-and-manufacturing/importing/cost-of-importing-goods" | grep -i "last-modified\|content-length\|etag"
echo ""

echo "⚠️ last-modified 또는 etag가 없는 사이트는 HEAD 방식으로 변경 감지가 불가능."
echo "   → content-length 비교 또는 해시 방식으로 전환 필요."
```

### 2-C: cron route 실행

```bash
curl -s -w "\nHTTP %{http_code}\n" \
  -H "Authorization: Bearer $CRON_SECRET" \
  "$NEXT_PUBLIC_APP_URL/api/v1/cron/de-minimis-monitor" | head -50
```

### 2-D: 결과 판정

```bash
echo "=== De Minimis Monitor 판정 ==="
echo ""
echo "사이트별 HEAD 응답:"
echo "  Global Express: [200 + last-modified 있음 / 없음]"
echo "  US CBP: [200 + last-modified 있음 / 없음]"
echo "  EU: [200 + last-modified 있음 / 없음]"
echo "  Canada: [200 + last-modified 있음 / 없음]"
echo "  Australia: [200 + last-modified 있음 / 없음]"
echo ""
echo "last-modified 제공 사이트: [X/5]"
echo "cron route 실행: [성공 / 실패]"
echo ""
echo "판정: [✅ / ⚠️ 일부 사이트 감지 불가 / ❌ 완전 실패]"
echo ""
echo "💡 last-modified 없는 사이트는 content-length 또는 해시 방식으로 전환하거나,"
echo "   해당 국가는 Scheduled task 리마인더로 대체하는 게 현실적."
```

---

## Cron 3: us-tax-monitor (해시 비교 검증)

### 3-A: Tax Foundation 페이지 접근 + 해시 테스트

```bash
# 코드에서 사용하는 URL 확인
grep -n "taxfoundation\|tax-foundation\|Tax Foundation\|fetch" app/api/v1/cron/us-tax-monitor/route.ts | head -20
```

```bash
# Tax Foundation 페이지 접근 테스트
echo "=== Tax Foundation 페이지 접근 테스트 ==="

# 2026 sales tax 페이지
URL="https://taxfoundation.org/data/all/state/2026-sales-taxes/"
echo "URL: $URL"
curl -s -o /dev/null -w "HTTP %{http_code}, Size: %{size_download} bytes\n" "$URL"

# 해시 생성 (페이지 전체 vs 테이블만)
echo ""
echo "전체 페이지 해시:"
curl -s "$URL" | md5sum
echo ""

# 테이블만 추출해서 해시 (광고/배너 변경에 영향 안 받게)
echo "테이블 부분만 해시 (있으면):"
curl -s "$URL" | grep -o '<table[^>]*>.*</table>' | md5sum 2>/dev/null || echo "테이블 태그 미발견"
echo ""

# 5초 후 다시 해시 (동적 콘텐츠 확인)
sleep 5
echo "5초 후 재해시 (동일해야 정상):"
curl -s "$URL" | md5sum
```

### 3-B: false positive 테스트

```bash
echo "=== False Positive 테스트 ==="
echo ""
echo "동일 페이지를 3번 호출해서 해시가 매번 같은지 확인."
echo "다르면 → 페이지에 동적 콘텐츠(광고, 타임스탬프 등)가 있어서 해시 비교 방식이 무의미."
echo ""

HASH1=$(curl -s "$URL" | md5sum | cut -d' ' -f1)
HASH2=$(curl -s "$URL" | md5sum | cut -d' ' -f1)
HASH3=$(curl -s "$URL" | md5sum | cut -d' ' -f1)

echo "호출 1: $HASH1"
echo "호출 2: $HASH2"
echo "호출 3: $HASH3"

if [ "$HASH1" = "$HASH2" ] && [ "$HASH2" = "$HASH3" ]; then
  echo "✅ 3회 해시 동일 — 해시 비교 방식 유효"
else
  echo "❌ 해시 불일치 — 페이지에 동적 콘텐츠 있음. 해시 비교 무의미."
  echo "   → 대안: 테이블 태그만 추출해서 해시, 또는 특정 CSS selector만 비교"
fi
```

### 3-C: cron route 실행

```bash
curl -s -w "\nHTTP %{http_code}\n" \
  -H "Authorization: Bearer $CRON_SECRET" \
  "$NEXT_PUBLIC_APP_URL/api/v1/cron/us-tax-monitor" | head -50
```

### 3-D: 결과 판정

```bash
echo "=== US Tax Monitor 판정 ==="
echo ""
echo "Tax Foundation 접근: [200 OK / 에러]"
echo "해시 안정성: [3회 동일 / 매번 다름]"
echo "cron route 실행: [성공 / 실패]"
echo ""
echo "판정: [✅ / ⚠️ 해시 불안정 → 테이블만 추출 방식으로 수정 필요 / ❌ 완전 실패]"
```

---

## 최종 종합

```
Phase 2 Cron 검증 결과:

| Cron | 외부 소스 | 파싱 | route 실행 | 판정 |
|------|----------|------|-----------|------|
| vat-rate-monitor | OECD API: [?] | JSON 파싱: [?] | [?] | [?] |
| de-minimis-monitor | HEAD 요청: [?/5] | last-modified: [?/5] | [?] | [?] |
| us-tax-monitor | Tax Foundation: [?] | 해시 안정성: [?] | [?] | [?] |

실패한 cron에 대한 권고:
- OECD API 실패 → 대체 API 또는 Scheduled task 리마인더로 전환
- HEAD 요청 실패 → content-length/해시 방식으로 코드 수정 또는 Scheduled task로 대체
- 해시 불안정 → 테이블만 추출하도록 코드 수정 또는 Scheduled task로 대체
```

---

## 실행 방법

Claude Code 터미널에서:
```
docs/CW38_PHASE2_CRON_VERIFY_COMMANDS.md 파일을 읽고 Cron 1부터 Cron 3까지 순서대로 실행해줘. 각 cron의 판정 결과를 채워서 최종 종합 테이블을 완성해줘.
```
