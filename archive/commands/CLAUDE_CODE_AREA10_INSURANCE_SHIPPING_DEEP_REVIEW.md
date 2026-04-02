# Area 10: Insurance & Shipping — Deep Review Command

## 실행 방법
아래 전체를 Claude Code 터미널에 한 번에 붙여넣기

```
echo "=== Area 10: Insurance & Shipping Deep Review ===" && echo "시작: $(date '+%Y-%m-%d %H:%M:%S KST')" && echo "" && \
echo "##############################" && \
echo "# Phase 1: 코드 읽기" && \
echo "##############################" && \
echo "" && \

# 1. Insurance/Shipping 관련 파일 찾기
echo "=== Insurance/Shipping 관련 파일 ===" && \
find app/lib -type f -name "*.ts" | xargs grep -l -i "insurance\|shipping.*calc\|freight\|CIF\|FOB\|EXW\|incoterm" 2>/dev/null | head -20 && \
find app/api -type f -name "route.ts" | xargs grep -l -i "insurance\|shipping\|freight\|incoterm" 2>/dev/null | head -20 && \
echo "" && \

# 2. 핵심 파일 읽기
echo "=== 핵심 파일 읽기 ===" && \
for f in $(find app/lib -type f -name "*.ts" | xargs grep -l -i "insurance.*calc\|calcInsurance\|insuranceRate\|insurance_cost" 2>/dev/null | head -3); do
  echo "--- FILE: $f ($(wc -l < "$f") lines) ---"
  cat -n "$f"
  echo ""
done && \

for f in $(find app/lib -type f -name "*.ts" | xargs grep -l -i "shipping.*calc\|calcShipping\|shippingCost\|freight.*calc" 2>/dev/null | head -3); do
  echo "--- FILE: $f ($(wc -l < "$f") lines) ---"
  cat -n "$f"
  echo ""
done && \

# 3. incoterms 관련
echo "=== Incoterms 파일 ===" && \
for f in $(find app/lib -type f -name "*incoterm*" 2>/dev/null | head -3); do
  echo "--- FILE: $f ($(wc -l < "$f") lines) ---"
  cat -n "$f"
  echo ""
done && \

# 4. GlobalCostEngine에서 insurance/shipping 사용 부분
echo "=== GlobalCostEngine insurance/shipping ===" && \
grep -n -B2 -A5 "insurance\|shipping\|freight\|CIF\|FOB\|incoterm" app/lib/cost-engine/GlobalCostEngine.ts 2>/dev/null | head -60 && \
echo "" && \

# 5. CostEngine에서 insurance/shipping 사용 부분
echo "=== CostEngine insurance/shipping ===" && \
grep -n -B2 -A5 "insurance\|shipping\|freight\|CIF\|FOB\|incoterm" app/lib/cost-engine/CostEngine.ts 2>/dev/null | head -60 && \
echo "" && \

# 6. API routes
echo "=== Insurance/Shipping API routes ===" && \
for f in $(find app/api -path "*insurance*" -o -path "*shipping*" -o -path "*incoterm*" 2>/dev/null | grep "route.ts" | head -5); do
  echo "--- FILE: $f ($(wc -l < "$f") lines) ---"
  cat -n "$f"
  echo ""
done && \

echo "##############################" && \
echo "# Phase 2: 10개 영역 분석" && \
echo "##############################" && \
echo "" && \

echo "=== 분석 1: Insurance 계산 공식 ===" && \
grep -rn "insuranceRate\|insurance.*percent\|insurance.*factor\|0\.005\|0\.01\|0\.02\|insurance.*cost" app/lib/cost-engine/ --include="*.ts" 2>/dev/null | head -15 && \
echo "" && \

echo "=== 분석 2: Shipping 계산 공식 ===" && \
grep -rn "shipping.*cost\|freight.*cost\|shipping.*rate\|delivery.*cost" app/lib/cost-engine/ --include="*.ts" 2>/dev/null | head -15 && \
echo "" && \

echo "=== 분석 3: CIF/FOB/EXW Incoterms 처리 ===" && \
grep -rn "CIF\|FOB\|EXW\|DDP\|DAP\|FCA\|CPT\|CIP\|DAT\|DPU\|FAS\|CFR" app/lib/cost-engine/ --include="*.ts" 2>/dev/null | head -20 && \
echo "" && \

echo "=== 분석 4: Customs Value 계산 (CIF 기반) ===" && \
grep -rn "customs.*value\|customsValue\|dutiable.*value\|CIF.*value\|assessable" app/lib/cost-engine/ --include="*.ts" 2>/dev/null | head -15 && \
echo "" && \

echo "=== 분석 5: 국가별 Customs Valuation 차이 ===" && \
grep -rn "valuation.*method\|transaction.*value\|computed.*value\|deductive\|identical\|similar" app/lib/ --include="*.ts" 2>/dev/null | head -10 && \
echo "" && \

echo "=== 분석 6: Insurance 디폴트값 ===" && \
grep -rn "default.*insurance\|insurance.*default\|insuranceCost.*0\|insurance.*null\|insurance.*undefined" app/lib/cost-engine/ --include="*.ts" 2>/dev/null | head -10 && \
echo "" && \

echo "=== 분석 7: Shipping 디폴트값 ===" && \
grep -rn "default.*shipping\|shipping.*default\|shippingCost.*0\|shipping.*null\|shipping.*undefined" app/lib/cost-engine/ --include="*.ts" 2>/dev/null | head -10 && \
echo "" && \

echo "=== 분석 8: TLC에서 insurance+shipping 합산 위치 ===" && \
grep -n "totalLandedCost\|total.*landed\|TLC\|landed.*cost" app/lib/cost-engine/GlobalCostEngine.ts 2>/dev/null | head -10 && \
grep -n "totalLandedCost\|total.*landed\|TLC\|landed.*cost" app/lib/cost-engine/CostEngine.ts 2>/dev/null | head -10 && \
echo "" && \

echo "=== 분석 9: 무게 기반 shipping (weight-based) ===" && \
grep -rn "weight\|kg\|lbs\|volumetric\|dimensional" app/lib/cost-engine/ --include="*.ts" 2>/dev/null | head -10 && \
echo "" && \

echo "=== 분석 10: API 입력 파라미터 (insurance/shipping) ===" && \
grep -rn "insuranceCost\|shippingCost\|insurance_cost\|shipping_cost\|freight" app/api/ --include="*.ts" 2>/dev/null | head -15 && \
echo "" && \

echo "##############################" && \
echo "# Phase 3: 테스트 케이스" && \
echo "##############################" && \
echo "" && \

echo "=== TC-01: 기본 TLC 계산 (shipping+insurance 포함) ===" && \
npx tsx -e "
import { GlobalCostEngine } from './app/lib/cost-engine/GlobalCostEngine';
async function test() {
  try {
    const engine = new GlobalCostEngine();
    const result = await engine.calculate({
      productName: 'Cotton T-Shirt',
      hsCode: '6109.10',
      originCountry: 'CN',
      destinationCountry: 'US',
      productValue: 100,
      shippingCost: 15,
      insuranceCost: 2
    });
    console.log('productValue:', result?.productValue || result?.product_value);
    console.log('shippingCost:', result?.shippingCost || result?.shipping_cost);
    console.log('insuranceCost:', result?.insuranceCost || result?.insurance_cost);
    console.log('customsValue:', result?.customsValue || result?.customs_value);
    console.log('totalLandedCost:', result?.totalLandedCost || result?.total_landed_cost);
    console.log('Keys:', Object.keys(result || {}).join(', '));
  } catch(e) { console.log('Error:', e.message?.substring(0, 200)); }
}
test();
" 2>&1 | head -15 && \
echo "" && \

echo "=== TC-02: shipping=0, insurance=0 ===" && \
npx tsx -e "
import { GlobalCostEngine } from './app/lib/cost-engine/GlobalCostEngine';
async function test() {
  try {
    const engine = new GlobalCostEngine();
    const result = await engine.calculate({
      productName: 'Cotton T-Shirt',
      hsCode: '6109.10',
      originCountry: 'CN',
      destinationCountry: 'US',
      productValue: 100,
      shippingCost: 0,
      insuranceCost: 0
    });
    console.log('customsValue:', result?.customsValue || result?.customs_value);
    console.log('TLC:', result?.totalLandedCost || result?.total_landed_cost);
    console.log('customsValue should equal productValue (FOB)');
  } catch(e) { console.log('Error:', e.message?.substring(0, 200)); }
}
test();
" 2>&1 | head -10 && \
echo "" && \

echo "=== TC-03: shipping만 있고 insurance 없음 (자동 계산 확인) ===" && \
npx tsx -e "
import { GlobalCostEngine } from './app/lib/cost-engine/GlobalCostEngine';
async function test() {
  try {
    const engine = new GlobalCostEngine();
    const result = await engine.calculate({
      productName: 'Laptop',
      hsCode: '8471.30',
      originCountry: 'CN',
      destinationCountry: 'GB',
      productValue: 1000,
      shippingCost: 50
    });
    console.log('insuranceCost:', result?.insuranceCost || result?.insurance_cost || 'not in response');
    console.log('customsValue:', result?.customsValue || result?.customs_value);
    console.log('TLC:', result?.totalLandedCost || result?.total_landed_cost);
  } catch(e) { console.log('Error:', e.message?.substring(0, 200)); }
}
test();
" 2>&1 | head -10 && \
echo "" && \

echo "=== TC-04: 고가 상품 insurance (보석 $10,000) ===" && \
npx tsx -e "
import { GlobalCostEngine } from './app/lib/cost-engine/GlobalCostEngine';
async function test() {
  try {
    const engine = new GlobalCostEngine();
    const result = await engine.calculate({
      productName: 'Gold Necklace',
      hsCode: '7113.19',
      originCountry: 'IT',
      destinationCountry: 'US',
      productValue: 10000,
      shippingCost: 30,
      insuranceCost: 100
    });
    console.log('productValue:', result?.productValue || result?.product_value);
    console.log('customsValue:', result?.customsValue || result?.customs_value);
    console.log('TLC:', result?.totalLandedCost || result?.total_landed_cost);
  } catch(e) { console.log('Error:', e.message?.substring(0, 200)); }
}
test();
" 2>&1 | head -10 && \
echo "" && \

echo "=== TC-05: Incoterms 함수 테스트 ===" && \
npx tsx -e "
async function test() {
  try {
    const mod = await import('./app/lib/cost-engine/incoterms');
    const fns = Object.keys(mod);
    console.log('Incoterms exports:', fns);
    for (const fn of fns) {
      if (typeof mod[fn] === 'function') {
        try {
          const result = mod[fn]('CIF');
          console.log(fn + '(CIF):', JSON.stringify(result)?.substring(0, 100));
        } catch(e) {
          try {
            const result = mod[fn]({ incoterm: 'CIF', productValue: 100, shippingCost: 15, insuranceCost: 2 });
            console.log(fn + '({CIF, 100, 15, 2}):', JSON.stringify(result)?.substring(0, 100));
          } catch(e2) { console.log(fn + ': different params needed'); }
        }
      }
    }
  } catch(e) { console.log('Incoterms module:', e.message?.substring(0, 100)); }
}
test();
" 2>&1 | head -15 && \
echo "" && \

echo "=== TC-06: insurance-calculator 독립 테스트 ===" && \
npx tsx -e "
async function test() {
  try {
    const mod = await import('./app/lib/cost-engine/insurance-calculator');
    const fns = Object.keys(mod);
    console.log('Insurance exports:', fns);
    for (const fn of fns) {
      if (typeof mod[fn] === 'function') {
        try {
          const result = mod[fn]({ productValue: 1000, shippingCost: 50, hsCode: '6109.10' });
          console.log(fn + ':', JSON.stringify(result)?.substring(0, 150));
        } catch(e) {
          try {
            const result = mod[fn](1000, 50);
            console.log(fn + '(1000, 50):', result);
          } catch(e2) { console.log(fn + ': params needed'); }
        }
      }
    }
  } catch(e) { console.log('Insurance module:', e.message?.substring(0, 100)); }
}
test();
" 2>&1 | head -10 && \
echo "" && \

echo "=== TC-07: shipping-calculator 독립 테스트 ===" && \
npx tsx -e "
async function test() {
  try {
    const mod = await import('./app/lib/cost-engine/shipping-calculator');
    const fns = Object.keys(mod);
    console.log('Shipping exports:', fns);
    for (const fn of fns) {
      if (typeof mod[fn] === 'function') {
        try {
          const result = mod[fn]({ originCountry: 'CN', destinationCountry: 'US', weight: 2, productValue: 100 });
          console.log(fn + ':', JSON.stringify(result)?.substring(0, 150));
        } catch(e) { console.log(fn + ': error', e.message?.substring(0, 80)); }
      }
    }
  } catch(e) { console.log('Shipping module:', e.message?.substring(0, 100)); }
}
test();
" 2>&1 | head -10 && \
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

cat > AREA10_INSURANCE_SHIPPING_RESULT.md << 'RESULTEOF'
# Area 10: Insurance & Shipping — Deep Review Result
# 2026-03-23 KST

## Phase 1: 읽은 파일
- (파일 목록)

## Phase 2: 10개 영역 분석 결과
1. Insurance 계산 공식
2. Shipping 계산 공식
3. CIF/FOB/EXW Incoterms 처리
4. Customs Value 계산
5. 국가별 Valuation 차이
6. Insurance 디폴트값
7. Shipping 디폴트값
8. TLC 합산 위치
9. 무게 기반 shipping
10. API 입력 파라미터

## Phase 3: 테스트 결과
- TC-01~07

## Phase 4: 빌드 + Regression

## 버그 발견

## 수정 사항
RESULTEOF

echo "결과 파일: AREA10_INSURANCE_SHIPPING_RESULT.md 생성 완료" && \
echo "" && \

python3 << 'PYEOF'
import os, datetime
try:
    from openpyxl import load_workbook
    wb = load_workbook('POTAL_Claude_Code_Work_Log.xlsx')
    sheet_name = datetime.datetime.now().strftime('%y%m%d%H%M')
    ws = wb.create_sheet(title=sheet_name)
    ws.append(['순번', '시간', '구분', '상세내용', '파일경로', '상태'])
    ws.append([1, datetime.datetime.now().strftime('%H:%M:%S'), 'COMMAND', 'Area 10 Insurance & Shipping Deep Review', 'CLAUDE_CODE_AREA10_INSURANCE_SHIPPING_DEEP_REVIEW.md', '✅성공'])
    ws.append([2, datetime.datetime.now().strftime('%H:%M:%S'), 'ANALYSIS', 'Insurance/Shipping 계산, Incoterms, CIF/FOB, Customs Value, 디폴트값 분석', '', '⏳진행중'])
    wb.save('POTAL_Claude_Code_Work_Log.xlsx')
    print(f'✅ Work log updated: {sheet_name}')
except Exception as e:
    print(f'Work log error: {e}')
PYEOF

echo "" && \
echo "Area 10 Complete. 대기 중."
```
