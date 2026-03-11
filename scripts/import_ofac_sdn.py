#!/usr/bin/env python3
"""
POTAL — OFAC SDN List Importer

Downloads the OFAC SDN XML file, parses it, and loads into Supabase.
Source: https://www.treasury.gov/ofac/downloads/sdn.xml

Usage:
  python3 scripts/import_ofac_sdn.py                    # Full load
  python3 scripts/import_ofac_sdn.py --check-only       # Check if update available
  python3 scripts/import_ofac_sdn.py --dry-run           # Parse without DB write

Tables: sanctions_entries, sanctions_aliases, sanctions_addresses, sanctions_ids
"""

import os
import sys
import json
import hashlib
import argparse
import xml.etree.ElementTree as ET
from datetime import datetime, timezone
from urllib.request import urlopen, Request
from urllib.error import URLError

# ─── Configuration ──────────────────────────────────

SDN_XML_URL = "https://www.treasury.gov/ofac/downloads/sdn.xml"
SDN_ADVANCED_XML_URL = "https://www.treasury.gov/ofac/downloads/sanctions/1.0/sdn_advanced.xml"

SUPABASE_URL = os.environ.get("NEXT_PUBLIC_SUPABASE_URL", "https://zyurflkhiregundhisky.supabase.co")
SUPABASE_KEY = os.environ.get("SUPABASE_SERVICE_ROLE_KEY", "")
MGMT_TOKEN = os.environ.get("SUPABASE_MGMT_TOKEN", "sbp_c96b42dce1f4204ae9f03b776ea42087a8dd6b6a")
PROJECT_ID = "zyurflkhiregundhisky"

# SDN XML namespace (OFAC uses this namespace for all elements)
SDN_NS = "https://sanctionslistservice.ofac.treas.gov/api/PublicationPreview/exports/XML"
NS = {"sdn": SDN_NS}

# Country code mapping (OFAC uses full names, we need ISO2)
COUNTRY_TO_ISO2 = {
    "Afghanistan": "AF", "Albania": "AL", "Algeria": "DZ", "Argentina": "AR",
    "Armenia": "AM", "Azerbaijan": "AZ", "Bahrain": "BH", "Bangladesh": "BD",
    "Belarus": "BY", "Belgium": "BE", "Bolivia": "BO", "Bosnia and Herzegovina": "BA",
    "Brazil": "BR", "Bulgaria": "BG", "Burma": "MM", "Myanmar": "MM",
    "Cambodia": "KH", "Canada": "CA", "Central African Republic": "CF",
    "Chad": "TD", "Chile": "CL", "China": "CN", "Colombia": "CO",
    "Congo, Democratic Republic of the": "CD", "Costa Rica": "CR",
    "Cote d'Ivoire": "CI", "Croatia": "HR", "Cuba": "CU", "Cyprus": "CY",
    "Czech Republic": "CZ", "Denmark": "DK", "Dominican Republic": "DO",
    "Ecuador": "EC", "Egypt": "EG", "El Salvador": "SV", "Eritrea": "ER",
    "Estonia": "EE", "Ethiopia": "ET", "Finland": "FI", "France": "FR",
    "Georgia": "GE", "Germany": "DE", "Ghana": "GH", "Greece": "GR",
    "Guatemala": "GT", "Guinea": "GN", "Haiti": "HT", "Honduras": "HN",
    "Hong Kong": "HK", "Hungary": "HU", "India": "IN", "Indonesia": "ID",
    "Iran": "IR", "Iraq": "IQ", "Ireland": "IE", "Israel": "IL",
    "Italy": "IT", "Japan": "JP", "Jordan": "JO", "Kazakhstan": "KZ",
    "Kenya": "KE", "Korea, North": "KP", "Korea, South": "KR",
    "Kosovo": "XK", "Kuwait": "KW", "Kyrgyzstan": "KG", "Latvia": "LV",
    "Lebanon": "LB", "Libya": "LY", "Lithuania": "LT", "Luxembourg": "LU",
    "Malaysia": "MY", "Mali": "ML", "Malta": "MT", "Mexico": "MX",
    "Moldova": "MD", "Montenegro": "ME", "Morocco": "MA", "Mozambique": "MZ",
    "Namibia": "NA", "Netherlands": "NL", "Nicaragua": "NI", "Niger": "NE",
    "Nigeria": "NG", "North Macedonia": "MK", "Norway": "NO", "Oman": "OM",
    "Pakistan": "PK", "Panama": "PA", "Paraguay": "PY", "Peru": "PE",
    "Philippines": "PH", "Poland": "PL", "Portugal": "PT", "Qatar": "QA",
    "Romania": "RO", "Russia": "RU", "Rwanda": "RW", "Saudi Arabia": "SA",
    "Senegal": "SN", "Serbia": "RS", "Sierra Leone": "SL", "Singapore": "SG",
    "Slovakia": "SK", "Slovenia": "SI", "Somalia": "SO", "South Africa": "ZA",
    "South Sudan": "SS", "Spain": "ES", "Sri Lanka": "LK", "Sudan": "SD",
    "Sweden": "SE", "Switzerland": "CH", "Syria": "SY", "Taiwan": "TW",
    "Tajikistan": "TJ", "Tanzania": "TZ", "Thailand": "TH", "Tunisia": "TN",
    "Turkey": "TR", "Turkmenistan": "TM", "Uganda": "UG", "Ukraine": "UA",
    "United Arab Emirates": "AE", "United Kingdom": "GB", "United States": "US",
    "Uruguay": "UY", "Uzbekistan": "UZ", "Venezuela": "VE", "Vietnam": "VN",
    "Yemen": "YE", "Zambia": "ZM", "Zimbabwe": "ZW",
}

