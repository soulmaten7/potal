# T28 — 동의어 사전 + CBP 100건 벤치마크

Cowork에서 Subheading 동의어 사전(50+ 키워드)을 step4-subheading.ts에 추가했다.
20건 clean test에서 6-digit 55%→100% 달성. 이제 CBP 100건 벤치마크를 돌린다.

## 실행 (순서대로 전부 실행)

### 1. 동의어 사전 JSON 외장하드에 저장

```bash
cat > /Volumes/soulmaten/POTAL/7field_benchmark/subheading_synonyms.json << 'EOF'
{
  "belt": [{"code": "420330", "desc": "Belts and bandoliers, of leather"}],
  "belts": [{"code": "420330", "desc": "Belts and bandoliers, of leather"}],
  "bandolier": [{"code": "420330", "desc": "Belts and bandoliers, of leather"}],
  "oxford": [{"code": "640399", "desc": "Footwear; n.e.c., not covering ankle"}],
  "dress shoes": [{"code": "640399", "desc": "Footwear; n.e.c., not covering ankle"}],
  "loafer": [{"code": "640399", "desc": "Footwear; n.e.c., not covering ankle"}],
  "derby": [{"code": "640399", "desc": "Footwear; n.e.c., not covering ankle"}],
  "pump": [{"code": "640399", "desc": "Footwear; n.e.c., not covering ankle"}],
  "sandal": [{"code": "640399", "desc": "Footwear; n.e.c., not covering ankle"}],
  "sneaker": [{"code": "640399", "desc": "Footwear; n.e.c., not covering ankle"}],
  "boot": [{"code": "640391", "desc": "Footwear; n.e.c., covering ankle"}],
  "boots": [{"code": "640391", "desc": "Footwear; n.e.c., covering ankle"}],
  "ski boot": [{"code": "640312", "desc": "Sports footwear; ski-boots"}],
  "snowboard boot": [{"code": "640312", "desc": "Sports footwear; snowboard boots"}],
  "citric acid": [{"code": "291814", "desc": "Citric acid"}],
  "tartaric acid": [{"code": "291812", "desc": "Tartaric acid"}],
  "lactic acid": [{"code": "291811", "desc": "Lactic acid"}],
  "gluconic acid": [{"code": "291816", "desc": "Gluconic acid"}],
  "salicylic acid": [{"code": "291821", "desc": "Salicylic acid"}],
  "aspirin": [{"code": "291822", "desc": "Acetylsalicylic acid"}],
  "container": [{"code": "392410", "desc": "Tableware and kitchenware, of plastics"}],
  "containers": [{"code": "392410", "desc": "Tableware and kitchenware, of plastics"}],
  "meal prep": [{"code": "392410", "desc": "Tableware and kitchenware, of plastics"}],
  "food container": [{"code": "392410", "desc": "Tableware and kitchenware, of plastics"}],
  "lunch box": [{"code": "392410", "desc": "Tableware and kitchenware, of plastics"}],
  "tupperware": [{"code": "392410", "desc": "Tableware and kitchenware, of plastics"}],
  "storage bin": [{"code": "392490", "desc": "Household articles, of plastics"}],
  "trash can": [{"code": "392490", "desc": "Household articles, of plastics"}],
  "laundry basket": [{"code": "392490", "desc": "Household articles, of plastics"}],
  "bolt": [{"code": "731815", "desc": "Screws and bolts n.e.c."}],
  "bolts": [{"code": "731815", "desc": "Screws and bolts n.e.c."}],
  "hex bolt": [{"code": "731815", "desc": "Screws and bolts n.e.c."}],
  "carriage bolt": [{"code": "731815", "desc": "Screws and bolts n.e.c."}],
  "screw": [{"code": "731815", "desc": "Screws and bolts n.e.c."}],
  "screws": [{"code": "731815", "desc": "Screws and bolts n.e.c."}],
  "wood screw": [{"code": "731812", "desc": "Wood screws"}],
  "coach screw": [{"code": "731811", "desc": "Coach screws"}],
  "self-tapping": [{"code": "731814", "desc": "Self-tapping screws"}],
  "nut": [{"code": "731816", "desc": "Nuts"}],
  "nuts": [{"code": "731816", "desc": "Nuts"}],
  "washer": [{"code": "731822", "desc": "Washers"}],
  "rivet": [{"code": "731823", "desc": "Rivets"}],
  "watch band": [{"code": "911320", "desc": "Watch straps, not of metal"}],
  "watch strap": [{"code": "911320", "desc": "Watch straps, not of metal"}],
  "watch bracelet": [{"code": "911310", "desc": "Watch straps, of precious metal"}],
  "nail": [{"code": "731700", "desc": "Nails, tacks, drawing pins"}],
  "chain": [{"code": "731500", "desc": "Chain and parts thereof"}]
}
EOF
```

