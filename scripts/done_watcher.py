#!/usr/bin/env python3
"""
DONE File Watcher
Monitors for DONE files from Terminal 1 data collection.
When found, loads data into Supabase DB via psql.
"""

import os
import sys
import time
import subprocess
import csv
from datetime import datetime

PSQL = "/opt/homebrew/Cellar/libpq/18.3/bin/psql"
DB_CONN = "PGPASSWORD='potalqwepoi2@' {psql} -h db.zyurflkhiregundhisky.supabase.co -p 5432 -U postgres -d postgres".format(psql=PSQL)
LOG_FILE = "/Volumes/soulmaten/POTAL/benchmark/benchmark.log"
CHECK_INTERVAL = 30  # seconds


def log(msg):
    timestamp = datetime.now().strftime("%Y-%m-%d %H:%M:%S")
    line = f"[{timestamp}] [WATCHER] {msg}"
    print(line)
    with open(LOG_FILE, "a") as f:
        f.write(line + "\n")


def run_psql(sql):
    """Run a SQL command via psql."""
    cmd = f"PGPASSWORD='potalqwepoi2@' {PSQL} -h db.zyurflkhiregundhisky.supabase.co -p 5432 -U postgres -d postgres -c \"{sql}\""
    result = subprocess.run(cmd, shell=True, capture_output=True, text=True)
    if result.returncode != 0:
        log(f"  SQL error: {result.stderr.strip()}")
    return result


def run_psql_copy(table, csv_file, columns):
    """Run \\copy via psql."""
    cols = ", ".join(columns)
    cmd = f"PGPASSWORD='potalqwepoi2@' {PSQL} -h db.zyurflkhiregundhisky.supabase.co -p 5432 -U postgres -d postgres -c \"\\copy {table} ({cols}) FROM '{csv_file}' WITH (FORMAT csv, HEADER true, DELIMITER ',')\""
    result = subprocess.run(cmd, shell=True, capture_output=True, text=True)
    if result.returncode != 0:
        log(f"  \\copy error: {result.stderr.strip()}")
    else:
        log(f"  \\copy success: {result.stdout.strip()}")
    return result


def load_bis_ccl():
    """Load BIS CCL data into export_controls table."""
    csv_file = "/Volumes/soulmaten/POTAL/regulations/us_bis/eccn_list.csv"

    if not os.path.exists(csv_file):
        log("ERROR: eccn_list.csv not found!")
        return False

    log("Loading BIS CCL into export_controls table...")

    # Check CSV structure
    with open(csv_file, "r") as f:
        reader = csv.reader(f)
        headers = next(reader)
        row_count = sum(1 for _ in reader)
    log(f"  CSV headers: {headers}")
    log(f"  CSV rows: {row_count}")

    # Create table if not exists
    create_sql = """
    CREATE TABLE IF NOT EXISTS export_controls (
        id SERIAL PRIMARY KEY,
        eccn VARCHAR(20),
        description TEXT,
        control_reason TEXT,
        license_requirement TEXT,
        category VARCHAR(100),
        subcategory VARCHAR(100),
        source VARCHAR(50) DEFAULT 'BIS_CCL',
        raw_data JSONB,
        created_at TIMESTAMPTZ DEFAULT NOW(),
        updated_at TIMESTAMPTZ DEFAULT NOW()
    );
    CREATE INDEX IF NOT EXISTS idx_export_controls_eccn ON export_controls(eccn);
    """
    run_psql(create_sql.replace("\n", " "))

    # Map CSV columns to table columns based on actual headers
    # We'll do a flexible approach: detect headers and map accordingly
    header_map = {}
    for h in headers:
        hl = h.lower().strip()
        if "eccn" in hl or "number" in hl:
            header_map["eccn"] = h
        elif "description" in hl or "desc" in hl:
            header_map["description"] = h
        elif "reason" in hl or "control" in hl:
            header_map["control_reason"] = h
        elif "license" in hl or "requirement" in hl:
            header_map["license_requirement"] = h
        elif "category" in hl or "cat" in hl:
            header_map["category"] = h

    log(f"  Column mapping: {header_map}")

    # Load via \copy with matching columns
    table_cols = list(header_map.keys())
    if not table_cols:
        # Fallback: just load all columns into raw_data as JSONB
        log("  No matching columns found, inserting as raw JSON rows...")
        with open(csv_file, "r") as f:
            reader = csv.DictReader(f)
            batch = []
            for row in reader:
                eccn = row.get(headers[0], "")
                desc = row.get(headers[1], "") if len(headers) > 1 else ""
                batch.append((eccn, desc, str(row)))

            for eccn, desc, raw in batch:
                eccn_esc = eccn.replace("'", "''")
                desc_esc = desc.replace("'", "''")
                raw_esc = raw.replace("'", "''")
                sql = f"INSERT INTO export_controls (eccn, description, raw_data) VALUES ('{eccn_esc}', '{desc_esc}', '{{}}'::jsonb) ON CONFLICT DO NOTHING;"
                run_psql(sql)

        log(f"  Loaded {row_count} rows into export_controls (row-by-row)")
    else:
        # Try \copy
        result = run_psql_copy("export_controls", csv_file, table_cols)
        if result.returncode != 0:
            log("  \\copy failed, falling back to row-by-row insert...")
            # Fallback
            with open(csv_file, "r") as f:
                reader = csv.DictReader(f)
                count = 0
                for row in reader:
                    vals = []
                    for col in table_cols:
                        csv_col = header_map[col]
                        v = row.get(csv_col, "").replace("'", "''")
                        vals.append(f"'{v}'")
                    sql = f"INSERT INTO export_controls ({', '.join(table_cols)}) VALUES ({', '.join(vals)});"
                    run_psql(sql)
                    count += 1
                log(f"  Loaded {count} rows into export_controls (row-by-row)")

    # Verify
    result = run_psql("SELECT count(*) FROM export_controls;")
    log(f"  export_controls count: {result.stdout.strip()}")
    return True


