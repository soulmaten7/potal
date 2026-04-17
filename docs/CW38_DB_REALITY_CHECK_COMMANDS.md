# CW38 Phase 3 — DB 실제 상태 진단
# 실행: 터미널1 (Opus) 또는 터미널3 (Opus)
# 예상 소요: 15~20분
# 마지막 업데이트: 2026-04-17

---

## 목적

CW38 Phase 1(DB 전환) + Phase 2(자동 갱신 파이프라인)를 했지만,
**실제로 DB에 데이터가 있는지, 엔진이 DB를 제대로 읽고 있는지** 확인한 적이 없다.

코드 분석 결과 엔진은 대부분 DB를 먼저 읽고 하드코딩을 fallback으로 쓴다.
→ DB가 비어있으면 매번 fallback으로 빠지고 있다는 뜻.
→ 자동 갱신 파이프라인이 업데이트해도 의미 없다는 뜻.

이 명령어 파일은 **사실 확인(fact-check)**이 목적이다.

---

## 사전 설정

```bash
# .env.local에서 Supabase 환경변수 로드
cd ~/potal
source .env.local 2>/dev/null || true
export SB_URL=$NEXT_PUBLIC_SUPABASE_URL
export SB_KEY=$SUPABASE_SERVICE_ROLE_KEY

# 연결 테스트
node -e "
fetch(process.env.SB_URL + '/rest/v1/', {
  headers: { apikey: process.env.SB_KEY }
}).then(r => console.log('Supabase 연결:', r.status === 200 ? '✅ OK' : '❌ FAIL (' + r.status + ')'))
.catch(e => console.error('❌ 연결 실패:', e.message));
"
```

---

## Step 1: 엔진이 DB-first로 읽는 핵심 테이블 — row count + 최신 데이터 날짜

엔진이 실제로 DB를 먼저 읽는 테이블들이다. 비어있으면 매번 하드코딩 fallback으로 빠진다.

