#!/usr/bin/env python3
"""
Update precomputed_landed_costs with MIN and AGR rates.
Queries per country (53 countries) × batch of HS6 codes.
Then updates best_rate to pick the lowest of MFN/MIN/AGR.
"""
import json
import subprocess
import time
import sys

LOG_FILE = "/Users/maegbug/portal/precompute.log"
SUPABASE_PROJECT = "zyurflkhiregundhisky"
SUPABASE_TOKEN = "sbp_c96b42dce1f4204ae9f03b776ea42087a8dd6b6a"

MIN_AGR_COUNTRIES = [
    'AE', 'AR', 'AU', 'BD', 'BH', 'BR', 'CA', 'CH', 'CL', 'CN', 'CO', 'CR',
    'DO', 'DZ', 'EC', 'EG', 'EU', 'GB', 'GH', 'HK', 'ID', 'IL', 'IN', 'JO',
    'JP', 'KE', 'KR', 'KW', 'KZ', 'LK', 'MA', 'MX', 'MY', 'NG', 'NO', 'NZ',
    'OM', 'PE', 'PH', 'PK', 'PY', 'QA', 'RU', 'SA', 'SG', 'TH', 'TN', 'TR',
    'TW', 'UA', 'US', 'UY', 'VN'
]

def log(msg):
    ts = time.strftime("%Y-%m-%d %H:%M:%S")
    line = f"[{ts}] {msg}"
    print(line, flush=True)
    with open(LOG_FILE, "a") as f:
        f.write(line + "\n")

def run_sql(query, retries=3, timeout=90):
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
                if attempt < retries - 1:
                    time.sleep(2)
                    continue
                return None, resp[:300]
            return json.loads(resp), None
        except subprocess.TimeoutExpired:
            if attempt < retries - 1:
                time.sleep(3)
                continue
            return None, "Timeout"
        except Exception as e:
            if attempt < retries - 1:
                time.sleep(2)
                continue
            return None, str(e)

