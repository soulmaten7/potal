# 12건 기능 보강 명령어 (F026 + 11건)

## ⚠️ 절대 규칙
1. **기능 1개씩 순서대로** 진행. 동시에 2개 이상 수정 금지
2. **"이미 구현됨" 판정 금지** — 감사에서 부족하다고 나온 기능이므로 반드시 수정
3. **각 기능 완료 후 5단계 검증** 통과해야 다음 기능으로 이동
4. **수정 전/후 코드 diff** 반드시 기록
5. **POTAL_107_Feature_Audit.xlsx** 읽고 각 기능의 "구체적 수정 내용" 컬럼 확인 후 작업

## 📋 5단계 검증 (매 기능마다)
```
1. TypeScript 컴파일 에러 없음 (npx tsc --noEmit 해당 파일)
2. 수정한 코드에 try-catch + 의미있는 에러 메시지 존재
3. 입력 검증 (잘못된 입력 시 400 에러 반환)
4. 타입 정의 완전 (any 타입 0개)
5. npm run build 성공
```

---

## 🔴 Phase 1: 미완성 (F026) — 반드시 먼저

### F026 — Landed Cost 보증 (Landed Cost Guarantee)
**현재 상태**: accuracyGuarantee 필드만 존재, 실제 보증 로직/보험 연동 없음
**수정 내용**:
1. `app/lib/cost-engine/` 에서 accuracyGuarantee 관련 코드 찾기
2. 보증 로직 구현:
   - 계산된 landed cost와 실제 비용 차이 보증 범위 설정 (예: ±5%)
   - 보증 등급 시스템: Standard(±10%), Premium(±5%), Enterprise(±2%)
   - 보증 조건 명시: 어떤 경우 보증 적용/미적용
3. 보증 이력 추적:
   - guarantee_claims 테이블 또는 기존 테이블에 보증 필드 추가
   - 클레임 제출 → 검토 → 승인/거절 플로우
4. API 응답에 guarantee 객체 포함:
   ```typescript
   guarantee: {
     tier: 'standard' | 'premium' | 'enterprise',
     coverage_percentage: number,
     max_claim_amount: number,
     valid_until: string,
     conditions: string[]
   }
   ```
5. TypeScript 타입 정의 완전하게 (any 금지)
6. 에러 핸들링: try-catch + 의미있는 에러 메시지
7. **5단계 검증** 통과 확인

---

## 🟡 Phase 2: 에러 핸들링 보강 5건

### F015 — 가격 분기 규칙 (Price Break Engine)
**부족**: price-break-engine에 try-catch 없음 (DB 쿼리)
**수정**:
1. `app/lib/cost-engine/price-break-engine.ts` 찾기
2. DB 쿼리(Supabase)에 try-catch 추가
3. DB 연결 실패 시 fallback 로직 (기본 세율 적용 or 에러 반환)
4. 입력 검증: price가 음수이거나 없는 경우 처리
5. **5단계 검증** 통과

### F013 — 불량 상품 설명 감지 (Bad Description Detection)
**부족**: standalone API endpoint 없음 (classify 내부에서만 사용)
**수정**:
1. 현재 classify 내부 로직 확인
2. `/api/v1/classify/validate-description` 또는 유사 standalone endpoint 생성
3. 요청: `{ description: string, language?: string }`
4. 응답: `{ is_valid: boolean, issues: string[], suggestions: string[], confidence: number }`
5. 에러 핸들링: 빈 문자열, 너무 짧은 설명, 특수문자만 있는 경우
6. **5단계 검증** 통과

### F043 — 통관 서류 자동 생성 (Customs Document Auto-Generation)
**부족**: doc-auto-populate에 입력 검증 없음
**수정**:
1. `app/lib/` 또는 `app/api/` 에서 doc-auto-populate 관련 코드 찾기
2. 필수 필드 검증 추가 (shipper, consignee, HS code, value, origin, destination)
3. HS code 형식 검증 (6자리 or 10자리)
4. 국가 코드 검증 (ISO 2자리)
5. 금액 검증 (양수, 적절한 범위)
6. 누락 필드 시 구체적 에러 메시지 반환
7. **5단계 검증** 통과

