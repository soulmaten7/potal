# Claude Code 명령어: CW18 5개 문서 동기화 + AI Agent Org v5 업데이트

> **날짜**: 2026-03-23 KST
> **목표**: (1) 5개 문서 동기화 — CW18 Cowork 전체 성과 반영 (2) POTAL_AI_Agent_Org_v4.html → v5 업데이트
> **원칙**: 실제 완료된 작업만 기록. 추정치 금지. 교차검증 필수.

---

## ⚠️ 절대 규칙

1. **엑셀 로깅 필수** (CLAUDE.md 절대 규칙 11번) — 시트명 `YYMMDDHHMM`
2. **5개 문서 숫자 교차검증** — 문서 간 숫자 불일치 0건
3. **npm run build 확인** — 코드 변경 시 빌드 확인
4. **v3 파이프라인 수정 금지**

---

# ═══════════════════════════════════════════════════════════════
# PHASE 1: 5개 문서 동기화 (CW18 Cowork 5차 — 12 TLC 시스템화)
# ═══════════════════════════════════════════════════════════════

## 업데이트할 내용 — CW18 Cowork 5차 (2026-03-23 KST) 성과:

### 핵심 성과: 12 TLC 영역 코드 감사 + 46건 이슈 전체 수정 완료

**12 TLC Area 코드 감사 (46건 이슈 발견 → 46건 전부 수정):**
- Area 0 (HS Classification): v3 파이프라인 수정 금지 원칙 유지 ✅
- Area 1 (Duty Rate): macmap-lookup.ts — EU_MEMBERS 매핑, ORDER BY duty_rate ASC
- Area 2 (VAT/GST): eu-vat-rates.ts — 12국→**27국 완성** (EU 전체), 독일 Ch.22 알코올 분리
- Area 3 (De Minimis): country-data.ts — US $800+CN exception, EU 10국+Iceland
- Area 4 (Special Tax): CostEngine.ts — Brazil IPI 95-chapter, India IGST 97-chapter(Ch.71 금/보석 3%!), Mexico IEPS spirits 53%, China CBEC CNY→USD, China CT 21항목
- Area 5 (Customs Fees): GlobalCostEngine.ts — MPF $32.71/$634.04 (×2 locations), HMF ocean-only
- Area 6 (AD/CVD): trade-remedy-lookup.ts — HS2 fallback, fuzzy threshold 0.85 통일
- Area 7 (Rules of Origin): fta.ts — EU-Mercosur inactive, EU-UK TCA added
- Area 8 (Currency): exchange-rate-service.ts — Fallback 2026-03, unknown→null
- Area 9 (Insurance/Shipping): shipping-calculator.ts — GB를 EU에서 분리, AU/NZ→OCEANIA
- Area 10 (Export Controls): export-controls.ts — Math.random 제거, deterministic, ECCN 30+ chapters
- Area 11 (Sanctions): fuzzy-screening.ts — SQL injection escape, 테이블명 수정, db-screen.ts Belarus 추가

**수정 파일 10개:**
- country-data.ts, export-controls.ts, section301-lookup.ts, fta.ts, fuzzy-screening.ts
- GlobalCostEngine.ts, db-screen.ts, CostEngine.ts, eu-vat-rates.ts, macmap-lookup.ts

**검증:**
- npm run build: ✅ (5회 연속 성공)
- Duty Rate regression: 55/55 PASS, 100% ✅
- 엑셀: POTAL_46Issue_Fix_Log.xlsx + POTAL_35Issue_Complete_Fix.xlsx

**데이터 관리 시스템 12개 항목 구현:**
- app/lib/data-management/ (12 TypeScript 파일 + index.ts)
- app/api/v1/cron/data-management/route.ts (매일 02:00 UTC)
- 12개 항목: file-tree-map, update-tracker, update-scheduler, source-verifier, auto-updater, dependency-chain, validation-rules, error-handler (AI auto-diagnosis), cost-tracker, priority-manager, audit-trail, data-registry
- DB: data_update_log + data_error_log 테이블

---

