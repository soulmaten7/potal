# CW37 Architecture Decision Record (ADR)

**작성일**: 2026-04-14 KST
**결정자**: 은태님 (CEO/Founder) + Claude (Advisor)
**상태**: **확정**
**적용 범위**: POTAL 제품 전체 아키텍처 리뉴얼

---

## 배경

CW34 ~ CW36 작업 (customs_rulings Data Warehouse, Runtime Integration, FTA Eligibility, Multilang, CN/JP/WCO1) 완료 후, FTA Eligibility 통합 과정에서 기존 **페르소나 기반 시나리오 구조의 근본적 문제** 발견.

### 발견된 문제점
1. 기존 6 페르소나 (Online Seller / D2C Brand / Importer / Exporter / Forwarder / Custom) 가 **차원이 섞임** (채널 + 볼륨 + 방향 + 역할)
2. 같은 기능이 페르소나마다 다르게 노출되어 **중복 + 헷갈림**
3. 사용자 행동 예측 실패 — 한 사용자가 여러 시나리오 기능을 다 씀
4. HS Code 입력 필드 + 별도 Calculator popup 이 **사용자에게 혼란**
5. Endpoint 중복 (restricted-item ↔ check-restrictions 등) 미정리

---

## 본질적 통찰 (은태님 리드)

### 1. 페르소나는 마케팅, 기능은 도구
페르소나로 기능을 분리하는 게 아니라, **페르소나 = 홈 진입 마케팅**, **기능 = 모든 사용자 공통 도구** 로 분리.

### 2. 진짜 페르소나는 2개 (수출/수입)
- D2C Brand / Online Seller / 제조사 = 모두 **Exporter 의 변형**
- B2C 직구 / B2B 바이어 / 부품 수입 = 모두 **Importer 의 변형**
- 양방향 회사도 **각 거래를 Import 또는 Export 로 분리 처리** (회계/세무/규제 분리, 엔터프라이즈도 동일)

### 3. RapidAPI 패턴이 진짜 정답
- 사용자 (개발자 + 비개발자) 모두 RapidAPI 식 UX 에 익숙
- 좌측 endpoint 리스트 + 중앙 Parameters/Run/Result + 우측 Code Snippet
- 모듈 묶음 (mega API) 은 "안에 뭐 있어?" 헷갈림 유발
- **세분화된 endpoint 유지 + 각 endpoint 단일 책임** = 표준 패턴

### 4. 결과가 풍부하면 Lookup 흡수 가능
`calculate` 응답에 duty/tax/de-minimis/exchange/FTA 정보 다 포함 → 별도 `duty-rate`, `exchange-rate`, `de-minimis`, `fta-finder` endpoint 불필요.
다만 **input domain 이 다른 endpoint** (screen-parties: 사람 이름, eccn-lookup: 기술 키워드) 는 별도 유지.

### 5. Disclaimer 로 법적 위험 0
"참고용 정보입니다" disclaimer 만 명시하면 sanctions / ECCN / customs filing 모두 **법적으로 안전**. Avalara / FlexPort / FreeTaxUSA 등 이미 이 모델로 수십억 가치 증명.

### 6. HsCodeCalculator 를 모든 endpoint 에 embed
HS Code input 필드 + 별도 Calculator popup = 헷갈림. 모든 endpoint 에 HsCodeCalculator 자체를 embed → product info 입력만 받고 HS Code 자동 계산 → 결과 노출.

### 7. Forever Free 완전 일관
Layer 3 Enterprise tier paywall **폐지**. 모든 endpoint + 모든 기능 무료. Enterprise 는 footer "Contact Us" 만 (rate limit 조정 등 협의).

---

## 확정된 구조

### 홈 (마케팅 진입)
```
POTAL
"무역 어떻게 하세요?"
   📤 수출        📥 수입
```

부연 설명 없음. 단순함이 강점.

