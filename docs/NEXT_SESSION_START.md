# 다음 세션 시작 가이드
> 마지막 업데이트: 2026-04-05 23:30 KST (CW22-S2 — Confidence 100% 수정 + Vercel GitHub 연동 지원케이스 + vercel --prod 규칙)

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

## 가장 최근 세션: CW22-S2 (2026-04-05)

### 커밋 4개 (전부 push + vercel --prod 완료)
| # | 커밋 | 내용 |
|---|------|------|
| 1 | `666dbe6` | Confidence 100% — confidence-calibration.ts + step3/step4 캡 제거 |
| 2 | `8c4ddf8` | 추가 캡 제거 — hs10-resolver, GlobalCostEngine, explainability, confidence-score |
| 3 | `074b2cb` | 잔여 캡 제거 — hs10-resolver 0.85/0.8/0.95 → 1.0 |
| 4 | `b645a58` | 재배포 트리거 |

### CW22-S2 핵심 변경
- **Confidence 92%→100%**: 10개 필드 완전 입력 시 100% 표시되도록 7개 파일의 하드코딩 캡 모두 제거
- **Supabase 캐시 클리어**: `hs_classification_cache` 166행 삭제
- **CLAUDE.md 규칙 #11 추가**: `git push 후 vercel --prod 필수`
- **Vercel Support Case #01083440**: GitHub App 404 → 백엔드 리셋 요청 (Open, Severity 2)

### ⚠️ 미해결 사항
- **GitHub-Vercel 자동 배포 끊김** — Vercel 서포트 답변 대기 중 (Case #01083440). 그동안 `vercel --prod` CLI로 배포
  - **복구 확인 방법**: git push 후 Vercel 대시보드에서 자동 배포가 트리거되는지 확인
  - **복구 시 해야 할 일**: ① CLAUDE.md 절대규칙 #11에서 "(임시)" 및 복구 안내 문구 삭제하고 규칙 자체를 삭제 ② 세션 종료 체크리스트에서 "vercel --prod 배포 완료" 항목 삭제 ③ 이 미해결 사항 섹션에서 해당 항목 삭제 ④ CHANGELOG.md에 "GitHub-Vercel 자동 배포 복구" 기록
- **데모 영상 재촬영 필요** — 03_demo-filled.png, 04_result.png, rec_01 (Confidence 100% 반영)

### 이전 세션: CW22-S (2026-04-05)
- 커밋 9개: Data Source Ticker + i18n 329키×7언어 + Auto-Import Pipeline + Publication Ticker
- 상세: CHANGELOG.md CW22-S 섹션 참조

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
