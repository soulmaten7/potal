#!/usr/bin/env python3
"""
CBP CROSS + EU EBTI → Master Classification Rule Engine
========================================================
Phase 1: Load & unify 451K+ rulings
Phase 2: Classify by Chapter & Category
Phase 3: Extract rules (Level 1-4)
Phase 4: Category fallback for boundary cases
Phase 5: Generate master engine JSON + report

Usage:
  python3 scripts/build_classification_engine.py
"""

import csv
import json
import os
import re
import sys
import time
from collections import defaultdict, Counter
from datetime import datetime

# ─── Paths ────────────────────────────────────────────────────
CBP_COMBINED = "/Volumes/soulmaten/POTAL/cbp_cross_combined_mappings.csv"
CBP_DETAILED = "/Volumes/soulmaten/POTAL/cbp_cross_hs_mappings.csv"
CBP_SEARCH_DIR = "/Volumes/soulmaten/POTAL/regulations/us/cross_rulings/search_batches"
EBTI_DB = "/Volumes/soulmaten/POTAL/regulations/eu_ebti/ebti_for_db.csv"
EBTI_RAW = "/Volumes/soulmaten/POTAL/regulations/eu_ebti/ebti_rulings.csv"
OUTPUT_DIR = "/Volumes/soulmaten/POTAL/7field_benchmark"
csv.field_size_limit(10_000_000)

# ─── Chapter names ────────────────────────────────────────────
CHAPTER_NAMES = {
    "01": "Live animals", "02": "Meat", "03": "Fish", "04": "Dairy/Eggs/Honey",
    "05": "Animal products nes", "06": "Live plants", "07": "Vegetables",
    "08": "Fruits/Nuts", "09": "Coffee/Tea/Spices", "10": "Cereals",
    "11": "Milling products", "12": "Oil seeds", "13": "Lac/Gums/Resins",
    "14": "Vegetable plaiting", "15": "Fats/Oils", "16": "Meat/Fish preparations",
    "17": "Sugars", "18": "Cocoa", "19": "Cereal preparations", "20": "Vegetable preparations",
    "21": "Misc food", "22": "Beverages", "23": "Food residues/Animal feed",
    "24": "Tobacco", "25": "Salt/Sulphur/Earths/Stone", "26": "Ores/Slag/Ash",
    "27": "Mineral fuels/Oils", "28": "Inorganic chemicals", "29": "Organic chemicals",
    "30": "Pharmaceuticals", "31": "Fertilizers", "32": "Tanning/Dyes/Paints",
    "33": "Essential oils/Cosmetics", "34": "Soap/Wax/Candles", "35": "Albuminoids/Glues",
    "36": "Explosives", "37": "Photographic goods", "38": "Chemical products nes",
    "39": "Plastics", "40": "Rubber", "41": "Raw hides/Leather",
    "42": "Leather articles", "43": "Furskins", "44": "Wood",
    "45": "Cork", "46": "Straw/Basketware", "47": "Paper pulp",
    "48": "Paper/Paperboard", "49": "Printed matter", "50": "Silk",
    "51": "Wool", "52": "Cotton", "53": "Vegetable textile fibres",
    "54": "Man-made filaments", "55": "Man-made staple fibres",
    "56": "Wadding/Felt/Nonwovens", "57": "Carpets", "58": "Special woven fabrics",
    "59": "Impregnated textiles", "60": "Knitted fabrics",
    "61": "Knitted apparel", "62": "Woven apparel", "63": "Textile articles nes",
    "64": "Footwear", "65": "Headgear", "66": "Umbrellas",
    "67": "Feather articles", "68": "Stone/Plaster/Cement", "69": "Ceramics",
    "70": "Glass", "71": "Precious stones/Metals/Jewellery",
    "72": "Iron/Steel", "73": "Iron/Steel articles", "74": "Copper",
    "75": "Nickel", "76": "Aluminium", "78": "Lead", "79": "Zinc",
    "80": "Tin", "81": "Other base metals", "82": "Tools/Cutlery",
    "83": "Misc metal articles", "84": "Machinery",
    "85": "Electrical machinery", "86": "Railway", "87": "Vehicles",
    "88": "Aircraft", "89": "Ships/Boats", "90": "Optical/Medical instruments",
    "91": "Clocks/Watches", "92": "Musical instruments",
    "93": "Arms/Ammunition", "94": "Furniture/Bedding/Lamps",
    "95": "Toys/Games/Sports", "96": "Misc manufactured articles", "97": "Art/Antiques",
}