```bash
node -e "
const url = process.env.SB_URL;
const key = process.env.SB_KEY;
const headers = { apikey: key, Authorization: 'Bearer ' + key };

const tables = [
  // 엔진이 DB-first로 읽는 핵심 테이블
  { name: 'country_profiles', desc: '국가 프로필 (VAT, de minimis)', dateCol: 'updated_at' },
  { name: 'duty_rates_live', desc: '실시간 관세율', dateCol: 'updated_at' },
  { name: 'additional_tariffs', desc: '추가관세 (301/232)', dateCol: 'updated_at' },
  { name: 'fta_agreements', desc: 'FTA 협정 목록', dateCol: 'updated_at' },
  { name: 'fta_members', desc: 'FTA 가입국', dateCol: null },
  { name: 'fta_rates_live', desc: 'FTA 우대세율', dateCol: 'updated_at' },
  { name: 'sanctioned_entities', desc: '제재 대상 목록', dateCol: 'updated_at' },
  { name: 'sanctions_entries', desc: '제재 DB 전체', dateCol: 'updated_at' },
  
  // cron이 업데이트하는 테이블
  { name: 'exchange_rates', desc: '환율 (cron 자동)', dateCol: 'updated_at' },
  { name: 'country_regulatory_notes', desc: '규제 공지 (TARIC 등)', dateCol: 'created_at' },
  { name: 'source_publications', desc: '데이터 출처 메타', dateCol: 'updated_at' },
  
  // HS 분류 관련
  { name: 'precomputed_hs10_candidates', desc: 'HS10 후보 캐시', dateCol: null },
  { name: 'hs_classification_cache', desc: 'HS 분류 캐시', dateCol: 'created_at' },
  { name: 'gov_tariff_schedules', desc: '정부 관세 스케줄', dateCol: 'updated_at' },
  
  // MacMap
  { name: 'macmap_ntlc_rates', desc: 'MacMap 관세율', dateCol: null },
  
  // 무역구제
  { name: 'trade_remedy_cases', desc: '무역구제 케이스', dateCol: 'updated_at' },
  { name: 'restricted_items', desc: '수입 제한 품목', dateCol: 'updated_at' },
  
  // de minimis
  { name: 'de_minimis_thresholds', desc: 'De minimis 기준', dateCol: 'updated_at' },
  
  // VAT
  { name: 'vat_gst_rates', desc: 'VAT/GST 세율', dateCol: 'updated_at' },
  
  // US 세금
  { name: 'us_state_tax_rates', desc: '미국 주별 세율', dateCol: 'updated_at' },
];

async function checkTable(t) {
  try {
    // row count
    const countRes = await fetch(url + '/rest/v1/' + t.name + '?select=count', {
      headers: { ...headers, Prefer: 'count=exact' }
    });
    const range = countRes.headers.get('content-range');
    const count = range ? range.split('/')[1] : 'ERROR(' + countRes.status + ')';
    
    // 최신 날짜 (dateCol이 있는 경우)
    let latest = '-';
    if (t.dateCol && count !== '0' && !count.startsWith('ERROR')) {
      try {
        const dateRes = await fetch(
          url + '/rest/v1/' + t.name + '?select=' + t.dateCol + '&order=' + t.dateCol + '.desc&limit=1', 
          { headers }
        );
        if (dateRes.ok) {
          const data = await dateRes.json();
          latest = data[0] ? data[0][t.dateCol]?.substring(0, 10) : 'null';
        }
      } catch(e) { latest = 'query_error'; }
    }
    
    return { name: t.name, desc: t.desc, count, latest };
  } catch(e) {
    return { name: t.name, desc: t.desc, count: 'FETCH_ERROR', latest: '-' };
  }
}

Promise.all(tables.map(checkTable)).then(results => {
  console.log('');
  console.log('=== POTAL DB 실제 상태 ===');
  console.log('조회 시각:', new Date().toISOString());
  console.log('');
  console.log('테이블명'.padEnd(32) + 'rows'.padStart(10) + '  최신날짜'.padEnd(14) + '  설명');
  console.log('-'.repeat(85));
  
  let emptyCount = 0;
  let totalRows = 0;
  
  results.forEach(r => {
    const rowNum = parseInt(r.count) || 0;
    const flag = r.count === '0' ? ' ⚠️ EMPTY' : rowNum > 0 ? '' : ' ❓';
    totalRows += rowNum;
    if (r.count === '0') emptyCount++;
    
    console.log(
      r.name.padEnd(32) + 
      String(r.count).padStart(10) + 
      ('  ' + r.latest).padEnd(14) + 
      '  ' + r.desc + flag
    );
  });
  
  console.log('-'.repeat(85));
  console.log('총 테이블: ' + results.length + '개 | 비어있는 테이블: ' + emptyCount + '개 | 총 rows: ' + totalRows.toLocaleString());
  console.log('');
  
  // 판정
  const critical = ['country_profiles', 'duty_rates_live', 'fta_agreements', 'sanctioned_entities'];
  const criticalEmpty = results.filter(r => critical.includes(r.name) && r.count === '0');
  if (criticalEmpty.length > 0) {
    console.log('🚨 치명적: 엔진이 DB-first로 읽는 핵심 테이블이 비어있음!');
    criticalEmpty.forEach(r => console.log('   → ' + r.name + ': 0 rows (매번 하드코딩 fallback 사용 중)'));
  } else {
    console.log('✅ 핵심 테이블에 데이터 존재 — 엔진이 DB를 실제로 사용 중');
  }
});
"
```

---

## Step 2: Cron 실행 이력 확인 — health_check_logs

각 cron이 실제로 돌았는지, 마지막으로 언제 돌았는지 확인.

