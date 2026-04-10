/**
 * POTAL Restricted Items — Rules Database
 *
 * HS Code-based restriction rules for international trade.
 * Covers universally restricted categories + country-specific rules.
 *
 * Source: WCO HS 2022 classification, US CBP, EU TARIC, country customs guides.
 * This is a curated ruleset — not exhaustive. For full NTM data, see MacMap/WTO.
 */

import type { Restriction } from './types';

// ─── Universal Restrictions (most countries) ────────

const UNIVERSAL: Restriction[] = [
  // Weapons & Ammunition (HS 93)
  {
    severity: 'prohibited',
    hsPrefix: '9301',
    category: 'Military Weapons',
    description: 'Military weapons (artillery, rockets, torpedoes) are prohibited for civilian import.',
  },
  {
    severity: 'restricted',
    hsPrefix: '9302',
    category: 'Firearms — Revolvers/Pistols',
    description: 'Handguns require import license, background check, and end-user certificate.',
    requiredDocuments: ['Import License', 'End-User Certificate', 'Background Check'],
  },
  {
    severity: 'restricted',
    hsPrefix: '9303',
    category: 'Firearms — Rifles/Shotguns',
    description: 'Rifles and shotguns require import license and end-user certificate.',
    requiredDocuments: ['Import License', 'End-User Certificate'],
  },
  {
    severity: 'restricted',
    hsPrefix: '9304',
    category: 'Air Guns / Spring Guns',
    description: 'Air/spring guns may require import permit depending on destination.',
    requiredDocuments: ['Import Permit'],
  },
  {
    severity: 'restricted',
    hsPrefix: '9305',
    category: 'Firearm Parts',
    description: 'Firearm parts and accessories are controlled items.',
    requiredDocuments: ['Import License'],
  },
  {
    severity: 'restricted',
    hsPrefix: '9306',
    category: 'Ammunition',
    description: 'Ammunition and projectiles require import license.',
    requiredDocuments: ['Import License', 'End-User Certificate'],
  },
  // Explosives (HS 36)
  {
    severity: 'prohibited',
    hsPrefix: '3601',
    category: 'Explosives — Propellent Powders',
    description: 'Propellent powders are prohibited for civilian import.',
  },
  {
    severity: 'prohibited',
    hsPrefix: '3602',
    category: 'Explosives — Prepared Explosives',
    description: 'Prepared explosives (dynamite, etc.) are prohibited.',
  },
  {
    severity: 'restricted',
    hsPrefix: '3604',
    category: 'Fireworks',
    description: 'Fireworks and pyrotechnics require safety certification and import permit.',
    requiredDocuments: ['Safety Certificate', 'Import Permit'],
  },
  // Narcotics & Precursors (HS 2939, 1211, 2903, 2914, 2922)
  {
    severity: 'prohibited',
    hsPrefix: '2939',
    category: 'Narcotic Alkaloids',
    description: 'Narcotic alkaloids (cocaine, morphine, etc.) are prohibited without pharmaceutical license.',
  },
  {
    severity: 'restricted',
    hsPrefix: '2922',
    category: 'Chemical Precursors',
    description: 'Certain amino-compounds are controlled as chemical precursors.',
    requiredDocuments: ['Chemical Import License', 'End-Use Certificate'],
  },
  // Pharmaceuticals (HS 30)
  {
    severity: 'restricted',
    hsPrefix: '3003',
    category: 'Pharmaceuticals — Medicaments (unmixed)',
    description: 'Pharmaceutical products require health authority approval and import license.',
    requiredDocuments: ['Health Authority Approval', 'Import License', 'Certificate of Analysis'],
  },
  {
    severity: 'restricted',
    hsPrefix: '3004',
    category: 'Pharmaceuticals — Medicaments (dosed)',
    description: 'Dosed pharmaceutical products require health authority approval.',
    requiredDocuments: ['Health Authority Approval', 'Import License', 'Certificate of Analysis'],
  },
  // Radioactive Materials (HS 2844)
  {
    severity: 'prohibited',
    hsPrefix: '2844',
    category: 'Radioactive Materials',
    description: 'Radioactive elements and isotopes are strictly controlled.',
  },
  // Endangered Species / CITES (HS 0106, parts of 05, 43)
  {
    severity: 'restricted',
    hsPrefix: '0106',
    category: 'Live Animals (CITES)',
    description: 'Live animals may require CITES permit if endangered species.',
    requiredDocuments: ['CITES Permit', 'Veterinary Certificate', 'Health Certificate'],
  },
  {
    severity: 'restricted',
    hsPrefix: '0507',
    category: 'Ivory / Animal Products',
    description: 'Ivory, tortoiseshell, and similar products from protected species are restricted/prohibited.',
    requiredDocuments: ['CITES Permit'],
  },
  {
    severity: 'restricted',
    hsPrefix: '4301',
    category: 'Raw Fur Skins',
    description: 'Fur skins from protected species require CITES documentation.',
    requiredDocuments: ['CITES Permit', 'Certificate of Origin'],
  },
  // Toxic / Hazardous Chemicals (HS 28, 29)
  {
    severity: 'warning',
    hsPrefix: '2812',
    category: 'Hazardous Chemicals — Halides',
    description: 'Halides and similar chemicals may require hazmat shipping documentation.',
    requiredDocuments: ['Material Safety Data Sheet (MSDS)', 'Hazmat Declaration'],
  },
  // Food & Agriculture (HS 01-24) — common restrictions
  {
    severity: 'restricted',
    hsPrefix: '0201',
    category: 'Fresh/Chilled Beef',
    description: 'Meat imports require sanitary/phytosanitary certificate and cold chain documentation.',
    requiredDocuments: ['Sanitary Certificate', 'Certificate of Origin', 'Cold Chain Certificate'],
  },
  {
    severity: 'restricted',
    hsPrefix: '0207',
    category: 'Poultry Meat',
    description: 'Poultry imports require veterinary certificate and avian flu testing.',
    requiredDocuments: ['Veterinary Certificate', 'Avian Influenza Test Report'],
  },
  {
    severity: 'warning',
    hsPrefix: '0401',
    category: 'Dairy — Milk/Cream',
    description: 'Dairy products may require health certificate and temperature control.',
    requiredDocuments: ['Health Certificate'],
  },
  // Tobacco (HS 2401-2403)
  {
    severity: 'restricted',
    hsPrefix: '2402',
    category: 'Cigarettes / Cigars',
    description: 'Tobacco products require excise tax payment and health warnings.',
    requiredDocuments: ['Excise Tax Certificate', 'Health Warning Compliance'],
  },
  // Alcohol (HS 2203-2208)
  {
    severity: 'restricted',
    hsPrefix: '2208',
    category: 'Spirits / Liquor',
    description: 'Distilled spirits require import license and excise duty payment.',
    requiredDocuments: ['Import License', 'Excise Tax Certificate'],
  },
  {
    severity: 'restricted',
    hsPrefix: '2204',
    category: 'Wine',
    description: 'Wine imports may require license and quality certificate.',
    requiredDocuments: ['Import License', 'Certificate of Analysis'],
  },
  // Drones / UAV (part of HS 8802, 8525)
  {
    severity: 'warning',
    hsPrefix: '8806',
    category: 'Unmanned Aircraft (Drones)',
    description: 'Drones may require registration and frequency authorization in destination country.',
    requiredDocuments: ['Registration Certificate', 'Frequency Authorization'],
  },
  // Encryption / Communication Equipment
  {
    severity: 'warning',
    hsPrefix: '8517',
    category: 'Communication Equipment',
    description: 'Telecom equipment may require type approval certificate in destination country.',
    requiredDocuments: ['Type Approval Certificate'],
  },
  // Cosmetics (HS 3303-3307)
  {
    severity: 'warning',
    hsPrefix: '3304',
    category: 'Cosmetics — Beauty Products',
    description: 'Cosmetics may require product registration and ingredient declaration.',
    requiredDocuments: ['Product Registration', 'Ingredient List / INCI'],
  },
];