CATEGORY_GROUPS = {
    "Fashion/Textiles": list(range(50, 64)),
    "Food/Agriculture": list(range(1, 25)),
    "Chemicals/Pharma": list(range(28, 39)),
    "Plastics/Rubber": [39, 40],
    "Metals/Steel": list(range(72, 84)),
    "Machinery/Electronics": [84, 85],
    "Vehicles/Transport": list(range(86, 90)),
    "Household/Misc": list(range(64, 72)) + list(range(90, 98)),
    "Wood/Paper": list(range(44, 50)),
    "Minerals/Energy": list(range(25, 28)),
}

# Reverse lookup: chapter_int → category_group
CH_TO_GROUP = {}
for grp, chapters in CATEGORY_GROUPS.items():
    for ch in chapters:
        CH_TO_GROUP[ch] = grp


def log(msg):
    ts = time.strftime("%H:%M:%S")
    print(f"[{ts}] {msg}", flush=True)


# ═══════════════════════════════════════════════════════════════
# Phase 1: Load & Unify
# ═══════════════════════════════════════════════════════════════

def load_cbp_combined():
    """Load CBP CROSS combined mappings (142K)."""
    log("Phase 1.1: Loading CBP CROSS combined (142K)...")
    rulings = {}
    with open(CBP_COMBINED, "r", encoding="utf-8", errors="replace") as f:
        reader = csv.DictReader(f)
        for row in reader:
            rn = (row.get("ruling_number") or "").strip()
            pn = (row.get("product_name") or "").strip()
            hs6 = (row.get("hs6_code") or "").strip()
            hts = (row.get("hts_code") or "").strip()
            ch = (row.get("hs_chapter") or "").strip()
            desc = (row.get("description") or pn).strip()

            if not hs6 or len(hs6) < 2:
                continue

            chapter = ch.zfill(2) if ch else hs6[:2].zfill(2)

            key = f"cbp_{rn}_{hs6}" if rn else f"cbp_{pn[:50]}_{hs6}"
            rulings[key] = {
                "ruling_id": rn or f"CBP_{len(rulings)}",
                "source": "cbp_cross",
                "product_description": pn[:300],
                "full_description": desc[:500],
                "hs6": hs6[:6],
                "hts_code": hts,
                "chapter": chapter,
                "material": "",
                "processing": "",
            }

    log(f"  CBP combined: {len(rulings):,} rulings loaded")
    return rulings


def load_cbp_search_batches():
    """Load CBP CROSS search batches (180K) — structured with tariffs."""
    log("Phase 1.2: Loading CBP CROSS search batches (180K)...")
    rulings = {}
    for fname in sorted(os.listdir(CBP_SEARCH_DIR)):
        if not fname.endswith(".json"):
            continue
        with open(os.path.join(CBP_SEARCH_DIR, fname)) as f:
            batch = json.load(f)
        for entry in batch:
            rn = entry.get("rulingNumber", "")
            subject = (entry.get("subject") or "").strip()
            tariffs = entry.get("tariffs", [])
            category = entry.get("categories", "")

            if not tariffs or category != "Classification":
                continue

            for tariff in tariffs:
                tariff_clean = tariff.replace(".", "")
                hs6 = tariff_clean[:6]
                if len(hs6) < 4:
                    continue
                chapter = hs6[:2].zfill(2)

                key = f"cbp_search_{rn}_{hs6}"
                if key not in rulings:
                    rulings[key] = {
                        "ruling_id": rn,
                        "source": "cbp_cross_search",
                        "product_description": subject[:300],
                        "full_description": subject[:500],
                        "hs6": hs6,
                        "hts_code": tariff,
                        "chapter": chapter,
                        "material": "",
                        "processing": "",
                    }

    log(f"  CBP search: {len(rulings):,} rulings loaded")
    return rulings


