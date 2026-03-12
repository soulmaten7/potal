---
name: morning-briefing
description: "POTAL 프로젝트 모닝브리핑 스킬. 매일 아침 업무 시작 시 사용. 트리거: '모닝브리핑', '아침 브리핑', 'morning brief', '오늘 뭐해', '출근', '브리핑', '상태 확인'. Gmail에서 Morning Brief 이메일 확인 + 미읽은 중요 이메일 요약 + 프로젝트 상태 보고 + 오늘 추천 작업까지 한번에 처리. 새 세션에서도 이전 맥락 없이 바로 실행 가능."
---

# Morning Briefing — POTAL Daily Operations

이 스킬은 POTAL 프로젝트의 매일 아침 업무 브리핑을 자동으로 수행한다.
은태님이 "모닝브리핑"이라고 입력하면, 아래 순서를 빠짐없이 실행하고 결과를 보고한다.

## 실행 순서

### Step 1: Morning Brief 이메일 확인
Gmail MCP 도구를 사용해서 contact@potal.app 받은 편지함을 확인한다.

1. `gmail_search_messages`로 최근 24시간 이메일 검색: `q: "newer_than:1d"`
2. "POTAL Morning Brief" 제목의 이메일이 있으면 → `gmail_read_message`로 내용 읽기
3. 이메일 본문에서 추출:
   - `auto_resolved`: 자동 처리된 항목 (있으면 ✅로 요약)
   - `needs_attention`: 은태님 판단 필요 항목 (있으면 🟡로 상세 표시)
   - `all_green`: 정상 Division 수

Morning Brief 이메일이 없으면 → "Morning Brief 이메일 없음 (Cron 미실행 가능성)" 으로 표시하고 계속 진행.

### Step 2: 미읽은 중요 이메일 확인
1. `gmail_search_messages`로 미읽은 메일 검색: `q: "is:unread -category:promotions -category:social"`
2. 중요 이메일만 필터링:
   - Paddle, Shopify, 보안 관련, 고객 문의, 파트너십 → 중요
   - 뉴스레터, 프로모션, 자동 알림 → 스킵
3. 중요 이메일이 있으면 발신자 + 제목 + 한 줄 요약으로 정리

### Step 3: 프로젝트 상태 확인
CLAUDE.md 파일을 읽어서 현재 프로젝트 상태를 파악한다.

1. 프로젝트 루트의 `CLAUDE.md` 읽기 (핵심 수치 섹션)
2. 확인할 항목:
   - 47기능 진행률 (N/47)
   - AGR 임포트 상태 (완료/진행중)
   - WDC 추출 상태 (완료/진행중)
   - 15개 Division 상태
   - Shopify 심사 상태

### Step 4: 종합 보고
아래 포맷으로 깔끔하게 보고한다. 과장 없이 팩트만.

```
🧠 Morning Brief — [오늘 날짜]
━━━━━━━━━━━━━━━━━━━━━
[Morning Brief 이메일 결과]
✅ 자동 처리: [N]건 — [요약]
🟡 판단 필요: [N]건 — [상세]
🟢 정상: [N]/15 Division

[미읽은 중요 이메일]
📧 미확인 메일: [N]건
  - [발신자]: [제목] — [한줄요약]

[프로젝트 상태]
📊 47기능: [N]/47 완료
📦 AGR: [상태] | WDC: [상태]
🛍️ Shopify: [심사 상태]

🎯 오늘 추천: [추천 작업]
━━━━━━━━━━━━━━━━━━━━━
뭐부터 할까?
```

## 추천 작업 로직
오늘 추천은 이 우선순위로 판단한다:
1. 🔴 needs_attention 항목이 있으면 → 그거 먼저
2. 미확인 중요 이메일 중 액션 필요한 것 → 이메일 처리
3. 백그라운드 작업 완료됐으면 → 다음 단계 (예: WDC 완료 → Supabase 업로드)
4. 위 3개 다 없으면 → CLAUDE.md의 다음 우선순위 작업 추천

## 주의사항
- session-context.md에 없는 숫자를 만들지 말 것
- 추정치 금지, 실제 데이터만 사용
- 한국어로 보고, 기술 용어는 영어 그대로
- 간결하게, 과장 없이
