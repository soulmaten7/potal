#!/bin/bash
# POTAL Auto Command Runner
# Scheduled task가 생성한 명령어 파일을 Claude Code로 자동 실행
# 설치: launchd plist로 10분마다 실행

COMMANDS_DIR="$HOME/potal/docs/auto-commands"
DONE_DIR="$COMMANDS_DIR/done"
LOG_FILE="$COMMANDS_DIR/runner.log"

# 폴더 없으면 생성
mkdir -p "$COMMANDS_DIR" "$DONE_DIR"

# 타임스탬프
timestamp() { date "+%Y-%m-%d %H:%M:%S"; }

# 새 .md 파일 확인
shopt -s nullglob
files=("$COMMANDS_DIR"/*.md)
shopt -u nullglob

if [ ${#files[@]} -eq 0 ]; then
  exit 0  # 새 파일 없으면 조용히 종료
fi

for file in "${files[@]}"; do
  filename=$(basename "$file")
  echo "$(timestamp) [START] $filename" >> "$LOG_FILE"

  # Claude Code로 실행 (dangerously-skip-permissions로 자동 실행)
  cd "$HOME/potal" && claude --dangerously-skip-permissions -p "$(cat <<EOF
다음 명령어 파일을 읽고 순서대로 실행해줘.
실행 결과를 간결하게 요약해서 알려줘.
파일: docs/auto-commands/$filename
EOF
  )" >> "$LOG_FILE" 2>&1

  exit_code=$?

  if [ $exit_code -eq 0 ]; then
    # 성공 → done 폴더로 이동
    mv "$file" "$DONE_DIR/${filename%.md}_$(date +%Y%m%d_%H%M%S).md"
    echo "$(timestamp) [DONE] $filename (exit: $exit_code)" >> "$LOG_FILE"
  else
    # 실패 → .failed 확장자 추가 (다음 실행에서 재시도 안 함)
    mv "$file" "$COMMANDS_DIR/${filename%.md}.failed"
    echo "$(timestamp) [FAIL] $filename (exit: $exit_code)" >> "$LOG_FILE"
  fi

  echo "---" >> "$LOG_FILE"
done
