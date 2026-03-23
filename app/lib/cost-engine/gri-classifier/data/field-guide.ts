/**
 * Field Guide — reference data for each of the 9 input fields.
 * Used in API docs, validation error messages, and onboarding.
 */

export const FIELD_GUIDE = {
  product_name: {
    title: 'Product Name',
    required: true,
    impact: '+18% accuracy',
    format: 'Product title as listed on your store',
    examples: ['Men\'s Cotton T-Shirt', 'Wireless Bluetooth Earbuds', 'Stainless Steel Water Bottle'],
  },
  material: {
    title: 'Material',
    required: true,
    impact: '+45% accuracy (CRITICAL)',
    format: 'Primary material name from WCO standard list',
    examples: ['cotton', 'polyester', 'steel', 'leather', 'plastic', 'wood', 'glass', 'ceramic', 'rubber', 'gold'],
    common_mistakes: [
      { wrong: 'Alloy', correct: 'steel or aluminum (specify base metal)' },
      { wrong: 'Mixed', correct: 'Specify primary material (>50% by weight)' },
      { wrong: 'N/A', correct: 'Every physical product has a material' },
    ],
  },
  origin_country: {
    title: 'Origin Country',
    required: true,
    impact: 'Required for 7-10 digit HS code + duty rates',
    format: 'ISO 3166-1 alpha-2 code',
    examples: ['US', 'CN', 'DE', 'JP', 'KR', 'VN', 'IN', 'MX', 'GB'],
    common_mistakes: [
      { wrong: 'China', correct: 'CN' },
      { wrong: 'USA', correct: 'US' },
      { wrong: 'UK', correct: 'GB' },
    ],
  },
  category: {
    title: 'Category',
    required: false,
    impact: '+33% accuracy',
    format: 'WCO Chapter description or common product category',
    examples: ['Clothing', 'Electronics', 'Furniture', 'Toys', 'Footwear', 'Jewelry', 'Pharmaceutical products'],
    common_mistakes: [
      { wrong: 'Random Stuff', correct: 'Use WCO Chapter terms: Clothing, Footwear, Furniture, etc.' },
      { wrong: 'Misc', correct: 'Specify the product type: Toys, Electronics, etc.' },
    ],
  },
  processing: {
    title: 'Processing',
    required: false,
    impact: 'Heading distinction (knitted vs woven)',
    format: 'Manufacturing method',
    examples: ['knitted', 'woven', 'forged', 'cast', 'molded', 'frozen', 'dried'],
  },
  composition: {
    title: 'Composition',
    required: false,
    impact: 'Subheading distinction (cotton vs blend)',
    format: 'Percentage breakdown',
    examples: ['100% cotton', '85% cotton, 15% polyester', 'leather upper, rubber outsole'],
  },
  weight_spec: {
    title: 'Weight/Spec',
    required: false,
    impact: 'Weight-based tariff distinctions',
    format: 'Number + SI unit or trade unit. HS Code uses these for tariff splits.',
    examples: ['200g/m²', '5kg', '0.5mm', '100ml', '12V', '2000mAh', '50W'],
  },
  price: {
    title: 'Price (USD)',
    required: false,
    impact: 'Price-break tariff rules ("valued over/under $X")',
    format: 'Positive number in USD. TLC calculation converts to local currency automatically.',
    examples: [9.99, 49.99, 199.00],
  },
  description: {
    title: 'Description',
    required: false,
    impact: '+5% accuracy at Heading level',
    format: 'Customs declaration style: meaningful product description (min 10 chars)',
    examples: ['Short-sleeve crew-neck cotton t-shirt, screen printed graphic', 'Wireless bluetooth earbuds with charging case, noise cancelling'],
  },
};
