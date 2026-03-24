#!/usr/bin/env python3
"""
HS Code Description Keyword Analysis
Extracts classification-deciding keywords from 89,842 official descriptions.
"""

import csv
import re
import json
from collections import Counter, defaultdict

GOV_FILE = "/Volumes/soulmaten/POTAL/benchmark/gov_tariff_descriptions.csv"
OUTPUT_MD = "/Volumes/soulmaten/POTAL/benchmark/formulas/KEYWORD_ANALYSIS.md"
OUTPUT_JSON = "/Volumes/soulmaten/POTAL/benchmark/formulas/keyword_index.json"

# ─── Keyword dictionaries ───────────────────────────────

MATERIAL_KEYWORDS = [
    "cotton", "polyester", "wool", "silk", "nylon", "linen", "flax", "hemp", "jute",
    "rayon", "viscose", "acrylic", "spandex", "elastane", "lycra", "aramid", "kevlar",
    "leather", "suede", "fur", "faux fur", "sheepskin", "cowhide", "pigskin",
    "rubber", "latex", "silicone", "plastic", "pvc", "polyethylene", "polypropylene",
    "polycarbonate", "polyurethane", "neoprene", "teflon", "epoxy", "resin", "fiberglass",
    "steel", "stainless steel", "iron", "cast iron", "aluminum", "aluminium", "copper",
    "brass", "bronze", "nickel", "zinc", "tin", "lead", "titanium", "tungsten",
    "chromium", "cobalt", "manganese", "gold", "silver", "platinum", "palladium",
    "wood", "bamboo", "cork", "rattan", "wicker", "plywood", "chipboard", "mdf",
    "paper", "cardboard", "paperboard", "cellulose",
    "glass", "crystal", "ceramic", "porcelain", "stoneware", "earthenware", "terra cotta",
    "stone", "marble", "granite", "slate", "sandstone", "limestone", "cement", "concrete",
    "carbon fiber", "carbon fibre", "graphite", "asbestos",
]

GENDER_KEYWORDS = [
    "men's", "mens", "women's", "womens", "boys'", "boys", "girls'", "girls",
    "unisex", "infants'", "infants", "children's", "childrens", "babies'", "babies",
]

CONSTRUCTION_KEYWORDS = [
    "knitted", "knit", "woven", "crocheted", "nonwoven", "non-woven", "felted",
    "braided", "plaited", "embroidered", "printed", "dyed", "bleached", "unbleached",
    "forged", "cast", "molded", "moulded", "extruded", "rolled", "drawn", "stamped",
    "welded", "riveted", "soldered", "sintered", "machined", "turned", "milled",
    "laminated", "coated", "plated", "galvanized", "anodized", "painted", "lacquered",
    "tanned", "chrome-tanned", "vegetable-tanned",
]

FORM_KEYWORDS = [
    "powder", "liquid", "solid", "gas", "paste", "gel", "cream", "ointment",
    "sheet", "plate", "strip", "foil", "film", "membrane",
    "wire", "cable", "rope", "cord", "string", "thread", "yarn", "fiber", "fibre",
    "tube", "pipe", "hose", "duct",
    "bar", "rod", "beam", "angle", "profile", "section",
    "pellet", "granule", "flake", "chip", "particle", "bead",
    "block", "slab", "tile", "brick", "panel", "board",
    "coil", "roll", "reel", "spool", "bobbin",
    "ingot", "billet", "bloom", "blank",
]

FUNCTION_KEYWORDS = [
    "household", "domestic", "industrial", "commercial", "agricultural",
    "medical", "surgical", "dental", "veterinary", "pharmaceutical",
    "electrical", "electronic", "optical", "photographic",
    "automotive", "motor vehicle", "aircraft", "marine", "railway",
    "construction", "building", "mining",
    "textile", "garment", "clothing", "footwear",
    "food", "beverage", "animal feed",
    "packaging", "packing",
    "laboratory", "scientific", "measuring", "testing",
    "military", "defense", "defence",
    "ornamental", "decorative",
]

VALUE_PATTERNS = [
    r"valued (?:over|not over|not exceeding|under|exceeding) \$[\d,.]+",
    r"valued (?:over|not over) [\d,.]+ (?:per|each|kg|kilogram)",
    r"\$[\d,.]+ (?:per|each|or more|or less)",
]

WEIGHT_PATTERNS = [
    r"weighing (?:more than|less than|not more than|not less than|not exceeding|exceeding) [\d,.]+ ?(?:kg|g|mt|tonnes?|lbs?|pounds?|oz|ounces?)",
    r"(?:weight|mass) (?:of|exceeding|not exceeding) [\d,.]+",
    r"[\d,.]+ ?(?:kg|g) (?:or more|or less|each|per)",
]

