/**
 * F037: Customs Broker Data Export
 * ABI format, pre-filing package generation.
 */

export interface BrokerExportData {
  importer: { name: string; country: string; taxId?: string };
  exporter: { name: string; country: string };
  items: Array<{ hsCode: string; description: string; value: number; quantity: number; origin: string; weight?: number }>;
  totals: { declaredValue: number; estimatedDuty: number; estimatedVat: number };
  incoterm: string;
  currency: string;
}

export function exportABI(data: BrokerExportData): string {
  // Simplified ABI (Automated Broker Interface) format
  const lines: string[] = [];
  const now = new Date();
  const dateStr = `${now.getFullYear()}${String(now.getMonth() + 1).padStart(2, '0')}${String(now.getDate()).padStart(2, '0')}`;

  // Header
  lines.push(`SE|${dateStr}|POTAL|001`);
  // Importer
  lines.push(`IMP|${data.importer.name}|${data.importer.country}|${data.importer.taxId || ''}`);
  // Exporter
  lines.push(`EXP|${data.exporter.name}|${data.exporter.country}`);
  // Items
  for (let i = 0; i < data.items.length; i++) {
    const item = data.items[i];
    lines.push(`LN|${i + 1}|${item.hsCode}|${item.description}|${item.quantity}|${item.value}|${item.origin}|${item.weight || ''}`);
  }
  // Totals
  lines.push(`TOT|${data.totals.declaredValue}|${data.totals.estimatedDuty}|${data.totals.estimatedVat}|${data.currency}|${data.incoterm}`);
  // Footer
  lines.push(`END|${data.items.length}`);

  return lines.join('\n');
}

export function exportCSV(data: BrokerExportData): string {
  const headers = ['Line', 'HS Code', 'Description', 'Quantity', 'Value', 'Origin', 'Weight'];
  const rows = data.items.map((item, i) =>
    [i + 1, item.hsCode, `"${item.description}"`, item.quantity, item.value, item.origin, item.weight || ''].join(',')
  );
  return [headers.join(','), ...rows].join('\n');
}

export function exportXML(data: BrokerExportData): string {
  const items = data.items.map((item, i) => `
    <Item line="${i + 1}">
      <HSCode>${item.hsCode}</HSCode>
      <Description>${item.description.replace(/&/g, '&amp;').replace(/</g, '&lt;')}</Description>
      <Quantity>${item.quantity}</Quantity>
      <Value>${item.value}</Value>
      <Origin>${item.origin}</Origin>
      <Weight>${item.weight || ''}</Weight>
    </Item>`).join('');

  return `<?xml version="1.0" encoding="UTF-8"?>
<CustomsDeclaration generated="${new Date().toISOString()}" source="POTAL">
  <Importer name="${data.importer.name}" country="${data.importer.country}" taxId="${data.importer.taxId || ''}"/>
  <Exporter name="${data.exporter.name}" country="${data.exporter.country}"/>
  <Items>${items}
  </Items>
  <Totals declaredValue="${data.totals.declaredValue}" estimatedDuty="${data.totals.estimatedDuty}" estimatedVat="${data.totals.estimatedVat}" currency="${data.currency}" incoterm="${data.incoterm}"/>
</CustomsDeclaration>`;
}

export function generatePreFilingChecklist(data: BrokerExportData): string[] {
  const checklist = [
    'Commercial Invoice (signed)',
    'Packing List',
    'Bill of Lading / Airway Bill',
    `Customs entry form (${data.importer.country})`,
    'Certificate of Origin (if claiming FTA)',
  ];

  // Country-specific
  if (data.importer.country === 'US') checklist.push('CBP Form 3461 (Entry/Immediate Delivery)', 'CBP Form 7501 (Entry Summary)', 'ISF 10+2 filing (ocean shipments)');
  if (data.importer.country === 'EU' || data.importer.country === 'DE' || data.importer.country === 'FR') checklist.push('SAD (Single Administrative Document)', 'EORI number', 'ICS2 pre-arrival filing');
  if (data.importer.country === 'GB') checklist.push('C88 form', 'EORI number', 'Goods Vehicle Movement Service reference');

  return checklist;
}