### 워크스페이스 (RapidAPI 패턴)
```
좌측 sidebar:                  중앙:                      우측:
─────────────                  ───────                    ───────
🛠️ Compute (6)                Parameters                 Code Snippet
  • classify                   productName ✱ [...]         curl -X POST ...
  • calculate                  material ✱    [...]         
  • apply-fta                  origin ✱      [...]         [Python]
  • check-restrictions         ...                         [Node.js]
  • compare                    [Run]                       [PHP]
  • generate-document                                      [Go]
                              Response                     ...
🔍 Screening (2)              { ... }
  • screen-parties
  • eccn-lookup

📚 Guides (4)
  • customs-filing-guide
  • incoterms-guide
  • section-301-list
  • anti-dumping-list
```

---

## 최종 Endpoint 구조

### 🛠️ Compute API (6개) — 실제 계산/판정/생성

| # | Endpoint | 기능 | 흡수된 Lookup |
|---|----------|-----|--------------|
| 1 | `classify` | HS 분류 | hs-search (alternative suggestions) |
| 2 | `calculate` | 총 비용 계산 | duty-rate, exchange-rate, de-minimis |
| 3 | `apply-fta` | FTA 적용 검증 | fta-finder (agreement 미지정 시 auto-detect) |
| 4 | `check-restrictions` | 규제 확인 | restricted-item (단순 조회도 포함) |
| 5 | `compare` | 다국가 비교 | (여러 calculate 병렬) |
| 6 | `generate-document` | 무역 문서 생성 | cert-of-origin 포함 (documentType param) |

### 🔍 Screening API (2개) — 별도 input domain

| # | Endpoint | 기능 | input domain |
|---|----------|-----|-------------|
| 7 | `screen-parties` | Sanctions / Denied parties 검색 | 사람/회사 이름 |
| 8 | `eccn-lookup` | ECCN 분류 | 기술 키워드 |

### 📚 Guides (4개) — 정적 페이지, API 무관

| # | Page | 내용 |
|---|------|------|
| 9 | `/guides/customs-filing/{country}` | 각국 신고 시스템 + 공식 링크 |
| 10 | `/guides/incoterms-2020` | Incoterms 2020 11가지 정리 |
| 11 | `/guides/section-301` | 미국 대중국 추가관세 리스트 |
| 12 | `/guides/anti-dumping` | 반덤핑 관세 케이스 |

### ❌ 폐지된 것

| 폐지 대상 | 흡수처 |
|---------|-------|
| 6 페르소나 시나리오 (Online Seller / D2C / etc.) | 2 페르소나 (수출/수입) 마케팅만 |
| Module 묶음 (Cost / Compliance 등) | RapidAPI 식 endpoint 단위 |
| HS Code input 필드 + Calculator popup | HsCodeCalculator embed (모든 endpoint) |
| Layer 3 Enterprise tier paywall | Forever Free 완전 일관 |
| `duty-rate` endpoint | `calculate` 응답에 포함 |
| `exchange-rate` endpoint | `calculate` 응답에 포함 |
| `de-minimis` endpoint | `calculate` 응답에 포함 |
| `fta-finder` endpoint | `apply-fta` auto-detect 모드 |
| `restricted-item` endpoint | `check-restrictions` 단순 모드 |
| `hs-search` endpoint | `classify` alternative suggestions |
| `issue-cert-of-origin` endpoint | `generate-document` documentType 파라미터 |
| `export-declaration` endpoint | Guides 페이지로 (직접 처리 X, 정보만) |
| `customs-entry` endpoint | Guides 페이지로 (직접 처리 X, 정보만) |

---

## 핵심 원칙

### 1. Parameters = API input schema 1:1 매핑
- 필드명 = JSON key 그대로 (예: `productName`, `originCountry`)
- 타입 명확 (string / number / enum / array / object)
- 필수 여부 ✱ 표시
- 사용자가 보고 즉시 "API request body" 인지

### 2. Result = 흡수된 정보 모두 디테일 노출
- breakdown / sub-fields 다 포함
- metadata (source / confidence / updated date)
- LLM-friendly 구조 (self-explanatory names + enum + hierarchy)

### 3. 모든 endpoint 동일 UX
- 좌측 리스트 클릭 → 중앙 Parameters → Run → Response → 우측 코드 스니펫
- 학습 곡선 0

### 4. Disclaimer 로 법적 안전
모든 페이지 상단:
> ⚠️ 참고용 정보입니다. 실제 신고/거래 시 공식 출처 확인 및 전문가 검토 권장.

