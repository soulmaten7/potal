# 다음 세션 시작 가이드
> 마지막 업데이트: 2026-04-08 KST (CW22-S5 — 데모 영상 완성, 콘텐츠 플랫폼 전환, Notion 가이드 6개 생성/업데이트)

---

## 현재 상태 요약

### 핵심 수치 (2026-04-08 기준)
- **외부 사용자**: 0명, **MRR**: $0 — **마케팅/고객 확보가 최우선**
- **147/147 기능 구현** (100%, WON'T 2개 제외 = 140 Active + 5 보완 + 2 WON'T)
- **프론트엔드 도구 페이지**: ~79 신규 (Tools 34 + Dashboard 18 + Developer 5 + Learn/Cert/Integration/Features 개선)
- **사이트 총 페이지**: ~503페이지 (Vercel 빌드 기준)
- **전략**: Exit(인수) 확정 — Forever Free + 데이터 수집 → 인수
- **요금제**: Forever Free (140개 전부 무료) + Enterprise Contact Us
- **v3 파이프라인**: ✅ 21/21 Section 100%, codified-rules 595개
- **API 엔드포인트**: ~160개+, **Vercel Cron**: 24개
- **i18n**: 329키 × 7언어 (en/ko/ja/zh/es/de/fr) = 2,303 번역
- **Auto-Import**: 6/12 소스 자동화 (SDN, FR, TARIC, Trade Remedy, USITC, UK)
- **Data Ticker**: Supabase 실시간 + JSON fallback 자동 갱신 + 2줄 구조
- **인프라 비용**: 고정 ~$114/월, AI 호출 $0

---

## 가장 최근 세션: CW22-S5 (2026-04-08)

### 핵심 변경 — 데모 영상 완성 + 콘텐츠 플랫폼 전환 + Notion 가이드 대량 업데이트

**데모 영상:**
- STEP 4 CapCut 편집 완료 → `Total Landed Cost Calculator — 140 Features, Free Forever | POTAL Demo.mov` (33.7MB)
- STEP 5 최종 파일 정리 완료 — 파일은 STEP 1-4 폴더에 유지, STEP 5는 체크리스트 전용

**콘텐츠 플랫폼 전환:**
- content-posting 스킬: DEV.to/Medium → X/Instagram/Threads 전환 (일일 자동 콘텐츠)
- 브랜드 채널: 디스콰이어트 + YouTube (2개로 축소)

**Notion 가이드 신규 3개:**
- 📺 YouTube 채널 세팅 가이드 — 채널명 POTAL/@potalapp, 5개 플레이리스트, 22+5 영상 매핑
- 🚀 Product Hunt 런칭 전략 가이드 — 3-Phase 전략 (코멘트→런치→후속)
- 📝 Daily Content Posting 업데이트

**Notion 페이지 업데이트 3개:**
- 일일 루틴: DEV.to/Medium → X/Instagram/Threads 전환
- Content Automation Guide: 플랫폼 구조/워크플로우/성과 추적 전면 개편
- POTAL Notion 사용 설명서: 플랫폼 정보/영상 흐름/FAQ 업데이트
- POTAL Command Center 메인: 수치 업데이트, Quick Links 재구성

### ⚠️ 이미 해결된 사항 (새 세션에서 다시 건드리지 말 것)
- **API 에러 핸들링**: 전부 완료. 추가 작업 불필요
- **`/tools→/features` 통합**: 전부 완료. 42개 301 리다이렉트 + FeatureToolWidget 16개 slug
- **데모 영상 STEP 1~5**: 전부 완료. 추가 촬영/편집 불필요

### 다음 세션에서 할 일
- **YouTube 나머지 영상 업로드** — 10/27개 완료 (일일 제한 도달), 나머지 17개 업로드 계속 (채널: youtube.com/@POTAL-Official)
- **Product Hunt 코멘트 활동 시작** — Notion 가이드 Phase 1
- **일일 콘텐츠 포스팅 시작** — content-posting 스킬 사용, LinkedIn/X/Instagram/Threads
- **Vercel Support Case #01083440** 확인 — GitHub-Vercel 자동 배포 복구 여부

### ⚠️ 미해결 사항
- **GitHub 계정 flagged → 자동 배포 장애** — GitHub 계정이 flagged 상태로 확인됨. GitHub Support Ticket #4248922 답변 완료, 복구 대기 중. Vercel Case #01083440도 이 원인. 그동안 `vercel --prod` CLI로 배포
  - **복구 확인 방법**: GitHub 프로필 접속 시 "flagged" 배너 사라졌는지 확인 → git push → Vercel 대시보드에서 자동 배포 트리거 확인
  - **복구 시 해야 할 일**: ① CLAUDE.md 절대규칙 #11 삭제 ② 세션 종료 체크리스트에서 "vercel --prod" 삭제 ③ 이 미해결 사항에서 제거 ④ CHANGELOG.md에 기록
- ~~데모 영상~~ — STEP 1~5 전부 완료 (2026-04-08)
- ~~API 에러 핸들링~~ — 전부 완료, /tools→/features 통합 완료
- ~~Dashboard seller profile~~ — 해결됨

### 이전 세션: CW22-S2 (2026-04-05~06)
- 커밋 10개: Confidence 통합 + FTA 표시 + HS10 10자리 + Vercel 지원케이스
- 상세: CHANGELOG.md CW22-S2 섹션 참조

---

## 다음 할 일 (우선순위)

