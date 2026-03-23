/**
 * Source Verifier — validates data source URLs and content patterns.
 * HTTP 200 ≠ valid. Must check content keywords/structure.
 */

export interface SourceConfig {
  fileId: string;
  sourceUrl: string;
  expectedPattern: {
    keywords: string[];
    minContentLength?: number;
    dataStructure?: 'json' | 'xml' | 'csv' | 'html';
  };
  fallbackUrls: string[];
  parentPageUrl?: string;
}

export interface VerificationResult {
  status: 'valid' | 'content_moved' | 'url_dead' | 'structure_changed';
  contentChanged: boolean;
  newHash?: string;
  missingKeywords?: string[];
}

export const SOURCE_CONFIGS: SourceConfig[] = [
  {
    fileId: 'external:ecb_daily_xml',
    sourceUrl: 'https://www.ecb.europa.eu/stats/eurofxref/eurofxref-daily.xml',
    expectedPattern: { keywords: ['Cube', 'currency', 'rate'], dataStructure: 'xml', minContentLength: 1000 },
    fallbackUrls: ['https://www.ecb.europa.eu/stats/policy_and_exchange_rates/euro_reference_exchange_rates/html/index.en.html'],
  },
  {
    fileId: 'db:sanctions_entries',
    sourceUrl: 'https://sanctionslist.ofac.treas.gov/Home/SdnList',
    expectedPattern: { keywords: ['SDN', 'sanction', 'OFAC'], minContentLength: 5000 },
    fallbackUrls: ['https://www.treasury.gov/ofac/downloads/sdnlist.txt'],
  },
  {
    fileId: 'db:macmap_ntlc_rates',
    sourceUrl: 'https://www.macmap.org/',
    expectedPattern: { keywords: ['tariff', 'market access', 'ITC'], minContentLength: 2000 },
    fallbackUrls: [],
  },
  {
    fileId: 'db:trade_remedy_cases',
    sourceUrl: 'https://www.trade.gov/enforcement-and-compliance',
    expectedPattern: { keywords: ['antidumping', 'countervailing', 'enforcement'], minContentLength: 3000 },
    fallbackUrls: ['https://www.usitc.gov/'],
  },
  {
    fileId: 'db:vat_gst_rates',
    sourceUrl: 'https://ec.europa.eu/taxation_customs/tedb/',
    expectedPattern: { keywords: ['VAT', 'tax', 'rate'], minContentLength: 1000 },
    fallbackUrls: [],
  },
];

function simpleHash(str: string): string {
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    const char = str.charCodeAt(i);
    hash = ((hash << 5) - hash) + char;
    hash |= 0;
  }
  return hash.toString(16);
}

/** Verify a source URL's content matches expected patterns */
export async function verifySource(config: SourceConfig): Promise<VerificationResult> {
  try {
    const response = await fetch(config.sourceUrl, {
      signal: AbortSignal.timeout(10000),
      headers: { 'User-Agent': 'POTAL-DataVerifier/1.0' },
    });

    if (!response.ok) {
      return { status: 'url_dead', contentChanged: false };
    }

    const content = await response.text();

    if (config.expectedPattern.minContentLength && content.length < config.expectedPattern.minContentLength) {
      return { status: 'content_moved', contentChanged: false };
    }

    const missing = config.expectedPattern.keywords.filter(
      kw => !content.toLowerCase().includes(kw.toLowerCase())
    );

    if (missing.length > config.expectedPattern.keywords.length * 0.5) {
      return { status: 'content_moved', contentChanged: false, missingKeywords: missing };
    }

    return { status: 'valid', contentChanged: true, newHash: simpleHash(content.substring(0, 5000)) };
  } catch {
    return { status: 'url_dead', contentChanged: false };
  }
}