## 문서 1: CLAUDE.md

**헤더 업데이트:**
```
# 마지막 업데이트: 2026-03-23 KST (CW18 Cowork 5차 — 12 TLC 시스템화 완료, 46건 코드 감사 수정, 데이터 관리 시스템 12항목, npm run build ✅)
```

**`### ⭐ CW18 Cowork 5차 세션 성과 (2026-03-23 KST)` 섹션 신규 추가 (기존 CW18 3차 아래):**

```markdown
### ⭐ CW18 Cowork 5차 세션 성과 (2026-03-23 KST)

**12 TLC 영역 코드 감사 + 46건 이슈 전체 수정:**

**감사 범위**: 12개 TLC 영역(HS Classification~Sanctions) 전체 코드 리뷰
- 발견: **46건** (P0 CRITICAL 2건 + P1 URGENT 6건 + P2 IMPORTANT 3건 + P3 ENHANCE 3건 + MEDIUM 20건 + LOW 3건 + EU VAT 15국)
- 수정: **46건 전부 완료** (1차 11건 + 2차 35건)

**P0 CRITICAL 수정 (즉시 영향):**
- US de minimis: 모든 origin에 $0 → **CN $0 유지, 비중국 $800** (country-data.ts)
- Export Controls: Math.random() → **deterministic license exception** (export-controls.ts)

**금액 영향 TOP 5:**
1. India 금/보석 Ch.71: IGST 28%→**3%** ($10,000 금 바 = $2,500 차이)
2. Mexico 주류 HS 2208: IEPS 26.5%→**53%** (위스키 수입 2배 차이)
3. EU VAT: 12국→**27국 경감세율 완성** (15개국 경감세율 누락 해결)
4. US MPF: CN-only→**전체 원산지** (비중국 수입품 MPF 누락 해결)
5. Brazil IPI: 일괄 10%→**95-chapter별 세율** (의류 0%, 차량 25%, 담배 300%)

**수정 파일 10개**: country-data.ts, export-controls.ts, section301-lookup.ts, fta.ts, fuzzy-screening.ts, GlobalCostEngine.ts, db-screen.ts, CostEngine.ts, eu-vat-rates.ts, macmap-lookup.ts

**검증**: npm run build ✅ (5회 연속) + Duty Rate regression 55/55 PASS 100% ✅

**데이터 관리 시스템 12항목 구현:**
- app/lib/data-management/ (12 TS 파일): data-registry(45파일등록), source-verifier(콘텐츠검증), error-handler(AI자동진단), update-tracker, update-scheduler, auto-updater, dependency-chain, validation-rules, cost-tracker, priority-manager, audit-trail, index.ts(31함수 통합)
- Cron: app/api/v1/cron/data-management/route.ts (매일 02:00 UTC)
- DB: data_update_log + data_error_log

**생성된 엑셀:**
- POTAL_12Area_Code_Audit.xlsx (2시트: AUDIT_SUMMARY 36행 + ALL_ISSUES 49행)
- POTAL_46Issue_Fix_Log.xlsx (1차 11건 P0-P2 수정)
- POTAL_35Issue_Complete_Fix.xlsx (2차 35건 수정)

**명령어 파일:**
- CLAUDE_CODE_12AREA_AUDIT.md — 12 TLC 영역 코드 감사 명령어
- CLAUDE_CODE_DATA_MANAGEMENT_SYSTEM.md — 데이터 관리 시스템 12항목 명령어
- CLAUDE_CODE_35ISSUE_COMPLETE_FIX.md — 나머지 35건 수정 명령어
```

**핵심 수치 업데이트:**
- `Vercel Cron **22개**` → `Vercel Cron **23개**` (data-management 추가)
- EU VAT 관련: `12개국` 언급이 있다면 → `27개국 (EU 전체)` 로 업데이트

---

## 문서 2: session-context.md

**헤더 업데이트:**
```
# 마지막 업데이트: 2026-03-23 KST (CW18 Cowork 5차)
```

**세션 추가 — `## CW18 Cowork 5차 (2026-03-23 KST)` 신규:**

