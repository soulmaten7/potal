# Area 0 Fix: MATERIAL_KEYWORDS 79 → 91 그룹 수정

## 발견
- guide/page.tsx에 "79 material groups" 표기
- developers/docs/page.tsx에 "79 material groups" 표기
- 실제 step0-input.ts MATERIAL_KEYWORDS = **91그룹**, 577개 변형
- CLAUDE.md에도 "MATERIAL_KEYWORDS 79그룹" → 업데이트 필요

## 수정 1: guide/page.tsx

파일: `app/guide/page.tsx`
변경: line 47 부근

```
변경 전: 'Primary material from WCO standard list (79 material groups covering all 21 Sections)',
변경 후: 'Primary material from WCO standard list (91 material groups covering all 21 Sections)',
```

## 수정 2: developers/docs/page.tsx

파일: `app/developers/docs/page.tsx`
변경: classify endpoint의 material field description

```
변경 전: 'Primary material — must match WCO 21 Section standard (79 material groups). e.g. cotton, steel, leather, plastic'
변경 후: 'Primary material — must match WCO 21 Section standard (91 material groups). e.g. cotton, steel, leather, plastic'
```

## 수정 3: CLAUDE.md

파일 전체에서 "MATERIAL_KEYWORDS 79그룹" → "MATERIAL_KEYWORDS 91그룹" 변경 (여러 곳)
- "79그룹" 또는 "79 groups" 검색 → "91그룹" / "91 groups"로 변경

## 검증

```bash
# 1. 실제 그룹 수 확인
npx tsx -e "
import { MATERIAL_KEYWORDS } from './app/lib/cost-engine/gri-classifier/steps/v3/step0-input';
console.log('Groups:', Object.keys(MATERIAL_KEYWORDS).length);
console.log('Variants:', Object.values(MATERIAL_KEYWORDS).flat().length);
"

# 2. 수정 확인 — 79가 남아있으면 안 됨
grep -rn "79 material" app/guide/page.tsx app/developers/docs/page.tsx
grep -n "79그룹" CLAUDE.md | head -20

# 3. 91로 변경됐는지 확인
grep -rn "91 material" app/guide/page.tsx app/developers/docs/page.tsx

# 4. build
npm run build
```

## 엑셀 로깅
POTAL_Claude_Code_Work_Log.xlsx에 시트 추가
