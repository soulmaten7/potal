#!/usr/bin/env python3
"""
WDC Phase 4: Bulk Product → HS Code Mapping
============================================
Goal: product_hs_mappings 8,389 → 500M+

Input:  /Volumes/soulmaten/POTAL/wdc-products/extracted/products_detailed.jsonl
        (324GB, ~1.76B products, format: {"name", "category", "source"})

Pipeline:
  Tier 1 (free): Match against existing 8,389 product_hs_mappings (category/name keyword)
  Tier 2 (free): Match against hs_description_keywords 25,484 entries (text match)
  Tier 3 (cheap): Groq llama3 API call for unmatched → result cached for future Tier 1

Output: INSERT into product_hs_mappings (ON CONFLICT DO NOTHING)

Usage:
  export SUPABASE_MGMT_TOKEN=...
  export GROQ_API_KEY=...
  nohup python3 scripts/wdc_phase4_bulk_mapping.py > /dev/null 2>&1 &
  tail -f wdc_phase4.log

Resume: Automatically resumes from last processed line via progress.json
"""

import json
import os
import sys
import time
import re
import subprocess
import urllib.request
import urllib.error
from collections import defaultdict
from datetime import datetime, timedelta

# ─── Configuration ─────────────────────────────────────────────
JSONL_PATH = "/Volumes/soulmaten/POTAL/wdc-products/extracted/products_detailed.jsonl"
PROGRESS_FILE = "/Users/maegbug/potal/wdc_phase4_progress.json"
LOG_FILE = "/Users/maegbug/potal/wdc_phase4.log"

SUPABASE_PROJECT = "zyurflkhiregundhisky"
SUPABASE_TOKEN = os.environ.get("SUPABASE_MGMT_TOKEN", "")
GROQ_API_KEY = os.environ.get("GROQ_API_KEY", "")

# Supabase REST API for batch inserts (faster than Management API)
SUPABASE_URL = os.environ.get("NEXT_PUBLIC_SUPABASE_URL", "https://zyurflkhiregundhisky.supabase.co")
SUPABASE_SERVICE_KEY = os.environ.get("SUPABASE_SERVICE_ROLE_KEY", "")

# Management API for SQL queries
MGMT_URL = f"https://api.supabase.com/v1/projects/{SUPABASE_PROJECT}/database/query"

# Tuning
BATCH_INSERT_SIZE = 500        # rows per INSERT batch
STATS_INTERVAL = 10_000        # print stats every N products
GROQ_BATCH_SIZE = 10           # products per Groq API call
GROQ_RPM_LIMIT = 28           # stay under 30 RPM
GROQ_BACKOFF_BASE = 2.0       # exponential backoff base seconds
GROQ_MAX_RETRIES = 5
MAX_NAME_LENGTH = 200          # truncate product names longer than this


# ─── Logging ───────────────────────────────────────────────────
def log(msg):
    ts = time.strftime("%Y-%m-%d %H:%M:%S")
    line = f"[{ts}] {msg}"
    print(line, flush=True)
    with open(LOG_FILE, "a") as f:
        f.write(line + "\n")


# ─── Progress Management ──────────────────────────────────────
def load_progress():
    if os.path.exists(PROGRESS_FILE):
        with open(PROGRESS_FILE) as f:
            return json.load(f)
    return {
        "lines_processed": 0,
        "tier1_hits": 0,
        "tier2_hits": 0,
        "tier3_hits": 0,
        "tier3_misses": 0,
        "skipped": 0,
        "inserted": 0,
        "errors": 0,
        "started_at": datetime.now().isoformat(),
        "last_updated": datetime.now().isoformat(),
    }


def save_progress(progress):
    progress["last_updated"] = datetime.now().isoformat()
    with open(PROGRESS_FILE, "w") as f:
        json.dump(progress, f, indent=2)