위 CLAUDE.md에 추가한 `CW18 Cowork 5차 세션 성과` 내용을 session-context.md 형식에 맞게 복사.
핵심만:
```
## CW18 Cowork 5차 (2026-03-23 KST) — 12 TLC 시스템화 완료

### 성과
- 12 TLC 영역 전체 코드 감사: 46건 이슈 발견 → 46건 전부 수정
- P0 2건: US de minimis $800 비중국, Math.random→deterministic
- 특수세금 전면 개편: Brazil IPI 95ch, India IGST 97ch(Ch.71 3%), Mexico IEPS 53%, China CBEC CNY→USD, China CT 21항목
- EU VAT: 12국→27국 완성 (FI,DK,CZ,RO,HU,BG,HR,SK,SI,LT,LV,EE,LU,CY,MT 추가)
- 데이터 관리 시스템 12항목 구현 (app/lib/data-management/, Cron daily 02:00)
- 수정 파일 10개, npm run build ✅, 55/55 regression PASS
- 엑셀 3개 생성, 명령어 파일 3개 생성
```

---

## 문서 3: .cursorrules

**헤더 업데이트:**
```
# 마지막 업데이트: 2026-03-23 KST (CW18 Cowork 5차 — 12 TLC 시스템화 46건 수정, 데이터 관리 12항목, EU VAT 27국 완성, npm run build ✅)
```

**핵심 수치 업데이트:**
- `Vercel Cron: **22개**` → `**23개**` (data-management 추가)
- `12개국 특수세금` 설명에 추가: `(Brazil IPI 95-chapter, India IGST 97-chapter+Cess, Mexico IEPS 53% spirits, China CBEC CNY→USD + CT 21항목)`
- `EU VAT` 관련: `27개국 경감세율 완성` 추가

---

## 문서 4: CHANGELOG.md

**헤더 업데이트:**
```
> 마지막 업데이트: 2026-03-23 KST (CW18 Cowork 5차 — 12 TLC 시스템화 46건 수정)
```

**최상단에 새 항목 추가:**
```markdown
## [2026-03-23 KST] CW18 Cowork 5차 — 12 TLC 시스템화 완료

### 12 TLC 영역 코드 감사 (46건 수정)
- **P0 CRITICAL**: US de minimis $0→$800(비중국), Math.random→deterministic(export-controls)
- **P1 URGENT**: MPF $32.71/$634.04 통일, Section 232 Aluminum 25%, SQL injection escape, Belarus 제재
- **P2 IMPORTANT**: Section 301 2024 확대, EU-Mercosur inactive, EU-UK TCA
- **Special Tax 전면 개편**:
  - Brazil IPI: 일괄 10% → 95-chapter별 (의류 0%, 화장품 22%, 차량 25%, 담배 300%)
  - India IGST: 일괄 18% → 97-chapter별 (금 3%, 식품 5%, 차량 28%+Cess 22%)
  - Mexico IEPS: Ch.22 일괄 26.5% → heading별 (맥주 26.5%, spirits 53%, 담배 160%)
  - China CBEC: $700/$3660 하드코딩 → ¥5,000/¥26,000 + 환율 동적 계산
  - China CT: 6항목 → 21항목 (배터리/페인트/용제 4% 추가)
- **EU VAT**: 12국 → 27국 (15개국 경감세율 추가: FI,DK,CZ,RO,HU,BG,HR,SK,SI,LT,LV,EE,LU,CY,MT)
- **FTA**: EU-UK TCA 추가, EU-Mercosur→inactive
- **Shipping**: GB를 EU에서 분리, AU/NZ→OCEANIA 신규
- **Exchange Rate**: Fallback 2026-03 업데이트, unknown currency→null

### 데이터 관리 시스템
- app/lib/data-management/ — 12개 TypeScript 모듈
- Cron: data-management (매일 02:00 UTC)
- DB: data_update_log + data_error_log

### 검증
- npm run build: ✅ (5회 연속)
- Duty Rate regression: 55/55 PASS, 100%
- 수정 파일: 10개
- 엑셀: POTAL_12Area_Code_Audit.xlsx, POTAL_46Issue_Fix_Log.xlsx, POTAL_35Issue_Complete_Fix.xlsx
```

