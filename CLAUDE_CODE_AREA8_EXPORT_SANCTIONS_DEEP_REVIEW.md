# Area 8: Export Controls + Sanctions Screening + Restricted Items — Deep Review
# ECCN 분류 + Denied Party Screening + 제재 리스트 21,301건 + 제한물품

## 목표
수출 통제(Export Controls), 제재 스크리닝(Sanctions Screening), 제한물품(Restricted Items) 코드 전체 심층 리뷰 + 5회 자체 검수.
CW18 5차에서 export-controls.ts `Math.random()` → deterministic license exception 수정됨 — 재확인 포함.

## ⚠️ 절대 규칙
1. **Area 8만 한다. 끝나면 멈춰라. Area 9로 넘어가지 마라.**
2. **5회 자체 검수 전부 디테일하게 실행** — "PASS" 한 줄로 끝내지 마라. 각 검수마다 개별 테스트 결과 전부 표시
3. **rapidly 금지** — 하나씩 천천히 정확하게
4. **발견한 버그는 즉시 수정** — 수정 전/후 코드 명시
5. **엑셀 로깅 필수** — POTAL_Claude_Code_Work_Log.xlsx에 시트 추가

---

## Phase 1: 코드 읽기 (전체 파악)

아래 파일들을 **전부** 읽는다:

```bash
# 1. export-controls.ts — ECCN 분류 + 수출 통제 엔진
#    핵심: ECCN matrix, license exception, dual-use 판별
#    CW18 수정: Math.random() → deterministic license exception
cat app/lib/compliance/export-controls.ts

# 2. fuzzy-screening.ts — 제재 스크리닝 (퍼지 매칭)
#    핵심: Levenshtein/trigram 기반 엔티티 매칭, 21,301 sanctions entries
#    CW18 수정 포함
cat app/lib/compliance/fuzzy-screening.ts

# 3. product-restrictions.ts — 제한물품 체크
#    핵심: 국가별 수입 금지/제한 품목 판별
cat app/lib/compliance/product-restrictions.ts

# 4. screening/db-screen.ts — DB 기반 제재 스크리닝
#    핵심: sanctions_entries + aliases + addresses + ids 테이블 조회
cat app/lib/cost-engine/screening/db-screen.ts

# 5. screening/screen.ts — 스크리닝 오케스트레이터
cat app/lib/cost-engine/screening/screen.ts

# 6. screening/index.ts — 스크리닝 exports
cat app/lib/cost-engine/screening/index.ts

# 7. screening/types.ts — 스크리닝 타입 정의
cat app/lib/cost-engine/screening/types.ts

# 8. API Routes — Export Controls
cat app/api/v1/compliance/export-controls/route.ts
cat app/api/v1/compliance/export-license/route.ts
cat app/api/v1/export-controls/classify/route.ts

# 9. API Routes — Sanctions Screening
cat app/api/v1/sanctions/screen/route.ts
cat app/api/v1/screening/route.ts

# 10. API Routes — Restrictions + Verify
cat app/api/v1/restrictions/route.ts
cat app/api/v1/verify/route.ts
cat app/api/v1/verify/pre-shipment/route.ts

# 11. GlobalCostEngine.ts — 스크리닝이 TLC 계산에서 어디서 호출되는지
#     특히: sanctions check, export control check 위치
cat app/lib/cost-engine/GlobalCostEngine.ts | head -100
# (이미 여러번 읽었으므로 screening 관련 부분만)
grep -n "screen\|sanction\|export.control\|restrict\|denied\|blocked" app/lib/cost-engine/GlobalCostEngine.ts

# 12. DB 테이블 현황 — sanctions 4개 테이블
curl -s -X POST https://api.supabase.com/v1/projects/zyurflkhiregundhisky/database/query \
  -H "Authorization: Bearer sbp_eb6ee564c92421474308e71af8e44fc6b0e83e35" \
  -H "Content-Type: application/json" \
  -d '{"query": "SELECT schemaname, tablename, n_live_tup FROM pg_stat_user_tables WHERE tablename LIKE '"'"'%sanction%'"'"' ORDER BY tablename;"}'

# 13. DB 스키마 — sanctions_entries 컬럼
curl -s -X POST https://api.supabase.com/v1/projects/zyurflkhiregundhisky/database/query \
  -H "Authorization: Bearer sbp_eb6ee564c92421474308e71af8e44fc6b0e83e35" \
  -H "Content-Type: application/json" \
  -d '{"query": "SELECT column_name, data_type FROM information_schema.columns WHERE table_name = '"'"'sanctions_entries'"'"' ORDER BY ordinal_position;"}'

# 14. DB 샘플 — sanctions_entries 5건 + aliases 5건
curl -s -X POST https://api.supabase.com/v1/projects/zyurflkhiregundhisky/database/query \
  -H "Authorization: Bearer sbp_eb6ee564c92421474308e71af8e44fc6b0e83e35" \
  -H "Content-Type: application/json" \
  -d '{"query": "SELECT id, source, entity_type, name, country FROM sanctions_entries LIMIT 5;"}'

curl -s -X POST https://api.supabase.com/v1/projects/zyurflkhiregundhisky/database/query \
  -H "Authorization: Bearer sbp_eb6ee564c92421474308e71af8e44fc6b0e83e35" \
  -H "Content-Type: application/json" \
  -d '{"query": "SELECT entry_id, alias_name, alias_type FROM sanctions_aliases LIMIT 5;"}'

# 15. DB 통계 — source별 분포, entity_type 분포
curl -s -X POST https://api.supabase.com/v1/projects/zyurflkhiregundhisky/database/query \
  -H "Authorization: Bearer sbp_eb6ee564c92421474308e71af8e44fc6b0e83e35" \
  -H "Content-Type: application/json" \
  -d '{"query": "SELECT source, count(*) FROM sanctions_entries GROUP BY source ORDER BY count(*) DESC;"}'

curl -s -X POST https://api.supabase.com/v1/projects/zyurflkhiregundhisky/database/query \
  -H "Authorization: Bearer sbp_eb6ee564c92421474308e71af8e44fc6b0e83e35" \
  -H "Content-Type: application/json" \
  -d '{"query": "SELECT entity_type, count(*) FROM sanctions_entries GROUP BY entity_type ORDER BY count(*) DESC;"}'
```

