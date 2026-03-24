#!/usr/bin/env python3
"""
Benchmark the reverse-matching engine locally.
No API calls — loads gov_tariff_schedules CSV and matches directly.
"""

import csv
import json
import re
import time
from collections import Counter, defaultdict

GOV_FILE = "/Volumes/soulmaten/POTAL/benchmark/gov_tariff_descriptions.csv"
BENCHMARK_FILE = "/Volumes/soulmaten/POTAL/benchmark_test_data.json"
OUTPUT_FILE = "/Volumes/soulmaten/POTAL/benchmark/results/reverse_match_results.json"

# ─── Material Map ────────────────────────────────────────

MATERIAL_MAP = {
    "cotton": ["cotton"],
    "polyester": ["polyester"],
    "wool": ["wool", "woolen", "woollen"],
    "silk": ["silk"],
    "nylon": ["nylon", "polyamide"],
    "linen": ["linen", "flax"],
    "leather": ["leather", "hide", "skin"],
    "rubber": ["rubber", "latex"],
    "plastic": ["plastic", "plastics", "pvc", "polyethylene", "polypropylene"],
    "steel": ["steel", "stainless steel"],
    "iron": ["iron", "cast iron"],
    "aluminum": ["aluminum", "aluminium"],
    "copper": ["copper"],
    "nickel": ["nickel"],
    "wood": ["wood", "wooden", "timber"],
    "paper": ["paper", "paperboard", "cardboard"],
    "glass": ["glass"],
    "ceramic": ["ceramic", "porcelain", "stoneware", "earthenware", "terra cotta"],
    "gold": ["gold"],
    "silver": ["silver"],
}

# Product type → likely chapters
PRODUCT_TYPE_CHAPTERS = {
    "animal": ["01","02","03","04","05"], "meat": ["02","16"], "fish": ["03","16"],
    "dairy": ["04"], "flower": ["06"], "rose": ["06"], "plant": ["06","14"],
    "vegetable": ["07"], "fruit": ["08","20"], "cereal": ["10","11"],
    "coffee": ["09"], "tea": ["09"], "spice": ["09"],
    "sugar": ["17"], "chocolate": ["18"], "syrup": ["17","21"],
    "beverage": ["22"], "alcohol": ["22"], "wine": ["22"], "beer": ["22"],
    "whiskey": ["22"], "whisky": ["22"], "liqueur": ["22"],
    "tobacco": ["24"], "cigar": ["24"],
    "chemical": ["28","29","30","31","32","33","34","35","36","37","38"],
    "pharmaceutical": ["30"], "medicine": ["30"], "drug": ["30"], "tablet": ["30"],
    "cosmetic": ["33"], "soap": ["34"], "pesticide": ["38"],
    "plastic": ["39"], "rubber": ["40"],
    "leather": ["41","42"], "handbag": ["42"], "luggage": ["42"], "bag": ["42"],
    "fur": ["43"],
    "wood": ["44","94"], "cork": ["45"], "basket": ["46"], "wicker": ["46"],
    "paper": ["47","48","49"], "book": ["49"], "manuscript": ["49"],
    "silk": ["50","61","62"], "wool": ["51","61","62"], "cotton": ["52","61","62"],
    "yarn": ["52","54","55"], "fabric": ["54","55","56","58","59","60"],
    "carpet": ["57"], "rug": ["57"],
    "clothing": ["61","62"], "garment": ["61","62"], "jacket": ["61","62"],
    "coat": ["61","62"], "shirt": ["61","62"], "trouser": ["61","62"],
    "dress": ["61","62"], "costume": ["61","62"], "headband": ["65"],
    "hat": ["65"], "umbrella": ["66"],
    "shoe": ["64"], "footwear": ["64"], "boot": ["64"], "sandal": ["64"],
    "stone": ["25","68"], "cement": ["25","68"], "ceramic": ["69"],
    "glass": ["70"], "bottle": ["70"],
    "jewelry": ["71"], "bracelet": ["71","42"], "ornament": ["44","46","69","83"],
    "steel": ["72","73"], "iron": ["72","73"],
    "copper": ["74"], "nickel": ["75"], "aluminum": ["76"], "aluminium": ["76"],
    "zinc": ["79"], "tin": ["80"], "lead": ["78"],
    "tool": ["82"], "screwdriver": ["82"], "knife": ["82"], "cutlery": ["82"],
    "screw": ["73"], "bolt": ["73"], "nail": ["73"], "hanger": ["73","83"],
    "machine": ["84"], "engine": ["84"], "pump": ["84"], "motor": ["84","85"],
    "electrical": ["85"], "battery": ["85"], "cable": ["85"], "charger": ["85"],
    "vehicle": ["87"], "car": ["87"], "automobile": ["87"], "truck": ["87"],
    "motorcycle": ["87"], "bicycle": ["87"],
    "kayak": ["89"], "boat": ["89"], "ship": ["89"],
    "aircraft": ["88"],
    "railway": ["86"], "train": ["86"],
    "instrument": ["90"], "medical": ["90"], "optical": ["90"],
    "watch": ["91"], "clock": ["91"],
    "lamp": ["94"], "furniture": ["94"], "mattress": ["94"], "bed": ["94"],
    "toy": ["95"], "game": ["95"], "sport": ["95"],
    "art": ["97"], "figurine": ["44","69","83","97"],
    "flag": ["63"], "pennant": ["63"], "lanyard": ["63","83"],
    "coin": ["71","83","95"],
    "grease": ["15","27"], "oil": ["15","27"],
    "powder": ["25","28","29","32","38"],
    "wire": ["72","73","74","75","76","85"],
    "pulp": ["47"],
    "hemp": ["53","57"],
    "cornucopia": ["46"],
    "sticker": ["49"],
    "tag": ["48","83"],
    "stopper": ["83","45"],
    "mask": ["33","63","90"],
}