```bash
node -e "
const url = process.env.SB_URL;
const key = process.env.SB_KEY;
const headers = { apikey: key, Authorization: 'Bearer ' + key };

// health_check_logs 테이블 존재 여부 + 최근 20개 로그
fetch(url + '/rest/v1/health_check_logs?select=*&order=created_at.desc&limit=30', { headers })
.then(async r => {
  if (!r.ok) {
    console.log('❌ health_check_logs 테이블 조회 실패: ' + r.status);
    const text = await r.text();
    console.log(text.substring(0, 200));
    return;
  }
  const logs = await r.json();
  console.log('');
  console.log('=== Cron 실행 이력 (최근 30건) ===');
  console.log('');
  
  if (logs.length === 0) {
    console.log('⚠️ health_check_logs가 비어있음 — cron이 한 번도 안 돌았거나 로깅이 안 됨');
    return;
  }
  
  console.log('시각'.padEnd(22) + '소스'.padEnd(30) + '상태'.padEnd(10) + '메시지');
  console.log('-'.repeat(90));
  logs.forEach(log => {
    const time = log.created_at?.substring(0, 19) || '?';
    const source = (log.source || log.cron_name || log.check_type || '?').substring(0, 28);
    const status = log.status || log.level || '?';
    const msg = (log.message || log.details || '').substring(0, 40);
    console.log(time.padEnd(22) + source.padEnd(30) + status.padEnd(10) + msg);
  });
}).catch(e => console.error('❌ 에러:', e.message));
"
```

---

## Step 3: Phase 2 신규 cron 존재 확인

Phase 2에서 만든 3개 cron 파일이 실제로 존재하고, vercel.json에 등록됐는지.

```bash
echo "=== Phase 2 Cron 파일 존재 확인 ==="
echo ""

# 파일 존재
for f in \
  "app/api/v1/cron/vat-rate-monitor/route.ts" \
  "app/api/v1/cron/de-minimis-monitor/route.ts" \
  "app/api/v1/cron/us-tax-monitor/route.ts" \
  "app/lib/data-management/country-profile-sync.ts"; do
  if [ -f "$f" ]; then
    echo "✅ $f ($(wc -l < "$f") lines)"
  else
    echo "❌ $f — 파일 없음!"
  fi
done

echo ""
echo "=== vercel.json cron 등록 확인 ==="
echo ""
grep -A1 "vat-rate-monitor\|de-minimis-monitor\|us-tax-monitor" vercel.json || echo "❌ vercel.json에 등록 안 됨"

echo ""
echo "=== 전체 cron 수 ==="
grep -c '"schedule"' vercel.json && echo "개 등록됨"
```

---

## Step 4: 각 cron 수동 호출 테스트

**Phase 2 cron이 실제로 동작하는지** 로컬에서 한 번씩 호출.
(Vercel에 배포된 상태면 실제 URL로, 로컬이면 localhost로)

```bash
echo "=== Phase 2 Cron 수동 호출 테스트 ==="
echo ""
echo "⚠️ 아래는 배포된 Vercel URL로 호출하는 방법."
echo "   CRON_SECRET이 필요함. .env.local에서 확인:"
echo ""
grep "CRON_SECRET" .env.local 2>/dev/null | head -1

echo ""
echo "--- 호출 명령어 (CRON_SECRET을 실제 값으로 교체) ---"
echo ""

# 실제 도메인 확인
DOMAIN=$(grep "NEXT_PUBLIC_APP_URL\|VERCEL_URL" .env.local 2>/dev/null | head -1 | cut -d'=' -f2)
echo "도메인: ${DOMAIN:-'확인 필요'}"
echo ""

echo "# 1. VAT Rate Monitor"
echo "curl -s -H 'Authorization: Bearer \$CRON_SECRET' '${DOMAIN}/api/v1/cron/vat-rate-monitor' | jq ."
echo ""
echo "# 2. De Minimis Monitor"
echo "curl -s -H 'Authorization: Bearer \$CRON_SECRET' '${DOMAIN}/api/v1/cron/de-minimis-monitor' | jq ."
echo ""
echo "# 3. US Tax Monitor"
echo "curl -s -H 'Authorization: Bearer \$CRON_SECRET' '${DOMAIN}/api/v1/cron/us-tax-monitor' | jq ."
```

---

## Step 5: 엔진 실제 동작 테스트 — DB vs Fallback 확인

