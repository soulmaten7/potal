# PIPELINE: Currency (Exchange Rate)
# Last updated: 2026-03-18 KST

## Overview

Currency conversion in cross-border trade is not simply "today's Google rate." Customs authorities in many countries mandate the use of their own official exchange rates, which differ from market rates and are published on different schedules (quarterly, weekly, daily). The rate used to declare the customs value of goods directly affects the duty and tax amounts assessed. A practitioner must identify the correct currencies, select the authoritative rate source for the importing country, and apply country-specific rounding rules. POTAL currently uses a single market-rate API chain for all conversions, without distinguishing between customs official rates and market rates.

---

## Step 1: Identify Currencies (Invoice, Destination, Declaration)

- **Practitioner action**: Determine three currencies: (1) invoice currency (what the seller charges), (2) destination currency (buyer's local currency for display/UI), and (3) declaration currency (currency required by the customs authority for the import declaration). These are often all different. Example: a US seller invoices in USD to a Japanese buyer — the invoice currency is USD, the destination currency is JPY, and the declaration currency is also JPY (Japan Customs requires declarations in JPY).
- **Current code**: `exchange-rate-service.ts:268-306` — `convertCurrency(amount, from, to)` accepts `from` and `to` as generic ISO currency codes. `GlobalCostEngine.ts:1041-1055` converts the total landed cost from USD to `profile.currency` (destination currency). The engine hardcodes USD as the internal working currency (all calculations in USD, conversion at the end).
- **Method**: CODE (fixed USD-base assumption) + DB_LOOKUP (`country-data` profile provides `profile.currency`)
- **Data source**: `country-data.ts` / `getCountryProfileFromDb()` — the `currency` field on the country profile
- **GAP**: **HIGH**.
  1. **No concept of "declaration currency"**. The code only knows invoice currency (assumed USD) and destination currency (`profile.currency`). Many customs authorities require declaration in a specific currency that may differ from both the invoice and local currency. For example, some WAEMU/CFA franc countries require declarations in EUR.
  2. **Single working currency assumption**. Everything is computed in USD and converted once at the end (`GlobalCostEngine.ts:1044`). A practitioner would convert the invoice amount to the declaration currency first (using the customs official rate), compute duties/taxes in that currency, then optionally convert the result for display. The order matters because rounding at each step compounds differently.
  3. **No invoice currency input**. The API schema (`CostInput`) has no `invoiceCurrency` field — the engine assumes the `productPrice` is already in USD. If a seller invoices in EUR, the caller must pre-convert to USD before calling the API, losing control over which rate is used.

---

## Step 2: Determine Applicable Rate (Customs Official vs Market)

- **Practitioner action**: Identify which exchange rate the customs authority of the destination country mandates for converting foreign-currency invoices to the declaration currency. Key examples:
  - **US CBP**: Publishes quarterly rates (certified by Federal Reserve) for 40+ currencies. If no certified rate exists, uses the New York Federal Reserve daily rate. Reference: 31 U.S.C. 5151, 19 CFR 159.
  - **EU**: ECB daily reference rates published at 14:15 CET each business day. Used for customs valuation across all 27 member states.
  - **Japan MOF**: Ministry of Finance publishes weekly rates (effective Sunday through Saturday). Japan Customs uses these for all import declarations.
  - **South Korea KCS**: Korea Customs Service publishes weekly rates (Friday for the following week). The rate is the average of daily market rates.
  - **UK HMRC**: Monthly rates published by HMRC, effective for the calendar month.
  - **Canada CBSA**: Bank of Canada daily noon rate or monthly average.
  - **Australia ABF**: Reserve Bank of Australia daily rates.
- **Current code**: `exchange-rate-service.ts:73-160` — two market-rate API providers in a fallback chain:
  1. `ExchangeRate-API` (open.er-api.com) — free tier, 1500 req/month, market rates
  2. `Fawaz Ahmed Currency API` (CDN-based) — free, unlimited, market rates
  3. Hardcoded fallback (`FALLBACK_RATES`, line 168-208) — 35 currencies, static values dated 2025-01-01
- **Method**: API_CALL (market rate providers) → CODE fallback (hardcoded static rates)
- **Data source**: Third-party market rate APIs (ExchangeRate-API, Fawaz Currency API)
- **GAP**: **CRITICAL — the single largest gap in the currency pipeline.**
  1. **No customs official rates**. Every country listed above publishes official rates that customs authorities legally require for import declarations. Using market rates can cause discrepancies with the customs authority's assessed value, leading to duty/tax miscalculation, additional assessment notices, or penalties. The deviation between market and customs rates can be 1-3% or more, especially for volatile currencies.
  2. **No per-country rate source selection**. The code uses the same API for all 240 countries. A practitioner would select different rate sources based on destination: CBP rates for US, ECB for EU, MOF for Japan, etc.
  3. **No rate date alignment**. Customs rates often have a specific effective period (e.g., US CBP quarterly, JP MOF weekly). The code fetches "latest" market rates with no regard for which period the customs authority considers current. If goods are declared on the first day of a new quarter, CBP uses the new quarter's rate, while the cached market rate may be from the prior period.
  4. **Fallback rates are 14+ months old** (dated 2025-01-01, line 214). For volatile currencies like TRY, ARS, NGN, the hardcoded fallback could be off by 50%+.
  5. **No rate lock with customs-official source**. The `/api/v1/exchange-rates/lock` endpoint (line 21) hardcodes `rate = 0.92` for USD→EUR — this is a stub, not connected to any rate source. A real rate lock should lock a customs-official rate for the duration of a shipment.

---

## Step 3: Select Rate Source (Central Bank vs Customs Authority vs Market)

- **Practitioner action**: Based on the destination country, select the correct institutional source:
  - **Central bank rates**: ECB (EU), BOJ (Japan), BOK (Korea), RBA (Australia), BOC (Canada), BOE (UK), PBOC (China)
  - **Customs authority rates**: US CBP (own certified rates), HMRC (UK, own monthly rates), KCS (Korea, derived from market but published by customs)
  - **Market rates**: Acceptable as fallback for countries with no official customs rate, or for preliminary/indicative calculations
  - The hierarchy is: Customs authority published rate > Central bank reference rate > Market rate
- **Current code**: No source selection logic exists. `getExchangeRates()` at line 224 fetches from Provider 1 → Provider 2 → hardcoded fallback. The `source` field is populated (line 100: `'exchangerate-api'`, line 150: `'fawaz-currency-api'`, line 216: `'hardcoded-fallback'`) but this is for diagnostics, not for choosing the authoritative customs source.
- **Method**: API_CALL (single chain, no source selection)
- **Data source**: Market APIs only
- **GAP**: **CRITICAL**.
  1. **No integration with any central bank or customs authority rate feed**. The following official APIs/feeds are freely available and should be integrated:
     - ECB: `https://www.ecb.europa.eu/stats/eurofxref/eurofxref-daily.xml` (free, no auth, daily XML)
     - US CBP: Published at `https://www.cbp.gov/trade/basic-import-export/currency-conversion` (quarterly PDF/HTML, needs scraping)
     - BOC (Canada): `https://www.bankofcanada.ca/valet/observations/group/FX_RATES_DAILY/json` (free, no auth)
     - RBA (Australia): `https://www.rba.gov.au/statistics/tables/csv/f11.1-data.csv` (free CSV)
     - HMRC (UK): `https://www.trade-tariff.service.gov.uk/exchange_rates` (free API)
  2. **No country-to-source mapping table**. Need a lookup: `destination_country → rate_authority → api_endpoint → effective_period`. This does not exist in the codebase.
  3. **The `exchange_rate_history` table** is populated by the daily cron (`exchange-rate-sync/route.ts:103`) but stores only market rates. It should also store customs official rates with a `source_type` discriminator.

---

## Step 4: Execute Conversion

- **Practitioner action**: Convert the invoice amount from the invoice currency to the declaration currency using the applicable official rate. The conversion formula is straightforward, but the rate used must match the customs authority's published rate for the relevant period.
- **Current code**: `exchange-rate-service.ts:288-305` — cross-rate conversion via USD: `rate = toRate / fromRate`, then `convertedAmount = amount * rate`. Rounded to 2 decimal places (line 296: `Math.round(amount * rate * 100) / 100`). `GlobalCostEngine.ts:1044` — converts `totalLandedCost` from USD to destination currency at the end of the calculation.
- **Method**: CODE (formula-based cross-rate via USD base)
- **Data source**: In-memory cached rates from Step 2
- **GAP**: **MEDIUM**.
  1. **Cross-rate via USD introduces compounding error**. Converting EUR→JPY goes EUR→USD→JPY (two divisions). If the customs authority publishes a direct EUR→JPY rate, using the cross-rate introduces a discrepancy. This is especially problematic for EU→JP, EU→KR, and other non-USD corridors with official direct rates.
  2. **Conversion happens too late in the pipeline**. The engine computes all duties and taxes in USD, then converts the final total to local currency. A practitioner computes duty in the declaration currency because the duty rate schedule is denominated in that currency. Example: EU tariff rates apply to a EUR customs value, not a USD value converted afterwards.
  3. **Single conversion point**. Only `totalLandedCost` is converted (line 1044). The breakdown items (duty, VAT, processing fees) remain in USD. The API response shows `localCurrency.totalLandedCost` but not individual component amounts in local currency.
  4. **Cache TTL is 15 minutes** (line 51: `900000`ms). For intraday traders or customs brokers filing declarations, stale rates within a 15-minute window could cause discrepancies if the official rate changed (e.g., ECB daily rate published at 14:15 CET — a request at 14:20 CET should use the new rate).

---

## Step 5: Apply Rounding Rules (Country-Specific)

- **Practitioner action**: Apply the destination country's rounding rules for customs value and duty/tax calculations. These vary significantly:
  - **US**: Round to nearest cent (2 decimals). Duty amounts under $0.50 are dropped.
  - **EU**: Round to nearest cent for EUR amounts. The customs value is rounded to the nearest whole euro in some member states.
  - **Japan**: Round down to nearest yen (no decimals). Customs value is rounded down to nearest 1,000 JPY for assessment. Duty is rounded down to nearest 100 JPY.
  - **South Korea**: Round down to nearest won. Customs value rounded to nearest 1,000 KRW. Duty under 1,000 KRW is waived.
  - **UK**: Round down to nearest penny for amounts, round duty to nearest penny.
  - **India**: Round to nearest rupee for duty calculation. Assessment value rounded to nearest 10 INR.
  - **China**: Duty amounts under 50 CNY are waived. Round to 2 decimal places for CNY.
  - **Australia**: Round to nearest cent. Duty amounts under $10 AUD are waived.
- **Current code**: `exchange-rate-service.ts:296` — `Math.round(amount * rate * 100) / 100` (always rounds to 2 decimal places). `exchange-rate-service.ts:303` — rate itself rounded to 4 decimal places. `GlobalCostEngine.ts` — uses a generic `round()` helper throughout (2 decimal places, line 328: `const round = (n: number) => Math.round(n * 100) / 100`).
- **Method**: CODE (generic 2-decimal rounding)
- **Data source**: None (no country-specific rounding rules in DB or code)
- **GAP**: **HIGH**.
  1. **No country-specific rounding rules**. The entire codebase uses `Math.round(x * 100) / 100` for all countries. Japan requires `Math.floor()` (round down), and Korea rounds down as well. Using standard rounding instead of floor for Japan will produce values that don't match the customs assessment.
  2. **No assessment-level rounding**. Japan rounds customs value to nearest 1,000 JPY before applying duty rate. This step does not exist in the code. Example: customs value of 12,345 JPY becomes 12,000 JPY, then duty is calculated on 12,000 — not 12,345.
  3. **Zero-decimal currencies not handled**. JPY, KRW, VND, IDR, HUF are zero-decimal currencies (no cents). The code rounds to 2 decimals, producing values like "1,234.56 JPY" which is not a valid monetary amount. The rounding should produce whole numbers for these currencies.
  4. **Duty minimum thresholds after rounding** are partially handled by de minimis logic but not by rounding-specific rules (e.g., Japan drops duty under 100 JPY after rounding down, separate from de minimis threshold).

---

## Data Flow Diagram

```
Invoice Amount (seller currency)
       │
       ▼
  ┌─────────────────────────┐
  │ Step 1: Identify         │  invoice_currency, destination_currency,
  │ Currencies               │  declaration_currency
  └──────────┬──────────────┘
             │
             ▼
  ┌─────────────────────────┐
  │ Step 2: Determine Rate   │  customs_official OR market_rate
  │ (per destination country)│  effective_period, publication_date
  └──────────┬──────────────┘
             │
             ▼
  ┌─────────────────────────┐
  │ Step 3: Select Source    │  CBP / ECB / MOF / BOK / HMRC / ...
  │                          │  fallback: market API
  └──────────┬──────────────┘
             │
             ▼
  ┌─────────────────────────┐
  │ Step 4: Execute          │  invoice_currency → declaration_currency
  │ Conversion               │  using official rate
  └──────────┬──────────────┘
             │
             ▼
  ┌─────────────────────────┐
  │ Step 5: Apply Rounding   │  country-specific (floor/round/ceiling)
  │ Rules                    │  assessment-level rounding
  └──────────┬──────────────┘
             │
             ▼
  Customs Value (declaration currency) → feeds into duty/tax calculation
```

---

## Key Files

| File | Purpose |
|------|---------|
| `app/lib/cost-engine/exchange-rate/exchange-rate-service.ts` | Core exchange rate service: API providers, cache, conversion |
| `app/lib/cost-engine/exchange-rate/index.ts` | Public exports |
| `app/lib/cost-engine/GlobalCostEngine.ts:1040-1055` | Local currency conversion at end of TLC calculation |
| `app/api/v1/admin/exchange-rate-sync/route.ts` | Daily cron: fetch rates, store in DB, alert on >3% moves |
| `app/api/v1/exchange-rate/historical/route.ts` | Historical rate lookup API |
| `app/api/v1/exchange-rates/lock/route.ts` | Rate lock API (stub — hardcoded EUR rate) |
| `app/api/v1/exchange-rates/history/route.ts` | Rate history query API |

---

## API Endpoints

| Endpoint | Method | Purpose |
|----------|--------|---------|
| `/api/v1/admin/exchange-rate-sync` | GET | Cron: daily rate sync + DB persistence + alert |
| `/api/v1/exchange-rate/historical` | GET | Look up rate for a specific date |
| `/api/v1/exchange-rates/lock` | POST/GET | Lock a rate for 24/48/72h (stub) |

---

## GAP Summary

| Step | Severity | Description |
|------|----------|-------------|
| 1. Identify currencies | HIGH | No declaration currency concept; no invoice currency input field |
| 2. Determine applicable rate | CRITICAL | No customs official rates — all conversions use market rates |
| 3. Select rate source | CRITICAL | No integration with CBP/ECB/MOF/HMRC/BOK rate feeds |
| 4. Execute conversion | MEDIUM | Cross-rate via USD; conversion too late in pipeline; only total converted |
| 5. Apply rounding rules | HIGH | Generic 2-decimal rounding for all countries; no floor rounding for JP/KR; no assessment-level rounding |

**Overall pipeline maturity**: The exchange rate service is functional for **display/estimation purposes** (converting a total to local currency for the buyer's reference). It is **not sufficient for customs declaration accuracy**, where the rate source, effective period, and rounding rules are legally prescribed and auditable. The gap between "market rate estimate" and "customs-compliant valuation" is the core issue.
