# 다음 세션 시작 가이드
> 마지막 업데이트: 2026-03-29 01:30 KST (CW21 — 미완성 21개 기능 전부 완성, 빌드 성공)

---

## 현재 상태 요약

### 핵심 수치 (2026-03-28 기준)
- **외부 사용자**: 0명, **MRR**: $0 — **고객 확보가 최우선**
- **147/147 기능 구현** (100%), **107개 감사 106/107 완성**, **56개 정밀검증 156/156 PASS**
- **v3 파이프라인**: ✅ **21/21 Section 100%**, codified-rules **595개**, regression **22/22 PASS**
- **API 엔드포인트**: ~155개+, **Vercel Cron**: 24개
- **Shopify App**: ⏳ 심사 중 (2026-03-10 제출, 18일 경과)
- **Product Hunt**: ✅ B2B 리런치 완료
- **AI Agent Org v6.1**: 59 Agents (16 Leaders + 43 Members)
- **콜드이메일 글로벌 캠페인**: ✅ Gmail 드래프트 251개 생성 완료

### ✅ 기술 완성 상태
- **Layer 1** (절대값 ✅): 9-field → HS 10자리 + 세율, AI 0회, $0. 7개국 벤치마크 1,183건 100%
- **Layer 2** (GRI Pipeline ✅): gri-classifier/ 25개 파일, **21/21 Section**, **595 codified rules**, 프로덕션 배포 완료
- **Layer 3**: 미시작 (Enterprise Custom, 고객 확보 후 진행)
- **12 TLC 시스템화**: ✅ 완성, Duty Rate 55/55 PASS
- **Sprint 1 보안 6기능**: ✅ 100% (95 unit tests ALL PASS)

### ✅ CW21 완료 사항 (2026-03-28)
- v3 파이프라인 Section coverage **10/21 → 21/21** (100%)
- 외장하드 /Volumes/soulmaten/POTAL/ 14개 파일 + 97 conflict patterns 전체 대조 완료
- 커밋 4개: eb00fae, 2b1e1ea, 0838827, 7fd0142
- 파이프라인 건강도: **100%** (Section 21/21, codified-rules 595, test 22/22 PASS)

---

## 다음 할 일 (우선순위)

### P0: 고객 확보 (지금 당장)
1. **Gmail 드래프트 251개 발송** — 은태님이 Gmail 드래프트함에서 확인 후 발송 (10~20개씩)
2. **Calcurates CEO 후속 대응** — Nikolay 답장 대기 중
3. **Easyship 전문팀 후속** — 답변 없으면 follow-up 발송
4. **KrispiTech 피처링 후속** — 추가 자료 요청 시 대응
5. **파트너십 첫 접촉** — A그룹 (Royal Mail, Australia Post, Canada Post)

### P1: 마케팅 지속 (이번 주)
6. **LinkedIn 주 2~3회 포스팅**
7. **Reddit 카르마 빌딩** — 하루 3~5댓글
8. **Facebook Groups 게시** — Facebook_Group_Posts.md 내용 활용
9. **YouTube 데모 영상** — "30초 관세 계산" 화면 녹화

### P2: 기능 보완 (이번 달)
10. **Dashboard category 필드 버그 수정** — DashboardContent.tsx Line 1112 근처, category 입력 미반영 이슈
11. **비로그인 체험 UI** — 가입 없이 바로 계산 체험 (전환율 핵심)
12. **벤치마크 352K 정답 데이터 자동화** — product_hs_mappings 기반 regression suite

### P-1: 보류
- **ANTHROPIC_API_KEY 크레딧 충전** — 은태님 결정으로 당장 불필요

---

## 파이프라인 건강도 지표 (CW21 기준)

| 지표 | 값 | 상태 |
|------|-----|------|
| Section coverage | 21/21 | ✅ 100% |
| codified-rules | 595 | ✅ |
| codified-headings | 1,233 | ✅ |
| codified-subheadings | 5,621 | ✅ |
| step2-2 switch cases | 21/21 | ✅ 100% |
| regression test | 22/22 PASS | ✅ 100% |
| field-validator | 7/7 PASS | ✅ 100% |
| 7개국 벤치마크 | 1,183건 100% | ✅ |
| AI 호출 | 0회 | ✅ |
| build | 성공 | ✅ |

---

## HS Code 분류 구조 (확정)

```
Layer 1: 9-field 완벽 입력 → HS Code 100% (코드+DB, AI 0회, $0)
         → 절대 수정 금지. 추가만 가능.
Layer 2: GRI Pipeline (gri-classifier/) → 불완전 입력을 GRI 1~6 순차 적용으로 분류
         → step0-input → step1-cache → step2-section → step2-chapter → step3-heading → step4-subheading
         → 595 codified rules, AI 0회, 프로덕션 배포 완료
Layer 3: Enterprise Custom (미시작) → 고객별 맞춤 변환
```

---

## 읽어야 할 파일
1. `CLAUDE.md` — 핵심 규칙만 (58줄, 다이어트 완료)
2. `session-context.md` — 세션 히스토리
3. `.cursorrules` — 코딩 표준 + Layer 구조
4. **참조 파일 (필요 시)**:
   - `docs/PROJECT_STATUS.md` — 핵심 수치, 기술스택, 전략, 요금제, 테이블 현황
   - `docs/CREDENTIALS.md` — 인증정보, Supabase 연결 방법
   - `docs/DIVISION_STATUS.md` — 16개 Division 상세, Layer 1/2/3, 운영 사이클

## 벤치마크 오류 시
- 반드시 `POTAL_Ablation_V2.xlsx` 대조 (CLAUDE.md 절대 규칙 10번)
- Section 떨어지면 → material 문제
- Chapter 떨어지면 → material 세부/processing 문제
- Heading 떨어지면 → KEYWORD_TO_HEADINGS 사전 부족
- material은 21 Section 기준 79그룹 안의 값만 유효