def load_un_dg():
    """Load UN DG data into restricted_items table."""
    csv_file = "/Volumes/soulmaten/POTAL/regulations/un_dg/un_dg_list.csv"

    if not os.path.exists(csv_file):
        log("ERROR: un_dg_list.csv not found!")
        return False

    log("Loading UN DG into restricted_items table...")

    # Check CSV structure
    with open(csv_file, "r") as f:
        reader = csv.reader(f)
        headers = next(reader)
        row_count = sum(1 for _ in reader)
    log(f"  CSV headers: {headers}")
    log(f"  CSV rows: {row_count}")

    # Create table if not exists
    create_sql = """
    CREATE TABLE IF NOT EXISTS restricted_items (
        id SERIAL PRIMARY KEY,
        un_number VARCHAR(10),
        name TEXT,
        hazard_class VARCHAR(20),
        packing_group VARCHAR(10),
        subsidiary_risk TEXT,
        special_provisions TEXT,
        label TEXT,
        source VARCHAR(50) DEFAULT 'UN_DG',
        raw_data JSONB,
        created_at TIMESTAMPTZ DEFAULT NOW(),
        updated_at TIMESTAMPTZ DEFAULT NOW()
    );
    CREATE INDEX IF NOT EXISTS idx_restricted_items_un ON restricted_items(un_number);
    """
    run_psql(create_sql.replace("\n", " "))

    # Map CSV columns
    header_map = {}
    for h in headers:
        hl = h.lower().strip()
        if "un" in hl and ("no" in hl or "num" in hl):
            header_map["un_number"] = h
        elif "name" in hl or "substance" in hl or "description" in hl:
            header_map["name"] = h
        elif "class" in hl or "hazard" in hl:
            header_map["hazard_class"] = h
        elif "pack" in hl or "group" in hl:
            header_map["packing_group"] = h
        elif "subsid" in hl or "risk" in hl:
            header_map["subsidiary_risk"] = h
        elif "label" in hl:
            header_map["label"] = h

    log(f"  Column mapping: {header_map}")

    table_cols = list(header_map.keys())
    if table_cols:
        result = run_psql_copy("restricted_items", csv_file, table_cols)
        if result.returncode != 0:
            log("  \\copy failed, falling back to row-by-row...")
            with open(csv_file, "r") as f:
                reader = csv.DictReader(f)
                count = 0
                for row in reader:
                    vals = []
                    for col in table_cols:
                        csv_col = header_map[col]
                        v = row.get(csv_col, "").replace("'", "''")
                        vals.append(f"'{v}'")
                    sql = f"INSERT INTO restricted_items ({', '.join(table_cols)}) VALUES ({', '.join(vals)});"
                    run_psql(sql)
                    count += 1
                log(f"  Loaded {count} rows (row-by-row)")
    else:
        log("  No matching columns, loading with generic approach...")
        with open(csv_file, "r") as f:
            reader = csv.DictReader(f)
            count = 0
            for row in reader:
                un = row.get(headers[0], "").replace("'", "''")
                name = row.get(headers[1], "").replace("'", "''") if len(headers) > 1 else ""
                sql = f"INSERT INTO restricted_items (un_number, name) VALUES ('{un}', '{name}');"
                run_psql(sql)
                count += 1
            log(f"  Loaded {count} rows (row-by-row)")

    result = run_psql("SELECT count(*) FROM restricted_items;")
    log(f"  restricted_items count: {result.stdout.strip()}")
    return True


WATCH_TARGETS = {
    "bis": {
        "done_file": "/Volumes/soulmaten/POTAL/regulations/us_bis/DONE",
        "handler": load_bis_ccl,
        "loaded": False,
    },
    "un_dg": {
        "done_file": "/Volumes/soulmaten/POTAL/regulations/un_dg/DONE",
        "handler": load_un_dg,
        "loaded": False,
    },
}


def watch_loop():
    """Main watch loop for DONE files."""
    log("Starting DONE file watcher...")
    log(f"Watching: {[t['done_file'] for t in WATCH_TARGETS.values()]}")

    while True:
        all_done = True
        for name, target in WATCH_TARGETS.items():
            if target["loaded"]:
                continue
            all_done = False

            if os.path.exists(target["done_file"]):
                log(f"DONE detected: {target['done_file']}")
                try:
                    target["handler"]()
                    target["loaded"] = True
                    log(f"✅ {name} loaded successfully")
                except Exception as e:
                    log(f"❌ {name} load failed: {e}")

        if all_done:
            log("All DONE targets loaded. Watcher exiting.")
            break

        time.sleep(CHECK_INTERVAL)


if __name__ == "__main__":
    watch_loop()