### P0: GitHub 계정 복구 확인 → Vercel 연동 테스트
- GitHub 계정 flagged 복구 확인 → git push → Vercel 자동 배포 트리거 확인
- 복구 시: CLAUDE.md 규칙11 삭제, 세션 체크리스트 정리, CHANGELOG 기록

### P1: 마케팅 — YouTube + Product Hunt + 일일 콘텐츠 (최우선)
1. **YouTube 채널 세팅 + 업로드** — Notion 가이드 참조 (22개 롱폼 + 5개 쇼츠)
2. **Product Hunt 런칭** — Phase 1 코멘트 → Phase 2 런치 페이지 (Notion 가이드 참조)
3. **일일 콘텐츠 포스팅** — LinkedIn/X/Instagram/Threads (content-posting 스킬)
4. **LinkedIn 포스트** — 은태님 스토리 + 경쟁사 비교 차트
5. **Hacker News "Show HN"** — 카르마 필요
6. **Reddit** — r/ecommerce, r/shopify, r/entrepreneur
7. **커뮤니티 답변 활동** — Gemini 5개 언어권 프롬프트 준비 완료

### P3: 마켓플레이스 심사 확인 (외부 대기 — 2026-04-06 기준 전부 미승인)
1. **Shopify**: 3/10 제출, 27일+ 경과, 아직 미승인
2. **WooCommerce**: WordPress.org 심사 대기 (제출 2026-03-30)
3. **BigCommerce**: partners@bigcommerce.com 답장 대기 (발송 2026-03-30)
4. **Adobe Commerce**: W-8BEN 검토 대기 (제출 2026-03-30)

### P4: 기능 보완
- **Tool 페이지 i18n** — 새로 만든 ~79 페이지 다국어 지원
- **20개 Feature Guide 템플릿** — 121/140 완성
- **Auto-Import 나머지 6/12**
- **Layer 3 설계** (Enterprise Custom)

### P5: LLM 플랫폼 (외부 조건 대기)
- Microsoft Copilot: 365 Business 계정 필요
- Meta AI: 지역 제한
- xAI Grok: 앱 스토어 없음

---

## 자동화 파이프라인 현황

### ✅ 자동화 완료
| 파이프라인 | 구조 | 비고 |
|-----------|------|------|
| 1줄 티커 (데이터 업데이트 날짜) | Supabase 실시간 → JSON fallback 자동 갱신 | 배포마다 prebuild |
| 2줄 티커 (출처 발행일) | 모니터 감지 → Supabase `source_publications` → prebuild JSON | 감지 시 자동 |
| Auto-Import 6/12 | OFAC SDN, Federal Register, TARIC RSS, Trade Remedy, USITC, UK Trade Tariff | 감지→DB |
| Kill switch | `DISABLE_AUTO_IMPORT=true` 글로벌, `DISABLE_AUTO_IMPORT_OFAC_SDN=true` 소스별 | env var |

### ⏳ 수동 (향후 자동화 대상)
| 파이프라인 | 이유 |
|-----------|------|
| Auto-Import 나머지 6/12 | 웹 스크래핑/커스텀 파서 개발 필요 |
| i18n 새 텍스트 | 새 페이지 추가 시 수동 번역 추가 |
| Tool 페이지 i18n | ~79 새 페이지 다국어 미지원 |

---

## 파이프라인 건강도 지표 (CW22-S3 기준)

| 지표 | 값 | 상태 |
|------|-----|------|
| Section coverage | 21/21 | ✅ 100% |
| codified-rules | 595 | ✅ |
| 기능 구현율 | 147/147 (140 Active) | ✅ 100% |
| 프론트엔드 도구 UI | ~79 신규 페이지 | ✅ |
| 사이트 총 페이지 | ~503 | ✅ |
| i18n | 329키 × 7언어 | ✅ |
| Auto-Import | 6/12 소스 | ⏳ 50% |
| Data Ticker | Supabase 실시간 + 2줄 | ✅ |
| npm SDK | potal-sdk@1.1.0 | ✅ |
| PyPI SDK | potal@1.1.0 | ✅ |
| MCP Server | potal-mcp-server@1.4.2 | ✅ |
| Shopify | 심사 중 (27일+) | ⏳ |
| WooCommerce | 심사 중 (7일+) | ⏳ |
| regression test | 22/22 PASS | ✅ |

---

## 참조 파일 경로

| 파일 | 용도 |
|------|------|
| `CLAUDE.md` | Claude Code 지침 (절대 규칙, 문서 업데이트 규칙) |
| `session-context.md` | 프로젝트 전체 맥락 + TODO + 히스토리 |
| `docs/CHANGELOG.md` | 코드 변경 기록 |
| `docs/CREDENTIALS.md` | API 키, Supabase 연결 |
| `.cursorrules` | 코딩 표준, 파일 매핑 |
| `docs/ORCHESTRATOR_RULES.md` | Chief Orchestrator 역할/규칙 |
| `docs/DIVISION_STATUS.md` | 16개 Division 상세 |

## 세션 시작 시 읽어야 할 파일 (순서)
1. `CLAUDE.md` — 규칙
2. `session-context.md` — 맥락 + TODO
3. 이 파일 (`docs/NEXT_SESSION_START.md`) — 최신 상태

---
## [Auto-saved] Compaction at 2026-04-06 15:04 KST
컨텍스트 압축 발생. 이전 대화가 요약됨.
압축 전 마지막 작업 내용은 session-context.md 및 엑셀 로그 참조.
