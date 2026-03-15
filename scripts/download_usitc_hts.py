#!/usr/bin/env python3
"""
USITC HTS 전체 스케줄 다운로드 + Supabase 임포트

API: https://hts.usitc.gov/reststop/search?keyword={chapter}
- 무료, 인증 불요
- 챕터별 (01~99) 전체 HTS 코드 + 세율 다운로드

Usage:
    python3 scripts/download_usitc_hts.py
"""
import json
import subprocess
import time
import re
import sys
import os
from datetime import datetime

USITC_API = "https://hts.usitc.gov/reststop/search"
MGMT_URL = "https://api.supabase.com/v1/projects/zyurflkhiregundhisky/database/query"
MGMT_TOKEN = os.environ.get("SUPABASE_MGMT_TOKEN", "")

# HTS chapters: 01-99 (some don't exist but API returns empty)
CHAPTERS = [str(i).zfill(2) for i in range(1, 100)]

def log(msg):
    print(f"[{datetime.now().strftime('%H:%M:%S')}] {msg}", flush=True)

def fetch_chapter(chapter):
    """Fetch all HTS entries for a chapter via USITC API"""
    import urllib.request
    url = f"{USITC_API}?keyword={chapter}"
    try:
        req = urllib.request.Request(url, headers={"Accept": "application/json"})
        with urllib.request.urlopen(req, timeout=30) as resp:
            return json.loads(resp.read().decode())
    except Exception as e:
        log(f"  ERROR fetching ch{chapter}: {e}")
        return []

def parse_rate(rate_str):
    """Parse USITC rate string to percentage"""
    if not rate_str:
        return None
    clean = rate_str.strip().lower()
    if clean in ('free', 'free.'):
        return 0.0
    # Pure ad valorem: "8.5%"
    m = re.match(r'^(\d+(?:\.\d+)?)\s*%$', clean)
    if m:
        return float(m.group(1))
    # Compound with ad valorem: "12.5¢/kg + 2.5%"
    m = re.search(r'(\d+(?:\.\d+)?)\s*%', clean)
    if m:
        return float(m.group(1))
    return None

def run_sql(query):
    """Execute SQL via Supabase Management API"""
    result = subprocess.run([
        'curl', '-s', '-X', 'POST', MGMT_URL,
        '-H', f'Authorization: Bearer {MGMT_TOKEN}',
        '-H', 'Content-Type: application/json',
        '-d', json.dumps({"query": query})
    ], capture_output=True, text=True, timeout=30)
    if 'error' in result.stdout.lower() and '"error"' in result.stdout:
        return False, result.stdout[:200]
    return True, result.stdout

def escape_sql(s):
    if not s:
        return ''
    if isinstance(s, list):
        s = ', '.join(str(x) for x in s)
    return str(s).replace("\\", "\\\\").replace("'", "''")

def main():
    log("=" * 60)
    log("USITC HTS 전체 스케줄 다운로드 + Supabase 임포트")
    log("=" * 60)

    total_fetched = 0
    total_with_rate = 0
    total_inserted = 0
    errors = 0

    for ch in CHAPTERS:
        entries = fetch_chapter(ch)
        if not entries:
            continue

        # Filter entries with general rate and valid HTS code
        valid = []
        for e in entries:
            htsno = e.get('htsno', '').strip()
            if not htsno or len(htsno.replace('.', '')) < 4:
                continue
            general = e.get('general', '')
            description = e.get('description', '')
            special = e.get('special', '')
            units = e.get('units', '')
            indent = e.get('indent', 0)
            try:
                indent = int(indent)
            except:
                indent = 0

            # Clean HTS number (remove dots for storage)
            hs_clean = htsno.replace('.', '')

            rate_pct = parse_rate(general) if general else None

            valid.append({
                'hs_code': hs_clean,
                'description': description[:500] if description else '',
                'duty_rate_text': general[:200] if general else '',
                'duty_rate_pct': rate_pct,
                'special_rates': special[:500] if special else '',
                'units': units[:100] if units else '',
                'indent': indent,
            })

        total_fetched += len(entries)
        with_rate = [v for v in valid if v['duty_rate_text']]
        total_with_rate += len(with_rate)

        # Insert in batches of 50
        BATCH = 50
        ch_inserted = 0
        for i in range(0, len(valid), BATCH):
            batch = valid[i:i+BATCH]
            values = []
            for v in batch:
                desc = escape_sql(v['description'])
                rate_text = escape_sql(v['duty_rate_text'])
                special = escape_sql(v['special_rates'])
                units = escape_sql(v['units'])
                rate_pct = f"{v['duty_rate_pct']}" if v['duty_rate_pct'] is not None else 'NULL'
                values.append(
                    f"('US', '{v['hs_code']}', '{desc}', '{rate_text}', {rate_pct}, "
                    f"'{special}', '{units}', 'usitc_hts', {v['indent']})"
                )

            sql = f"""INSERT INTO gov_tariff_schedules
                (country, hs_code, description, duty_rate_text, duty_rate_pct, special_rates, units, source, indent)
                VALUES {','.join(values)}
                ON CONFLICT (country, hs_code) DO UPDATE SET
                    description = EXCLUDED.description,
                    duty_rate_text = EXCLUDED.duty_rate_text,
                    duty_rate_pct = EXCLUDED.duty_rate_pct,
                    special_rates = EXCLUDED.special_rates,
                    units = EXCLUDED.units;"""

            ok, resp = run_sql(sql)
            if ok:
                ch_inserted += len(batch)
            else:
                errors += 1
                if errors <= 3:
                    log(f"  SQL error ch{ch} batch {i}: {resp[:150]}")

        total_inserted += ch_inserted
        log(f"Ch{ch}: {len(entries)} fetched, {len(valid)} valid, {ch_inserted} inserted")

        # Rate limit: be nice to the API
        time.sleep(0.5)

    log("=" * 60)
    log(f"완료! Fetched: {total_fetched}, With rate: {total_with_rate}, Inserted: {total_inserted}, Errors: {errors}")

    # Verify
    ok, resp = run_sql("SELECT count(*) as cnt FROM gov_tariff_schedules WHERE country = 'US';")
    log(f"DB US rows: {resp}")
    log("=" * 60)

if __name__ == "__main__":
    main()
