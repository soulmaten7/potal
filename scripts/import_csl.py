#!/usr/bin/env python3
"""
Import US Consolidated Screening List (CSL) into sanctions_entries.

Source: https://data.trade.gov/downloadable_consolidated_screening_list/v1/consolidated.csv
Contains 13 US screening lists including BIS Entity List, OFAC SDN, etc.

We skip OFAC SDN entries (already loaded via import_ofac_sdn.py) and import
the remaining 12 lists.

Usage: python3 scripts/import_csl.py
"""

import csv
import json
import subprocess
import sys
import time
import os

# Supabase Management API config
PROJECT_ID = "zyurflkhiregundhisky"
MGMT_TOKEN = "sbp_c96b42dce1f4204ae9f03b776ea42087a8dd6b6a"
MGMT_URL = f"https://api.supabase.com/v1/projects/{PROJECT_ID}/database/query"

CSV_URL = "https://data.trade.gov/downloadable_consolidated_screening_list/v1/consolidated.csv"
CSV_PATH = "/tmp/csl_consolidated.csv"

# Map CSL source names to our source codes
SOURCE_MAP = {
    "Entity List (EL) - Bureau of Industry and Security": "BIS_ENTITY",
    "Denied Persons List (DPL) - Bureau of Industry and Security": "BIS_DPL",
    "Unverified List (UVL) - Bureau of Industry and Security": "BIS_UVL",
    "Military End User (MEU) List - Bureau of Industry and Security": "BIS_MEU",
    "Nonproliferation Sanctions (ISN) - State Department": "STATE_ISN",
    "ITAR Debarred (DTC) - State Department": "STATE_DTC",
    "Specially Designated Nationals (SDN) - Treasury Department": "OFAC_SDN",
    "Foreign Sanctions Evaders (FSE) - Treasury Department": "OFAC_FSE",
    "Sectoral Sanctions Identifications List (SSI) - Treasury Department": "OFAC_SSI",
    "Sectoral Sanctions Identifications (SSI) - Treasury Department": "OFAC_SSI",
    "Palestinian Legislative Council List (PLC) - Treasury Department": "OFAC_PLC",
    "CAPTA (Correspondent Account or Payable-Through Account) - Treasury Department": "OFAC_CAPTA",
    "Capta List (CAP) - Treasury Department": "OFAC_CAPTA",
    "Non-SDN Menu-Based Sanctions List (NS-MBS List) - Treasury Department": "OFAC_NS_MBS",
    "Non-SDN Chinese Military-Industrial Complex Companies List (NS-CMIC) - Treasury Department": "OFAC_NS_CMIC",
    "Non-SDN Chinese Military-Industrial Complex Companies List (CMIC) - Treasury Department": "OFAC_NS_CMIC",
}

# Skip OFAC_SDN — already loaded via import_ofac_sdn.py
SKIP_SOURCES = {"OFAC_SDN"}

def run_sql(sql):
    """Execute SQL via Supabase Management API (curl)."""
    result = subprocess.run(
        ["curl", "-s", "-X", "POST", MGMT_URL,
         "-H", f"Authorization: Bearer {MGMT_TOKEN}",
         "-H", "Content-Type: application/json",
         "-d", json.dumps({"query": sql})],
        capture_output=True, text=True, timeout=60
    )
    try:
        return json.loads(result.stdout)
    except:
        return result.stdout

def download_csv():
    """Download CSL CSV file."""
    print(f"Downloading CSL CSV from {CSV_URL}...")
    result = subprocess.run(
        ["curl", "-s", "-L", "-o", CSV_PATH, CSV_URL],
        capture_output=True, text=True, timeout=120
    )
    if result.returncode != 0:
        print(f"Download failed: {result.stderr}")
        sys.exit(1)
    size = os.path.getsize(CSV_PATH)
    print(f"Downloaded: {size:,} bytes")
    return CSV_PATH

def escape_sql(s):
    """Escape single quotes for SQL."""
    if s is None:
        return "NULL"
    return "'" + str(s).replace("'", "''").replace("\\", "\\\\")[:500] + "'"