### 5. Forever Free 완전 일관
- 모든 사용자 동일 rate limit
- 대량 사용자만 Contact Us → rate limit 숫자만 조정 (별도 편의성 X)

### 6. HsCodeCalculator Embed
- HS Code input 필드 없음
- 모든 endpoint 에 HsCodeCalculator 컴포넌트 embed
- product info 입력만 받음
- HS Code 자동 계산 → 결과 노출 (필요 시 Edit)

---

## Work Backlog — CW37 작업 순서

### Phase 1 — 현재 상태 감사 (1~2시간)
- API key / rate limit 시스템 현재 상태 점검
- 8 API 응답 schema 현재 상태 점검
- OpenAPI spec 존재 여부 확인
- HsCodeCalculator 현재 embed 상태 확인
- 문서화: `docs/CW37_AUDIT_REPORT.md`

### Phase 2 — Endpoint 정리 + Result 풍부화 (5~7시간)
- 6 compute endpoint 의 Result 에 흡수된 Lookup 정보 모두 포함
- 6 개 Lookup endpoint 폐지 (duty-rate, exchange-rate, de-minimis, fta-finder, restricted-item, hs-search)
- `generate-document` 에 documentType 파라미터로 cert-of-origin 흡수
- backward compatible (기존 클라이언트 안 깨지게 soft-deprecation)

### Phase 3 — UI 리뉴얼 (RapidAPI 패턴, 5~7시간)
- 홈: 페르소나 6개 → 2개 (수출/수입)
- 워크스페이스: 좌측 sidebar + 중앙 Parameters/Result + 우측 Code Snippet
- HsCodeCalculator 를 모든 endpoint 에 embed
- HS Code input 필드 제거
- 시나리오 UI 제거

### Phase 4 — Screening Endpoints (2~3시간)
- `/api/v1/screen-parties` (47K sanctions DB 활용)
- `/api/v1/eccn-lookup` (BIS Commerce Control List import 후)

### Phase 5 — Guides 페이지 신설 (3~4시간)
- `/guides/customs-filing/{country}` (KR/US/EU/GB/JP/CN/AU/CA 메이저 8국)
- `/guides/incoterms-2020`
- `/guides/section-301`
- `/guides/anti-dumping`
- Disclaimer 일관 적용

### Phase 6 — LLM-friendly Schema 정리 (8~12시간, 장기)
- 모든 API 응답 schema 재설계
- Self-explanatory names
- Enum 명시
- Metadata 필드 추가
- Hierarchical structure

### Phase 7 — OpenAPI 3.0 Spec (5~7시간, 장기)
- 8 API 명세 YAML 작성
- Swagger UI 통합 (`/api-docs`)
- Postman collection 자동 생성
- SDK 자동 생성 워크플로우 (CI)

---

## 성공 지표

| 지표 | 목표 |
|------|------|
| Endpoint 수 | 8 API + 4 Guides (정리 전 15+) |
| 사용자 학습 시간 | 5분 내 첫 API 호출 |
| Parameters 명확도 | 100% (모든 필드 1:1 API schema 매핑) |
| Result 디테일 | 모든 흡수 정보 포함 (duty/tax/exchange/fta/rulings/etc.) |
| HS Code input 필드 | 0개 (HsCodeCalculator 만) |
| 페르소나 분리 | 2개 (수출/수입, 홈 페이지만) |
| 법적 disclaimer | 모든 페이지 상단 |

---

## 참조 원칙

- **Rule 9** (CW22): Forever Free 유지, Enterprise Contact Us만 허용 ✓
- **Rule 12** (CW34): 하드코딩 금지, 근본 원인 진단 ✓
- **Rule 13** (CW34): Decision Tree 패턴 사용 ✓

---

## 주요 참여자 (오늘 세션)

- **은태님 (CEO/Founder)**: 모든 본질 통찰 주도 (페르소나 재정의, 모듈 폐지, RapidAPI 채택, HsCodeCalculator embed, 법적 disclaimer 패턴)
- **Claude (Advisor)**: architectural 분석, 시장 비교, endpoint 중복 진단, 작업 plan 제안

---

**다음 세션 시작 시**: 이 문서부터 읽기. Phase 1 (CW37 Audit) 부터 시작.
