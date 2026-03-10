# POTAL 세션 관리 템플릿
> 은태님이 매 세션 시작/종료 시 복붙해서 사용하는 명령어 모음
> 마지막 업데이트: 2026-03-09

---

## 📋 A. 새 세션 시작할 때 (복사해서 붙여넣기)

```
POTAL 프로젝트 이어서 진행합니다.

⚠️ 반드시 아래 순서대로 읽고 시작해주세요:

1단계: 프로젝트 핵심 파일 3개 전부 읽기 (건너뛰기 금지)
- CLAUDE.md → 프로젝트 개요, 폴더 구조, 기술 스택, 절대 규칙, 요금제
- session-context.md → 전체 히스토리, TODO, 완료 내역, 인증정보, 수치
- .cursorrules → 코딩 표준, Anti-Amnesia 섹션, 파일 매핑

2단계: 최근 변경사항 확인
- docs/NEXT_SESSION_START.md → 직전 세션에서 뭘 바꿨는지 상세 기록
- docs/CHANGELOG.md → 전체 개발 이력 (최신 엔트리부터)

3단계: 폴더 구조 이해 (2026-03-09 재설계됨)
- docs/sessions/ → 세션별 리포트
- docs/architecture/ → 설계 문서
- analysis/ → 경쟁사/비용/전략 분석
- marketing/ → 마케팅/런칭 자료
- checklists/ → 체크리스트/TODO (마스터: POTAL_B2B_Checklist.xlsx)
- ai-agents/ → GPT/Gemini/Meta AI 설정
- archive/ → 현재 안쓰지만 보관 중인 파일
- data/ → 관세 데이터 (itc_macmap/, tariff-research/, wits_tariffline/)
- scripts/docs/ → 스크립트 사용법 문서

⚠️ 핵심 주의사항:
- 요금제: 코드에 구버전(Free 500/Starter $9/Growth $29)이 남아있지만 폐기됨. 신 요금제는 Free $0/100건, Basic $20/2K, Pro $80/10K, Enterprise $300+/50K+
- 결제: LemonSqueezy → Paddle로 전환됨
- session-context.md에 없는 숫자 만들지 마세요
- B2C 코드(lib/search/, lib/agent/ 등) 수정 금지

위 파일들 전부 읽은 후에 현재 상태를 간단히 요약해주세요.
그 후 [여기에 오늘 할 작업 내용 작성] 진행합니다.
```

---

## 📋 B. 세션 종료할 때 (복사해서 붙여넣기)

```
세션을 마무리합니다. 아래 순서대로 전부 실행해주세요:

1. 이번 세션에서 변경/생성/삭제한 모든 파일 목록 정리

2. 아래 파일들을 이번 세션 내용으로 업데이트:
   - session-context.md → TODO, IN PROGRESS, DONE, 작업 로그 전부 반영
   - .cursorrules → Anti-Amnesia 섹션, 파일 매핑, 수치 업데이트
   - CLAUDE.md → 핵심 수치, 테이블 현황 등 변경된 부분 반영
   - docs/CHANGELOG.md → 이번 세션 엔트리 추가
   - checklists/POTAL_B2B_Checklist.xlsx → 완료/신규 태스크 반영

3. docs/NEXT_SESSION_START.md 전면 재작성:
   - 이번 세션에서 뭘 했는지 (완료 작업 상세)
   - 뭘 바꿨는지 (파일 변경/생성/삭제 목록)
   - 다음에 뭘 해야 하는지 (우선순위 순)
   - 주의사항 (블로커, 진행 중 프로세스 등)

4. 교차검증:
   - 모든 문서의 숫자가 일치하는지 확인 (국가 수, 행 수, 파일 수 등)
   - 상태 표시가 일관적인지 확인 (✅/🔄/⏳)
   - 결과를 간단히 보고

5. 세션 리포트 생성:
   - docs/sessions/SESSION_XX_REPORT.md 파일로 교차검증 결과 저장

모든 업데이트 완료 후 변경된 파일 목록과 다음 세션 우선순위를 알려주세요.
```

---

## 📋 C. 특정 상황별 추가 명령어

### C-1. 새 세션이 요금제를 잘못 이해할 때
```
요금제를 잘못 이해하고 있습니다.

코드에 남아있는 Free 500/Starter $9/Growth $29는 세션 28에서 폐기된 구 요금제입니다.
CLAUDE.md의 "⚠️ 요금제" 섹션과 session-context.md의 요금제 섹션을 다시 읽어주세요.

현재 유효한 요금제:
- Free: $0 / 100건/월
- Basic: $20 / 2,000건/월
- Pro: $80 / 10,000건/월
- Enterprise: $300+ / 50,000건+

이유: Alex Hormozi "중간은 죽음" 전략. AI 원가 건당 $0.008 이하이므로 Basic $20/2K에서 마진 97%.
```

### C-2. 파일 위치를 못 찾을 때
```
파일을 못 찾으면 CLAUDE.md의 "📁 폴더 구조" 섹션을 읽어주세요.
2026-03-09에 전체 폴더 구조가 재설계되었습니다:

- 경쟁사 분석 → analysis/
- 마케팅 자료 → marketing/
- 체크리스트 → checklists/
- AI 에이전트 → ai-agents/
- 세션 리포트 → docs/sessions/
- 설계 문서 → docs/architecture/
- 관세 데이터 → data/ (itc_macmap/, tariff-research/, wits_tariffline/)
- 안쓰는 파일 → archive/
```

### C-3. 결제 시스템을 잘못 이해할 때
```
결제 시스템 변경 이력:
Stripe (정지됨) → LemonSqueezy (전환됨) → Paddle (현재)

코드에 LemonSqueezy 참조가 아직 남아있지만, 실제 결제는 Paddle로 전환되었습니다.
Paddle은 MoR(Merchant of Record)이라 세금 처리를 대행합니다.
```