# ─── Download ──────────────────────────────────────

def download_sdn_xml():
    """Download the SDN XML file from OFAC."""
    print(f"[SDN] Downloading from {SDN_XML_URL} ...")
    req = Request(SDN_XML_URL, headers={"User-Agent": "POTAL-SDN-Importer/1.0"})
    try:
        with urlopen(req, timeout=60) as resp:
            data = resp.read()
            print(f"[SDN] Downloaded {len(data):,} bytes")
            return data
    except URLError as e:
        print(f"[SDN] ERROR: Failed to download — {e}")
        sys.exit(1)

def compute_hash(data: bytes) -> str:
    return hashlib.sha256(data).hexdigest()

# ─── Parse ─────────────────────────────────────────

def ns(tag):
    """Wrap tag with SDN namespace."""
    return f"{{{SDN_NS}}}{tag}"

def get_text(el, tag):
    """Get text content of a child element, or None."""
    child = el.find(ns(tag))
    return child.text.strip() if child is not None and child.text else None

def country_to_iso2(name):
    """Convert country name to ISO2 code."""
    if not name:
        return None
    return COUNTRY_TO_ISO2.get(name, name[:2].upper() if len(name) == 2 else None)

def parse_sdn_xml(xml_data: bytes):
    """Parse SDN XML and return structured entries."""
    root = ET.fromstring(xml_data)

    # Get publish date from header
    publish_date = None
    publish_el = root.find(f".//{ns('publshInformation')}/{ns('Publish_Date')}")
    if publish_el is not None and publish_el.text:
        publish_date = publish_el.text.strip()

    entries = []
    alias_list = []
    address_list = []
    id_list = []

    sdn_entries = root.findall(ns("sdnEntry"))
    print(f"[SDN] Found {len(sdn_entries)} entries in XML")

    for entry in sdn_entries:
        uid = get_text(entry, "uid")
        sdn_type = get_text(entry, "sdnType")

        # Build full name
        first = get_text(entry, "firstName") or ""
        last = get_text(entry, "lastName") or ""
        name = f"{first} {last}".strip() if first else last or ""

        if not name:
            continue

        # Entity type mapping
        entity_type = "entity"
        if sdn_type == "Individual":
            entity_type = "individual"
        elif sdn_type == "Vessel":
            entity_type = "vessel"
        elif sdn_type == "Aircraft":
            entity_type = "aircraft"

        # Programs
        programs = []
        program_list = entry.find(ns("programList"))
        if program_list is not None:
            for prog in program_list.findall(ns("program")):
                if prog.text:
                    programs.append(prog.text.strip())

        # Nationality / country
        nationality = None
        nationality_el = entry.find(f"{ns('nationalityList')}/{ns('nationality')}/{ns('country')}")
        if nationality_el is not None and nationality_el.text:
            nationality = country_to_iso2(nationality_el.text.strip())

        # Remarks
        remarks = get_text(entry, "remarks")

        # Vessel/aircraft details
        title = get_text(entry, "title")
        call_sign = get_text(entry, "callSign")
        tonnage = get_text(entry, "tonnage")
        grt = get_text(entry, "grossRegisteredTonnage")
        vessel_flag = get_text(entry, "vesselFlag")
        vessel_type = get_text(entry, "vesselType")

        entry_data = {
            "source": "OFAC_SDN",
            "source_id": uid,
            "entity_type": entity_type,
            "name": name,
            "country": nationality,
            "programs": programs,
            "remarks": remarks,
            "sdn_type": sdn_type,
            "title": title,
            "call_sign": call_sign,
            "tonnage": tonnage,
            "grt": grt,
            "vessel_flag": vessel_flag,
            "vessel_type": vessel_type,
            "is_active": True,
        }
        entries.append(entry_data)

        # Parse aliases (akaList)
        aka_list = entry.find(ns("akaList"))
        if aka_list is not None:
            for aka in aka_list.findall(ns("aka")):
                aka_type_el = aka.find(ns("type"))
                aka_type = aka_type_el.text.strip() if aka_type_el is not None and aka_type_el.text else "a.k.a."

                first_a = get_text(aka, "firstName") or ""
                last_a = get_text(aka, "lastName") or ""
                alias_name = f"{first_a} {last_a}".strip() if first_a else last_a or ""

                if alias_name:
                    category = get_text(aka, "category")
                    is_weak = category == "weak" if category else False
                    alias_list.append({
                        "source_id": uid,
                        "alias_type": aka_type,
                        "alias_name": alias_name,
                        "is_weak": is_weak,
                    })

        # Parse addresses
        addr_list_el = entry.find(ns("addressList"))
        if addr_list_el is not None:
            for addr in addr_list_el.findall(ns("address")):
                addr_country = get_text(addr, "country")
                # Combine address1 + address2 + address3
                addr_parts = [get_text(addr, "address1"), get_text(addr, "address2"), get_text(addr, "address3")]
                full_address = ", ".join(p for p in addr_parts if p)
                address_list.append({
                    "source_id": uid,
                    "address": full_address or None,
                    "city": get_text(addr, "city"),
                    "state": get_text(addr, "stateOrProvince"),
                    "postal_code": get_text(addr, "postalCode"),
                    "country": country_to_iso2(addr_country) if addr_country else None,
                })

                # If no nationality, use first address country
                if not nationality and addr_country:
                    nationality = country_to_iso2(addr_country)
                    entry_data["country"] = nationality

        # Parse IDs
        id_list_el = entry.find(ns("idList"))
        if id_list_el is not None:
            for id_el in id_list_el.findall(ns("id")):
                id_list.append({
                    "source_id": uid,
                    "id_type": get_text(id_el, "idType"),
                    "id_number": get_text(id_el, "idNumber"),
                    "id_country": country_to_iso2(get_text(id_el, "idCountry")) if get_text(id_el, "idCountry") else None,
                    "issue_date": get_text(id_el, "issueDate"),
                    "expiration_date": get_text(id_el, "expirationDate"),
                })

    print(f"[SDN] Parsed: {len(entries)} entries, {len(alias_list)} aliases, {len(address_list)} addresses, {len(id_list)} IDs")
    return {
        "entries": entries,
        "aliases": alias_list,
        "addresses": address_list,
        "ids": id_list,
        "publish_date": publish_date,
    }