// ─── Country-Specific Rules ─────────────────────────

const COUNTRY_SPECIFIC: Restriction[] = [
  // Saudi Arabia / UAE — pork products
  {
    severity: 'prohibited',
    hsPrefix: '0203',
    category: 'Pork Meat',
    description: 'Pork and pork products are prohibited imports.',
    countries: ['SA', 'AE', 'KW', 'QA', 'BH', 'OM', 'IR', 'PK', 'AF'],
  },
  {
    severity: 'prohibited',
    hsPrefix: '1601',
    category: 'Pork Sausages',
    description: 'Pork-based sausages and preparations are prohibited.',
    countries: ['SA', 'AE', 'KW', 'QA', 'BH', 'OM', 'IR', 'PK', 'AF'],
  },
  // India — beef
  {
    severity: 'prohibited',
    hsPrefix: '0201',
    category: 'Beef (Fresh/Chilled)',
    description: 'Beef import is prohibited in most Indian states.',
    countries: ['IN'],
  },
  {
    severity: 'prohibited',
    hsPrefix: '0202',
    category: 'Beef (Frozen)',
    description: 'Frozen beef import is prohibited in most Indian states.',
    countries: ['IN'],
  },
  // EU — specific electronics standards
  {
    severity: 'warning',
    hsPrefix: '8528',
    category: 'Monitors / TVs (EU CE marking)',
    description: 'Electronic products entering the EU must have CE marking and comply with RoHS directive.',
    requiredDocuments: ['CE Declaration of Conformity', 'RoHS Compliance Certificate'],
    countries: ['DE', 'FR', 'IT', 'ES', 'NL', 'BE', 'AT', 'PT', 'GR', 'IE', 'FI', 'SE', 'DK', 'PL', 'CZ', 'SK', 'HU', 'RO', 'BG', 'HR', 'SI', 'LT', 'LV', 'EE', 'CY', 'MT', 'LU'],
  },
  // Australia — strict biosecurity
  {
    severity: 'restricted',
    hsPrefix: '0601',
    category: 'Live Plants (AU Biosecurity)',
    description: 'Australia has strict biosecurity. Plants require import permit and quarantine inspection.',
    requiredDocuments: ['Import Permit', 'Phytosanitary Certificate', 'Quarantine Entry'],
    countries: ['AU'],
  },
  {
    severity: 'restricted',
    hsPrefix: '1211',
    category: 'Herbs/Seeds (AU Biosecurity)',
    description: 'Herbal products and seeds require biosecurity treatment or permit.',
    requiredDocuments: ['Import Permit', 'Phytosanitary Certificate'],
    countries: ['AU', 'NZ'],
  },
  // Japan — food additive rules
  {
    severity: 'warning',
    hsPrefix: '2106',
    category: 'Food Preparations (JP)',
    description: 'Food preparations must comply with Japan Food Sanitation Act. Some additives prohibited.',
    requiredDocuments: ['Food Sanitation Certificate', 'Ingredient Declaration'],
    countries: ['JP'],
  },
  // Brazil — electronics require ANATEL certification
  {
    severity: 'restricted',
    hsPrefix: '8517',
    category: 'Telecom Equipment (BR ANATEL)',
    description: 'Telecom and wireless equipment requires ANATEL certification in Brazil.',
    requiredDocuments: ['ANATEL Certificate'],
    countries: ['BR'],
  },
  // South Korea — KC marking for electronics
  {
    severity: 'warning',
    hsPrefix: '8471',
    category: 'Computers / Electronics (KR KC)',
    description: 'Electronic products entering Korea require KC safety marking.',
    requiredDocuments: ['KC Certificate'],
    countries: ['KR'],
  },
  // China — GACC registration for food
  {
    severity: 'restricted',
    hsPrefix: '1905',
    category: 'Baked Goods (CN GACC)',
    description: 'Food imports to China require GACC (General Administration of Customs) registration.',
    requiredDocuments: ['GACC Registration', 'Chinese Label'],
    countries: ['CN'],
  },
];

