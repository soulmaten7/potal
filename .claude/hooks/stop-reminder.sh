#!/bin/bash
# Hook: Stop — 세션 종료 시 하네스 검증 (부탁이 아닌 강제)
# 마지막 업데이트: 2026-04-05 (CW22-S 하네스 강화)

TODAY=$(TZ=Asia/Seoul date '+%Y-%m-%d')

echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "🔒 세션 종료 하네스 검증"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"

# 강제 검증 1: CHANGELOG.md 날짜
if [ -f "docs/CHANGELOG.md" ]; then
  CHANGELOG_DATE=$(head -2 docs/CHANGELOG.md | grep -oP '\d{4}-\d{2}-\d{2}' | head -1)
  if [ "$CHANGELOG_DATE" != "$TODAY" ]; then
    echo "❌ CHANGELOG.md 헤더 날짜: $CHANGELOG_DATE (오늘: $TODAY) — 업데이트 필요!"
  else
    echo "✅ CHANGELOG.md 날짜 OK ($TODAY)"
  fi
fi

# 강제 검증 2: session-context.md 날짜
if [ -f "session-context.md" ]; then
  SC_DATE=$(head -2 session-context.md | grep -oP '\d{4}-\d{2}-\d{2}' | head -1)
  if [ "$SC_DATE" != "$TODAY" ]; then
    echo "❌ session-context.md 헤더 날짜: $SC_DATE (오늘: $TODAY) — 업데이트 필요!"
  else
    echo "✅ session-context.md 날짜 OK ($TODAY)"
  fi
fi

# 강제 검증 3: NEXT_SESSION_START.md 날짜
if [ -f "docs/NEXT_SESSION_START.md" ]; then
  NEXT_DATE=$(head -2 docs/NEXT_SESSION_START.md | grep -oP '\d{4}-\d{2}-\d{2}' | head -1)
  if [ "$NEXT_DATE" != "$TODAY" ]; then
    echo "❌ NEXT_SESSION_START.md 날짜: $NEXT_DATE (오늘: $TODAY) — 업데이트 필요!"
  else
    echo "✅ NEXT_SESSION_START.md 날짜 OK ($TODAY)"
  fi
fi

# 강제 검증 4: CLAUDE.md 날짜
if [ -f "CLAUDE.md" ]; then
  CM_DATE=$(head -2 CLAUDE.md | grep -oP '\d{4}-\d{2}-\d{2}' | head -1)
  if [ "$CM_DATE" != "$TODAY" ]; then
    echo "❌ CLAUDE.md 헤더 날짜: $CM_DATE (오늘: $TODAY) — 업데이트 필요!"
  else
    echo "✅ CLAUDE.md 날짜 OK ($TODAY)"
  fi
fi

# 강제 검증 5: git push 상태
if git status --porcelain 2>/dev/null | grep -q '^'; then
  echo "❌ 커밋되지 않은 변경사항 있음 — git add + commit + push 필요!"
else
  AHEAD=$(git rev-list --count @{u}..HEAD 2>/dev/null || echo "0")
  if [ "$AHEAD" -gt 0 ]; then
    echo "❌ push 안 된 커밋 ${AHEAD}개 — git push 필요!"
  else
    echo "✅ git 상태 OK (모두 push 완료)"
  fi
fi

echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "📋 수동 확인 (Cowork에서)"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "□ Notion Session Log 기록"
echo "□ Notion Task Board 상태 업데이트"
echo "□ session-context.md TODO에 오래된 항목 없는지 확인"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""

exit 0