---

## Phase 2: 10개 분석 영역 (하나씩 순서대로)

### 분석 1: export-controls.ts — ECCN 분류 로직
**검증 항목:**
- ECCN (Export Control Classification Number) 매트릭스 구현 방식
- CW18 수정: `Math.random()` → deterministic license exception — 실제 코드 확인
- dual-use 품목 판별 기준: HS code 기반? 상품명 기반? 키워드 기반?
- BIS Entity List 확인 로직 있는지
- EAR (Export Administration Regulations) 준수 여부
- license exception 종류: LVS, TMP, TSR, APR, GOV 등 — 코드에서 어떻게 결정하는지
- Commerce Control List (CCL) 카테고리: 0~9 (Nuclear/Materials/Electronics/Computers/Telecom/Sensors/Navigation/Marine/Propulsion/Misc)

### 분석 2: fuzzy-screening.ts — 퍼지 매칭 알고리즘
**검증 항목:**
- 매칭 알고리즘: Levenshtein distance? Trigram(pg_trgm)? Soundex? Jaro-Winkler?
- similarity threshold: 몇 %부터 매칭으로 판정하는지 (너무 낮으면 false positive, 높으면 miss)
- CW18 수정 사항 확인
- 이름 정규화: 대소문자, 접미사(Ltd/Inc/GmbH), 특수문자, 아랍어/중국어 이름 처리
- partial match: "Huawei" vs "Huawei Technologies Co., Ltd." 매칭
- alias 조회: sanctions_aliases 22,328건 활용 여부
- false positive 처리: match_score와 함께 반환 → 사용자가 판단?

### 분석 3: db-screen.ts — DB 기반 제재 스크리닝
**검증 항목:**
- 4개 테이블 JOIN 방식: entries + aliases + addresses + ids
- 조회 순서: name exact → name fuzzy → alias exact → alias fuzzy?
- country 필터: 특정 국가 전체 제재 (OFAC SDN: Iran, NK, Cuba, Syria, Crimea 등)
- sanctions_entries.source 필드: OFAC SDN, BIS Entity List, CSL 등 19개 소스
- 쿼리 성능: 21,301 entries + 22,328 aliases = ~43K행 → 응답 시간?
- pg_trgm 인덱스 사용 여부

### 분석 4: product-restrictions.ts — 제한물품 판별
**검증 항목:**
- 국가별 수입 금지 품목 목록: 어떤 기준? HS code? 키워드?
- 종류: prohibited(완전 금지), restricted(허가 필요), controlled(통제)
- 주요 제한 품목: 무기, 마약, 핵물질, 문화재, 야생동물(CITES), 식품(검역) 등
- UN Dangerous Goods 처리 여부
- 국가별 특수 제한: 사우디(주류/돼지), 인도(소가죽), 일본(약사법) 등

