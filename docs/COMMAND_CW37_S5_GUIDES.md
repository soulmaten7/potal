# COMMAND: CW37-S5 — Guides 페이지 신설

**작성일**: 2026-04-14 KST
**작업 라벨**: CW37-S5
**담당 터미널**: 터미널2 또는 터미널1
**예상 소요**: 3~4시간
**선행조건**: CW37-S4 Screening Endpoints 완료

**목적**: 정적 정보 페이지 4개 신설. API 무관, 그냥 정보 제공 (+ 외부 링크). 모든 페이지 상단 Disclaimer 필수.

---

## 4개 Guides 페이지

### 1. `/guides/customs-filing` — 각국 신고 가이드

#### 구조
```
/guides/customs-filing                    — 인덱스 페이지 (국가 선택)
/guides/customs-filing/KR                 — 한국 (Import / Export)
/guides/customs-filing/US                 — 미국
/guides/customs-filing/EU                 — EU 27개국 통합
/guides/customs-filing/GB                 — 영국
/guides/customs-filing/JP                 — 일본
/guides/customs-filing/CN                 — 중국
/guides/customs-filing/AU                 — 호주
/guides/customs-filing/CA                 — 캐나다
```

#### 각 페이지 구조
```
┌─ 🇰🇷 한국 수입/수출 신고 가이드 ──────────────┐
│                                               │
│ ⚠️ 참고용 정보입니다. POTAL 은 신고 대행을       │
│ 하지 않습니다. 실제 신고는 관세사 또는          │
│ 직접 UNI-PASS 통해 진행하세요.                 │
│                                               │
│ 📤 수출 (Export)                               │
│   공식 시스템: UNI-PASS (관세청)                │
│   링크: https://unipass.customs.go.kr         │
│   필요 서류:                                    │
│     • 수출신고서                                │
│     • 상업송장 (Commercial Invoice)             │
│     • 포장명세서 (Packing List)                 │
│     • B/L 또는 AWB                              │
│     • 원산지증명서 (FTA 적용 시)                │
│   절차:                                         │
│     1. UNI-PASS 로그인 (공인인증서)             │
│     2. 수출신고서 작성                          │
│     3. 수리 대기 (보통 당일)                    │
│     4. 화물 반출                                │
│                                               │
│ 📥 수입 (Import)                               │
│   ... (동일 패턴)                              │
│                                               │
│ 💡 팁                                           │
│   • 관세사 이용 권장 (수수료 건당 3~5만원)      │
│   • 첫 수출은 관세청 무료 컨설팅 이용 가능       │
│                                               │
│ 🔗 관련 링크                                    │
│   • UNI-PASS: https://unipass.customs.go.kr   │
│   • 관세청: https://www.customs.go.kr          │
│   • FTA PASS: https://www.customs.go.kr/ftaportalkor │
│                                               │
│ ── 마지막 업데이트: 2026-04-14 ──               │
└───────────────────────────────────────────────┘
```

#### 각 국가별 필요 정보
| 국가 | 공식 시스템 | 관련 링크 |
|------|----------|----------|
| KR | UNI-PASS | customs.go.kr / FTA PASS |
| US | ACE (Automated Commercial Environment) | cbp.gov |
| EU | NCTS / AES (회원국별) | ec.europa.eu/taxation |
| GB | CDS (Customs Declaration Service) | gov.uk/browse/business/imports-exports |
| JP | NACCS | customs.go.jp |
| CN | 中国电子口岸 (China E-Port) | singlewindow.cn |
| AU | ICS (Integrated Cargo System) | abf.gov.au |
| CA | CERS (Canadian Export Reporting System) | cbsa-asfc.gc.ca |

### 2. `/guides/incoterms-2020` — Incoterms 가이드

Incoterms 2020 의 11가지 규칙 설명:

| Incoterm | 의미 | 책임 분기 |
|---------|------|---------|
| EXW | Ex Works | 공장 출하 |
| FCA | Free Carrier | 운송인 인도 |
| CPT | Carriage Paid To | 운임 지급 |
| CIP | Carriage and Insurance Paid | 운임 + 보험 |
| DAP | Delivered at Place | 목적지 인도 |
| DPU | Delivered at Place Unloaded | 하역 포함 |
| DDP | Delivered Duty Paid | 관세 납부 |
| FAS | Free Alongside Ship | 선측 인도 |
| FOB | Free On Board | 본선 적재 |
| CFR | Cost and Freight | 운임 포함 |
| CIF | Cost, Insurance and Freight | 운임 + 보험 |

각 Incoterm 별 섹션:
- 누가 운송비 부담?
- 누가 보험 부담?
- 위험 이전 시점?
- 관세 부담?
- 추천 사용 상황

### 3. `/guides/section-301` — 미국 대중국 추가관세