---

## 문서 5: NEXT_SESSION_START.md

**헤더 업데이트:**
```
> 마지막 업데이트: 2026-03-23 KST (CW18 Cowork 5차 완료 — 12 TLC 시스템화 46건 수정, 데이터 관리 12항목, EU VAT 27국)
```

**현재 상태 섹션에 추가:**
```markdown
### 12 TLC 시스템화 (완성 ✅):
- **46건 이슈 전부 수정**: P0 2건 + P1 6건 + P2 3건 + P3 3건 + MEDIUM 20건 + LOW 3건 + EU VAT 15국
- **특수세금 전면 개편**: Brazil IPI 95ch, India IGST 97ch+Cess, Mexico IEPS, China CBEC+CT
- **EU VAT 27국 완성**: 12국→27국 경감세율
- **데이터 관리 시스템**: 12항목, Cron daily 02:00 UTC
- **검증**: npm run build ✅, 55/55 PASS

### 다음 세션 추천 작업:
- **P0**: git push (CW18 5차 변경사항 전부 push)
- **P1**: POTAL_B2B_Channel_Strategy.xlsx 최신화 (46건 수정 성과 반영)
- **P2**: Layer 2 v8 실험 (v7 코드교집합+LLM 개선 — Layer 1에 confirmed_chapter 직접 전달)
- **P3**: KEYWORD_TO_HEADINGS 사전 확장 (Ch.67 가발, Ch.82 공구, Ch.83 잡금속, Ch.49 인쇄물 키워드 추가)
```

---

# ═══════════════════════════════════════════════════════════════
# PHASE 2: POTAL_AI_Agent_Org_v4.html → v5 업데이트
# ═══════════════════════════════════════════════════════════════

## 업데이트 사항:

### 2-A: 버전 업데이트

**헤더:**
```html
<title>POTAL AI Agent Organization v5</title>
```
```html
<h1>POTAL <span>AI Agent Organization</span> v5</h1>
<div class="ver">B2B Total Landed Cost Infrastructure · 15 Divisions · 3 Layers · 47 Agents · 12 TLC Areas Systematized</div>
```

**푸터:**
```html
POTAL AI Agent Organization v5 · ...
```

### 2-B: D2 Tax & Cost Engine — 업데이트

**현재 D2 leader-tasks:**
```
GlobalCostEngine 정확도 관리 · VAT/GST 240개국 데이터 유지 · de minimis/IOSS/DST 로직 감독
```

**변경:**
```
GlobalCostEngine 정확도 관리 · VAT/GST 240개국(EU 27국 경감세율 완성) · de minimis/IOSS/DST · 12개국 특수세금 Chapter별 세율 시스템화
```

**D2 Tax Rule Developer tasks 업데이트:**
```
현재: 12개국 특수세금 로직 · IOSS/OSS 27개국 VAT · US Sales/Telecom/Lodging Tax · processing fee
변경: 12개국 특수세금 Chapter별(BR IPI 95ch/IN IGST 97ch/MX IEPS/CN CBEC+CT) · IOSS/OSS · US Sales/Telecom/Lodging Tax · processing fee
```

**D2 Tax Data Curator tasks 업데이트:**
```
현재: VAT/GST rate 업데이트 · de minimis threshold 검증 · Incoterms DDP/DDU 로직
변경: VAT/GST rate(EU 27국 경감세율) · de minimis(US $800 비중국) · 데이터 관리 12항목 Cron · Incoterms DDP/DDU
```

### 2-C: 신규 섹션 추가 — "12 TLC 시스템화 현황" (Divisions 아래, Opus Map 위에 삽입)

아래 HTML 블록을 `</div><!-- end divisions -->` (라인 695) 바로 아래에 삽입:

