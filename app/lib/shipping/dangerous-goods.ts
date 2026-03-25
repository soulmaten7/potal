/**
 * F066: Dangerous Goods Shipping — HS→UN mapping + carrier rules
 */

export interface UnMapping {
  unNumber: string;
  hazardClass: string;
  packingGroup: string;
  properShippingName: string;
}

export interface CarrierDgRule {
  carrier: string;
  carrierName: string;
  acceptsClasses: string[];
  maxWeightKg: number;
  requiresDgForm: boolean;
  note?: string;
}

export interface DgCheckResult {
  hsCode: string;
  isDangerous: boolean;
  unMapping: UnMapping | null;
  acceptingCarriers: string[];
  rejectedCarriers: string[];
  warnings: string[];
}

const HS_TO_UN: Record<string, UnMapping> = {
  '360100': { unNumber: 'UN0336', hazardClass: '1.4', packingGroup: 'II', properShippingName: 'FIREWORKS' },
  '930100': { unNumber: 'UN0012', hazardClass: '1.4S', packingGroup: 'II', properShippingName: 'CARTRIDGES' },
  '280440': { unNumber: 'UN1013', hazardClass: '2.2', packingGroup: '', properShippingName: 'CARBON DIOXIDE' },
  '271112': { unNumber: 'UN1978', hazardClass: '2.1', packingGroup: '', properShippingName: 'PROPANE' },
  '271019': { unNumber: 'UN1202', hazardClass: '3', packingGroup: 'III', properShippingName: 'DIESEL FUEL' },
  '271012': { unNumber: 'UN1203', hazardClass: '3', packingGroup: 'II', properShippingName: 'GASOLINE' },
  '220710': { unNumber: 'UN1170', hazardClass: '3', packingGroup: 'II', properShippingName: 'ETHANOL' },
  '330300': { unNumber: 'UN1266', hazardClass: '3', packingGroup: 'II', properShippingName: 'PERFUMERY PRODUCTS' },
  '330430': { unNumber: 'UN1263', hazardClass: '3', packingGroup: 'II', properShippingName: 'NAIL POLISH' },
  '320910': { unNumber: 'UN1263', hazardClass: '3', packingGroup: 'II', properShippingName: 'PAINT' },
  '350520': { unNumber: 'UN1133', hazardClass: '3', packingGroup: 'II', properShippingName: 'ADHESIVES' },
  '360500': { unNumber: 'UN1944', hazardClass: '4.1', packingGroup: 'III', properShippingName: 'SAFETY MATCHES' },
  '280469': { unNumber: 'UN2014', hazardClass: '5.1', packingGroup: 'II', properShippingName: 'HYDROGEN PEROXIDE' },
  '310210': { unNumber: 'UN1942', hazardClass: '5.1', packingGroup: 'III', properShippingName: 'AMMONIUM NITRATE' },
  '380891': { unNumber: 'UN2588', hazardClass: '6.1', packingGroup: 'III', properShippingName: 'PESTICIDE, SOLID' },
  '280300': { unNumber: 'UN2809', hazardClass: '8', packingGroup: 'III', properShippingName: 'MERCURY' },
  '280700': { unNumber: 'UN1830', hazardClass: '8', packingGroup: 'II', properShippingName: 'SULFURIC ACID' },
  '281410': { unNumber: 'UN1791', hazardClass: '8', packingGroup: 'III', properShippingName: 'BLEACH' },
  '850760': { unNumber: 'UN3481', hazardClass: '9', packingGroup: 'II', properShippingName: 'LITHIUM ION BATTERIES' },
  '850710': { unNumber: 'UN2794', hazardClass: '8', packingGroup: 'III', properShippingName: 'BATTERIES, WET (lead-acid)' },
  '850640': { unNumber: 'UN3481', hazardClass: '9', packingGroup: 'II', properShippingName: 'LITHIUM ION CELLS' },
  '382499': { unNumber: 'UN3082', hazardClass: '9', packingGroup: 'III', properShippingName: 'ENVIRONMENTALLY HAZARDOUS SUBSTANCE' },
  '340220': { unNumber: 'UN1993', hazardClass: '3', packingGroup: 'III', properShippingName: 'CLEANING SOLVENT' },
};

export const CARRIER_RULES: CarrierDgRule[] = [
  { carrier: 'dhl', carrierName: 'DHL Express', acceptsClasses: ['3', '8', '9'], maxWeightKg: 30, requiresDgForm: true, note: 'Class 3 limited to flashpoint >60°C' },
  { carrier: 'fedex', carrierName: 'FedEx', acceptsClasses: ['2.1', '2.2', '3', '4.1', '5.1', '8', '9'], maxWeightKg: 50, requiresDgForm: true },
  { carrier: 'ups', carrierName: 'UPS', acceptsClasses: ['3', '4.1', '5.1', '8', '9'], maxWeightKg: 35, requiresDgForm: true },
  { carrier: 'usps', carrierName: 'USPS International', acceptsClasses: [], maxWeightKg: 0, requiresDgForm: false, note: 'USPS does not accept dangerous goods internationally' },
  { carrier: 'royal_mail', carrierName: 'Royal Mail', acceptsClasses: ['9'], maxWeightKg: 2, requiresDgForm: false, note: 'Only Class 9 lithium batteries ≤2kg' },
];

export function checkDangerousGoods(hsCode: string, weightKg?: number): DgCheckResult {
  const clean = hsCode.replace(/[^0-9]/g, '');
  const warnings: string[] = [];

  let mapping = HS_TO_UN[clean.substring(0, 6)] || null;
  if (!mapping && clean.length >= 4) {
    for (const [hs, un] of Object.entries(HS_TO_UN)) {
      if (hs.startsWith(clean.substring(0, 4))) { mapping = un; break; }
    }
  }

  if (!mapping) {
    return { hsCode: clean, isDangerous: false, unMapping: null, acceptingCarriers: CARRIER_RULES.map(c => c.carrier), rejectedCarriers: [], warnings: [] };
  }

  const accepting: string[] = [];
  const rejected: string[] = [];

  for (const rule of CARRIER_RULES) {
    const accepted = rule.acceptsClasses.some(ac => mapping!.hazardClass === ac || mapping!.hazardClass.startsWith(ac));
    const weightOk = !weightKg || weightKg <= rule.maxWeightKg;

    if (accepted && weightOk) {
      accepting.push(rule.carrier);
    } else {
      rejected.push(rule.carrier);
      if (!accepted) warnings.push(`${rule.carrierName}: Does not accept Class ${mapping.hazardClass}.`);
      else warnings.push(`${rule.carrierName}: Weight ${weightKg}kg exceeds ${rule.maxWeightKg}kg limit.`);
    }
  }

  return { hsCode: clean, isDangerous: true, unMapping: mapping, acceptingCarriers: accepting, rejectedCarriers: rejected, warnings };
}