실제 API를 호출해서, 엔진이 DB 데이터를 쓰는지 하드코딩 fallback을 쓰는지 확인.

```bash
echo "=== 엔진 실제 동작 테스트 ==="
echo ""

# landed cost API 호출 — 응답에서 data source 확인
# (응답에 source 필드가 있으면 DB/API/fallback 구분 가능)

DOMAIN=$(grep "NEXT_PUBLIC_APP_URL\|VERCEL_URL" .env.local 2>/dev/null | head -1 | cut -d'=' -f2)

echo "# US 수입 테스트 (T-shirt, HS 6109.10)"
echo "curl -s '${DOMAIN}/api/v1/calculate' \\"
echo "  -H 'Content-Type: application/json' \\"
echo "  -d '{\"productName\":\"cotton t-shirt\",\"hsCode\":\"6109.10\",\"originCountry\":\"CN\",\"destinationCountry\":\"US\",\"productValue\":10,\"currency\":\"USD\"}' | jq '.dutyRate, .dataSource, .vatRate'"
echo ""

echo "# KR 수입 테스트"
echo "curl -s '${DOMAIN}/api/v1/calculate' \\"
echo "  -H 'Content-Type: application/json' \\"
echo "  -d '{\"productName\":\"cotton t-shirt\",\"hsCode\":\"6109.10\",\"originCountry\":\"CN\",\"destinationCountry\":\"KR\",\"productValue\":10,\"currency\":\"USD\"}' | jq '.dutyRate, .dataSource, .vatRate'"
echo ""

echo "⚠️ 응답의 dataSource 필드를 확인:"
echo "   - 'db' 또는 'duty_rates_live' → DB에서 읽음 ✅"
echo "   - 'hardcoded' 또는 'fallback' → DB 비어서 하드코딩 사용 중 ⚠️"
echo "   - 필드 자체가 없으면 → 소스 추적 안 됨 (코드 수정 필요)"
```

---

## Step 6: 결과 종합 판정

Step 1~5 결과를 바탕으로 아래 질문에 답:

```
1. 엔진이 DB-first로 읽는 핵심 4개 테이블에 실제 데이터가 있는가?
   □ country_profiles: ___rows (기대: 240)
   □ duty_rates_live: ___rows (기대: >0, cron이 채움)
   □ fta_agreements: ___rows (기대: >0)
   □ sanctioned_entities: ___rows (기대: >0, SDN sync)

2. Phase 2 cron 3개가 실제로 돌아서 결과를 냈는가?
   □ vat-rate-monitor: 마지막 실행 ___
   □ de-minimis-monitor: 마지막 실행 ___
   □ us-tax-monitor: 마지막 실행 ___

3. 기존 cron 5개는 정상 작동 중인가?
   □ exchange-rate-sync: 마지막 실행 ___
   □ sdn-sync: 마지막 실행 ___
   □ federal-register-monitor: 마지막 실행 ___
   □ update-tariffs: 마지막 실행 ___
   □ taric-rss-monitor: 마지막 실행 ___

4. calculate API 호출 시 응답에서 data source가 뭐로 나오는가?
   □ DB에서 읽음 / □ 하드코딩 fallback / □ 소스 추적 안 됨

위 결과를 간결하게 정리해서 알려줘.
```

---

## 수정/생성 파일 요약

이 명령어 파일은 **조회만** 한다. 코드 수정 없음.
결과에 따라 후속 작업이 결정됨:

- DB가 비어있으면 → seed/migration 우선
- cron이 안 돌았으면 → cron 디버깅 우선  
- 엔진이 fallback만 쓰면 → DB 연결 코드 확인 우선
- 다 정상이면 → CW38 진짜 완료

---

## 실행 방법

Claude Code 터미널에서:
```
docs/CW38_DB_REALITY_CHECK_COMMANDS.md 파일을 읽고 Step 1부터 Step 6까지 순서대로 실행해줘.
각 Step의 결과를 그대로 보여주고, Step 6의 질문에 답해줘.
```
