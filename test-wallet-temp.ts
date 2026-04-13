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

const baseInput: any = {
  product_name: 'wallet',
  material_primary: 'leather',
  material_keywords: ['leather'],
  origin_country: 'IT',
  destination_country: 'US',
  category_tokens: ['leather', 'goods'],
  description_tokens: [],
  processing_states: [],
  composition_parsed: [],
  weight_value: 0,
  weight_unit: '',
  price_value: 0,
  price_currency: '',
  is_alloy: false,
  outsole_material: '',
};

console.log('=== TEST 1: description 없음 ===');
const r1 = selectSubheading(baseInput, '4202', subs4202);
console.log('HS6:', r1.confirmed_hs6, '| Confidence:', r1.confidence, '| By:', r1.matched_by);

console.log('\n=== TEST 2: description에 "small item carried in pocket for money" ===');
const r2 = selectSubheading({ ...baseInput, description_tokens: ['small', 'item', 'carried', 'pocket', 'holding', 'money', 'cards'] }, '4202', subs4202);
console.log('HS6:', r2.confirmed_hs6, '| Confidence:', r2.confidence, '| By:', r2.matched_by);

console.log('\n=== TEST 3: description에 "pocket handbag accessory" ===');
const r3 = selectSubheading({ ...baseInput, description_tokens: ['pocket', 'handbag', 'accessory'] }, '4202', subs4202);
console.log('HS6:', r3.confirmed_hs6, '| Confidence:', r3.confidence, '| By:', r3.matched_by);
