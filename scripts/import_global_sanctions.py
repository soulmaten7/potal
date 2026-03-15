#!/usr/bin/env python3
"""
POTAL F023 — Global Sanctions Import Script

Downloads and imports sanctions data from:
  1. EU CFSP Consolidated Sanctions List (XML)
  2. UK OFSI Consolidated List (CSV)
  3. UN Security Council Consolidated List (XML)

Inserts into Supabase sanctions_entries table.
Deduplication: ON CONFLICT DO NOTHING on (source, source_id).

Usage:
  python3 scripts/import_global_sanctions.py [--source eu|uk|un|all]
"""

import os
import sys
import csv
import json
import time
import argparse
import urllib.request
import xml.etree.ElementTree as ET
from io import StringIO

SUPABASE_URL = os.environ.get("NEXT_PUBLIC_SUPABASE_URL", "https://zyurflkhiregundhisky.supabase.co")
SUPABASE_KEY = os.environ.get("SUPABASE_SERVICE_ROLE_KEY", "")
MGMT_TOKEN = os.environ.get("SUPABASE_MGMT_TOKEN", "sbp_c96b42dce1f4204ae9f03b776ea42087a8dd6b6a")
PROJECT_ID = "zyurflkhiregundhisky"

EU_URL = "https://webgate.ec.europa.eu/fsd/fsf/public/files/xmlFullSanctionsList_1_1/content"
UK_URL = "https://ofsistorage.blob.core.windows.net/publishlive/2022format/ConList.csv"
UN_URL = "https://scsanctions.un.org/resources/xml/en/consolidated.xml"

BATCH_SIZE = 200


def run_sql(query: str):
    """Execute SQL via Supabase Management API."""
    import urllib.request
    url = f"https://api.supabase.com/v1/projects/{PROJECT_ID}/database/query"
    data = json.dumps({"query": query}).encode()
    req = urllib.request.Request(url, data=data, method="POST")
    req.add_header("Authorization", f"Bearer {MGMT_TOKEN}")
    req.add_header("Content-Type", "application/json")
    try:
        with urllib.request.urlopen(req, timeout=60) as resp:
            return json.loads(resp.read())
    except Exception as e:
        print(f"  SQL error: {e}")
        return None


def insert_batch(entries: list):
    """Insert a batch of sanctions entries via SQL."""
    if not entries:
        return 0

    values = []
    for e in entries:
        source = e.get("source", "").replace("'", "''")
        source_id = e.get("source_id", "").replace("'", "''")
        entity_type = e.get("entity_type", "entity").replace("'", "''")
        name = e.get("name", "").replace("'", "''")[:500]
        country = e.get("country", "").replace("'", "''")[:2] if e.get("country") else "NULL"
        programs_arr = e.get("programs", [])
        programs = "ARRAY[" + ",".join(f"'{p.replace(chr(39), chr(39)+chr(39))}'" for p in programs_arr) + "]::text[]" if programs_arr else "ARRAY[]::text[]"
        remarks = (e.get("remarks") or "").replace("'", "''")[:1000]

        country_val = f"'{country}'" if country != "NULL" else "NULL"
        values.append(
            f"('{source}','{source_id}','{entity_type}','{name}',{country_val},{programs},'{remarks}')"
        )

    sql = f"""INSERT INTO sanctions_entries (source, source_id, entity_type, name, country, programs, remarks)
VALUES {','.join(values)}
ON CONFLICT DO NOTHING;"""

    result = run_sql(sql)
    return len(entries) if result is not None else 0


def download(url: str, timeout: int = 120) -> bytes:
    """Download URL content."""
    print(f"  Downloading: {url[:80]}...")
    req = urllib.request.Request(url)
    req.add_header("User-Agent", "POTAL-Sanctions-Importer/1.0")
    with urllib.request.urlopen(req, timeout=timeout) as resp:
        return resp.read()


