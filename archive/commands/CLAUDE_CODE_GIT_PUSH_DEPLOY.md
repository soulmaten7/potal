# Git Push + 프로덕션 배포

## Step 1: 변경 파일 확인
```bash
git status
git diff --stat
```
- .env, credentials 등 민감 파일이 포함되어 있으면 제외

## Step 2: 스테이징 + 커밋
```bash
git add -A
```
커밋 메시지:
```
CW18 12차: 67개 F기능 전수 감사 + 17개 미완성 구현 + 56개 정밀 검증 PASS

- 67개 F기능 명령어 파일 전수 감사 완료 (EXECUTED 56 / PARTIAL 8 / NOT_EXECUTED 3)
- 미완성 17개 기능 구현 완료 (F104, F130-134, F052, F125, F008, F055, F062, F135-137, F030, F056, F146)
- EXECUTED 56개 정밀 검증 156개 CRITICAL 전부 PASS
- CLAUDE.md 필수 지침 최상단 추가 (로깅 체계 강화)
- Cowork 대화 로그 엑셀 전환 (POTAL_Cowork_Session_Log.xlsx)
- npm run build PASS (281 pages), TypeScript 0 errors, as any 0
```

## Step 3: Push
```bash
git push origin main
```

## Step 4: 배포 확인
Vercel이 자동 배포한다. 배포 상태 확인:
```bash
curl -s https://www.potal.app/api/v1/health | head -5
```

## Step 5: 엑셀 로그 기록
두 엑셀 파일 모두 업데이트한다:
- POTAL_Claude_Code_Work_Log.xlsx
- POTAL_Cowork_Session_Log.xlsx