# ─── Database Operations ──────────────────────────

def run_sql(query):
    """Execute SQL via Supabase Management API (curl — urllib blocked by Cloudflare)."""
    import subprocess
    url = f"https://api.supabase.com/v1/projects/{PROJECT_ID}/database/query"
    payload = json.dumps({"query": query})
    try:
        result = subprocess.run(
            ["curl", "-s", "-X", "POST", url,
             "-H", f"Authorization: Bearer {MGMT_TOKEN}",
             "-H", "Content-Type: application/json",
             "-d", payload],
            capture_output=True, text=True, timeout=60
        )
        if result.returncode != 0:
            print(f"[SDN] curl error: {result.stderr}")
            return None
        body = result.stdout.strip()
        if not body:
            return None
        parsed = json.loads(body)
        if isinstance(parsed, list):
            return parsed
        if isinstance(parsed, dict) and "error" in parsed:
            print(f"[SDN] SQL API error: {parsed['error']}")
            return None
        return parsed
    except Exception as e:
        print(f"[SDN] SQL error: {e}")
        return None

def escape_sql(val):
    """Escape a string for SQL."""
    if val is None:
        return "NULL"
    return "'" + str(val).replace("'", "''") + "'"

def format_array(arr):
    """Format Python list as PostgreSQL array literal."""
    if not arr:
        return "ARRAY[]::text[]"
    items = ",".join(escape_sql(x) for x in arr)
    return f"ARRAY[{items}]"

