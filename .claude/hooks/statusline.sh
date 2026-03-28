#!/bin/bash
# StatusLine — Claude Code 터미널 하단에 프로젝트 상태 표시
TIMESTAMP=$(TZ=Asia/Seoul date '+%H:%M KST')
echo "POTAL | ${TIMESTAMP} | Hooks: 3 active | Docs: 5+3"
