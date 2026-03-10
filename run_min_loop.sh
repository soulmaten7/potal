#!/bin/bash
# MIN 임포트 자동 재시작 래퍼
# 프로세스가 죽으면 5초 후 자동으로 재시작합니다.
# 사용법: nohup bash run_min_loop.sh > min_import.log 2>&1 &

while true; do
    echo "$(date): MIN 임포트 시작..."
    python3 import_min_remaining.py
    EXIT_CODE=$?

    if [ $EXIT_CODE -eq 0 ]; then
        echo "$(date): 정상 완료 (exit 0). 종료합니다."
        break
    fi

    echo "$(date): 비정상 종료 (exit $EXIT_CODE). 5초 후 재시작..."
    sleep 5
done