```html
<!-- ═══════════════════════════════════════════════ -->
<!-- Section: 12 TLC 시스템화 현황 -->
<!-- ═══════════════════════════════════════════════ -->
<div class="ops-section">
  <div class="ops-box" style="border-color: #166534;">
    <h3><span class="emoji">✅</span> <span style="color:#4ade80;">12 TLC 시스템화 현황 (2026-03-23 완료)</span></h3>
    <div class="phase-timeline">

      <div class="phase-item">
        <div class="phase-time" style="color:#4ade80;">Area 0</div>
        <div class="phase-body">
          <div class="phase-label">HS Classification <span class="phase-badge badge-auto">ABSOLUTE</span></div>
          <div class="phase-desc">
            v3 파이프라인 Step 0~6 · 9-field → 100% · AI 0회 · gov_tariff_schedules 131,794행 · 7개국 벤치마크 1,183건 100%<br>
            <strong style="color:#ef4444;">⚠️ 수정 금지. 추가만 가능.</strong>
          </div>
        </div>
      </div>

      <div class="phase-item">
        <div class="phase-time" style="color:#4ade80;">Area 1</div>
        <div class="phase-body">
          <div class="phase-label">Duty Rate <span class="phase-badge badge-auto">DB LOOKUP</span></div>
          <div class="phase-desc">
            macmap 113M+ · EU_MEMBERS 27국 매핑 · ORDER BY duty_rate ASC · 140국 세율 874,302행<br>
            55/55 regression PASS ✅
          </div>
        </div>
      </div>

      <div class="phase-item">
        <div class="phase-time" style="color:#4ade80;">Area 2</div>
        <div class="phase-body">
          <div class="phase-label">VAT/GST <span class="phase-badge badge-auto">DB LOOKUP</span></div>
          <div class="phase-desc">
            240개국 · EU **27국 경감세율 완성** (FI,DK,CZ,RO,HU,BG,HR,SK,SI,LT,LV,EE,LU,CY,MT 추가)<br>
            독일 Ch.22 알코올 분리 · 프랑스 DOM 영토
          </div>
        </div>
      </div>

      <div class="phase-item">
        <div class="phase-time" style="color:#4ade80;">Area 3</div>
        <div class="phase-body">
          <div class="phase-label">De Minimis <span class="phase-badge badge-auto">IF문</span></div>
          <div class="phase-desc">
            240개국 · US: CN $0 / 비중국 $800 분리 · EU 10국+Iceland · 실시간 적용
          </div>
        </div>
      </div>

      <div class="phase-item">
        <div class="phase-time" style="color:#4ade80;">Area 4</div>
        <div class="phase-body">
          <div class="phase-label">Special Tax <span class="phase-badge badge-auto">CHAPTER별</span></div>
          <div class="phase-desc">
            Brazil IPI 95-chapter · India IGST 97-chapter + Cess(Ch.71 금 3%) · Mexico IEPS(spirits 53%/담배 160%)<br>
            China CBEC ¥5,000/¥26,000 + 환율 · China CT 21항목 · 12개국
          </div>
        </div>
      </div>

      <div class="phase-item">
        <div class="phase-time" style="color:#4ade80;">Area 5</div>
        <div class="phase-body">
          <div class="phase-label">Customs Fees <span class="phase-badge badge-auto">고정값</span></div>
          <div class="phase-desc">
            US MPF $32.71~$634.04 (0.3464%) 전체 origin · HMF 0.125% ocean-only · 240개국
          </div>
        </div>
      </div>

      <div class="phase-item">
        <div class="phase-time" style="color:#4ade80;">Area 6</div>
        <div class="phase-body">
          <div class="phase-label">AD/CVD <span class="phase-badge badge-auto">DB 매칭</span></div>
          <div class="phase-desc">
            119,706건 · HS6→HS4→HS2 3단계 fallback · fuzzy threshold 0.85 통일
          </div>
        </div>
      </div>

      <div class="phase-item">
        <div class="phase-time" style="color:#4ade80;">Area 7</div>
        <div class="phase-body">
          <div class="phase-label">Rules of Origin <span class="phase-badge badge-auto">FTA 매칭</span></div>
          <div class="phase-desc">
            63 FTA · EU-UK TCA 추가 · EU-Mercosur inactive · FTA별 조합 요건(AND/OR)
          </div>
        </div>
      </div>

      <div class="phase-item">
        <div class="phase-time" style="color:#4ade80;">Area 8</div>
        <div class="phase-body">
          <div class="phase-label">Currency <span class="phase-badge badge-auto">API</span></div>
          <div class="phase-desc">
            ECB 실시간 API · Fallback 2026-03 업데이트 · unknown currency → null 반환
          </div>
        </div>
      </div>

      <div class="phase-item">
        <div class="phase-time" style="color:#4ade80;">Area 9</div>
        <div class="phase-body">
          <div class="phase-label">Insurance/Shipping <span class="phase-badge badge-auto">수식</span></div>
          <div class="phase-desc">
            5개 지역 분리: AMERICAS / EU(GB 제외) / UK / ASIA(AU/NZ 제외) / OCEANIA(AU/NZ)
          </div>
        </div>
      </div>

      <div class="phase-item">
        <div class="phase-time" style="color:#4ade80;">Area 10</div>
        <div class="phase-body">
          <div class="phase-label">Export Controls <span class="phase-badge badge-auto">매트릭스</span></div>
          <div class="phase-desc">
            ECCN 30+ chapters 매핑 · deterministic license exceptions · Math.random 제거 ✅
          </div>
        </div>
      </div>

      <div class="phase-item">
        <div class="phase-time" style="color:#4ade80;">Area 11</div>
        <div class="phase-body">
          <div class="phase-label">Sanctions <span class="phase-badge badge-auto">퍼지 매칭</span></div>
          <div class="phase-desc">
            21,301건 · SQL injection escape ✅ · Belarus 추가 · Levenshtein+Soundex
          </div>
        </div>
      </div>

    </div>

    <div style="padding: 10px 16px 16px; font-size: 10px; color: #4b5578; line-height: 1.6;">
      <strong style="color:#4ade80;">시스템화 원칙:</strong> 정부/국제기구가 만든 시스템 = 구조화 = 100% 코드화 가능 = AI 불필요<br>
      <strong style="color:#4ade80;">검증:</strong> npm run build ✅ (5회 연속) · Duty Rate regression 55/55 PASS 100% · 46/46 이슈 수정<br>
      <strong style="color:#4ade80;">데이터 관리:</strong> 12항목 자동 시스템 (data-registry · source-verifier · error-handler + AI auto-diagnosis · Cron daily 02:00)
    </div>
  </div>
</div>
```

