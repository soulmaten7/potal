# CLAUDE.md — POTAL 프로젝트 Claude Code 지침 (핵심 규칙만)
# 마지막 업데이트: 2026-03-26 10:30 KST (다이어트 — 555줄→규칙만)

## 🚨 필수 지침 (모든 작업보다 우선)
1. `POTAL_Claude_Code_Work_Log.xlsx`에 새 시트(YYMMDDHHMM) 추가 — 모든 작업 타임라인 기록
2. `POTAL_Cowork_Session_Log.xlsx`에 Cowork 대화 타임라인 기록
3. Division별 엑셀 업데이트 — D9(`POTAL_D9_Customer_Acquisition.xlsx`), D10(`POTAL_D10_Revenue_Billing.xlsx`), D12(`POTAL_D12_Marketing_Partnerships.xlsx`), D14(`POTAL_D14_Finance_Tracker.xlsx`), D15(`POTAL_D15_Intelligence_Market.xlsx`)
- **로그 없으면 미완료. 빌드 성공해도, 테스트 통과해도, 로그 없으면 미완료.**

## 참조 파일 (필요 시 읽기)
| 파일 | 내용 |
|------|------|
| `session-context.md` | 프로젝트 전체 맥락, 히스토리, TODO |
| `.cursorrules` | 코딩 표준, 파일 매핑, 프로덕션 환경 |
| `docs/PROJECT_STATUS.md` | 핵심 수치, 기술 스택, 폴더 구조, 전략, 요금제, 테이블 현황 |
| `docs/CREDENTIALS.md` | 인증정보, Supabase 연결 방법 |
| `docs/DIVISION_STATUS.md` | 15개 Division 상세, Layer 1/2/3, 운영 사이클 |
| `docs/sessions/COWORK_SESSION_HISTORY.md` | CW13~CW18 세션별 성과 |

## 절대 규칙
1. **B2C 코드 수정 금지** — lib/search/, lib/agent/, components/search/ 보존만
2. **npm run build 확인 후 push** — 빌드 깨진 코드 push 금지
3. **session-context.md에 없는 숫자 만들기 금지** — 근거 없는 수치 사용 금지
4. **console.log 금지** — 프로덕션 코드에 남기지 않기
5. **한 번에 하나의 작업만** — 멀티태스킹 금지
6. **Git push는 Mac 터미널에서** — VM/EC2에서 push 불가
7. **터미널 작업은 한 번에 하나만** — 동시에 2개 이상 다운로드/임포트 금지
8. **문서 업데이트 시 날짜+시간(KST) 기록 필수**
9. **문서 동기화 필수** — 작업 완료 시 아래 문서 중 해당되는 것 업데이트:
   - **핵심 5개**: CLAUDE.md, session-context.md, .cursorrules, CHANGELOG.md, NEXT_SESSION_START.md
   - **참조 3개**: `docs/PROJECT_STATUS.md`(수치 변경 시), `docs/CREDENTIALS.md`(인증정보 변경 시), `docs/DIVISION_STATUS.md`(Division/Layer 변경 시)
10. **HS Code 벤치마크 오류 시 `POTAL_Ablation_V2.xlsx` 대조 필수**

## 로깅 규칙 (Claude Code 엑셀)
- 시트명: `YYMMDDHHMM` | 열: A순번 B시간 C구분 D상세 E파일경로 F상태
- 구분: COMMAND/RESULT/ANALYSIS/DECISION/ERROR/FIX
- 상태: ✅성공/❌실패/⏳진행중/🔄수정
- 시트 마감: 소요시간, 빌드, 테스트, 생성/수정파일
- Python openpyxl 사용

## 🧠 Chief Orchestrator 규칙
- **은태님 = CEO, Claude Code = COO** — 은태님은 판단만, 실행은 Chief가 Division에 배분
- **Cowork = 전략 참모** — 실행하지 않고 명령어/프롬프트 준비, 문서 동기화
- **Morning Brief로 시작** — Green은 보고 안 함, Yellow/Red만 보고
- **추정 금지** — session-context.md에 없는 수치 만들지 않기
- **정확도 우선** — 정확도를 낮추면서 비용을 낮추는 일은 절대 없어야 함

## 세션 종료 체크리스트
- [ ] git push 완료
- [ ] 핵심 5개 + 참조 3개 문서 업데이트 (해당 시)
- [ ] 엑셀 로그 기록 완료
- [ ] 다음 세션 우선순위 NEXT_SESSION_START.md에 기록
- [ ] 교차검증 — 문서 간 숫자 일치 확인

## 은태님 스타일
- 코딩 초보자 — 기술 설명 간결, 작업은 직접 해줘야 함
- 정확성 최우선, 과장 표현 싫어함
- 한국어 소통, 코드/기술 용어는 영어 그대로
