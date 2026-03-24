/**
 * F027: Customs Document Auto-Population
 * Pre-fills customs forms from seller/buyer/product profiles.
 */

export interface SellerProfile {
  name: string;
  address: string;
  country: string;
  taxId?: string;
  eori?: string;
  phone?: string;
  email?: string;
}

export interface BuyerProfile {
  name: string;
  address: string;
  country: string;
  taxId?: string;
  phone?: string;
}

export interface ProductProfile {
  name: string;
  hsCode: string;
  description: string;
  weight?: number;
  unitValue: number;
  origin: string;
  material?: string;
}

export interface AutoPopulateInput {
  seller: SellerProfile;
  buyer: BuyerProfile;
  products: ProductProfile[];
  incoterm?: string;
  currency?: string;
  invoiceNumber?: string;
  shipmentDate?: string;
}

export interface PopulatedDocument {
  type: string;
  fields: Record<string, string | number | undefined>;
}

/**
 * Validate input before auto-populating customs documents.
 * Returns array of error messages. Empty array = valid.
 */
export function validateAutoPopulateInput(input: AutoPopulateInput): string[] {
  const errors: string[] = [];

  // Seller validation
  if (!input.seller?.name) errors.push('seller.name is required');
  if (!input.seller?.address) errors.push('seller.address is required');
  if (!input.seller?.country || input.seller.country.length !== 2) errors.push('seller.country must be ISO 2-letter code');

  // Buyer validation
  if (!input.buyer?.name) errors.push('buyer.name is required');
  if (!input.buyer?.address) errors.push('buyer.address is required');
  if (!input.buyer?.country || input.buyer.country.length !== 2) errors.push('buyer.country must be ISO 2-letter code');

  // Products validation
  if (!input.products || input.products.length === 0) errors.push('At least one product is required');
  for (let i = 0; i < (input.products || []).length; i++) {
    const p = input.products[i];
    if (!p.name) errors.push(`products[${i}].name is required`);
    if (!p.hsCode || !/^\d{6,10}$/.test(p.hsCode.replace(/[\s.\-]/g, ''))) {
      errors.push(`products[${i}].hsCode must be 6-10 digits`);
    }
    if (typeof p.unitValue !== 'number' || p.unitValue <= 0) {
      errors.push(`products[${i}].unitValue must be a positive number`);
    }
    if (!p.origin || p.origin.length !== 2) errors.push(`products[${i}].origin must be ISO 2-letter code`);
  }

  return errors;
}

export function autoPopulateCommercialInvoice(input: AutoPopulateInput): PopulatedDocument {
  const totalValue = input.products.reduce((s, p) => s + p.unitValue, 0);
  return {
    type: 'commercial_invoice',
    fields: {
      invoice_number: input.invoiceNumber || `INV-${Date.now()}`,
      date: input.shipmentDate || new Date().toISOString().split('T')[0],
      seller_name: input.seller.name,
      seller_address: input.seller.address,
      seller_country: input.seller.country,
      seller_tax_id: input.seller.taxId,
      buyer_name: input.buyer.name,
      buyer_address: input.buyer.address,
      buyer_country: input.buyer.country,
      buyer_tax_id: input.buyer.taxId,
      incoterm: input.incoterm || 'FOB',
      currency: input.currency || 'USD',
      total_value: totalValue,
      item_count: input.products.length,
    },
  };
}

export function autoPopulatePackingList(input: AutoPopulateInput): PopulatedDocument {
  const totalWeight = input.products.reduce((s, p) => s + (p.weight || 0), 0);
  return {
    type: 'packing_list',
    fields: {
      date: input.shipmentDate || new Date().toISOString().split('T')[0],
      seller_name: input.seller.name,
      buyer_name: input.buyer.name,
      total_packages: input.products.length,
      total_weight_kg: totalWeight,
      origin_country: input.seller.country,
      destination_country: input.buyer.country,
    },
  };
}

export function autoPopulateCertificateOfOrigin(input: AutoPopulateInput): PopulatedDocument {
  const origins = [...new Set(input.products.map(p => p.origin))];
  return {
    type: 'certificate_of_origin',
    fields: {
      exporter_name: input.seller.name,
      exporter_address: input.seller.address,
      exporter_country: input.seller.country,
      consignee_name: input.buyer.name,
      consignee_country: input.buyer.country,
      origin_countries: origins.join(', '),
      hs_codes: input.products.map(p => p.hsCode).join(', '),
      eori: input.seller.eori,
    },
  };
}

export function autoPopulateCustomsDeclaration(input: AutoPopulateInput): PopulatedDocument {
  const totalValue = input.products.reduce((s, p) => s + p.unitValue, 0);
  return {
    type: 'customs_declaration',
    fields: {
      declarant_name: input.buyer.name,
      declarant_address: input.buyer.address,
      declarant_country: input.buyer.country,
      declarant_tax_id: input.buyer.taxId,
      exporter_name: input.seller.name,
      exporter_country: input.seller.country,
      total_declared_value: totalValue,
      currency: input.currency || 'USD',
      number_of_items: input.products.length,
      incoterm: input.incoterm || 'FOB',
    },
  };
}

export function autoPopulateAll(input: AutoPopulateInput): PopulatedDocument[] {
  return [
    autoPopulateCommercialInvoice(input),
    autoPopulatePackingList(input),
    autoPopulateCertificateOfOrigin(input),
    autoPopulateCustomsDeclaration(input),
  ];
}
