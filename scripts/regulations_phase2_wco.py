#!/usr/bin/env python3
"""
POTAL Regulations Phase 2 — WCO HS Code Reference Data
Collects publicly available HS Code structure and section/chapter notes.

Source: WCO public resources + wcoomd.org
Output: /Volumes/soulmaten/POTAL/regulations/international/wco/

Data collected:
1. hs2022_sections.json — 21 sections of HS 2022
2. hs2022_chapters.json — 97 chapters with notes
3. hs2022_headings.json — ~1,200 headings (4-digit) from our existing DB
"""

import os
import json
import time
import sys
from urllib.request import Request, urlopen
from urllib.error import HTTPError, URLError

OUTPUT_DIR = "/Volumes/soulmaten/POTAL/regulations/international/wco"

# ─── HS 2022 Section/Chapter Structure ────────────────
# This is public domain data from the WCO HS Convention

HS_SECTIONS = [
    {"number": "I", "title": "Live animals; animal products", "chapters": "01-05"},
    {"number": "II", "title": "Vegetable products", "chapters": "06-14"},
    {"number": "III", "title": "Animal or vegetable fats and oils", "chapters": "15"},
    {"number": "IV", "title": "Prepared foodstuffs; beverages, spirits, vinegar; tobacco", "chapters": "16-24"},
    {"number": "V", "title": "Mineral products", "chapters": "25-27"},
    {"number": "VI", "title": "Products of the chemical or allied industries", "chapters": "28-38"},
    {"number": "VII", "title": "Plastics and articles thereof; rubber and articles thereof", "chapters": "39-40"},
    {"number": "VIII", "title": "Raw hides and skins, leather, furskins and articles thereof", "chapters": "41-43"},
    {"number": "IX", "title": "Wood and articles of wood; wood charcoal; cork; manufactures of straw", "chapters": "44-46"},
    {"number": "X", "title": "Pulp of wood or other fibrous cellulosic material; paper and paperboard", "chapters": "47-49"},
    {"number": "XI", "title": "Textiles and textile articles", "chapters": "50-63"},
    {"number": "XII", "title": "Footwear, headgear, umbrellas, sun umbrellas, walking sticks, whips", "chapters": "64-67"},
    {"number": "XIII", "title": "Articles of stone, plaster, cement, asbestos, mica; ceramic products; glass", "chapters": "68-70"},
    {"number": "XIV", "title": "Natural or cultured pearls, precious or semi-precious stones, precious metals", "chapters": "71"},
    {"number": "XV", "title": "Base metals and articles of base metal", "chapters": "72-83"},
    {"number": "XVI", "title": "Machinery and mechanical appliances; electrical equipment; parts thereof", "chapters": "84-85"},
    {"number": "XVII", "title": "Vehicles, aircraft, vessels and associated transport equipment", "chapters": "86-89"},
    {"number": "XVIII", "title": "Optical, photographic, cinematographic, measuring, checking, precision instruments", "chapters": "90-92"},
    {"number": "XIX", "title": "Arms and ammunition; parts and accessories thereof", "chapters": "93"},
    {"number": "XX", "title": "Miscellaneous manufactured articles", "chapters": "94-96"},
    {"number": "XXI", "title": "Works of art, collectors' pieces and antiques", "chapters": "97"},
]

