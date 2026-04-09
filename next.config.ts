import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  async redirects() {
    return [
      { source: '/widget-demo', destination: '/widget/demo', permanent: true },
      // /tools → /features redirects (CW22-S4e: tools consolidated into features)
      { source: '/tools', destination: '/features', permanent: true },
      { source: '/tools/screening', destination: '/features/sanctions-screening', permanent: true },
      { source: '/tools/hs-lookup', destination: '/features/hs-code-classification', permanent: true },
      { source: '/tools/export-controls', destination: '/features/export-controls', permanent: true },
      { source: '/tools/classify-eccn', destination: '/features/eccn-classification', permanent: true },
      { source: '/tools/dual-use', destination: '/features/export-controls', permanent: true },
      { source: '/tools/embargo', destination: '/features/trade-embargo-check', permanent: true },
      { source: '/tools/restrictions', destination: '/features/restricted-items', permanent: true },
      { source: '/tools/pre-shipment', destination: '/features/pre-shipment-check', permanent: true },
      { source: '/tools/compliance-report', destination: '/features/compliance-report', permanent: true },
      { source: '/tools/anti-dumping', destination: '/features/anti-dumping-duties', permanent: true },
      { source: '/tools/ics2', destination: '/features/ics2-filing', permanent: true },
      { source: '/tools/type86', destination: '/features/type86-entry', permanent: true },
      { source: '/tools/customs-forms', destination: '/features/customs-documentation', permanent: true },
      { source: '/tools/customs-docs', destination: '/features/customs-documentation', permanent: true },
      { source: '/tools/de-minimis', destination: '/features/de-minimis-check', permanent: true },
      { source: '/tools/batch', destination: '/features/batch-classification', permanent: true },
      { source: '/tools/image-classify', destination: '/features/image-classification', permanent: true },
      { source: '/tools/fta', destination: '/features/fta-detection', permanent: true },
      { source: '/tools/compare', destination: '/features/compare-origins', permanent: true },
      { source: '/tools/currency', destination: '/features/currency-conversion', permanent: true },
      { source: '/tools/tax', destination: '/features/tax-calculation-vat-gst', permanent: true },
      { source: '/tools/vat-check', destination: '/features/vat-registration-check', permanent: true },
      { source: '/tools/tax-exemptions', destination: '/features/tax-exemptions', permanent: true },
      { source: '/tools/digital-tax', destination: '/features/digital-services-tax', permanent: true },
      { source: '/tools/ioss', destination: '/features/ioss-registration', permanent: true },
      { source: '/tools/ddp-calculator', destination: '/features/ddp-ddu-calculator', permanent: true },
      { source: '/tools/shipping', destination: '/features/shipping-rates', permanent: true },
      { source: '/tools/returns', destination: '/features/cross-border-returns', permanent: true },
      { source: '/tools/label-generation', destination: '/features/shipping-labels', permanent: true },
      { source: '/tools/pdf-reports', destination: '/features/pdf-reports', permanent: true },
      { source: '/tools/e-invoice', destination: '/features/e-invoicing', permanent: true },
      { source: '/tools/checkout', destination: '/features/checkout-widget', permanent: true },
      { source: '/tools/csv-export', destination: '/features/csv-export', permanent: true },
      { source: '/tools/countries', destination: '/features/country-database', permanent: true },
      { source: '/tools/multi-currency', destination: '/features/currency-conversion', permanent: true },
      { source: '/tools/safeguard', destination: '/features/safeguard-measures', permanent: true },
      { source: '/tools/dangerous-goods', destination: '/features/dangerous-goods', permanent: true },
      { source: '/tools/confidence', destination: '/features/confidence-score', permanent: true },
      { source: '/tools/audit-trail', destination: '/features/audit-trail', permanent: true },
      { source: '/tools/price-break', destination: '/features/price-break-rules', permanent: true },
      { source: '/tools/origin-detection', destination: '/features/origin-determination', permanent: true },
      { source: '/tools/insurance', destination: '/features/shipping-insurance', permanent: true },
      // CW22-S6: F148 US Sales Tax Nexus Tracking
      { source: '/tools/us-nexus-tracker', destination: '/features/us-sales-tax-nexus-tracking', permanent: true },
      { source: '/tools/nexus', destination: '/features/us-sales-tax-nexus-tracking', permanent: true },
    ];
  },
  images: {
    remotePatterns: [
      { protocol: 'https', hostname: 'm.media-amazon.com' },
      { protocol: 'https', hostname: 'images-na.ssl-images-amazon.com' },
      { protocol: 'https', hostname: 'i5.walmartimages.com' },
      { protocol: 'https', hostname: 'i.ebayimg.com' },
      { protocol: 'https', hostname: 'target.scene7.com' },
      { protocol: 'https', hostname: 'pisces.bbystatic.com' },
      { protocol: 'https', hostname: 'img.temu.com' },
      { protocol: 'https', hostname: 'ae01.alicdn.com' },
      { protocol: 'https', hostname: 'www.costco.com' },
      { protocol: 'https', hostname: 'c1.neweggimages.com' },
      // Shein
      { protocol: 'https', hostname: 'img.ltwebstatic.com' },
    ],
  },
};

export default nextConfig;