# ─── Supabase Management API ──────────────────────────────────
def run_sql(query, retries=3):
    """Execute SQL via Supabase Management API."""
    for attempt in range(retries):
        try:
            result = subprocess.run(
                ["curl", "-s", "-X", "POST", MGMT_URL,
                 "-H", f"Authorization: Bearer {SUPABASE_TOKEN}",
                 "-H", "Content-Type: application/json",
                 "-d", json.dumps({"query": query})],
                capture_output=True, text=True, timeout=120
            )
            resp = result.stdout
            if '"message"' in resp and 'ERROR' in resp:
                if attempt < retries - 1:
                    time.sleep(2)
                    continue
                return None, resp[:300]
            return json.loads(resp), None
        except Exception as e:
            if attempt < retries - 1:
                time.sleep(2)
                continue
            return None, str(e)
    return None, "retries exceeded"


def batch_insert_mappings(rows):
    """Insert batch into product_hs_mappings via Management API SQL.
    rows: list of (product_name, category, hs6, confidence, source)
    Returns (inserted_count, error_msg)
    """
    if not rows:
        return 0, None

    values = []
    for pn, cat, hs6, conf, src in rows:
        pn_esc = pn.replace("'", "''")[:MAX_NAME_LENGTH]
        cat_esc = (cat or pn).replace("'", "''")[:MAX_NAME_LENGTH]
        values.append(
            f"('{pn_esc}', '{cat_esc}', '{hs6}', {conf}, '{src}', '{{}}'::jsonb, NOW())"
        )

    sql = (
        "INSERT INTO product_hs_mappings "
        "(product_name, category, hs6, confidence, source, metadata, created_at) "
        f"VALUES {','.join(values)} "
        "ON CONFLICT (lower(product_name)) DO NOTHING;"
    )

    result, err = run_sql(sql)
    if err:
        return 0, err
    return len(rows), None


# ─── Tier 1: Existing Mappings Lookup ─────────────────────────
class Tier1Matcher:
    """Match against existing product_hs_mappings using category/name keywords."""

    def __init__(self):
        self.category_map = {}   # lowercase category → hs6
        self.keyword_map = {}    # lowercase keyword → hs6
        self.name_map = {}       # lowercase full name → hs6

    def load(self):
        log("Tier 1: Loading existing product_hs_mappings...")
        data, err = run_sql(
            "SELECT product_name, category, hs6 FROM product_hs_mappings;"
        )
        if err:
            log(f"  ERROR loading mappings: {err}")
            return

        for row in data:
            pn = row["product_name"].lower().strip()
            cat = (row.get("category") or "").lower().strip()
            hs6 = row["hs6"]

            self.name_map[pn] = hs6
            if cat:
                # Store full category path and each segment
                self.category_map[cat] = hs6
                for seg in cat.split(">"):
                    seg = seg.strip()
                    if seg and len(seg) > 2:
                        self.category_map[seg] = hs6

                # Extract keywords from product name (2+ word phrases)
                words = pn.split()
                if len(words) <= 4:
                    self.keyword_map[pn] = hs6

        log(f"  Loaded: {len(self.name_map)} names, "
            f"{len(self.category_map)} categories, "
            f"{len(self.keyword_map)} keywords")

    def match(self, name, category):
        """Try to match product. Returns (hs6, confidence) or (None, 0)."""
        name_lower = name.lower().strip()
        cat_lower = (category or "").lower().strip()

        # Exact name match
        if name_lower in self.name_map:
            return self.name_map[name_lower], 0.98

        # Category exact match
        if cat_lower and cat_lower in self.category_map:
            return self.category_map[cat_lower], 0.95

        # Category segment match (check each part of "Foo > Bar > Baz")
        if cat_lower:
            for seg in cat_lower.split(">"):
                seg = seg.strip()
                if seg and seg in self.category_map:
                    return self.category_map[seg], 0.90

        # Keyword substring match in product name
        # Check if any known keyword appears in the name
        for kw, hs6 in self.keyword_map.items():
            if len(kw) >= 4 and kw in name_lower:
                return hs6, 0.85

        return None, 0