// ─── Watched Items & Carrier Restrictions ──────────

const WATCHED_AND_CARRIER: Restriction[] = [
  // Primary cells (lithium primary batteries) — dangerous goods
  // CW31-HF1: added to surface HAZMAT warnings for non-rechargeable lithium cells
  {
    severity: 'watched',
    hsPrefix: '8506',
    category: 'Primary Lithium Cells',
    description: 'Primary lithium batteries (non-rechargeable) are regulated as dangerous goods under IATA DGR and IMDG Code. Hazmat declaration required.',
    requiredDocuments: ['Shipper\'s Declaration for Dangerous Goods (IATA)', 'UN3090 / UN3091 classification'],
    carrierRestrictions: ['USPS', 'Royal Mail', 'China Post (air)', 'Singapore Post (air)'],
  },
  // Lithium batteries — carrier restrictions (IATA DGR)
  {
    severity: 'watched',
    hsPrefix: '8507',
    category: 'Lithium Batteries',
    description: 'Lithium batteries are regulated as dangerous goods. Shipping restrictions apply.',
    requiredDocuments: ['Shipper\'s Declaration for Dangerous Goods (IATA)', 'UN3480 / UN3481 classification'],
    carrierRestrictions: ['USPS', 'Royal Mail', 'China Post (air)', 'Singapore Post (air)'],
  },
  // Perfumes/fragrances — flammable (carrier restricted)
  {
    severity: 'watched',
    hsPrefix: '3303',
    category: 'Perfumes / Fragrances',
    description: 'Alcohol-based perfumes classified as flammable. Air cargo restrictions apply.',
    carrierRestrictions: ['FedEx (Economy)', 'USPS International'],
  },
  // Aerosols — pressurized containers
  {
    severity: 'watched',
    hsPrefix: '3405',
    category: 'Aerosol Products',
    description: 'Aerosol/pressurized containers classified as dangerous goods for air transport.',
    carrierRestrictions: ['USPS', 'Royal Mail', 'FedEx (Economy)'],
  },
  // Magnets — strong magnets affect aircraft instruments
  {
    severity: 'watched',
    hsPrefix: '8505',
    category: 'Magnets',
    description: 'Strong magnets (neodymium) may require special packaging for air shipment.',
    carrierRestrictions: ['DHL Express (unpackaged)'],
  },
  // Knives/blades — carrier restricted
  {
    severity: 'watched',
    hsPrefix: '8211',
    category: 'Knives / Blades',
    description: 'Knives and cutting instruments may have carrier and import restrictions.',
    carrierRestrictions: ['USPS', 'Royal Mail'],
  },
  // Drones — export control + carrier restrictions
  {
    severity: 'watched',
    hsPrefix: '8806',
    category: 'Drones / UAVs',
    description: 'Drones may require export license and have import restrictions in many countries.',
    requiredDocuments: ['Export License (if applicable)'],
    carrierRestrictions: ['USPS International'],
  },
];

/**
 * Get all restriction rules (universal + country-specific + watched/carrier).
 */
export function getAllRestrictions(): Restriction[] {
  return [...UNIVERSAL, ...COUNTRY_SPECIFIC, ...WATCHED_AND_CARRIER];
}