내용:
- Section 301 배경 (2018 Trump 시작)
- List 1~4 (현재 거의 모든 중국산)
- 평균 추가관세율 (7.5% ~ 25%)
- 제외 품목 (Exclusions)
- 적용 HS 리스트 (몇 천개, 페이지네이션)
- USTR 공식 페이지 링크

### 4. `/guides/anti-dumping` — 반덤핑 관세

내용:
- 반덤핑 배경
- 현재 적용 중인 주요 케이스 (한국 철강, 중국 태양광 등)
- 적용 HS + 수출국 리스트
- 각 케이스 관세율 + 유효기간
- WTO 분쟁 사례 일부

---

## Phase 별 작업

### Phase 1: 공통 컴포넌트 (30분)
파일: `components/guides/DisclaimerBanner.tsx`
```tsx
<DisclaimerBanner>
  ⚠️ 참고용 정보입니다. POTAL 은 {service} 를 수행하지 않습니다.
  실제 {action} 는 {method} 를 통해 진행하세요.
</DisclaimerBanner>
```

파일: `components/guides/GuideLayout.tsx`
- 제목 + 상단 Disclaimer
- 본문 영역
- "마지막 업데이트: YYYY-MM-DD" 하단 표시
- 관련 링크 섹션

파일: `components/guides/UpdateDate.tsx`
- frontmatter 또는 파일에서 마지막 업데이트 날짜 자동 표시

### Phase 2: `/guides/customs-filing` 8개 국가 페이지 (1.5시간)
- 인덱스 페이지 (`app/guides/customs-filing/page.tsx`)
- 각 국가 페이지 (`app/guides/customs-filing/[country]/page.tsx`) — dynamic route
- 데이터: `data/customs-filing/{country}.json` 또는 MDX 파일
- 공식 시스템 정보 + 링크 + 필요 서류 + 절차
- Disclaimer 공통 적용

### Phase 3: `/guides/incoterms-2020` (45분)
- 파일: `app/guides/incoterms-2020/page.tsx`
- 11 Incoterms 테이블 + 각 섹션
- 시각적 다이어그램 (책임 이전 시점 chart)
- Disclaimer 상단

### Phase 4: `/guides/section-301` + `/guides/anti-dumping` (45분)
- 각각 페이지 작성
- DB 에 있는 데이터 (CW33 seed) 활용 가능 여부 확인
- 없으면 정적 텍스트 + 외부 링크로 시작

### Phase 5: 네비게이션 통합 (30분)
- CW37-S3 에서 만든 workspace sidebar 의 📚 Guides 섹션에 링크 추가
- Footer 에도 링크 추가
- 홈 페이지 하단에 "Learn more" 식 CTA

### Phase 6: SEO + 메타데이터 (15분)
각 페이지:
- `<title>` 태그 최적화
- Open Graph 메타데이터
- JSON-LD structured data (FAQ / HowTo schema)
- sitemap.xml 에 추가
- robots.txt 허용

### Phase 7: Regression + Commit
```
feat(cw37-s5): Guides pages — customs filing + incoterms + section-301 + anti-dumping

- /guides/customs-filing + 8 country pages (KR/US/EU/GB/JP/CN/AU/CA)
- /guides/incoterms-2020: 11 Incoterms explained
- /guides/section-301: US tariffs on China reference
- /guides/anti-dumping: active anti-dumping cases
- DisclaimerBanner common component
- Footer + Workspace sidebar links
- SEO: title + OG + JSON-LD
- All pages: "참고용 정보" disclaimer + last updated date
```

---

## 원칙

- **Disclaimer 필수**: 모든 페이지 상단
- **외부 공식 링크 명시**: 실제 작업은 외부 시스템에서
- **마지막 업데이트 날짜 표시**: 신뢰성
- **SEO 최적화**: 정보 검색 트래픽 유입
- **법적 안전**: "대행 X, 정보 제공" 명시

---

## 완료 기준

- [ ] `/guides/customs-filing` + 8개 국가 페이지
- [ ] `/guides/incoterms-2020` 페이지
- [ ] `/guides/section-301` 페이지
- [ ] `/guides/anti-dumping` 페이지
- [ ] DisclaimerBanner 공통 컴포넌트
- [ ] Workspace sidebar + Footer 링크
- [ ] SEO 메타데이터 (title / OG / JSON-LD)
- [ ] sitemap.xml 업데이트
- [ ] 모든 페이지 "마지막 업데이트" 날짜
- [ ] 빌드 성공
- [ ] Production 배포 + 검증
- [ ] Commit + push + 문서

CW37-S5 완료 = CW37 Phase 1-5 전부 완료.
Phase 6-7 (LLM-friendly Schema + OpenAPI Spec) 은 장기 backlog.