### 분석 5: screening/screen.ts — 스크리닝 오케스트레이터
**검증 항목:**
- 전체 스크리닝 흐름: entity screening + product restriction + export control → 통합 결과
- 각 스크리닝 결과 합산 방식: 하나라도 hit이면 blocked? 또는 risk score?
- 응답 형식: screened/cleared/flagged 상태 + 상세 매칭 정보
- 에러 핸들링: DB 연결 실패, 타임아웃 시 fail-open vs fail-closed
- 캐싱: 동일 entity 반복 조회 시 캐시 활용?

### 분석 6: API 엔드포인트 — Export Controls (3개)
**검증 항목:**
- `/compliance/export-controls` — ECCN 분류 요청
- `/compliance/export-license` — 라이선스 필요 여부 판단
- `/export-controls/classify` — ECCN 분류 (위와 중복?)
- 필수 파라미터: HS code? 상품명? destination country?
- 응답 형식: eccn, license_required, license_exception, control_reason
- 인증: API key 필요 여부

### 분석 7: API 엔드포인트 — Sanctions + Screening (2개)
**검증 항목:**
- `/sanctions/screen` — 단일 entity 스크리닝
- `/screening` — 통합 스크리닝 (entity + product + export)
- 입력: entity name, country, entity type(individual/organization)
- 출력: matches[], risk_level, recommended_action
- partial match 결과 포함 여부
- batch screening 지원 여부

### 분석 8: API 엔드포인트 — Restrictions + Verify (3개)
**검증 항목:**
- `/restrictions` — HS code + destination → 제한 여부
- `/verify` — 전체 거래 검증 (entity + product + destination)
- `/verify/pre-shipment` — 출하 전 검증
- 이 3개가 screening과 어떻게 다른지 (중복 기능?)
- 실질적으로 사용되는 메인 엔드포인트는 어느 것인지

### 분석 9: GlobalCostEngine에서 스크리닝 통합
**검증 항목:**
- TLC 계산 과정에서 screening이 호출되는 시점
- screening 결과가 TLC 응답에 포함되는지 (blocked일 때 계산 중단?)
- sanctions hit → 거래 거부? 또는 warning만?
- export control → license required → 추가 비용/시간 안내?
- screening이 TLC 응답 시간에 미치는 영향 (추가 DB 쿼리)

### 분석 10: DB 데이터 정합성 + 소스 커버리지
**검증 항목:**
- 21,301 entries: 19개 소스별 분포 확인
- OFAC SDN이 주요 소스인지 (미국 법적 의무)
- BIS Entity List 포함 여부
- EU Sanctions List 포함 여부
- UN Security Council 제재 목록 포함 여부
- aliases 22,328건: entries와 1:N 관계 확인
- addresses 24,176건: 국가/도시 분포
- ids 8,000건: passport/national ID 등 유형 분포
- 업데이트 주기: Cron으로 자동 업데이트? 수동?

---

## Phase 3: 테스트 케이스 30건

### TC-01~05: Export Controls (ECCN) 5건
```
TC-01: HS 8471.30 (laptop), dest=IR (Iran) → export controlled, license required
TC-02: HS 6109.10 (t-shirt), dest=IR → not controlled (의류는 EAR 대상 아님)
TC-03: HS 8543.70 (electronic device), dest=CN → dual-use 체크, ECCN 분류
TC-04: HS 8471.30 (laptop), dest=CA → not controlled (동맹국)
TC-05: HS 9306.21 (ammunition), dest=any → always controlled
```

### TC-06~10: Sanctions Screening (Entity) 5건
```
TC-06: "Bank of Iran" → sanctions hit (OFAC SDN)
TC-07: "Samsung Electronics" → no hit (정상 기업)
TC-08: "HUAWEI" → hit 여부 확인 (BIS Entity List)
TC-09: 부분 매칭: "Huawei Tech" vs DB의 "Huawei Technologies Co., Ltd." → fuzzy match score
TC-10: alias 매칭: DB에 alias가 있는 entity → alias로 조회 시 hit
```

### TC-11~14: Sanctions Screening (Country) 4건
```
TC-11: dest=IR (Iran) → country-level sanctions 확인
TC-12: dest=KP (North Korea) → country-level sanctions 확인
TC-13: dest=CU (Cuba) → country-level sanctions 확인
TC-14: dest=DE (Germany) → no country sanctions
```

### TC-15~18: Product Restrictions 4건
```
TC-15: HS 9302 (firearms), dest=JP → restricted
TC-16: HS 2208 (alcohol), dest=SA (Saudi Arabia) → prohibited
TC-17: HS 0202 (beef), dest=IN (India) → restricted (종교적)
TC-18: HS 6109 (t-shirt), dest=US → no restrictions
```

