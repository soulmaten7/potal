#!/usr/bin/env python3
"""
Convert merged_results.jsonl → CSV files for psql \copy upload.
Splits into 5M-row files. Memory-efficient (streams line by line).

Table: product_hs_mappings
Columns: product_name, category, hs6, confidence, source, metadata, created_at

Usage:
  python3 scripts/jsonl_to_csv_for_copy.py
"""

import json
import csv
import os
import sys
import time

INPUT = "/Volumes/soulmaten/POTAL/wdc-products/v2_results/merged_results.jsonl"
OUTPUT_DIR = "/Volumes/soulmaten/POTAL/wdc-products/v2_results/csv_split"
ROWS_PER_FILE = 5_000_000

COLUMNS = ["product_name", "category", "hs6", "confidence", "source", "metadata", "created_at"]


def main():
    os.makedirs(OUTPUT_DIR, exist_ok=True)

    file_idx = 0
    row_in_file = 0
    total = 0
    errors = 0
    writer = None
    outf = None

    def open_new_file():
        nonlocal file_idx, row_in_file, writer, outf
        if outf:
            outf.close()
        file_idx += 1
        path = os.path.join(OUTPUT_DIR, f"part_{file_idx:02d}.csv")
        outf = open(path, "w", newline="", encoding="utf-8")
        writer = csv.writer(outf, quoting=csv.QUOTE_MINIMAL)
        writer.writerow(COLUMNS)
        row_in_file = 0
        print(f"  Writing {path}...", flush=True)
        return path

    open_new_file()
    start = time.time()

    with open(INPUT, "r", encoding="utf-8") as f:
        for line in f:
            try:
                row = json.loads(line)
            except json.JSONDecodeError:
                errors += 1
                continue

            pn = (row.get("product_name") or "")[:200]
            cat = (row.get("category") or pn)[:200]
            hs6 = row.get("hs6", "")
            conf = row.get("confidence", 0)
            src = row.get("source", "wdc_phase4_v2")
            meta = "{}"
            created = ""  # let DB default to NOW()

            writer.writerow([pn, cat, hs6, conf, src, meta, created])
            total += 1
            row_in_file += 1

            if row_in_file >= ROWS_PER_FILE:
                open_new_file()

            if total % 1_000_000 == 0:
                elapsed = time.time() - start
                rate = total / elapsed
                print(f"  {total:>12,} rows | {rate:,.0f} rows/sec | file {file_idx}", flush=True)

    if outf:
        outf.close()

    elapsed = time.time() - start
    print(f"\nDone: {total:,} rows → {file_idx} files in {elapsed:.0f}s")
    print(f"  Errors: {errors:,}")
    print(f"  Output: {OUTPUT_DIR}/part_*.csv")

    # Generate upload script
    script_path = os.path.join(OUTPUT_DIR, "upload_commands.sh")
    psql_bin = "/opt/homebrew/Cellar/libpq/18.3/bin/psql"
    conn = "postgresql://postgres:potalqwepoi2%40@db.zyurflkhiregundhisky.supabase.co:5432/postgres"

    with open(script_path, "w") as sf:
        sf.write("#!/bin/bash\n")
        sf.write("# WDC Phase 4 v2 — Upload to Supabase via \\copy\n")
        sf.write(f"# Total: {total:,} rows in {file_idx} files\n")
        sf.write(f'# Usage: bash {script_path}\n\n')
        sf.write(f'PSQL="{psql_bin}"\n')
        sf.write(f'CONN="{conn}"\n\n')

        for i in range(1, file_idx + 1):
            csv_path = os.path.join(OUTPUT_DIR, f"part_{i:02d}.csv")
            sf.write(f'echo "Uploading part_{i:02d}.csv..."\n')
            sf.write(f'$PSQL "$CONN" -c "\\copy product_hs_mappings(product_name, category, hs6, confidence, source, metadata, created_at) ')
            sf.write(f"FROM '{csv_path}' WITH (FORMAT csv, HEADER true, NULL '')\"\n")
            sf.write(f'echo "  part_{i:02d}.csv done ($?)"\n')
            if i < file_idx:
                sf.write("sleep 10\n")
            sf.write("\n")

        sf.write(f'\necho "All done!"\n')
        sf.write(f'$PSQL "$CONN" -c "SELECT count(*) FROM product_hs_mappings;"\n')

    os.chmod(script_path, 0o755)
    print(f"  Upload script: {script_path}")


if __name__ == "__main__":
    main()