def main():
    log("=" * 70)
    log("UPDATE PRECOMPUTED: MIN + AGR rates for 53 countries")
    log("=" * 70)

    start = time.time()

    # Load HS6 list
    with open("/Users/maegbug/portal/scripts/precompute_hs6_list.json") as f:
        hs6_list = json.load(f)
    log(f"HS6 codes: {len(hs6_list)}")

    batch_size = 20  # Smaller batches for the huge MIN/AGR tables

    # =========================================================================
    # PHASE 1: MIN rates
    # =========================================================================
    log("Phase 1: Loading MIN rates...")
    min_total = 0
    min_updated = 0

    for ci, country in enumerate(MIN_AGR_COUNTRIES):
        country_rates = {}
        for i in range(0, len(hs6_list), batch_size):
            batch = hs6_list[i:i+batch_size]
            hs6_in = ",".join(f"'{h}'" for h in batch)
            sql = f"""SELECT hs6, MIN(av_duty) as best_min
                      FROM macmap_min_rates
                      WHERE TRIM(reporter_iso2) = '{country}'
                        AND hs6 IN ({hs6_in})
                        AND av_duty IS NOT NULL AND av_duty >= 0
                      GROUP BY hs6;"""
            data, err = run_sql(sql)
            if err:
                # Try even smaller batches
                for h in batch:
                    sql2 = f"""SELECT MIN(av_duty) as best_min
                              FROM macmap_min_rates
                              WHERE TRIM(reporter_iso2) = '{country}'
                                AND hs6 = '{h}'
                                AND av_duty IS NOT NULL AND av_duty >= 0;"""
                    d2, e2 = run_sql(sql2, timeout=30)
                    if d2 and d2[0].get('best_min') is not None:
                        country_rates[h] = float(d2[0]['best_min'])
                continue
            if data:
                for r in data:
                    if r['best_min'] is not None:
                        country_rates[r['hs6']] = float(r['best_min'])

        # Batch update precomputed_landed_costs for this country
        if country_rates:
            # Build CASE statement for batch update
            case_parts = []
            hs6_vals = []
            for hs6, rate in country_rates.items():
                case_parts.append(f"WHEN '{hs6}' THEN {rate}")
                hs6_vals.append(f"'{hs6}'")

            if len(hs6_vals) <= 100:
                # Single update
                sql_update = f"""UPDATE precomputed_landed_costs
                    SET min_rate = CASE hs6 {' '.join(case_parts)} END,
                        last_updated = NOW()
                    WHERE destination_country = '{country}'
                      AND hs6 IN ({','.join(hs6_vals)});"""
                _, err = run_sql(sql_update, timeout=60)
                if err:
                    log(f"  {country} MIN update error: {err[:100]}")
                else:
                    min_updated += len(country_rates)
            else:
                # Split into chunks
                items = list(country_rates.items())
                for j in range(0, len(items), 100):
                    chunk = items[j:j+100]
                    cp = [f"WHEN '{hs6}' THEN {rate}" for hs6, rate in chunk]
                    hv = [f"'{hs6}'" for hs6, _ in chunk]
                    sql_u = f"""UPDATE precomputed_landed_costs
                        SET min_rate = CASE hs6 {' '.join(cp)} END,
                            last_updated = NOW()
                        WHERE destination_country = '{country}'
                          AND hs6 IN ({','.join(hv)});"""
                    _, err = run_sql(sql_u, timeout=60)
                    if not err:
                        min_updated += len(chunk)

        min_total += len(country_rates)
        if (ci + 1) % 10 == 0:
            elapsed = time.time() - start
            log(f"  MIN progress: {ci+1}/{len(MIN_AGR_COUNTRIES)} countries, "
                f"{min_total} rates found, {min_updated} updated | {elapsed:.0f}s")

    log(f"  MIN complete: {min_total} rates, {min_updated} updated")

    # =========================================================================
    # PHASE 2: AGR rates
    # =========================================================================
    log("Phase 2: Loading AGR rates...")
    agr_total = 0
    agr_updated = 0

    for ci, country in enumerate(MIN_AGR_COUNTRIES):
        country_rates = {}
        for i in range(0, len(hs6_list), batch_size):
            batch = hs6_list[i:i+batch_size]
            hs6_in = ",".join(f"'{h}'" for h in batch)
            sql = f"""SELECT hs6, MIN(av_duty) as best_agr
                      FROM macmap_agr_rates
                      WHERE TRIM(reporter_iso2) = '{country}'
                        AND hs6 IN ({hs6_in})
                        AND av_duty IS NOT NULL AND av_duty >= 0
                      GROUP BY hs6;"""
            data, err = run_sql(sql)
            if err:
                for h in batch:
                    sql2 = f"""SELECT MIN(av_duty) as best_agr
                              FROM macmap_agr_rates
                              WHERE TRIM(reporter_iso2) = '{country}'
                                AND hs6 = '{h}'
                                AND av_duty IS NOT NULL AND av_duty >= 0;"""
                    d2, e2 = run_sql(sql2, timeout=30)
                    if d2 and d2[0].get('best_agr') is not None:
                        country_rates[h] = float(d2[0]['best_agr'])
                continue
            if data:
                for r in data:
                    if r['best_agr'] is not None:
                        country_rates[r['hs6']] = float(r['best_agr'])

        if country_rates:
            items = list(country_rates.items())
            for j in range(0, len(items), 100):
                chunk = items[j:j+100]
                cp = [f"WHEN '{hs6}' THEN {rate}" for hs6, rate in chunk]
                hv = [f"'{hs6}'" for hs6, _ in chunk]
                sql_u = f"""UPDATE precomputed_landed_costs
                    SET agr_rate = CASE hs6 {' '.join(cp)} END,
                        last_updated = NOW()
                    WHERE destination_country = '{country}'
                      AND hs6 IN ({','.join(hv)});"""
                _, err = run_sql(sql_u, timeout=60)
                if not err:
                    agr_updated += len(chunk)

        agr_total += len(country_rates)
        if (ci + 1) % 10 == 0:
            elapsed = time.time() - start
            log(f"  AGR progress: {ci+1}/{len(MIN_AGR_COUNTRIES)} countries, "
                f"{agr_total} rates found, {agr_updated} updated | {elapsed:.0f}s")

    log(f"  AGR complete: {agr_total} rates, {agr_updated} updated")

    # =========================================================================
    # PHASE 3: Update best_rate to pick lowest of MFN/MIN/AGR
    # =========================================================================
    log("Phase 3: Updating best_rate (pick lowest)...")
    sql_best = """
    UPDATE precomputed_landed_costs
    SET best_rate = LEAST(
          COALESCE(mfn_rate, 999999),
          COALESCE(min_rate, 999999),
          COALESCE(agr_rate, 999999)
        ),
        best_rate_source = CASE
          WHEN COALESCE(agr_rate, 999999) <= COALESCE(min_rate, 999999)
               AND COALESCE(agr_rate, 999999) <= COALESCE(mfn_rate, 999999) THEN 'AGR'
          WHEN COALESCE(min_rate, 999999) <= COALESCE(mfn_rate, 999999) THEN 'MIN'
          WHEN mfn_rate IS NOT NULL THEN 'MFN'
          ELSE NULL
        END,
        last_updated = NOW()
    WHERE mfn_rate IS NOT NULL OR min_rate IS NOT NULL OR agr_rate IS NOT NULL;
    """
    _, err = run_sql(sql_best, timeout=120)
    if err:
        log(f"  best_rate update error: {err[:200]}")
    else:
        log("  best_rate updated successfully")

    # Also set best_rate=NULL where all rates are NULL
    run_sql("""UPDATE precomputed_landed_costs
               SET best_rate = NULL, best_rate_source = NULL
               WHERE mfn_rate IS NULL AND min_rate IS NULL AND agr_rate IS NULL;""", timeout=60)

    # =========================================================================
    # VERIFY
    # =========================================================================
    log("Verification...")
    stats, _ = run_sql("""
        SELECT
            COUNT(*) as total,
            COUNT(best_rate) as with_rate,
            COUNT(min_rate) as with_min,
            COUNT(agr_rate) as with_agr,
            COUNT(mfn_rate) as with_mfn,
            ROUND(AVG(best_rate)::numeric, 2) as avg_rate,
            COUNT(CASE WHEN best_rate_source = 'MFN' THEN 1 END) as mfn_best,
            COUNT(CASE WHEN best_rate_source = 'MIN' THEN 1 END) as min_best,
            COUNT(CASE WHEN best_rate_source = 'AGR' THEN 1 END) as agr_best
        FROM precomputed_landed_costs;""")
    if stats:
        s = stats[0]
        log(f"  Total rows: {s['total']:,}")
        log(f"  With any rate: {s['with_rate']:,}")
        log(f"  MFN: {s['with_mfn']:,} | MIN: {s['with_min']:,} | AGR: {s['with_agr']:,}")
        log(f"  Best source: MFN={s['mfn_best']:,} MIN={s['min_best']:,} AGR={s['agr_best']:,}")
        log(f"  Avg best rate: {s['avg_rate']}%")

    elapsed = time.time() - start
    log(f"Total elapsed: {elapsed/60:.1f} minutes")
    log("MIN/AGR update complete!")

if __name__ == "__main__":
    main()