### F049 — ICS2 준수 (ICS2 Compliance)
**부족**: broker-data-export에 입력 검증 없음
**수정**:
1. broker-data-export 관련 코드 찾기
2. EU ICS2 필수 필드 검증: 6자리 HS code, 상품 설명, 가격, 중량
3. 입력 타입 검증 + 범위 검증
4. ICS2 규격에 맞지 않는 데이터 시 구체적 에러
5. **5단계 검증** 통과

### F041 — 원산지 국가 AI 예측 (Origin Country AI Prediction)
**부족**: try-catch 없음 (1000+ 브랜드 매핑)
**수정**:
1. origin prediction / brand mapping 관련 코드 찾기
2. 브랜드 DB 조회 try-catch 추가
3. 매칭 실패 시 graceful fallback (unknown 반환, 에러 아님)
4. 입력 검증: 빈 브랜드명, 특수문자
5. **5단계 검증** 통과

---

## 🟡 Phase 3: 프로덕션 품질 보강 4건

### F054 — Nexus 추적 (Tax Nexus Tracking)
**부족**: 전용 API endpoint 미확인
**수정**:
1. nexus 관련 코드 전체 검색
2. `/api/v1/tax/nexus` endpoint가 없으면 생성
3. 기능: 사용자별 nexus 상태 조회/업데이트
4. US 주별 nexus threshold 데이터 확인
5. **5단계 검증** 통과

### F068 — 위험물 배송 지원 (Dangerous Goods Shipping)
**부족**: 전용 UN number→HS 매핑 파일 미확인
**수정**:
1. dangerous goods / hazmat 관련 코드 검색
2. UN number 매핑이 하드코딩이면 → DB 또는 JSON 데이터 파일로 분리
3. 주요 UN number (top 100) → HS code 매핑 확인
4. 누락된 매핑 보충
5. **5단계 검증** 통과

### F081 — Magento 플러그인
**부족**: 플러그인이 WooCommerce보다 덜 완성
**수정**:
1. `plugins/magento/` 코드 확인
2. WooCommerce 플러그인과 기능 비교
3. 누락된 기능 보충 (설치 가이드, 설정 UI, 에러 핸들링)
4. **5단계 검증** 통과

### F090 — 다국어 SDK
**부족**: SDK 139줄로 경량 — 문서 부족
**수정**:
1. SDK 코드 확인 (JS/Python/cURL)
2. 각 SDK에 JSDoc/docstring 주석 추가
3. 사용 예제 코드 보강 (최소 3개 시나리오: calculate, classify, compare)
4. README 또는 인라인 문서에 모든 메서드 설명
5. **5단계 검증** 통과

---

## 🟡 Phase 4: 타입 + 품질 2건

### F126 — 240개국 규제 문서 RAG
**부족**: any 타입 4곳 (DB+typed 매핑)
**수정**:
1. RAG 관련 코드에서 `any` 타입 전체 검색
2. 4곳 모두 구체적 타입으로 교체
3. interface/type 정의 추가
4. **5단계 검증** 통과

### F143 — AI 챗봇
**부족**: Crisp 위젯 준비됨, 실 AI 응답 품질 미검증
**수정**:
1. AI 챗봇 응답 로직 확인
2. FAQ 13개 항목에 대한 응답 품질 확인
3. fallback 응답 (모르는 질문) 처리 확인
4. 에러 핸들링 + 타입 정의
5. **5단계 검증** 통과

---

## 📊 완료 후
1. 수정한 12개 기능 전체 `npm run build` 성공 확인
2. `POTAL_107_Feature_Audit.xlsx`의 해당 행 판정을 ✅로 업데이트
3. 수정 요약 리포트 출력:
   - F번호 | 수정 내용 | 변경 파일 | 빌드 결과
4. session-context.md 업데이트: "107개 감사 완료, 12건 보강 완료, 106/106 = 100%"