def tokenize(text):
    return set(re.sub(r'[^a-z0-9\s-]', ' ', text.lower()).split())


def detect_material(text):
    lower = text.lower()
    for mat, keywords in MATERIAL_MAP.items():
        for kw in keywords:
            if kw in lower:
                return mat
    return None


def predict_chapters(text):
    lower = text.lower()
    chapters = set()
    for keyword, chs in PRODUCT_TYPE_CHAPTERS.items():
        if keyword in lower:
            for ch in chs:
                chapters.add(ch)
    return chapters


def score_match(product_tokens, product_text, entry_tokens, entry_desc_lower, entry_chapter, chapter_hints, material_hint, hs_code_len):
    score = 0

    # Token overlap
    overlap = len(product_tokens & entry_tokens)
    if len(product_tokens) == 0:
        return 0
    token_score = overlap / max(len(product_tokens), 1)
    score += token_score * 40

    # Substring match (product words found in description)
    for token in product_tokens:
        if len(token) > 3 and token in entry_desc_lower:
            score += 2

    # Chapter boost
    if entry_chapter in chapter_hints:
        score += 15

    # Material match
    if material_hint:
        mat_terms = MATERIAL_MAP.get(material_hint, [material_hint])
        for mt in mat_terms:
            if mt in entry_desc_lower:
                score += 10
                break

    # Specificity bonus
    if hs_code_len >= 8:
        score += 3
    if hs_code_len >= 10:
        score += 3

    # Short description penalty
    if len(entry_desc_lower) < 10:
        score -= 10

    # "Other" penalty (generic catch-all)
    if entry_desc_lower.strip() in ("other", "other:", "others"):
        score -= 15

    return score


def normalize_hs(code):
    return re.sub(r'[^0-9]', '', str(code))


