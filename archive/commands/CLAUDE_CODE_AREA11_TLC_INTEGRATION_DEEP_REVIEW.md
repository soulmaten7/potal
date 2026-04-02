# Area 11: 통합 TLC (Total Landed Cost) End-to-End — Deep Review Command

## 실행 방법
아래 전체를 Claude Code 터미널에 한 번에 붙여넣기

```
echo "=== Area 11: 통합 TLC End-to-End Deep Review ===" && echo "시작: $(date '+%Y-%m-%d %H:%M:%S KST')" && echo "" && \
echo "##############################" && \
echo "# Phase 1: 핵심 통합 코드 읽기" && \
echo "##############################" && \
echo "" && \

# 1. GlobalCostEngine 전체 읽기 (통합 엔진)
echo "=== GlobalCostEngine.ts (전체) ===" && \
wc -l app/lib/cost-engine/GlobalCostEngine.ts && \
cat -n app/lib/cost-engine/GlobalCostEngine.ts && \
echo "" && \

# 2. CostEngine 전체 읽기 (코어 엔진)
echo "=== CostEngine.ts (전체) ===" && \
wc -l app/lib/cost-engine/CostEngine.ts && \
cat -n app/lib/cost-engine/CostEngine.ts && \
echo "" && \

# 3. calculate API route
echo "=== /api/v1/calculate route ===" && \
for f in $(find app/api/v1/calculate -name "route.ts" 2>/dev/null | head -3); do
  echo "--- $f ($(wc -l < "$f") lines) ---"
  cat -n "$f"
  echo ""
done && \

# 4. breakdown/compare/whatif routes
echo "=== 추가 calculate routes ===" && \
for f in $(find app/api/v1/calculate -name "route.ts" 2>/dev/null); do
  echo "--- $f ---"
  head -30 "$f"
  echo ""
done && \

echo "##############################" && \
echo "# Phase 2: 12 TLC 영역 통합 분석" && \
echo "##############################" && \
echo "" && \

echo "=== 분석 1: calculate() 메인 함수 흐름 ===" && \
grep -n "async.*calculate\|await.*calculate\|return.*result" app/lib/cost-engine/GlobalCostEngine.ts 2>/dev/null | head -20 && \
echo "" && \

echo "=== 분석 2: 12개 영역 호출 순서 ===" && \
grep -n "duty\|vat\|gst\|deminimis\|de_minimis\|customs.*fee\|special.*tax\|exchange\|insurance\|shipping\|sanction\|export.*control\|fta\|remedy\|AD\|CVD" app/lib/cost-engine/GlobalCostEngine.ts 2>/dev/null | head -40 && \
echo "" && \

echo "=== 분석 3: TLC 합산 공식 ===" && \
grep -n -A10 "totalLandedCost\|total_landed_cost\|totalCost\|grandTotal" app/lib/cost-engine/GlobalCostEngine.ts 2>/dev/null | head -30 && \
echo "" && \

echo "=== 분석 4: API 응답 스키마 ===" && \
grep -n "return.*{" app/lib/cost-engine/GlobalCostEngine.ts 2>/dev/null | tail -5 && \
echo "---" && \
grep -n "breakdown\|dutyRate\|vatRate\|totalDuty\|totalVat\|totalTax" app/lib/cost-engine/GlobalCostEngine.ts 2>/dev/null | head -20 && \
echo "" && \

echo "=== 분석 5: 에러 핸들링 (각 영역 실패 시) ===" && \
grep -n "try\|catch\|fallback\|default\|??.*0\||| 0" app/lib/cost-engine/GlobalCostEngine.ts 2>/dev/null | head -20 && \
echo "" && \

echo "=== 분석 6: 캐싱 (precomputed_landed_costs) ===" && \
grep -rn "precomputed\|cache\|cached\|lookup.*first" app/lib/cost-engine/GlobalCostEngine.ts 2>/dev/null | head -10 && \
echo "" && \

echo "=== 분석 7: country-data.ts 통합 ===" && \
grep -n "getCountryData\|countryData\|country_data\|processingFee\|deminimis\|deMinimis" app/lib/cost-engine/GlobalCostEngine.ts 2>/dev/null | head -15 && \
echo "" && \

echo "=== 분석 8: 소수점/반올림 최종 처리 ===" && \
grep -n "toFixed\|Math.round\|parseFloat\|Number(" app/lib/cost-engine/GlobalCostEngine.ts 2>/dev/null | head -10 && \
grep -n "toFixed\|Math.round\|parseFloat\|Number(" app/lib/cost-engine/CostEngine.ts 2>/dev/null | head -10 && \
echo "" && \

echo "=== 분석 9: 다중 목적지 (compare) ===" && \
grep -rn "compare\|multiple.*dest\|batch\|countries.*array" app/api/v1/calculate/ --include="*.ts" 2>/dev/null | head -10 && \
echo "" && \

echo "=== 분석 10: API 인증 + Rate Limiting ===" && \
grep -rn "apiKey\|X-API-Key\|rate.*limit\|plan.*check\|authenticate" app/api/v1/calculate/ --include="*.ts" 2>/dev/null | head -10 && \
echo "" && \

echo "##############################" && \
echo "# Phase 3: End-to-End 테스트" && \
echo "##############################" && \
echo "" && \

echo "=== E2E-01: CN→US Cotton T-Shirt (기본 케이스) ===" && \
npx tsx -e "
import { GlobalCostEngine } from './app/lib/cost-engine/GlobalCostEngine';
async function test() {
  const engine = new GlobalCostEngine();
  const r = await engine.calculate({
    productName: 'Cotton T-Shirt', hsCode: '6109.10',
    originCountry: 'CN', destinationCountry: 'US',
    productValue: 50, shippingCost: 10, insuranceCost: 1
  });
  console.log('=== CN→US T-Shirt \$50 ===');
  console.log('Product:', r?.productValue || r?.product_value);
  console.log('Duty:', r?.dutyAmount || r?.duty_amount || r?.totalDuty);
  console.log('VAT/Tax:', r?.vatAmount || r?.vat_amount || r?.totalVat);
  console.log('Fees:', r?.customsFees || r?.customs_fees);
  console.log('TLC:', r?.totalLandedCost || r?.total_landed_cost);
  console.log('Currency:', r?.currency);
  if (r?.breakdown) console.log('Breakdown:', JSON.stringify(r.breakdown).substring(0, 200));
}
test().catch(e => console.log('Error:', e.message?.substring(0, 200)));
" 2>&1 | head -15 && \
echo "" && \

echo "=== E2E-02: CN→GB Electronics \$1000 (VAT 20%) ===" && \
npx tsx -e "
import { GlobalCostEngine } from './app/lib/cost-engine/GlobalCostEngine';
async function test() {
  const engine = new GlobalCostEngine();
  const r = await engine.calculate({
    productName: 'Laptop Computer', hsCode: '8471.30',
    originCountry: 'CN', destinationCountry: 'GB',
    productValue: 1000, shippingCost: 50, insuranceCost: 10
  });
  console.log('=== CN→GB Laptop \$1000 ===');
  console.log('Duty:', r?.dutyAmount || r?.duty_amount || r?.totalDuty);
  console.log('VAT:', r?.vatAmount || r?.vat_amount || r?.totalVat);
  console.log('TLC:', r?.totalLandedCost || r?.total_landed_cost);
  // VAT = 20% of (product + shipping + insurance + duty)
  const expectedVatBase = 1000 + 50 + 10 + (r?.dutyAmount || r?.duty_amount || r?.totalDuty || 0);
  console.log('Expected VAT base:', expectedVatBase, '× 20% =', expectedVatBase * 0.2);
}
test().catch(e => console.log('Error:', e.message?.substring(0, 200)));
" 2>&1 | head -15 && \
echo "" && \

echo "=== E2E-03: IT→US Gold Necklace \$10000 (고가, Ch.71) ===" && \
npx tsx -e "
import { GlobalCostEngine } from './app/lib/cost-engine/GlobalCostEngine';
async function test() {
  const engine = new GlobalCostEngine();
  const r = await engine.calculate({
    productName: 'Gold Necklace', hsCode: '7113.19',
    originCountry: 'IT', destinationCountry: 'US',
    productValue: 10000, shippingCost: 30, insuranceCost: 100
  });
  console.log('=== IT→US Gold \$10000 ===');
  console.log('Duty:', r?.dutyAmount || r?.duty_amount || r?.totalDuty);
  console.log('TLC:', r?.totalLandedCost || r?.total_landed_cost);
  // US de minimis $800 — 이 상품은 넘으므로 duty 적용되어야 함
  console.log('De minimis check: \$10000 > \$800 → duty should apply');
}
test().catch(e => console.log('Error:', e.message?.substring(0, 200)));
" 2>&1 | head -12 && \
echo "" && \

echo "=== E2E-04: CN→BR Electronics (Brazil 복합세금) ===" && \
npx tsx -e "
import { GlobalCostEngine } from './app/lib/cost-engine/GlobalCostEngine';
async function test() {
  const engine = new GlobalCostEngine();
  const r = await engine.calculate({
    productName: 'Smartphone', hsCode: '8517.13',
    originCountry: 'CN', destinationCountry: 'BR',
    productValue: 500, shippingCost: 30
  });
  console.log('=== CN→BR Smartphone \$500 ===');
  console.log('Duty:', r?.dutyAmount || r?.duty_amount || r?.totalDuty);
  console.log('VAT/Tax:', r?.vatAmount || r?.vat_amount || r?.totalVat || r?.totalTax);
  console.log('TLC:', r?.totalLandedCost || r?.total_landed_cost);
  // Brazil: II + IPI + PIS + COFINS + ICMS (cascading)
  if (r?.breakdown) console.log('Breakdown:', JSON.stringify(r.breakdown).substring(0, 300));
}
test().catch(e => console.log('Error:', e.message?.substring(0, 200)));
" 2>&1 | head -15 && \
echo "" && \

echo "=== E2E-05: CN→IN Gold Bar (India IGST 3%) ===" && \
npx tsx -e "
import { GlobalCostEngine } from './app/lib/cost-engine/GlobalCostEngine';
async function test() {
  const engine = new GlobalCostEngine();
  const r = await engine.calculate({
    productName: 'Gold Bar', hsCode: '7108.12',
    originCountry: 'CH', destinationCountry: 'IN',
    productValue: 5000, shippingCost: 20
  });
  console.log('=== CH→IN Gold Bar \$5000 ===');
  console.log('Duty:', r?.dutyAmount || r?.duty_amount || r?.totalDuty);
  console.log('VAT/IGST:', r?.vatAmount || r?.vat_amount || r?.totalVat);
  console.log('TLC:', r?.totalLandedCost || r?.total_landed_cost);
  // India Ch.71 gold: IGST 3% (CW18 수정)
}
test().catch(e => console.log('Error:', e.message?.substring(0, 200)));
" 2>&1 | head -12 && \
echo "" && \

echo "=== E2E-06: MX→US Whiskey (Mexico IEPS 53%) ===" && \
npx tsx -e "
import { GlobalCostEngine } from './app/lib/cost-engine/GlobalCostEngine';
async function test() {
  const engine = new GlobalCostEngine();
  const r = await engine.calculate({
    productName: 'Tequila', hsCode: '2208.90',
    originCountry: 'MX', destinationCountry: 'US',
    productValue: 200, shippingCost: 15
  });
  console.log('=== MX→US Tequila \$200 ===');
  console.log('Duty:', r?.dutyAmount || r?.duty_amount || r?.totalDuty);
  console.log('TLC:', r?.totalLandedCost || r?.total_landed_cost);
  // USMCA: MX→US duty should be 0% or reduced
}
test().catch(e => console.log('Error:', e.message?.substring(0, 200)));
" 2>&1 | head -12 && \
echo "" && \

echo "=== E2E-07: KR→US FTA 적용 확인 ===" && \
npx tsx -e "
import { GlobalCostEngine } from './app/lib/cost-engine/GlobalCostEngine';
async function test() {
  const engine = new GlobalCostEngine();
  const r = await engine.calculate({
    productName: 'Car Tire', hsCode: '4011.10',
    originCountry: 'KR', destinationCountry: 'US',
    productValue: 150, shippingCost: 20
  });
  console.log('=== KR→US Tire \$150 (KORUS FTA) ===');
  console.log('Duty:', r?.dutyAmount || r?.duty_amount || r?.totalDuty);
  console.log('FTA:', r?.ftaApplied || r?.fta || r?.tradeAgreement || 'check breakdown');
  console.log('TLC:', r?.totalLandedCost || r?.total_landed_cost);
  if (r?.tariffOptimization) console.log('Optimization:', JSON.stringify(r.tariffOptimization).substring(0, 200));
}
test().catch(e => console.log('Error:', e.message?.substring(0, 200)));
" 2>&1 | head -12 && \
echo "" && \

echo "=== E2E-08: De Minimis 적용 (US \$800 이하) ===" && \
npx tsx -e "
import { GlobalCostEngine } from './app/lib/cost-engine/GlobalCostEngine';
async function test() {
  const engine = new GlobalCostEngine();
  // CN→US: de minimis \$0 (CW18 수정: CN은 \$0)
  const r1 = await engine.calculate({
    productName: 'Phone Case', hsCode: '3926.90',
    originCountry: 'CN', destinationCountry: 'US',
    productValue: 15, shippingCost: 5
  });
  // JP→US: de minimis \$800
  const r2 = await engine.calculate({
    productName: 'Phone Case', hsCode: '3926.90',
    originCountry: 'JP', destinationCountry: 'US',
    productValue: 15, shippingCost: 5
  });
  console.log('=== CN→US \$15 (de minimis \$0 for CN) ===');
  console.log('Duty:', r1?.dutyAmount || r1?.duty_amount || r1?.totalDuty, '→ should have duty');
  console.log('=== JP→US \$15 (de minimis \$800) ===');
  console.log('Duty:', r2?.dutyAmount || r2?.duty_amount || r2?.totalDuty, '→ should be 0 (under \$800)');
}
test().catch(e => console.log('Error:', e.message?.substring(0, 200)));
" 2>&1 | head -12 && \
echo "" && \

echo "=== E2E-09: 240개국 커버리지 스팟체크 (5개국) ===" && \
npx tsx -e "
import { GlobalCostEngine } from './app/lib/cost-engine/GlobalCostEngine';
async function test() {
  const engine = new GlobalCostEngine();
  const countries = ['DE', 'JP', 'AU', 'KR', 'AE'];
  for (const dest of countries) {
    const r = await engine.calculate({
      productName: 'Cotton T-Shirt', hsCode: '6109.10',
      originCountry: 'CN', destinationCountry: dest,
      productValue: 100, shippingCost: 15
    });
    const tlc = r?.totalLandedCost || r?.total_landed_cost || 'N/A';
    const duty = r?.dutyAmount || r?.duty_amount || r?.totalDuty || 0;
    console.log('CN→' + dest + ': TLC=' + tlc + ', duty=' + duty);
  }
}
test().catch(e => console.log('Error:', e.message?.substring(0, 200)));
" 2>&1 | head -10 && \
echo "" && \

echo "=== E2E-10: 음수/0값/극단값 방어 ===" && \
npx tsx -e "
import { GlobalCostEngine } from './app/lib/cost-engine/GlobalCostEngine';
async function test() {
  const engine = new GlobalCostEngine();
  // 0원 상품
  try {
    const r = await engine.calculate({
      productName: 'Free Sample', hsCode: '6109.10',
      originCountry: 'CN', destinationCountry: 'US',
      productValue: 0, shippingCost: 0
    });
    console.log('\$0 product: TLC=' + (r?.totalLandedCost || r?.total_landed_cost || 'N/A'));
  } catch(e) { console.log('\$0 product: error (expected) ✅', e.message?.substring(0, 80)); }
  // 매우 고가
  try {
    const r = await engine.calculate({
      productName: 'Diamond', hsCode: '7102.39',
      originCountry: 'BE', destinationCountry: 'US',
      productValue: 1000000, shippingCost: 500
    });
    console.log('\$1M diamond: TLC=' + (r?.totalLandedCost || r?.total_landed_cost || 'N/A'));
  } catch(e) { console.log('\$1M diamond: error', e.message?.substring(0, 80)); }
}
test().catch(e => console.log('Error:', e.message?.substring(0, 200)));
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
echo "# Phase 5: 최종 결과" && \
echo "##############################" && \

cat > AREA11_TLC_INTEGRATION_RESULT.md << 'RESULTEOF'
# Area 11: 통합 TLC End-to-End — Deep Review Result
# 2026-03-23 KST

## Phase 1: 읽은 파일
- GlobalCostEngine.ts — 통합 엔진
- CostEngine.ts — 코어 엔진
- /api/v1/calculate routes — API 엔드포인트

## Phase 2: 12 TLC 영역 통합 분석
1-10: 호출 순서, 합산 공식, 응답 스키마, 에러핸들링, 캐싱, 반올림

## Phase 3: E2E 테스트 결과
- E2E-01~10 결과

## Phase 4: 빌드 + Regression

## 버그 발견

## 수정 사항
RESULTEOF

echo "결과 파일: AREA11_TLC_INTEGRATION_RESULT.md 생성 완료" && \
echo "" && \

python3 << 'PYEOF'
import os, datetime
try:
    from openpyxl import load_workbook
    wb = load_workbook('POTAL_Claude_Code_Work_Log.xlsx')
    sheet_name = datetime.datetime.now().strftime('%y%m%d%H%M')
    ws = wb.create_sheet(title=sheet_name)
    ws.append(['순번', '시간', '구분', '상세내용', '파일경로', '상태'])
    ws.append([1, datetime.datetime.now().strftime('%H:%M:%S'), 'COMMAND', 'Area 11 TLC Integration E2E Deep Review', 'CLAUDE_CODE_AREA11_TLC_INTEGRATION_DEEP_REVIEW.md', '✅성공'])
    ws.append([2, datetime.datetime.now().strftime('%H:%M:%S'), 'ANALYSIS', '12개 TLC 영역 통합: GlobalCostEngine + CostEngine + E2E 10건', '', '⏳진행중'])
    wb.save('POTAL_Claude_Code_Work_Log.xlsx')
    print(f'✅ Work log updated: {sheet_name}')
except Exception as e:
    print(f'Work log error: {e}')
PYEOF

echo "" && \
echo "Area 11 Complete. 대기 중."
```
