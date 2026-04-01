#!/usr/bin/env python3
"""
Precompute HS10 candidates for 490 HS6 × 7 countries.
Reads from gov_tariff_schedules and inserts into precomputed_hs10_candidates.
"""
import json
import subprocess
import time
import os

LOG_FILE = "/Users/maegbug/potal/precompute.log"
SUPABASE_PROJECT = "zyurflkhiregundhisky"
SUPABASE_TOKEN = os.environ.get("SUPABASE_MGMT_TOKEN", "")
HS10_COUNTRIES = ['US', 'EU', 'GB', 'KR', 'CA', 'AU', 'JP']

def log(msg):
    ts = time.strftime("%Y-%m-%d %H:%M:%S")
    line = f"[{ts}] {msg}"
    print(line, flush=True)
    with open(LOG_FILE, "a") as f:
        f.write(line + "\n")

def run_sql(query, retries=3, timeout=60):
    for attempt in range(retries):
        try:
            result = subprocess.run(
                ["curl", "-s", "-X", "POST",
                 f"https://api.supabase.com/v1/projects/{SUPABASE_PROJECT}/database/query",
                 "-H", f"Authorization: Bearer {SUPABASE_TOKEN}",
                 "-H", "Content-Type: application/json",
                 "-d", json.dumps({"query": query})],
                capture_output=True, text=True, timeout=timeout
            )
            resp = result.stdout
            if '"message"' in resp and 'ERROR' in resp:
                if attempt < retries - 1: time.sleep(1); continue
                return None, resp[:300]
            return json.loads(resp), None
        except Exception as e:
            if attempt < retries - 1: time.sleep(1); continue
            return None, str(e)

def main():
    log("=" * 70)
    log("PRECOMPUTING HS10 CANDIDATES (490 HS6 × 7 countries)")
    log("=" * 70)

    with open("/Users/maegbug/potal/scripts/precompute_hs6_list.json") as f:
        hs6_list = json.load(f)
    log(f"HS6 codes: {len(hs6_list)}, Countries: {len(HS10_COUNTRIES)}")
    log(f"Total combinations: {len(hs6_list) * len(HS10_COUNTRIES)}")

    total_inserted = 0
    total_with_candidates = 0

    for country in HS10_COUNTRIES:
        country_results = []
        # Query all HS10 candidates for this country in batches
        for i in range(0, len(hs6_list), 50):
            batch = hs6_list[i:i+50]
            hs6_in = ",".join(f"'{h}'" for h in batch)
            sql = f"""SELECT hs_code, description, duty_rate_pct
                      FROM gov_tariff_schedules
                      WHERE country = '{country}'
                        AND LENGTH(hs_code) >= 8
                        AND LEFT(hs_code, 6) IN ({hs6_in})
                      ORDER BY hs_code;"""
            data, err = run_sql(sql)
            if err:
                log(f"  {country} batch error: {err[:100]}")
                continue
            if data:
                # Group by HS6
                grouped = {}
                for r in data:
                    hs6 = r['hs_code'][:6]
                    if hs6 not in grouped:
                        grouped[hs6] = []
                    grouped[hs6].append({
                        'hs_code': r['hs_code'],
                        'description': (r['description'] or '')[:200],
                        'duty_rate_pct': float(r['duty_rate_pct']) if r['duty_rate_pct'] is not None else None
                    })
                for hs6, candidates in grouped.items():
                    country_results.append((hs6, candidates))

        # Insert results
        batch_size = 50
        for i in range(0, len(country_results), batch_size):
            batch = country_results[i:i+batch_size]
            values = []
            for hs6, candidates in batch:
                cand_json = json.dumps(candidates).replace("'", "''")
                values.append(f"('{hs6}', '{country}', '{cand_json}'::jsonb, NOW())")
                if candidates:
                    total_with_candidates += 1

            if values:
                sql = f"""INSERT INTO precomputed_hs10_candidates (hs6, country, hs10_candidates, last_updated)
                          VALUES {','.join(values)}
                          ON CONFLICT (hs6, country) DO UPDATE SET
                            hs10_candidates = EXCLUDED.hs10_candidates,
                            last_updated = NOW();"""
                _, err = run_sql(sql, timeout=60)
                if err:
                    log(f"  {country} insert error: {err[:100]}")
                else:
                    total_inserted += len(batch)

        log(f"  {country}: {len(country_results)} HS6 codes with candidates, {total_inserted} total inserted")

    # Verify
    cnt, _ = run_sql("SELECT COUNT(*) as cnt FROM precomputed_hs10_candidates;")
    log(f"Final precomputed_hs10_candidates: {cnt[0]['cnt'] if cnt else '?'} rows")
    log(f"With candidates: {total_with_candidates}")
    log("HS10 precomputing complete!")

if __name__ == "__main__":
    main()
