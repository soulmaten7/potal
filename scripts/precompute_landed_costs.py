#!/usr/bin/env python3
"""
Precompute 117,600 landed cost combinations (490 HS6 × 240 countries).
Queries MFN/MIN/AGR rates, VAT, de minimis, FTA, trade remedies.
Inserts results into precomputed_landed_costs table.
"""
import json
import subprocess
import time
import sys
import os
from collections import defaultdict

LOG_FILE = "/Users/maegbug/potal/precompute.log"
SUPABASE_PROJECT = "zyurflkhiregundhisky"
SUPABASE_TOKEN = os.environ.get("SUPABASE_MGMT_TOKEN", "")
SCRIPTS_DIR = "/Users/maegbug/potal/scripts"

def log(msg):
    ts = time.strftime("%Y-%m-%d %H:%M:%S")
    line = f"[{ts}] {msg}"
    print(line, flush=True)
    with open(LOG_FILE, "a") as f:
        f.write(line + "\n")

def run_sql(query, retries=3, timeout=120):
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
                log(f"  Timeout (attempt {attempt+1}), retrying...")
                time.sleep(3)
                continue
            return None, "Timeout"
        except Exception as e:
            if attempt < retries - 1:
                time.sleep(2)
                continue
            return None, str(e)
    return None, "Max retries"

def load_json(filename):
    with open(os.path.join(SCRIPTS_DIR, filename)) as f:
        return json.load(f)

