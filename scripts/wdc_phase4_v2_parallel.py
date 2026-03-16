#!/usr/bin/env python3
"""
WDC Phase 4 v2: Parallel Local-Memory Product → HS Code Mapping
================================================================
Goal: Replace v1 (500/s, DB-bound) with local-only matching (no per-row DB calls).

Architecture:
  Step 1: Load category→HS6 mapping from local JSON (148 entries, $0)
  Step 2: Calculate byte offsets to split 302GB JSONL into 8 chunks
  Step 3: 8 multiprocessing workers, each reads its byte range, matches locally
  Step 4: Merge per-worker results, deduplicate
  Step 5: Bulk upload merged results to Supabase (batched curl)
  Step 6: Progress logging throughout

Usage:
  # Test with first 1M lines:
  python3 scripts/wdc_phase4_v2_parallel.py --test

  # Full run:
  python3 scripts/wdc_phase4_v2_parallel.py

  # Resume (skips already-uploaded batches):
  python3 scripts/wdc_phase4_v2_parallel.py --resume

Environment:
  SUPABASE_MGMT_TOKEN (for Step 5 upload only)
"""

import json
import os
import sys
import time
import re
import signal
import subprocess
import multiprocessing as mp
from collections import defaultdict
from datetime import datetime

# ─── Configuration ─────────────────────────────────────────────
JSONL_PATH = "/Volumes/soulmaten/POTAL/wdc-products/extracted/products_detailed.jsonl"
CATEGORY_MAP_PATH = os.path.join(os.path.dirname(os.path.abspath(__file__)), "..", "data", "wdc_category_hs_map.json")
OUTPUT_DIR = "/Volumes/soulmaten/POTAL/wdc-products/v2_results"
PROGRESS_FILE = os.path.join(OUTPUT_DIR, "v2_progress.json")
LOG_FILE = os.path.join(OUTPUT_DIR, "v2.log")

NUM_WORKERS = 2           # concurrent workers (low I/O pressure)
CHUNK_SIZE_GB = 19        # each chunk ~19GB, processed sequentially
MAX_NAME_LENGTH = 200
BATCH_INSERT_SIZE = 500
TEST_LINES = 1_000_000  # --test mode

SUPABASE_PROJECT = "zyurflkhiregundhisky"
SUPABASE_TOKEN = os.environ.get("SUPABASE_MGMT_TOKEN", "sbp_c96b42dce1f4204ae9f03b776ea42087a8dd6b6a")
MGMT_URL = f"https://api.supabase.com/v1/projects/{SUPABASE_PROJECT}/database/query"


# ─── Logging ───────────────────────────────────────────────────
def log(msg, log_file=None):
    ts = time.strftime("%Y-%m-%d %H:%M:%S")
    line = f"[{ts}] {msg}"
    print(line, flush=True)
    lf = log_file or LOG_FILE
    try:
        with open(lf, "a") as f:
            f.write(line + "\n")
    except:
        pass


# ─── Step 1: Build Local Matching Data ────────────────────────
def build_matcher():
    """Build comprehensive local matcher from category→HS6 map.
    Returns dict with multiple lookup structures.
    """
    # Load base category map
    with open(CATEGORY_MAP_PATH) as f:
        cat_map = json.load(f)  # {"accessories": "420292", ...}

    # Build expanded lookup structures
    exact_category = {}      # exact category string → hs6
    keyword_to_hs6 = {}      # single keyword → hs6 (for name matching)
    multi_word_to_hs6 = {}   # multi-word phrases → hs6

    for cat, hs6 in cat_map.items():
        cat_lower = cat.lower().strip()
        exact_category[cat_lower] = hs6

        # Also store plural/singular variants
        if cat_lower.endswith('s') and len(cat_lower) > 3:
            exact_category[cat_lower[:-1]] = hs6  # shoes → shoe
        elif cat_lower.endswith('es') and len(cat_lower) > 4:
            exact_category[cat_lower[:-2]] = hs6  # dresses → dress
        else:
            exact_category[cat_lower + 's'] = hs6  # shirt → shirts

        # Multi-word categories go into phrase matcher
        if ' ' in cat_lower:
            multi_word_to_hs6[cat_lower] = hs6
        else:
            keyword_to_hs6[cat_lower] = hs6
            # Add common variants
            if cat_lower.endswith('s') and len(cat_lower) > 3:
                keyword_to_hs6[cat_lower[:-1]] = hs6
            elif not cat_lower.endswith('s'):
                keyword_to_hs6[cat_lower + 's'] = hs6

    return {
        "exact_category": exact_category,
        "keyword_to_hs6": keyword_to_hs6,
        "multi_word_to_hs6": multi_word_to_hs6,
    }