# ─── Tier 2: HS Description Keywords ──────────────────────────
class Tier2Matcher:
    """Match against hs_description_keywords using text matching."""

    def __init__(self):
        self.keywords = {}  # keyword → hs6 (first 6 digits of hs_code)

    def load(self):
        log("Tier 2: Loading hs_description_keywords...")
        data, err = run_sql(
            "SELECT DISTINCT keyword, hs_code FROM hs_description_keywords "
            "WHERE keyword_type IN ('primary', 'material', 'product') "
            "ORDER BY keyword;"
        )
        if err:
            log(f"  ERROR loading keywords: {err}")
            return

        for row in data:
            kw = row["keyword"].lower().strip()
            hs_code = row["hs_code"]
            hs6 = hs_code[:6] if len(hs_code) >= 6 else hs_code

            # Only keep keywords with 3+ characters
            if len(kw) >= 3 and kw not in self.keywords:
                self.keywords[kw] = hs6

        log(f"  Loaded: {len(self.keywords)} unique keywords")

    def match(self, name, category):
        """Try keyword matching. Returns (hs6, confidence) or (None, 0)."""
        text = f"{name} {category or ''}".lower()

        best_hs6 = None
        best_len = 0

        # Find longest matching keyword (longer = more specific = better)
        for kw, hs6 in self.keywords.items():
            if kw in text and len(kw) > best_len:
                best_hs6 = hs6
                best_len = len(kw)

        if best_hs6 and best_len >= 4:
            # Confidence based on keyword length
            conf = min(0.80, 0.60 + best_len * 0.02)
            return best_hs6, conf

        return None, 0


