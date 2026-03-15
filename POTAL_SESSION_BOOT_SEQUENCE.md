# POTAL 세션 부트 시퀀스 (3단 구조)
# 새 세션을 시작할 때마다 이 순서대로 실행
# 마지막 업데이트: 2026-03-15 19:00 KST

---

## Step 1: Cowork에게 감사 명령어 생성 지시

> Cowork(Claude Desktop)에 아래를 **첫 메시지**로 보내세요:

```
POTAL Chief Orchestrator 세션 시작.
너는 POTAL의 Chief Orchestrator다. 은태 = CEO, 너 = COO.

지금 새 세션이라 너도 나도 프로젝트 실제 상태를 모른다.
문서에 적힌 숫자를 그대로 믿지 마.

1단계: CLAUDE.md, session-context.md, docs/NEXT_SESSION_START.md 읽어서 기본 맥락 파악
2단계: docs/FULL_PROJECT_AUDIT.md가 있으면 읽어서 실제 상태 파악
3단계: FULL_PROJECT_AUDIT.md가 없거나 24시간 이상 지났으면,
       Claude Code용 전체 프로젝트 감사 명령어를 생성해줘 (FULL_PROJECT_AUDIT_COMMAND.md)
4단계: 감사가 최신이면 바로 모닝브리핑 실행
```

---

## Step 2: Claude Code에서 감사 실행

> Step 1에서 Cowork가 만든 명령어를 Claude Code 터미널에 보내세요:

```
FULL_PROJECT_AUDIT_COMMAND.md 파일을 읽고 그대로 실행해. Phase 1부터 7까지 순서대로. Phase 7 리포트 완성 후, CLAUDE.md와 session-context.md에서 실제와 다른 숫자를 전부 교정해. 교정한 항목은 리포트 마지막에 "교정 내역" 섹션으로 정리해.
```

---

## Step 3: Cowork에게 감사 결과 반영 + 업무 시작

> Claude Code 감사가 끝나면, Cowork에 아래를 보내세요:

```
Claude Code 감사 완료됨.
docs/FULL_PROJECT_AUDIT.md 읽고, 교정된 CLAUDE.md 다시 읽어.
문서와 실제가 다른 부분 있으면 알려주고, 모닝브리핑 실행해.
```

---

## 흐름 요약

```
은태님 → [Step 1] → Cowork: 맥락 파악 + 감사 명령어 생성
은태님 → [Step 2] → Claude Code: 실제 파일/DB 전수 감사 + 문서 교정
은태님 → [Step 3] → Cowork: 교정된 문서 기반 모닝브리핑 + 업무 시작
```

## 단축 버전 (감사가 최신일 때)

감사 리포트가 이미 있고 24시간 이내면 Step 2를 건너뛰고:

```
POTAL Chief Orchestrator 세션 시작.
너는 POTAL의 Chief Orchestrator다. 은태 = CEO, 너 = COO.

1단계: CLAUDE.md + docs/FULL_PROJECT_AUDIT.md + docs/NEXT_SESSION_START.md 읽어
2단계: 모닝브리핑 실행
3단계: 오늘 작업 리스트 보여줘
```

---

## 참고: 각 도구의 역할

| 역할 | 도구 | 할 수 있는 것 | 할 수 없는 것 |
|------|------|-------------|-------------|
| **은태님** | 판단 + 복사붙여넣기 | 최종 결정, 도구 간 메시지 전달, 외부 서비스 로그인 | 코딩, DB 쿼리 |
| **Cowork** | 전략 참모 | Gmail 확인, 문서 읽기/분석, 명령어 생성, 전략 제안, 스킬 실행 | 코드 실행, git push, DB 직접 쿼리, npm build |
| **Claude Code** | 실행 엔진 | 코딩, 빌드, git, DB 쿼리, 파일 생성/수정, 외장하드 접근 | Gmail, 외부 웹 검색, 전략 판단 |