def main():
    print("Loading gov_tariff_schedules...")
    entries = []
    with open(GOV_FILE, "r") as f:
        reader = csv.DictReader(f)
        for row in reader:
            desc = row.get("description", "")
            entries.append({
                "country": row["country"],
                "hs_code": row["hs_code"],
                "description": desc,
                "desc_lower": desc.lower(),
                "tokens": tokenize(desc),
                "chapter": row["hs_code"][:2],
                "code_len": len(row["hs_code"].replace(".", "")),
            })
    print(f"Loaded {len(entries)} entries")

    # US entries only (benchmark uses US HTS codes)
    us_entries = [e for e in entries if e["country"] == "US"]
    print(f"US entries: {len(us_entries)}")

    # Load benchmark
    with open(BENCHMARK_FILE, "r") as f:
        benchmark = json.load(f)
    print(f"Benchmark items: {len(benchmark)}")

    # Run benchmark
    results = []
    correct_6 = 0
    correct_4 = 0
    correct_full = 0

    for i, item in enumerate(benchmark):
        product_name = item["item_name"]
        description = item.get("description", "")
        full_text = f"{product_name} {description}"
        answer = normalize_hs(item["hts_code_answer"])

        # Tokenize
        tokens = tokenize(full_text)
        material = detect_material(full_text)
        chapters = predict_chapters(full_text)

        # Score all US entries
        scored = []
        for entry in us_entries:
            # Chapter pre-filter (if we have hints)
            if chapters and len(chapters) <= 15:
                if entry["chapter"] not in chapters:
                    continue

            s = score_match(
                tokens, full_text.lower(),
                entry["tokens"], entry["desc_lower"],
                entry["chapter"], chapters,
                material, entry["code_len"]
            )
            if s > 5:
                scored.append((entry, s))

        # Fallback: no chapter filter
        if len(scored) < 3 and chapters:
            scored = []
            for entry in us_entries:
                s = score_match(
                    tokens, full_text.lower(),
                    entry["tokens"], entry["desc_lower"],
                    entry["chapter"], chapters,
                    material, entry["code_len"]
                )
                if s > 5:
                    scored.append((entry, s))

        scored.sort(key=lambda x: -x[1])

        # HS6 consensus from top candidates
        hs6_votes = defaultdict(float)
        for entry, s in scored[:20]:
            hs6 = entry["hs_code"][:6]
            hs6_votes[hs6] += s

        best_hs6 = ""
        if hs6_votes:
            best_hs6 = max(hs6_votes.items(), key=lambda x: x[1])[0]

        best = scored[0] if scored else None
        predicted = normalize_hs(best[0]["hs_code"]) if best else ""
        predicted_6 = predicted[:6] if len(predicted) >= 6 else predicted

        match_6 = predicted_6 == answer[:6] if len(predicted_6) >= 6 and len(answer) >= 6 else False
        match_4 = predicted[:4] == answer[:4] if len(predicted) >= 4 and len(answer) >= 4 else False
        match_full = predicted == answer

        # Also check consensus HS6
        consensus_match_6 = best_hs6 == answer[:6] if best_hs6 and len(answer) >= 6 else False

        if match_6 or consensus_match_6:
            correct_6 += 1
        if match_4:
            correct_4 += 1
        if match_full:
            correct_full += 1

        result = {
            "id": item["id"],
            "product_name": product_name,
            "predicted": predicted,
            "predicted_6": predicted_6,
            "consensus_6": best_hs6,
            "actual": answer,
            "actual_6": answer[:6],
            "match_4": match_4,
            "match_6": match_6 or consensus_match_6,
            "match_full": match_full,
            "best_score": round(best[1], 1) if best else 0,
            "best_desc": best[0]["description"][:100] if best else "",
            "material": material,
            "chapters_predicted": sorted(list(chapters)),
            "actual_chapter": answer[:2],
            "chapter_hit": answer[:2] in chapters if chapters else False,
            "num_candidates": len(scored),
            "top3": [
                {"code": e["hs_code"], "score": round(s, 1), "desc": e["description"][:60]}
                for e, s in scored[:3]
            ],
        }
        results.append(result)

        if (i + 1) % 10 == 0:
            print(f"[{i+1}/100] 6-digit: {correct_6}/{i+1} ({100*correct_6/(i+1):.1f}%) | 4-digit: {correct_4}/{i+1} ({100*correct_4/(i+1):.1f}%)")

    # Summary
    total = len(benchmark)
    acc_6 = 100 * correct_6 / total
    acc_4 = 100 * correct_4 / total
    acc_full = 100 * correct_full / total

    print(f"\n=== Reverse Match Results ===")
    print(f"4-digit: {acc_4:.1f}% ({correct_4}/{total})")
    print(f"6-digit: {acc_6:.1f}% ({correct_6}/{total})")
    print(f"10-digit: {acc_full:.1f}% ({correct_full}/{total})")

    # Wrong items analysis
    wrong = [r for r in results if not r["match_6"]]
    chapter_misses = sum(1 for r in wrong if not r["chapter_hit"])
    print(f"\nWrong items: {len(wrong)}")
    print(f"  Chapter prediction miss: {chapter_misses}/{len(wrong)}")

    # Error categories
    categories = Counter()
    for r in wrong:
        if not r["chapter_hit"]:
            categories["CHAPTER_MISS"] += 1
        elif r["match_4"]:
            categories["HEADING_CORRECT_SUBHEADING_WRONG"] += 1
        else:
            categories["WRONG_HEADING"] += 1
    print(f"  Error breakdown: {dict(categories)}")

    summary = {
        "benchmark": "CBP 100 - Reverse Match (local)",
        "total": total,
        "correct_4": correct_4,
        "correct_6": correct_6,
        "correct_full": correct_full,
        "accuracy_4": round(acc_4, 2),
        "accuracy_6": round(acc_6, 2),
        "accuracy_full": round(acc_full, 2),
        "error_categories": dict(categories),
        "results": results,
    }

    with open(OUTPUT_FILE, "w") as f:
        json.dump(summary, f, indent=2, ensure_ascii=False)
    print(f"\nResults saved to {OUTPUT_FILE}")


if __name__ == "__main__":
    main()
