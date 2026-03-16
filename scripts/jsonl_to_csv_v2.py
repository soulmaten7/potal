#!/usr/bin/env python3
"""
Convert merged_results.jsonl → CSV (no created_at column).
Splits into 500K-row files for psql \copy.
"""

import json
import csv
import os
import time

INPUT = "/Volumes/soulmaten/POTAL/wdc-products/v2_results/merged_results.jsonl"
OUTPUT_DIR = "/Volumes/soulmaten/POTAL/wdc-products/v2_results/upload_chunks"
ROWS_PER_FILE = 500_000

COLUMNS = ["product_name", "category", "hs6", "confidence", "source", "metadata"]


def main():
    os.makedirs(OUTPUT_DIR, exist_ok=True)

    file_idx = 0
    row_in_file = 0
    total = 0
    writer = None
    outf = None

    def open_new_file():
        nonlocal file_idx, row_in_file, writer, outf
        if outf:
            outf.close()
        file_idx += 1
        path = os.path.join(OUTPUT_DIR, f"chunk_{file_idx:03d}.csv")
        outf = open(path, "w", newline="", encoding="utf-8")
        writer = csv.writer(outf, quoting=csv.QUOTE_ALL)
        writer.writerow(COLUMNS)
        row_in_file = 0
        return path

    open_new_file()
    start = time.time()

    with open(INPUT, "r", encoding="utf-8") as f:
        for line in f:
            try:
                row = json.loads(line)
            except json.JSONDecodeError:
                continue

            pn = (row.get("product_name") or "")[:200]
            cat = (row.get("category") or pn)[:200]
            hs6 = row.get("hs6", "")
            conf = row.get("confidence", 0)
            src = row.get("source", "wdc_phase4_v2")
            meta = "{}"

            writer.writerow([pn, cat, hs6, conf, src, meta])
            total += 1
            row_in_file += 1

            if row_in_file >= ROWS_PER_FILE:
                open_new_file()

            if total % 5_000_000 == 0:
                elapsed = time.time() - start
                print(f"  {total:>12,} rows | {elapsed:.0f}s | file {file_idx}", flush=True)

    if outf:
        outf.close()

    elapsed = time.time() - start
    print(f"\nDone: {total:,} rows → {file_idx} files in {elapsed:.0f}s")
    print(f"Output: {OUTPUT_DIR}/chunk_*.csv")


if __name__ == "__main__":
    main()