SIZE_PATTERNS = [
    r"(?:width|length|height|diameter|thickness) (?:exceeding|not exceeding|not over|over|of) [\d,.]+",
    r"(?:width|length|height|diameter|thickness) [\d,.]+ ?(?:mm|cm|m|inches?|in\.)",
    r"[\d,.]+ ?(?:mm|cm|m) (?:or more|or less|wide|long|thick)",
]

COMPOSITION_PATTERNS = [
    r"containing (?:by weight )?(?:[\d,.]+%|[\d,.]+ ?percent)",
    r"[\d,.]+% (?:or more|or less) (?:by weight )?(?:of )",
    r"(?:of|with) [\d,.]+% (?:or more|or less)",
    r"less than [\d,.]+%",
    r"[\d,.]+ ?(?:percent|%) (?:or more )?(?:of|by)",
]

PROCESSING_KEYWORDS = [
    "raw", "crude", "unprocessed", "unrefined", "natural",
    "processed", "refined", "purified", "distilled", "filtered",
    "semi-processed", "semi-finished",
    "prepared", "preserved", "canned", "dried", "frozen", "fresh",
    "smoked", "salted", "pickled", "fermented", "roasted",
    "concentrated", "diluted",
    "assembled", "unassembled", "knocked down", "ckd", "skd",
]

ORIGIN_KEYWORDS = [
    "animal", "vegetable", "mineral", "synthetic", "artificial",
    "organic", "inorganic", "chemical",
    "bovine", "ovine", "caprine", "swine", "porcine", "equine", "poultry",
    "fish", "crustacean", "mollusc",
    "coniferous", "tropical", "hardwood", "softwood",
]


def extract_keywords(text):
    """Extract all matching keywords from a description."""
    text_lower = text.lower() if text else ""
    found = {
        "material": [], "gender": [], "construction": [], "form": [],
        "function": [], "processing": [], "origin": [],
        "value_conditions": [], "weight_conditions": [],
        "size_conditions": [], "composition_conditions": [],
    }

    for kw in MATERIAL_KEYWORDS:
        if kw in text_lower:
            found["material"].append(kw)
    for kw in GENDER_KEYWORDS:
        if kw in text_lower:
            found["gender"].append(kw)
    for kw in CONSTRUCTION_KEYWORDS:
        if kw in text_lower:
            found["construction"].append(kw)
    for kw in FORM_KEYWORDS:
        if kw in text_lower:
            found["form"].append(kw)
    for kw in FUNCTION_KEYWORDS:
        if kw in text_lower:
            found["function"].append(kw)
    for kw in PROCESSING_KEYWORDS:
        if kw in text_lower:
            found["processing"].append(kw)
    for kw in ORIGIN_KEYWORDS:
        if kw in text_lower:
            found["origin"].append(kw)

    for pat in VALUE_PATTERNS:
        matches = re.findall(pat, text_lower)
        found["value_conditions"].extend(matches)
    for pat in WEIGHT_PATTERNS:
        matches = re.findall(pat, text_lower)
        found["weight_conditions"].extend(matches)
    for pat in SIZE_PATTERNS:
        matches = re.findall(pat, text_lower)
        found["size_conditions"].extend(matches)
    for pat in COMPOSITION_PATTERNS:
        matches = re.findall(pat, text_lower)
        found["composition_conditions"].extend(matches)

    return found


