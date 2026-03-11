#!/bin/bash
# AGR 임포트 자동 재시작 래퍼
# 프로세스가 죽으면 5초 후 재시작
# 사용법: nohup bash run_agr_loop.sh > agr_import.log 2>&1 &

cd "$(dirname "$0")"

while true; do
    echo "$(date '+%Y년 %m월 %d일 %A %H시 %M분 %S초')  KST: AGR 임포트 시작 ..."
    python3 import_agr_all.py
    EXIT_CODE=$?
    echo "$(date '+%Y년 %m월 %d일 %A %H시 %M분 %S초')  KST: 정상 완료 (exit $EXIT_CODE). 종료합니다."
    if [ $EXIT_CODE -eq 0 ]; then
        break
    fi
    echo "비정상 종료. 5초 후 재시작..."
    sleep 5
done
