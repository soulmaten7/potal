# Vercel 환경변수 CLASSIFICATION_ENGINE=gri 세팅

## 배경
- `/api/v1/classify` 엔드포인트의 Layer 2 (9-field validation + GRI 분류) 활성화 조건:
  ```typescript
  // classify/route.ts line 225
  const useGriEngine = process.env.CLASSIFICATION_ENGINE === 'gri';
  ```
- 이 환경변수가 없으면 레거시 엔진(productName만 받는 구 방식)으로 폴백
- Layer 2 field-validator.ts, GRI v3 파이프라인 모두 이 환경변수에 의존

## Phase 1: 현재 상태 확인

```bash
# 1. Vercel 환경변수 전체 조회 (CLASSIFICATION 관련)
npx vercel env ls 2>&1 | grep -i classif

# 2. 없으면 Vercel CLI로 직접 확인
curl -s -H "Authorization: Bearer vcp_BLfOcKXwZhXNFXoYMlI80DDK3yEXlU0gYBfW" \
  "https://api.vercel.com/v9/projects/potal/env" | \
  python3 -c "
import sys, json
data = json.load(sys.stdin)
envs = data.get('envs', [])
for e in envs:
    if 'CLASSIF' in e.get('key','').upper() or 'GRI' in e.get('key','').upper():
        print(f\"{e['key']} = {e.get('value','(encrypted)')} [{e.get('target',[])}]\")
if not any('CLASSIF' in e.get('key','').upper() for e in envs):
    print('CLASSIFICATION_ENGINE 환경변수 없음 — 세팅 필요')
"
```

## Phase 2: 환경변수 세팅

```bash
# Vercel API로 환경변수 추가 (production + preview + development 전부)
curl -s -X POST "https://api.vercel.com/v10/projects/potal/env" \
  -H "Authorization: Bearer vcp_BLfOcKXwZhXNFXoYMlI80DDK3yEXlU0gYBfW" \
  -H "Content-Type: application/json" \
  -d '{
    "key": "CLASSIFICATION_ENGINE",
    "value": "gri",
    "type": "plain",
    "target": ["production", "preview", "development"]
  }' | python3 -c "
import sys, json
data = json.load(sys.stdin)
if 'error' in data:
    print(f\"ERROR: {data['error']['message']}\")
    if 'already exist' in data.get('error',{}).get('message','').lower():
        print('이미 존재 — Phase 3 업데이트로 진행')
else:
    print(f\"SUCCESS: {data.get('key','')} = {data.get('value','')} [{data.get('target',[])}]\")
"
```

## Phase 2-B: 이미 존재할 경우 업데이트

```bash
# 기존 환경변수 ID 찾기
ENV_ID=$(curl -s -H "Authorization: Bearer vcp_BLfOcKXwZhXNFXoYMlI80DDK3yEXlU0gYBfW" \
  "https://api.vercel.com/v9/projects/potal/env" | \
  python3 -c "
import sys, json
data = json.load(sys.stdin)
for e in data.get('envs', []):
    if e.get('key') == 'CLASSIFICATION_ENGINE':
        print(e['id'])
        break
")

if [ -n "$ENV_ID" ]; then
  echo "Found ENV ID: $ENV_ID — updating to 'gri'"
  curl -s -X PATCH "https://api.vercel.com/v10/projects/potal/env/$ENV_ID" \
    -H "Authorization: Bearer vcp_BLfOcKXwZhXNFXoYMlI80DDK3yEXlU0gYBfW" \
    -H "Content-Type: application/json" \
    -d '{
      "value": "gri",
      "target": ["production", "preview", "development"]
    }' | python3 -c "
import sys, json
data = json.load(sys.stdin)
if 'error' in data:
    print(f\"ERROR: {data['error']['message']}\")
else:
    print(f\"UPDATED: {data.get('key','')} = {data.get('value','')} [{data.get('target',[])}]\")
"
else
  echo "ERROR: CLASSIFICATION_ENGINE not found. Phase 2 should have created it."
fi
```

## Phase 3: 재배포 (환경변수 적용)

```bash
# Vercel 재배포 트리거 (환경변수 변경은 재배포 필요)
# 방법 1: git push (이미 코드 변경 있으면)
# 방법 2: Vercel CLI로 직접 재배포
npx vercel --prod --yes 2>&1 | tail -5

# 또는 빈 커밋 + push (Mac 터미널에서)
# git commit --allow-empty -m "trigger: enable CLASSIFICATION_ENGINE=gri for Layer 2"
# git push
```