def load_ebti():
    """Load EU EBTI structured data (529K)."""
    log("Phase 1.3: Loading EU EBTI (529K)...")
    rulings = {}
    with open(EBTI_DB, "r", encoding="utf-8", errors="replace") as f:
        reader = csv.DictReader(f)
        for row in reader:
            pn = (row.get("product_name") or "").strip()
            hs6 = (row.get("hs6_code") or "").strip()
            hs_full = (row.get("hs_code") or "").strip()
            ref = (row.get("ruling_ref") or "").strip()
            country = (row.get("country") or "EU").strip()

            if not hs6 or len(hs6) < 2 or not pn:
                continue

            chapter = hs6[:2].zfill(2)
            key = f"ebti_{ref}_{hs6}"
            rulings[key] = {
                "ruling_id": ref,
                "source": f"eu_ebti_{country}",
                "product_description": pn[:300],
                "full_description": pn[:500],
                "hs6": hs6[:6],
                "hts_code": hs_full,
                "chapter": chapter,
                "material": "",
                "processing": "",
            }

    log(f"  EBTI: {len(rulings):,} rulings loaded")
    return rulings


def extract_material_processing(rulings):
    """Extract material and processing hints from product descriptions."""
    log("Phase 1.4: Extracting material/processing from descriptions...")

    material_keywords = {
        "steel": "steel", "iron": "iron", "aluminium": "aluminium", "aluminum": "aluminium",
        "copper": "copper", "brass": "brass", "zinc": "zinc", "nickel": "nickel",
        "plastic": "plastic", "polyester": "polyester", "nylon": "nylon",
        "cotton": "cotton", "wool": "wool", "silk": "silk", "linen": "linen",
        "leather": "leather", "rubber": "rubber", "glass": "glass", "ceramic": "ceramic",
        "wood": "wood", "paper": "paper", "cardboard": "paper",
        "stainless": "stainless_steel", "titanium": "titanium",
        "polyethylene": "polyethylene", "polypropylene": "polypropylene",
        "pvc": "pvc", "acrylic": "acrylic", "rayon": "rayon",
        "bamboo": "bamboo", "jute": "jute", "hemp": "hemp",
        "gold": "gold", "silver": "silver", "platinum": "platinum",
        "porcelain": "porcelain", "stone": "stone", "marble": "marble",
        "concrete": "concrete", "cement": "cement",
    }

    processing_keywords = {
        "knitted": "knitted", "knit": "knitted", "woven": "woven", "weave": "woven",
        "printed": "printed", "dyed": "dyed", "coated": "coated",
        "frozen": "frozen", "dried": "dried", "canned": "canned", "preserved": "preserved",
        "raw": "raw", "processed": "processed", "refined": "refined",
        "cast": "cast", "forged": "forged", "stamped": "stamped", "machined": "machined",
        "molded": "molded", "extruded": "extruded", "welded": "welded",
        "assembled": "assembled", "unassembled": "unassembled",
        "organic": "organic", "synthetic": "synthetic", "artificial": "artificial",
        "laminated": "laminated", "embroidered": "embroidered",
        "smoked": "smoked", "salted": "salted", "fermented": "fermented",
        "roasted": "roasted", "ground": "ground",
        "live": "live", "fresh": "fresh", "chilled": "chilled",
    }

    mat_count = 0
    proc_count = 0

    for key, r in rulings.items():
        desc = r["product_description"].lower()

        # Extract materials
        materials = []
        for kw, mat in material_keywords.items():
            if kw in desc:
                materials.append(mat)
        if materials:
            r["material"] = materials[0]  # primary material
            mat_count += 1

        # Extract processing
        processings = []
        for kw, proc in processing_keywords.items():
            if kw in desc:
                processings.append(proc)
        if processings:
            r["processing"] = processings[0]  # primary processing
            proc_count += 1

    log(f"  Material extracted: {mat_count:,} ({mat_count/len(rulings)*100:.1f}%)")
    log(f"  Processing extracted: {proc_count:,} ({proc_count/len(rulings)*100:.1f}%)")


# ═══════════════════════════════════════════════════════════════
# Phase 2: Classify by Chapter & Category
# ═══════════════════════════════════════════════════════════════

