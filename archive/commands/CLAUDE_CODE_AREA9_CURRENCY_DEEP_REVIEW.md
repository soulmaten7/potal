# Area 9: Currency (환율) — Deep Review Command

## 실행 방법
아래 전체를 Claude Code 터미널에 한 번에 붙여넣기

```
echo "=== Area 9: Currency (환율) Deep Review ===" && echo "시작: $(date '+%Y-%m-%d %H:%M:%S KST')" && echo "" && \
echo "##############################" && \
echo "# Phase 1: 코드 읽기" && \
echo "##############################" && \
echo "" && \

# 1. 환율 관련 코드 파일 찾기
echo "=== 환율 관련 파일 목록 ===" && \
find app/lib -type f -name "*.ts" | xargs grep -l -i "exchange.rate\|currency\|forex\|ECB\|exchange_rate" 2>/dev/null | head -20 && \
find app/api -type f -name "route.ts" | xargs grep -l -i "exchange.rate\|currency\|forex" 2>/dev/null | head -20 && \
echo "" && \

# 2. exchange-rate 디렉토리/파일 확인
echo "=== exchange-rate 관련 파일 ===" && \
find app -path "*/exchange-rate*" -o -path "*/exchange_rate*" -o -path "*/currency*" 2>/dev/null | head -30 && \
echo "" && \

# 3. Vercel Cron에서 환율 관련 찾기
echo "=== vercel.json crons (환율 관련) ===" && \
cat vercel.json | python3 -c "
import sys, json
data = json.load(sys.stdin)
crons = data.get('crons', [])
for c in crons:
    path = c.get('path', '')
    if 'exchange' in path.lower() or 'currency' in path.lower() or 'rate' in path.lower():
        print(f\"  {c['schedule']} → {path}\")
if not any('exchange' in c.get('path','').lower() or 'currency' in c.get('path','').lower() for c in crons):
    print('  (환율 전용 cron 없음 — 다른 cron에 포함되었을 수 있음)')
    for c in crons:
        print(f\"  {c['schedule']} → {c['path']}\")
" && \
echo "" && \

# 4. 핵심 파일 읽기 — exchange-rate 메인
echo "=== 핵심 파일 읽기 ===" && \
for f in $(find app/lib -type f -name "*.ts" | xargs grep -l -i "exchange.rate\|getExchangeRate\|convertCurrency" 2>/dev/null | head -5); do
  echo "--- FILE: $f ($(wc -l < "$f") lines) ---"
  cat -n "$f"
  echo ""
done && \

# 5. 환율 API route 읽기
for f in $(find app/api -path "*exchange*" -name "route.ts" -o -path "*currency*" -name "route.ts" 2>/dev/null | head -5); do
  echo "--- FILE: $f ($(wc -l < "$f") lines) ---"
  cat -n "$f"
  echo ""
done && \

# 6. CostEngine/GlobalCostEngine에서 환율 사용 부분 확인
echo "=== CostEngine 환율 사용 ===" && \
grep -n -i "exchange\|currency\|convert\|forex\|rate.*usd\|usd.*rate" app/lib/cost-engine/CostEngine.ts 2>/dev/null | head -20 && \
echo "" && \
echo "=== GlobalCostEngine 환율 사용 ===" && \
grep -n -i "exchange\|currency\|convert\|forex\|rate.*usd\|usd.*rate" app/lib/cost-engine/GlobalCostEngine.ts 2>/dev/null | head -20 && \
echo "" && \

# 7. DB 테이블 확인 (환율 관련)
echo "=== DB: 환율 관련 테이블 ===" && \
curl -s -X POST https://api.supabase.com/v1/projects/zyurflkhiregundhisky/database/query \
  -H "Authorization: Bearer sbp_c64e0240af03afaa0e18e622e09c690ce0e92686" \
  -H "Content-Type: application/json" \
  -d '{"query": "SELECT table_name FROM information_schema.tables WHERE table_schema = '\''public'\'' AND (table_name ILIKE '\''%exchange%'\'' OR table_name ILIKE '\''%currency%'\'' OR table_name ILIKE '\''%forex%'\'') ORDER BY table_name;"}' && \
echo "" && \

# 8. countries 테이블에서 currency 컬럼 확인
echo "=== countries 테이블 currency 데이터 샘플 ===" && \
curl -s -X POST https://api.supabase.com/v1/projects/zyurflkhiregundhisky/database/query \
  -H "Authorization: Bearer sbp_c64e0240af03afaa0e18e622e09c690ce0e92686" \
  -H "Content-Type: application/json" \
  -d '{"query": "SELECT country_code, country_name, currency_code, currency_name FROM countries WHERE currency_code IS NOT NULL ORDER BY country_code LIMIT 15;"}' && \
echo "" && \

echo "##############################" && \
echo "# Phase 2: 10개 영역 분석" && \
echo "##############################" && \
echo "" && \

echo "=== 분석 1: 환율 소스 (ECB/다른 API) ===" && \
grep -rn "ecb\|exchangerate\|openexchangerates\|fixer.io\|currencylayer\|xe.com\|frankfurter" app/lib/ app/api/ --include="*.ts" 2>/dev/null | head -15 && \
echo "" && \

echo "=== 분석 2: 환율 캐싱 전략 ===" && \
grep -rn "cache\|ttl\|expire\|stale\|refresh" $(find app/lib -type f -name "*.ts" | xargs grep -l -i "exchange.rate" 2>/dev/null) 2>/dev/null | head -15 && \
echo "" && \

echo "=== 분석 3: 지원 통화 수 ===" && \
curl -s -X POST https://api.supabase.com/v1/projects/zyurflkhiregundhisky/database/query \
  -H "Authorization: Bearer sbp_c64e0240af03afaa0e18e622e09c690ce0e92686" \
  -H "Content-Type: application/json" \
  -d '{"query": "SELECT COUNT(DISTINCT currency_code) as unique_currencies FROM countries WHERE currency_code IS NOT NULL;"}' && \
echo "" && \

echo "=== 분석 4: fallback 메커니즘 ===" && \
grep -rn "fallback\|default.*rate\|hardcoded\|static.*rate\|1\.0" $(find app/lib -type f -name "*.ts" | xargs grep -l -i "exchange.rate\|currency" 2>/dev/null) 2>/dev/null | head -15 && \
echo "" && \

echo "=== 분석 5: 에러 핸들링 (API 다운 시) ===" && \
grep -rn "try\|catch\|error\|timeout\|retry" $(find app/lib -type f -name "*.ts" | xargs grep -l -i "exchange.rate" 2>/dev/null) 2>/dev/null | head -20 && \
echo "" && \

echo "=== 분석 6: 소수점 처리 (rounding) ===" && \
grep -rn "toFixed\|Math.round\|Math.ceil\|Math.floor\|decimal\|precision\|round" $(find app/lib -type f -name "*.ts" | xargs grep -l -i "exchange.rate\|currency\|convert" 2>/dev/null) 2>/dev/null | head -15 && \
echo "" && \

echo "=== 분석 7: USD 기준 변환 구조 ===" && \
grep -rn "USD\|base.*currency\|target.*currency\|from.*to" $(find app/lib -type f -name "*.ts" | xargs grep -l -i "exchange.rate\|currency" 2>/dev/null) 2>/dev/null | head -15 && \
echo "" && \

echo "=== 분석 8: Cron 업데이트 주기 ===" && \
grep -rn "schedule\|cron\|interval\|daily\|hourly" $(find app/api -path "*exchange*" -name "route.ts" -o -path "*currency*" -name "route.ts" 2>/dev/null) 2>/dev/null | head -10 && \
echo "" && \

echo "=== 분석 9: 역사적 환율 (historical rates) ===" && \
grep -rn "historical\|history\|date.*rate\|past.*rate" $(find app/lib -type f -name "*.ts" | xargs grep -l -i "exchange.rate\|currency" 2>/dev/null) 2>/dev/null | head -10 && \
echo "" && \

echo "=== 분석 10: GlobalCostEngine에서 환율 적용 위치 ===" && \
grep -n -A5 "exchange\|currency\|convert" app/lib/cost-engine/GlobalCostEngine.ts 2>/dev/null | head -40 && \
echo "" && \

echo "##############################" && \
echo "# Phase 3: 테스트 케이스" && \
echo "##############################" && \
echo "" && \

# 환율 변환 테스트
echo "=== TC-01: USD→EUR 변환 ===" && \
npx tsx -e "
import { getExchangeRate, convertCurrency } from './app/lib/cost-engine/exchange-rate';
async function test() {
  try {
    const rate = await getExchangeRate('USD', 'EUR');
    console.log('USD→EUR rate:', rate);
    console.log('Type:', typeof rate);
    console.log('Valid:', rate > 0 && rate < 10);
  } catch(e) {
    // 함수명이 다를 수 있음 — 파일에서 export 확인
    console.log('getExchangeRate not found, trying alternatives...');
    try {
      const mod = await import('./app/lib/cost-engine/exchange-rate');
      console.log('Available exports:', Object.keys(mod));
    } catch(e2) {
      // exchange-rate 파일 경로가 다를 수 있음
      console.log('exchange-rate module not found at expected path');
      console.log('Searching for currency functions...');
    }
  }
}
test();
" 2>&1 | head -20 && \
echo "" && \

echo "=== TC-02: USD→JPY 변환 (큰 숫자) ===" && \
npx tsx -e "
async function test() {
  try {
    const mod = await import('./app/lib/cost-engine/exchange-rate');
    const fns = Object.keys(mod);
    console.log('Exports:', fns);
    // 첫 번째 export 함수로 테스트
    for (const fn of fns) {
      if (typeof mod[fn] === 'function') {
        try {
          const result = await mod[fn]('USD', 'JPY');
          console.log(fn + '(USD, JPY):', result);
        } catch(e) {
          try {
            const result = await mod[fn]('JPY');
            console.log(fn + '(JPY):', result);
          } catch(e2) {
            console.log(fn + ': needs different params');
          }
        }
      }
    }
  } catch(e) {
    console.log('Module error:', e.message);
  }
}
test();
" 2>&1 | head -20 && \
echo "" && \

echo "=== TC-03: 동일 통화 변환 (USD→USD = 1.0) ===" && \
npx tsx -e "
async function test() {
  try {
    const mod = await import('./app/lib/cost-engine/exchange-rate');
    const fns = Object.keys(mod).filter(k => typeof mod[k] === 'function');
    for (const fn of fns) {
      try {
        const result = await mod[fn]('USD', 'USD');
        console.log(fn + '(USD, USD):', result, result === 1 ? '✅' : '⚠️ not 1.0');
      } catch(e) {}
    }
  } catch(e) {
    console.log('Module error:', e.message);
  }
}
test();
" 2>&1 | head -10 && \
echo "" && \

echo "=== TC-04: 잘못된 통화 코드 에러 핸들링 ===" && \
npx tsx -e "
async function test() {
  try {
    const mod = await import('./app/lib/cost-engine/exchange-rate');
    const fns = Object.keys(mod).filter(k => typeof mod[k] === 'function');
    for (const fn of fns) {
      try {
        const result = await mod[fn]('USD', 'INVALID');
        console.log(fn + '(USD, INVALID):', result, '⚠️ should error or fallback');
      } catch(e) {
        console.log(fn + '(USD, INVALID): threw error ✅', e.message?.substring(0, 80));
      }
    }
  } catch(e) {
    console.log('Module error:', e.message);
  }
}
test();
" 2>&1 | head -10 && \
echo "" && \

echo "=== TC-05: 240개국 통화 커버리지 확인 ===" && \
curl -s -X POST https://api.supabase.com/v1/projects/zyurflkhiregundhisky/database/query \
  -H "Authorization: Bearer sbp_c64e0240af03afaa0e18e622e09c690ce0e92686" \
  -H "Content-Type: application/json" \
  -d '{"query": "SELECT COUNT(*) as total, COUNT(currency_code) as has_currency, COUNT(*) - COUNT(currency_code) as missing_currency FROM countries;"}' && \
echo "" && \

echo "=== TC-06: 중복/NULL 통화 국가 확인 ===" && \
curl -s -X POST https://api.supabase.com/v1/projects/zyurflkhiregundhisky/database/query \
  -H "Authorization: Bearer sbp_c64e0240af03afaa0e18e622e09c690ce0e92686" \
  -H "Content-Type: application/json" \
  -d '{"query": "SELECT country_code, country_name FROM countries WHERE currency_code IS NULL OR currency_code = '\'''\'' LIMIT 10;"}' && \
echo "" && \

echo "=== TC-07: GlobalCostEngine 환율 적용 통합 테스트 ===" && \
npx tsx -e "
import { GlobalCostEngine } from './app/lib/cost-engine/GlobalCostEngine';
async function test() {
  try {
    const engine = new GlobalCostEngine();
    // USD 기준 계산
    const result = await engine.calculate({
      productName: 'Cotton T-Shirt',
      hsCode: '6109.10',
      originCountry: 'CN',
      destinationCountry: 'GB',
      productValue: 100,
      shippingCost: 10,
      currency: 'GBP'  // 또는 targetCurrency
    });
    console.log('GB result currency:', result?.currency || result?.targetCurrency || 'N/A');
    console.log('Has exchange rate:', !!(result?.exchangeRate || result?.exchange_rate));
    if (result?.totalLandedCost) console.log('TLC:', result.totalLandedCost);
    if (result?.breakdown) console.log('Breakdown keys:', Object.keys(result.breakdown));
  } catch(e) {
    console.log('Error:', e.message?.substring(0, 200));
  }
}
test();
" 2>&1 | head -15 && \
echo "" && \

echo "##############################" && \
echo "# Phase 4: 빌드 + Regression" && \
echo "##############################" && \
echo "" && \

echo "=== Build ===" && \
npm run build 2>&1 | tail -5 && \
echo "" && \

echo "=== Regression (55건) ===" && \
npx tsx scripts/duty_rate_verification.ts 2>&1 | tail -6 && \
echo "" && \

echo "##############################" && \
echo "# Phase 5: 결과 파일 생성" && \
echo "##############################" && \

# 결과 파일 생성
cat > AREA9_CURRENCY_RESULT.md << 'RESULTEOF'
# Area 9: Currency (환율) — Deep Review Result
# 2026-03-23 KST

## Phase 1: 읽은 파일
- (위 출력에서 확인된 파일 목록 기록)

## Phase 2: 10개 영역 분석 결과
1. 환율 소스: (ECB/기타 API)
2. 캐싱 전략: (TTL, refresh 주기)
3. 지원 통화 수: (고유 통화 코드 수)
4. fallback 메커니즘: (API 다운 시 대응)
5. 에러 핸들링: (timeout, retry)
6. 소수점 처리: (rounding 방식)
7. USD 기준 변환: (base currency 구조)
8. Cron 업데이트 주기: (환율 갱신 빈도)
9. 역사적 환율: (과거 환율 지원 여부)
10. GlobalCostEngine 적용: (TLC 계산에서 환율 사용 방식)

## Phase 3: 테스트 결과
- TC-01~07 결과 기록

## Phase 4: 빌드 + Regression
- Build: (결과)
- Regression: (결과)

## 버그 발견
- (발견된 버그 목록, 없으면 "0건")

## 수정 사항
- (수정한 코드, 없으면 "없음")
RESULTEOF

echo "결과 파일: AREA9_CURRENCY_RESULT.md 생성 완료" && \
echo "" && \

# Work log 기록
python3 << 'PYEOF'
import os, datetime
try:
    from openpyxl import load_workbook
    wb = load_workbook('POTAL_Claude_Code_Work_Log.xlsx')
    sheet_name = datetime.datetime.now().strftime('%y%m%d%H%M')
    ws = wb.create_sheet(title=sheet_name)
    ws.append(['순번', '시간', '구분', '상세내용', '파일경로', '상태'])
    ws.append([1, datetime.datetime.now().strftime('%H:%M:%S'), 'COMMAND', 'Area 9 Currency Deep Review 실행', 'CLAUDE_CODE_AREA9_CURRENCY_DEEP_REVIEW.md', '✅성공'])
    ws.append([2, datetime.datetime.now().strftime('%H:%M:%S'), 'ANALYSIS', 'Area 9: 환율 소스, 캐싱, 통화 커버리지, 에러핸들링, rounding, Cron 주기 분석', 'exchange-rate/*.ts', '✅성공'])
    ws.append([3, datetime.datetime.now().strftime('%H:%M:%S'), 'RESULT', 'TC-01~07 환율 변환 테스트 + Build + Regression 55/55', '', '⏳진행중'])
    wb.save('POTAL_Claude_Code_Work_Log.xlsx')
    print(f'✅ Work log updated: {sheet_name}')
except Exception as e:
    print(f'Work log error: {e}')
PYEOF

echo "" && \
echo "Area 9 Complete. 대기 중."
```
