# 다음 세션 시작 가이드
> 마지막 업데이트: 2026-04-05 19:30 KST (CW22-S — Data Ticker + i18n + Auto-Import + Publication Ticker 완료)

---

## 현재 상태 요약

### 핵심 수치 (2026-04-05 기준)
- **외부 사용자**: 0명, **MRR**: $0 — **마케팅/고객 확보가 최우선**
- **147/147 기능 구현** (100%, WON'T 2개 제외 = 140 Active + 5 보완 + 2 WON'T)
- **전략**: Exit(인수) 확정 — Forever Free + 데이터 수집 → 인수
- **요금제**: Forever Free (140개 전부 무료) + Enterprise Contact Us
- **v3 파이프라인**: ✅ 21/21 Section 100%, codified-rules 595개
- **API 엔드포인트**: ~160개+, **Vercel Cron**: 24개
- **i18n**: 329키 × 7언어 (en/ko/ja/zh/es/de/fr) = 2,303 번역
- **Auto-Import**: 6/12 소스 자동화 (SDN, FR, TARIC, Trade Remedy, USITC, UK)
- **Data Ticker**: Supabase 실시간 + JSON fallback 자동 갱신 + 2줄 구조 (업데이트 날짜 + 공식 발행일)
- **인프라 비용**: 고정 ~$114/월, AI 호출 $0

---

## 가장 최근 세션: CW22-S (2026-04-05)

### 커밋 9개 (전부 push 완료)
| # | 커밋 | 내용 |
|---|------|------|
| 1 | `3deaaff` | Live Ticker — Supabase 실시간 12개 소스 |
| 2 | `13b9bfa` | Ticker Fallback — `scripts/update-ticker-fallback.mjs` prebuild 자동 갱신 |
| 3 | `4ce755f` | Homepage i18n — 73키 × 7언어 |
| 4 | `e3507a1` | Source Publication Ticker — `data/source-publications.json` 2줄 구조 |
| 5 | `a3c6a69` | Auto-Import Pipeline — 4 모니터 DB 연결 (2/12→6/12) |
| 6 | `09d55e1` | Sitewide i18n — 256키 × 7언어 (Footer+Features+Pricing+Developers+Community+Help) |
| 7 | `48a16c7` | Publication Auto-Sync — 모니터 감지→Supabase→prebuild JSON |
| 8 | `5e06cd8` | Docs 1차 (CLAUDE.md, session-context.md) |
| 9 | `cbc2c82` | Docs 2차 (CHANGELOG.md CW22-S 섹션 + session-context CW22-S 완료 블록) |

### CW22-S에서 만든 핵심 파일
- `app/api/v1/data-freshness/route.ts` — 12개 소스 실시간 타임스탬프 API
- `scripts/update-ticker-fallback.mjs` — Vercel prebuild 스크립트
- `data/ticker-fallback.json` — Ticker fallback 데이터
- `data/source-publications.json` — 12개 소스 공식 발행일
- `app/lib/data-management/import-trigger.ts` — Auto-Import 유틸리티
- `app/lib/data-management/publication-updater.ts` — Publication 자동 갱신
- `app/i18n/translations/` — en/ko/ja/zh/es/de/fr 7개 언어 파일

### Supabase DB 변경
- `source_publications` 테이블 신규 생성 (12행 초기 데이터)

### Notion 업데이트 완료
- Session Log: CW22-S 기록 (커밋 9개)
- Task Board: 4개 카드 전부 Done
- 데모 영상 제작 가이드: 티커 데모 rec_20, rec_21 추가

---

## 다음 할 일 (우선순위)

### P0: 데모 영상 촬영 (진행 중)
- **메인 4개 완료**: rec_01~04 ✅
- **미촬영**: rec_05~12 (기능별), rec_13~16 (시나리오), rec_17~19 (비교), rec_20~21 (티커 데모)
- **참조**: Notion "🎬 데모 영상 제작 가이드"
- **도구**: Mac QuickTime 녹화 → CapCut 편집
- **유튜브 업로드는 보류** (CEO 결정)

### P1: 마케팅 (CEO 날짜 결정 시 즉시)
1. **Hacker News "Show HN" 포스트** — 카르마 필요 (신규 계정 제한)
2. **Reddit 포스트** — r/ecommerce, r/shopify, r/entrepreneur (카르마 필요)
3. **LinkedIn 포스트** — 은태님 스토리 + 경쟁사 비교 차트 (프로필 최적화 완료)
4. **커뮤니티 답변 활동** — Gemini 5개 언어권 프롬프트 준비 완료 (`content/social-media/community-prompts/`)

### P2: 마켓플레이스 심사 확인 (외부 대기 — 2026-04-05 기준 전부 미승인)
1. **Shopify**: 3/10 제출, 26일+ 경과, 아직 미승인
2. **WooCommerce**: WordPress.org 심사 대기 (제출 2026-03-30)
3. **BigCommerce**: partners@bigcommerce.com 답장 대기 (발송 2026-03-30)
4. **Adobe Commerce**: W-8BEN 검토 대기 (제출 2026-03-30) → 완료 후 Extension 업로드
5. F045~F048 Coming Soon → marketplace 승인 시 `active`로 변경

### P3: 기능 보완 (고객 확보 후)
- **20개 Feature Guide 템플릿** — 121/140 완성, 나머지 20개 대부분 마켓플레이스 미승인+비핵심
- **P2 남은 7개**: F054, F082, F083, F105, F138, F140, F147 (Enterprise급)
- **Auto-Import 나머지 6/12**: tariff-change, fta-change, classification-ruling, macmap-update, CA/AU/KR/JP (웹 스크래핑/커스텀 파서 필요)
- **Layer 3 설계** (Enterprise Custom)

### P4: LLM 플랫폼 (외부 조건 대기)
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

---

## 파이프라인 건강도 지표 (CW22-S 기준)

| 지표 | 값 | 상태 |
|------|-----|------|
| Section coverage | 21/21 | ✅ 100% |
| codified-rules | 595 | ✅ |
| 기능 구현율 | 147/147 (140 Active) | ✅ 100% |
| i18n | 329키 × 7언어 | ✅ |
| Auto-Import | 6/12 소스 | ⏳ 50% |
| Data Ticker | Supabase 실시간 + 2줄 | ✅ |
| npm SDK | potal-sdk@1.1.0 | ✅ |
| PyPI SDK | potal@1.1.0 | ✅ |
| MCP Server | potal-mcp-server@1.4.2 | ✅ |
| Shopify | 심사 중 (26일+) | ⏳ |
| WooCommerce | 심사 중 (6일+) | ⏳ |
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
