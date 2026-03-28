#!/bin/bash
# Hook: PreCompact — 컨텍스트 압축 전 현재 작업 상태 저장

TIMESTAMP=$(TZ=Asia/Seoul date '+%Y-%m-%d %H:%M KST')

# NEXT_SESSION_START.md에 현재 작업 상태 메모 추가
if [ -f "docs/NEXT_SESSION_START.md" ]; then
  echo "" >> docs/NEXT_SESSION_START.md
  echo "---" >> docs/NEXT_SESSION_START.md
  echo "## [Auto-saved] Compaction at ${TIMESTAMP}" >> docs/NEXT_SESSION_START.md
  echo "컨텍스트 압축 발생. 이전 대화가 요약됨." >> docs/NEXT_SESSION_START.md
  echo "압축 전 마지막 작업 내용은 session-context.md 및 엑셀 로그 참조." >> docs/NEXT_SESSION_START.md
fi

echo "PreCompact: 작업 상태 저장 완료 (${TIMESTAMP})" >&2
exit 0
