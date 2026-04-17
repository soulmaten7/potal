# POTAL Auto Command Runner 설치 가이드
# 한 번만 실행하면 됩니다
# 마지막 업데이트: 2026-04-17

---

## 이게 뭐하는 건가요?

Scheduled task(Cowork)가 명령어 파일을 만들면,
Mac이 자동으로 감지해서 Claude Code로 실행해주는 브릿지입니다.

```
Scheduled Task (Cowork) 
  → ~/potal/docs/auto-commands/ 에 .md 파일 생성
  → Mac launchd가 10분마다 체크
  → 새 파일 발견하면 Claude Code로 자동 실행
  → 완료된 파일은 done/ 폴더로 이동
```

---

## 설치 (Mac 터미널에서 1번만 실행)

### Step 1: 폴더 생성
```bash
mkdir -p ~/potal/docs/auto-commands/done
```

### Step 2: 스크립트 실행 권한 부여
```bash
chmod +x ~/potal/scripts/auto-command-runner.sh
```

### Step 3: launchd에 등록 (Mac이 10분마다 자동 실행)
```bash
cp ~/potal/scripts/com.potal.auto-command-runner.plist ~/Library/LaunchAgents/
launchctl load ~/Library/LaunchAgents/com.potal.auto-command-runner.plist
```

### Step 4: 등록 확인
```bash
launchctl list | grep potal
# com.potal.auto-command-runner 가 나오면 성공
```

---

## 테스트

### 테스트 파일로 작동 확인
```bash
# 테스트 명령어 파일 생성
cat > ~/potal/docs/auto-commands/test-runner.md << 'EOF'
# 테스트: Auto Command Runner 작동 확인

```bash
echo "Auto Command Runner 테스트 성공! $(date)"
echo "현재 디렉토리: $(pwd)"
ls -la docs/auto-commands/
```
EOF

# 10분 기다리거나, 수동으로 즉시 실행:
bash ~/potal/scripts/auto-command-runner.sh

# 결과 확인
cat ~/potal/docs/auto-commands/runner.log
ls ~/potal/docs/auto-commands/done/
# test-runner_날짜.md 파일이 있으면 성공
```

---

## 관리

### 로그 확인
```bash
cat ~/potal/docs/auto-commands/runner.log
```

### 실패한 명령어 확인
```bash
ls ~/potal/docs/auto-commands/*.failed 2>/dev/null
# .failed 파일이 있으면 내용 확인 후 수정해서 .md로 이름 변경하면 재실행됨
```

### 일시 중지
```bash
launchctl unload ~/Library/LaunchAgents/com.potal.auto-command-runner.plist
```

### 재시작
```bash
launchctl load ~/Library/LaunchAgents/com.potal.auto-command-runner.plist
```

### 완전 삭제
```bash
launchctl unload ~/Library/LaunchAgents/com.potal.auto-command-runner.plist
rm ~/Library/LaunchAgents/com.potal.auto-command-runner.plist
```

---

## Scheduled Task 연동 방법

Scheduled task prompt에서 명령어 파일을 auto-commands 폴더에 생성하면 자동 실행됩니다:

```
# Scheduled task prompt 마지막에 추가:
명령어 파일을 ~/potal/docs/auto-commands/[task-name].md 에 저장하세요.
이 파일은 Auto Command Runner가 자동으로 Claude Code에 전달하여 실행합니다.
```

---

## 주의사항

- Mac이 켜져있고 로그인 상태여야 작동합니다
- Claude Code가 PATH에 있어야 합니다 (`which claude`로 확인)
- `--dangerously-skip-permissions` 플래그로 실행되므로 명령어 파일 내용을 신뢰할 수 있어야 합니다
- .gitignore에 auto-commands/ 폴더를 추가하는 게 좋습니다 (임시 파일이므로)