def match_product(matcher, name, category):
    """Match a product locally. Returns (hs6, confidence, tier) or (None, 0, None).

    Tier 1: Exact category match (0.95 confidence)
    Tier 2: Category segment match for "Foo > Bar > Baz" paths (0.90)
    Tier 3: Keyword in product name (0.85)
    Tier 4: Multi-word phrase in name+category (0.80)
    """
    exact_cat = matcher["exact_category"]
    kw_map = matcher["keyword_to_hs6"]
    mw_map = matcher["multi_word_to_hs6"]

    cat_lower = (category or "").lower().strip()
    name_lower = (name or "").lower().strip()

    # Tier 1: Exact category match
    if cat_lower and cat_lower in exact_cat:
        return exact_cat[cat_lower], 0.95, "tier1_exact_cat"

    # Tier 2: Category segment match (for paths like "Electronics > Audio > Headphones")
    if cat_lower:
        # Split by common delimiters
        for sep in [" > ", " / ", " | ", " - ", " >> ", " → "]:
            if sep in cat_lower:
                segments = [s.strip() for s in cat_lower.split(sep)]
                # Check from most specific (last) to least specific (first)
                for seg in reversed(segments):
                    if seg in exact_cat:
                        return exact_cat[seg], 0.90, "tier2_cat_segment"
                break

        # Single words in category
        for word in cat_lower.split():
            if len(word) >= 4 and word in exact_cat:
                return exact_cat[word], 0.88, "tier2_cat_word"

    # Tier 3: Keyword match in product name
    # Check each known keyword against the product name
    best_hs6 = None
    best_len = 0

    for kw, hs6 in kw_map.items():
        if len(kw) >= 4 and kw in name_lower and len(kw) > best_len:
            best_hs6 = hs6
            best_len = len(kw)

    if best_hs6 and best_len >= 4:
        return best_hs6, 0.85, "tier3_name_keyword"

    # Tier 4: Multi-word phrase match in combined text
    combined = f"{name_lower} {cat_lower}"
    for phrase, hs6 in mw_map.items():
        if phrase in combined:
            return hs6, 0.80, "tier4_phrase"

    return None, 0, None


# ─── Step 2: Calculate Byte Offsets ───────────────────────────
def calculate_offsets(filepath, num_chunks, max_lines=None):
    """Calculate byte offsets to split file into num_chunks pieces.
    Each chunk starts at a line boundary.
    If max_lines is set, only process that many lines from the start.
    """
    file_size = os.path.getsize(filepath)

    if max_lines:
        # Find the byte offset after max_lines lines
        with open(filepath, 'rb') as f:
            count = 0
            while count < max_lines:
                line = f.readline()
                if not line:
                    break
                count += 1
            file_size = f.tell()
        log(f"Test mode: first {max_lines:,} lines = {file_size:,} bytes ({file_size/1024**2:.0f} MB)")

    chunk_size = file_size // num_chunks
    offsets = []

    with open(filepath, 'rb') as f:
        for i in range(num_chunks):
            if i == 0:
                start = 0
            else:
                # Seek to approximate position, then find next line boundary
                f.seek(i * chunk_size)
                f.readline()  # skip partial line
                start = f.tell()

            if i == num_chunks - 1:
                end = file_size
            else:
                f.seek((i + 1) * chunk_size)
                f.readline()  # skip partial line
                end = f.tell()

            if start < end:
                offsets.append((start, end))

    log(f"Calculated {len(offsets)} chunks from {file_size:,} bytes")
    for i, (s, e) in enumerate(offsets):
        log(f"  Worker {i}: {s:,} - {e:,} ({(e-s)/1024**3:.2f} GB)")

    return offsets


