# Vercel 빌드 에러 진단 + 수정

## Phase 1: 빌드 에러 로그 확인

```bash
# 1. 최근 배포 목록 확인 (ERROR 배포 찾기)
curl -s -H "Authorization: Bearer vcp_BLfOcKXwZhXNFXoYMlI80DDK3yEXlU0gYBfW" \
  "https://api.vercel.com/v6/deployments?projectId=potal&limit=5" | \
  python3 -c "
import sys, json
data = json.load(sys.stdin)
for d in data.get('deployments', []):
    print(f\"{d['uid']} | {d['state']} | {d.get('readyState','-')} | {d['url']} | {d.get('created','')}\")
"

# 2. ERROR 배포의 빌드 로그 가져오기 (위 결과에서 ERROR uid 사용)
# 자동으로 ERROR 상태인 첫 번째 배포의 빌드 로그를 가져옴
ERROR_UID=$(curl -s -H "Authorization: Bearer vcp_BLfOcKXwZhXNFXoYMlI80DDK3yEXlU0gYBfW" \
  "https://api.vercel.com/v6/deployments?projectId=potal&limit=5" | \
  python3 -c "
import sys, json
data = json.load(sys.stdin)
for d in data.get('deployments', []):
    if d.get('state') == 'ERROR' or d.get('readyState') == 'ERROR':
        print(d['uid'])
        break
")

if [ -z "$ERROR_UID" ]; then
  echo "ERROR 배포 없음 — 최신 배포가 성공했을 수 있음"
  # 최신 배포 상태 재확인
  curl -s -H "Authorization: Bearer vcp_BLfOcKXwZhXNFXoYMlI80DDK3yEXlU0gYBfW" \
    "https://api.vercel.com/v6/deployments?projectId=potal&limit=3" | \
    python3 -c "
import sys, json
data = json.load(sys.stdin)
for d in data.get('deployments', []):
    print(f\"{d['uid']} | state={d['state']} | ready={d.get('readyState','-')} | url={d['url']}\")
"
  exit 0
fi

echo "ERROR 배포 UID: $ERROR_UID"
echo ""
echo "=== 빌드 이벤트 로그 ==="
curl -s -H "Authorization: Bearer vcp_BLfOcKXwZhXNFXoYMlI80DDK3yEXlU0gYBfW" \
  "https://api.vercel.com/v2/deployments/$ERROR_UID/events" | \
  python3 -c "
import sys, json
data = json.load(sys.stdin)
if isinstance(data, list):
    for event in data[-80:]:  # 마지막 80줄
        text = event.get('text', '')
        if text:
            print(text)
elif isinstance(data, dict) and 'error' in data:
    print(f\"API Error: {data['error']}\")
else:
    print(json.dumps(data, indent=2)[:3000])
"
```

## Phase 2: 에러 원인별 수정

### Case A: 대용량 파일 (conflict-patterns-data.ts 1.4MB 등)
```bash
# 대용량 파일 확인
echo "=== 대용량 TypeScript/JSON 파일 (>500KB) ==="
find app/lib/cost-engine/gri-classifier -type f \( -name "*.ts" -o -name "*.json" \) -size +500k -exec ls -lh {} \;

# conflict-patterns-data.ts가 문제라면 → dynamic import로 전환
# 또는 해당 파일을 public/data/로 이동하고 런타임에 fetch
```

### Case B: TypeScript 컴파일 에러
```bash
# 로컬에서 다시 빌드 확인
npm run build 2>&1 | tail -30
```

### Case C: Vercel 메모리/시간 초과
```bash
# vercel.json에 maxDuration 확인
cat vercel.json | python3 -c "
import sys, json
data = json.load(sys.stdin)
print(json.dumps(data, indent=2))
"
```

## Phase 3: 수정 후 재배포 (Mac 터미널에서)
```bash
# 수정사항 커밋 + push
git add -A
git commit -m "fix: resolve Vercel build error — [원인 기록]"
git push

# 또는 Vercel CLI로 직접 재배포
# npx vercel --prod --yes
```

## Phase 4: 배포 성공 확인 + Layer 2 테스트
```bash
# 배포 상태 확인
curl -s -H "Authorization: Bearer vcp_BLfOcKXwZhXNFXoYMlI80DDK3yEXlU0gYBfW" \
  "https://api.vercel.com/v6/deployments?projectId=potal&limit=3" | \
  python3 -c "
import sys, json
data = json.load(sys.stdin)
for d in data.get('deployments', []):
    print(f\"{d['uid']} | state={d['state']} | ready={d.get('readyState','-')}\")
"

# Layer 2 테스트 (배포 성공 후)
# 실제 API key로 테스트 — 올바른 입력
curl -s -X POST https://www.potal.app/api/v1/classify \
  -H "Content-Type: application/json" \
  -H "X-API-Key: pt_live_41f9c265b0f04e1c8ea39b61ef1cc2a9" \
  -d '{
    "productName": "Mens Cotton T-Shirt",
    "material": "cotton",
    "origin_country": "CN",
    "category": "Clothing"
  }' | python3 -m json.tool

# Layer 2 테스트 — 잘못된 입력 (422 기대)
curl -s -X POST https://www.potal.app/api/v1/classify \
  -H "Content-Type: application/json" \
  -H "X-API-Key: pt_live_41f9c265b0f04e1c8ea39b61ef1cc2a9" \
  -d '{
    "productName": "Mens Cotton T-Shirt",
    "material": "Alloy",
    "origin_country": "China"
  }' | python3 -m json.tool

# Layer 2 테스트 — warning 입력 (200 + validation warnings 기대)
curl -s -X POST https://www.potal.app/api/v1/classify \
  -H "Content-Type: application/json" \
  -H "X-API-Key: pt_live_41f9c265b0f04e1c8ea39b61ef1cc2a9" \
  -d '{
    "productName": "Mens Cotton T-Shirt",
    "origin_country": "CN"
  }' | python3 -m json.tool
```