def import_eu_sanctions():
    """Import EU CFSP Consolidated Sanctions List."""
    print("\n=== EU CFSP Sanctions ===")
    try:
        xml_data = download(EU_URL, timeout=180)
    except Exception as e:
        print(f"  Download failed: {e}")
        return 0

    print(f"  Downloaded {len(xml_data):,} bytes, parsing XML...")
    root = ET.fromstring(xml_data)

    # EU XML namespace
    ns = {}
    for event, elem in ET.iterparse(StringIO(xml_data.decode("utf-8", errors="replace")), events=["start-ns"]):
        if event == "start-ns":
            prefix, uri = elem
            ns[prefix or "default"] = uri

    entries = []
    # Try common EU sanctions XML structures
    for entity in root.iter():
        tag = entity.tag.split("}")[-1] if "}" in entity.tag else entity.tag
        if tag in ("sanctionEntity", "Entity", "NameAlias"):
            continue
        if tag == "SubjectType" or not entity.text:
            continue

    # Simpler approach: iterate all entity-like elements
    count = 0
    for elem in root.iter():
        tag = elem.tag.split("}")[-1] if "}" in elem.tag else elem.tag
        if tag not in ("sanctionEntity", "entity"):
            continue

        entity_id = elem.get("euReferenceNumber") or elem.get("logicalId") or str(count)
        entity_type = "entity"

        # Get subject type
        for st in elem.iter():
            st_tag = st.tag.split("}")[-1] if "}" in st.tag else st.tag
            if st_tag == "subjectType":
                code = st.get("code", "").lower()
                if "person" in code or "individual" in code:
                    entity_type = "individual"
                elif "enterprise" in code or "entity" in code:
                    entity_type = "entity"

        # Get names
        names = []
        for na in elem.iter():
            na_tag = na.tag.split("}")[-1] if "}" in na.tag else na.tag
            if na_tag in ("nameAlias", "wholeName", "name"):
                name_text = na.get("wholeName") or na.text or ""
                if name_text.strip():
                    names.append(name_text.strip())

        # Get regulation (program)
        programs = []
        for reg in elem.iter():
            reg_tag = reg.tag.split("}")[-1] if "}" in reg.tag else reg.tag
            if reg_tag in ("regulation", "programme"):
                prog = reg.get("programme") or reg.get("numberTitle") or reg.text or ""
                if prog.strip():
                    programs.append(prog.strip()[:100])

        if not names:
            continue

        entries.append({
            "source": "EU_SANCTIONS",
            "source_id": str(entity_id),
            "entity_type": entity_type,
            "name": names[0][:500],
            "country": None,
            "programs": programs[:5] or ["EU_CFSP"],
            "remarks": f"Aliases: {'; '.join(names[1:4])}" if len(names) > 1 else "",
        })
        count += 1

    print(f"  Parsed {len(entries)} EU entities")

    # Insert in batches
    inserted = 0
    for i in range(0, len(entries), BATCH_SIZE):
        batch = entries[i:i + BATCH_SIZE]
        inserted += insert_batch(batch)
        print(f"  Inserted batch {i // BATCH_SIZE + 1} ({inserted}/{len(entries)})")
        time.sleep(0.5)

    print(f"  EU import complete: {inserted} entries")
    return inserted


def import_uk_sanctions():
    """Import UK OFSI Consolidated List."""
    print("\n=== UK OFSI Sanctions ===")
    try:
        csv_data = download(UK_URL)
    except Exception as e:
        print(f"  Download failed: {e}")
        return 0

    text = csv_data.decode("utf-8", errors="replace")
    reader = csv.DictReader(StringIO(text))

    entries = []
    seen = set()

    for row in reader:
        name = row.get("Name 6", "") or ""
        # Build full name from name parts
        parts = []
        for i in range(1, 7):
            part = row.get(f"Name {i}", "")
            if part and part.strip():
                parts.append(part.strip())
        if parts:
            name = " ".join(parts)

        if not name.strip():
            continue

        source_id = row.get("Group ID", "") or row.get("OFSI Group ID", "") or str(len(entries))
        key = f"UK_{source_id}_{name[:50]}"
        if key in seen:
            continue
        seen.add(key)

        entity_type = "individual" if row.get("Group Type", "").lower() in ("individual",) else "entity"
        country = row.get("Country", "")[:2] if row.get("Country") else None
        regime = row.get("Regime", "") or row.get("Listed On", "") or "UK_OFSI"

        entries.append({
            "source": "UK_SANCTIONS",
            "source_id": str(source_id),
            "entity_type": entity_type,
            "name": name[:500],
            "country": country,
            "programs": [regime[:100]] if regime else ["UK_OFSI"],
            "remarks": row.get("Other Information", "")[:1000] if row.get("Other Information") else "",
        })

    print(f"  Parsed {len(entries)} UK entities")

    inserted = 0
    for i in range(0, len(entries), BATCH_SIZE):
        batch = entries[i:i + BATCH_SIZE]
        inserted += insert_batch(batch)
        print(f"  Inserted batch {i // BATCH_SIZE + 1} ({inserted}/{len(entries)})")
        time.sleep(0.5)

    print(f"  UK import complete: {inserted} entries")
    return inserted