## Phase 4: 검증

```bash
# 1. 프로덕션에서 Layer 2 동작 확인 — 올바른 입력 (200 OK + 분류 결과)
curl -s -X POST https://www.potal.app/api/v1/classify \
  -H "Content-Type: application/json" \
  -H "X-API-Key: test" \
  -d '{
    "productName": "Mens Cotton T-Shirt",
    "material": "cotton",
    "origin_country": "CN",
    "category": "Clothing"
  }' | python3 -c "
import sys, json
data = json.load(sys.stdin)
if data.get('success'):
    d = data.get('data', {})
    print(f\"SUCCESS: HS {d.get('hsCode')} | confidence {d.get('confidence')} | method {d.get('classificationMethod','')}\")
    if 'validation' in d:
        print(f\"  warnings: {d['validation'].get('warning_field_count', 0)}\")
else:
    print(f\"ERROR: {data.get('error', {}).get('message', 'unknown')}\")
    if 'validation' in str(data):
        print('  → Layer 2 validation 동작 확인됨 (에러 반환)')
"

# 2. Layer 2 validation 에러 확인 — 잘못된 입력 (422 + 진단)
curl -s -X POST https://www.potal.app/api/v1/classify \
  -H "Content-Type: application/json" \
  -H "X-API-Key: test" \
  -d '{
    "productName": "Mens Cotton T-Shirt",
    "material": "Alloy",
    "origin_country": "China"
  }' | python3 -c "
import sys, json
data = json.load(sys.stdin)
print(f\"HTTP success: {data.get('success')}\")
if not data.get('success'):
    err = data.get('error', {})
    print(f\"Error message: {err.get('message','')}\")
    details = err.get('details', {})
    val = details.get('validation', {})
    if val:
        print(f\"  overall: {val.get('overall_status')}\")
        print(f\"  errors: {val.get('error_field_count')}, warnings: {val.get('warning_field_count')}\")
        print(f\"  accuracy: {val.get('estimated_accuracy')}\")
        for f in val.get('fields', []):
            if f.get('status') != 'valid':
                print(f\"  {f['field']}: {f['status']} — {f.get('message','')} (closest: {f.get('closest_match','-')})\")
        print('Layer 2 validation 정상 동작 ✅')
    else:
        print('  validation 객체 없음 — Layer 2 미활성화 가능성')
else:
    print('예상과 다름 — 잘못된 입력인데 200 반환됨')
"

# 3. Layer 2 warning 확인 — material 누락 (분류는 하되 warning 포함)
curl -s -X POST https://www.potal.app/api/v1/classify \
  -H "Content-Type: application/json" \
  -H "X-API-Key: test" \
  -d '{
    "productName": "Mens Cotton T-Shirt",
    "origin_country": "CN"
  }' | python3 -c "
import sys, json
data = json.load(sys.stdin)
if data.get('success'):
    d = data.get('data', {})
    print(f\"SUCCESS: HS {d.get('hsCode')}\")
    if 'validation' in d:
        val = d['validation']
        print(f\"  warnings: {val.get('warning_field_count')} (material 누락 경고 포함 예상)\")
        for f in val.get('fields', []):
            if f.get('status') == 'warning':
                print(f\"  {f['field']}: {f.get('message','')}\")
        print('Layer 2 warning 포함 분류 정상 ✅')
    else:
        print('  validation 없음 — warning 전달 안 됨')
else:
    print(f\"ERROR: {data.get('error',{}).get('message','')}\")
    print('material 없이 422 반환 — material이 required여서 에러 처리됨')
"
```

## Phase 5: 결과 기록

엑셀 로깅: POTAL_Claude_Code_Work_Log.xlsx에 시트 추가

```
결과 요약:
- CLASSIFICATION_ENGINE=gri 환경변수: [세팅됨/이미있었음]
- 재배포: [완료/불필요]
- 테스트 1 (올바른 입력): [200 OK + HS Code 반환]
- 테스트 2 (잘못된 입력): [422 + validation 에러 + closest_match]
- 테스트 3 (경고 입력): [200 OK + warnings 포함]
- Layer 2 프로덕션 활성화: [✅/❌]
```

## ⚠️ 주의사항
- API key "test"로 테스트 시 인증 에러 나면, 대시보드에서 실제 API key 사용
- 환경변수 변경 후 재배포 안 하면 적용 안 됨
- GRI 엔진 에러 시 레거시 엔진으로 자동 폴백 (서비스 중단 없음)
