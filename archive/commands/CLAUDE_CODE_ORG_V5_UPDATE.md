# Claude Code 명령어: AI Agent Org v4 → v5 업데이트

> **날짜**: 2026-03-23 KST
> **파일 위치**: `/Users/maegbug/potal/POTAL_AI_Agent_Org_v4.html` (⚠️ 이 파일이 반드시 존재함. 확인: `ls -la /Users/maegbug/potal/POTAL_AI_Agent_Org_v4.html`)
> **출력**: `/Users/maegbug/potal/POTAL_AI_Agent_Org_v5.html` (새 파일로 저장, v4는 보존)

---

## ⚠️ 파일 확인부터 시작

```bash
ls -la /Users/maegbug/potal/POTAL_AI_Agent_Org_v4.html
```

파일이 존재하면 읽고 아래 수정 사항을 적용해서 `POTAL_AI_Agent_Org_v5.html`로 저장.

---

## 수정 사항 (총 11개)

### 1. 타이틀 + 헤더 버전

**파일 내 검색**: `<title>POTAL AI Agent Organization v4</title>`
**변경**: `<title>POTAL AI Agent Organization v5</title>`

**파일 내 검색**: `AI Agent Organization</span> v4`
**변경**: `AI Agent Organization</span> v5`

**파일 내 검색**: `B2B Total Landed Cost Infrastructure · 15 Divisions · 3 Layers · 47 Agents`
**변경**: `B2B Total Landed Cost Infrastructure · 15 Divisions · 3 Layers · 47 Agents · 12 TLC Systematized`

### 2. D2 Tax Engine Lead tasks

**파일 내 검색**: `GlobalCostEngine 정확도 관리 · VAT/GST 240개국 데이터 유지 · de minimis/IOSS/DST 로직 감독`
**변경**: `GlobalCostEngine 정확도 관리 · VAT/GST 240개국(EU 27국 경감세율 완성) · de minimis/IOSS/DST · 12개국 특수세금 Chapter별 시스템화`

### 3. D2 Tax Rule Developer tasks

**파일 내 검색**: `12개국 특수세금 로직 · IOSS/OSS 27개국 VAT · US Sales/Telecom/Lodging Tax · processing fee`
**변경**: `12개국 특수세금 Chapter별(BR IPI 95ch · IN IGST 97ch · MX IEPS · CN CBEC+CT) · IOSS/OSS · US Sales Tax · processing fee`

### 4. D2 Tax Data Curator tasks

**파일 내 검색**: `VAT/GST rate 업데이트 · de minimis threshold 검증 · Incoterms DDP/DDU 로직`
**변경**: `VAT/GST rate(EU 27국 경감세율) · de minimis(US $800 비중국) · 데이터 관리 12항목 Cron · Incoterms DDP/DDU`

### 5. D1 Rate Validator tasks

**파일 내 검색**: `lookup_duty_rate_v2() 검증 · 4단계 폴백(MIN→AGR→NTLC→WITS) 정확도 · ICS2/Type86 통관 검증`
**변경**: `lookup_duty_rate_v2() 검증 · 4단계 폴백(MIN→AGR→NTLC→WITS) · 55/55 regression PASS · HS2 fallback`

### 6. D4 Regulations Collector tasks

**파일 내 검색**: `240개국 관세법/세법/무역규정 스크래핑 · RAG 벡터 DB 인덱싱 · 데이터 유지보수 Cron`
**변경**: `240개국 관세법/세법/무역규정 스크래핑 · RAG 벡터 DB · 데이터 유지보수 Cron 23개 · 데이터 관리 12항목(daily 02:00)`

### 7. D8 QA Lead tasks

**파일 내 검색**: `142기능 테스트 커버리지 · 심층 검증 체계 운영 · Spot Check 결과 분석 · 정확도 메트릭 추적`
**변경**: `142기능 테스트 · 심층 검증 · 12 TLC 코드 감사(46건 수정 ✅) · Spot Check · 55/55 regression`

### 8. D11 Infra Lead tasks

**파일 내 검색**: `Vercel 배포 안정성 · Supabase DB/Auth 모니터링 · Cron 상태 관리 · 보안 감사`
**변경**: `Vercel 배포 · Supabase DB/Auth · Cron **23개** 관리 · 보안 감사(SQL escape · Math.random 제거)`

### 9. Opus Map 에스컬레이션 — D15 추가

