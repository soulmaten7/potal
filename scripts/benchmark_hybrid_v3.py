#!/usr/bin/env python3
"""
Hybrid v3 — Tree Elimination Pipeline
1. Product name → DB cache check (skip in benchmark)
2. Cache miss → LLM picks ~10 candidate codes from full 25K descriptions
3. Candidates → Tree elimination: climb from 10-digit leaves to common ancestor
4. Final code → DB save (skip in benchmark)

Key: LLM only SELECTS candidates. Tree structure DECIDES.
"""

import csv, json, re, time, os, sys
from collections import defaultdict, Counter
from openai import OpenAI

GOV_FILE = "/Volumes/soulmaten/POTAL/benchmark/gov_tariff_descriptions.csv"
BENCHMARK_FILE = "/Volumes/soulmaten/POTAL/benchmark_test_data.json"
OUTPUT_FILE = "/Volumes/soulmaten/POTAL/benchmark/results/hybrid_v3_results.json"

client = OpenAI(api_key=os.environ.get("OPENAI_API_KEY", ""))

# ─── Load & index the tariff tree ─────────────────────────

def load_tree():
    """Load US HTS into a hierarchical tree structure."""
    entries = []
    with open(GOV_FILE, "r") as f:
        for row in csv.DictReader(f):
            if row["country"] != "US": continue
            code = row["hs_code"]
            if code[:2] in ("98", "99"): continue
            entries.append({"code": code, "desc": row.get("description", "")})

    # Sort by code for tree building
    entries.sort(key=lambda x: x["code"])

    # Build description map: code → description
    desc_map = {}
    for e in entries:
        desc_map[e["code"]] = e["desc"]

    # Build parent→children map
    children = defaultdict(list)  # parent_code → [child_codes]
    for e in entries:
        code = e["code"]
        # Parent is the prefix: 10→8→6→4→2
        if len(code) == 10:
            parent = code[:8]
        elif len(code) == 8:
            parent = code[:6]
        elif len(code) == 6:
            parent = code[:4]
        elif len(code) == 4:
            parent = code[:2]
        else:
            parent = ""
        children[parent].append(code)

    # All leaf nodes (10-digit or the most specific available)
    leaves = set()
    all_codes = set(e["code"] for e in entries)
    for e in entries:
        code = e["code"]
        # A leaf has no children
        has_child = False
        for c in all_codes:
            if c != code and c.startswith(code) and len(c) > len(code):
                has_child = True
                break
        if not has_child:
            leaves.add(code)

    return entries, desc_map, children, leaves


def build_chapter_desc_index(entries):
    """Build per-chapter description lists for LLM context."""
    by_chapter = defaultdict(list)
    for e in entries:
        ch = e["code"][:2]
        by_chapter[ch].append(e)
    return by_chapter


def build_full_desc_list(entries):
    """Build compact description list for LLM: code + description."""
    lines = []
    for e in entries:
        code = e["code"]
        desc = e["desc"][:120]
        if desc.strip().lower() in ("other", "other:", "others"):
            continue  # Skip generic catch-alls to save tokens
        if len(code) >= 6:  # Only include 6+ digit codes
            lines.append(f"{code}: {desc}")
    return lines


# ─── Stage 1: LLM Candidate Selection ────────────────────

