/**
 * POTAL Cron — /api/v1/cron/tariff-change-monitor
 *
 * Monitors 50 countries' customs authority pages for tariff changes.
 * Uses page hash comparison to detect content changes.
 *
 * Vercel Cron: weekly Sunday 05:00 UTC
 */

import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const CRON_SECRET = process.env.CRON_SECRET || '';
const RESEND_API_KEY = process.env.RESEND_API_KEY || '';
const EMAIL_TO = process.env.MORNING_BRIEF_EMAIL_TO || 'contact@potal.app';
const EMAIL_FROM = process.env.MORNING_BRIEF_EMAIL_FROM || 'POTAL <onboarding@resend.dev>';

function verifyCronAuth(req: NextRequest): boolean {
  const authHeader = req.headers.get('Authorization');
  if (authHeader?.startsWith('Bearer ') && authHeader.slice(7) === CRON_SECRET) return true;
  return req.nextUrl.searchParams.get('secret') === CRON_SECRET;
}

function getSupabase() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || ''
  );
}

interface CountryTarget {
  code: string;
  name: string;
  authority: string;
  url: string;
}

const COUNTRIES: CountryTarget[] = [
  { code: 'US', name: 'United States', authority: 'USITC', url: 'https://www.usitc.gov/harmonized_tariff_information/modifications_to_hts' },
  { code: 'EU', name: 'European Union', authority: 'TARIC', url: 'https://taxation-customs.ec.europa.eu/customs/customs-tariff/eu-customs-tariff-taric_en' },
  { code: 'GB', name: 'United Kingdom', authority: 'HMRC', url: 'https://www.trade-tariff.service.gov.uk/news' },
  { code: 'CA', name: 'Canada', authority: 'CBSA', url: 'https://www.cbsa-asfc.gc.ca/trade-commerce/tariff-tarif/2026/menu-eng.html' },
  { code: 'AU', name: 'Australia', authority: 'ABF', url: 'https://www.abf.gov.au/importing-exporting-and-manufacturing/tariff-classification/current-tariff' },
  { code: 'JP', name: 'Japan', authority: 'Japan Customs', url: 'https://www.customs.go.jp/english/tariff/index.htm' },
  { code: 'KR', name: 'Korea', authority: 'KCS', url: 'https://www.customs.go.kr/english/ad/ct/CustomsTariffList.do?mi=8037' },
  { code: 'CN', name: 'China', authority: 'GACC', url: 'http://english.customs.gov.cn/' },
  { code: 'IN', name: 'India', authority: 'CBIC', url: 'https://www.cbic.gov.in/entities/cbic-content-mst/Njk=' },
  { code: 'BR', name: 'Brazil', authority: 'Receita Federal', url: 'https://www.gov.br/receitafederal/' },
  { code: 'MX', name: 'Mexico', authority: 'DOF', url: 'https://www.dof.gob.mx/' },
  { code: 'TR', name: 'Turkey', authority: 'Trade Ministry', url: 'https://ticaret.gov.tr/gumruk-islemleri' },
  { code: 'SA', name: 'Saudi Arabia', authority: 'ZATCA', url: 'https://zatca.gov.sa/en/Pages/default.aspx' },
  { code: 'AE', name: 'UAE', authority: 'FCA', url: 'https://www.customs.ae/' },
  { code: 'SG', name: 'Singapore', authority: 'Customs', url: 'https://www.customs.gov.sg/news-and-media/' },
  { code: 'TH', name: 'Thailand', authority: 'Thai Customs', url: 'https://www.customs.go.th' },
  { code: 'VN', name: 'Vietnam', authority: 'Vietnam Customs', url: 'https://www.customs.gov.vn/index.jsp?pageId=3&cid=30' },
  { code: 'ID', name: 'Indonesia', authority: 'DJBC', url: 'https://www.beacukai.go.id/' },
  { code: 'ZA', name: 'South Africa', authority: 'SARS', url: 'https://www.sars.gov.za/legal-counsel/secondary-legislation/tariff-amendments/tariff-amendments-2026/' },
  { code: 'RU', name: 'Russia', authority: 'FCS', url: 'https://customs.gov.ru/' },
  { code: 'CH', name: 'Switzerland', authority: 'BAZG', url: 'https://www.bazg.admin.ch/bazg/en/home/services/services-firmen/services-firmen_einfuhr-ausfuhr-durchfuhr/zolltarif-tares.html' },
  { code: 'NO', name: 'Norway', authority: 'Tolletaten', url: 'https://www.toll.no/en/corporate/norwegian-customs-tariff/' },
  { code: 'NZ', name: 'New Zealand', authority: 'NZ Customs', url: 'https://www.customs.govt.nz/about-us/news/important-notices/' },
  { code: 'IL', name: 'Israel', authority: 'ITA Customs', url: 'https://shaarolami-query.customs.mof.gov.il/CustomspilotWeb/en/CustomsBook/Import/Doubt' },
  { code: 'CL', name: 'Chile', authority: 'Aduanas', url: 'https://www.aduana.cl/' },
  { code: 'CO', name: 'Colombia', authority: 'DIAN', url: 'https://www.dian.gov.co/' },
  { code: 'PE', name: 'Peru', authority: 'SUNAT', url: 'https://www.sunat.gob.pe/customsinformation/' },
  { code: 'AR', name: 'Argentina', authority: 'AFIP', url: 'https://www.afip.gob.ar/aduana/' },
  { code: 'PH', name: 'Philippines', authority: 'Tariff Commission', url: 'https://finder.tariffcommission.gov.ph/' },
  { code: 'MY', name: 'Malaysia', authority: 'JKDM', url: 'https://www.customs.gov.my/en/ip/Pages/ip_trfv.aspx' },
  { code: 'TW', name: 'Taiwan', authority: 'Customs Admin', url: 'https://web.customs.gov.tw/en/multiplehtml/3349' },
  { code: 'HK', name: 'Hong Kong', authority: 'C&ED', url: 'https://www.customs.gov.hk/en/service-enforcement-information/trade-facilitation/fta/update/' },
  { code: 'EG', name: 'Egypt', authority: 'Customs', url: 'http://www.fei.org.eg/tariff/tariff.php' },
  { code: 'NG', name: 'Nigeria', authority: 'NCS', url: 'https://customs.gov.ng/?page_id=3133' },
  { code: 'KE', name: 'Kenya', authority: 'KRA/EAC', url: 'https://www.eac.int/customs/tariff-regimes' },
  { code: 'MA', name: 'Morocco', authority: 'Douanes', url: 'https://www.douane.gov.ma/' },
  { code: 'PK', name: 'Pakistan', authority: 'FBR', url: 'https://www.fbr.gov.pk/categ/customs-tariff/51149/70853/131188' },
  { code: 'BD', name: 'Bangladesh', authority: 'NBR', url: 'https://nbr.gov.bd/taxtype/tariff-schedule/eng' },
  { code: 'LK', name: 'Sri Lanka', authority: 'Customs', url: 'https://www.customs.gov.lk/customs-tariff/' },
  { code: 'KH', name: 'Cambodia', authority: 'GDCE', url: 'https://www.customs.gov.kh/' },
  { code: 'MM', name: 'Myanmar', authority: 'Customs', url: 'https://www.customs.gov.mm/' },
  { code: 'LA', name: 'Laos', authority: 'Customs', url: 'https://www.customs.gov.la/' },
  { code: 'OM', name: 'Oman', authority: 'ROP', url: 'https://www.rop.gov.om/' },
  { code: 'BH', name: 'Bahrain', authority: 'Customs', url: 'https://www.bahraincustoms.gov.bh/' },
  { code: 'KW', name: 'Kuwait', authority: 'GAC', url: 'https://www.customs.gov.kw/' },
  { code: 'QA', name: 'Qatar', authority: 'GAC', url: 'https://www.customs.gov.qa/' },
  { code: 'JO', name: 'Jordan', authority: 'Customs', url: 'https://www.customs.gov.jo/en' },
  { code: 'UA', name: 'Ukraine', authority: 'SCS', url: 'https://customs.gov.ua/en' },
];

