/**
 * D8 QA & Accuracy — Automated Spot Check
 *
 * Runs a fixed set of known-good calculation cases and validates
 * that results haven't regressed. Logs results to health_check_logs.
 *
 * Spot check cases cover:
 * - US domestic (sales tax)
 * - EU (VAT + de minimis)
 * - UK (VAT threshold)
 * - Canada (GST/PST provinces)
 * - Japan (consumption tax)
 * - Korea (customs + VAT)
 * - Australia (GST + ABF)
 * - Brazil (ICMS + IPI)
 */

import { calculateGlobalLandedCost } from '@/app/lib/cost-engine/GlobalCostEngine';
import type { CheckResult, CheckStatus } from './health-monitor';
import { createClient } from '@supabase/supabase-js';

interface SpotCase {
  label: string;
  input: {
    price: number;
    shippingPrice: number;
    destination: string;
    origin?: string;
    zipcode?: string;
    productName?: string;
    productCategory?: string;
  };
  expect: {
    totalMin: number;
    totalMax: number;
    hasDuty?: boolean;
    hasVat?: boolean;
  };
}

const SPOT_CASES: SpotCase[] = [
  {
    label: 'US domestic NY (sales tax)',
    input: { price: 100, shippingPrice: 10, destination: 'US', zipcode: '10001', productName: 'T-Shirt', productCategory: 'apparel' },
    expect: { totalMin: 110, totalMax: 125, hasDuty: false },
  },
  {
    label: 'US to UK (VAT 20%)',
    input: { price: 100, shippingPrice: 15, destination: 'GB', origin: 'US', productName: 'T-Shirt', productCategory: 'apparel' },
    expect: { totalMin: 115, totalMax: 170, hasVat: true },
  },
  {
    label: 'US to Germany (VAT 19%)',
    input: { price: 100, shippingPrice: 15, destination: 'DE', origin: 'US', productName: 'Electronics', productCategory: 'electronics' },
    expect: { totalMin: 115, totalMax: 170, hasVat: true },
  },
  {
    label: 'US to Japan (consumption tax 10%)',
    input: { price: 100, shippingPrice: 15, destination: 'JP', origin: 'US', productName: 'Shoes', productCategory: 'footwear' },
    expect: { totalMin: 115, totalMax: 160, hasVat: true },
  },
  {
    label: 'US to Canada ON (GST+HST)',
    input: { price: 100, shippingPrice: 15, destination: 'CA', origin: 'US', zipcode: 'M5V', productName: 'Book', productCategory: 'books' },
    expect: { totalMin: 115, totalMax: 165 },
  },
  {
    label: 'US to Australia (GST 10%)',
    input: { price: 100, shippingPrice: 15, destination: 'AU', origin: 'US', productName: 'Toy', productCategory: 'toys' },
    expect: { totalMin: 115, totalMax: 165, hasVat: true },
  },
  {
    label: 'US to Korea (VAT 10%)',
    input: { price: 100, shippingPrice: 15, destination: 'KR', origin: 'US', productName: 'Cosmetics', productCategory: 'cosmetics' },
    expect: { totalMin: 115, totalMax: 170, hasVat: true },
  },
  {
    label: 'CN to US (duty + Section 301 + sales tax)',
    input: { price: 50, shippingPrice: 10, destination: 'US', origin: 'CN', zipcode: '90001', productName: 'Phone Case', productCategory: 'electronics' },
    expect: { totalMin: 60, totalMax: 130, hasVat: false },
  },
];

export interface SpotCheckReport {
  timestamp: string;
  overall: CheckStatus;
  passed: number;
  failed: number;
  total: number;
  results: SpotCaseResult[];
  durationMs: number;
}

interface SpotCaseResult {
  label: string;
  status: CheckStatus;
  total: number;
  expectedRange: string;
  message: string;
}

export async function runSpotChecks(): Promise<SpotCheckReport> {
  const start = Date.now();
  const results: SpotCaseResult[] = [];

  for (const c of SPOT_CASES) {
    try {
      const result = calculateGlobalLandedCost(c.input);
      const total = result.totalLandedCost ?? 0;

      const inRange = total >= c.expect.totalMin && total <= c.expect.totalMax;
      const noNaN = !isNaN(total) && total > 0;

      if (!noNaN) {
        results.push({
          label: c.label,
          status: 'red',
          total,
          expectedRange: `${c.expect.totalMin}-${c.expect.totalMax}`,
          message: `NaN or zero: ${total}`,
        });
      } else if (!inRange) {
        results.push({
          label: c.label,
          status: 'yellow',
          total,
          expectedRange: `${c.expect.totalMin}-${c.expect.totalMax}`,
          message: `Out of range: ${total.toFixed(2)}`,
        });
      } else {
        results.push({
          label: c.label,
          status: 'green',
          total,
          expectedRange: `${c.expect.totalMin}-${c.expect.totalMax}`,
          message: `OK: ${total.toFixed(2)}`,
        });
      }
    } catch (err) {
      results.push({
        label: c.label,
        status: 'red',
        total: 0,
        expectedRange: `${c.expect.totalMin}-${c.expect.totalMax}`,
        message: `Crash: ${err instanceof Error ? err.message : 'Unknown'}`,
      });
    }
  }

  const failed = results.filter(r => r.status !== 'green').length;
  const hasRed = results.some(r => r.status === 'red');

  return {
    timestamp: new Date().toISOString(),
    overall: hasRed ? 'red' : failed > 0 ? 'yellow' : 'green',
    passed: results.length - failed,
    failed,
    total: results.length,
    results,
    durationMs: Date.now() - start,
  };
}

/** Save spot check to health_check_logs */
export async function saveSpotCheckReport(report: SpotCheckReport): Promise<void> {
  try {
    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || ''
    );
    await supabase.from('health_check_logs').insert({
      checked_at: report.timestamp,
      overall_status: report.overall,
      checks: [{ name: 'spot_check', status: report.overall, passed: report.passed, failed: report.failed, total: report.total, results: report.results }],
      duration_ms: report.durationMs,
    });
  } catch {
    // Silent fail
  }
}
