# 다음 세션 시작 가이드
> 마지막 업데이트: 2026-03-29 02:20 KST (CW21 — 140개 기능 전부 Active, Features 페이지 배포, 수익화 전략 논의)

---

## 현재 상태 요약

### 핵심 수치 (2026-03-29 기준)
- **외부 사용자**: 0명, **MRR**: $0 — **고객 확보가 최우선**
- **140/142 기능 구현** (100%, WON'T 2개 제외), Features 페이지 배포 완료
- **v3 파이프라인**: ✅ **21/21 Section 100%**, codified-rules **595개**, regression **22/22 PASS**
- **API 엔드포인트**: ~155개+, **Vercel Cron**: 24개
- **MCP Server**: v1.4.0 (9-field, material required) — 테스트 완료
- **Features 페이지**: potal.app/features — 140개 Active, 경쟁사 비교 테이블
- **인프라 비용**: 고정 ~$114/월, 100만건 시 ~$140/월, AI fallback 거의 0
- **Shopify App**: ⏳ 심사 중

### ✅ CW21 완료 사항 (2026-03-29 01:00~02:20)
- MCP v1.4.0 9-field 검증 완료 (classify_product, calculate_landed_cost 등 10/10 정상)
- Dashboard category 버그 수정 확인 (Chrome MCP로 실제 UI 테스트)
- **142개 기능 코드 기반 정밀 감사**: IMPL 119, PARTIAL 10, STUB 8, NONE 3, WON'T 2
- **21개 미완성 기능 전부 완성** (터미널3): 빌드 성공, regression 0
- **Features 페이지 신규 구현** (터미널1): 140개 Active, 12개 카테고리, 경쟁사 비교
- **홈페이지 전체 점검**: /, /features, /pricing, /developers, /help, /blog, /dashboard 전부 정상
- 인프라 비용 분석: v3 파이프라인 AI 호출 0, 100만건도 ~$140/월
- AI fallback 구조 분석: v3→캐시→벡터→키워드(≥0.6)→AI. v3가 거의 다 처리, AI fallback 거의 안 일어남

### ⏳ 전략 논의 중 (CEO 결정 대기)
- **요금제 변경 검토**: 전체 무료(140개 기능) + Custom만 유료 → 크로스보더 광고 수익 모델
- **플랫폼 전환 검토**: API 도구 → 크로스보더 정보 허브 (관세 뉴스 + 셀러 커뮤니티 + 무료 도구)
- **"Why POTAL is Free" 페이지**: 스토리텔링 마케팅 (AI 스타트업이라 가능한 무료)
- AI fallback 모델 변경: 보류 (v3가 거의 다 처리하므로 불필요)

---

## 다음 할 일 (우선순위)

### P0: CEO 전략 결정 → 즉시 실행
1. **요금제 구조 확정** — Free(전체기능) + Custom만? 볼륨 한도는?
2. **Pricing 페이지 리디자인** — 확정된 요금제 반영
3. **"Why POTAL is Free" 페이지** — 스토리텔링 마케팅 콘텐츠
4. **관세 뉴스 허브** — 국가별 관세 변동/규제 업데이트 자동 피드 (API 데이터 → 프론트엔드)
5. **셀러 커뮤니티 게시판** — Supabase 테이블 + 게시판 UI

### P1: 고객 확보 (지금 당장)
6. **Gmail 드래프트 251개 발송** — 은태님이 확인 후 발송
7. **LinkedIn/Reddit/Facebook 마케팅** — Features 페이지 활용
8. **Product Hunt 재런치** — "140 Features, All Free" 앵글

### P2: 기능 보완
9. **비로그인 체험 UI** — 가입 없이 바로 계산 체험
10. **벤치마크 352K 정답 데이터 자동화**

---

## 파이프라인 건강도 지표 (CW21 기준)

| 지표 | 값 | 상태 |
|------|-----|------|
| Section coverage | 21/21 | ✅ 100% |
| codified-rules | 595 | ✅ |
| 기능 구현율 | 140/142 | ✅ 100% (WON'T 2 제외) |
| Features 페이지 | 140 Active | ✅ |
| regression test | 22/22 PASS | ✅ 100% |
| MCP Server | v1.4.0 (9-field) | ✅ |
| AI 호출 | 0회 | ✅ |
| 인프라 비용 | ~$114/월 (고정) | ✅ |
| build | 성공 | ✅ |

---

## 읽어야 할 파일
1. `CLAUDE.md` — 핵심 규칙
2. `session-context.md` — 세션 히스토리
3. `.cursorrules` — 코딩 표준 + Layer 구조
4. **참조 파일 (필요 시)**:
   - `docs/PROJECT_STATUS.md` — 핵심 수치, 기술스택, 전략
   - `docs/CREDENTIALS.md` — 인증정보
   - `docs/DIVISION_STATUS.md` — Division 상세