def main():
    log("=" * 70)
    log("PRECOMPUTING 117,600 LANDED COST COMBINATIONS")
    log("490 HS6 × 240 countries")
    log("=" * 70)

    start_time = time.time()

    # Load reference data
    log("Loading reference data...")
    hs6_list = load_json("precompute_hs6_list.json")
    countries = load_json("precompute_countries.json")
    vat_data = load_json("precompute_vat.json")
    dm_data = load_json("precompute_deminimis.json")
    customs_data = load_json("precompute_customs.json")
    fta_data = load_json("precompute_fta.json")
    tr_data = load_json("precompute_trade_remedy.json")

    log(f"  HS6 codes: {len(hs6_list)}")
    log(f"  Countries: {len(countries)}")
    log(f"  VAT: {len(vat_data)}, De minimis: {len(dm_data)}")
    log(f"  FTAs: {len(fta_data)} countries, Trade remedies: {len(tr_data)} combos")

    # =========================================================================
    # PHASE A: Load MFN rates from macmap_ntlc_rates (537K rows, indexed)
    # =========================================================================
    log("Phase A: Loading MFN rates...")
    mfn_rates = {}  # (hs6, country) -> rate

    # Query in batches of 50 HS6 codes
    batch_size = 50
    for i in range(0, len(hs6_list), batch_size):
        batch = hs6_list[i:i+batch_size]
        hs6_in = ",".join(f"'{h}'" for h in batch)
        sql = f"""SELECT hs6, destination_country, mfn_rate
                  FROM macmap_ntlc_rates
                  WHERE hs6 IN ({hs6_in}) AND mfn_rate IS NOT NULL;"""
        data, err = run_sql(sql, timeout=60)
        if err:
            log(f"  MFN batch {i//batch_size+1} error: {err[:100]}")
            continue
        if data:
            for r in data:
                key = (r['hs6'], r['destination_country'])
                rate = float(r['mfn_rate'])
                if key not in mfn_rates or rate < mfn_rates[key]:
                    mfn_rates[key] = rate
        if (i // batch_size + 1) % 5 == 0:
            log(f"  MFN progress: {i+batch_size}/{len(hs6_list)} HS6 codes, {len(mfn_rates)} rates loaded")

    log(f"  MFN rates loaded: {len(mfn_rates)}")

    # =========================================================================
    # PHASE B: Load MIN rates from macmap_min_rates (113M rows)
    # Query per country (53 countries) × batch of HS6
    # =========================================================================
    log("Phase B: Loading MIN rates (53 countries)...")
    min_rates = {}  # (hs6, country) -> rate

    # Get list of countries in min_rates
    min_countries_data, _ = run_sql(
        "SELECT DISTINCT TRIM(reporter_iso2) as c FROM macmap_min_rates;", timeout=60)
    min_countries = [r['c'] for r in min_countries_data] if min_countries_data else []
    log(f"  MIN countries: {len(min_countries)}")

    for ci, country in enumerate(min_countries):
        # Query all 490 HS6 for this country at once (with GROUP BY to get min rate)
        batch_results = 0
        for i in range(0, len(hs6_list), batch_size):
            batch = hs6_list[i:i+batch_size]
            hs6_in = ",".join(f"'{h}'" for h in batch)
            sql = f"""SELECT hs6, MIN(av_duty) as best_min
                      FROM macmap_min_rates
                      WHERE TRIM(reporter_iso2) = '{country}'
                        AND hs6 IN ({hs6_in})
                        AND av_duty IS NOT NULL AND av_duty >= 0
                      GROUP BY hs6;"""
            data, err = run_sql(sql, timeout=90)
            if err:
                # Try smaller batches
                for h in batch:
                    sql2 = f"""SELECT MIN(av_duty) as best_min
                              FROM macmap_min_rates
                              WHERE TRIM(reporter_iso2) = '{country}'
                                AND hs6 = '{h}'
                                AND av_duty IS NOT NULL AND av_duty >= 0;"""
                    d2, e2 = run_sql(sql2, timeout=30)
                    if d2 and d2[0].get('best_min') is not None:
                        min_rates[(h, country)] = float(d2[0]['best_min'])
                        batch_results += 1
                continue
            if data:
                for r in data:
                    if r['best_min'] is not None:
                        min_rates[(r['hs6'], country)] = float(r['best_min'])
                        batch_results += 1

        if (ci + 1) % 10 == 0:
            log(f"  MIN progress: {ci+1}/{len(min_countries)} countries, {len(min_rates)} rates")

    log(f"  MIN rates loaded: {len(min_rates)}")

    # =========================================================================
    # PHASE C: Load AGR rates from macmap_agr_rates (144M rows)
    # Same strategy: per country × batch of HS6
    # =========================================================================
    log("Phase C: Loading AGR rates (53 countries)...")
    agr_rates = {}  # (hs6, country) -> rate

    agr_countries_data, _ = run_sql(
        "SELECT DISTINCT TRIM(reporter_iso2) as c FROM macmap_agr_rates;", timeout=60)
    agr_countries = [r['c'] for r in agr_countries_data] if agr_countries_data else []
    log(f"  AGR countries: {len(agr_countries)}")

    for ci, country in enumerate(agr_countries):
        for i in range(0, len(hs6_list), batch_size):
            batch = hs6_list[i:i+batch_size]
            hs6_in = ",".join(f"'{h}'" for h in batch)
            sql = f"""SELECT hs6, MIN(av_duty) as best_agr
                      FROM macmap_agr_rates
                      WHERE TRIM(reporter_iso2) = '{country}'
                        AND hs6 IN ({hs6_in})
                        AND av_duty IS NOT NULL AND av_duty >= 0
                      GROUP BY hs6;"""
            data, err = run_sql(sql, timeout=90)
            if err:
                for h in batch:
                    sql2 = f"""SELECT MIN(av_duty) as best_agr
                              FROM macmap_agr_rates
                              WHERE TRIM(reporter_iso2) = '{country}'
                                AND hs6 = '{h}'
                                AND av_duty IS NOT NULL AND av_duty >= 0;"""
                    d2, e2 = run_sql(sql2, timeout=30)
                    if d2 and d2[0].get('best_agr') is not None:
                        agr_rates[(h, country)] = float(d2[0]['best_agr'])
                continue
            if data:
                for r in data:
                    if r['best_agr'] is not None:
                        agr_rates[(r['hs6'], country)] = float(r['best_agr'])

        if (ci + 1) % 10 == 0:
            log(f"  AGR progress: {ci+1}/{len(agr_countries)} countries, {len(agr_rates)} rates")

    log(f"  AGR rates loaded: {len(agr_rates)}")

    # =========================================================================
    # PHASE D: Compute best rates and generate INSERT rows
    # =========================================================================
    log("Phase D: Computing 117,600 combinations...")
    total_combos = len(hs6_list) * len(countries)
    log(f"  Total: {total_combos:,} ({len(hs6_list)} × {len(countries)})")

    rows = []
    stats = {"mfn_only": 0, "min_best": 0, "agr_best": 0, "no_rate": 0, "with_remedy": 0}

    for hs6 in hs6_list:
        for cc in countries:
            mfn = mfn_rates.get((hs6, cc))
            mn = min_rates.get((hs6, cc))
            agr = agr_rates.get((hs6, cc))

            # Find best rate
            candidates = []
            if mfn is not None:
                candidates.append(("MFN", mfn))
            if mn is not None:
                candidates.append(("MIN", mn))
            if agr is not None:
                candidates.append(("AGR", agr))

            if candidates:
                best_source, best_rate = min(candidates, key=lambda x: x[1])
            else:
                best_rate = None
                best_source = None
                stats["no_rate"] += 1

            if best_source == "MFN":
                stats["mfn_only"] += 1
            elif best_source == "MIN":
                stats["min_best"] += 1
            elif best_source == "AGR":
                stats["agr_best"] += 1

            # VAT
            vat_info = vat_data.get(cc, {})
            vat_rate = vat_info.get("rate", 0)

            # De minimis
            dm_info = dm_data.get(cc, {})
            dm_usd = dm_info.get("duty", 0)

            # Processing fee
            pf = customs_data.get(cc, 0)

            # FTAs
            ftas = fta_data.get(cc, [])
            fta_json = json.dumps(ftas).replace("'", "''") if ftas else "[]"

            # Trade remedies
            tr_key = f"{cc}_{hs6}"
            remedies = tr_data.get(tr_key, [])
            if remedies:
                stats["with_remedy"] += 1
            tr_json = json.dumps(remedies).replace("'", "''") if remedies else "[]"

            # Build row
            mfn_str = str(mfn) if mfn is not None else "NULL"
            mn_str = str(mn) if mn is not None else "NULL"
            agr_str = str(agr) if agr is not None else "NULL"
            best_str = str(best_rate) if best_rate is not None else "NULL"
            best_src_str = f"'{best_source}'" if best_source else "NULL"

            rows.append(
                f"('{hs6}', '{cc}', {mfn_str}, {mn_str}, {agr_str}, "
                f"{best_str}, {best_src_str}, {vat_rate}, {dm_usd}, {pf}, "
                f"'{fta_json}'::jsonb, '{{}}'::jsonb, '{tr_json}'::jsonb, NOW())"
            )

    log(f"  Rows generated: {len(rows):,}")
    log(f"  Stats: MFN best={stats['mfn_only']:,}, MIN best={stats['min_best']:,}, "
        f"AGR best={stats['agr_best']:,}, No rate={stats['no_rate']:,}, "
        f"With remedy={stats['with_remedy']:,}")

    # =========================================================================
    # PHASE E: Batch INSERT into precomputed_landed_costs
    # =========================================================================
    log("Phase E: Inserting into precomputed_landed_costs...")

    insert_batch = 500
    total_inserted = 0
    total_errors = 0

    for i in range(0, len(rows), insert_batch):
        batch = rows[i:i+insert_batch]
        sql = f"""INSERT INTO precomputed_landed_costs
                  (hs6, destination_country, mfn_rate, min_rate, agr_rate,
                   best_rate, best_rate_source, vat_gst_rate, de_minimis_usd,
                   processing_fee_rate, fta_applicable, special_taxes, trade_remedy, last_updated)
                  VALUES {','.join(batch)}
                  ON CONFLICT (hs6, destination_country) DO UPDATE SET
                    mfn_rate = EXCLUDED.mfn_rate,
                    min_rate = EXCLUDED.min_rate,
                    agr_rate = EXCLUDED.agr_rate,
                    best_rate = EXCLUDED.best_rate,
                    best_rate_source = EXCLUDED.best_rate_source,
                    vat_gst_rate = EXCLUDED.vat_gst_rate,
                    de_minimis_usd = EXCLUDED.de_minimis_usd,
                    processing_fee_rate = EXCLUDED.processing_fee_rate,
                    fta_applicable = EXCLUDED.fta_applicable,
                    trade_remedy = EXCLUDED.trade_remedy,
                    last_updated = NOW();"""

        result, err = run_sql(sql, timeout=120)
        if err:
            log(f"  Batch {i//insert_batch+1} error: {err[:150]}")
            # Try smaller batches
            sub_batch = 100
            for j in range(0, len(batch), sub_batch):
                sub = batch[j:j+sub_batch]
                sql2 = f"""INSERT INTO precomputed_landed_costs
                          (hs6, destination_country, mfn_rate, min_rate, agr_rate,
                           best_rate, best_rate_source, vat_gst_rate, de_minimis_usd,
                           processing_fee_rate, fta_applicable, special_taxes, trade_remedy, last_updated)
                          VALUES {','.join(sub)}
                          ON CONFLICT (hs6, destination_country) DO UPDATE SET
                            mfn_rate = EXCLUDED.mfn_rate,
                            min_rate = EXCLUDED.min_rate,
                            agr_rate = EXCLUDED.agr_rate,
                            best_rate = EXCLUDED.best_rate,
                            best_rate_source = EXCLUDED.best_rate_source,
                            vat_gst_rate = EXCLUDED.vat_gst_rate,
                            de_minimis_usd = EXCLUDED.de_minimis_usd,
                            processing_fee_rate = EXCLUDED.processing_fee_rate,
                            fta_applicable = EXCLUDED.fta_applicable,
                            trade_remedy = EXCLUDED.trade_remedy,
                            last_updated = NOW();"""
                r2, e2 = run_sql(sql2, timeout=120)
                if e2:
                    total_errors += len(sub)
                    log(f"    Sub-batch error: {e2[:100]}")
                else:
                    total_inserted += len(sub)
        else:
            total_inserted += len(batch)

        if (i // insert_batch + 1) % 20 == 0 or i + insert_batch >= len(rows):
            elapsed = time.time() - start_time
            pct = (i + insert_batch) / len(rows) * 100
            log(f"  INSERT progress: {total_inserted:,}/{len(rows):,} ({pct:.0f}%) | "
                f"{total_errors} errors | {elapsed:.0f}s elapsed")

    log(f"  Total inserted: {total_inserted:,}, errors: {total_errors}")

    # =========================================================================
    # PHASE F: Verify
    # =========================================================================
    log("Phase F: Verification...")
    cnt, _ = run_sql("SELECT COUNT(*) as cnt FROM precomputed_landed_costs;")
    if cnt:
        log(f"  precomputed_landed_costs: {cnt[0]['cnt']:,} rows")

    # Sample verification
    sample, _ = run_sql("""
        SELECT hs6, destination_country, mfn_rate, min_rate, agr_rate,
               best_rate, best_rate_source, vat_gst_rate, de_minimis_usd
        FROM precomputed_landed_costs
        WHERE best_rate IS NOT NULL
        ORDER BY RANDOM() LIMIT 5;""")
    if sample:
        log("  Sample rows:")
        for r in sample:
            log(f"    {r['hs6']} → {r['destination_country']}: "
                f"best={r['best_rate']}% ({r['best_rate_source']}), "
                f"VAT={r['vat_gst_rate']}%, de_minimis=${r['de_minimis_usd']}")

    # Stats
    stats_sql, _ = run_sql("""
        SELECT
            COUNT(*) as total,
            COUNT(best_rate) as with_rate,
            COUNT(DISTINCT hs6) as unique_hs6,
            COUNT(DISTINCT destination_country) as unique_countries,
            AVG(best_rate) as avg_rate,
            COUNT(CASE WHEN best_rate_source = 'MFN' THEN 1 END) as mfn_count,
            COUNT(CASE WHEN best_rate_source = 'MIN' THEN 1 END) as min_count,
            COUNT(CASE WHEN best_rate_source = 'AGR' THEN 1 END) as agr_count
        FROM precomputed_landed_costs;""")
    if stats_sql:
        s = stats_sql[0]
        log(f"  Total: {s['total']:,} | With rate: {s['with_rate']:,}")
        log(f"  HS6: {s['unique_hs6']} | Countries: {s['unique_countries']}")
        log(f"  Avg best rate: {float(s['avg_rate']):.2f}%" if s['avg_rate'] else "  Avg: N/A")
        log(f"  MFN best: {s['mfn_count']:,} | MIN best: {s['min_count']:,} | AGR best: {s['agr_count']:,}")

    elapsed = time.time() - start_time
    log(f"\nTotal elapsed: {elapsed/60:.1f} minutes")
    log("=" * 70)
    log("PRECOMPUTING COMPLETE!")
    log("=" * 70)

if __name__ == "__main__":
    main()