def main():
    # Load data
    rows = []
    with open(GOV_FILE, "r") as f:
        reader = csv.DictReader(f)
        for row in reader:
            rows.append(row)

    print(f"Loaded {len(rows)} descriptions")

    # Global keyword counters
    global_counts = defaultdict(Counter)  # category -> keyword -> count
    chapter_keywords = defaultdict(lambda: defaultdict(Counter))  # chapter -> category -> keyword -> count
    keyword_to_codes = defaultdict(list)  # keyword -> [(hs_code, description)]

    # Per-description analysis
    descriptions_with_conditions = 0
    total_value_conditions = 0
    total_weight_conditions = 0
    total_size_conditions = 0
    total_composition_conditions = 0

    for row in rows:
        desc = row.get("description", "")
        hs = row.get("hs_code", "")
        chapter = hs[:2] if len(hs) >= 2 else "??"

        found = extract_keywords(desc)

        for category, keywords in found.items():
            for kw in keywords:
                global_counts[category][kw] += 1
                chapter_keywords[chapter][category][kw] += 1
                if category in ("material", "construction", "form", "function"):
                    keyword_to_codes[kw].append((hs, row.get("country", ""), desc[:100]))

        if found["value_conditions"]:
            descriptions_with_conditions += 1
            total_value_conditions += len(found["value_conditions"])
        if found["weight_conditions"]:
            total_weight_conditions += len(found["weight_conditions"])
        if found["size_conditions"]:
            total_size_conditions += len(found["size_conditions"])
        if found["composition_conditions"]:
            total_composition_conditions += len(found["composition_conditions"])

    # ─── Generate report ───────────────────────────────
    lines = []
    lines.append("# HS Code Description Keyword Analysis")
    lines.append(f"> Total descriptions analyzed: {len(rows):,}")
    lines.append(f"> Generated: 2026-03-17")
    lines.append("")
    lines.append("---")
    lines.append("")

    # Summary
    lines.append("## 1. Summary")
    lines.append("")
    lines.append("| Category | Unique Keywords | Total Occurrences |")
    lines.append("|----------|----------------|-------------------|")
    for cat in ["material", "gender", "construction", "form", "function", "processing", "origin"]:
        unique = len(global_counts[cat])
        total = sum(global_counts[cat].values())
        lines.append(f"| {cat.title()} | {unique} | {total:,} |")
    lines.append(f"| Value Conditions | - | {total_value_conditions:,} |")
    lines.append(f"| Weight Conditions | - | {total_weight_conditions:,} |")
    lines.append(f"| Size Conditions | - | {total_size_conditions:,} |")
    lines.append(f"| Composition Conditions | - | {total_composition_conditions:,} |")
    lines.append("")

    # Top keywords per category
    lines.append("## 2. Top Keywords per Category")
    lines.append("")
    for cat in ["material", "gender", "construction", "form", "function", "processing", "origin"]:
        lines.append(f"### {cat.title()}")
        lines.append("| Keyword | Count | Top Chapters |")
        lines.append("|---------|-------|-------------|")
        for kw, count in global_counts[cat].most_common(30):
            # Find top chapters for this keyword
            ch_counts = Counter()
            for ch, cats in chapter_keywords.items():
                if kw in cats[cat]:
                    ch_counts[ch] = cats[cat][kw]
            top_chs = ", ".join(f"Ch.{ch}({n})" for ch, n in ch_counts.most_common(5))
            lines.append(f"| {kw} | {count:,} | {top_chs} |")
        lines.append("")

    # Value/Weight/Size conditions
    lines.append("## 3. Conditional Rules (Value/Weight/Size/Composition)")
    lines.append("")
    lines.append(f"- Descriptions with value conditions: {descriptions_with_conditions:,}")
    lines.append(f"- Total value conditions: {total_value_conditions:,}")
    lines.append(f"- Total weight conditions: {total_weight_conditions:,}")
    lines.append(f"- Total size conditions: {total_size_conditions:,}")
    lines.append(f"- Total composition conditions: {total_composition_conditions:,}")
    lines.append("")

    # Sample value conditions
    lines.append("### Sample Value Conditions")
    lines.append("```")
    sample_vals = []
    for row in rows:
        desc = row.get("description", "").lower()
        for pat in VALUE_PATTERNS:
            matches = re.findall(pat, desc)
            for m in matches:
                sample_vals.append(f"{row.get('hs_code', '?')} | {m}")
        if len(sample_vals) >= 20:
            break
    for s in sample_vals[:20]:
        lines.append(s)
    lines.append("```")
    lines.append("")

    # Chapter-level analysis
    lines.append("## 4. Chapter-Level Keyword Density")
    lines.append("")
    lines.append("| Chapter | Total Codes | Material | Construction | Form | Function |")
    lines.append("|---------|------------|----------|--------------|------|----------|")
    ch_code_counts = Counter(r.get("hs_code", "")[:2] for r in rows)
    for ch in sorted(ch_code_counts.keys()):
        total = ch_code_counts[ch]
        mat = sum(chapter_keywords[ch]["material"].values())
        con = sum(chapter_keywords[ch]["construction"].values())
        frm = sum(chapter_keywords[ch]["form"].values())
        fun = sum(chapter_keywords[ch]["function"].values())
        if total > 100:  # Skip tiny chapters
            lines.append(f"| {ch} | {total:,} | {mat:,} | {con:,} | {frm:,} | {fun:,} |")
    lines.append("")

    # Write MD report
    with open(OUTPUT_MD, "w") as f:
        f.write("\n".join(lines))
    print(f"Report saved to {OUTPUT_MD}")

    # ─── Generate keyword index JSON ───────────────────
    # keyword -> list of hs_codes where it appears (top 10)
    keyword_index = {}
    for kw in list(global_counts["material"].keys()) + list(global_counts["construction"].keys()) + list(global_counts["form"].keys()):
        if kw in keyword_to_codes:
            # Group by HS6
            hs6_groups = defaultdict(int)
            for hs, country, desc in keyword_to_codes[kw]:
                hs6_groups[hs[:6]] += 1
            top_hs6 = sorted(hs6_groups.items(), key=lambda x: -x[1])[:20]
            keyword_index[kw] = {
                "total_occurrences": sum(hs6_groups.values()),
                "unique_hs6": len(hs6_groups),
                "top_hs6": [{"code": code, "count": cnt} for code, cnt in top_hs6],
            }

    with open(OUTPUT_JSON, "w") as f:
        json.dump(keyword_index, f, indent=2, ensure_ascii=False)
    print(f"Keyword index saved to {OUTPUT_JSON}")
    print(f"Total indexed keywords: {len(keyword_index)}")


if __name__ == "__main__":
    main()
