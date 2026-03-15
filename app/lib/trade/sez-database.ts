/**
 * F031: Special Economic Zones Database
 */

export interface SEZInfo {
  id: string;
  name: string;
  country: string;
  type: 'FTZ' | 'SEZ' | 'EPZ' | 'Free_Port';
  benefits: string[];
  eligibleActivities: string[];
  taxIncentives: string[];
}

const SEZ_DATA: SEZInfo[] = [
  { id: 'US-FTZ', name: 'US Foreign-Trade Zones', country: 'US', type: 'FTZ', benefits: ['Duty deferral', 'Duty elimination on re-exports', 'Inverted tariff relief', 'Weekly entry savings'], eligibleActivities: ['Manufacturing', 'Assembly', 'Processing', 'Storage', 'Distribution'], taxIncentives: ['No duty on re-exported goods', 'Reduced duty on components vs finished goods'] },
  { id: 'CN-SHFTZ', name: 'Shanghai Free Trade Zone', country: 'CN', type: 'FTZ', benefits: ['Streamlined customs', 'Negative list for foreign investment', 'Cross-border RMB settlement'], eligibleActivities: ['Financial services', 'Trade services', 'Professional services', 'Advanced manufacturing'], taxIncentives: ['15% CIT for qualifying enterprises', 'VAT exemption on certain services'] },
  { id: 'CN-SZFTZ', name: 'Shenzhen SEZ', country: 'CN', type: 'SEZ', benefits: ['Preferential tax rates', 'Streamlined approvals', 'IP protection'], eligibleActivities: ['High-tech manufacturing', 'R&D', 'Financial services'], taxIncentives: ['15% CIT', 'Tax holidays for new enterprises'] },
  { id: 'AE-JAFZ', name: 'Jebel Ali Free Zone', country: 'AE', type: 'FTZ', benefits: ['100% foreign ownership', '0% corporate tax', '0% personal income tax', 'Full repatriation of profits'], eligibleActivities: ['Trading', 'Manufacturing', 'Logistics', 'Services'], taxIncentives: ['0% import/export duties within zone', '0% corporate tax (50 years guarantee)'] },
  { id: 'AE-DIFC', name: 'Dubai International Financial Centre', country: 'AE', type: 'Free_Port', benefits: ['Independent legal system (common law)', '100% foreign ownership', '0% tax'], eligibleActivities: ['Banking', 'Insurance', 'Asset management', 'Fintech'], taxIncentives: ['0% tax on income and profits (50 years)'] },
  { id: 'SG-FTZ', name: 'Singapore Free Trade Zone', country: 'SG', type: 'FTZ', benefits: ['GST suspension', 'Streamlined permits', 'Duty-free storage'], eligibleActivities: ['Transshipment', 'Storage', 'Processing', 'Distribution'], taxIncentives: ['No GST on goods within zone', 'Duty exemption'] },
  { id: 'EU-HAMBURG', name: 'Hamburg Free Port', country: 'DE', type: 'Free_Port', benefits: ['Duty suspension', 'VAT deferral', 'Simplified procedures'], eligibleActivities: ['Storage', 'Processing', 'Distribution', 'Manufacturing'], taxIncentives: ['Duties/VAT due only when goods enter EU customs territory'] },
  { id: 'KR-IFEZ', name: 'Incheon Free Economic Zone', country: 'KR', type: 'SEZ', benefits: ['Tax incentives', 'Deregulation', 'One-stop service'], eligibleActivities: ['Logistics', 'IT', 'Biotech', 'Finance', 'Tourism'], taxIncentives: ['3-year tax exemption + 2-year 50% reduction', 'Customs duty exemption on capital goods'] },
];

export function getSEZByCountry(country: string): SEZInfo[] {
  return SEZ_DATA.filter(s => s.country === country.toUpperCase());
}

export function getSEZById(zoneId: string): SEZInfo | undefined {
  return SEZ_DATA.find(s => s.id === zoneId);
}

export function searchSEZ(query: string): SEZInfo[] {
  const q = query.toLowerCase();
  return SEZ_DATA.filter(s =>
    s.name.toLowerCase().includes(q) || s.country.toLowerCase() === q || s.id.toLowerCase().includes(q)
  );
}

export function getAllSEZ(): SEZInfo[] {
  return SEZ_DATA;
}
