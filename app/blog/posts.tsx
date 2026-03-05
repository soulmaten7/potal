import React from 'react';

export interface BlogPost {
  slug: string;
  title: string;
  description: string;
  date: string;
  readingTime: number;
  author: string;
  category: string;
  image?: string;
  content: React.ComponentType<any>;
}

// Post 1: Understanding Total Landed Cost
const TotalLandedCostContent = () => (
  <div className="prose prose-lg dark:prose-invert max-w-4xl mx-auto px-4 py-8">
    <p>
      When selling internationally, the price your customer sees at checkout is rarely the price they
      end up paying. Import duties, taxes, and customs fees can add 15-40% to the product price — and
      when buyers discover these charges at delivery, they abandon orders or request refunds.
    </p>

    <h2>What is Total Landed Cost?</h2>
    <p>
      Total Landed Cost (TLC) is the complete price a buyer pays to receive a product from another country.
      It includes the product price, shipping, import duties, VAT/GST, customs processing fees, and any
      other charges assessed at the border.
    </p>

    <h3>Components of Landed Cost</h3>
    <ul>
      <li><strong>Product Price:</strong> The base cost of the item</li>
      <li><strong>Shipping:</strong> International freight and last-mile delivery</li>
      <li><strong>Import Duty:</strong> A percentage tariff based on the HS Code classification and origin country</li>
      <li><strong>VAT / GST:</strong> Value-added tax charged by the destination country (typically 5-27%)</li>
      <li><strong>Customs Processing Fee:</strong> Administrative charges for clearing goods</li>
      <li><strong>De Minimis Threshold:</strong> Some countries waive duties below a certain order value</li>
    </ul>

    <h2>Why It Matters for E-Commerce Sellers</h2>
    <p>
      Studies show that unexpected fees at delivery are the #1 reason for cross-border cart abandonment.
      By showing the total landed cost upfront, sellers can increase conversion rates by up to 30% and
      significantly reduce refund requests.
    </p>

    <h2>How POTAL Helps</h2>
    <p>
      POTAL calculates the total landed cost in real-time for 139 countries. Our API takes the product
      details, origin, and destination, then returns the exact duty rate, tax amount, and any applicable
      fees — all in under 120ms. Embed our widget on your product page or integrate via REST API.
    </p>
  </div>
);

// Post 2: HS Code Classification Guide
const HsCodeGuideContent = () => (
  <div className="prose prose-lg dark:prose-invert max-w-4xl mx-auto px-4 py-8">
    <p>
      HS Codes (Harmonized System codes) are the backbone of international trade. Every product that crosses
      a border must be classified with an HS Code, which determines the duty rate applied by customs.
      Getting it wrong can mean overpaying duties or facing penalties.
    </p>

    <h2>What is an HS Code?</h2>
    <p>
      The Harmonized System is a standardized numerical method of classifying traded products. It is used
      by customs authorities in over 200 countries. The first 6 digits are internationally standardized;
      countries add additional digits for more specificity.
    </p>

    <h3>Structure of an HS Code</h3>
    <ul>
      <li><strong>Chapter (2 digits):</strong> Broad category (e.g., 61 = Knitted apparel)</li>
      <li><strong>Heading (4 digits):</strong> More specific group (e.g., 6109 = T-shirts)</li>
      <li><strong>Subheading (6 digits):</strong> Product type (e.g., 6109.10 = Cotton T-shirts)</li>
      <li><strong>National lines (8-10 digits):</strong> Country-specific classification</li>
    </ul>

    <h2>AI-Powered Classification with POTAL</h2>
    <p>
      Manually classifying products is time-consuming and error-prone. POTAL uses AI to automatically
      classify your products into the correct HS Code based on the product name, description, and
      category. Our system covers 50+ product categories and continuously improves accuracy.
    </p>

    <h2>Best Practices for Sellers</h2>
    <ul>
      <li>Always classify products before listing them for international sale</li>
      <li>Use specific product descriptions to get more accurate classifications</li>
      <li>Check if your products qualify for preferential rates under Free Trade Agreements</li>
      <li>Consider using POTAL&apos;s batch API to classify your entire catalog at once</li>
    </ul>
  </div>
);

// Post 3: De Minimis Thresholds
const DeMinimisContent = () => (
  <div className="prose prose-lg dark:prose-invert max-w-4xl mx-auto px-4 py-8">
    <p>
      One of the most powerful tools for cross-border sellers is understanding de minimis thresholds.
      These are the value limits below which a country does not charge import duties or taxes on goods.
      Knowing these thresholds can help you price products strategically for international markets.
    </p>

    <h2>What is De Minimis?</h2>
    <p>
      De minimis (Latin for &quot;about minimal things&quot;) is the threshold value below which goods
      can be imported without incurring customs duties or taxes. Each country sets its own threshold.
    </p>

    <h3>Key Thresholds by Country</h3>
    <ul>
      <li><strong>United States:</strong> $800 (one of the highest in the world)</li>
      <li><strong>Canada:</strong> CAD $20 for tax, CAD $150 for duty</li>
      <li><strong>European Union:</strong> €150 for duty (VAT applies from €0 since July 2021)</li>
      <li><strong>United Kingdom:</strong> £135 for VAT collection shift to seller</li>
      <li><strong>Australia:</strong> AUD $1,000</li>
      <li><strong>Japan:</strong> ¥10,000 (~$67 USD)</li>
    </ul>

    <h2>Strategic Pricing for Sellers</h2>
    <p>
      If you sell lightweight, lower-value items, you may be able to price products below de minimis
      thresholds in key markets — effectively offering duty-free delivery to your customers. POTAL
      automatically factors in de minimis rules when calculating landed costs.
    </p>
  </div>
);

// Helper functions for blog post lookup
export function getBlogPost(slug: string): BlogPost | undefined {
  return blogPosts.find(post => post.slug === slug);
}

export function getAllBlogPostSlugs(): string[] {
  return blogPosts.map(post => post.slug);
}

export const blogPosts: BlogPost[] = [
  {
    slug: 'understanding-total-landed-cost',
    title: 'Understanding Total Landed Cost: A Complete Guide for E-Commerce Sellers',
    description: 'Learn what total landed cost is, why it matters for cross-border commerce, and how to calculate duties, taxes, and fees for international orders.',
    date: 'March 1, 2026',
    readingTime: 5,
    author: 'POTAL Team',
    category: 'Guide',
    content: TotalLandedCostContent,
  },
  {
    slug: 'hs-code-classification-guide',
    title: 'HS Code Classification: How to Classify Products for International Trade',
    description: 'Everything sellers need to know about HS Codes — the system that determines import duty rates for every product crossing a border.',
    date: 'February 20, 2026',
    readingTime: 6,
    author: 'POTAL Team',
    category: 'Technical',
    content: HsCodeGuideContent,
  },
  {
    slug: 'de-minimis-thresholds-2026',
    title: 'De Minimis Thresholds by Country (2026): A Strategic Guide for Sellers',
    description: 'Understand de minimis thresholds and how to use them strategically to offer duty-free delivery in key international markets.',
    date: 'February 10, 2026',
    readingTime: 4,
    author: 'POTAL Team',
    category: 'Strategy',
    content: DeMinimisContent,
  },
];
