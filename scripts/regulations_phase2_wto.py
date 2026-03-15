#!/usr/bin/env python3
"""
POTAL Regulations Phase 2 — WTO Data Collection
Collects tariff profiles, bound rates, and trade indicators for all WTO members.

Source: WTO Timeseries API (https://api.wto.org)
API Key: From environment variable WTO_API_KEY
Output: /Volumes/soulmaten/POTAL/regulations/international/wto/

Data collected:
1. reporters.json — All 288 WTO reporters (countries/territories)
2. tariff_profiles/ — Per-country tariff profiles (MFN applied, bound, preferential)
3. indicators_summary.json — All tariff indicator metadata
"""

import os
import json
import time
import sys
from urllib.request import Request, urlopen
from urllib.error import HTTPError, URLError

# ─── Config ───────────────────────────────────────────
API_KEY = os.environ.get("WTO_API_KEY", "e6b00ecdb5b34e09aabe15e68ab71d1d")
BASE_URL = "https://api.wto.org/timeseries/v1"
OUTPUT_DIR = "/Volumes/soulmaten/POTAL/regulations/international/wto"

# Tariff indicators to collect per country
INDICATORS = [
    ("TP_A_0010", "MFN applied avg - all products"),
    ("TP_A_0160", "MFN applied avg - agricultural"),
    ("TP_A_0430", "MFN applied avg - non-agricultural"),
    ("TP_B_0090", "Bound avg - all products"),
    ("TP_B_0180", "Bound avg - agricultural"),
    ("TP_B_0380", "Bound avg - non-agricultural"),
    ("TP_B_0020", "Bound lines pct - all products"),
    ("HS_A_0010", "HS MFN simple avg ad valorem"),
    ("HS_A_0030", "HS MFN duty free pct"),
    ("HS_A_0040", "HS MFN national tariff lines"),
    ("HS_P_0070", "Lowest preferential avg"),
]

# Years to collect
YEARS = "2020,2021,2022,2023,2024,2025"

# ─── Helpers ──────────────────────────────────────────

def api_get(endpoint: str, params: str = ""):
    """Make authenticated GET request to WTO API."""
    url = f"{BASE_URL}/{endpoint}"
    if params:
        url += f"?{params}"
    req = Request(url)
    req.add_header("Ocp-Apim-Subscription-Key", API_KEY)
    req.add_header("Accept", "application/json")

    import socket
    for attempt in range(3):
        try:
            with urlopen(req, timeout=45) as resp:
                body = resp.read().decode("utf-8")
                if not body or not body.strip():
                    return None
                return json.loads(body)
        except HTTPError as e:
            if e.code == 429:
                wait = 2 ** (attempt + 1)
                print(f"  Rate limited, waiting {wait}s...")
                time.sleep(wait)
                continue
            elif e.code in (400, 404):
                return None
            else:
                print(f"  HTTP {e.code}: {e.reason}")
                return None
        except (URLError, TimeoutError, socket.timeout, ConnectionResetError, json.JSONDecodeError) as e:
            if attempt < 2:
                time.sleep(3)
                continue
            return None
        except Exception as e:
            return None
    return None


def save_json(data, filepath: str):
    """Save data as JSON."""
    os.makedirs(os.path.dirname(filepath), exist_ok=True)
    with open(filepath, "w", encoding="utf-8") as f:
        json.dump(data, f, ensure_ascii=False, indent=2)
    size = os.path.getsize(filepath)
    print(f"  Saved: {filepath} ({size:,} bytes)")


# ─── Step 1: Reporters ────────────────────────────────

def collect_reporters():
    """Collect all WTO reporters (countries/territories)."""
    print("\n[1/4] Collecting WTO reporters...")
    data = api_get("reporters")
    if not data:
        print("  FAILED to fetch reporters")
        return []

    filepath = os.path.join(OUTPUT_DIR, "reporters.json")
    save_json(data, filepath)
    print(f"  Total reporters: {len(data)}")
    return data


# ─── Step 2: Indicator Metadata ───────────────────────

def collect_indicators():
    """Collect all indicator definitions."""
    print("\n[2/4] Collecting indicator metadata...")
    data = api_get("indicators")
    if not data:
        print("  FAILED to fetch indicators")
        return

    # Filter to tariff-related
    tariff_indicators = [d for d in data if d.get("categoryCode") in ("TAR",)]
    filepath = os.path.join(OUTPUT_DIR, "tariff_indicators.json")
    save_json(tariff_indicators, filepath)
    print(f"  Total tariff indicators: {len(tariff_indicators)}")

    # Also save all indicators
    filepath_all = os.path.join(OUTPUT_DIR, "all_indicators.json")
    save_json(data, filepath_all)
    print(f"  Total all indicators: {len(data)}")


