/**
 * v3 Step 4 — Subheading (6-digit)
 * HYBRID: elimination for similar subheadings, voting for different ones.
 * Tag-based routing per heading.
 */

import type { NormalizedInputV3 } from '../../types';
import { getSubheadingConditions } from '../../data/codified-subheadings';
import { HEADING_METHOD_TAGS } from '../../data/heading-method-tags';

export interface Step4Output {
  confirmed_hs6: string;
  hs6_description: string;
  confidence: number;
  matched_by: string;
}

function fuzzy(a: string, b: string): boolean {
  const al = a.toLowerCase(), bl = b.toLowerCase();
  if (al === bl) return true;
  if (Math.abs(al.length - bl.length) > 2) return false;
  const s = al.length <= bl.length ? al : bl;
  const l = al.length > bl.length ? al : bl;
  return l.startsWith(s);
}

function isNEC(d: string): boolean {
  const dl = d.toLowerCase();
  return dl.includes('n.e.c.') || dl.includes('n.e.s.') || dl.includes('not elsewhere');
}

const MAT_SYN: Record<string, string[]> = {
  cotton:['cotton'], wool:['wool','merino','cashmere','fine animal hair'],
  silk:['silk'], synthetic:['synthetic','man-made','polyester','nylon','acrylic'],
  flax:['flax','linen'], rubber:['rubber','vulcanised','vulcanized'],
  plastic:['plastic','plastics'], glass:['glass'], leather:['leather','calfskin','cowhide','suede'],
  wood:['wood','bamboo'], iron:['iron','steel','stainless'],
  copper:['copper','brass','bronze'], aluminum:['aluminum','aluminium'],
  paper:['paper','paperboard','cardboard'], ceramic:['ceramic','stoneware','porcelain','china'],
  precious:['gold','silver','platinum','precious metal'],
};
const COLD = new Set(['NO','IS','CA','DK','RU','GL','FO','SE','FI','UK','GB']);

// ═══ SUBHEADING SYNONYM DICTIONARY ═══
// Priority lookup: seller product keywords → confirmed 6-digit HS code
// Checked FIRST before elimination/voting. Flywheel: grows over time.
const SUBHEADING_SYNONYMS: Record<string, { code: string; desc: string }[]> = {
  // Ch.42 — Leather goods
  'belt': [{ code: '420330', desc: 'Belts and bandoliers, of leather' }],
  'belts': [{ code: '420330', desc: 'Belts and bandoliers, of leather' }],
  'bandolier': [{ code: '420330', desc: 'Belts and bandoliers, of leather' }],
  // Ch.64 — Footwear
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
  // Ch.29 — Organic chemistry
  'citric acid': [{ code: '291814', desc: 'Citric acid' }],
  'tartaric acid': [{ code: '291812', desc: 'Tartaric acid' }],
  'lactic acid': [{ code: '291811', desc: 'Lactic acid' }],
  'gluconic acid': [{ code: '291816', desc: 'Gluconic acid' }],
  'salicylic acid': [{ code: '291821', desc: 'Salicylic acid' }],
  'aspirin': [{ code: '291822', desc: 'Acetylsalicylic acid' }],
  // Ch.39 — Plastics
  'container': [{ code: '392410', desc: 'Tableware and kitchenware, of plastics' }],
  'containers': [{ code: '392410', desc: 'Tableware and kitchenware, of plastics' }],
  'meal prep': [{ code: '392410', desc: 'Tableware and kitchenware, of plastics' }],
  'food container': [{ code: '392410', desc: 'Tableware and kitchenware, of plastics' }],
  'lunch box': [{ code: '392410', desc: 'Tableware and kitchenware, of plastics' }],
  'tupperware': [{ code: '392410', desc: 'Tableware and kitchenware, of plastics' }],
  'storage bin': [{ code: '392490', desc: 'Household articles, of plastics' }],
  'trash can': [{ code: '392490', desc: 'Household articles, of plastics' }],
  'laundry basket': [{ code: '392490', desc: 'Household articles, of plastics' }],
  // Ch.73 — Iron/steel articles
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
  // Ch.91 — Watches
  'watch band': [{ code: '911320', desc: 'Watch straps, not of metal' }],
  'watch strap': [{ code: '911320', desc: 'Watch straps, not of metal' }],
  'watch bracelet': [{ code: '911310', desc: 'Watch straps, of precious metal' }],
  // Additional common products
  'nail': [{ code: '731700', desc: 'Nails, tacks, drawing pins' }],
  'chain': [{ code: '731500', desc: 'Chain and parts thereof' }],
};

function hasMat(mats: string[], group: string): boolean {
  const syns = MAT_SYN[group] || [group];
  return mats.some(m => syns.some(s => fuzzy(m, s)));
}