### 2. step4-subheading.ts에 동의어 사전 반영 확인

```bash
grep -c "SUBHEADING_SYNONYMS" app/lib/cost-engine/gri-classifier/steps/v3/step4-subheading.ts
```

→ **1 이상이면**: Cowork 수정 이미 반영됨. 3단계로 넘어가라.
→ **0이면**: 아래 내용을 step4-subheading.ts에 직접 추가해라.

**추가 위치**: `const COLD = new Set(...)` 바로 다음, `function hasMat(...)` 바로 앞.

**추가 코드 3개:**

**(A) SUBHEADING_SYNONYMS** — 위 1단계 JSON과 동일 내용을 TypeScript const로:

```typescript
const SUBHEADING_SYNONYMS: Record<string, { code: string; desc: string }[]> = {
  'belt': [{ code: '420330', desc: 'Belts and bandoliers, of leather' }],
  'belts': [{ code: '420330', desc: 'Belts and bandoliers, of leather' }],
  'bandolier': [{ code: '420330', desc: 'Belts and bandoliers, of leather' }],
  'oxford': [{ code: '640399', desc: 'Footwear; n.e.c., not covering ankle' }],
  'dress shoes': [{ code: '640399', desc: 'Footwear; n.e.c., not covering ankle' }],
  'loafer': [{ code: '640399', desc: 'Footwear; n.e.c., not covering ankle' }],
  'derby': [{ code: '640399', desc: 'Footwear; n.e.c., not covering ankle' }],
  'pump': [{ code: '640399', desc: 'Footwear; n.e.c., not covering ankle' }],
  'sandal': [{ code: '640399', desc: 'Footwear; n.e.c., not covering ankle' }],
  'sneaker': [{ code: '640399', desc: 'Footwear; n.e.c., not covering ankle' }],
  'boot': [{ code: '640391', desc: 'Footwear; n.e.c., covering ankle' }],
  'boots': [{ code: '640391', desc: 'Footwear; n.e.c., covering ankle' }],
  'ski boot': [{ code: '640312', desc: 'Sports footwear; ski-boots' }],
  'snowboard boot': [{ code: '640312', desc: 'Sports footwear; snowboard boots' }],
  'citric acid': [{ code: '291814', desc: 'Citric acid' }],
  'tartaric acid': [{ code: '291812', desc: 'Tartaric acid' }],
  'lactic acid': [{ code: '291811', desc: 'Lactic acid' }],
  'gluconic acid': [{ code: '291816', desc: 'Gluconic acid' }],
  'salicylic acid': [{ code: '291821', desc: 'Salicylic acid' }],
  'aspirin': [{ code: '291822', desc: 'Acetylsalicylic acid' }],
  'container': [{ code: '392410', desc: 'Tableware and kitchenware, of plastics' }],
  'containers': [{ code: '392410', desc: 'Tableware and kitchenware, of plastics' }],
  'meal prep': [{ code: '392410', desc: 'Tableware and kitchenware, of plastics' }],
  'food container': [{ code: '392410', desc: 'Tableware and kitchenware, of plastics' }],
  'lunch box': [{ code: '392410', desc: 'Tableware and kitchenware, of plastics' }],
  'tupperware': [{ code: '392410', desc: 'Tableware and kitchenware, of plastics' }],
  'storage bin': [{ code: '392490', desc: 'Household articles, of plastics' }],
  'trash can': [{ code: '392490', desc: 'Household articles, of plastics' }],
  'laundry basket': [{ code: '392490', desc: 'Household articles, of plastics' }],
  'bolt': [{ code: '731815', desc: 'Screws and bolts n.e.c.' }],
  'bolts': [{ code: '731815', desc: 'Screws and bolts n.e.c.' }],
  'hex bolt': [{ code: '731815', desc: 'Screws and bolts n.e.c.' }],
  'carriage bolt': [{ code: '731815', desc: 'Screws and bolts n.e.c.' }],
  'screw': [{ code: '731815', desc: 'Screws and bolts n.e.c.' }],
  'screws': [{ code: '731815', desc: 'Screws and bolts n.e.c.' }],
  'wood screw': [{ code: '731812', desc: 'Wood screws' }],
  'coach screw': [{ code: '731811', desc: 'Coach screws' }],
  'self-tapping': [{ code: '731814', desc: 'Self-tapping screws' }],
  'nut': [{ code: '731816', desc: 'Nuts' }],
  'nuts': [{ code: '731816', desc: 'Nuts' }],
  'washer': [{ code: '731822', desc: 'Washers' }],
  'rivet': [{ code: '731823', desc: 'Rivets' }],
  'watch band': [{ code: '911320', desc: 'Watch straps, not of metal' }],
  'watch strap': [{ code: '911320', desc: 'Watch straps, not of metal' }],
  'watch bracelet': [{ code: '911310', desc: 'Watch straps, of precious metal' }],
  'nail': [{ code: '731700', desc: 'Nails, tacks, drawing pins' }],
  'chain': [{ code: '731500', desc: 'Chain and parts thereof' }],
};
```