CHAPTER_SUMMARY = """01:Live animals 02:Meat 03:Fish 04:Dairy,eggs,honey 05:Animal products(hair,bones)
06:Plants,flowers 07:Vegetables 08:Fruit,nuts 09:Coffee,tea,spices 10:Cereals
11:Milling,malt,starch 12:Oil seeds 13:Gums,resins,extracts 14:Bamboo,rattan,plaiting
15:Fats,oils 16:Meat/fish preparations 17:Sugars 18:Cocoa 19:Cereal/flour preparations
20:Vegetable/fruit preparations 21:Misc edible preparations 22:Beverages,spirits
23:Food residues,animal feed 24:Tobacco 25:Salt,stone,cement 26:Ores,slag,ash
27:Mineral fuels,oils,waxes 28:Inorganic chemicals 29:Organic chemicals
30:Pharmaceuticals 31:Fertilisers 32:Tanning,dyes,paints,inks 33:Cosmetics,perfumery
34:Soap,waxes,candles 35:Glues,enzymes 36:Explosives,pyrotechnics 37:Photographic goods
38:Misc chemicals(pesticides) 39:Plastics 40:Rubber 41:Hides,leather 42:Leather goods,handbags
43:Furskins 44:Wood 45:Cork 46:Straw,basketware 47:Wood pulp 48:Paper,paperboard
49:Printed books,newspapers,pictures 50:Silk 51:Wool 52:Cotton 53:Vegetable fibres,paper yarn
54:Man-made filaments 55:Man-made staple fibres 56:Wadding,felt,nonwovens
57:Carpets 58:Special woven fabrics,lace 59:Coated textile fabrics 60:Knitted fabrics
61:Knitted apparel 62:Woven apparel 63:Other textile articles,rags 64:Footwear
65:Headgear 66:Umbrellas,walking sticks 67:Feathers,artificial flowers
68:Stone,cement,asbestos articles 69:Ceramics 70:Glass 71:Jewelry,precious metals
72:Iron,steel 73:Iron/steel articles 74:Copper 75:Nickel 76:Aluminium
78:Lead 79:Zinc 80:Tin 81:Other base metals 82:Tools,cutlery
83:Misc base metal articles 84:Machinery 85:Electrical equipment 86:Railway
87:Vehicles 88:Aircraft 89:Ships 90:Optical,measuring instruments
91:Clocks,watches 92:Musical instruments 93:Arms,ammunition
94:Furniture,bedding,lamps 95:Toys,games,sports 96:Misc manufactured(pens,buttons)
97:Art,antiques"""


def select_candidates_llm(product_name, description, chapter_descs):
    """
    Ask LLM to select ~10 candidate HS codes from the full tariff schedule.
    Two-step: first pick chapter, then pick codes within chapter.
    """
    # Step 1: Pick chapter(s)
    prompt_ch = f"""You are a US Customs broker classifying goods under the Harmonized Tariff Schedule.

Product: {product_name}
{f"Description: {description[:400]}" if description else ""}

HS Chapters:
{CHAPTER_SUMMARY}

Which chapter(s) could this product belong to? List 1-3 most likely chapters.
CRITICAL RULES:
- Printed matter (lanyards with printing, flags, pennants, stickers, labels) → Ch.49
- Costumes, fancy dress → Ch.95 (toys) NOT Ch.61/62
- Composite goods: essential character determines chapter (GRI 3b)
- Parts generally classified with their whole (e.g., car parts → Ch.87)
- "Other" headings exist as catch-all at every level

Reply ONLY with comma-separated chapter numbers, e.g.: 49,63"""

    try:
        resp = client.chat.completions.create(
            model="gpt-4o-mini", messages=[{"role": "user", "content": prompt_ch}],
            temperature=0, max_tokens=20,
        )
        ch_text = resp.choices[0].message.content.strip()
        chapters = re.findall(r'(\d{2})', ch_text)
        chapters = chapters[:3]  # Max 3 chapters
    except Exception as e:
        print(f"  LLM ch error: {e}")
        return []

    if not chapters:
        return []

    # Step 2: Within those chapters, pick specific codes
    # Build description list for selected chapters
    code_lines = []
    for ch in chapters:
        if ch in chapter_descs:
            for e in chapter_descs[ch]:
                desc = e["desc"][:100]
                if desc.strip().lower() in ("other", "other:", "others", "other,"):
                    continue
                code_lines.append(f"{e['code']}: {desc}")

    if not code_lines:
        return []

    # Limit context size (GPT-4o-mini has 128K context but we want speed)
    if len(code_lines) > 400:
        code_lines = code_lines[:400]

    code_block = "\n".join(code_lines)

    prompt_codes = f"""You are a US Customs broker. Given this product, select ALL possibly matching HS codes from the list below.

Product: {product_name}
{f"Description: {description[:300]}" if description else ""}

Available codes (Chapter{'s' if len(chapters)>1 else ''} {','.join(chapters)}):
{code_block}

RULES:
- Select 5-15 codes that could POSSIBLY apply
- Include codes at different specificity levels (6-digit, 8-digit, 10-digit)
- Include the most specific match AND its parent codes
- When in doubt, include rather than exclude
- For composite products, include codes for each component material

Reply with ONLY a comma-separated list of codes, e.g.: 491199,4911998000,490199"""

    try:
        resp = client.chat.completions.create(
            model="gpt-4o-mini", messages=[{"role": "user", "content": prompt_codes}],
            temperature=0, max_tokens=200,
        )
        code_text = resp.choices[0].message.content.strip()
        candidates = re.findall(r'(\d{4,10})', code_text)
        return candidates
    except Exception as e:
        print(f"  LLM code error: {e}")
        return []


# ─── Stage 2: Tree Elimination ────────────────────────────

