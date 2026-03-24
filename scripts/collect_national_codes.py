#!/usr/bin/env python3
"""
Collect 10-digit national tariff codes:
1. US: Fill missing from hts_2026_rev4.json
2. KR/JP/AU/CA: Extract from macmap_ntlc_rates
"""
import json, csv, subprocess, os

BASE = '/Volumes/soulmaten/POTAL'
PSQL = '/opt/homebrew/opt/libpq/bin/psql'
CONN = "-h db.zyurflkhiregundhisky.supabase.co -p 5432 -U postgres -d postgres"

def run_sql(sql):
    cmd = f"PGPASSWORD='potalqwepoi2@' {PSQL} {CONN} -t -A -c \"{sql}\""
    result = subprocess.run(cmd, shell=True, capture_output=True, text=True, timeout=120)
    return result.stdout.strip()

def run_sql_file(sql):
    cmd = f"PGPASSWORD='potalqwepoi2@' {PSQL} {CONN} -c \"{sql}\""
    result = subprocess.run(cmd, shell=True, capture_output=True, text=True, timeout=300)
    return result.stdout.strip(), result.stderr.strip()

# ═══ Part 1: US missing from original ═══
print('═══ Part 1: US HTS missing rows ═══')

original = json.load(open(f'{BASE}/regulations/us/htsus/hts_2026_rev4.json'))

# Get existing US codes from DB
existing_raw = run_sql("SELECT hs_code FROM gov_tariff_schedules WHERE country = 'US'")
existing_codes = set(existing_raw.split('\n')) if existing_raw else set()
print(f'DB US codes: {len(existing_codes)}')

# Find missing
missing = []
for item in original:
    code = str(item.get('htsno', '')).replace('.', '')
    if not code or len(code) < 4:
        continue
    if code not in existing_codes:
        desc = item.get('description', '')
        indent = int(item.get('indent', 0) or 0)
        general = item.get('general', '')
        missing.append({
            'hs_code': code,
            'description': desc,
            'indent': indent,
            'duty_rate_text': general,
        })

print(f'Missing US entries: {len(missing)}')

if missing:
    # Write CSV
    csv_path = '/tmp/us_missing_codes.csv'
    with open(csv_path, 'w', newline='') as f:
        w = csv.writer(f)
        w.writerow(['country', 'hs_code', 'description', 'indent', 'duty_rate_text', 'source'])
        for m in missing:
            w.writerow(['US', m['hs_code'], m['description'], m['indent'], m['duty_rate_text'], 'hts_2026_rev4'])
    print(f'CSV: {csv_path} ({len(missing)} rows)')

    # Insert
    out, err = run_sql_file(f"\\copy gov_tariff_schedules(country, hs_code, description, indent, duty_rate_text, source) FROM '{csv_path}' WITH CSV HEADER")
    print(f'INSERT: {out}')
    if err and 'COPY' not in err:
        print(f'ERROR: {err[:200]}')

# ═══ Part 2: KR 10-digit from macmap ═══
print('\n═══ Part 2: KR 10-digit from macmap ═══')

# Extract KR 10-digit codes from macmap_ntlc_rates
kr_csv = '/tmp/kr_national_codes.csv'
sql = f"""\\copy (
  SELECT DISTINCT 'KR' as country, hs_code, product_description as description, 0 as indent, '' as duty_rate_text, 'macmap_ntlc' as source
  FROM macmap_ntlc_rates
  WHERE destination_country = 'KR' AND length(hs_code) = 10
    AND hs_code NOT IN (SELECT hs_code FROM gov_tariff_schedules WHERE country = 'KR')
) TO '{kr_csv}' WITH CSV HEADER"""
out, err = run_sql_file(sql)
if os.path.exists(kr_csv):
    lines = sum(1 for _ in open(kr_csv)) - 1
    print(f'KR new 10-digit: {lines} rows')
    if lines > 0:
        out2, err2 = run_sql_file(f"\\copy gov_tariff_schedules(country, hs_code, description, indent, duty_rate_text, source) FROM '{kr_csv}' WITH CSV HEADER")
        print(f'INSERT: {out2}')
else:
    print('KR: No CSV generated')