def classify_by_chapter(rulings):
    """Group rulings by HS Chapter."""
    log("Phase 2: Classifying by Chapter...")

    by_chapter = defaultdict(list)
    for key, r in rulings.items():
        ch = r["chapter"]
        if ch and len(ch) == 2:
            by_chapter[ch].append(r)

    log(f"  {len(by_chapter)} chapters with rulings")
    for ch in sorted(by_chapter.keys())[:10]:
        name = CHAPTER_NAMES.get(ch, "?")
        log(f"    Ch.{ch} ({name}): {len(by_chapter[ch]):,}")

    return by_chapter


# ═══════════════════════════════════════════════════════════════
# Phase 3: Extract Rules (Level 1-4)
# ═══════════════════════════════════════════════════════════════

def extract_rules(by_chapter):
    """Extract classification rules from chapter-grouped rulings."""
    log("Phase 3: Extracting rules...")

    rules_by_chapter = {}
    total_rules = {"L1": 0, "L2": 0, "L3": 0}

    for ch, rulings_list in sorted(by_chapter.items()):
        ch_int = int(ch) if ch.isdigit() else 0
        ch_name = CHAPTER_NAMES.get(ch, "Unknown")
        group = CH_TO_GROUP.get(ch_int, "Other")

        # Count HS6 distribution within this chapter
        hs6_counter = Counter()
        material_to_hs6 = defaultdict(Counter)
        processing_to_hs6 = defaultdict(Counter)
        mat_proc_to_hs6 = defaultdict(Counter)

        for r in rulings_list:
            hs6 = r["hs6"]
            mat = r["material"]
            proc = r["processing"]

            hs6_counter[hs6] += 1

            if mat:
                material_to_hs6[mat][hs6] += 1
            if proc:
                processing_to_hs6[proc][hs6] += 1
            if mat and proc:
                mat_proc_to_hs6[f"{mat}+{proc}"][hs6] += 1

        # Generate rules
        rules = []

        # Level 1: material → hs6 (>= 80% confidence, >= 5 rulings)
        for mat, hs6_counts in material_to_hs6.items():
            total = sum(hs6_counts.values())
            if total < 5:
                continue
            top_hs6, top_count = hs6_counts.most_common(1)[0]
            confidence = top_count / total
            if confidence >= 0.80:
                rules.append({
                    "rule_id": f"ch{ch}_L1_{mat}",
                    "level": 1,
                    "condition": {"material": mat},
                    "result": {"hs6": top_hs6, "chapter": ch_int, "confidence": round(confidence, 3)},
                    "ruling_count": total,
                    "alternatives": [
                        {"hs6": h, "count": c}
                        for h, c in hs6_counts.most_common(3) if h != top_hs6
                    ][:2],
                })
                total_rules["L1"] += 1

        # Level 2: material + processing → hs6
        for mat_proc, hs6_counts in mat_proc_to_hs6.items():
            total = sum(hs6_counts.values())
            if total < 3:
                continue
            top_hs6, top_count = hs6_counts.most_common(1)[0]
            confidence = top_count / total
            if confidence >= 0.75:
                mat, proc = mat_proc.split("+", 1)
                rules.append({
                    "rule_id": f"ch{ch}_L2_{mat}_{proc}",
                    "level": 2,
                    "condition": {"material": mat, "processing": proc},
                    "result": {"hs6": top_hs6, "chapter": ch_int, "confidence": round(confidence, 3)},
                    "ruling_count": total,
                })
                total_rules["L2"] += 1

        # Level 3: processing → hs6 (within chapter)
        for proc, hs6_counts in processing_to_hs6.items():
            total = sum(hs6_counts.values())
            if total < 5:
                continue
            top_hs6, top_count = hs6_counts.most_common(1)[0]
            confidence = top_count / total
            if confidence >= 0.80:
                rules.append({
                    "rule_id": f"ch{ch}_L3_{proc}",
                    "level": 3,
                    "condition": {"processing": proc},
                    "result": {"hs6": top_hs6, "chapter": ch_int, "confidence": round(confidence, 3)},
                    "ruling_count": total,
                })
                total_rules["L3"] += 1

        # Boundary cases: which other chapters share similar products?
        boundary_cases = []
        desc_words = Counter()
        for r in rulings_list:
            words = set(r["product_description"].lower().split())
            for w in words:
                if len(w) >= 4:
                    desc_words[w] += 1

        rules_by_chapter[ch] = {
            "chapter": ch_int,
            "chapter_name": ch_name,
            "category_group": group,
            "total_rulings": len(rulings_list),
            "unique_hs6": len(hs6_counter),
            "top_hs6": [{"hs6": h, "count": c} for h, c in hs6_counter.most_common(10)],
            "rules": sorted(rules, key=lambda x: (-x["ruling_count"])),
            "top_keywords": [w for w, _ in desc_words.most_common(20)],
        }

    log(f"  Level 1 rules (material→HS6): {total_rules['L1']}")
    log(f"  Level 2 rules (material+processing→HS6): {total_rules['L2']}")
    log(f"  Level 3 rules (processing→HS6): {total_rules['L3']}")
    log(f"  Total: {sum(total_rules.values())}")

    return rules_by_chapter, total_rules


