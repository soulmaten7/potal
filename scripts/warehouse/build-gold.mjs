#!/usr/bin/env node
/**
 * CW34-S3-D Gold Business Rules
 *
 * Silver → Gold 변환. 3 Silver JOIN + business rules:
 *   1. unified.jsonl (572K) — base records
 *   2. ebti_enrichment.jsonl (269K) — LEFT JOIN by ruling_id ↔ join_key
 *   3. cross_enrichment.jsonl (39K) — LEFT JOIN by ruling_id ↔ join_key
 *
 * Business rules applied:
 *   - rule_split: multi-HS in full_text → separate rows
 *   - conditional_rules: regex extraction from text
 *   - 10 Field: material/composition/form/use keyword matching
 *   - status: valid_to-based expired/historical (EBTI all "invalid" → remap)
 *   - HS version: ruling_date-based HS2007/2012/2017/2022
 *   - confidence: HS version penalty + field completeness
 *   - dedupe: source+ruling_id+hs_code
 *
 * Output: /Volumes/soulmaten/POTAL/warehouse/gold/customs_rulings.jsonl
 */

import fs from 'node:fs';
import readline from 'node:readline';

const SILVER = '/Volumes/soulmaten/POTAL/warehouse/silver';
const GOLD = '/Volumes/soulmaten/POTAL/warehouse/gold';

fs.mkdirSync(GOLD, { recursive: true });

// ─── Step 0: Load enrichment maps into memory ───

console.log('━━ CW34-S3-D Gold Business Rules ━━\n');
console.log('▸ Loading enrichment maps...');

function loadJsonlMap(filepath, keyField) {
  const map = new Map();
  if (!fs.existsSync(filepath)) return map;
  const lines = fs.readFileSync(filepath, 'utf-8').split('\n').filter(l => l.trim());
  for (const l of lines) {
    try {
      const obj = JSON.parse(l);
      const key = obj[keyField];
      if (key) map.set(key, obj);
    } catch {}
  }
  return map;
}

const ebtiMap = loadJsonlMap(`${SILVER}/ebti_enrichment.jsonl`, 'join_key');
const crossMap = loadJsonlMap(`${SILVER}/cross_enrichment.jsonl`, 'join_key');
console.log(`  EBTI enrichment: ${ebtiMap.size.toLocaleString()} entries`);
console.log(`  CROSS enrichment: ${crossMap.size.toLocaleString()} entries`);

// ─── CW35-S1: Multilingual Material/Form/Use Keywords ───
// Languages: EN + DE + FR + IT + NL + PL + ES + CS + SV + HU
// Total: ~300 synonym patterns across 40 materials + 35 forms + 20 uses

