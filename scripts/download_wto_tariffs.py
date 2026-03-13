#!/usr/bin/env python3
"""
WTO API를 통한 4개국(KR, CA, AU, JP) HS 6자리 MFN 관세율 다운로드 + Supabase 임포트

WTO API: api.wto.org/timeseries/v1
- Indicator: HS_A_0010 (HS MFN - Simple average ad valorem duty)
- 6,882 HS6 codes available
- Free with API key

Usage: python3 scripts/download_wto_tariffs.py KR
       python3 scripts/download_wto_tariffs.py CA
       python3 scripts/download_wto_tariffs.py AU
       python3 scripts/download_wto_tariffs.py JP
"""
import json
import subprocess
import sys
import time
from datetime import datetime

WTO_API = "https://api.wto.org/timeseries/v1"
WTO_KEY = "e6b00ecdb5b34e09aabe15e68ab71d1d"
MGMT_URL = "https://api.supabase.com/v1/projects/zyurflkhiregundhisky/database/query"
MGMT_TOKEN = "sbp_c96b42dce1f4204ae9f03b776ea42087a8dd6b6a"

# WTO reporter codes
COUNTRY_MAP = {
    'KR': {'wto_code': '410', 'name': 'Korea', 'source': 'wto_mfn_kr'},
    'CA': {'wto_code': '124', 'name': 'Canada', 'source': 'wto_mfn_ca'},
    'AU': {'wto_code': '036', 'name': 'Australia', 'source': 'wto_mfn_au'},
    'JP': {'wto_code': '392', 'name': 'Japan', 'source': 'wto_mfn_jp'},
}

def log(msg):
    print(f"[{datetime.now().strftime('%H:%M:%S')}] {msg}", flush=True)

def escape_sql(s):
    if not s:
        return ''
    return str(s).replace("\\", "\\\\").replace("'", "''")

def run_sql(query):
    result = subprocess.run([
        'curl', '-s', '-X', 'POST', MGMT_URL,
        '-H', f'Authorization: Bearer {MGMT_TOKEN}',
        '-H', 'Content-Type: application/json',
        '-d', json.dumps({"query": query})
    ], capture_output=True, text=True, timeout=30)
    if 'error' in result.stdout.lower() and '"message"' in result.stdout:
        return False, result.stdout[:200]
    return True, result.stdout

def wto_get(params):
    """Call WTO API with retry"""
    import urllib.request
    url = f"{WTO_API}/data?{params}&subscription-key={WTO_KEY}"
    for attempt in range(3):
        try:
            req = urllib.request.Request(url, headers={
                "User-Agent": "Mozilla/5.0",
                "Accept": "application/json"
            })
            with urllib.request.urlopen(req, timeout=60) as resp:
                return json.loads(resp.read().decode())
        except Exception as e:
            if attempt < 2:
                time.sleep(2)
            else:
                log(f"  API error: {e}")
                return None

def get_products():
    """Get all valid HS6 product codes from WTO"""
    import urllib.request
    url = f"{WTO_API}/products?subscription-key={WTO_KEY}&pc=HS&lang=1"
    req = urllib.request.Request(url, headers={"User-Agent": "Mozilla/5.0"})
    with urllib.request.urlopen(req, timeout=60) as resp:
        data = json.loads(resp.read().decode())

    # Group HS6 codes by chapter
    chapters = {}
    names = {}
    for d in data:
        code = d.get('code', '')
        if len(code) == 6:
            ch = code[:2]
            if ch not in chapters:
                chapters[ch] = []
            chapters[ch].append(code)
            names[code] = d.get('name', '')

    return chapters, names