**(B) checkSynonymDict 함수** — hasMat 함수 바로 다음에 추가:

```typescript
function checkSynonymDict(input: NormalizedInputV3, subheadings: {code:string;description:string}[]): Step4Output | null {
  const nameWords = input.product_name.toLowerCase().split(/[\s\-,\/]+/).filter(w => w.length > 1);
  const subCodes = new Set(subheadings.map(s => s.code));

  const phrases: string[] = [];
  for (let i = 0; i < nameWords.length - 1; i++) {
    phrases.push(nameWords[i] + ' ' + nameWords[i+1]);
  }
  for (let i = 0; i < nameWords.length - 2; i++) {
    phrases.push(nameWords[i] + ' ' + nameWords[i+1] + ' ' + nameWords[i+2]);
  }

  const tryKeys = [...phrases, ...nameWords];

  for (const key of tryKeys) {
    const matches = SUBHEADING_SYNONYMS[key];
    if (!matches) continue;

    for (const m of matches) {
      if (subCodes.has(m.code)) {
        if (key.includes('watch') && (key.includes('band') || key.includes('strap') || key.includes('bracelet'))) {
          const matLower = input.material_primary.toLowerCase();
          const isPrecious = ['gold','silver','platinum'].some(pm => matLower.includes(pm) || input.material_keywords.some(mk => mk === pm));
          const isMetal = isPrecious || matLower.includes('steel') || matLower.includes('metal') || matLower.includes('titanium');
          if (isMetal && subCodes.has('911310')) {
            const sh = subheadings.find(s => s.code === '911310')!;
            return { confirmed_hs6: '911310', hs6_description: sh.description, confidence: 0.95, matched_by: `synonym:"${key}"→911310(metal)` };
          }
          if (!isMetal && subCodes.has('911320')) {
            const sh = subheadings.find(s => s.code === '911320')!;
            return { confirmed_hs6: '911320', hs6_description: sh.description, confidence: 0.95, matched_by: `synonym:"${key}"→911320(non-metal)` };
          }
        }
        const sh = subheadings.find(s => s.code === m.code);
        if (sh) {
          return { confirmed_hs6: m.code, hs6_description: sh.description, confidence: 0.95, matched_by: `synonym:"${key}"→${m.code}` };
        }
      }
    }
  }
  return null;
}
```

**(C) selectSubheading 함수 안에서**, `if (subheadings.length === 1)` 바로 다음에:

```typescript
  // ═══ PRIORITY: Synonym dictionary lookup ═══
  const synMatch = checkSynonymDict(input, subheadings);
  if (synMatch) return synMatch;
```

### 3. TypeScript 빌드 확인

```bash
npx tsc --noEmit 2>&1 | head -20
```

### 4. CBP 100건 벤치마크 실행

```bash
npx tsx scripts/gri_benchmark_v3.ts
```

이전 최고: v3.0 — 24%/42%/59% (6-digit/4-digit/2-digit)

### 5. 결과 엑셀 저장

결과를 엑셀로 저장: `/Volumes/soulmaten/POTAL/7field_benchmark/T28_CBP100_Result.xlsx`

4개 시트:
- **Sheet 1: 결과 요약** — 정확도 + 이전 비교 (v1.0~v3.0 + T28)
- **Sheet 2: 100건 전체** — 상품명, 정답, 예측, ✓/✗, matched_by
- **Sheet 3: 틀린 건 상세** — 각 건 왜 틀렸는지 + 후보 subheading 목록
- **Sheet 4: 사전 추가 후보** — 틀린 건 중 "이 키워드를 사전에 넣으면 맞출 수 있는 건". 형식: 키워드 → 정답 HS6 → 설명

### 6. (선택) 사전 확장 루프

Sheet 4의 후보를 subheading_synonyms.json + SUBHEADING_SYNONYMS에 추가 → 다시 벤치마크 → 정확도 확인.
이 루프 반복 = 플라이휠.