def parse_csl_csv(path):
    """Parse CSL CSV and return entries grouped by source."""
    entries = []
    with open(path, 'r', encoding='utf-8-sig') as f:
        reader = csv.DictReader(f)
        for row in reader:
            source_raw = row.get('source', '').strip()
            source_code = SOURCE_MAP.get(source_raw, source_raw)

            if source_code in SKIP_SOURCES:
                continue

            entity_number = row.get('entity_number', '').strip()
            name = row.get('name', '').strip()
            if not name:
                continue

            entry_type = row.get('type', 'Entity').strip().lower()
            if entry_type not in ('individual', 'entity', 'vessel', 'aircraft'):
                entry_type = 'entity'

            programs_raw = row.get('programs', '')
            programs = [p.strip() for p in programs_raw.split(';') if p.strip()] if programs_raw else []

            # Extract country from addresses
            addresses_raw = row.get('addresses', '')
            country = None
            if addresses_raw:
                parts = [p.strip() for p in addresses_raw.split(';')]
                for part in reversed(parts):
                    if len(part) == 2 and part.isalpha():
                        country = part.upper()
                        break

            remarks = row.get('remarks', '').strip() or None
            title = row.get('title', '').strip() or None
            call_sign = row.get('call_sign', '').strip() or None
            vessel_type_val = row.get('vessel_type', '').strip() or None
            tonnage = row.get('gross_tonnage', '').strip() or None
            grt = row.get('gross_registered_tonnage', '').strip() or None
            vessel_flag = row.get('vessel_flag', '').strip() or None

            alt_names = row.get('alt_names', '').strip()
            ids_raw = row.get('ids', '').strip()

            entries.append({
                'source': source_code,
                'source_id': entity_number or None,
                'entity_type': entry_type,
                'name': name,
                'country': country,
                'programs': programs,
                'remarks': remarks,
                'title': title,
                'call_sign': call_sign,
                'vessel_type': vessel_type_val,
                'tonnage': tonnage,
                'grt': grt,
                'vessel_flag': vessel_flag,
                'alt_names': alt_names,
                'ids_raw': ids_raw,
                'addresses_raw': row.get('addresses', '').strip(),
            })

    return entries