# ─── Step 3: Worker Process ──────────────────────────────────
def worker_process(args):
    """Single worker: read byte range, match locally, write results."""
    worker_id, filepath, start_byte, end_byte, matcher_data, output_dir = args

    # Rebuild matcher in this process
    matcher = matcher_data

    output_file = os.path.join(output_dir, f"worker_{worker_id:02d}.jsonl")
    stats = {
        "worker_id": worker_id,
        "lines_read": 0,
        "matched": 0,
        "unmatched": 0,
        "skipped": 0,
        "errors": 0,
        "tier_counts": defaultdict(int),
    }

    seen_names = set()
    results_buffer = []
    FLUSH_SIZE = 50_000

    def flush_results():
        nonlocal results_buffer
        if not results_buffer:
            return
        with open(output_file, "a") as out:
            for r in results_buffer:
                out.write(json.dumps(r, ensure_ascii=False) + "\n")
        results_buffer = []

    try:
        with open(filepath, 'rb') as f:
            f.seek(start_byte)
            pos = start_byte

            while pos < end_byte:
                raw_line = f.readline()
                if not raw_line:
                    break
                pos = f.tell()
                stats["lines_read"] += 1

                # Decode
                try:
                    line = raw_line.decode('utf-8', errors='replace').strip()
                    if not line:
                        stats["skipped"] += 1
                        continue
                    product = json.loads(line)
                except (json.JSONDecodeError, UnicodeDecodeError):
                    stats["skipped"] += 1
                    continue

                name = (product.get("name") or "").strip()
                category = (product.get("category") or "").strip()

                # Validate
                if not name or len(name) < 3 or len(name) > 500:
                    stats["skipped"] += 1
                    continue

                # Deduplicate within worker
                name_key = name.lower()[:MAX_NAME_LENGTH]
                if name_key in seen_names:
                    stats["skipped"] += 1
                    continue
                seen_names.add(name_key)

                # Memory management
                if len(seen_names) > 10_000_000:
                    seen_names = set(list(seen_names)[-5_000_000:])

                # Match
                hs6, confidence, tier = match_product(matcher, name, category)
                if hs6:
                    stats["matched"] += 1
                    stats["tier_counts"][tier] += 1
                    results_buffer.append({
                        "product_name": name[:MAX_NAME_LENGTH],
                        "category": (category or name)[:MAX_NAME_LENGTH],
                        "hs6": hs6,
                        "confidence": confidence,
                        "source": f"wdc_phase4_v2_{tier}",
                    })
                else:
                    stats["unmatched"] += 1

                # Flush periodically
                if len(results_buffer) >= FLUSH_SIZE:
                    flush_results()

                # Progress log every 500K lines
                if stats["lines_read"] % 500_000 == 0:
                    match_pct = stats["matched"] / stats["lines_read"] * 100 if stats["lines_read"] else 0
                    print(f"  [W{worker_id}] {stats['lines_read']:>10,} lines | "
                          f"matched {stats['matched']:,} ({match_pct:.1f}%) | "
                          f"skip {stats['skipped']:,}", flush=True)

    except Exception as e:
        stats["errors"] += 1
        print(f"  [W{worker_id}] ERROR: {e}", flush=True)

    # Final flush
    flush_results()

    # Write stats
    stats_file = os.path.join(output_dir, f"worker_{worker_id:02d}_stats.json")
    stats["tier_counts"] = dict(stats["tier_counts"])
    with open(stats_file, "w") as f:
        json.dump(stats, f, indent=2)

    total = stats["lines_read"]
    match_pct = stats["matched"] / total * 100 if total else 0
    print(f"  [W{worker_id}] DONE: {total:,} lines, {stats['matched']:,} matched ({match_pct:.1f}%)", flush=True)

    return stats