# ─── Step 3: Tariff Profiles Per Country ──────────────

def collect_tariff_profiles(reporters: list):
    """Collect tariff data for each country across key indicators."""
    print("\n[3/4] Collecting tariff profiles per country...")

    # Filter to actual countries (exclude aggregates like "World", "Africa")
    countries = [r for r in reporters if r.get("iso3A") and len(r.get("iso3A", "")) == 3]
    print(f"  Countries to process: {len(countries)}")

    profiles_dir = os.path.join(OUTPUT_DIR, "tariff_profiles")
    os.makedirs(profiles_dir, exist_ok=True)

    # Check existing files for resume
    existing = set()
    if os.path.exists(profiles_dir):
        existing = {f.replace(".json", "") for f in os.listdir(profiles_dir) if f.endswith(".json")}

    total = len(countries)
    collected = 0
    skipped = 0
    failed = 0

    for idx, country in enumerate(countries):
        code = country["code"]
        iso3 = country["iso3A"]
        name = country["name"]

        if iso3 in existing:
            skipped += 1
            continue

        profile = {
            "reporter_code": code,
            "iso3": iso3,
            "name": name,
            "collected_at": time.strftime("%Y-%m-%dT%H:%M:%SZ", time.gmtime()),
            "indicators": {},
        }

        has_data = False
        for ind_code, ind_label in INDICATORS:
            data = api_get("data", f"i={ind_code}&r={code}&ps={YEARS}")
            if data and isinstance(data, dict) and "Dataset" in data:
                records = data["Dataset"]
                if records:
                    profile["indicators"][ind_code] = {
                        "label": ind_label,
                        "records": records,
                    }
                    has_data = True
            # Rate limit: WTO allows ~50 req/min
            time.sleep(0.3)

        if has_data:
            filepath = os.path.join(profiles_dir, f"{iso3}.json")
            save_json(profile, filepath)
            collected += 1
        else:
            failed += 1

        done = idx + 1 - len(existing.intersection({c["iso3A"] for c in countries[:idx+1]}))
        if done % 10 == 0 or done <= 3:
            print(f"  Progress: {idx+1}/{total} | collected={collected} skipped={skipped} failed={failed}")

    print(f"\n  Final: collected={collected}, skipped={skipped}, failed={failed}")
    return collected


# ─── Step 4: WTO Members List ─────────────────────────

def collect_members():
    """Collect WTO membership information."""
    print("\n[4/4] Collecting WTO members list...")
    # The reporters data already includes this, but let's also get topics
    topics = api_get("topics")
    if topics:
        filepath = os.path.join(OUTPUT_DIR, "topics.json")
        save_json(topics, filepath)
        print(f"  Topics: {len(topics)}")

    # Product classifications
    products = api_get("product_classifications")
    if products:
        filepath = os.path.join(OUTPUT_DIR, "product_classifications.json")
        save_json(products, filepath)
        print(f"  Product classifications: {len(products)}")


# ─── Main ─────────────────────────────────────────────

def main():
    print("=" * 60)
    print("POTAL Phase 2 — WTO Data Collection")
    print(f"Output: {OUTPUT_DIR}")
    print("=" * 60)

    if not os.path.exists(os.path.dirname(OUTPUT_DIR)):
        print("ERROR: External drive not mounted")
        sys.exit(1)

    # Step 1: Reporters
    reporters = collect_reporters()
    if not reporters:
        print("Cannot continue without reporters list")
        sys.exit(1)

    # Step 2: Indicators
    collect_indicators()

    # Step 3: Tariff profiles
    collected = collect_tariff_profiles(reporters)

    # Step 4: Members/topics
    collect_members()

    # Summary
    print("\n" + "=" * 60)
    print("WTO Collection Complete")
    total_files = sum(1 for root, dirs, files in os.walk(OUTPUT_DIR) for f in files)
    total_size = sum(os.path.getsize(os.path.join(root, f)) for root, dirs, files in os.walk(OUTPUT_DIR) for f in files)
    print(f"  Total files: {total_files}")
    print(f"  Total size: {total_size / 1024 / 1024:.1f} MB")
    print(f"  Tariff profiles collected: {collected}")
    print("=" * 60)


if __name__ == "__main__":
    main()