async function computeHash(text: string): Promise<string> {
  const data = new TextEncoder().encode(text);
  const hash = await crypto.subtle.digest('SHA-256', data);
  return Array.from(new Uint8Array(hash)).map(b => b.toString(16).padStart(2, '0')).join('');
}

interface CheckResult {
  code: string;
  name: string;
  authority: string;
  status: 'green' | 'yellow' | 'red';
  hash: string | null;
  prevHash: string | null;
  changed: boolean;
  httpStatus: number;
  message: string;
}

export async function GET(req: NextRequest) {
  if (!verifyCronAuth(req)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const start = Date.now();
  const supabase = getSupabase();

  // Load previous hashes
  let prevHashes: Record<string, string> = {};
  try {
    const { data } = await supabase
      .from('health_check_logs')
      .select('checks')
      .order('checked_at', { ascending: false })
      .limit(20);
    if (data) {
      for (const row of data) {
        const checks = row.checks as Array<{ name: string; hashes?: Record<string, string> }> | null;
        if (!checks) continue;
        const monitor = checks.find(c => c.name === 'tariff-change-monitor');
        if (monitor?.hashes) {
          prevHashes = monitor.hashes;
          break;
        }
      }
    }
  } catch { /* no previous */ }

  // Check all countries (batched to avoid overwhelming)
  const results: CheckResult[] = [];
  const BATCH_SIZE = 10;

  for (let i = 0; i < COUNTRIES.length; i += BATCH_SIZE) {
    const batch = COUNTRIES.slice(i, i + BATCH_SIZE);
    const batchResults = await Promise.all(batch.map(async (country): Promise<CheckResult> => {
      try {
        const res = await fetch(country.url, {
          signal: AbortSignal.timeout(15000),
          redirect: 'follow',
          headers: { 'User-Agent': 'POTAL-Monitor/1.0 (https://potal.app)' },
        });
        const httpStatus = res.status;
        if (!res.ok) {
          return { code: country.code, name: country.name, authority: country.authority, status: 'red', hash: null, prevHash: prevHashes[country.code] || null, changed: false, httpStatus, message: `HTTP ${httpStatus}` };
        }
        const body = await res.text();
        const hash = await computeHash(body);
        const prev = prevHashes[country.code] || null;
        const changed = prev !== null && hash !== prev;
        return {
          code: country.code, name: country.name, authority: country.authority,
          status: changed ? 'yellow' : 'green',
          hash, prevHash: prev, changed, httpStatus,
          message: changed ? 'Page content changed' : (prev === null ? 'First check (baseline)' : 'No change'),
        };
      } catch {
        return { code: country.code, name: country.name, authority: country.authority, status: 'red', hash: null, prevHash: prevHashes[country.code] || null, changed: false, httpStatus: 0, message: 'Fetch failed (timeout/network)' };
      }
    }));
    results.push(...batchResults);
  }

  const changed = results.filter(r => r.changed);
  const failed = results.filter(r => r.status === 'red');
  const overall = changed.length > 0 ? 'yellow' : failed.length > 5 ? 'red' : 'green';
  const newHashes: Record<string, string> = {};
  results.forEach(r => { if (r.hash) newHashes[r.code] = r.hash; });

  // Send alert if changes detected
  if (changed.length > 0 && RESEND_API_KEY) {
    const kstTime = new Date().toLocaleString('ko-KR', { timeZone: 'Asia/Seoul' });
    const rows = changed.map(c =>
      `<tr><td style="padding:6px 8px;">${c.code}</td><td style="padding:6px 8px;">${c.name}</td><td style="padding:6px 8px;">${c.authority}</td><td style="padding:6px 8px;color:#f59e0b;">Changed</td></tr>`
    ).join('');

    const html = `
<div style="font-family:sans-serif;max-width:600px;margin:0 auto;">
  <div style="background:#7c3aed;color:white;padding:16px 20px;border-radius:8px 8px 0 0;">
    <h2 style="margin:0;font-size:16px;">🌍 Tariff Change Monitor — ${changed.length} Countries Changed</h2>
    <p style="margin:4px 0 0;font-size:12px;color:#ddd6fe;">${kstTime}</p>
  </div>
  <div style="background:white;padding:16px 20px;border:1px solid #e2e8f0;border-top:none;border-radius:0 0 8px 8px;">
    <table style="width:100%;border-collapse:collapse;font-size:13px;">
      <tr style="background:#f8fafc;"><th style="padding:8px;text-align:left;">Code</th><th style="padding:8px;text-align:left;">Country</th><th style="padding:8px;text-align:left;">Authority</th><th style="padding:8px;text-align:left;">Status</th></tr>
      ${rows}
    </table>
    <p style="font-size:12px;color:#64748b;margin-top:12px;">${results.length} countries checked, ${failed.length} unreachable</p>
  </div>
</div>`;

    try {
      await fetch('https://api.resend.com/emails', {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${RESEND_API_KEY}`, 'Content-Type': 'application/json' },
        body: JSON.stringify({ from: EMAIL_FROM, to: [EMAIL_TO], subject: `🌍 Tariff changes detected in ${changed.length} countries`, html }),
        signal: AbortSignal.timeout(10000),
      });
    } catch { /* silent */ }
  }

  // Log
  try {
    await supabase.from('health_check_logs').insert({
      checked_at: new Date().toISOString(),
      overall_status: overall,
      checks: [{
        name: 'tariff-change-monitor',
        status: overall,
        message: `${changed.length} changed, ${failed.length} failed, ${results.length - changed.length - failed.length} stable`,
        hashes: newHashes,
        changed: changed.map(c => c.code),
        failed: failed.map(c => c.code),
      }],
      duration_ms: Date.now() - start,
    });
  } catch { /* silent */ }

  return NextResponse.json({
    success: true, status: overall,
    totalCountries: results.length, changed: changed.length, failed: failed.length,
    changedCountries: changed.map(c => ({ code: c.code, name: c.name })),
    failedCountries: failed.map(c => ({ code: c.code, name: c.name, message: c.message })),
    durationMs: Date.now() - start,
  });
}