# ═══════════════════════════════════════════════════════════════
# Phase 4: Category Fallback (keyword → chapter mapping)
# ═══════════════════════════════════════════════════════════════

def build_category_fallback(rulings):
    """Build keyword-to-chapter fallback for boundary cases."""
    log("Phase 4: Building category fallback (keyword→chapter)...")

    # Extract meaningful keywords from product descriptions
    keyword_to_chapters = defaultdict(Counter)
    keyword_to_hs6 = defaultdict(Counter)

    # Common product keywords to track
    target_keywords = set()
    word_freq = Counter()

    for key, r in rulings.items():
        desc = r["product_description"].lower()
        words = re.findall(r'[a-z]{4,}', desc)
        for w in words:
            word_freq[w] += 1

    # Keep words that appear 10+ times but aren't too common (< 50K)
    for w, cnt in word_freq.items():
        if 10 <= cnt <= 50000 and len(w) >= 4:
            target_keywords.add(w)

    log(f"  Tracking {len(target_keywords):,} keywords...")

    for key, r in rulings.items():
        desc = r["product_description"].lower()
        ch = r["chapter"]
        hs6 = r["hs6"]
        words = set(re.findall(r'[a-z]{4,}', desc))

        for w in words:
            if w in target_keywords:
                keyword_to_chapters[w][ch] += 1
                keyword_to_hs6[w][hs6] += 1

    # Build fallback: keyword → top chapter mappings
    category_fallback = {}
    ambiguous_count = 0

    for kw, ch_counts in keyword_to_chapters.items():
        total = sum(ch_counts.values())
        if total < 10:
            continue

        top_ch, top_count = ch_counts.most_common(1)[0]
        confidence = top_count / total

        # Get top HS6 for this keyword
        top_hs6_list = keyword_to_hs6[kw].most_common(5)

        entry = {
            "total_rulings": total,
            "chapters": {},
        }

        for ch, cnt in ch_counts.most_common(5):
            ch_int = int(ch) if ch.isdigit() else 0
            entry["chapters"][ch] = {
                "chapter": ch_int,
                "chapter_name": CHAPTER_NAMES.get(ch, "?"),
                "count": cnt,
                "confidence": round(cnt / total, 3),
            }

        # Only keep keywords that are actually useful for disambiguation
        if len(ch_counts) > 1 and confidence < 0.95:
            ambiguous_count += 1

        if total >= 20:
            category_fallback[kw] = entry

    log(f"  Category fallback entries: {len(category_fallback):,}")
    log(f"  Ambiguous keywords (multi-chapter): {ambiguous_count:,}")

    return category_fallback


# ═══════════════════════════════════════════════════════════════
# Phase 5: Generate Output
# ═══════════════════════════════════════════════════════════════