### TC-19~22: Screening API 4건
```
TC-19: /screening endpoint — entity="Samsung", country="KR" → cleared
TC-20: /screening endpoint — entity="Bank Melli Iran", country="IR" → flagged
TC-21: /sanctions/screen — name="random person" → no match
TC-22: /verify/pre-shipment — HS 8471.30 + dest=IR + entity="Test Corp" → comprehensive check
```

### TC-23~26: Edge Cases 4건
```
TC-23: 빈 이름 "" → 에러 핸들링 (500 아닌 400)
TC-24: 매우 긴 이름 (500자) → 에러 없이 처리
TC-25: 특수문자 이름 "O'Brien & Associates, LLC." → 정규화 후 매칭
TC-26: 한글 이름 "조선무역은행" → 매칭 여부 (Korean script in DB?)
```

### TC-27~30: DB 정합성 4건
```
TC-27: sanctions_aliases.entry_id가 sanctions_entries.id에 전부 존재하는지 (FK)
TC-28: sanctions_addresses.entry_id 동일 FK 확인
TC-29: sanctions_ids.entry_id 동일 FK 확인
TC-30: source별 건수 합 = 21,301 확인
```

---

## Phase 4: 수정 (발견된 버그가 있을 경우만)

발견된 각 이슈에 대해:
1. 이슈 설명 (뭐가 잘못됐는지)
2. 영향 범위 (어떤 국가, 어떤 기능)
3. 수정 전 코드
4. 수정 후 코드
5. 수정 근거 (법적 기준 출처)

---

## Phase 5: 자체 검수 5회

### 검수 1: Build
```bash
npm run build
```
- Compiled X.Xs, 0 errors → PASS

### 검수 2: Export Controls 정확성 (5건)
1. Iran destination + laptop → license required ✓
2. Canada destination + laptop → no license ✓
3. t-shirt any destination → not controlled ✓
4. ammunition → always controlled ✓
5. CW18 수정 확인: Math.random() 코드 없음, deterministic logic 확인 ✓

### 검수 3: Sanctions DB 매칭 정확성 (5건)
1. known SDN entity exact match → hit ✓
2. known entity alias match → hit ✓
3. clean entity → no hit ✓
4. fuzzy match (typo/variation) → score 반환 + threshold 판단 ✓
5. country-only check (IR/KP/CU) → blocked ✓

### 검수 4: DB 정합성 (4건)
1. sanctions_entries count = 21,301
2. sanctions_aliases FK 무결성
3. sanctions_addresses FK 무결성
4. sanctions_ids FK 무결성

### 검수 5: Regression 55/55
```bash
npx tsx scripts/duty_rate_verification.ts 2>&1 | tail -10
```
- 55/55 PASS, 0 FAIL

---

## Phase 6: 결과 파일 생성

`AREA8_EXPORT_SANCTIONS_RESULT.md` 생성:
```markdown
# Area 8: Export Controls + Sanctions Screening — Deep Review Result
# 2026-03-23 KST

## Phase 1: 읽은 파일
- [파일 목록 + 각 파일 핵심 내용 요약]

## Phase 2: 10개 영역 분석 결과
### 분석 1: ECCN 분류
- [결과]
### 분석 2: 퍼지 매칭
- [결과]
...

## Phase 3: 테스트 30건 결과
| TC | 설명 | 예상값 | 실제값 | 결과 |
|----|------|--------|--------|------|
| TC-01 | laptop→IR | controlled | ? | ? |
...

## CW18 수정 재확인
| 항목 | 예상 | 실제 | 확인 |
|------|------|------|------|
| Math.random() 제거 | deterministic | ? | ? |

## 버그 발견
- [N건: 상세]

## 수정
- [수정 파일, 수정 전/후]

## 검수 결과
| 검수 | 항목 | 결과 |
|------|------|------|
| 1 | Build | ? errors |
| 2 | Export Controls | ?/5 |
| 3 | Sanctions 매칭 | ?/5 |
| 4 | DB 정합성 | ?/4 |
| 5 | Regression | ?/55 |

## INFO items (non-blocking)
- [참고 사항]

## 수정 파일
- [목록]

## 생성 파일
- AREA8_EXPORT_SANCTIONS_RESULT.md
- Work log 시트
```

엑셀 로깅: POTAL_Claude_Code_Work_Log.xlsx 에 시트 추가 (YYMMDDHHMM 형식)

---

## ⚠️ Area 8 끝나면 멈춰라. Area 9로 넘어가지 마라. "Area 8 Complete. 대기 중." 선언 후 대기.
