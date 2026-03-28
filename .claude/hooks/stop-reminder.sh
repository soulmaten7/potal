#!/bin/bash
# Hook: Stop — 세션 종료 시 체크리스트 리마인드

cat << 'EOF'

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
📋 세션 종료 체크리스트
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
□ git push 완료
□ 핵심 5개 문서 업데이트: CLAUDE.md, session-context.md, .cursorrules, CHANGELOG.md, NEXT_SESSION_START.md
□ 참조 3개 업데이트 (해당 시): docs/PROJECT_STATUS.md, docs/CREDENTIALS.md, docs/DIVISION_STATUS.md
□ 엑셀 로그: POTAL_Claude_Code_Work_Log.xlsx + POTAL_Cowork_Session_Log.xlsx
□ Division 엑셀 (해당 시): D9, D10, D12, D14, D15
□ npm run build 확인
□ 교차검증 — 문서 간 숫자 일치
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

EOF

exit 0