# ─── Step 4: Merge Results ────────────────────────────────────
def merge_results(output_dir, num_workers):
    """Merge per-worker results into single deduplicated file."""
    log("Step 4: Merging worker results...")

    merged_file = os.path.join(output_dir, "merged_results.jsonl")
    seen = set()
    total_in = 0
    total_out = 0

    with open(merged_file, "w") as out:
        for w in range(num_workers):
            worker_file = os.path.join(output_dir, f"worker_{w:02d}.jsonl")
            if not os.path.exists(worker_file):
                continue

            with open(worker_file) as f:
                for line in f:
                    total_in += 1
                    try:
                        row = json.loads(line)
                        key = row["product_name"].lower()[:MAX_NAME_LENGTH]
                        if key not in seen:
                            seen.add(key)
                            out.write(line)
                            total_out += 1
                    except:
                        pass

    log(f"  Merged: {total_in:,} → {total_out:,} (deduped {total_in - total_out:,})")
    return merged_file, total_out


# ─── Step 5: Upload to Supabase ───────────────────────────────
def upload_to_supabase(merged_file, total_rows, resume_from=0):
    """Bulk upload merged results to Supabase via Management API."""
    log(f"Step 5: Uploading {total_rows:,} rows to Supabase...")

    if not SUPABASE_TOKEN:
        log("  WARNING: No SUPABASE_MGMT_TOKEN, skipping upload. Set it and use --upload.")
        return 0

    uploaded = 0
    errors = 0
    batch = []
    line_num = 0

    with open(merged_file) as f:
        for line in f:
            line_num += 1
            if line_num <= resume_from:
                uploaded += 1
                continue

            try:
                row = json.loads(line)
            except:
                continue

            pn = row["product_name"].replace("'", "''")[:MAX_NAME_LENGTH]
            cat = row["category"].replace("'", "''")[:MAX_NAME_LENGTH]
            hs6 = row["hs6"]
            conf = row["confidence"]
            src = row["source"]

            batch.append(
                f"('{pn}', '{cat}', '{hs6}', {conf}, '{src}', '{{}}'::jsonb, NOW())"
            )

            if len(batch) >= BATCH_INSERT_SIZE:
                ok = _insert_batch(batch)
                if ok:
                    uploaded += len(batch)
                else:
                    errors += len(batch)
                batch = []

                if uploaded % 10_000 == 0:
                    log(f"  Uploaded: {uploaded:,}/{total_rows:,} ({uploaded/total_rows*100:.1f}%) | errors: {errors:,}")

    # Flush remaining
    if batch:
        ok = _insert_batch(batch)
        if ok:
            uploaded += len(batch)
        else:
            errors += len(batch)

    log(f"  Upload complete: {uploaded:,} rows, {errors:,} errors")
    return uploaded


def _insert_batch(values):
    """Insert a batch of value tuples via Management API."""
    sql = (
        "INSERT INTO product_hs_mappings "
        "(product_name, category, hs6, confidence, source, metadata, created_at) "
        f"VALUES {','.join(values)} "
        "ON CONFLICT (lower(product_name)) DO NOTHING;"
    )

    try:
        result = subprocess.run(
            ["curl", "-s", "-X", "POST", MGMT_URL,
             "-H", f"Authorization: Bearer {SUPABASE_TOKEN}",
             "-H", "Content-Type: application/json",
             "-d", json.dumps({"query": sql})],
            capture_output=True, text=True, timeout=120
        )
        if "ERROR" in result.stdout:
            return False
        return True
    except Exception:
        return False


# ─── Step 6: Summary ──────────────────────────────────────────
def print_summary(all_stats, merge_total, upload_total, elapsed):
    """Print final summary."""
    log("=" * 70)
    log("WDC Phase 4 v2 — FINAL SUMMARY")
    log("=" * 70)

    total_lines = sum(s["lines_read"] for s in all_stats)
    total_matched = sum(s["matched"] for s in all_stats)
    total_skipped = sum(s["skipped"] for s in all_stats)
    total_unmatched = sum(s["unmatched"] for s in all_stats)

    # Aggregate tier counts
    tier_totals = defaultdict(int)
    for s in all_stats:
        for tier, count in s.get("tier_counts", {}).items():
            tier_totals[tier] += count

    log(f"  Total lines read:    {total_lines:,}")
    log(f"  Total matched:       {total_matched:,} ({total_matched/total_lines*100:.1f}%)" if total_lines else "")
    log(f"  Total unmatched:     {total_unmatched:,}")
    log(f"  Total skipped:       {total_skipped:,}")
    log(f"  After dedup:         {merge_total:,}")
    log(f"  Uploaded to DB:      {upload_total:,}")
    log("")
    log("  Tier breakdown:")
    for tier, count in sorted(tier_totals.items()):
        log(f"    {tier}: {count:,}")
    log("")

    rate = total_lines / elapsed if elapsed > 0 else 0
    log(f"  Elapsed: {elapsed:.0f}s ({elapsed/60:.1f}m)")
    log(f"  Speed: {rate:,.0f} lines/sec")
    log(f"  Workers per chunk: {NUM_WORKERS}")
    log("=" * 70)