# Chapter titles (all 97 chapters)
HS_CHAPTERS = {
    1: "Live animals", 2: "Meat and edible meat offal", 3: "Fish and crustaceans",
    4: "Dairy produce; birds' eggs; natural honey", 5: "Products of animal origin, not elsewhere specified",
    6: "Live trees and other plants; bulbs, roots; cut flowers", 7: "Edible vegetables",
    8: "Edible fruit and nuts; peel of citrus fruit or melons", 9: "Coffee, tea, mate and spices",
    10: "Cereals", 11: "Products of the milling industry; malt; starches; inulin; wheat gluten",
    12: "Oil seeds and oleaginous fruits; miscellaneous grains, seeds and fruit",
    13: "Lac; gums, resins and other vegetable saps and extracts",
    14: "Vegetable plaiting materials; vegetable products not elsewhere specified",
    15: "Animal or vegetable fats and oils",
    16: "Preparations of meat, fish or crustaceans", 17: "Sugars and sugar confectionery",
    18: "Cocoa and cocoa preparations", 19: "Preparations of cereals, flour, starch or milk",
    20: "Preparations of vegetables, fruit, nuts", 21: "Miscellaneous edible preparations",
    22: "Beverages, spirits and vinegar", 23: "Residues and waste from the food industries",
    24: "Tobacco and manufactured tobacco substitutes",
    25: "Salt; sulphur; earths and stone; plastering materials, lime and cement",
    26: "Ores, slag and ash", 27: "Mineral fuels, mineral oils and products of their distillation",
    28: "Inorganic chemicals", 29: "Organic chemicals",
    30: "Pharmaceutical products", 31: "Fertilisers",
    32: "Tanning or dyeing extracts; tannins and their derivatives; dyes, pigments",
    33: "Essential oils and resinoids; perfumery, cosmetic or toilet preparations",
    34: "Soap, organic surface-active agents, washing preparations",
    35: "Albuminoidal substances; modified starches; glues; enzymes",
    36: "Explosives; pyrotechnic products; matches; pyrophoric alloys",
    37: "Photographic or cinematographic goods",
    38: "Miscellaneous chemical products",
    39: "Plastics and articles thereof", 40: "Rubber and articles thereof",
    41: "Raw hides and skins (other than furskins) and leather",
    42: "Articles of leather; saddlery and harness; travel goods",
    43: "Furskins and artificial fur; manufactures thereof",
    44: "Wood and articles of wood; wood charcoal",
    45: "Cork and articles of cork", 46: "Manufactures of straw, of esparto or of other plaiting materials",
    47: "Pulp of wood or of other fibrous cellulosic material",
    48: "Paper and paperboard; articles of paper pulp", 49: "Printed books, newspapers, pictures",
    50: "Silk", 51: "Wool, fine or coarse animal hair; horsehair yarn and woven fabric",
    52: "Cotton", 53: "Other vegetable textile fibres; paper yarn and woven fabrics",
    54: "Man-made filaments; strip and the like of man-made textile materials",
    55: "Man-made staple fibres", 56: "Wadding, felt and nonwovens; special yarns; twine, cordage",
    57: "Carpets and other textile floor coverings",
    58: "Special woven fabrics; tufted textile fabrics; lace; tapestries",
    59: "Impregnated, coated, covered or laminated textile fabrics",
    60: "Knitted or crocheted fabrics", 61: "Articles of apparel and clothing accessories, knitted",
    62: "Articles of apparel and clothing accessories, not knitted",
    63: "Other made up textile articles; sets; worn clothing",
    64: "Footwear, gaiters and the like; parts of such articles",
    65: "Headgear and parts thereof", 66: "Umbrellas, sun umbrellas, walking sticks, seat-sticks, whips",
    67: "Prepared feathers and down; artificial flowers",
    68: "Articles of stone, plaster, cement, asbestos, mica",
    69: "Ceramic products", 70: "Glass and glassware",
    71: "Natural or cultured pearls, precious or semi-precious stones, precious metals",
    72: "Iron and steel", 73: "Articles of iron or steel",
    74: "Copper and articles thereof", 75: "Nickel and articles thereof",
    76: "Aluminium and articles thereof",
    78: "Lead and articles thereof", 79: "Zinc and articles thereof",
    80: "Tin and articles thereof", 81: "Other base metals; cermets; articles thereof",
    82: "Tools, implements, cutlery, spoons and forks, of base metal",
    83: "Miscellaneous articles of base metal",
    84: "Nuclear reactors, boilers, machinery and mechanical appliances",
    85: "Electrical machinery and equipment and parts thereof",
    86: "Railway or tramway locomotives, rolling stock and parts thereof",
    87: "Vehicles other than railway or tramway rolling stock",
    88: "Aircraft, spacecraft, and parts thereof",
    89: "Ships, boats and floating structures",
    90: "Optical, photographic, cinematographic, measuring, checking, precision instruments",
    91: "Clocks and watches and parts thereof",
    92: "Musical instruments; parts and accessories",
    93: "Arms and ammunition; parts and accessories thereof",
    94: "Furniture; bedding, mattresses; lamps and lighting fittings",
    95: "Toys, games and sports requisites; parts and accessories thereof",
    96: "Miscellaneous manufactured articles",
    97: "Works of art, collectors' pieces and antiques",
}