def load_to_db(parsed_data, file_hash):
    """Load parsed SDN data into Supabase."""
    entries = parsed_data["entries"]
    aliases = parsed_data["aliases"]
    addresses = parsed_data["addresses"]
    ids = parsed_data["ids"]
    publish_date = parsed_data["publish_date"]

    # Step 1: Clear existing OFAC_SDN data (full refresh)
    print("[SDN] Clearing existing OFAC_SDN entries...")
    run_sql("DELETE FROM sanctions_ids WHERE entry_id IN (SELECT id FROM sanctions_entries WHERE source = 'OFAC_SDN');")
    run_sql("DELETE FROM sanctions_addresses WHERE entry_id IN (SELECT id FROM sanctions_entries WHERE source = 'OFAC_SDN');")
    run_sql("DELETE FROM sanctions_aliases WHERE entry_id IN (SELECT id FROM sanctions_entries WHERE source = 'OFAC_SDN');")
    run_sql("DELETE FROM sanctions_entries WHERE source = 'OFAC_SDN';")

    # Step 2: Insert entries in batches
    BATCH_SIZE = 200
    source_id_to_db_id = {}
    total = len(entries)

    for i in range(0, total, BATCH_SIZE):
        batch = entries[i:i + BATCH_SIZE]
        values = []
        for e in batch:
            vals = (
                f"({escape_sql(e['source'])}, {escape_sql(e['source_id'])}, "
                f"{escape_sql(e['entity_type'])}, {escape_sql(e['name'])}, "
                f"{escape_sql(e['country'])}, {format_array(e['programs'])}, "
                f"{escape_sql(e['remarks'])}, {escape_sql(e['sdn_type'])}, "
                f"{escape_sql(e['title'])}, {escape_sql(e['call_sign'])}, "
                f"{escape_sql(e['tonnage'])}, {escape_sql(e['grt'])}, "
                f"{escape_sql(e['vessel_flag'])}, {escape_sql(e['vessel_type'])}, true)"
            )
            values.append(vals)

        sql = (
            "INSERT INTO sanctions_entries "
            "(source, source_id, entity_type, name, country, programs, remarks, "
            "sdn_type, title, call_sign, tonnage, grt, vessel_flag, vessel_type, is_active) "
            f"VALUES {','.join(values)} "
            "ON CONFLICT (source, source_id) DO UPDATE SET "
            "name = EXCLUDED.name, country = EXCLUDED.country, programs = EXCLUDED.programs, "
            "remarks = EXCLUDED.remarks, is_active = true, updated_at = now() "
            "RETURNING id, source_id;"
        )
        result = run_sql(sql)
        if result and isinstance(result, list):
            for row in result:
                if isinstance(row, dict) and "source_id" in row and "id" in row:
                    source_id_to_db_id[str(row["source_id"])] = row["id"]

        done = min(i + BATCH_SIZE, total)
        print(f"[SDN] Entries: {done}/{total}")

    # Step 3: Insert aliases
    if aliases:
        print(f"[SDN] Inserting {len(aliases)} aliases...")
        for i in range(0, len(aliases), BATCH_SIZE):
            batch = aliases[i:i + BATCH_SIZE]
            values = []
            for a in batch:
                db_id = source_id_to_db_id.get(str(a["source_id"]))
                if not db_id:
                    continue
                vals = (
                    f"({db_id}, {escape_sql(a['alias_type'])}, "
                    f"{escape_sql(a['alias_name'])}, {str(a['is_weak']).lower()})"
                )
                values.append(vals)
            if values:
                sql = (
                    "INSERT INTO sanctions_aliases (entry_id, alias_type, alias_name, is_weak) "
                    f"VALUES {','.join(values)};"
                )
                run_sql(sql)
            done = min(i + BATCH_SIZE, len(aliases))
            if done % 1000 == 0 or done == len(aliases):
                print(f"[SDN] Aliases: {done}/{len(aliases)}")

    # Step 4: Insert addresses
    if addresses:
        print(f"[SDN] Inserting {len(addresses)} addresses...")
        for i in range(0, len(addresses), BATCH_SIZE):
            batch = addresses[i:i + BATCH_SIZE]
            values = []
            for a in batch:
                db_id = source_id_to_db_id.get(str(a["source_id"]))
                if not db_id:
                    continue
                vals = (
                    f"({db_id}, {escape_sql(a['address'])}, {escape_sql(a['city'])}, "
                    f"{escape_sql(a['state'])}, {escape_sql(a['postal_code'])}, "
                    f"{escape_sql(a['country'])})"
                )
                values.append(vals)
            if values:
                sql = (
                    "INSERT INTO sanctions_addresses (entry_id, address, city, state, postal_code, country) "
                    f"VALUES {','.join(values)};"
                )
                run_sql(sql)

    # Step 5: Insert IDs
    if ids:
        print(f"[SDN] Inserting {len(ids)} IDs...")
        for i in range(0, len(ids), BATCH_SIZE):
            batch = ids[i:i + BATCH_SIZE]
            values = []
            for d in batch:
                db_id = source_id_to_db_id.get(str(d["source_id"]))
                if not db_id:
                    continue
                vals = (
                    f"({db_id}, {escape_sql(d['id_type'])}, {escape_sql(d['id_number'])}, "
                    f"{escape_sql(d['id_country'])}, {escape_sql(d['issue_date'])}, "
                    f"{escape_sql(d['expiration_date'])})"
                )
                values.append(vals)
            if values:
                sql = (
                    "INSERT INTO sanctions_ids (entry_id, id_type, id_number, id_country, issue_date, expiration_date) "
                    f"VALUES {','.join(values)};"
                )
                run_sql(sql)

    # Step 6: Update load metadata
    run_sql(
        f"INSERT INTO sanctions_load_meta (source, last_loaded_at, record_count, publish_date, file_hash) "
        f"VALUES ('OFAC_SDN', now(), {len(entries)}, {escape_sql(publish_date)}, {escape_sql(file_hash)}) "
        f"ON CONFLICT (source) DO UPDATE SET "
        f"last_loaded_at = now(), record_count = {len(entries)}, "
        f"publish_date = {escape_sql(publish_date)}, file_hash = {escape_sql(file_hash)};"
    )

    print(f"[SDN] ✅ Load complete: {len(entries)} entries, {len(aliases)} aliases, {len(addresses)} addresses, {len(ids)} IDs")

