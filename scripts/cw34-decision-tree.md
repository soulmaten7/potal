# CW34: heading 4202 Decision Tree 추가

## 작업: step4-subheading.ts에 heading 4202 전용 decision tree 함수 추가

### 위치: app/lib/cost-engine/gri-classifier/steps/v3/step4-subheading.ts

### 1. checkSynonymDict 함수 바로 앞에 새 함수 추가: checkDecisionTree()

```typescript
// ═══ DECISION TREE — WCO 분류 기준 코드화 ═══
// WCO Explanatory Notes의 분류 기준을 rule로 변환.
// Heading별로 WCO가 실제 사용하는 분류 축(article type + material surface)을 적용.
function checkDecisionTree(
  input: NormalizedInputV3,
  heading: string,
  subheadings: {code:string;description:string}[]
): Step4Output | null {
  const nameLower = input.product_name.toLowerCase();
  const allText = [nameLower, ...input.category_tokens, ...input.description_tokens].join(' ');
  const subCodes = new Set(subheadings.map(s => s.code));

  // ── Heading 4202: Article type + Material surface ──
  if (heading === '4202') {
    // Step 1: Article type 분류 (WCO Explanatory Notes 기준)
    // Group 1: 42021x — 대형 컨테이너
    const group1 = /\b(trunk|suitcase|suit-case|vanity.?case|executive.?case|brief.?case|briefcase|school.?satchel|attache|luggage|travel.?bag|duffle|duffel)\b/;
    // Group 2: 42022x — 핸드백
    const group2 = /\b(handbag|hand.?bag|shoulder.?bag|tote.?bag|tote|cross.?body|hobo.?bag|clutch.?bag|evening.?bag)\b/;
    // Group 3: 42023x — 주머니/핸드백에 넣고 다니는 물품 (WCO EN: "wallets, purses, key-cases, cigarette-cases, spectacle cases, etc.")
    const group3 = /\b(wallet|billfold|card.?holder|card.?case|coin.?purse|key.?case|key.?holder|cigarette.?case|spectacle.?case|glasses.?case|eyeglass|sunglasses.?case|tobacco.?pouch|change.?purse|money.?clip|passport.?holder|passport.?cover|id.?holder|badge.?holder|makeup.?bag|cosmetic.?bag|cosmetic.?case|pencil.?case|pen.?case|phone.?case|phone.?pouch|small.?pouch|purse)\b/;

    let group = 0;
    if (group1.test(allText)) group = 1;
    else if (group2.test(allText)) group = 2;
    else if (group3.test(allText)) group = 3;
    else return null; // 결정 불가 → 기존 voting으로 fallback

    // Step 2: Material surface 분류
    const matLower = [input.material_primary, ...input.material_keywords].join(' ').toLowerCase();
    let matSuffix = '9'; // default: other
    if (/\bleather\b|\bcalfskin\b|\bcowhide\b|\bsuede\b|\bnubuck\b|\bpatent\b/.test(matLower)) {
      matSuffix = '1';
    } else if (/\bplastic\b|\bnylon\b|\bcanvas\b|\btextile\b|\bfabric\b|\bpolyester\b/.test(matLower)) {
      matSuffix = '2';
    }

    const targetCode = `4202${group}${matSuffix}`;
    if (subCodes.has(targetCode)) {
      const sh = subheadings.find(s => s.code === targetCode)!;
      return {
        confirmed_hs6: targetCode,
        hs6_description: sh.description,
        confidence: 1.0,
        matched_by: `decision_tree:4202→group${group}+mat${matSuffix}`
      };
    }
  }

  return null; // 이 heading에 대한 decision tree 없음 → 기존 로직으로
}
```

### 2. MAIN 함수(selectSubheading)에서 synonym 다음, elimination/voting 전에 호출 삽입

현재 (약 287-289줄):
```
  const synMatch = checkSynonymDict(input, subheadings);
  if (synMatch) return synMatch;
```