### 2-D: D1 Rate Validator tasks 업데이트

```
현재: lookup_duty_rate_v2() 검증 · 4단계 폴백(MIN→AGR→NTLC→WITS) 정확도 · ICS2/Type86 통관 검증
변경: lookup_duty_rate_v2() 검증 · 4단계 폴백(MIN→AGR→NTLC→WITS) · 55/55 regression PASS · HS6→HS4→HS2 fallback
```

### 2-E: D4 Regulations Collector tasks에 추가

```
현재: 240개국 관세법/세법/무역규정 스크래핑 · RAG 벡터 DB 인덱싱 · 데이터 유지보수 Cron
변경: 240개국 관세법/세법/무역규정 스크래핑 · RAG 벡터 DB · 데이터 유지보수 Cron 23개 · 데이터 관리 12항목 시스템(daily 02:00)
```

### 2-F: D8 QA Lead tasks 업데이트

```
현재: 142기능 테스트 커버리지 · 심층 검증 체계 운영 · Spot Check 결과 분석 · 정확도 메트릭 추적
변경: 142기능 테스트 · 심층 검증 · 12 TLC 코드 감사(46건 전부 수정 ✅) · Spot Check · 55/55 regression
```

### 2-G: D11 Cron 관리 업데이트

```
현재: Vercel 배포 안정성 · Supabase DB/Auth 모니터링 · Cron 상태 관리 · 보안 감사
변경: Vercel 배포 · Supabase DB/Auth · Cron **23개** 상태 관리 · 보안 감사(Math.random 제거, SQL escape)
```