# ─── Tier 3: Groq LLM Classification ──────────────────────────
class Tier3Classifier:
    """Classify unmatched products using Groq API (llama3, free/cheap)."""

    def __init__(self):
        self.api_key = GROQ_API_KEY
        self.last_call_time = 0
        self.min_interval = 60.0 / GROQ_RPM_LIMIT  # seconds between calls

        # Cache: product pattern → hs6 (avoid repeated API calls)
        self.pattern_cache = {}

    def _rate_limit(self):
        """Enforce rate limit."""
        elapsed = time.time() - self.last_call_time
        if elapsed < self.min_interval:
            time.sleep(self.min_interval - elapsed)
        self.last_call_time = time.time()

    def _normalize_name(self, name):
        """Extract a generic pattern from product name for caching."""
        # Remove brand-specific, size, color details
        # "Nike Air Max 90 Black Size 10" → "air max sneakers"
        name = name.lower().strip()
        # Remove common noise
        name = re.sub(r'\b(size|color|colour|xl|xxl|xs|sm|md|lg|[0-9]+\s*(ml|oz|g|kg|lb|cm|mm|inch|in|ft))\b', '', name)
        name = re.sub(r'[^a-z\s]', ' ', name)
        name = re.sub(r'\s+', ' ', name).strip()
        # Keep first 5 words max
        words = name.split()[:5]
        return ' '.join(words)

    def classify_batch(self, products):
        """Classify a batch of products.
        products: list of (name, category)
        Returns: list of (hs6, confidence) or (None, 0)
        """
        if not self.api_key:
            return [(None, 0)] * len(products)

        # Check cache first
        results = []
        uncached = []
        uncached_indices = []

        for i, (name, cat) in enumerate(products):
            pattern = self._normalize_name(name)
            if pattern in self.pattern_cache:
                results.append(self.pattern_cache[pattern])
            else:
                results.append(None)  # placeholder
                uncached.append((name, cat, pattern))
                uncached_indices.append(i)

        if not uncached:
            return results

        # Build prompt
        product_list = "\n".join(
            f"{j+1}. Name: {n[:100]}, Category: {(c or 'unknown')[:60]}"
            for j, (n, c, _) in enumerate(uncached)
        )

        prompt = (
            "You are an HS Code classification expert. "
            "Classify each product into an HS 6-digit code (HS 2022). "
            "Return ONLY a JSON array of objects with 'index' and 'hs6' fields.\n\n"
            f"Products:\n{product_list}\n\n"
            "Response format: [{\"index\": 1, \"hs6\": \"610910\"}, ...]\n"
            "If uncertain, use the most likely HS6. Never return null."
        )

        # Call Groq API with retry
        for attempt in range(GROQ_MAX_RETRIES):
            self._rate_limit()
            try:
                body = json.dumps({
                    "model": "llama-3.1-8b-instant",
                    "messages": [{"role": "user", "content": prompt}],
                    "temperature": 0.1,
                    "max_tokens": 500,
                    "response_format": {"type": "json_object"},
                }).encode()

                req = urllib.request.Request(
                    "https://api.groq.com/openai/v1/chat/completions",
                    data=body,
                    headers={
                        "Authorization": f"Bearer {self.api_key}",
                        "Content-Type": "application/json",
                    },
                )

                with urllib.request.urlopen(req, timeout=30) as resp:
                    resp_data = json.loads(resp.read().decode())

                content = resp_data["choices"][0]["message"]["content"]
                parsed = json.loads(content)

                # Handle both array and object-with-array formats
                items = parsed if isinstance(parsed, list) else parsed.get("results", parsed.get("classifications", []))
                if isinstance(parsed, dict) and not items:
                    # Try to find any array value
                    for v in parsed.values():
                        if isinstance(v, list):
                            items = v
                            break

                for item in items:
                    idx = item.get("index", 0) - 1  # 1-based to 0-based
                    hs6 = str(item.get("hs6", ""))

                    if 0 <= idx < len(uncached) and len(hs6) == 6 and hs6.isdigit():
                        _, _, pattern = uncached[idx]
                        result = (hs6, 0.75)
                        self.pattern_cache[pattern] = result
                        results[uncached_indices[idx]] = result

                break  # Success

            except urllib.error.HTTPError as e:
                if e.code == 429:
                    wait = GROQ_BACKOFF_BASE ** (attempt + 1)
                    log(f"  Groq 429 rate limit, waiting {wait:.0f}s (attempt {attempt+1})")
                    time.sleep(wait)
                    continue
                else:
                    log(f"  Groq HTTP error {e.code}: {e.reason}")
                    break
            except Exception as e:
                log(f"  Groq error: {e}")
                break

        # Fill in any remaining None results
        final = []
        for r in results:
            if r is None:
                final.append((None, 0))
            else:
                final.append(r)

        return final