이 아래에 추가:
```
  const treeMatch = checkDecisionTree(input, confirmedHeading, subheadings);
  if (treeMatch) return treeMatch;
```

### 3. 테스트 + Regression

수정 후:
1. `npm run build` → 475 pages 확인
2. 프로젝트 루트에 임시 테스트 파일 `test-decision-tree-temp.ts` 생성:

```typescript
import { selectSubheading } from './app/lib/cost-engine/gri-classifier/steps/v3/step4-subheading';

const subs4202 = [
  { code: '420211', description: 'Trunks, suit-cases, vanity-cases, executive-cases, brief-cases, school satchels and similar containers; with outer surface of leather, of composition leather or of patent leather' },
  { code: '420212', description: 'Trunks, suit-cases, vanity-cases, executive-cases, brief-cases, school satchels and similar containers; with outer surface of plastics or of textile materials' },
  { code: '420219', description: 'Trunks, suit-cases, vanity-cases, executive-cases, brief-cases, school satchels and similar containers; other' },
  { code: '420221', description: 'Handbags, whether or not with shoulder strap, including those without handle; with outer surface of leather, of composition leather or of patent leather' },
  { code: '420222', description: 'Handbags, whether or not with shoulder strap, including those without handle; with outer surface of sheeting of plastics or of textile materials' },
  { code: '420229', description: 'Handbags, whether or not with shoulder strap, including those without handle; other' },
  { code: '420231', description: 'Articles of a kind normally carried in the pocket or in the handbag; with outer surface of leather, of composition leather or of patent leather' },
  { code: '420232', description: 'Articles of a kind normally carried in the pocket or in the handbag; with outer surface of sheeting of plastics or of textile materials' },
  { code: '420239', description: 'Articles of a kind normally carried in the pocket or in the handbag; other' },
  { code: '420291', description: 'Other; with outer surface of leather, of composition leather or of patent leather' },
  { code: '420292', description: 'Other; with outer surface of sheeting of plastics or of textile materials' },
  { code: '420299', description: 'Other' },
];

const mkInput = (name: string, mat: string, catTokens: string[] = ['leather','goods'], descTokens: string[] = []): any => ({
  product_name: name,
  material_primary: mat,
  material_keywords: [mat],
  origin_country: 'IT',
  destination_country: 'US',
  category_tokens: catTokens,
  description_tokens: descTokens,
  processing_states: [],
  composition_parsed: [],
  weight_value: 0, weight_unit: '',
  price_value: 0, price_currency: '',
  is_alloy: false, outsole_material: '',
});

const tests = [
  { name: 'wallet', mat: 'leather', expect: '420231' },
  { name: 'leather handbag', mat: 'leather', expect: '420221' },
  { name: 'briefcase', mat: 'leather', expect: '420211' },
  { name: 'card holder', mat: 'leather', expect: '420231' },
  { name: 'coin purse', mat: 'nylon', expect: '420232' },
  { name: 'tote bag', mat: 'canvas', expect: '420222' },
  { name: 'suitcase', mat: 'plastic', expect: '420212' },
  { name: 'passport holder', mat: 'leather', expect: '420231' },
];

let pass = 0;
for (const t of tests) {
  const r = selectSubheading(mkInput(t.name, t.mat), '4202', subs4202);
  const ok = r.confirmed_hs6 === t.expect;
  if (ok) pass++;
  console.log(`${ok ? '✅' : '❌'} ${t.name} (${t.mat}) → ${r.confirmed_hs6} (expect ${t.expect}) | ${r.matched_by}`);
}
console.log(`\n${pass}/${tests.length} passed`);
```

3. `npx tsx test-decision-tree-temp.ts` → 8/8 확인
4. `verify-cw32` 28/28 확인
5. `verify-cw33` 23/23 확인
6. `rm test-decision-tree-temp.ts` 정리