// ═══ SYNONYM DICTIONARY LOOKUP ═══
function checkSynonymDict(input: NormalizedInputV3, subheadings: {code:string;description:string}[]): Step4Output | null {
  const nameWords = input.product_name.toLowerCase().split(/[\s\-,\/]+/).filter(w => w.length > 1);
  const allText = [input.product_name, ...input.category_tokens, ...input.description_tokens].join(' ').toLowerCase();
  const subCodes = new Set(subheadings.map(s => s.code));

  // Try multi-word phrases first (longer = more specific)
  const phrases = [];
  for (let i = 0; i < nameWords.length - 1; i++) {
    phrases.push(nameWords[i] + ' ' + nameWords[i+1]);
  }
  // Also try 3-word phrases
  for (let i = 0; i < nameWords.length - 2; i++) {
    phrases.push(nameWords[i] + ' ' + nameWords[i+1] + ' ' + nameWords[i+2]);
  }

  const tryKeys = [...phrases, ...nameWords];

  for (const key of tryKeys) {
    const matches = SUBHEADING_SYNONYMS[key];
    if (!matches) continue;

    // For keys with multiple possible codes, use context to disambiguate
    for (const m of matches) {
      if (subCodes.has(m.code)) {
        // Special case: watch band/strap — check if metal
        if (key.includes('watch') && (key.includes('band') || key.includes('strap') || key.includes('bracelet'))) {
          const matLower = input.material_primary.toLowerCase();
          const isPrecious = ['gold','silver','platinum'].some(pm => matLower.includes(pm) || input.material_keywords.some(mk => mk === pm));
          const isMetal = isPrecious || matLower.includes('steel') || matLower.includes('metal') || matLower.includes('titanium');
          if (isMetal && subCodes.has('911310')) {
            const sh = subheadings.find(s => s.code === '911310')!;
            return { confirmed_hs6: '911310', hs6_description: sh.description, confidence: 1.0, matched_by: `synonym:"${key}"→911310(metal)` };
          }
          if (!isMetal && subCodes.has('911320')) {
            const sh = subheadings.find(s => s.code === '911320')!;
            return { confirmed_hs6: '911320', hs6_description: sh.description, confidence: 1.0, matched_by: `synonym:"${key}"→911320(non-metal)` };
          }
        }

        const sh = subheadings.find(s => s.code === m.code);
        if (sh) {
          return { confirmed_hs6: m.code, hs6_description: sh.description, confidence: 1.0, matched_by: `synonym:"${key}"→${m.code}` };
        }
      }
    }
  }

  return null;
}

// ═══ ELIMINATION ENGINE ═══
function runElimination(input: NormalizedInputV3, subs: {code:string;description:string}[]): {code:string;description:string;eliminated:boolean}[] {
  const inputMats = [input.material_primary,...input.material_keywords,...input.composition_parsed.map(c=>c.material)].map(m=>m.toLowerCase());
  const proc = input.processing_states.map(p=>p.toLowerCase());

  const results = subs.map(s => ({...s, eliminated: false}));

  const matPats: [RegExp,string][] = [
    [/\bof cotton\b/,'cotton'],[/\bof wool\b|\bfine animal hair\b/,'wool'],[/\bof silk\b/,'silk'],
    [/\bof synthetic\b|\bman-made\b/,'synthetic'],[/\bof flax\b|\bof linen\b/,'flax'],
    [/\bof rubber\b/,'rubber'],[/\bof plastics?\b/,'plastic'],[/\bof glass\b/,'glass'],
    [/\bof leather\b|\bcalfskin\b/,'leather'],[/\bof wood\b|\bof bamboo\b/,'wood'],
    [/\bof iron\b|\bof steel\b|\bstainless\b/,'iron'],[/\bof copper\b/,'copper'],
    [/\bof alumini?um\b/,'aluminum'],[/\bporcelain\b|\bchina\b/,'ceramic'],
    [/\bprecious metal\b/,'precious'],
  ];

  for (const r of results) {
    if (r.eliminated || isNEC(r.description)) continue;
    const dl = r.description.toLowerCase();

    // material elimination
    for (const [re,group] of matPats) {
      if (re.test(dl) && !hasMat(inputMats,group)) { r.eliminated=true; break; }
    }
    if (r.eliminated) continue;

    // alloy elimination
    if (/\bnon-alloy\b|\bnot alloyed\b/.test(dl) && input.is_alloy) { r.eliminated=true; continue; }
    if (/\balloyed?\b/.test(dl) && !/\bnon-alloy/.test(dl) && dl.includes('alloy') && !input.is_alloy) { r.eliminated=true; continue; }

    // outsole elimination
    if (dl.includes('outer soles of leather') && input.outsole_material && input.outsole_material !== 'leather') { r.eliminated=true; continue; }
    if (dl.includes('outer soles of rubber') && input.outsole_material && input.outsole_material !== 'rubber') { r.eliminated=true; continue; }

    // processing elimination
    const procPats: [RegExp,string,boolean][] = [
      [/\bnot roasted\b/,'roasted',true],[/\broasted\b(?!.*not)/,'roasted',false],
      [/\bnot decaffeinated\b/,'decaffeinated',true],[/\bdecaffeinated\b(?!.*not)/,'decaffeinated',false],
      [/\bfrozen\b/,'frozen',false],[/\bfresh\b/,'fresh',false],[/\blive\b/,'live',false],
      [/\bdried\b/,'dried',false],[/\bsmoked\b/,'smoked',false],
    ];
    for (const [re,field,neg] of procPats) {
      if (re.test(dl)) {
        const has = proc.some(p => fuzzy(p,field));
        if (neg ? has : !has) { r.eliminated=true; }
        break;
      }
    }
    if (r.eliminated) continue;

    // origin elimination (cold/warm water)
    if (dl.includes('cold-water') && !COLD.has(input.origin_country)) { r.eliminated=true; continue; }
    if ((dl.includes('excluding cold-water') || dl.includes('excluding cold water')) && COLD.has(input.origin_country)) { r.eliminated=true; continue; }

    // product keyword elimination
    const prodKws: Record<string,string[]> = {
      lobster:['lobster','lobsters'], crab:['crab','crabs'],
      shrimp:['shrimp','shrimps','prawn','prawns'],
      'coach screw':['coach'], 'self-tapping':['self-tapping'],
      sport:['sport','sports','ski','snowboard'],
    };
    const allWords = [...input.product_name.toLowerCase().split(/[\s\-,\/]+/),...input.category_tokens,...input.description_tokens];
    for (const [concept,kws] of Object.entries(prodKws)) {
      if (kws.some(k => dl.includes(k)) && !kws.some(k => allWords.some(w => fuzzy(w,k)))) { r.eliminated=true; break; }
    }
  }
  return results;
}