def import_un_sanctions():
    """Import UN Security Council Consolidated List."""
    print("\n=== UN Security Council Sanctions ===")
    try:
        xml_data = download(UN_URL, timeout=120)
    except Exception as e:
        print(f"  Download failed: {e}")
        return 0

    print(f"  Downloaded {len(xml_data):,} bytes, parsing XML...")
    root = ET.fromstring(xml_data)

    entries = []

    # UN XML structure: CONSOLIDATED_LIST > INDIVIDUALS/ENTITIES > INDIVIDUAL/ENTITY
    for section_tag, etype in [("INDIVIDUALS", "individual"), ("ENTITIES", "entity")]:
        section = root.find(section_tag)
        if section is None:
            continue

        item_tag = "INDIVIDUAL" if etype == "individual" else "ENTITY"
        for item in section.findall(item_tag):
            dataid = item.find("DATAID")
            source_id = dataid.text if dataid is not None else str(len(entries))

            # Build name
            if etype == "individual":
                first = (item.findtext("FIRST_NAME") or "").strip()
                second = (item.findtext("SECOND_NAME") or "").strip()
                third = (item.findtext("THIRD_NAME") or "").strip()
                fourth = (item.findtext("FOURTH_NAME") or "").strip()
                name = " ".join(p for p in [first, second, third, fourth] if p)
            else:
                name = (item.findtext("FIRST_NAME") or "").strip()

            if not name:
                continue

            # Nationality
            nationality = ""
            nat_elem = item.find("NATIONALITY")
            if nat_elem is not None:
                val = nat_elem.find("VALUE")
                if val is not None and val.text:
                    nationality = val.text.strip()[:2]

            # Listed on / UN List type
            un_list = (item.findtext("UN_LIST_TYPE") or "").strip()
            ref_num = (item.findtext("REFERENCE_NUMBER") or "").strip()

            entries.append({
                "source": "UN_SANCTIONS",
                "source_id": str(source_id),
                "entity_type": etype,
                "name": name[:500],
                "country": nationality or None,
                "programs": [un_list or "UN_SC"],
                "remarks": ref_num,
            })

    print(f"  Parsed {len(entries)} UN entities")

    inserted = 0
    for i in range(0, len(entries), BATCH_SIZE):
        batch = entries[i:i + BATCH_SIZE]
        inserted += insert_batch(batch)
        print(f"  Inserted batch {i // BATCH_SIZE + 1} ({inserted}/{len(entries)})")
        time.sleep(0.5)

    print(f"  UN import complete: {inserted} entries")
    return inserted


def main():
    parser = argparse.ArgumentParser(description="Import global sanctions data")
    parser.add_argument("--source", choices=["eu", "uk", "un", "all"], default="all")
    args = parser.parse_args()

    print("POTAL Global Sanctions Importer")
    print("=" * 50)

    total = 0
    if args.source in ("eu", "all"):
        total += import_eu_sanctions()
    if args.source in ("uk", "all"):
        total += import_uk_sanctions()
    if args.source in ("un", "all"):
        total += import_un_sanctions()

    print(f"\n{'=' * 50}")
    print(f"Total imported: {total} entries")


if __name__ == "__main__":
    main()
