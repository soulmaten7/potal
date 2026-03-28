#!/bin/bash
# Hook: SessionStart — 세션 시작 시 프로젝트 맥락 자동 로딩

echo "=== POTAL Session Context ==="
echo ""

# CLAUDE.md (핵심 규칙 58줄)
if [ -f "CLAUDE.md" ]; then
  echo "## CLAUDE.md (핵심 규칙)"
  cat CLAUDE.md
  echo ""
fi

# session-context.md (처음 80줄 — 현재 상태 요약)
if [ -f "session-context.md" ]; then
  echo "## session-context.md (요약)"
  head -80 session-context.md
  echo ""
fi

# NEXT_SESSION_START.md (다음 할 일)
if [ -f "docs/NEXT_SESSION_START.md" ]; then
  echo "## NEXT_SESSION_START.md (다음 할 일)"
  cat docs/NEXT_SESSION_START.md
  echo ""
fi

echo "=== Context Load Complete ==="
echo "참조 파일 필요 시: docs/PROJECT_STATUS.md, docs/CREDENTIALS.md, docs/DIVISION_STATUS.md"
exit 0