def save_json(data, filepath: str):
    os.makedirs(os.path.dirname(filepath), exist_ok=True)
    with open(filepath, "w", encoding="utf-8") as f:
        json.dump(data, f, ensure_ascii=False, indent=2)
    size = os.path.getsize(filepath)
    print(f"  Saved: {filepath} ({size:,} bytes)")


def collect_hs_structure():
    """Save HS 2022 section and chapter structure."""
    print("\n[1/3] Saving HS 2022 sections...")
    save_json(HS_SECTIONS, os.path.join(OUTPUT_DIR, "hs2022_sections.json"))
    print(f"  Sections: {len(HS_SECTIONS)}")

    print("\n[2/3] Saving HS 2022 chapters...")
    chapters_list = [{"chapter": k, "title": v} for k, v in sorted(HS_CHAPTERS.items())]
    save_json(chapters_list, os.path.join(OUTPUT_DIR, "hs2022_chapters.json"))
    print(f"  Chapters: {len(chapters_list)}")


def collect_hs_from_db():
    """Extract HS 6-digit headings from POTAL's existing Supabase data via Management API."""
    print("\n[3/3] Extracting HS 6-digit codes from POTAL DB...")

    mgmt_token = os.environ.get("SUPABASE_MGMT_TOKEN", "")
    if not mgmt_token:
        print("  SUPABASE_MGMT_TOKEN not set, skipping DB extraction")
        print("  (HS codes already available in gov_tariff_schedules table)")
        return

    import subprocess
    result = subprocess.run([
        "curl", "-s", "-X", "POST",
        "https://api.supabase.com/v1/projects/zyurflkhiregundhisky/database/query",
        "-H", f"Authorization: Bearer {mgmt_token}",
        "-H", "Content-Type: application/json",
        "-d", json.dumps({"query": """
            SELECT DISTINCT hs6_code, description
            FROM product_hs_mappings
            ORDER BY hs6_code
            LIMIT 2000
        """})
    ], capture_output=True, text=True, timeout=30)

    if result.returncode == 0:
        try:
            data = json.loads(result.stdout)
            if isinstance(data, list) and len(data) > 0:
                save_json(data, os.path.join(OUTPUT_DIR, "potal_hs6_mappings.json"))
                print(f"  HS6 codes from DB: {len(data)}")
            else:
                print(f"  No data returned or unexpected format")
        except json.JSONDecodeError:
            print(f"  Failed to parse DB response")
    else:
        print(f"  DB query failed: {result.stderr[:200]}")


def main():
    print("=" * 60)
    print("POTAL Phase 2 — WCO HS Code Reference Data")
    print(f"Output: {OUTPUT_DIR}")
    print("=" * 60)

    if not os.path.exists(os.path.dirname(OUTPUT_DIR)):
        print("ERROR: External drive not mounted")
        sys.exit(1)

    collect_hs_structure()
    collect_hs_from_db()

    total_files = sum(1 for _, _, files in os.walk(OUTPUT_DIR) for f in files)
    total_size = sum(os.path.getsize(os.path.join(r, f)) for r, _, files in os.walk(OUTPUT_DIR) for f in files)
    print(f"\n  WCO total: {total_files} files, {total_size / 1024:.1f} KB")
    print("=" * 60)


if __name__ == "__main__":
    main()