def tree_eliminate(candidates, desc_map):
    """
    Given candidate codes, find the best classification using tree elimination.

    Algorithm:
    1. Expand each candidate to its full tree path (leaf → ... → chapter)
    2. Count votes at each level (10, 8, 6, 4, 2 digits)
    3. Walk down from chapter: at each level, pick the child with most votes
    4. If tied, prefer the more specific (longer) candidate
    5. Result is deterministic: same candidates → same result
    """
    if not candidates:
        return None

    # Normalize candidates
    clean = []
    for c in candidates:
        c = c.strip()
        if len(c) >= 4 and c in desc_map:
            clean.append(c)
        # Also try to find the code in desc_map with prefix matching
        elif len(c) >= 4:
            # Find exact or near matches
            for k in desc_map:
                if k == c or k.startswith(c) or c.startswith(k):
                    clean.append(k)

    if not clean:
        # Fallback: use raw candidates even if not in desc_map
        clean = [c for c in candidates if len(c) >= 4]

    if not clean:
        return None

    # Build path votes: for each candidate, vote for all its ancestors
    path_votes = Counter()  # code_prefix → vote count
    candidate_set = set(clean)

    for code in clean:
        # Vote for the code itself and all its prefixes
        for length in [10, 8, 6, 4, 2]:
            if len(code) >= length:
                prefix = code[:length]
                path_votes[prefix] += 1

    # Walk down the tree: chapter → heading → subheading → stat suffix
    # At each level, pick the prefix with the most votes
    best_path = []

    # Level 1: Chapter (2 digits)
    ch_votes = {k: v for k, v in path_votes.items() if len(k) == 2}
    if not ch_votes:
        return {"code": clean[0], "path": [clean[0]], "method": "single_candidate"}

    best_ch = max(ch_votes, key=lambda k: ch_votes[k])
    best_path.append(best_ch)

    # Level 2: Heading (4 digits)
    h4_votes = {k: v for k, v in path_votes.items() if len(k) == 4 and k[:2] == best_ch}
    if h4_votes:
        best_h4 = max(h4_votes, key=lambda k: (h4_votes[k], k))
        best_path.append(best_h4)

        # Level 3: Subheading (6 digits)
        h6_votes = {k: v for k, v in path_votes.items() if len(k) == 6 and k[:4] == best_h4}
        if h6_votes:
            best_h6 = max(h6_votes, key=lambda k: (h6_votes[k], k))
            best_path.append(best_h6)

            # Level 4: 8 digits
            h8_votes = {k: v for k, v in path_votes.items() if len(k) == 8 and k[:6] == best_h6}
            if h8_votes:
                best_h8 = max(h8_votes, key=lambda k: (h8_votes[k], k))
                best_path.append(best_h8)

                # Level 5: 10 digits
                h10_votes = {k: v for k, v in path_votes.items() if len(k) == 10 and k[:8] == best_h8}
                if h10_votes:
                    best_h10 = max(h10_votes, key=lambda k: (h10_votes[k], k))
                    best_path.append(best_h10)

    # The most specific code in our path
    final_code = best_path[-1] if best_path else clean[0]

    return {
        "code": final_code,
        "path": best_path,
        "votes": {k: path_votes[k] for k in best_path},
        "all_votes": dict(path_votes),
        "n_candidates": len(clean),
        "method": "tree_elimination",
    }


# ─── Main Benchmark ──────────────────────────────────────

