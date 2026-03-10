# POTAL Supabase Migration Files

Complete database migration set for POTAL (Portal) landed cost calculator, containing data for 240 countries.

## Migration Files Overview

### 010_country_metadata.sql (200 KB)
**Master country reference table**

Creates the `countries` table with 240 entries containing:
- ISO codes (2-letter and 3-letter)
- Country and currency information
- Geographic classification (continent, region)
- Economic bloc membership
- UN M49 codes
- Development classifications (EU member, LDC status, income level)

**Key Indexes:**
- `iso_code_3` (UNIQUE)
- `continent`, `region`, `income_level`

### 011_vat_gst_rates.sql (91 KB)
**VAT/GST tax rates by country**

Creates the `vat_gst_rates` table with 240 entries containing:
- Standard VAT/GST rates as percentage (0-27%)
- Reduced rates (stored as JSONB array)
- Local VAT/GST names (e.g., "TVA" in France, "IVA" in Spain)
- Boolean flag for VAT/GST applicability
- Special notes for complex systems (e.g., India's tiered GST)

**Data Confidence:** Verified from official sources for all countries as of March 2026

**Key Indexes:**
- `country_code` (UNIQUE FK)
- `has_vat`, `standard_rate`

### 012_de_minimis_thresholds.sql (152 KB)
**Duty-free import thresholds**

Creates the `de_minimis_thresholds` table with 240 entries containing:
- Duty de minimis threshold in USD
- Tax/VAT de minimis threshold in USD
- Original thresholds in local currency/description
- Data confidence indicator (verified/estimated/unknown)
- Special notes (e.g., US suspension as of August 29, 2025)

**Notable Entries:**
- US: Duty-free suspension (was $800, now $0 as of Aug 2025)
- Canada: CAD $20 (duty); CAD $40 (tax) under CUSMA
- Mexico: USD $117 (duty from USMCA); USD $50 (VAT)
- EU members: Variable thresholds

**Data Coverage:**
- 104 countries with verified data
- 136 countries with estimated data based on regional patterns

**Key Indexes:**
- `country_code` (UNIQUE FK)
- `duty_threshold_usd`, `tax_threshold_usd`, `data_confidence`

### 013_customs_fees.sql (300 KB)
**Import customs processing and brokerage fees**

Creates the `customs_fees` table with 240 entries containing:
- Customs processing fee type, rate, min/max amounts
- Harbor maintenance fees (HMF) - applicable, rate, description
- Typical brokerage fee ranges (min/max in USD)
- Other charges (stored as JSONB array)
- Data confidence indicator

**Fee Types Covered:**
- Fixed customs processing fees (e.g., AED 90 in UAE)
- Ad valorem fees (percentage-based)
- Harbor/port maintenance fees
- Documentation and handling charges
- Customs broker clearance services

**Verified Sources (18 countries):**
US, FR, DE, IT, GB, CA, AU, JP, KR, CN, IN, BR, MX, SG, AE, SA, TH, VN

**Key Indexes:**
- `country_code` (UNIQUE FK)
- `currency`, `data_confidence`

### 014_fta_agreements.sql (476 KB)
**Free Trade Agreements data**

Creates two tables:

#### fta_agreements
- 31 major FTA entries
- Columns: name, abbreviation (UNIQUE), type, year_entered_force, status, member_countries (JSONB)
- Covers mega-FTAs and bilateral agreements

**Major FTAs Included:**
- RCEP (Regional Comprehensive Economic Partnership) - 15 members
- CPTPP (Trans-Pacific Partnership) - 12 members
- USMCA (US-Mexico-Canada) - 3 members
- EU (European Union) - 27 member states
- AfCFTA (African Continental FTA) - 49 members
- Mercosur (Southern Common Market) - 5 members
- AFTA (ASEAN Free Trade Area) - 10 members
- And 24 more...

#### fta_country_pairs
- Materialized lookup table for fast FTA lookups
- Primary key: (country_a, country_b, fta_abbreviation)
- Enables rapid "do these 2 countries share an FTA?" queries
- All pairs are bi-directional

**Key Indexes:**
- `country_a`, `country_b`, `fta_abbreviation` (all indexed)

### 015_lookup_functions.sql (4.9 KB)
**Helper functions for landed cost calculations**

Creates 4 PostgreSQL functions:

#### 1. lookup_landed_cost_components()
Main function for TLC calculations. Returns:
- Destination and origin country codes/names
- VAT standard rate and details
- De minimis duty/tax thresholds
- All customs fees components
- Any shared FTA agreements

Usage:
```sql
SELECT * FROM lookup_landed_cost_components('6109.10', 'CN', 'US');
```

#### 2. check_fta_between_countries()
Checks if two countries share an FTA. Returns:
- FTA abbreviation, name, type
- Year entered force
- All matching FTAs between the pair

Usage:
```sql
SELECT * FROM check_fta_between_countries('US', 'MX');
```

#### 3. get_country_ftas()
Lists all FTAs a country participates in. Returns:
- FTA abbreviation, name, type
- Year entered force, status
- Member count

Usage:
```sql
SELECT * FROM get_country_ftas('AU');
```

#### 4. get_effective_tariff_rate()
Determines tariff rate between origin/destination. Returns:
- 0.00% if FTA exists
- NULL if no data available (placeholder for future tariff schedule)

Usage:
```sql
SELECT get_effective_tariff_rate('6109.10', 'CN', 'US');
```

## Data Statistics

- **Total countries:** 240
- **VAT/GST entries:** 240 (100% coverage)
- **De minimis thresholds:** 240 (100% coverage)
- **Customs fees:** 240 (100% coverage)
- **FTA agreements:** 31 major agreements
- **FTA country pairs:** ~800+ pairs (bi-directional)
- **Total SQL file size:** 1.2 MB

## Implementation Details

### Transaction Blocks
Each migration uses proper BEGIN/COMMIT blocks with:
- One transaction per data set
- Atomic operations for data consistency
- Error handling for constraint violations

### Conflict Handling
All INSERT statements use `ON CONFLICT ... DO UPDATE` for idempotent imports:
- Safe for re-running migrations
- Updates stale data automatically
- No duplicate key violations

### Foreign Key Relationships
- All data tables reference `countries(iso_code_2)`
- `fta_country_pairs` references `fta_agreements(fta_abbreviation)`
- Cascading references prevent orphaned records

### Performance Optimizations
- Strategic indexes on frequently queried columns
- UUIDs for primary keys (scalability)
- JSONB columns for flexible data storage
- Text arrays for economic blocs/multilateral relationships

## Data Sources

All data compiled as of **March 2026** from:
- ISO 3166-1 (country codes)
- ISO 4217 (currency codes)
- UN M49 (statistical area codes)
- World Bank (income classification)
- UN/UNCTAD (LDC classification)
- Official country tax authorities
- WTO and regional trade organization databases
- World Customs Organization (WCO) standards
- Official government customs authorities

## Migration Order

Must be applied in sequence:
1. 010_country_metadata.sql (creates `countries` table)
2. 011_vat_gst_rates.sql
3. 012_de_minimis_thresholds.sql
4. 013_customs_fees.sql
5. 014_fta_agreements.sql (creates `fta_agreements` and `fta_country_pairs`)
6. 015_lookup_functions.sql (creates functions that depend on previous tables)

## Notes

- All currency amounts in customs_fees are in local currency unless otherwise specified
- Brokerage fees are in USD for standardized comparison
- Economic blocs stored as PostgreSQL TEXT arrays
- Member countries stored as JSONB arrays for flexibility
- All timestamps default to UTC (TIMESTAMPTZ)
- Data confidence levels: "verified" (official sources), "estimated" (regional patterns), "unknown" (insufficient data)

## Usage Examples

### Get complete TLC components for shipment
```sql
SELECT * FROM lookup_landed_cost_components('6109.10', 'CN', 'US')
WHERE destination_country_code = 'US';
```

### Check if countries have FTA
```sql
SELECT * FROM check_fta_between_countries('AU', 'NZ');
```

### Get all FTAs for a country
```sql
SELECT * FROM get_country_ftas('SG')
ORDER BY year_entered_force DESC;
```

### Find countries with specific VAT rate
```sql
SELECT c.country_name, v.standard_rate
FROM vat_gst_rates v
JOIN countries c ON v.country_code = c.iso_code_2
WHERE v.standard_rate > 20
ORDER BY v.standard_rate DESC;
```
