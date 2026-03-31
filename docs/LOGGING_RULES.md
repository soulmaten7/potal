# 로깅 규칙 (Notion 기반)
> 마지막 업데이트: 2026-03-31 15:00 KST (CW22-J — 엑셀 로깅 폐지, Notion 이전)

> ⚠️ 2026-03-31부터 엑셀 로깅(Work_Log.xlsx, Cowork_Session_Log.xlsx, D9~D15 Division 엑셀) 전면 폐지.
> 모든 프로젝트 관리는 Notion "POTAL Command Center"에서 수행.

---

## Notion "POTAL Command Center" 구조

| DB | 용도 | 뷰 |
|----|------|-----|
| **Task Board** | 작업 관리 (To Do → In Progress → Done) | 칸반 보드 |
| **Session Log** | 매 세션 기록 (세션명, 날짜, 요약, 커밋) | 테이블 |
| **Content Pipeline** | 콘텐츠 제작 관리 (블로그, 영상, SNS) | 테이블 |
| **Marketplace Tracker** | 마켓플레이스 심사/등록 상태 | 테이블 |
| **Finance Tracker** | 비용/수익 변동 추적 | 테이블 |

---

## 세션 기록 규칙

### 코드 작업 시 (Claude Code 터미널)
| 파일 | 업데이트 내용 |
|------|-------------|
| `CLAUDE.md` | 헤더 날짜 + 핵심 변경사항 1줄 |
| `CHANGELOG.md` | 날짜 + 변경사항 기록 (가장 위에 추가) |
| `session-context.md` | 완료항목 체크, 새 항목 추가, 수치 업데이트 |

### Notion에서 (Cowork에서 처리)
| DB | 업데이트 시점 |
|----|-------------|
| **Session Log** | 매 세션 종료 시 — 세션명, 날짜, 요약, 커밋 해시 |
| **Task Board** | 작업 완료 시 — 상태 변경 (To Do → Done) |
| **Content Pipeline** | 영상/SNS 작업 시 — 상태 변경 |
| **Marketplace Tracker** | 심사 결과 도착 시 — 상태 변경 |
| **Finance Tracker** | 비용/수익 변동 시 |

---

## 폐지된 엑셀 파일 (참고용, 더 이상 업데이트 안 함)

| 파일명 | 대체 Notion DB |
|--------|---------------|
| `POTAL_Claude_Code_Work_Log.xlsx` | Session Log |
| `POTAL_Cowork_Session_Log.xlsx` | Session Log |
| `POTAL_D9_Customer_Acquisition.xlsx` | Task Board |
| `POTAL_D10_Revenue_Billing.xlsx` | Finance Tracker |
| `POTAL_D12_Marketing_Partnerships.xlsx` | Content Pipeline |
| `POTAL_D14_Finance_Tracker.xlsx` | Finance Tracker |
| `POTAL_D15_Intelligence_Market.xlsx` | Task Board |

> 과거 엑셀 파일들은 `archive/` 폴더에 보존되어 있으며, 히스토리 참조 시에만 사용.