# ─── Main Pipeline ─────────────────────────────────────────────
def main():
    log("=" * 70)
    log("WDC Phase 4: Bulk Product → HS Code Mapping")
    log("=" * 70)

    # Validate config
    if not SUPABASE_TOKEN:
        log("ERROR: SUPABASE_MGMT_TOKEN not set"); sys.exit(1)
    if not os.path.exists(JSONL_PATH):
        log(f"ERROR: JSONL file not found: {JSONL_PATH}"); sys.exit(1)

    has_groq = bool(GROQ_API_KEY)
    log(f"JSONL: {JSONL_PATH}")
    log(f"Groq API: {'enabled' if has_groq else 'disabled (Tier 3 skipped)'}")

    # Load progress
    progress = load_progress()
    start_line = progress["lines_processed"]
    log(f"Resuming from line {start_line:,}")

    # Initialize matchers
    tier1 = Tier1Matcher()
    tier1.load()
    tier2 = Tier2Matcher()
    tier2.load()
    tier3 = Tier3Classifier() if has_groq else None

    # Batch buffers
    insert_buffer = []        # (product_name, category, hs6, confidence, source)
    tier3_buffer = []         # (name, category) — waiting for Groq classification
    tier3_buffer_meta = []    # original product data for tier3

    # Stats
    start_time = time.time()
    session_processed = 0
    seen_names = set()  # deduplicate within session

    # Pre-load existing product names to avoid duplicate inserts
    log("Loading existing product names for dedup...")
    existing_data, err = run_sql(
        "SELECT product_name FROM product_hs_mappings LIMIT 50000;"
    )
    existing_names = set()
    if existing_data:
        existing_names = {r["product_name"].lower().strip() for r in existing_data}
    log(f"  Existing names loaded: {len(existing_names):,}")

    def flush_inserts():
        """Flush insert buffer to DB."""
        nonlocal insert_buffer
        if not insert_buffer:
            return

        # Split into sub-batches of BATCH_INSERT_SIZE
        for i in range(0, len(insert_buffer), BATCH_INSERT_SIZE):
            batch = insert_buffer[i:i + BATCH_INSERT_SIZE]
            count, err = batch_insert_mappings(batch)
            if err:
                progress["errors"] += 1
                if "unique" not in str(err).lower():
                    log(f"  Insert error: {err[:150]}")
            else:
                progress["inserted"] += count

        insert_buffer = []

    def flush_tier3():
        """Classify tier3 buffer via Groq and add results to insert buffer."""
        nonlocal tier3_buffer, tier3_buffer_meta
        if not tier3 or not tier3_buffer:
            return

        results = tier3.classify_batch(tier3_buffer)
        for (name, cat), (hs6, conf) in zip(tier3_buffer, results):
            if hs6:
                insert_buffer.append((name, cat, hs6, conf, "wdc_phase4_groq"))
                progress["tier3_hits"] += 1

                # Add to Tier 1 cache for future products
                pattern = tier3._normalize_name(name)
                tier1.keyword_map[pattern] = hs6
            else:
                progress["tier3_misses"] += 1

        tier3_buffer = []
        tier3_buffer_meta = []

    # ─── Stream JSONL ──────────────────────────────────────────
    log(f"Starting JSONL stream...")
    try:
        with open(JSONL_PATH, "r", encoding="utf-8", errors="replace") as f:
            for line_num, line in enumerate(f):
                # Skip already processed lines
                if line_num < start_line:
                    continue

                # Parse JSON
                line = line.strip()
                if not line:
                    continue

                try:
                    product = json.loads(line)
                except json.JSONDecodeError:
                    progress["skipped"] += 1
                    continue

                name = (product.get("name") or "").strip()
                category = (product.get("category") or "").strip()

                # Skip invalid
                if not name or len(name) < 3 or len(name) > 500:
                    progress["skipped"] += 1
                    progress["lines_processed"] = line_num + 1
                    session_processed += 1
                    continue

                # Deduplicate
                name_key = name.lower()[:MAX_NAME_LENGTH]
                if name_key in seen_names or name_key in existing_names:
                    progress["skipped"] += 1
                    progress["lines_processed"] = line_num + 1
                    session_processed += 1
                    continue
                seen_names.add(name_key)

                # Memory management: clear seen_names periodically
                if len(seen_names) > 5_000_000:
                    existing_names.update(seen_names)
                    seen_names = set()

                # ─── Tier 1: Existing mappings ─────────
                hs6, conf = tier1.match(name, category)
                if hs6:
                    insert_buffer.append((name[:MAX_NAME_LENGTH], category[:MAX_NAME_LENGTH], hs6, conf, "wdc_phase4_tier1"))
                    progress["tier1_hits"] += 1
                    progress["lines_processed"] = line_num + 1
                    session_processed += 1

                    if len(insert_buffer) >= BATCH_INSERT_SIZE:
                        flush_inserts()
                    continue

                # ─── Tier 2: Keyword matching ──────────
                hs6, conf = tier2.match(name, category)
                if hs6:
                    insert_buffer.append((name[:MAX_NAME_LENGTH], category[:MAX_NAME_LENGTH], hs6, conf, "wdc_phase4_tier2"))
                    progress["tier2_hits"] += 1
                    progress["lines_processed"] = line_num + 1
                    session_processed += 1

                    if len(insert_buffer) >= BATCH_INSERT_SIZE:
                        flush_inserts()
                    continue

                # ─── Tier 3: Groq LLM ─────────────────
                if tier3:
                    tier3_buffer.append((name[:100], category[:60]))
                    if len(tier3_buffer) >= GROQ_BATCH_SIZE:
                        flush_tier3()
                        if len(insert_buffer) >= BATCH_INSERT_SIZE:
                            flush_inserts()
                else:
                    progress["tier3_misses"] += 1

                progress["lines_processed"] = line_num + 1
                session_processed += 1

                # ─── Stats ─────────────────────────────
                if session_processed % STATS_INTERVAL == 0:
                    elapsed = time.time() - start_time
                    rate = session_processed / elapsed if elapsed > 0 else 0
                    total = progress["tier1_hits"] + progress["tier2_hits"] + progress["tier3_hits"]
                    processed = progress["lines_processed"]
                    match_pct = (total / session_processed * 100) if session_processed > 0 else 0

                    # Estimate remaining (assume ~1.76B total lines)
                    est_total = 1_760_000_000
                    remaining = est_total - processed
                    eta_hours = remaining / rate / 3600 if rate > 0 else 0

                    log(
                        f"  [{processed:>13,}] "
                        f"rate={rate:,.0f}/s | "
                        f"match={match_pct:.1f}% | "
                        f"T1={progress['tier1_hits']:,} "
                        f"T2={progress['tier2_hits']:,} "
                        f"T3={progress['tier3_hits']:,} "
                        f"skip={progress['skipped']:,} "
                        f"ins={progress['inserted']:,} "
                        f"err={progress['errors']} | "
                        f"ETA={eta_hours:.1f}h | "
                        f"buf={len(insert_buffer)} "
                        f"cache={len(tier3.pattern_cache) if tier3 else 0}"
                    )

                    # Save progress every stats interval
                    save_progress(progress)

                    # Flush inserts periodically
                    if len(insert_buffer) > 0:
                        flush_inserts()

    except KeyboardInterrupt:
        log("Interrupted by user (Ctrl+C)")
    except Exception as e:
        log(f"FATAL ERROR at line {progress['lines_processed']}: {e}")
        import traceback
        traceback.print_exc()
    finally:
        # Flush remaining
        log("Flushing remaining buffers...")
        flush_tier3()
        flush_inserts()
        save_progress(progress)

        # Final stats
        elapsed = time.time() - start_time
        total_matched = progress["tier1_hits"] + progress["tier2_hits"] + progress["tier3_hits"]
        log("=" * 70)
        log("FINAL STATS:")
        log(f"  Lines processed: {progress['lines_processed']:,}")
        log(f"  Session processed: {session_processed:,}")
        log(f"  Total matched: {total_matched:,}")
        log(f"  Tier 1 (mapping lookup): {progress['tier1_hits']:,}")
        log(f"  Tier 2 (keyword match):  {progress['tier2_hits']:,}")
        log(f"  Tier 3 (Groq LLM):       {progress['tier3_hits']:,}")
        log(f"  Tier 3 misses:           {progress['tier3_misses']:,}")
        log(f"  Skipped (invalid/dupe):  {progress['skipped']:,}")
        log(f"  Inserted to DB:          {progress['inserted']:,}")
        log(f"  Errors:                  {progress['errors']}")
        log(f"  Elapsed: {elapsed/3600:.1f} hours ({elapsed:.0f}s)")
        if session_processed > 0:
            rate = session_processed / elapsed
            match_rate = total_matched / session_processed * 100
            log(f"  Rate: {rate:,.0f} products/sec")
            log(f"  Match rate: {match_rate:.1f}%")
        log("=" * 70)

        # Verify final DB count
        cnt, _ = run_sql("SELECT COUNT(*) as cnt FROM product_hs_mappings;")
        if cnt:
            log(f"  product_hs_mappings total: {cnt[0]['cnt']:,}")


if __name__ == "__main__":
    main()