def generate_output(all_rulings, rules_by_chapter, total_rules, category_fallback):
    """Generate master engine JSON and report."""
    log("Phase 5: Generating output files...")

    # ─── Master Engine JSON ───
    engine = {
        "metadata": {
            "total_rulings_analyzed": len(all_rulings),
            "cbp_cross": sum(1 for r in all_rulings.values() if r["source"].startswith("cbp")),
            "eu_ebti": sum(1 for r in all_rulings.values() if r["source"].startswith("eu_ebti")),
            "total_rules": sum(total_rules.values()),
            "rules_by_level": total_rules,
            "chapters_covered": len(rules_by_chapter),
            "category_fallback_keywords": len(category_fallback),
            "last_updated": datetime.now().strftime("%Y-%m-%d"),
            "version": "1.0",
        },
        "rules_by_chapter": rules_by_chapter,
        "category_fallback": category_fallback,
    }

    engine_path = os.path.join(OUTPUT_DIR, "master_classification_engine.json")
    with open(engine_path, "w", encoding="utf-8") as f:
        json.dump(engine, f, indent=2, ensure_ascii=False)
    engine_size = os.path.getsize(engine_path)
    log(f"  Engine: {engine_path} ({engine_size / 1024 / 1024:.1f} MB)")

    # ─── Unified rulings (for reference) ───
    unified_path = os.path.join(OUTPUT_DIR, "unified_rulings.jsonl")
    with open(unified_path, "w", encoding="utf-8") as f:
        for key, r in all_rulings.items():
            f.write(json.dumps(r, ensure_ascii=False) + "\n")
    log(f"  Unified rulings: {unified_path}")

    # ─── Report ───
    report_lines = []
    report_lines.append("# Master Classification Engine Report")
    report_lines.append(f"Generated: {datetime.now().strftime('%Y-%m-%d %H:%M KST')}\n")

    report_lines.append("## Summary")
    report_lines.append(f"- **Total rulings analyzed**: {len(all_rulings):,}")
    report_lines.append(f"  - CBP CROSS: {engine['metadata']['cbp_cross']:,}")
    report_lines.append(f"  - EU EBTI: {engine['metadata']['eu_ebti']:,}")
    report_lines.append(f"- **Total rules extracted**: {sum(total_rules.values()):,}")
    report_lines.append(f"  - Level 1 (material → HS6): {total_rules['L1']}")
    report_lines.append(f"  - Level 2 (material + processing → HS6): {total_rules['L2']}")
    report_lines.append(f"  - Level 3 (processing → HS6): {total_rules['L3']}")
    report_lines.append(f"- **Chapters covered**: {len(rules_by_chapter)}")
    report_lines.append(f"- **Category fallback keywords**: {len(category_fallback):,}")
    report_lines.append(f"- **Engine file size**: {engine_size / 1024 / 1024:.1f} MB\n")

    # Chapter breakdown
    report_lines.append("## Chapter Breakdown\n")
    report_lines.append("| Chapter | Name | Rulings | Rules | Top HS6 |")
    report_lines.append("|---------|------|---------|-------|---------|")

    for ch in sorted(rules_by_chapter.keys()):
        info = rules_by_chapter[ch]
        top_hs6 = info["top_hs6"][0]["hs6"] if info["top_hs6"] else "-"
        report_lines.append(
            f"| {ch} | {info['chapter_name']} | {info['total_rulings']:,} | "
            f"{len(info['rules'])} | {top_hs6} |"
        )

    # Category group summary
    report_lines.append("\n## Category Groups\n")
    report_lines.append("| Group | Chapters | Rulings | Rules |")
    report_lines.append("|-------|----------|---------|-------|")

    group_stats = defaultdict(lambda: {"rulings": 0, "rules": 0, "chapters": []})
    for ch, info in rules_by_chapter.items():
        grp = info["category_group"]
        group_stats[grp]["rulings"] += info["total_rulings"]
        group_stats[grp]["rules"] += len(info["rules"])
        group_stats[grp]["chapters"].append(ch)

    for grp in sorted(group_stats.keys()):
        s = group_stats[grp]
        ch_range = f"{min(s['chapters'])}-{max(s['chapters'])}"
        report_lines.append(f"| {grp} | {ch_range} | {s['rulings']:,} | {s['rules']} |")

    # Material coverage
    report_lines.append("\n## Material Coverage\n")
    mat_counter = Counter()
    for r in all_rulings.values():
        if r["material"]:
            mat_counter[r["material"]] += 1

    report_lines.append("| Material | Rulings |")
    report_lines.append("|----------|---------|")
    for mat, cnt in mat_counter.most_common(20):
        report_lines.append(f"| {mat} | {cnt:,} |")

    # Top ambiguous keywords
    report_lines.append("\n## Top Ambiguous Keywords (multi-chapter)\n")
    report_lines.append("| Keyword | Total | Top Chapter | Conf | 2nd Chapter | Conf |")
    report_lines.append("|---------|-------|-------------|------|-------------|------|")

    ambiguous = []
    for kw, entry in category_fallback.items():
        if len(entry["chapters"]) >= 2 and entry["total_rulings"] >= 50:
            chs = sorted(entry["chapters"].items(), key=lambda x: -x[1]["count"])
            ambiguous.append((kw, entry["total_rulings"], chs))

    for kw, total, chs in sorted(ambiguous, key=lambda x: -x[1])[:30]:
        ch1 = chs[0]
        ch2 = chs[1] if len(chs) > 1 else ("-", {"confidence": 0, "chapter_name": "-"})
        report_lines.append(
            f"| {kw} | {total:,} | Ch.{ch1[0]} ({ch1[1]['chapter_name']}) | "
            f"{ch1[1]['confidence']:.0%} | Ch.{ch2[0]} ({ch2[1]['chapter_name']}) | "
            f"{ch2[1]['confidence']:.0%} |"
        )

    # Coverage analysis
    report_lines.append("\n## Coverage Analysis\n")
    total_with_mat = sum(1 for r in all_rulings.values() if r["material"])
    total_with_proc = sum(1 for r in all_rulings.values() if r["processing"])
    total_with_both = sum(1 for r in all_rulings.values() if r["material"] and r["processing"])
    report_lines.append(f"- Rulings with material identified: {total_with_mat:,} ({total_with_mat/len(all_rulings)*100:.1f}%)")
    report_lines.append(f"- Rulings with processing identified: {total_with_proc:,} ({total_with_proc/len(all_rulings)*100:.1f}%)")
    report_lines.append(f"- Rulings with both: {total_with_both:,} ({total_with_both/len(all_rulings)*100:.1f}%)")
    report_lines.append(f"- Level 1-3 rule-coverable: ~{sum(total_rules.values())} rules")
    report_lines.append(f"- Category fallback keywords: {len(category_fallback):,}")

    report_path = os.path.join(OUTPUT_DIR, "master_engine_report.md")
    with open(report_path, "w", encoding="utf-8") as f:
        f.write("\n".join(report_lines))
    log(f"  Report: {report_path}")

    return engine


