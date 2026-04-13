# CW34-S1 HF 세션 종합 컨텍스트
> 작성: 2026-04-13 19:30 KST
> 목적: 새 세션이 이 파일 하나만 읽으면 현재 상태와 다음 작업을 완전히 파악할 수 있도록 함

---

## 1. 이번 세션에서 완료한 것 (CW34-S1 HF)

### A. Playground Seller 시나리오 3 endpoint 프로덕션 검증 (Chrome MCP)
www.potal.app/playground/seller 에서 실제 테스트:

1. **Classify** — wallet 입력 → HS 420231 (decision_tree:4202→group3+mat1) ✅
2. **Check Restrictions** — HS 850760 → Lithium Batteries HAZMAT, carrier restrictions (USPS, Royal Mail, China Post air, Singapore Post air) ✅  
3. **Calculate Landed Cost** — CN→US $45 leather wallet → totalLandedCost $82.15 ✅
   - importDuty $0.05 (MFN), Additional Tariff $15 (Section 301 25%), Sales Tax $4.2, MPF $2, Insurance $0.9

### B. defaultValue 버그 수정 (핵심 버그)
**증상**: Calculate에서 importDuty가 $0, type이 "domestic"
**원인**: endpoint 정의에 defaultValue가 있지만 React paramValues state에 초기화되지 않음 → API body에서 origin/destinationCountry/currency가 누락 → 엔진이 국내 거래로 처리

**수정 파일**: `app/playground/[scenarioId]/page.tsx` (3곳)
1. `useState` 초기값에서 첫 endpoint의 defaultValue를 seed
2. `onSelect` endpoint 전환 시 defaultValue seed  
3. `handleTest` body 구성 시 `paramValues[p.key] || p.defaultValue || ''` fallback

### C. Price + Currency Composite Field 전역 적용
**수정 파일**: `components/playground/ParamsPanel.tsx`
- Price 필드: 숫자 input + 통화 드롭다운 한 줄 (USD/EUR/GBP/KRW/JPY/CNY/CAD/AUD)
- 조건: `p.key === 'price'` (이전: endpoint에 currency param이 있을 때만)
- currency param 행은 filter로 숨김: `!(p.key === 'currency' && endpoint.params.some(pp => pp.key === 'price'))`

### D. Chrome MCP 사이드바 클릭 이슈 해결
- Chrome MCP 좌표 클릭으로 React state 변경이 안 되는 문제
- `mcp__Claude_in_Chrome__javascript_tool`로 `document.querySelector().click()` 직접 실행
- React-controlled input 값 설정: `nativeInputValueSetter` 패턴 사용

---

## 2. 현재 코드 상태

### Build
- **475/475 pages** ✅
- verify-cw32: **28/28** green
- verify-cw33: **23/23** green

### Git
- 최신 커밋까지 push 완료 (은태님이 직접 push)
- 문서 업데이트 커밋은 아직 미push (이 파일 포함)

### 프로덕션 (www.potal.app)
- Playground Seller 3 endpoint 모두 정상 동작 확인
- 나머지 시나리오 (D2C Brand, Importer, Exporter, Forwarder)는 아직 미검증

---

## 3. Playground 아키텍처 핵심 사항

### 파일 구조
| 파일 | 역할 |
|------|------|
| `app/playground/[scenarioId]/page.tsx` | 메인 페이지 — state 관리, API 호출, 3-column 레이아웃 |
| `components/playground/Sidebar.tsx` | 좌측 endpoint 리스트 |
| `components/playground/ParamsPanel.tsx` | 중앙 파라미터 입력 + Test 버튼 |
| `components/playground/CodePanel.tsx` | 우측 코드 스니펫 + 결과 |
| `components/playground/SearchableSelect.tsx` | 커스텀 드롭다운 |
| `lib/playground/scenario-endpoints.ts` | 시나리오별 endpoint 정의 (params, path, method) |
| `lib/playground/dropdown-options.ts` | Material 106개 + Category 73개 + MATERIAL_TO_CATEGORIES 매핑 |

### 핵심 동작 원리
- URL은 `/playground/[scenarioId]`만 — endpoint 전환은 **React state** (URL 변경 없음)
- sidebar `onSelect(id)` → `setSelectedEndpoint(id)` + `setParamValues(defaults)` + `setResult(null)`
- Demo mode: API key 비우면 `X-Demo-Request: true` 헤더로 호출
- Test 버튼: `handleTest()` → fetch(endpoint.path, body from paramValues) → setResult(json)