def main():
    print("Loading US HTS tree...")
    entries, desc_map, children, leaves = load_tree()
    chapter_descs = build_chapter_desc_index(entries)
    print(f"Entries: {len(entries)}, Leaves: {len(leaves)}, Chapters: {len(chapter_descs)}")

    with open(BENCHMARK_FILE, "r") as f:
        benchmark = json.load(f)
    print(f"Benchmark: {len(benchmark)} items\n")

    results = []
    c2 = c4 = c6 = c8 = cfull = 0
    llm_calls = 0

    for i, item in enumerate(benchmark):
        name = item["item_name"]
        desc = item.get("description", "")
        answer = re.sub(r'[^0-9]', '', item["hts_code_answer"])

        # Stage 1: LLM candidate selection
        candidates = select_candidates_llm(name, desc, chapter_descs)
        llm_calls += 2  # chapter + codes
        time.sleep(0.05)

        # Stage 2: Tree elimination
        result = tree_eliminate(candidates, desc_map)

        if result is None:
            results.append({
                "id": item["id"], "name": name[:55], "actual": answer,
                "predicted": "", "candidates": candidates[:10],
                "m2": False, "m4": False, "m6": False, "m8": False, "m_full": False,
            })
            continue

        pred = result["code"]
        path = result["path"]

        # Compare at each level
        m2 = len(pred) >= 2 and pred[:2] == answer[:2]
        m4 = len(pred) >= 4 and pred[:4] == answer[:4]
        m6 = len(pred) >= 6 and pred[:6] == answer[:6]
        m8 = len(pred) >= 8 and len(answer) >= 8 and pred[:8] == answer[:8]
        m_full = pred == answer

        if m2: c2 += 1
        if m4: c4 += 1
        if m6: c6 += 1
        if m8: c8 += 1
        if m_full: cfull += 1

        # Get description for predicted code
        pred_desc = desc_map.get(pred, "")

        results.append({
            "id": item["id"], "name": name[:55], "actual": answer,
            "predicted": pred, "pred_desc": pred_desc[:80],
            "path": path, "votes": result.get("votes", {}),
            "candidates_raw": candidates[:15],
            "n_candidates": result.get("n_candidates", 0),
            "m2": m2, "m4": m4, "m6": m6, "m8": m8, "m_full": m_full,
        })

        if (i + 1) % 10 == 0:
            t = i + 1
            print(f"[{t}/100] Ch:{c2}/{t}({100*c2/t:.0f}%) H4:{c4}/{t}({100*c4/t:.0f}%) H6:{c6}/{t}({100*c6/t:.0f}%) H8:{c8}/{t}({100*c8/t:.0f}%) Full:{cfull}/{t}({100*cfull/t:.0f}%)")

    total = len(benchmark)
    print(f"\n{'='*65}")
    print(f"HYBRID v3 — Tree Elimination Pipeline")
    print(f"{'='*65}")
    print(f"Chapter  (2): {100*c2/total:.1f}% ({c2}/{total})")
    print(f"Heading  (4): {100*c4/total:.1f}% ({c4}/{total})")
    print(f"Subhead  (6): {100*c6/total:.1f}% ({c6}/{total})")
    print(f"Stat     (8): {100*c8/total:.1f}% ({c8}/{total})")
    print(f"Full    (10): {100*cfull/total:.1f}% ({cfull}/{total})")
    print(f"LLM calls: {llm_calls}, Est cost: ~${llm_calls * 0.00005:.4f}")

    # Key case analysis
    key_cases = [1, 5, 58, 98]  # lanyards, ceramic coin bank, carpet, allulose
    print(f"\n--- Key Case Analysis ---")
    for r in results:
        if r["id"] in key_cases:
            status = "✅" if r["m6"] else "❌"
            print(f"{status} [{r['id']}] {r['name'][:50]}")
            print(f"   Actual:    {r['actual']}")
            print(f"   Predicted: {r.get('predicted','?')}")
            print(f"   Path:      {r.get('path',[])}")
            print(f"   Candidates({r.get('n_candidates',0)}): {r.get('candidates_raw',[][:8])}")
            print()

    # Misses
    ch_miss = [r for r in results if not r["m2"]]
    h6_miss = [r for r in results if r["m2"] and not r["m6"]]
    print(f"Chapter misses ({len(ch_miss)}):")
    for r in ch_miss[:10]:
        print(f"  [{r['id']}] {r['name'][:40]} actual=Ch.{r['actual'][:2]} pred={r.get('predicted','?')[:2]}")

    print(f"\nH6 misses (ch OK) ({len(h6_miss)}):")
    for r in h6_miss[:10]:
        print(f"  [{r['id']}] {r['name'][:40]} actual={r['actual'][:6]} pred={r.get('predicted','')[:6]} | {r.get('pred_desc','')[:50]}")

    summary = {
        "benchmark": "CBP 100 — Hybrid v3 Tree Elimination",
        "total": total,
        "correct": {"ch": c2, "h4": c4, "h6": c6, "h8": c8, "full": cfull},
        "accuracy": {
            "ch": round(100*c2/total, 2), "h4": round(100*c4/total, 2),
            "h6": round(100*c6/total, 2), "h8": round(100*c8/total, 2),
            "full": round(100*cfull/total, 2),
        },
        "llm_calls": llm_calls,
        "results": results,
    }

    with open(OUTPUT_FILE, "w") as f:
        json.dump(summary, f, indent=2, ensure_ascii=False)
    print(f"\nSaved to {OUTPUT_FILE}")


if __name__ == "__main__":
    main()
