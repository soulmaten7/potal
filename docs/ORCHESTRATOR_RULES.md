# Chief Orchestrator 규칙
> 마지막 업데이트: 2026-03-31 18:00 KST (CW22-K: 통합 모닝브리핑 아키텍처 적용)

## 역할 분담
- **은태님 = CEO** — 판단, 의사결정만
- **Claude Code = COO** — 실행, Division에 작업 배분
- **Cowork = 전략 참모** — 실행하지 않고 명령어/프롬프트 준비, 문서 동기화

## 통합 모닝브리핑 아키텍처 (v2)

### Scheduled Tasks (활성)
| Task ID | 주기 | 역할 |
|---------|------|------|
| `potal-daily-health-check` | 매일 9AM KST | Chief Orchestrator 통합 점검 (16개 Division) |
| `d16-secretary-inbox-check` | 매시간 | D16 비서실 Gmail + Crisp 체크 |

### 비활성화된 Task (통합됨)
| Task ID | 상태 | 사유 |
|---------|------|------|
| `morning-brief` | 비활성화 | `potal-daily-health-check`로 통합 |
| `chief-orchestrator-daily` | 비활성화 | `potal-daily-health-check`로 통합 |
| `morning-brief-v2` | 비활성화 | `potal-daily-health-check`로 통합 |
| `division-log-check` | 비활성화 | `chief-orchestrator-daily`가 대체 → 이후 통합 |

### 도구별 Division 매핑
Chief Orchestrator가 각 Division을 점검할 때 사용하는 도구:

| 도구 | 담당 Division | 점검 내용 |
|------|-------------|----------|
| **POTAL MCP** | D1, D2, D3, D4, D7 | API 실제 호출 (classify_product, calculate_landed_cost, check_restrictions, screen_denied_party, lookup_fta) |
| **Chrome MCP** | D5, D11 | 라이브 사이트 접속 (potal.app 페이지 로드, Features 검색박스, Pricing Forever Free) |
| **Gmail MCP** | D9, D16 | 고객 문의 확인, 미읽은 중요 이메일 (마켓플레이스 심사 결과 포함) |
| **Notion MCP** | D12 | Content Pipeline DB 조회 (진행중 항목, 마감 임박) |
| **정적 체크** | D6, D8, D10, D13, D14, D15 | 에러 이메일 없으면 Green (별도 API 호출 불필요) |
| **Telegram Bot** | 보고 | 점검 결과 종합 → 텔레그램으로 CEO에게 전송 |

### 수동 실행
Cowork에서 "모닝브리핑" 입력 → `morning-briefing` 스킬 실행 (Scheduled Task와 동일 로직)

## Morning Brief 보고 규칙
- **Green** 상태 Division → 숫자만 표시 (예: 🟢 GREEN: 14/16)
- **Yellow/Red** 상태만 상세 보고 → 해결 방안 제시
- 결과는 텔레그램으로 전송 (Bot Token: POTAL Alert — Chief용)

## 핵심 원칙
- **추정 금지** — session-context.md에 없는 수치 만들지 않기
- **정확도 우선** — 정확도를 낮추면서 비용 절감하는 일은 절대 불가
- **한 번에 하나** — 멀티태스킹 금지, 순차 실행