### 2-H: Opus Map 에스컬레이션 추가

에스컬레이션만 (5곳) → **(6곳)** 으로 변경, 추가:
```html
<span class="opus-tag tag-escalate">D15 경쟁 대응</span>
```
(기존에 D15가 CLAUDE.md의 에스컬레이션 목록에는 있지만 HTML에는 빠져있으므로 추가)

### 2-I: 일일 운영 플로우 — Phase 0에 data-management Cron 추가

```
현재: Vercel Cron이 자동 실행: 환율 업데이트 · 관세율 동기화 · health check(6시간) · Spot Check(04:00) · uptime check(6시간) · plugin health(12시간)
변경: Vercel Cron이 자동 실행: 환율 업데이트 · 관세율 동기화 · health check(6시간) · Spot Check(04:00) · uptime check(6시간) · plugin health(12시간) · data-management(02:00 매일)
```

### 2-J: 구현 스택 비용 업데이트 (24/7 루프 섹션 하단)

```
현재: <strong style="color:#6b7394;">비용:</strong> Vercel Cron 무료 · Telegram Bot API 무료 · Make.com 무료 티어(1,000 ops/월) · 총 $0/월
```
이건 그대로 유지 (변경 없음).

### 2-K: 파일명 변경

파일명을 `POTAL_AI_Agent_Org_v5.html`로 저장.
기존 v4도 삭제하지 말고 보존.

---

# ═══════════════════════════════════════════════════════════════
# PHASE 3: 교차검증 + 엑셀 로깅
# ═══════════════════════════════════════════════════════════════

## 3-A: 교차검증 (5개 문서 간 숫자 일치)

확인할 숫자:
```
□ Vercel Cron: 23개 (기존 22 + data-management)
□ EU VAT: 27국 경감세율 완성
□ 12개국 특수세금: Brazil IPI 95ch, India IGST 97ch, Mexico IEPS, China CBEC+CT
□ US de minimis: CN $0, 비중국 $800
□ MPF: $32.71~$634.04, 0.3464%
□ gov_tariff_schedules: 131,794행
□ API 엔드포인트: ~148개
□ 기능: 142/147 (96.6%)
□ product_hs_mappings: ~1.36M
□ Layer 1: 9-field → 100%
```

## 3-B: 엑셀 로깅

`POTAL_Claude_Code_Work_Log.xlsx`에 새 시트 생성 (시트명: 현재 시각 YYMMDDHHMM)
- 모든 파일 수정 기록 (변경 전/후)
- npm run build 결과
- 교차검증 결과

---

# ═══════════════════════════════════════════════════════════════
# 실행 순서 요약
# ═══════════════════════════════════════════════════════════════

```
Phase 1: 5개 문서 동기화
  1-1. CLAUDE.md 업데이트 (헤더 + CW18 5차 섹션 + 수치)
  1-2. session-context.md 업데이트 (헤더 + CW18 5차 세션)
  1-3. .cursorrules 업데이트 (헤더 + 수치)
  1-4. CHANGELOG.md 업데이트 (헤더 + 새 항목)
  1-5. NEXT_SESSION_START.md 업데이트 (헤더 + 상태 + 추천 작업)

Phase 2: AI Agent Org v5
  2-A~2-K. HTML 업데이트 → POTAL_AI_Agent_Org_v5.html 저장

Phase 3: 검증
  3-A. 5개 문서 교차검증 (숫자 일치)
  3-B. 엑셀 로깅
```

---

# 완료 조건

- [ ] 5개 문서 전부 업데이트 완료
- [ ] 5개 문서 간 숫자 교차검증 — 불일치 0건
- [ ] POTAL_AI_Agent_Org_v5.html 생성 + 12 TLC 시스템화 섹션 포함
- [ ] POTAL_Claude_Code_Work_Log.xlsx 시트 추가
- [ ] npm run build ✅ (코드 변경 있을 경우)
