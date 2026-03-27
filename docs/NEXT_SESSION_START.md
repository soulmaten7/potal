# 다음 세션 시작 가이드
> 마지막 업데이트: 2026-03-27 00:30 KST (Escalation Flow 구현 + 콜드이메일 결과 + Product Hunt 리런치 예약)

---

## 현재 상태 요약

### 핵심 수치 (2026-03-25 기준)
- **외부 사용자**: 0명, **MRR**: $0 — **고객 확보가 최우선**
- **142/147 기능 구현** (96.6%), **107개 감사 106/107 완성**, **56개 정밀검증 156/156 PASS**
- **API 엔드포인트**: ~155개+, **Vercel Cron**: 24개
- **Shopify App**: ⏳ 심사 중 (2026-03-10 제출, 16일 경과 — 기다리는 수밖에 없음)
- **Product Hunt**: ✅ B2B 리런치 예약 완료 (Scheduled, ~24시간 후 런칭)
- **AI Agent Org v6.1**: 59 Agents (16 Leaders + 43 Members), Opus 3 + Sonnet 56
- **Telegram Bots**: POTAL Alert (Chief 양방향) + POTAL Secretary (D16 양방향) — AI 업그레이드 완료 (크레딧 충전 보류)
- **Escalation Flow**: ✅ 구현 + 배포 완료 (커밋 a63e713). escalation.ts + 4개 Cron 수정. Cron→Chief 자체 해결→텔레그램 보고
- **콜드이메일 1차 발송**: 완료. 핫 리드: Calcurates CEO(콜 미팅→이메일 전환 답장 완료), Easyship(전문팀 검토 중). 배달 실패 7건

### ✅ 기술 완성 상태
- **Layer 1** (절대값 ✅): 9-field → HS 10자리 + 세율, AI 0회, $0. 7개국 벤치마크 1,183건 100%
- **Layer 2** (GRI Pipeline ✅): gri-classifier/ 25개 파일, 프로덕션 배포 완료, 592 codified rules
- **Layer 3**: 미시작 (Enterprise Custom, 고객 확보 후 진행)
- **12 TLC 시스템화**: ✅ 완성, Duty Rate 55/55 PASS
- **Sprint 1 보안 6기능**: ✅ 100% (95 unit tests ALL PASS)
- **데이터**: MIN ~105M행, AGR ~129M행, gov_tariff_schedules 131,794행, 제재 21,301건 — **전부 완료**

### ⏳ 진행 중
- **P2 기능 강화**: 9/16 완료, 7개 남음 + FIX 17개 (POTAL_Cowork_Session_Log.xlsx 실행상태 시트 참조)
- **마케팅**: LinkedIn 1포스트, Reddit 댓글 6개, Instagram 프로필만 — **지속 필요**

---

## 다음 할 일 (우선순위)

### P-1: 즉시 해결 (세션 시작 시)
0. ~~**Escalation Flow 구현**~~ — ✅ 완료 (2026-03-26, 커밋 a63e713)
1. **ANTHROPIC_API_KEY 크레딧 충전** — 보류 중. 은태님 결정으로 당장 불필요

### P0: 고객 확보 (지금 당장)
1. **Calcurates CEO 후속 대응** — Nikolay 답장 대기 중 (이메일/채팅 미팅 제안 발송 완료)
2. **Easyship 전문팀 후속** — 2~3일 뒤 답변 없으면 follow-up 발송
3. **콜드이메일 배달 실패 7곳 주소 업데이트 + 재발송** — Michael Kors, Flow.io, Extensiv, Linnworks, Floship, Samarkand, Eshopbox
4. **콜드이메일 2차 발송** — 타겟 15개 기업 중 미발송 기업 대상
5. **Product Hunt 런칭 당일 대응** — Launch Day dashboard 모니터링, 댓글 응답, SNS 공유
6. **파트너십 첫 접촉** — A그룹 (Royal Mail, Australia Post, Canada Post)

### P1: 마케팅 지속 (이번 주)
5. **LinkedIn 주 2~3회 포스팅** — 첫 포스트 완료, 지속 필요
6. **Reddit 카르마 빌딩** — 하루 3~5댓글 (POTAL_User_Acquisition_Strategy.xlsx 주간 체크리스트)
7. **Facebook Groups 게시** — Facebook_Group_Posts.md 내용 활용
8. **YouTube 데모 영상** — "30초 관세 계산" 화면 녹화

### P2: 기능 보완 (이번 달)
9. **P2 남은 7개 + FIX 17개 기능** — Sprint Priority List 참조
10. **비로그인 체험 UI** — 가입 없이 바로 계산 체험 (전환율 핵심)

---

## HS Code 분류 구조 (확정)

```
Layer 1: 9-field 완벽 입력 → HS Code 100% (코드+DB, AI 0회, $0)
         → 절대 수정 금지. 추가만 가능.
Layer 2: GRI Pipeline (gri-classifier/) → 불완전 입력을 GRI 1~6 순차 적용으로 분류
         → step0-input → step1-cache → step2-section → step2-chapter → step3-heading → step4-subheading
         → 592 codified rules, AI 0회, 프로덕션 배포 완료
Layer 3: Enterprise Custom (미시작) → 고객별 맞춤 변환
```

> v1~v7 LLM 실험 히스토리는 `docs/sessions/COWORK_SESSION_HISTORY.md`에 보존. GRI Pipeline이 전면 대체.

---

## 읽어야 할 파일
1. `CLAUDE.md` — 핵심 규칙만 (58줄, 다이어트 완료)
2. `session-context.md` — 세션 히스토리
3. `.cursorrules` — 코딩 표준 + Layer 구조
4. **참조 파일 (필요 시)**:
   - `docs/PROJECT_STATUS.md` — 핵심 수치, 기술스택, 전략, 요금제, 테이블 현황
   - `docs/CREDENTIALS.md` — 인증정보, Supabase 연결 방법
   - `docs/DIVISION_STATUS.md` — 16개 Division 상세 (D16 Secretary 추가), Layer 1/2/3, 운영 사이클
5. `POTAL_Claude_Code_Work_Log.xlsx` — 작업 로그
6. `POTAL_Sprint_Priority_List.xlsx` — 스프린트 기능 우선순위
7. `POTAL_User_Acquisition_Strategy.xlsx` — 고객 확보 실행 계획 + KPI
8. `POTAL_AI_Agent_Org_Log.xlsx` — AI Agent Org 버전 변경 이력
9. `POTAL_Excel_Master_Registry.xlsx` — 프로젝트 전체 엑셀 파일 카탈로그

## 벤치마크 오류 시
- 반드시 `POTAL_Ablation_V2.xlsx` 대조 (CLAUDE.md 절대 규칙 12번)
- Section 떨어지면 → material 문제
- Chapter 떨어지면 → material 세부/processing 문제
- Heading 떨어지면 → KEYWORD_TO_HEADINGS 사전 부족
- material은 21 Section 기준 79그룹 안의 값만 유효
