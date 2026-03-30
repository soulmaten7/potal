# 로깅 규칙 (Claude Code 엑셀)
> 마지막 업데이트: 2026-03-30 07:00 KST

## 시트 규칙
- 시트명: `YYMMDDHHMM` (예: 2603300700)
- Python openpyxl 사용

## 열 구성
| 열 | 항목 | 설명 |
|----|------|------|
| A | 순번 | 1, 2, 3... |
| B | 시간 | HH:MM KST |
| C | 구분 | COMMAND / RESULT / ANALYSIS / DECISION / ERROR / FIX |
| D | 상세 | 작업 내용 |
| E | 파일경로 | 수정/생성 파일 |
| F | 상태 | ✅성공 / ❌실패 / ⏳진행중 / 🔄수정 |

## 시트 마감 시 기록
- 총 소요시간
- 빌드 결과 (성공/실패)
- 테스트 결과
- 생성/수정 파일 목록

## 대상 엑셀 파일
| 파일명 | 용도 |
|--------|------|
| `POTAL_Claude_Code_Work_Log.xlsx` | 모든 작업 타임라인 |
| `POTAL_Cowork_Session_Log.xlsx` | Cowork 대화 타임라인 |

## Division별 엑셀 (해당 Division 작업 시 업데이트)
| 파일명 | Division |
|--------|----------|
| `POTAL_D9_Customer_Acquisition.xlsx` | D9 — 고객 확보 |
| `POTAL_D10_Revenue_Billing.xlsx` | D10 — 수익/빌링 |
| `POTAL_D12_Marketing_Partnerships.xlsx` | D12 — 마케팅/파트너십 |
| `POTAL_D14_Finance_Tracker.xlsx` | D14 — 재무 |
| `POTAL_D15_Intelligence_Market.xlsx` | D15 — 시장 인텔리전스 |