### 주의사항
- **defaultValue는 반드시 paramValues state에 seed해야 함** (UI에 보여도 state에 없으면 API에 안 감)
- Chrome MCP로 테스트할 때 sidebar 클릭은 JavaScript tool 사용 필수

---

## 4. 다음 세션 우선순위

### Priority 1: 나머지 4개 시나리오 Playground 검증
- D2C Brand (3 endpoints), Importer (4), Exporter (4), Forwarder (4) — 총 15개 endpoint
- Seller와 동일한 방식으로 Chrome MCP 프로덕션 테스트 또는 curl

### Priority 2: Decision Tree 확장
- 현재 heading 4202만 구현됨
- Ch.61/62 (의류 knit/woven), Ch.85 (전자제품) 등에 WCO Explanatory Notes 기반 tree 추가 필요

### Priority 3: Classifier keyword quality sweep
- pump/motor/engine 등 machinery 하위 구분 (8406 vs 8413 vs 8414)
- hs_keywords 우선순위 재조정

### Priority 4: Multi-currency support (CW34-S2)
- 엔진 convertCurrency는 이미 존재
- Playground에서 currency 선택이 calculate API에 정상 전달되는지 확인
- 현재 Price+Currency composite는 UI에서만 동작, API 측 currency 활용 확인 필요

### Priority 5: v3 classifier cold-start 이슈
- 첫 호출 시 가끔 engineStatus=unavailable (이전엔 canned fake 반환, 지금은 헤더로 surface)

### 중장기 TODO
- v3 classifier pipeline 리팩토 (P0.11 — hs_codes/hs_keywords 테이블 사용)
- US state sales tax 2026 재수집
- P1.2-P1.8 외부 API provisioning (DHL/FedEx/UPS, VIES, Textract 등)
- Vercel cron (일일 OFAC SDN + EU/UK/UN + ECB rate fetch)

---

## 5. 핵심 수치 (session-context.md 기준)

- DB: 23 테이블, 154,264 rows
- FTA: 65 agreements, 559 members, 2,209 product rules
- HS codes: 29,903 + keywords 47,505
- Sanctions: 47,926 entities (OFAC 18,718 + BIS 2,585 + UK 19,761 + UN 1,002 + EU 5,860)
- Material options: 106개, Category options: 73개
- 빌드: 475 pages
- 테스트: verify-cw32 28/28, verify-cw33 23/23

---

## 6. 필독 문서 목록

| 파일 | 언제 읽나 |
|------|----------|
| `CLAUDE.md` | 매 세션 시작 (절대 규칙, 문서 업데이트 규칙) |
| `session-context.md` | 프로젝트 전체 맥락, 히스토리 |
| `docs/NEXT_SESSION_START.md` | 다음 세션 우선순위 |
| `docs/CHANGELOG.md` | 최근 변경사항 확인 |
| `lib/playground/scenario-endpoints.ts` | Playground endpoint 정의 확인 |
| `docs/EXTERNAL_DRIVE_FILES.md` | 외장하드 데이터 위치 (v3 pipeline, benchmark 등) |
| `.cursorrules` | 코딩 표준, 파일 매핑 |

---

## 7. 이번 세션 에러 로그 및 교훈

1. **Chrome MCP sidebar click**: React event 시스템과 외부 DOM 조작의 불일치. JavaScript tool로 직접 `.click()` 호출해야 동작.
2. **nativeInputValueSetter**: React-controlled input에 외부에서 값 설정 시 `Object.getOwnPropertyDescriptor(HTMLInputElement.prototype, 'value').set.call(el, val)` + `dispatchEvent(new Event('input', {bubbles: true}))` 필수.
3. **defaultValue ≠ state**: React의 `value={paramValues[p.key] || p.defaultValue || ''}` 패턴은 UI 표시용일 뿐, state에 실제로 들어가지 않으면 API body에 포함 안 됨. 초기 seed 필수.
4. **SWC binary 에러**: Cowork sandbox에서 `npm run build` 실패 (ARM64 Linux SWC binary 없음). 은태님 로컬 터미널에서 빌드해야 함.