# ─── Main ─────────────────────────────────────────────────────
def main():
    test_mode = "--test" in sys.argv
    upload_only = "--upload" in sys.argv
    no_upload = "--no-upload" in sys.argv
    resume = "--resume" in sys.argv

    os.makedirs(OUTPUT_DIR, exist_ok=True)

    log("=" * 70)
    log("WDC Phase 4 v2: Parallel Local-Memory Matching")
    log(f"  Mode: {'TEST (1M lines)' if test_mode else 'FULL RUN'}")
    log(f"  Workers: {NUM_WORKERS}")
    log(f"  JSONL: {JSONL_PATH}")
    log(f"  Output: {OUTPUT_DIR}")
    log("=" * 70)

    # Validate
    if not os.path.exists(JSONL_PATH):
        log(f"ERROR: JSONL not found: {JSONL_PATH}")
        sys.exit(1)
    if not os.path.exists(CATEGORY_MAP_PATH):
        log(f"ERROR: Category map not found: {CATEGORY_MAP_PATH}")
        sys.exit(1)

    start_time = time.time()

    # Step 1: Build matcher
    log("Step 1: Loading local category→HS6 mapping...")
    matcher = build_matcher()
    log(f"  exact_category: {len(matcher['exact_category'])} entries")
    log(f"  keyword_to_hs6: {len(matcher['keyword_to_hs6'])} entries")
    log(f"  multi_word_to_hs6: {len(matcher['multi_word_to_hs6'])} entries")

    if upload_only:
        merged_file = os.path.join(OUTPUT_DIR, "merged_results.jsonl")
        if not os.path.exists(merged_file):
            log("ERROR: No merged_results.jsonl found. Run matching first.")
            sys.exit(1)
        total = sum(1 for _ in open(merged_file))
        resume_from = 0
        if resume:
            # Load progress
            if os.path.exists(PROGRESS_FILE):
                with open(PROGRESS_FILE) as f:
                    prog = json.load(f)
                resume_from = prog.get("uploaded", 0)
                log(f"  Resuming upload from row {resume_from:,}")
        uploaded = upload_to_supabase(merged_file, total, resume_from)
        # Save progress
        with open(PROGRESS_FILE, "w") as f:
            json.dump({"uploaded": uploaded, "total": total}, f)
        log(f"Upload complete: {uploaded:,}/{total:,}")
        return

    # Step 2: Calculate byte offsets — split into ~19GB chunks
    log("\nStep 2: Calculating byte offsets (~19GB chunks)...")
    file_size = os.path.getsize(JSONL_PATH)
    if test_mode:
        # For test mode, read first 1M lines
        with open(JSONL_PATH, 'rb') as f:
            count = 0
            while count < TEST_LINES:
                if not f.readline():
                    break
                count += 1
            file_size = f.tell()
        log(f"  Test mode: {file_size:,} bytes")

    chunk_bytes = CHUNK_SIZE_GB * 1024 * 1024 * 1024
    num_chunks = max(1, file_size // chunk_bytes + (1 if file_size % chunk_bytes else 0))

    # Calculate all chunk boundaries on line breaks
    offsets = []
    with open(JSONL_PATH, 'rb') as f:
        for i in range(num_chunks):
            if i == 0:
                start = 0
            else:
                f.seek(i * chunk_bytes)
                f.readline()
                start = f.tell()

            if i == num_chunks - 1:
                end = file_size
            else:
                f.seek((i + 1) * chunk_bytes)
                f.readline()
                end = f.tell()

            if start < end:
                offsets.append((start, end))

    log(f"  {len(offsets)} chunks of ~{CHUNK_SIZE_GB}GB each")
    for i, (s, e) in enumerate(offsets):
        log(f"    Chunk {i}: {s:,} - {e:,} ({(e-s)/1024**3:.1f} GB)")

    # Load resume state — which chunks are already done
    chunk_progress_file = os.path.join(OUTPUT_DIR, "chunk_progress.json")
    done_chunks = set()
    if resume and os.path.exists(chunk_progress_file):
        with open(chunk_progress_file) as f:
            done_chunks = set(json.load(f).get("done_chunks", []))
        log(f"  Resuming: {len(done_chunks)} chunks already done")

    # Step 3: Process chunks sequentially, each with NUM_WORKERS workers
    all_stats = []
    global_worker_id = 0

    for chunk_idx, (chunk_start, chunk_end) in enumerate(offsets):
        if chunk_idx in done_chunks:
            log(f"\n  [Chunk {chunk_idx}/{len(offsets)-1}] Already done, skipping")
            continue

        chunk_size = chunk_end - chunk_start
        log(f"\n  [Chunk {chunk_idx}/{len(offsets)-1}] {chunk_size/1024**3:.1f} GB — "
            f"splitting into {NUM_WORKERS} workers...")

        # Split this chunk into NUM_WORKERS sub-ranges
        sub_size = chunk_size // NUM_WORKERS
        sub_offsets = []
        with open(JSONL_PATH, 'rb') as f:
            for w in range(NUM_WORKERS):
                if w == 0:
                    s = chunk_start
                else:
                    f.seek(chunk_start + w * sub_size)
                    f.readline()
                    s = f.tell()

                if w == NUM_WORKERS - 1:
                    e = chunk_end
                else:
                    f.seek(chunk_start + (w + 1) * sub_size)
                    f.readline()
                    e = f.tell()

                if s < e:
                    sub_offsets.append((s, e))

        worker_args = [
            (global_worker_id + w, JSONL_PATH, s, e, matcher, OUTPUT_DIR)
            for w, (s, e) in enumerate(sub_offsets)
        ]
        global_worker_id += len(sub_offsets)

        with mp.Pool(processes=NUM_WORKERS) as pool:
            chunk_stats = pool.map(worker_process, worker_args)

        all_stats.extend(chunk_stats)

        # Mark chunk as done
        done_chunks.add(chunk_idx)
        with open(chunk_progress_file, "w") as f:
            json.dump({"done_chunks": list(done_chunks)}, f)

        chunk_matched = sum(s["matched"] for s in chunk_stats)
        chunk_lines = sum(s["lines_read"] for s in chunk_stats)
        log(f"  [Chunk {chunk_idx}] Done: {chunk_lines:,} lines, {chunk_matched:,} matched")

    match_time = time.time() - start_time
    log(f"\nAll chunks complete in {match_time:.0f}s ({match_time/60:.1f}m, {match_time/3600:.1f}h)")

    # Step 4: Merge all worker files
    merged_file, merge_total = merge_results(OUTPUT_DIR, global_worker_id)

    # Step 5: Upload (skip if --test or --no-upload)
    upload_total = 0
    if not test_mode and not no_upload:
        upload_total = upload_to_supabase(merged_file, merge_total)
    else:
        log("Step 5: Skipped upload. Use --upload to upload later.")

    # Step 6: Summary
    elapsed = time.time() - start_time
    print_summary(all_stats, merge_total, upload_total, elapsed)

    # Save progress
    with open(PROGRESS_FILE, "w") as f:
        json.dump({
            "mode": "test" if test_mode else "full",
            "total_lines": sum(s["lines_read"] for s in all_stats),
            "total_matched": sum(s["matched"] for s in all_stats),
            "merge_total": merge_total,
            "uploaded": upload_total,
            "elapsed_seconds": elapsed,
            "completed_at": datetime.now().isoformat(),
        }, f, indent=2)


if __name__ == "__main__":
    main()
