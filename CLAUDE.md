# CLAUDE.md — POTAL 프로젝트 Claude Code 지침
# 마지막 업데이트: 2026-03-31 12:50 KST (CW22-H: content/ 폴더 + Demo Scripts 엑셀, Forever Free cleanup)

## 터미널 구조 (고정)
| 터미널 | 모델 | 용도 | 실행 명령어 |
|--------|------|------|-----------|
| 터미널1 | Opus | Cowork 대화 → 명령어 바로 실행. 메인 작업용 | `cd ~/portal && claude --dangerously-skip-permissions` |
| 터미널2 | Sonnet | 보조 작업, 병렬 실행 | `cd ~/portal && claude --dangerously-skip-permissions --model sonnet` |
| 터미널3 | Opus | 오래 걸리는 디테일 작업 전용 | `cd ~/portal && claude --dangerously-skip-permissions` |
| 터미널4 | — | Mac 터미널 (git push, 시스템 명령어) | 일반 터미널 |

---

## 🚨 필수 지침 (모든 작업보다 우선)
1. **로그 기록 필수** — `POTAL_Claude_Code_Work_Log.xlsx`에 새 시트(YYMMDDHHMM) 추가
2. **Cowork 로그** — `POTAL_Cowork_Session_Log.xlsx`에 Cowork 대화 타임라인 기록
3. **Division 엑셀** — 해당 Division 작업 시 해당 엑셀 업데이트 (D9/D10/D12/D14/D15)
4. **로그 없으면 미완료** — 빌드 성공해도, 테스트 통과해도, 로그 없으면 미완료

> 로깅 상세 규칙: `docs/LOGGING_RULES.md` 참조

---

## 절대 규칙
1. **B2C 코드 수정 금지** — lib/search/, lib/agent/, components/search/ 보존만
2. **npm run build 확인 후 push** — 빌드 깨진 코드 push 금지
3. **session-context.md에 없는 숫자 만들기 금지** — 근거 없는 수치 사용 금지
4. **console.log 금지** — 프로덕션 코드에 남기지 않기
5. **한 번에 하나의 작업만** — 멀티태스킹 금지
6. **Git push는 Mac 터미널에서** — VM/EC2에서 push 불가
7. **터미널 작업은 한 번에 하나만** — 동시에 2개 이상 다운로드/임포트 금지
8. **문서 업데이트 시 날짜+시간(KST) 기록 필수**
9. **유료 플랜 재도입 금지** — Forever Free 구조 유지 (CW22 CEO 확정). Enterprise Contact Us만 허용
10. **HS Code 벤치마크 오류 시 `POTAL_Ablation_V2.xlsx` 대조 필수**

---

## 📋 문서 업데이트 규칙 (작업 완료 시 반드시 실행)

### 항상 업데이트 (매 작업 완료 시)
| 파일 | 업데이트 내용 | 비고 |
|------|-------------|------|
| `CLAUDE.md` | 마지막 업데이트 날짜 + 핵심 변경사항 1줄 | 헤더의 날짜/내용만 수정 |
| `session-context.md` | TODO 진행상황, 완료항목 체크, 새 TODO 추가 | 수치 변경 시 수치도 업데이트 |
| `CHANGELOG.md` | 날짜 + 변경사항 (기능/수정/삭제) 기록 | 가장 위에 추가 |
| `docs/NEXT_SESSION_START.md` | 다음 세션 우선순위, 현재 상태 요약 업데이트 | 수치/상태 최신화 |

### 해당 시 업데이트 (변경이 있을 때만)
| 파일 | 트리거 조건 | 업데이트 내용 |
|------|-----------|-------------|
| `.cursorrules` | 파일 구조 변경, 새 컴포넌트 추가, 코딩 규칙 변경 | 파일 매핑, 폴더 구조, 코딩 표준 |
| `docs/PROJECT_STATUS.md` | 수치 변경 (기능 수, API 수, 사용자 수 등) | 핵심 수치, 기술 스택 현황 |
| `docs/CREDENTIALS.md` | API 키 추가/변경, Supabase 설정 변경 | 인증정보, 연결 방법 |
| `docs/DIVISION_STATUS.md` | Division 상태 변경, Layer 변경, Agent 추가/삭제 | Division 상세, 운영 사이클 |