# ═══════════════════════════════════════════════════════════════
# Main
# ═══════════════════════════════════════════════════════════════

def main():
    start = time.time()
    log("=" * 70)
    log("CBP CROSS + EU EBTI → Master Classification Rule Engine")
    log("=" * 70)

    os.makedirs(OUTPUT_DIR, exist_ok=True)

    # Phase 1: Load
    cbp_combined = load_cbp_combined()
    cbp_search = load_cbp_search_batches()
    ebti = load_ebti()

    # Merge (search extends combined, EBTI separate)
    all_rulings = {}
    all_rulings.update(cbp_combined)
    for k, v in cbp_search.items():
        if k not in all_rulings:
            all_rulings[k] = v
    all_rulings.update(ebti)

    log(f"\n  TOTAL UNIFIED: {len(all_rulings):,} rulings")
    log(f"    CBP: {sum(1 for r in all_rulings.values() if r['source'].startswith('cbp')):,}")
    log(f"    EBTI: {sum(1 for r in all_rulings.values() if r['source'].startswith('eu_ebti')):,}")

    # Extract material/processing
    extract_material_processing(all_rulings)

    # Save unified rulings
    unified_path = os.path.join(OUTPUT_DIR, "unified_rulings.json")
    log(f"\nSaving unified rulings to {unified_path}...")

    # Phase 2: Classify
    by_chapter = classify_by_chapter(all_rulings)

    # Phase 3: Extract rules
    rules_by_chapter, total_rules = extract_rules(by_chapter)

    # Phase 4: Category fallback
    category_fallback = build_category_fallback(all_rulings)

    # Phase 5: Output
    engine = generate_output(all_rulings, rules_by_chapter, total_rules, category_fallback)

    elapsed = time.time() - start
    log(f"\n{'=' * 70}")
    log(f"COMPLETE in {elapsed:.0f}s ({elapsed/60:.1f}m)")
    log(f"  Rulings: {len(all_rulings):,}")
    log(f"  Rules: {sum(total_rules.values())}")
    log(f"  Fallback keywords: {len(category_fallback):,}")
    log(f"  Output: {OUTPUT_DIR}")
    log(f"{'=' * 70}")


if __name__ == "__main__":
    main()