function buildMultilangRegex(allTerms) {
  const escaped = allTerms.map(t => t.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'));
  return new RegExp(`\\b(?:${escaped.join('|')})\\b`, 'i');
}

const MATERIAL_DICT = {
  // Fiber / Textile
  cotton:    ['cotton', 'baumwolle', 'coton', 'cotone', 'katoen', 'bawełna', 'algodón', 'bavlna', 'bomull', 'pamut'],
  wool:      ['wool', 'wolle', 'laine', 'lana', 'wol', 'wełna', 'ull', 'gyapjú'],
  silk:      ['silk', 'seide', 'soie', 'seta', 'zijde', 'jedwab', 'seda', 'hedvábí', 'silke'],
  linen:     ['linen', 'leinen', 'lin', 'lino', 'linnen', 'len', 'lino'],
  polyester: ['polyester', 'polyester', 'polyester', 'poliestere', 'poliéster'],
  nylon:     ['nylon', 'nylon', 'nailon', 'nylón'],
  viscose:   ['viscose', 'viskose', 'viscose', 'viscosa'],
  acrylic:   ['acrylic', 'acryl', 'acrylique', 'acrilico', 'akryl'],
  spandex:   ['spandex', 'elastan', 'élasthanne', 'elastan', 'elastaan'],
  rayon:     ['rayon', 'rayon', 'rayonne'],
  cashmere:  ['cashmere', 'kaschmir', 'cachemire', 'cashmere'],
  mohair:    ['mohair', 'mohair', 'mohair'],
  hemp:      ['hemp', 'hanf', 'chanvre', 'canapa', 'hennep', 'konopie'],
  jute:      ['jute', 'jute', 'jute', 'iuta'],
  flax:      ['flax', 'flachs', 'lin', 'lino'],
  // Leather / Animal
  leather:   ['leather', 'leder', 'cuir', 'pelle', 'leer', 'skóra', 'cuero', 'kůže', 'läder', 'bőr'],
  suede:     ['suede', 'wildleder', 'daim', 'scamosciato', 'suède'],
  fur:       ['fur', 'pelz', 'fourrure', 'pelliccia', 'bont', 'futro'],
  // Metal
  steel:     ['steel', 'stahl', 'acier', 'acciaio', 'staal', 'stal', 'acero', 'ocel', 'stål'],
  'stainless steel': ['stainless steel', 'edelstahl', 'rostfreier stahl', 'acier inoxydable', 'acciaio inossidabile', 'roestvrij staal', 'nierdzewn'],
  iron:      ['iron', 'eisen', 'fer', 'ferro', 'ijzer', 'żelazo', 'hierro', 'järn', 'vas'],
  aluminum:  ['aluminum', 'aluminium', 'aluminium', 'alluminio', 'aluminium', 'hliník'],
  copper:    ['copper', 'kupfer', 'cuivre', 'rame', 'koper', 'miedź', 'cobre', 'měď', 'koppar', 'réz'],
  brass:     ['brass', 'messing', 'laiton', 'ottone', 'messing'],
  zinc:      ['zinc', 'zink', 'zinc', 'zinco', 'zink', 'cynk'],
  nickel:    ['nickel', 'nickel', 'nickel', 'nichel'],
  tin:       ['tin', 'zinn', 'étain', 'stagno', 'cín'],
  titanium:  ['titanium', 'titan', 'titane', 'titanio'],
  // Plastic / Polymer
  plastic:   ['plastic', 'kunststoff', 'plastique', 'plastica', 'plastik', 'plast', 'műanyag'],
  rubber:    ['rubber', 'gummi', 'caoutchouc', 'gomma', 'rubber', 'guma', 'caucho', 'kaučuk', 'gummi'],
  pvc:       ['pvc', 'pvc', 'pvc'],
  polyurethane: ['polyurethane', 'polyurethan', 'polyuréthane', 'poliuretano'],
  silicone:  ['silicone', 'silikon', 'silicone', 'silicone'],
  neoprene:  ['neoprene', 'neopren', 'néoprène', 'neoprene'],
  // Wood / Paper
  wood:      ['wood', 'holz', 'bois', 'legno', 'hout', 'drewno', 'madera', 'dřevo', 'trä', 'fa'],
  bamboo:    ['bamboo', 'bambus', 'bambou', 'bambù', 'bamboe'],
  paper:     ['paper', 'papier', 'papier', 'carta', 'papier', 'papír', 'papper'],
  cardboard: ['cardboard', 'karton', 'carton', 'cartone', 'karton', 'kartón'],
  cork:      ['cork', 'kork', 'liège', 'sughero'],
  // Glass / Ceramic / Stone
  glass:     ['glass', 'glas', 'verre', 'vetro', 'glas', 'szkło', 'vidrio', 'sklo', 'üveg'],
  ceramic:   ['ceramic', 'keramik', 'céramique', 'ceramica', 'keramiek', 'ceramika', 'kerámia'],
  porcelain: ['porcelain', 'porzellan', 'porcelaine', 'porcellana', 'porselein'],
  stone:     ['stone', 'stein', 'pierre', 'pietra', 'steen', 'kamień', 'piedra', 'kámen', 'kő'],
  marble:    ['marble', 'marmor', 'marbre', 'marmo', 'marmer', 'marmur'],
  concrete:  ['concrete', 'beton', 'béton', 'calcestruzzo', 'beton'],
  // Other
  wax:       ['wax', 'wachs', 'cire', 'cera', 'was', 'wosk'],
  resin:     ['resin', 'harz', 'résine', 'resina', 'hars'],
  cellulose: ['cellulose', 'zellulose', 'cellulose', 'cellulosa'],
  lithium:   ['lithium', 'lithium', 'lithium', 'litio'],
  graphite:  ['graphite', 'graphit', 'graphite', 'grafite'],
  silicon:   ['silicon', 'silizium', 'silicium', 'silicio'],
  cobalt:    ['cobalt', 'kobalt', 'cobalt', 'cobalto'],
};

const MATERIAL_KEYWORDS = Object.entries(MATERIAL_DICT).map(([canonical, terms]) =>
  [buildMultilangRegex(terms), canonical]
);
const KNOWN_MATERIALS = new Set(Object.keys(MATERIAL_DICT));

const FORM_DICT = {
  knitted:    ['knitted', 'knitting', 'knit', 'gestrickt', 'strick', 'tricoté', 'tricot', 'maglia', 'maglieria', 'gebreid', 'dziany', 'stickat'],
  woven:      ['woven', 'weave', 'gewebt', 'gewebe', 'tissé', 'tissage', 'tessuto', 'geweven', 'tkany', 'vävd'],
  nonwoven:   ['nonwoven', 'non-woven', 'vlies', 'vliesstoff', 'non-tissé', 'nontessuto', 'vlies'],
  sewn:       ['sewn', 'sewing', 'genäht', 'näh', 'cousu', 'couture', 'cucito', 'gestikt', 'szyty'],
  molded:     ['molded', 'molding', 'moulded', 'geformt', 'formteil', 'moulé', 'stampaggio', 'gevormd', 'formowany'],
  cast:       ['casting', 'gegossen', 'guss', 'coulé', 'fonderie', 'fuso', 'fusione', 'gegoten', 'odlew'],
  forged:     ['forged', 'forging', 'geschmiedet', 'schmied', 'forgé', 'forgiato', 'gesmeed', 'kowany'],
  extruded:   ['extruded', 'extrusion', 'extrudiert', 'extrudé', 'estruso'],
  stamped:    ['stamped', 'stamping', 'gestanzt', 'stanz', 'estampé', 'stampato'],
  printed:    ['printed', 'printing', 'gedruckt', 'druck', 'bedruckt', 'imprimé', 'stampato', 'bedrukt', 'drukowany'],
  laminated:  ['laminated', 'laminating', 'laminiert', 'laminé', 'laminato', 'gelamineerd'],
  coated:     ['coated', 'coating', 'beschichtet', 'überzogen', 'revêtu', 'enduit', 'rivestito', 'gecoat', 'bekleed'],
  embroidered:['embroidered', 'embroidery', 'bestickt', 'stickerei', 'brodé', 'broderie', 'ricamato', 'geborduurd', 'haftowany'],
  welded:     ['welded', 'welding', 'geschweißt', 'schweiß', 'soudé', 'soudure', 'saldato', 'gelast', 'spawany'],
  pressed:    ['pressed', 'pressing', 'gepresst', 'pressé', 'pressato', 'geperst'],
  rolled:     ['rolled', 'rolling', 'gewalzt', 'walz', 'laminé', 'laminato', 'gewalst'],
  dried:      ['dried', 'drying', 'getrocknet', 'trocken', 'séché', 'essiccato', 'gedroogd', 'suszony'],
  frozen:     ['frozen', 'gefroren', 'tiefgekühlt', 'tiefkühl', 'congelé', 'surgelé', 'congelato', 'surgelato', 'bevroren', 'mrożony', 'fagyasztott'],
  powdered:   ['powdered', 'powder', 'pulver', 'pulverisiert', 'poudre', 'polvere', 'poeder'],
  granulated: ['granulated', 'granulat', 'granulé', 'granulato'],
  bottled:    ['bottled', 'abgefüllt', 'flasche', 'embouteillé', 'imbottigliato'],
  canned:     ['canned', 'konserve', 'dose', 'conserve', 'conserva', 'ingeblikt'],
};

const PRODUCT_FORM_KEYWORDS = Object.entries(FORM_DICT).map(([canonical, terms]) =>
  [buildMultilangRegex(terms), canonical]
);

const USE_DICT = {
  clothing:   ['clothing', 'apparel', 'garment', 'dress', 'shirt', 'trouser', 'pant', 'jacket', 'coat', 'skirt', 'blouse', 'bekleidung', 'kleidung', 'oberbekleidung', 'hemd', 'hose', 'jacke', 'mantel', 'rock', 'vêtement', 'habillement', 'chemise', 'pantalon', 'veste', 'jupe', 'abbigliamento', 'camicia', 'gonna', 'giacca', 'kleding', 'odzież', 'koszula', 'spodnie'],
  footwear:   ['footwear', 'shoe', 'boot', 'sandal', 'slipper', 'schuh', 'stiefel', 'sandale', 'chaussure', 'botte', 'scarpa', 'stivale', 'schoen', 'laars', 'obuwie', 'but'],
  accessories:['handbag', 'wallet', 'belt', 'glove', 'scarf', 'hat', 'cap', 'necktie', 'tasche', 'handtasche', 'gürtel', 'handschuh', 'schal', 'hut', 'mütze', 'sac', 'ceinture', 'gant', 'écharpe', 'chapeau', 'borsa', 'cintura', 'guanto', 'cappello'],
  food:       ['food', 'edible', 'beverage', 'drink', 'lebensmittel', 'nahrung', 'getränk', 'speise', 'alimentaire', 'aliment', 'boisson', 'alimentare', 'cibo', 'bibita', 'voedsel', 'drank', 'żywność', 'napój', 'élelmiszer', 'ital', 'potravina', 'livsmedel'],
  industrial: ['industrial', 'factory', 'manufacturing', 'machinery', 'industriell', 'fabrik', 'maschine', 'industriel', 'usine', 'machine', 'industriale', 'fabbrica', 'macchina', 'industrieel', 'fabriek', 'przemysłowy', 'maszyna'],
  automotive: ['automotive', 'vehicle', 'car', 'truck', 'automobil', 'fahrzeug', 'kraftfahrzeug', 'kfz', 'automobile', 'véhicule', 'voiture', 'camion', 'autoveicolo', 'veicolo', 'voertuig', 'auto', 'pojazd', 'samochód', 'fordon'],
  medical:    ['medical', 'surgical', 'pharmaceutical', 'hospital', 'clinical', 'medizinisch', 'chirurgisch', 'pharmazeutisch', 'klinik', 'médical', 'chirurgical', 'pharmaceutique', 'hôpital', 'medico', 'chirurgico', 'farmaceutico', 'medisch', 'medyczny', 'orvosi'],
  electrical: ['electric', 'electronic', 'circuit', 'semiconductor', 'battery', 'elektrisch', 'elektronisch', 'batterie', 'halbleiter', 'schaltung', 'électrique', 'électronique', 'batterie', 'circuit', 'elettrico', 'elettronico', 'batteria', 'elektrisch', 'elektryczny', 'bateria'],
  toy:        ['toy', 'game', 'plaything', 'doll', 'puzzle', 'spielzeug', 'spiel', 'puppe', 'jouet', 'jeu', 'poupée', 'giocattolo', 'bambola', 'speelgoed', 'pop', 'zabawka', 'lalka', 'játék', 'baba'],
  sport:      ['sport', 'athletic', 'fitness', 'exercise', 'gym', 'sportlich', 'sportgerät', 'sportif', 'sportivo', 'sport'],
  furniture:  ['furniture', 'chair', 'table', 'desk', 'bed', 'sofa', 'cabinet', 'möbel', 'stuhl', 'tisch', 'schreibtisch', 'bett', 'schrank', 'meuble', 'chaise', 'table', 'bureau', 'lit', 'armoire', 'mobile', 'sedia', 'tavolo', 'letto', 'meubel', 'stoel', 'tafel', 'mebel', 'krzesło', 'stół', 'bútor', 'szék', 'asztal'],
  construction:['construction', 'building', 'structural', 'bau', 'baustoff', 'bauwerk', 'construction', 'bâtiment', 'costruzione', 'edilizia', 'bouw', 'budowa', 'építés'],
  agricultural:['agricultural', 'farming', 'garden', 'crop', 'seed', 'fertiliz', 'landwirtschaft', 'garten', 'saat', 'dünger', 'agricole', 'jardin', 'semence', 'engrais', 'agricolo', 'giardino', 'seme', 'landbouw', 'tuin', 'rolnictwo', 'ogród'],
  cosmetic:   ['cosmetic', 'beauty', 'skincare', 'makeup', 'perfume', 'kosmetik', 'parfüm', 'cosmétique', 'parfum', 'cosmetico', 'profumo', 'cosmetica', 'parfum', 'kosmetyk', 'perfumy', 'kozmetika'],
  packaging:  ['packaging', 'container', 'box', 'wrapper', 'carton', 'verpackung', 'behälter', 'karton', 'schachtel', 'emballage', 'boîte', 'imballaggio', 'scatola', 'verpakking', 'doos', 'opakowanie', 'pudełko'],
  textile:    ['textile', 'fabric', 'cloth', 'fiber', 'yarn', 'thread', 'textil', 'stoff', 'gewebe', 'faser', 'garn', 'faden', 'tissu', 'étoffe', 'fibre', 'fil', 'tessile', 'tessuto', 'fibra', 'filo', 'textiel', 'stof', 'vezel', 'garen', 'draad', 'włókno', 'tkanina', 'nić', 'textil', 'tyg'],
  chemical:   ['chemical', 'reagent', 'solvent', 'acid', 'catalyst', 'chemisch', 'chemikalie', 'lösungsmittel', 'säure', 'chimique', 'réactif', 'solvant', 'acide', 'chimico', 'reagente', 'solvente', 'acido', 'chemisch', 'chemiczny', 'kwas'],
  optical:    ['optical', 'lens', 'spectacle', 'eyewear', 'optisch', 'linse', 'brille', 'optique', 'lentille', 'lunette', 'ottico', 'lente', 'occhiale', 'optisch', 'bril', 'optyczny', 'soczewka'],
  military:   ['military', 'defense', 'weapon', 'ammunition', 'militärisch', 'waffe', 'munition', 'militaire', 'arme', 'munition', 'militare', 'arma', 'munizione', 'militair', 'wapen'],
  veterinary: ['veterinar', 'animal', 'pet', 'livestock', 'poultry', 'tierärztlich', 'tier', 'haustier', 'vieh', 'geflügel', 'vétérinaire', 'animal', 'bétail', 'volaille', 'veterinario', 'animale', 'bestiame', 'dier', 'huisdier', 'vee', 'gevogelte'],
};

const INTENDED_USE_KEYWORDS = Object.entries(USE_DICT).map(([canonical, terms]) =>
  [buildMultilangRegex(terms), canonical]
);

// Composition: "85% cotton, 15% polyester" or "85% Baumwolle"
const COMPOSITION_RE = /(\d{1,3}(?:[.,]\d+)?)\s*%\s*([a-zA-ZäöüßéèêàâùûôîïëçñÄÖÜ][a-zA-ZäöüßéèêàâùûôîïëçñÄÖÜ ]{1,25})/gi;
// Build reverse lookup: synonym → canonical material name
const SYNONYM_TO_MATERIAL = new Map();
for (const [canonical, terms] of Object.entries(MATERIAL_DICT)) {
  for (const t of terms) SYNONYM_TO_MATERIAL.set(t.toLowerCase(), canonical);
}

function extractTenField(text) {
  if (!text) return { material: null, material_composition: null, product_form: null, intended_use: null };

  let material = null;
  for (const [re, name] of MATERIAL_KEYWORDS) {
    if (re.test(text)) { material = name; break; }
  }

  const composition = {};
  for (const m of text.matchAll(COMPOSITION_RE)) {
    const pct = Number(String(m[1]).replace(',', '.'));
    const rawMat = m[2].trim().toLowerCase();
    const canonical = SYNONYM_TO_MATERIAL.get(rawMat);
    if (pct > 0 && pct <= 100 && canonical) composition[canonical] = pct;
  }
  const matComp = Object.keys(composition).length > 0 ? composition : null;

  let productForm = null;
  for (const [re, name] of PRODUCT_FORM_KEYWORDS) {
    if (re.test(text)) { productForm = name; break; }
  }

  let intendedUse = null;
  for (const [re, name] of INTENDED_USE_KEYWORDS) {
    if (re.test(text)) { intendedUse = name; break; }
  }

  return { material, material_composition: matComp, product_form: productForm, intended_use: intendedUse };
}

// ─── Business Rule: Conditional Rules Extraction ───

function extractConditionalRule(text) {
  if (!text) return null;

  // "if cotton >= 80%, duty 10%, otherwise 5%"
  let m = text.match(/if\s+(\w+)\s+(?:content\s+)?(?:>=?|is\s+more\s+than|exceeds?)\s+(\d+)\s*%?,\s*(?:duty\s+(?:is\s+)?)?(\d+(?:\.\d+)?)\s*%[,.]?\s*(?:otherwise|else)\s+(\d+(?:\.\d+)?)\s*%/i);
  if (m) return {
    type: 'if_else',
    condition: { field: `materialComposition.${m[1].toLowerCase()}`, op: '>=', value: Number(m[2]) },
    then: { ad_valorem: Number(m[3]) },
    else: { ad_valorem: Number(m[4]) },
  };

  // "containing more than X% material → Y%"
  m = text.match(/containing\s+more\s+than\s+(\d+)\s*%\s+(\w+)[^.]{0,80}?(\d+(?:\.\d+)?)\s*%/i);
  if (m) return {
    type: 'threshold',
    condition: { field: `materialComposition.${m[2].toLowerCase()}`, op: '>', value: Number(m[1]) },
    then: { ad_valorem: Number(m[3]) },
  };

  // "weighs more than X kg → Y%"
  m = text.match(/weigh(?:s|ing)\s+more\s+than\s+(\d+(?:\.\d+)?)\s*(g|kg)[^.]{0,60}?(\d+(?:\.\d+)?)\s*%/i);
  if (m) return {
    type: 'weight_threshold',
    condition: { field: 'weightKg', op: '>', value: m[2] === 'g' ? Number(m[1]) / 1000 : Number(m[1]) },
    then: { ad_valorem: Number(m[3]) },
  };

  return null;
}

// ─── Business Rule: HS Version + Multi-HS Split ───

function determineHsVersion(dateStr) {
  if (!dateStr) return null;
  const d = new Date(dateStr);
  if (isNaN(d.getTime())) return null;
  const y = d.getFullYear();
  if (y >= 2022) return 'HS2022';
  if (y >= 2017) return 'HS2017';
  if (y >= 2012) return 'HS2012';
  if (y >= 2007) return 'HS2007';
  if (y >= 2002) return 'HS2002';
  return 'HS_PRE2002';
}

function hsVersionMultiplier(version) {
  if (!version) return 0.85;    // unknown date → mild penalty, not harsh
  if (version === 'HS2022') return 1.0;
  if (version === 'HS2017') return 0.95;
  if (version === 'HS2012') return 0.85;
  if (version === 'HS2007') return 0.75;
  return 0.65; // HS2002 and earlier
}

const HS_PATTERN = /\b(\d{4})[.\s]?(\d{2})(?:[.\s]?(\d{2}))?(?:[.\s]?(\d{2}))?(?:[.\s]?(\d{2}))?\b/g;

function findExtraHsCodes(text, primaryHs6) {
  if (!text) return [];
  const found = new Set();
  for (const m of text.matchAll(HS_PATTERN)) {
    const digits = (m[1] + m[2] + (m[3] || '') + (m[4] || '') + (m[5] || '')).replace(/\D/g, '');
    if (digits.length >= 6 && digits.length <= 10) {
      const prefix6 = digits.slice(0, 6);
      if (prefix6 !== primaryHs6) found.add(digits);
    }
  }
  return Array.from(found);
}

// ─── Business Rule: Status Resolution ───

function resolveStatus(record, ebtiEnrich, crossEnrich) {
  const today = new Date('2026-04-14');

  // CROSS: check revoked
  if (crossEnrich?.is_revoked) return 'revoked';

  // EBTI: valid_to based
  if (ebtiEnrich?.valid_to) {
    const validTo = new Date(ebtiEnrich.valid_to);
    if (!isNaN(validTo.getTime()) && validTo < today) return 'expired';
  }

  // EBTI: all raw STATUS = INVALID → if valid_to exists and passed, expired; else historical
  if (record.source === 'eu_ebti') {
    if (ebtiEnrich?.valid_from) return 'historical'; // has dates but we can't determine active
    return 'historical';
  }

  // CROSS without enrichment → active (no revocation info)
  return 'active';
}

// ─── Business Rule: Confidence Scoring ───

function scoreConfidence(g) {
  let score = 1.0;

  // HS precision: 6-digit = lower confidence
  const hsLen = (g.hs_code || '').length;
  if (hsLen <= 6) score -= 0.1;
  else if (hsLen <= 8) score -= 0.05;

  // Material null
  if (!g.material) score -= 0.1;

  // Product form null
  if (!g.product_form) score -= 0.05;

  // Conditional rules present = bonus
  if (g.conditional_rules) score += 0.05;

  // Ruling date null
  if (!g.ruling_date) score -= 0.05;

  // Full text too short
  if (!g.full_description || g.full_description.length < 50) score -= 0.1;

  // HS version penalty
  const versionMult = hsVersionMultiplier(g.hs_version);
  score *= versionMult;

  return Math.max(0, Math.min(1, Math.round(score * 100) / 100));
}

// ─── Main: Stream unified + JOIN + transform ───

console.log('\n▸ Processing unified Silver (572K) with enrichment JOINs...');

const out = fs.createWriteStream(`${GOLD}/customs_rulings.jsonl`);
const rl = readline.createInterface({
  input: fs.createReadStream(`${SILVER}/unified.jsonl`, 'utf-8'),
  crlfDelay: Infinity,
});

const seen = new Set();
const stats = {
  read: 0, written: 0, duplicates: 0,
  rule_split_adds: 0,
  ebti_joined: 0, cross_joined: 0,
  material_filled: 0, composition_filled: 0, form_filled: 0, use_filled: 0,
  conditional_rules_found: 0,
  status_active: 0, status_expired: 0, status_historical: 0, status_revoked: 0,
  hs_version_2022: 0, hs_version_2017: 0, hs_version_2012: 0, hs_version_older: 0, hs_version_null: 0,
  needs_manual_review: 0,
  confidence_sum: 0,
};

for await (const line of rl) {
  if (!line.trim()) continue;
  let rec;
  try { rec = JSON.parse(line); } catch { continue; }
  stats.read++;

  // LEFT JOIN enrichments
  const ebtiEnrich = rec.source === 'eu_ebti' ? ebtiMap.get(rec.ruling_id) : null;
  const crossEnrich = (rec.source === 'cbp_cross' || rec.source === 'cbp_cross_search')
    ? crossMap.get(rec.ruling_id) : null;

  if (ebtiEnrich) stats.ebti_joined++;
  if (crossEnrich) stats.cross_joined++;

  // Merge enrichment fields
  const rulingDate = crossEnrich?.ruling_date || ebtiEnrich?.ruling_date || null;
  const validFrom = ebtiEnrich?.valid_from || null;
  const validTo = ebtiEnrich?.valid_to || null;
  const issuingCountry = ebtiEnrich?.issuing_country || (rec.country_code === 'US' ? 'US' : null);
  const language = ebtiEnrich?.language || 'en';
  const keywords = ebtiEnrich?.keywords || null;
  const fullText = crossEnrich?.full_text_enriched || ebtiEnrich?.description_enriched || null;
  const allTariffs = crossEnrich?.all_tariffs || null;
  const categories = crossEnrich?.categories || null;
  const collection = crossEnrich?.collection || null;
  const isUsmca = crossEnrich?.is_usmca || false;
  const isNafta = crossEnrich?.is_nafta || false;

  // Combined text for extraction (product_name + full_description + full_text enrichment)
  const combinedText = [rec.product_name, rec.full_description, fullText].filter(Boolean).join(' ');

  // HS version from ruling date or valid_from
  const hsVersion = determineHsVersion(rulingDate || validFrom);
  if (hsVersion === 'HS2022') stats.hs_version_2022++;
  else if (hsVersion === 'HS2017') stats.hs_version_2017++;
  else if (hsVersion === 'HS2012') stats.hs_version_2012++;
  else if (hsVersion) stats.hs_version_older++;
  else stats.hs_version_null++;

  // Status resolution
  const status = resolveStatus(rec, ebtiEnrich, crossEnrich);
  stats[`status_${status}`] = (stats[`status_${status}`] || 0) + 1;

  // 10 Field extraction
  const tenField = extractTenField(combinedText);
  if (tenField.material) stats.material_filled++;
  if (tenField.material_composition) stats.composition_filled++;
  if (tenField.product_form) stats.form_filled++;
  if (tenField.intended_use) stats.use_filled++;

  // Conditional rules
  const conditionalRules = extractConditionalRule(combinedText);
  if (conditionalRules) stats.conditional_rules_found++;

  // rule_split: find extra HS codes in full text
  const extraHs = findExtraHsCodes(fullText || rec.full_description || '', rec.hs6);
  const primaryHs = (rec.hs_code || '').slice(0, 10); // CW35-HF1: cap at 10 digits
  const allHsCodes = [primaryHs, ...extraHs];

  for (const hsCodeRaw of allHsCodes) {
    const hsCode = hsCodeRaw.slice(0, 10); // enforce 10-digit max
    const hs6 = hsCode.slice(0, 6);
    const chapter = Number(hs6.slice(0, 2)) || rec.chapter;

    // Dedupe: source + ruling_id + hs6
    const dedupeKey = `${rec.source}|${rec.ruling_id}|${hs6}`;
    if (seen.has(dedupeKey)) { stats.duplicates++; continue; }
    seen.add(dedupeKey);

    if (hsCode !== rec.hs_code) stats.rule_split_adds++;

    const gold = {
      ruling_id: rec.ruling_id,
      source: rec.source,
      issuing_country: issuingCountry,
      jurisdiction: rec.jurisdiction,
      product_name: rec.product_name,
      full_description: rec.full_description,
      full_text: fullText,
      hs6,
      hs_code: hsCode,
      chapter,
      all_tariffs: allTariffs,
      material: tenField.material,
      material_composition: tenField.material_composition,
      product_form: tenField.product_form,
      intended_use: tenField.intended_use,
      conditional_rules: conditionalRules,
      duty_rate_ad_valorem: null,    // conditional outcome only (CEO decision)
      duty_per_unit_amount: null,
      duty_per_unit_currency: null,
      duty_per_unit_uom: null,
      ruling_date: rulingDate,
      valid_from: validFrom,
      valid_to: validTo,
      status,
      language,
      keywords,
      categories,
      collection,
      is_usmca: isUsmca,
      is_nafta: isNafta,
      hs_version: hsVersion,
      confidence_score: 0,
      needs_manual_review: false,
      pipeline_version: 'cw34-s3-d-v1',
    };

    gold.confidence_score = scoreConfidence(gold);
    gold.needs_manual_review = gold.confidence_score < 0.3;
    if (gold.needs_manual_review) stats.needs_manual_review++;
    stats.confidence_sum += gold.confidence_score;

    out.write(JSON.stringify(gold) + '\n');
    stats.written++;
  }

  if (stats.read % 100000 === 0) process.stdout.write(`  processed: ${stats.read.toLocaleString()}...\r`);
}

out.end();

// Finalize stats
stats.confidence_avg = stats.written > 0 ? Math.round(stats.confidence_sum / stats.written * 100) / 100 : 0;
delete stats.confidence_sum;
stats.material_pct = stats.written > 0 ? Math.round(stats.material_filled / stats.written * 1000) / 10 : 0;
stats.form_pct = stats.written > 0 ? Math.round(stats.form_filled / stats.written * 1000) / 10 : 0;
stats.use_pct = stats.written > 0 ? Math.round(stats.use_filled / stats.written * 1000) / 10 : 0;
stats.manual_review_pct = stats.written > 0 ? Math.round(stats.needs_manual_review / stats.written * 1000) / 10 : 0;
stats.generated_at = new Date().toISOString();

fs.writeFileSync(`${GOLD}/_stats.json`, JSON.stringify(stats, null, 2));

console.log('\n\n━━ GOLD STATS ━━');
console.log(JSON.stringify(stats, null, 2));