### Division 엑셀 (해당 Division 작업 시)
| 엑셀 파일 | 트리거 조건 |
|-----------|-----------|
| `POTAL_D9_Customer_Acquisition.xlsx` | 콜드이메일, 고객 확보, 리드 관리 |
| `POTAL_D10_Revenue_Billing.xlsx` | 결제, 요금제, 빌링 관련 |
| `POTAL_D12_Marketing_Partnerships.xlsx` | SNS, 마케팅, 파트너십, Product Hunt |
| `POTAL_D14_Finance_Tracker.xlsx` | 비용, 수익, 재무 관련 |
| `POTAL_D15_Intelligence_Market.xlsx` | 경쟁사 분석, 시장 조사 |

### 로그 엑셀 (매번 필수)
| 엑셀 파일 | 업데이트 내용 |
|-----------|-------------|
| `POTAL_Claude_Code_Work_Log.xlsx` | 새 시트(YYMMDDHHMM) + 작업 타임라인 전체 |
| `POTAL_Cowork_Session_Log.xlsx` | Cowork 세션 대화 내용 요약 |

---

## 참조 파일 (필요 시 읽기)
| 파일 | 내용 | 언제 읽나 |
|------|------|----------|
| `session-context.md` | 프로젝트 전체 맥락, 히스토리, TODO | 매 세션 시작 시 |
| `.cursorrules` | 코딩 표준, 파일 매핑, 프로덕션 환경 | 코드 작업 시 |
| `docs/PROJECT_STATUS.md` | 핵심 수치, 기술 스택, 전략 | 수치 확인 필요 시 |
| `docs/CREDENTIALS.md` | 인증정보, Supabase 연결 방법 | API/DB 작업 시 |
| `docs/DIVISION_STATUS.md` | 15개 Division 상세, Layer 1/2/3 | Division 작업 시 |
| `docs/sessions/COWORK_SESSION_HISTORY.md` | CW13~CW22 세션별 성과 | 과거 작업 참조 시 |
| `docs/PIVOT_PLAN_CW22.md` | Exit 전략 피벗 계획 (32개 항목) | 피벗 관련 작업 시 |
| `docs/COLD_EMAIL_RULES.md` | 콜드이메일 작성/발송 규칙 | 콜드이메일 작업 시 |
| `docs/LOGGING_RULES.md` | 엑셀 로깅 상세 규칙 (시트/열/상태) | 로그 기록 시 |
| `docs/ORCHESTRATOR_RULES.md` | Chief Orchestrator 역할/규칙 | 역할 확인 시 |
| `app/features/features-guides.ts` | 140개 기능 가이드 데이터 | Features 작업 시 |
| `app/community/` | 커뮤니티 포럼 | Community 작업 시 |

---

## 세션 종료 체크리스트
- [ ] git push 완료
- [ ] **항상 업데이트 4개**: CLAUDE.md, session-context.md, CHANGELOG.md, NEXT_SESSION_START.md
- [ ] **해당 시 업데이트**: .cursorrules, PROJECT_STATUS.md, CREDENTIALS.md, DIVISION_STATUS.md
- [ ] **엑셀 로그 2개**: Work_Log + Cowork_Session_Log
- [ ] **Division 엑셀**: 해당 Division 엑셀 업데이트
- [ ] 다음 세션 우선순위 NEXT_SESSION_START.md에 기록
- [ ] 교차검증 — 문서 간 숫자 일치 확인

---

## 은태님 스타일
- 코딩 초보자 — 기술 설명 간결, 작업은 직접 해줘야 함
- 정확성 최우선, 과장 표현 싫어함
- 한국어 소통, 코드/기술 용어는 영어 그대로