// ═══ VOTING ENGINE ═══
function runVoting(input: NormalizedInputV3, subs: {code:string;description:string}[]): {code:string;description:string;votes:number}[] {
  const inputMats = [input.material_primary,...input.material_keywords,...input.composition_parsed.map(c=>c.material)].map(m=>m.toLowerCase());
  const proc = input.processing_states.map(p=>p.toLowerCase());
  const allWords = [...input.product_name.toLowerCase().split(/[\s\-,\/]+/).filter(w=>w.length>2),
    ...input.category_tokens,...input.description_tokens.filter(w=>w.length>2)];

  const matPats: [RegExp,string][] = [
    [/\bof cotton\b/,'cotton'],[/\bof wool\b/,'wool'],[/\bof silk\b/,'silk'],
    [/\bof synthetic\b|\bman-made\b/,'synthetic'],[/\bof rubber\b/,'rubber'],
    [/\bof plastics?\b/,'plastic'],[/\bof glass\b/,'glass'],
    [/\bof leather\b|\bcalfskin\b/,'leather'],[/\bof wood\b|\bof bamboo\b/,'wood'],
    [/\bof iron\b|\bof steel\b/,'iron'],[/\bof copper\b/,'copper'],
    [/\bof alumini?um\b/,'aluminum'],[/\bporcelain\b|\bchina\b/,'ceramic'],
    [/\bprecious metal\b/,'precious'],
  ];

  return subs.map(s => {
    const dl = s.description.toLowerCase();
    let votes = 0;

    // material vote
    for (const [re,group] of matPats) { if (re.test(dl) && hasMat(inputMats,group)) { votes++; break; } }
    // alloy vote
    if (/\bnon-alloy\b/.test(dl) && !input.is_alloy) votes++;
    if (/\balloyed?\b/.test(dl) && !/\bnon-alloy/.test(dl) && input.is_alloy) votes++;
    // processing vote
    const procP: [RegExp,string,boolean][] = [
      [/\bnot roasted\b/,'roasted',true],[/\broasted\b(?!.*not)/,'roasted',false],
      [/\bnot decaffeinated\b/,'decaffeinated',true],[/\bdecaffeinated\b(?!.*not)/,'decaffeinated',false],
      [/\bfrozen\b/,'frozen',false],[/\bfresh\b/,'fresh',false],[/\bdried\b/,'dried',false],
    ];
    for (const [re,field,neg] of procP) {
      if (re.test(dl)) { const has=proc.some(p=>fuzzy(p,field)); if(neg?!has:has) votes++; break; }
    }
    // origin vote
    if (dl.includes('cold-water') && COLD.has(input.origin_country)) votes++;
    if ((dl.includes('excluding cold-water')||(!dl.includes('cold-water')&&(dl.includes('shrimp')||dl.includes('prawn')))) && !COLD.has(input.origin_country)) votes++;
    // keyword vote (no votes for n.e.c.)
    if (!isNEC(s.description)) {
      const dlWords = dl.split(/[\s;,()]+/);
      for (const w of allWords) { if (dlWords.some(dw => fuzzy(w,dw))) { votes++; break; } }
    }

    return { code: s.code, description: s.description, votes };
  });
}