**파일 내 검색**: `<span class="opus-tag tag-escalate">D14 전략 분석</span>` 바로 뒤에 아래 추가:
```html

        <span class="opus-tag tag-escalate">D15 경쟁 대응</span>
```

그리고 같은 섹션의 에스컬레이션만 **(5곳)** 텍스트를 **(6곳)**로 변경:
**검색**: `에스컬레이션만 (5곳)`
**변경**: `에스컬레이션만 (6곳)`

### 10. Phase 0 야간 자동화에 data-management 추가

**파일 내 검색**: `환율 업데이트 · 관세율 동기화 · health check(6시간) · Spot Check(04:00) · uptime check(6시간) · plugin health(12시간)`
**변경**: `환율 업데이트 · 관세율 동기화 · health check(6시간) · Spot Check(04:00) · uptime(6시간) · plugin health(12시간) · data-management(02:00)`

### 11. 12 TLC 시스템화 현황 섹션 — 신규 삽입

**삽입 위치**: `</div>` (divisions 끝나는 곳, `<!-- Opus Map -->` 코멘트 바로 위)

즉, `</div>\n\n<!-- Opus Map -->` 을 찾아서 그 사이에 아래 HTML 블록을 삽입:

```html

<!-- ═══════════════════════════════════════════════ -->
<!-- Section: 12 TLC 시스템화 현황 (CW18 Cowork 5차) -->
<!-- ═══════════════════════════════════════════════ -->
<div class="ops-section">
  <div class="ops-box" style="border-color: #166534;">
    <h3><span class="emoji">✅</span> <span style="color:#4ade80;">12 TLC 시스템화 현황 (2026-03-23 완료 · 46건 감사 수정)</span></h3>
    <div class="phase-timeline">

      <div class="phase-item">
        <div class="phase-time" style="color:#ef4444;">Area 0</div>
        <div class="phase-body">
          <div class="phase-label">HS Classification <span class="phase-badge badge-auto">ABSOLUTE — 수정 금지</span></div>
          <div class="phase-desc">v3 파이프라인 Step 0~6 · 9-field → 100% · AI 0회 · gov_tariff_schedules 131,794행 · 7개국 1,183건 벤치마크 100%</div>
        </div>
      </div>

      <div class="phase-item">
        <div class="phase-time" style="color:#4ade80;">Area 1</div>
        <div class="phase-body">
          <div class="phase-label">Duty Rate <span class="phase-badge badge-auto">DB LOOKUP</span></div>
          <div class="phase-desc">macmap 113M+ · EU 27국 매핑 · ORDER BY duty_rate ASC · 140국 874,302행 · 55/55 regression PASS ✅</div>
        </div>
      </div>

      <div class="phase-item">
        <div class="phase-time" style="color:#4ade80;">Area 2</div>
        <div class="phase-body">
          <div class="phase-label">VAT/GST <span class="phase-badge badge-auto">DB LOOKUP</span></div>
          <div class="phase-desc">240개국 · <strong style="color:#4ade80;">EU 27국 경감세율 완성</strong> (FI/DK/CZ/RO/HU/BG/HR/SK/SI/LT/LV/EE/LU/CY/MT) · DE Ch.22 알코올 분리</div>
        </div>
      </div>

      <div class="phase-item">
        <div class="phase-time" style="color:#4ade80;">Area 3</div>
        <div class="phase-body">
          <div class="phase-label">De Minimis <span class="phase-badge badge-auto">IF문</span></div>
          <div class="phase-desc">240개국 · US: CN $0 / 비중국 $800 · EU 10국+Iceland</div>
        </div>
      </div>

      <div class="phase-item">
        <div class="phase-time" style="color:#4ade80;">Area 4</div>
        <div class="phase-body">
          <div class="phase-label">Special Tax <span class="phase-badge badge-auto">CHAPTER별 세율</span></div>
          <div class="phase-desc">
            <strong style="color:#f59e0b;">Brazil</strong> IPI 95-chapter · <strong style="color:#f59e0b;">India</strong> IGST 97-chapter + Cess (Ch.71 금 <strong style="color:#ef4444;">3%</strong>) · <strong style="color:#f59e0b;">Mexico</strong> IEPS spirits 53%/담배 160%<br>
            <strong style="color:#f59e0b;">China</strong> CBEC ¥5,000/¥26,000 + 환율 · CT 21항목 · 12개국
          </div>
        </div>
      </div>

      <div class="phase-item">
        <div class="phase-time" style="color:#4ade80;">Area 5</div>
        <div class="phase-body">
          <div class="phase-label">Customs Fees <span class="phase-badge badge-auto">고정값+수식</span></div>
          <div class="phase-desc">US MPF $32.71~$634.04 (0.3464%) 전체 origin · HMF 0.125% ocean-only · 240개국</div>
        </div>
      </div>

      <div class="phase-item">
        <div class="phase-time" style="color:#4ade80;">Area 6</div>
        <div class="phase-body">
          <div class="phase-label">AD/CVD <span class="phase-badge badge-auto">DB 매칭</span></div>
          <div class="phase-desc">119,706건 · HS6→HS4→HS2 3단계 fallback · fuzzy 0.85 통일</div>
        </div>
      </div>

      <div class="phase-item">
        <div class="phase-time" style="color:#4ade80;">Area 7</div>
        <div class="phase-body">
          <div class="phase-label">Rules of Origin <span class="phase-badge badge-auto">FTA 매칭</span></div>
          <div class="phase-desc">63 FTA · EU-UK TCA 추가 · EU-Mercosur inactive · FTA별 AND/OR 조합</div>
        </div>
      </div>

      <div class="phase-item">
        <div class="phase-time" style="color:#4ade80;">Area 8</div>
        <div class="phase-body">
          <div class="phase-label">Currency <span class="phase-badge badge-auto">API + Fallback</span></div>
          <div class="phase-desc">ECB 실시간 · Fallback 2026-03 · unknown → null</div>
        </div>
      </div>

      <div class="phase-item">
        <div class="phase-time" style="color:#4ade80;">Area 9</div>
        <div class="phase-body">
          <div class="phase-label">Insurance/Shipping <span class="phase-badge badge-auto">수식</span></div>
          <div class="phase-desc">5개 지역: AMERICAS / EU(GB 제외) / UK / ASIA(AU/NZ 제외) / OCEANIA</div>
        </div>
      </div>

      <div class="phase-item">
        <div class="phase-time" style="color:#4ade80;">Area 10</div>
        <div class="phase-body">
          <div class="phase-label">Export Controls <span class="phase-badge badge-auto">매트릭스</span></div>
          <div class="phase-desc">ECCN 30+ chapters · deterministic license · Math.random 제거 ✅</div>
        </div>
      </div>

      <div class="phase-item">
        <div class="phase-time" style="color:#4ade80;">Area 11</div>
        <div class="phase-body">
          <div class="phase-label">Sanctions <span class="phase-badge badge-auto">퍼지 매칭</span></div>
          <div class="phase-desc">21,301건 · SQL injection escape ✅ · Belarus 추가 · Levenshtein+Soundex</div>
        </div>
      </div>

    </div>

    <div style="padding: 10px 16px 16px; font-size: 10px; color: #4b5578; line-height: 1.6;">
      <strong style="color:#4ade80;">원칙:</strong> 정부/국제기구 시스템 = 구조화 = 100% 코드화 가능 = AI 불필요<br>
      <strong style="color:#4ade80;">검증:</strong> npm run build ✅ (5회) · Duty Rate 55/55 PASS 100% · 46/46 이슈 수정<br>
      <strong style="color:#4ade80;">자동화:</strong> 데이터 관리 12항목 (data-registry · source-verifier · error-handler AI진단 · Cron daily 02:00)
    </div>
  </div>
</div>

```

### 12. 푸터 버전

**파일 내 검색**: `POTAL AI Agent Organization v4`
**변경**: `POTAL AI Agent Organization v5`

---

## 저장

수정 완료 후 `/Users/maegbug/potal/POTAL_AI_Agent_Org_v5.html`로 저장.
기존 v4 파일은 삭제하지 않음.

## 엑셀 로깅

`POTAL_Claude_Code_Work_Log.xlsx`에 이 작업도 기록 (시트명: 현재 YYMMDDHHMM).

## 완료 조건

- [ ] POTAL_AI_Agent_Org_v5.html 파일 생성
- [ ] 12개 수정 사항 전부 적용
- [ ] 12 TLC 시스템화 현황 섹션 삽입 (12개 Area 전부 표시)
- [ ] 브라우저에서 열어서 렌더링 확인 (깨지는 곳 없는지)
