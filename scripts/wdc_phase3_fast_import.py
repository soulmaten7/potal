#!/usr/bin/env python3
"""
WDC Phase 3 Fast Import: Insert remaining product type mappings.
No ON CONFLICT - just direct batch inserts, skip already-existing names.
"""
import json
import subprocess
import time
import sys
import os

LOG_FILE = "/Users/maegbug/portal/wdc_phase3.log"
SUPABASE_PROJECT = "zyurflkhiregundhisky"
SUPABASE_TOKEN = os.environ.get("SUPABASE_MGMT_TOKEN", "")

def log(msg):
    ts = time.strftime("%Y-%m-%d %H:%M:%S")
    line = f"[{ts}] {msg}"
    print(line, flush=True)
    with open(LOG_FILE, "a") as f:
        f.write(line + "\n")

def run_sql(query, retries=3):
    for attempt in range(retries):
        try:
            result = subprocess.run(
                ["curl", "-s", "-X", "POST",
                 f"https://api.supabase.com/v1/projects/{SUPABASE_PROJECT}/database/query",
                 "-H", f"Authorization: Bearer {SUPABASE_TOKEN}",
                 "-H", "Content-Type: application/json",
                 "-d", json.dumps({"query": query})],
                capture_output=True, text=True, timeout=120
            )
            resp = result.stdout
            if '"message"' in resp and 'ERROR' in resp:
                if attempt < retries - 1:
                    time.sleep(1)
                    continue
                return None, resp[:200]
            return json.loads(resp), None
        except Exception as e:
            if attempt < retries - 1:
                time.sleep(1)
                continue
            return None, str(e)
    return None, "retries exceeded"

# Load the full mapping from the other script
sys.path.insert(0, '/Users/maegbug/portal/scripts')
from wdc_phase3_map_and_import import PRODUCT_HS6_MAP

def main():
    log("Fast Import: Remaining product type mappings")

    # Get existing names
    data, err = run_sql("SELECT product_name FROM product_hs_mappings;")
    if err:
        log(f"Error: {err}")
        return
    existing = {r['product_name'].lower().strip() for r in data}
    log(f"Existing mappings: {len(existing)}")

    # Get existing vector names
    vdata, verr = run_sql("SELECT product_name FROM hs_classification_vectors;")
    existing_vec = set()
    if vdata:
        existing_vec = {r['product_name'].lower().strip() for r in vdata}
    log(f"Existing vectors: {len(existing_vec)}")

    # Filter new
    new_mappings = []
    for pn, hs6 in PRODUCT_HS6_MAP.items():
        if hs6 == "999999":
            continue
        if pn.lower().strip() in existing:
            continue
        new_mappings.append((pn, hs6))

    new_vectors = []
    for pn, hs6 in PRODUCT_HS6_MAP.items():
        if hs6 == "999999":
            continue
        if pn.lower().strip() in existing_vec:
            continue
        new_vectors.append((pn, hs6))

    log(f"New mappings to insert: {len(new_mappings)}")
    log(f"New vectors to insert: {len(new_vectors)}")

    # Insert mappings in batches of 50 (direct INSERT, no ON CONFLICT)
    batch_size = 50
    inserted = 0
    errors = 0
    for i in range(0, len(new_mappings), batch_size):
        batch = new_mappings[i:i+batch_size]
        values = []
        for pn, hs6 in batch:
            pn_esc = pn.replace("'", "''")
            values.append(f"('{pn_esc}', '{pn_esc}', '{hs6}', 0.95, 'wdc_phase3_product_type', '{{}}'::jsonb, NOW())")
        sql = f"INSERT INTO product_hs_mappings (product_name, category, hs6, confidence, source, metadata, created_at) VALUES {','.join(values)};"
        result, err = run_sql(sql)
        if err:
            log(f"  Batch {i//batch_size+1} error: {err}")
            # Try individual
            for pn, hs6 in batch:
                pn_esc = pn.replace("'", "''")
                single = f"INSERT INTO product_hs_mappings (product_name, category, hs6, confidence, source, metadata, created_at) VALUES ('{pn_esc}', '{pn_esc}', '{hs6}', 0.95, 'wdc_phase3_product_type', '{{}}'::jsonb, NOW());"
                r, e = run_sql(single)
                if e:
                    errors += 1
                else:
                    inserted += 1
        else:
            inserted += len(batch)
        if (i // batch_size + 1) % 5 == 0 or i + batch_size >= len(new_mappings):
            log(f"  Mappings progress: {inserted}/{len(new_mappings)} inserted, {errors} errors")

    log(f"Mappings done: {inserted} inserted, {errors} errors")

    # Insert vectors in batches
    vec_inserted = 0
    vec_errors = 0
    for i in range(0, len(new_vectors), batch_size):
        batch = new_vectors[i:i+batch_size]
        values = []
        for pn, hs6 in batch:
            pn_esc = pn.replace("'", "''")
            values.append(f"('{pn_esc}', '{pn_esc}', '{hs6}', 'wdc_phase3_product_type', 0.95, NOW(), NOW())")
        sql = f"INSERT INTO hs_classification_vectors (product_name, category, hs_code, source, confidence, created_at, updated_at) VALUES {','.join(values)};"
        result, err = run_sql(sql)
        if err:
            for pn, hs6 in batch:
                pn_esc = pn.replace("'", "''")
                single = f"INSERT INTO hs_classification_vectors (product_name, category, hs_code, source, confidence, created_at, updated_at) VALUES ('{pn_esc}', '{pn_esc}', '{hs6}', 'wdc_phase3_product_type', 0.95, NOW(), NOW());"
                r, e = run_sql(single)
                if e:
                    vec_errors += 1
                else:
                    vec_inserted += 1
        else:
            vec_inserted += len(batch)
        if (i // batch_size + 1) % 5 == 0 or i + batch_size >= len(new_vectors):
            log(f"  Vectors progress: {vec_inserted}/{len(new_vectors)} inserted, {vec_errors} errors")

    log(f"Vectors done: {vec_inserted} inserted, {vec_errors} errors")

    # Final counts
    cnt1, _ = run_sql("SELECT COUNT(*) as cnt FROM product_hs_mappings;")
    cnt2, _ = run_sql("SELECT COUNT(*) as cnt FROM hs_classification_vectors;")
    log(f"Final product_hs_mappings: {cnt1[0]['cnt'] if cnt1 else '?'}")
    log(f"Final hs_classification_vectors: {cnt2[0]['cnt'] if cnt2 else '?'}")
    log("Fast import complete!")

if __name__ == "__main__":
    main()