def insert_entries(entries):
    """Insert entries into sanctions_entries in batches."""
    BATCH_SIZE = 50
    total = len(entries)
    inserted = 0
    skipped = 0

    for i in range(0, total, BATCH_SIZE):
        batch = entries[i:i+BATCH_SIZE]
        values = []
        for e in batch:
            programs_sql = "ARRAY[" + ",".join(escape_sql(p) for p in e['programs']) + "]::TEXT[]" if e['programs'] else "'{}'::TEXT[]"
            values.append(
                f"({escape_sql(e['source'])}, {escape_sql(e['source_id'])}, "
                f"{escape_sql(e['entity_type'])}, {escape_sql(e['name'])}, "
                f"{escape_sql(e['country'])}, {programs_sql}, "
                f"{escape_sql(e['remarks'])}, {escape_sql(e['title'])}, "
                f"{escape_sql(e['call_sign'])}, {escape_sql(e['tonnage'])}, "
                f"{escape_sql(e['grt'])}, {escape_sql(e['vessel_flag'])}, "
                f"{escape_sql(e['vessel_type'])})"
            )

        sql = (
            "INSERT INTO sanctions_entries "
            "(source, source_id, entity_type, name, country, programs, "
            "remarks, title, call_sign, tonnage, grt, vessel_flag, vessel_type) "
            "VALUES " + ",\n".join(values) +
            " ON CONFLICT (source, source_id) DO UPDATE SET "
            "name = EXCLUDED.name, "
            "country = EXCLUDED.country, "
            "programs = EXCLUDED.programs, "
            "remarks = EXCLUDED.remarks, "
            "updated_at = now() "
            "RETURNING id;"
        )

        result = run_sql(sql)
        if isinstance(result, list):
            inserted += len(result)
        else:
            err_str = str(result)
            if 'error' in err_str.lower() or 'throttler' in err_str.lower():
                print(f"  Batch {i//BATCH_SIZE + 1}: API error, retrying after 3s...")
                time.sleep(3)
                result = run_sql(sql)
                if isinstance(result, list):
                    inserted += len(result)
                else:
                    skipped += len(batch)
                    print(f"  Batch {i//BATCH_SIZE + 1}: FAILED after retry")
            else:
                skipped += len(batch)

        if (i // BATCH_SIZE) % 10 == 0:
            print(f"  Progress: {min(i + BATCH_SIZE, total)}/{total} ({inserted} inserted, {skipped} skipped)")

        time.sleep(0.5)  # Rate limiting

    return inserted, skipped

def insert_aliases(entries):
    """Insert alt_names as sanctions_aliases."""
    BATCH_SIZE = 50
    total_aliases = 0

    # First, get all entry IDs for non-SDN sources
    sources = list(set(e['source'] for e in entries))
    source_list = ",".join(f"'{s}'" for s in sources)

    result = run_sql(f"SELECT id, source, source_id FROM sanctions_entries WHERE source IN ({source_list});")
    if not isinstance(result, list):
        print(f"  Failed to fetch entry IDs: {result}")
        return 0

    id_map = {}
    for row in result:
        if isinstance(row, dict):
            key = f"{row['source']}:{row.get('source_id', '')}"
            id_map[key] = row['id']

    alias_values = []
    for e in entries:
        if not e['alt_names']:
            continue
        key = f"{e['source']}:{e.get('source_id', '')}"
        entry_id = id_map.get(key)
        if not entry_id:
            continue

        for alias in e['alt_names'].split(';'):
            alias = alias.strip()
            if alias and len(alias) > 1:
                alias_values.append((entry_id, alias))

    print(f"  Found {len(alias_values)} aliases to insert")

    for i in range(0, len(alias_values), BATCH_SIZE):
        batch = alias_values[i:i+BATCH_SIZE]
        values = [f"({eid}, 'a.k.a.', {escape_sql(name)})" for eid, name in batch]
        sql = (
            "INSERT INTO sanctions_aliases (entry_id, alias_type, alias_name) "
            "VALUES " + ",\n".join(values) + ";"
        )
        result = run_sql(sql)
        total_aliases += len(batch)
        time.sleep(0.5)

    return total_aliases

def main():
    print("=" * 60)
    print("CSL (Consolidated Screening List) Import")
    print("=" * 60)

    # Download
    csv_path = download_csv()

    # Parse
    print("\nParsing CSV...")
    entries = parse_csl_csv(csv_path)

    # Stats by source
    source_counts = {}
    for e in entries:
        source_counts[e['source']] = source_counts.get(e['source'], 0) + 1

    print(f"\nTotal entries (excluding OFAC SDN): {len(entries)}")
    for src, cnt in sorted(source_counts.items()):
        print(f"  {src}: {cnt}")

    # Clear old non-SDN entries before re-import
    sources = list(source_counts.keys())
    source_list = ",".join(f"'{s}'" for s in sources)
    print(f"\nClearing old entries for {len(sources)} sources...")

    # Delete aliases/addresses/ids first (FK cascade should handle, but be safe)
    run_sql(f"DELETE FROM sanctions_aliases WHERE entry_id IN (SELECT id FROM sanctions_entries WHERE source IN ({source_list}));")
    time.sleep(1)
    run_sql(f"DELETE FROM sanctions_addresses WHERE entry_id IN (SELECT id FROM sanctions_entries WHERE source IN ({source_list}));")
    time.sleep(1)
    run_sql(f"DELETE FROM sanctions_ids WHERE entry_id IN (SELECT id FROM sanctions_entries WHERE source IN ({source_list}));")
    time.sleep(1)
    run_sql(f"DELETE FROM sanctions_entries WHERE source IN ({source_list});")
    time.sleep(1)
    print("  Cleared.")

    # Insert entries
    print("\nInserting entries...")
    inserted, skipped = insert_entries(entries)
    print(f"\nEntries: {inserted} inserted, {skipped} skipped")

    # Insert aliases
    print("\nInserting aliases...")
    aliases_count = insert_aliases(entries)
    print(f"Aliases: {aliases_count} inserted")

    # Update load meta
    for src in sources:
        run_sql(
            f"INSERT INTO sanctions_load_meta (source, last_loaded_at, record_count) "
            f"VALUES ('{src}', now(), {source_counts[src]}) "
            f"ON CONFLICT (source) DO UPDATE SET last_loaded_at = now(), record_count = {source_counts[src]};"
        )
        time.sleep(0.3)

    # Final count
    time.sleep(1)
    result = run_sql("SELECT source, count(*) as cnt FROM sanctions_entries GROUP BY source ORDER BY source;")
    print("\n" + "=" * 60)
    print("Final sanctions_entries counts:")
    if isinstance(result, list):
        for row in result:
            if isinstance(row, dict):
                print(f"  {row.get('source', '?')}: {row.get('cnt', '?')}")
    print("=" * 60)

if __name__ == "__main__":
    main()