def main():
    if len(sys.argv) < 2:
        print("Usage: python3 scripts/download_wto_tariffs.py KR|CA|AU|JP")
        sys.exit(1)

    country = sys.argv[1].upper()
    if country not in COUNTRY_MAP:
        print(f"Unknown country: {country}. Use: KR, CA, AU, JP")
        sys.exit(1)

    info = COUNTRY_MAP[country]
    wto_code = info['wto_code']
    source = info['source']

    log("=" * 60)
    log(f"WTO MFN 관세율 다운로드: {info['name']} ({country})")
    log("=" * 60)

    # Step 1: Get product codes
    log("Step 1: Getting HS6 product codes from WTO...")
    chapters, names = get_products()
    total_codes = sum(len(v) for v in chapters.values())
    log(f"  {total_codes} HS6 codes across {len(chapters)} chapters")

    # Step 2: Query MFN rates chapter by chapter
    log("Step 2: Querying MFN rates...")
    all_rates = {}
    errors = 0

    for ch_idx, (ch, codes) in enumerate(sorted(chapters.items())):
        # WTO API accepts comma-separated product codes, but has URL length limit
        # Split into sub-batches of 50 codes
        BATCH = 50
        ch_rates = {}

        for i in range(0, len(codes), BATCH):
            batch_codes = codes[i:i+BATCH]
            pc = ','.join(batch_codes)

            # Try years 2024, 2023, 2022 (most recent available)
            data = wto_get(f"i=HS_A_0010&r={wto_code}&ps=2024,2023,2022&pc={pc}&fmt=json&mode=full")

            if data and isinstance(data, list):
                for row in data:
                    code = row.get('ProductOrSectorCode', '')
                    value = row.get('Value')
                    year = row.get('Year')
                    if code and value is not None and code not in ch_rates:
                        ch_rates[code] = {
                            'rate': value,
                            'year': year,
                            'name': row.get('ProductOrSector', names.get(code, ''))
                        }
            elif data and isinstance(data, dict) and 'Dataset' in data:
                for row in data['Dataset']:
                    code = row.get('ProductOrSectorCode', '')
                    value = row.get('Value')
                    year = row.get('Year')
                    if code and value is not None and code not in ch_rates:
                        ch_rates[code] = {
                            'rate': value,
                            'year': year,
                            'name': row.get('ProductOrSector', names.get(code, ''))
                        }

            time.sleep(0.5)  # Rate limit

        all_rates.update(ch_rates)

        if (ch_idx + 1) % 10 == 0 or ch_idx == len(chapters) - 1:
            log(f"  Ch{ch}: {len(ch_rates)} rates, total: {len(all_rates)}")

    log(f"  Total rates collected: {len(all_rates)}")

    # Also get 4-digit heading data for broader coverage
    log("Step 3: Getting HS4 heading rates for gap-fill...")
    heading_rates = {}

    # Get HS4 codes
    import urllib.request
    url = f"{WTO_API}/products?subscription-key={WTO_KEY}&pc=HS&lang=1"
    req = urllib.request.Request(url, headers={"User-Agent": "Mozilla/5.0"})
    with urllib.request.urlopen(req, timeout=60) as resp:
        all_products = json.loads(resp.read().decode())

    hs4_by_chapter = {}
    hs4_names = {}
    for d in all_products:
        code = d.get('code', '')
        if len(code) == 4:
            ch = code[:2]
            if ch not in hs4_by_chapter:
                hs4_by_chapter[ch] = []
            hs4_by_chapter[ch].append(code)
            hs4_names[code] = d.get('name', '')

    for ch_idx, (ch, codes) in enumerate(sorted(hs4_by_chapter.items())):
        BATCH = 50
        for i in range(0, len(codes), BATCH):
            batch_codes = codes[i:i+BATCH]
            pc = ','.join(batch_codes)
            data = wto_get(f"i=HS_A_0010&r={wto_code}&ps=2024,2023,2022&pc={pc}&fmt=json&mode=full")

            if data and isinstance(data, list):
                for row in data:
                    code = row.get('ProductOrSectorCode', '')
                    value = row.get('Value')
                    if code and value is not None and code not in heading_rates:
                        heading_rates[code] = {
                            'rate': value,
                            'name': row.get('ProductOrSector', hs4_names.get(code, ''))
                        }
            elif data and isinstance(data, dict) and 'Dataset' in data:
                for row in data['Dataset']:
                    code = row.get('ProductOrSectorCode', '')
                    value = row.get('Value')
                    if code and value is not None and code not in heading_rates:
                        heading_rates[code] = {
                            'rate': value,
                            'name': row.get('ProductOrSector', hs4_names.get(code, ''))
                        }

            time.sleep(0.5)

    log(f"  HS4 heading rates: {len(heading_rates)}")

    # Fill gaps: for HS6 codes without rates, use their HS4 heading rate
    filled = 0
    for ch_codes in chapters.values():
        for code in ch_codes:
            if code not in all_rates:
                heading = code[:4]
                if heading in heading_rates:
                    all_rates[code] = {
                        'rate': heading_rates[heading]['rate'],
                        'name': names.get(code, heading_rates[heading]['name']),
                    }
                    filled += 1

    log(f"  Gap-filled {filled} codes from HS4 headings")
    log(f"  Total rates after fill: {len(all_rates)}")

    # Step 4: Insert into Supabase
    log("Step 4: Inserting into gov_tariff_schedules...")
    total_inserted = 0
    sql_errors = 0

    items = list(all_rates.items())
    BATCH = 50
    for i in range(0, len(items), BATCH):
        batch = items[i:i+BATCH]
        values = []
        for code, info in batch:
            desc = escape_sql(info.get('name', ''))[:500]
            rate = info['rate']
            rate_text = f"{rate}%" if rate is not None else ''
            rate_pct = rate if rate is not None else 'NULL'
            if rate_pct != 'NULL':
                rate_pct = float(rate_pct)
            values.append(
                f"('{country}', '{code}', '{desc}', '{escape_sql(rate_text)}', "
                f"{rate_pct}, '', '', '{source}', 0)"
            )

        sql = f"""INSERT INTO gov_tariff_schedules
            (country, hs_code, description, duty_rate_text, duty_rate_pct, special_rates, units, source, indent)
            VALUES {','.join(values)}
            ON CONFLICT (country, hs_code) DO UPDATE SET
                description = EXCLUDED.description,
                duty_rate_text = EXCLUDED.duty_rate_text,
                duty_rate_pct = EXCLUDED.duty_rate_pct;"""

        ok, resp = run_sql(sql)
        if ok:
            total_inserted += len(batch)
        else:
            sql_errors += 1
            if sql_errors <= 3:
                log(f"  SQL error batch {i}: {resp[:150]}")

    log("=" * 60)
    log(f"완료! {info['name']}: {len(all_rates)} rates, {total_inserted} inserted, {sql_errors} errors")

    ok, resp = run_sql(f"SELECT count(*) as cnt FROM gov_tariff_schedules WHERE country = '{country}';")
    log(f"DB {country} rows: {resp}")
    log("=" * 60)

if __name__ == "__main__":
    main()