// ═══ MAIN ═══
export function selectSubheading(
  input: NormalizedInputV3,
  confirmedHeading: string,
  subheadings: { code: string; description: string }[]
): Step4Output {
  if (subheadings.length === 0) return { confirmed_hs6: confirmedHeading+'00', hs6_description: '', confidence: 0, matched_by: 'none' };
  if (subheadings.length === 1) return { confirmed_hs6: subheadings[0].code, hs6_description: subheadings[0].description, confidence: 1.0, matched_by: 'single' };

  // ═══ PRIORITY: Synonym dictionary lookup ═══
  const synMatch = checkSynonymDict(input, subheadings);
  if (synMatch) return synMatch;

  const tag = HEADING_METHOD_TAGS[confirmedHeading] || { method: 'both' as const, similarity: 0.5 };
  const log: string[] = [`tag:${tag.method}(${tag.similarity})`];

  let bestCode = '';
  let bestDesc = '';
  let confidence = 0;

  if (tag.method === 'elimination' || tag.method === 'both') {
    const elimResults = runElimination(input, subheadings);
    const survivors = elimResults.filter(r => !r.eliminated);
    log.push(`elim:${subheadings.length}→${survivors.length}`);

    if (survivors.length === 1) {
      return { confirmed_hs6: survivors[0].code, hs6_description: survivors[0].description, confidence: 1.0, matched_by: log.join('→') + '→single_survivor' };
    }

    if (survivors.length === 0) {
      const nec = subheadings.find(s => isNEC(s.description));
      if (nec) return { confirmed_hs6: nec.code, hs6_description: nec.description, confidence: 0.5, matched_by: log.join('→') + '→all_elim_nec' };
    }

    // If elimination narrows but not to 1, continue to voting with survivors
    if (survivors.length > 1 && tag.method === 'elimination') {
      // Among survivors, pick non-NEC with keyword match
      const allWords = [...input.product_name.toLowerCase().split(/[\s\-,\/]+/).filter(w=>w.length>2),...input.category_tokens,...input.description_tokens.filter(w=>w.length>2)];
      const scored = survivors.map(s => {
        const dl = s.description.toLowerCase();
        let sc = isNEC(s.description) ? -1 : 0;
        for (const w of allWords) { if (dl.includes(w)) sc++; }
        return { ...s, sc };
      }).sort((a,b) => b.sc - a.sc);

      if (scored[0].sc > 0) {
        return { confirmed_hs6: scored[0].code, hs6_description: scored[0].description, confidence: 0.7, matched_by: log.join('→') + `→elim_kw(${scored[0].sc})` };
      }
      const nec = survivors.find(s => isNEC(s.description));
      if (nec) return { confirmed_hs6: nec.code, hs6_description: nec.description, confidence: 0.5, matched_by: log.join('→') + '→elim_nec' };
      return { confirmed_hs6: scored[0].code, hs6_description: scored[0].description, confidence: 0.4, matched_by: log.join('→') + '→elim_first' };
    }
  }

  if (tag.method === 'voting' || tag.method === 'both') {
    const voteResults = runVoting(input, subheadings).sort((a,b) => b.votes - a.votes);
    const top = voteResults[0];
    const second = voteResults[1];
    const gap = top.votes - (second?.votes || 0);
    log.push(`vote:top=${top.votes},gap=${gap}`);

    if (gap >= 2 && top.votes > 0) {
      return { confirmed_hs6: top.code, hs6_description: top.description, confidence: 1.0, matched_by: log.join('→') + '→vote_clear' };
    }

    if (top.votes > 0) {
      // Prefer non-NEC
      if (isNEC(top.description) && second && !isNEC(second.description) && second.votes > 0) {
        return { confirmed_hs6: second.code, hs6_description: second.description, confidence: 0.6, matched_by: log.join('→') + '→vote_prefer_nonNEC' };
      }
      return { confirmed_hs6: top.code, hs6_description: top.description, confidence: Math.min(0.4 + top.votes * 0.1, 0.8), matched_by: log.join('→') + '→vote_top' };
    }
  }

  // Last resort: n.e.c. or last subheading
  const nec = subheadings.find(s => isNEC(s.description));
  if (nec) return { confirmed_hs6: nec.code, hs6_description: nec.description, confidence: 0.4, matched_by: log.join('→') + '→nec_last' };
  const last = subheadings[subheadings.length - 1];
  return { confirmed_hs6: last.code, hs6_description: last.description, confidence: 0.2, matched_by: log.join('→') + '→last' };
}