def check_update_needed(file_hash):
    """Check if the SDN file has changed since last load."""
    result = run_sql("SELECT file_hash, last_loaded_at, record_count FROM sanctions_load_meta WHERE source = 'OFAC_SDN';")
    if not result or len(result) == 0:
        return True, "No previous load found"
    prev = result[0]
    if prev["file_hash"] == file_hash:
        return False, f"No change (last loaded: {prev['last_loaded_at']}, {prev['record_count']} records)"
    return True, f"File changed (prev hash: {prev['file_hash'][:16]}...)"

# ─── Main ──────────────────────────────────────────

def main():
    parser = argparse.ArgumentParser(description="Import OFAC SDN list to POTAL DB")
    parser.add_argument("--check-only", action="store_true", help="Only check if update is available")
    parser.add_argument("--dry-run", action="store_true", help="Parse without writing to DB")
    parser.add_argument("--force", action="store_true", help="Force reload even if no change")
    args = parser.parse_args()

    start = datetime.now(timezone.utc)
    print(f"[SDN] OFAC SDN Importer — {start.strftime('%Y-%m-%d %H:%M:%S UTC')}")

    # Download
    xml_data = download_sdn_xml()
    file_hash = compute_hash(xml_data)
    print(f"[SDN] File hash: {file_hash[:16]}...")

    # Check if update needed
    if not args.force:
        needed, reason = check_update_needed(file_hash)
        print(f"[SDN] Update needed: {needed} — {reason}")
        if not needed:
            print("[SDN] Skipping (no change). Use --force to reload.")
            return
        if args.check_only:
            return

    # Parse
    parsed = parse_sdn_xml(xml_data)

    if args.dry_run:
        print("[SDN] DRY RUN — not writing to DB")
        print(f"[SDN] Would load: {len(parsed['entries'])} entries")
        # Print sample
        for e in parsed["entries"][:5]:
            print(f"  - {e['name']} ({e['country']}) [{','.join(e['programs'][:2])}]")
        return

    # Load
    load_to_db(parsed, file_hash)

    elapsed = (datetime.now(timezone.utc) - start).total_seconds()
    print(f"[SDN] Done in {elapsed:.1f}s")

if __name__ == "__main__":
    main()