# ═══ Part 3: JP 9-digit from macmap ═══
print('\n═══ Part 3: JP 9-digit from macmap ═══')

jp_csv = '/tmp/jp_national_codes.csv'
sql = f"""\\copy (
  SELECT DISTINCT 'JP' as country, hs_code, product_description as description, 0 as indent, '' as duty_rate_text, 'macmap_ntlc' as source
  FROM macmap_ntlc_rates
  WHERE destination_country = 'JP' AND length(hs_code) >= 9
    AND hs_code NOT IN (SELECT hs_code FROM gov_tariff_schedules WHERE country = 'JP')
) TO '{jp_csv}' WITH CSV HEADER"""
out, err = run_sql_file(sql)
if os.path.exists(jp_csv):
    lines = sum(1 for _ in open(jp_csv)) - 1
    print(f'JP new 9-digit: {lines} rows')
    if lines > 0:
        out2, err2 = run_sql_file(f"\\copy gov_tariff_schedules(country, hs_code, description, indent, duty_rate_text, source) FROM '{jp_csv}' WITH CSV HEADER")
        print(f'INSERT: {out2}')

# ═══ Part 4: AU 8-digit from macmap ═══
print('\n═══ Part 4: AU 8-digit from macmap ═══')

au_csv = '/tmp/au_national_codes.csv'
sql = f"""\\copy (
  SELECT DISTINCT 'AU' as country, hs_code, product_description as description, 0 as indent, '' as duty_rate_text, 'macmap_ntlc' as source
  FROM macmap_ntlc_rates
  WHERE destination_country = 'AU' AND length(hs_code) >= 8
    AND hs_code NOT IN (SELECT hs_code FROM gov_tariff_schedules WHERE country = 'AU')
) TO '{au_csv}' WITH CSV HEADER"""
out, err = run_sql_file(sql)
if os.path.exists(au_csv):
    lines = sum(1 for _ in open(au_csv)) - 1
    print(f'AU new 8-digit: {lines} rows')
    if lines > 0:
        out2, err2 = run_sql_file(f"\\copy gov_tariff_schedules(country, hs_code, description, indent, duty_rate_text, source) FROM '{au_csv}' WITH CSV HEADER")
        print(f'INSERT: {out2}')

# ═══ Part 5: CA 8-digit from macmap ═══
print('\n═══ Part 5: CA 8-digit from macmap ═══')

ca_csv = '/tmp/ca_national_codes.csv'
sql = f"""\\copy (
  SELECT DISTINCT 'CA' as country, hs_code, product_description as description, 0 as indent, '' as duty_rate_text, 'macmap_ntlc' as source
  FROM macmap_ntlc_rates
  WHERE destination_country = 'CA' AND length(hs_code) >= 8
    AND hs_code NOT IN (SELECT hs_code FROM gov_tariff_schedules WHERE country = 'CA')
) TO '{ca_csv}' WITH CSV HEADER"""
out, err = run_sql_file(sql)
if os.path.exists(ca_csv):
    lines = sum(1 for _ in open(ca_csv)) - 1
    print(f'CA new 8-digit: {lines} rows')
    if lines > 0:
        out2, err2 = run_sql_file(f"\\copy gov_tariff_schedules(country, hs_code, description, indent, duty_rate_text, source) FROM '{ca_csv}' WITH CSV HEADER")
        print(f'INSERT: {out2}')

# ═══ Final check ═══
print('\n═══ Final Distribution ═══')
result = run_sql("""
SELECT country, length(hs_code) as len, count(*)
FROM gov_tariff_schedules
GROUP BY country, length(hs_code)
ORDER BY country, len
""")
for line in result.split('\n'):
    if line.strip():
        parts = line.split('|')
        if len(parts) == 3:
            print(f'  {parts[0].strip():3s} {parts[1].strip():>3s}-digit: {parts[2].strip():>6s} rows')

print('\nTotal:')
total = run_sql("SELECT country, count(*) FROM gov_tariff_schedules GROUP BY country ORDER BY country")
for line in total.split('\n'):
    if line.strip():
        parts = line.split('|')
        if len(parts) == 2:
            print(f'  {parts[0].strip():3s}: {parts[1].strip():>6s} rows')
