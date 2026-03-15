#!/usr/bin/env python3
"""
EU TARIC 벌크 다운로드 via UK Trade Tariff /xi/ API + Supabase 임포트

UK /xi/ endpoint = EU CET (Common External Tariff)
Flow: chapters → headings → commodities (with duty rates from heading endpoint)

Usage: python3 scripts/download_eu_taric.py
"""
import json
import subprocess
import time
import re
import os
import urllib.request
from datetime import datetime

TARIFF_API = "https://www.trade-tariff.service.gov.uk/xi/api/v2"
MGMT_URL = "https://api.supabase.com/v1/projects/zyurflkhiregundhisky/database/query"
MGMT_TOKEN = os.environ.get("SUPABASE_MGMT_TOKEN", "")

CHAPTERS = [str(i).zfill(2) for i in range(1, 100)]

def log(msg):
    print(f"[{datetime.now().strftime('%H:%M:%S')}] {msg}", flush=True)

def api_get(path):
    url = f"{TARIFF_API}{path}"
    req = urllib.request.Request(url, headers={"Accept": "application/vnd.uktt.v2"})
    try:
        with urllib.request.urlopen(req, timeout=30) as resp:
            return json.loads(resp.read().decode())
    except Exception as e:
        log(f"  API error {path}: {e}")
        return None

def escape_sql(s):
    if not s:
        return ''
    if isinstance(s, list):
        s = ', '.join(str(x) for x in s)
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

def get_headings(chapter):
    """Get all 4-digit headings for a chapter"""
    data = api_get(f"/chapters/{chapter}")
    if not data:
        return []
    headings_rel = data.get('data', {}).get('relationships', {}).get('headings', {}).get('data', [])
    included = data.get('included', [])

    heading_ids = {h['id'] for h in headings_rel}
    headings = []
    for item in included:
        if item.get('type') == 'heading' and item.get('id') in heading_ids:
            attrs = item.get('attributes', {})
            code = attrs.get('goods_nomenclature_item_id', '')
            if code:
                headings.append(code[:4])
    return headings

def get_commodities_for_heading(heading):
    """Get all commodity codes + descriptions for a heading"""
    data = api_get(f"/headings/{heading}")
    if not data:
        return []

    included = data.get('included', [])
    commodities = []

    for item in included:
        if item.get('type') == 'commodity':
            attrs = item.get('attributes', {})
            code = attrs.get('goods_nomenclature_item_id', '')
            desc = attrs.get('description', '')
            leaf = attrs.get('leaf', False)

            if code and len(code) >= 6:
                commodities.append({
                    'hs_code': code.replace('.', ''),
                    'description': desc,
                    'leaf': leaf,
                })

    return commodities

def get_duty_for_commodity(commodity_code):
    """Get MFN duty rate for a specific commodity"""
    data = api_get(f"/commodities/{commodity_code}")
    if not data:
        return None, None

    included = data.get('included', [])

    # Find third-country duty (MFN) measure
    # Measure type 103 = Third country duty
    duty_text = None
    duty_pct = None

    for item in included:
        if item.get('type') == 'duty_expression':
            attrs = item.get('attributes', {})
            base = attrs.get('base', '')
            if base and base != '0.00':
                # Check if it's a percentage
                formatted = attrs.get('formatted_base', '')
                if '%' in str(formatted) or '%' in str(base):
                    duty_text = str(base)
                    try:
                        duty_pct = float(str(base).replace('%', '').strip())
                    except:
                        pass
                    break
                elif base == '0.00' or 'free' in str(base).lower():
                    duty_text = 'Free'
                    duty_pct = 0.0
                    break

    # If no duty found, check for 0% / Free
    if duty_text is None:
        for item in included:
            if item.get('type') == 'duty_expression':
                attrs = item.get('attributes', {})
                base = str(attrs.get('base', ''))
                if base == '0.00' or base == '0.00 %':
                    duty_text = 'Free'
                    duty_pct = 0.0
                    break

    return duty_text, duty_pct

def main():
    log("=" * 60)
    log("EU TARIC 벌크 다운로드 (via UK /xi/ API) + Supabase 임포트")
    log("=" * 60)

    total_commodities = 0
    total_inserted = 0
    errors = 0

    for ch in CHAPTERS:
        headings = get_headings(ch)
        if not headings:
            continue

        ch_commodities = []

        for heading in headings:
            commodities = get_commodities_for_heading(heading)

            for c in commodities:
                ch_commodities.append({
                    'hs_code': c['hs_code'],
                    'description': c['description'],
                    'duty_rate_text': '',
                    'duty_rate_pct': None,
                })

            time.sleep(0.3)  # Rate limit

        if not ch_commodities:
            continue

        total_commodities += len(ch_commodities)

        # Insert in batches of 50
        BATCH = 50
        ch_inserted = 0
        for i in range(0, len(ch_commodities), BATCH):
            batch = ch_commodities[i:i+BATCH]
            values = []
            for v in batch:
                desc = escape_sql(v['description'])[:500]
                rate_text = escape_sql(v.get('duty_rate_text', ''))
                rate_pct = f"{v['duty_rate_pct']}" if v.get('duty_rate_pct') is not None else 'NULL'
                values.append(
                    f"('EU', '{v['hs_code']}', '{desc}', '{rate_text}', {rate_pct}, '', '', 'eu_taric_xi', 0)"
                )

            sql = f"""INSERT INTO gov_tariff_schedules
                (country, hs_code, description, duty_rate_text, duty_rate_pct, special_rates, units, source, indent)
                VALUES {','.join(values)}
                ON CONFLICT (country, hs_code) DO UPDATE SET
                    description = EXCLUDED.description;"""

            ok, resp = run_sql(sql)
            if ok:
                ch_inserted += len(batch)
            else:
                errors += 1
                if errors <= 3:
                    log(f"  SQL error ch{ch}: {resp[:150]}")

        total_inserted += ch_inserted
        log(f"Ch{ch}: {len(headings)} headings, {len(ch_commodities)} commodities, {ch_inserted} inserted")

    log("=" * 60)
    log(f"완료! Commodities: {total_commodities}, Inserted: {total_inserted}, Errors: {errors}")

    ok, resp = run_sql("SELECT count(*) as cnt FROM gov_tariff_schedules WHERE country = 'EU';")
    log(f"DB EU rows: {resp}")
    log("=" * 60)

if __name__ == "__main__":
    main()
