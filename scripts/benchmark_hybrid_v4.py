#!/usr/bin/env python3
"""
Hybrid v4 — Best of v2 + v3
Stage 1: LLM → Chapter (proven 74%)
Stage 2: LLM → 10-15 candidate codes within chapter (focused context)
Stage 3: Tree elimination → deterministic final code
"""

import csv, json, re, time
from collections import Counter, defaultdict
from openai import OpenAI

GOV_FILE = "/Volumes/soulmaten/POTAL/benchmark/gov_tariff_descriptions.csv"
BENCHMARK_FILE = "/Volumes/soulmaten/POTAL/benchmark_test_data.json"
OUTPUT_FILE = "/Volumes/soulmaten/POTAL/benchmark/results/hybrid_v4_results.json"

client = OpenAI(api_key=os.environ.get("OPENAI_API_KEY", ""))

CHAPTERS = """01:Live animals 02:Meat 03:Fish,crustaceans 04:Dairy,eggs,honey 05:Animal products(bones,hair,ivory)
06:Plants,flowers 07:Vegetables 08:Fruit,nuts 09:Coffee,tea,spices 10:Cereals
11:Milling,malt,starch 12:Oil seeds 13:Gums,resins,extracts 14:Bamboo,rattan,plaiting materials
15:Animal/vegetable fats,oils,greases 16:Meat/fish preparations 17:Sugars 18:Cocoa 19:Cereal/flour preparations
20:Vegetable/fruit preparations 21:Misc edible preparations 22:Beverages,spirits,vinegar
23:Food residues,animal feed 24:Tobacco 25:Salt,stone,cement 26:Ores,slag,ash
27:Mineral fuels,oils,waxes 28:Inorganic chemicals 29:Organic chemicals
30:Pharmaceuticals 31:Fertilisers 32:Dyes,paints,inks 33:Cosmetics,perfumery
34:Soap,wax,candles 35:Glues,enzymes 36:Explosives,pyrotechnics,propellants 37:Photographic goods
38:Misc chemicals,pesticides 39:Plastics 40:Rubber 41:Hides,leather 42:Leather articles,handbags,travel goods
43:Furskins,artificial fur 44:Wood 45:Cork 46:Straw,basketware,plaited articles 47:Wood pulp
48:Paper,paperboard 49:Printed books,newspapers,pictures,decals,labels 50:Silk
51:Wool 52:Cotton 53:Vegetable fibres,paper yarn 54:Man-made filaments 55:Man-made staple fibres
56:Wadding,felt,nonwovens,twine 57:Carpets 58:Special woven fabrics,lace 59:Coated textiles
60:Knitted fabrics 61:Knitted apparel 62:Woven apparel(not knitted) 63:Other textile articles,flags,rags
64:Footwear 65:Headgear 66:Umbrellas,walking sticks 67:Feathers,artificial flowers
68:Stone,cement,asbestos articles 69:Ceramics 70:Glass,glassware 71:Jewelry,precious metals,pearls
72:Iron,steel 73:Articles of iron/steel 74:Copper 75:Nickel 76:Aluminium
78:Lead 79:Zinc 80:Tin 81:Other base metals,cermets 82:Tools,cutlery
83:Misc base metal articles(hooks,hangers,clasps) 84:Machinery 85:Electrical equipment
86:Railway 87:Vehicles 88:Aircraft,spacecraft 89:Ships,boats
90:Optical,measuring instruments 91:Clocks,watches 92:Musical instruments 93:Arms,ammunition
94:Furniture,bedding,lamps 95:Toys,games,sports,costumes 96:Misc manufactured(brushes,pens,buttons,lighters)
97:Art,antiques"""


def load_data():
    entries = []
    with open(GOV_FILE, "r") as f:
        for row in csv.DictReader(f):
            if row["country"] != "US" or row["hs_code"][:2] in ("98","99"):
                continue
            entries.append({"code": row["hs_code"], "desc": row.get("description","")})

    desc_map = {e["code"]: e["desc"] for e in entries}
    by_chapter = defaultdict(list)
    for e in entries:
        by_chapter[e["code"][:2]].append(e)
    return entries, desc_map, by_chapter


def stage1_chapter(name, desc):
    """LLM picks 1-2 chapters."""
    prompt = f"""Classify this product into the correct US HTS chapter (2-digit).

Product: {name}
{f"Details: {desc[:350]}" if desc else ""}

Chapters:
{CHAPTERS}

RULES:
- Essential character determines classification (GRI 3b)
- Printed matter with text/images (lanyards, flags, labels, stickers, decals) → Ch.49
- Costumes, fancy dress, disguise → Ch.95
- Composite: classify by the component giving essential character
- Animal fats, greases, used cooking oil → Ch.15
- Organic chemicals (by CAS number) → Ch.29
- Stone/cement ornamental articles → Ch.68
- Furskins and artificial fur → Ch.43
- Base metal findings/clasps for jewelry → Ch.74 (base metal) or Ch.71 (precious)
- Propellant powder → Ch.36

Reply ONLY: two-digit code, comma, optional second choice. Example: 49,63"""

    try:
        resp = client.chat.completions.create(
            model="gpt-4o-mini", messages=[{"role":"user","content":prompt}],
            temperature=0, max_tokens=15,
        )
        text = resp.choices[0].message.content.strip()
        chs = re.findall(r'(\d{2})', text)
        return chs[:2] if chs else []
    except Exception as e:
        print(f"  S1 error: {e}")
        return []


def stage2_candidates(name, desc, chapter, chapter_entries):
    """LLM picks 10-15 candidate codes within the chapter."""
    # Build compact code list (skip pure "Other" entries to save tokens)
    lines = []
    for e in chapter_entries:
        d = e["desc"][:100]
        if d.strip().lower() in ("other","other:","others","other,"):
            continue
        lines.append(f"{e['code']}: {d}")

    # If still too long, prioritize 6-digit and 10-digit codes
    if len(lines) > 300:
        lines_6 = [l for l in lines if len(l.split(":")[0].strip()) == 6]
        lines_10 = [l for l in lines if len(l.split(":")[0].strip()) == 10]
        lines = lines_6 + lines_10[:200]

    code_block = "\n".join(lines[:350])

    prompt = f"""You are classifying this product under US HTS Chapter {chapter}.

Product: {name}
{f"Details: {desc[:300]}" if desc else ""}

All codes in Chapter {chapter}:
{code_block}

Select 8-15 codes that could POSSIBLY match this product. Include:
- The most specific (10-digit) code you think is correct
- Its parent 8-digit and 6-digit codes
- Any alternative specific codes that might also apply
- When unsure between options, include all of them

Reply with ONLY comma-separated codes. Example: 691200,6912004400,6912005000,691310"""

    try:
        resp = client.chat.completions.create(
            model="gpt-4o-mini", messages=[{"role":"user","content":prompt}],
            temperature=0, max_tokens=250,
        )
        text = resp.choices[0].message.content.strip()
        codes = re.findall(r'(\d{4,10})', text)
        return codes[:20]
    except Exception as e:
        print(f"  S2 error: {e}")
        return []


def stage3_tree_eliminate(candidates, desc_map):
    """Deterministic tree elimination from candidate codes."""
    if not candidates:
        return None

    # Validate candidates against desc_map
    valid = []
    for c in candidates:
        if c in desc_map:
            valid.append(c)
        else:
            # Try prefix matches
            for k in desc_map:
                if k.startswith(c) or c.startswith(k):
                    valid.append(k)
                    break

    if not valid:
        valid = candidates  # Use raw even if not in map

    # Vote for all ancestor paths
    votes = Counter()
    for code in valid:
        for length in (10, 8, 6, 4, 2):
            if len(code) >= length:
                votes[code[:length]] += 1

    # Walk down: pick highest-voted child at each level
    path = []

    # Chapter
    ch_v = {k: v for k, v in votes.items() if len(k) == 2}
    if not ch_v:
        return {"code": valid[0], "path": [valid[0]], "votes": {}}
    best_ch = max(ch_v, key=lambda k: ch_v[k])
    path.append(best_ch)

    # Heading (4)
    h4_v = {k: v for k, v in votes.items() if len(k) == 4 and k[:2] == best_ch}
    if h4_v:
        best_h4 = max(h4_v, key=lambda k: (h4_v[k], k))
        path.append(best_h4)

        # Subheading (6)
        h6_v = {k: v for k, v in votes.items() if len(k) == 6 and k[:4] == best_h4}
        if h6_v:
            best_h6 = max(h6_v, key=lambda k: (h6_v[k], k))
            path.append(best_h6)

            # 8-digit
            h8_v = {k: v for k, v in votes.items() if len(k) == 8 and k[:6] == best_h6}
            if h8_v:
                best_h8 = max(h8_v, key=lambda k: (h8_v[k], k))
                path.append(best_h8)

                # 10-digit
                h10_v = {k: v for k, v in votes.items() if len(k) == 10 and k[:8] == best_h8}
                if h10_v:
                    best_h10 = max(h10_v, key=lambda k: (h10_v[k], k))
                    path.append(best_h10)

    final = path[-1] if path else valid[0]
    return {"code": final, "path": path, "votes": {p: votes[p] for p in path}}


def main():
    print("Loading data...")
    entries, desc_map, by_chapter = load_data()
    print(f"US entries: {len(entries)}, Chapters: {len(by_chapter)}")

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

        # Stage 1: Chapter
        chapters = stage1_chapter(name, desc)
        llm_calls += 1
        time.sleep(0.05)

        if not chapters:
            results.append({"id":item["id"],"name":name[:55],"actual":answer,
                "predicted":"","m2":False,"m4":False,"m6":False,"m8":False,"m_full":False})
            continue

        # Stage 2: Candidates (try primary chapter, fallback to alt)
        primary_ch = chapters[0]
        alt_ch = chapters[1] if len(chapters) > 1 else None

        candidates = []
        if primary_ch in by_chapter:
            candidates = stage2_candidates(name, desc, primary_ch, by_chapter[primary_ch])
            llm_calls += 1
            time.sleep(0.05)

        # If alt chapter exists, also get candidates from there
        if alt_ch and alt_ch in by_chapter:
            alt_candidates = stage2_candidates(name, desc, alt_ch, by_chapter[alt_ch])
            llm_calls += 1
            candidates.extend(alt_candidates)
            time.sleep(0.05)

        # Stage 3: Tree elimination
        result = stage3_tree_eliminate(candidates, desc_map)

        if result is None:
            results.append({"id":item["id"],"name":name[:55],"actual":answer,
                "predicted":"","m2":False,"m4":False,"m6":False,"m8":False,"m_full":False})
            continue

        pred = result["code"]
        path = result["path"]

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

        results.append({
            "id":item["id"],"name":name[:55],"actual":answer,
            "predicted":pred,"pred_desc":desc_map.get(pred,"")[:80],
            "path":path,"chapters_picked":chapters,
            "candidates":candidates[:15],
            "m2":m2,"m4":m4,"m6":m6,"m8":m8,"m_full":m_full,
        })

        if (i+1) % 10 == 0:
            t = i+1
            print(f"[{t}/100] Ch:{c2}/{t}({100*c2/t:.0f}%) H4:{c4}/{t}({100*c4/t:.0f}%) H6:{c6}/{t}({100*c6/t:.0f}%) H8:{c8}/{t}({100*c8/t:.0f}%) Full:{cfull}/{t}({100*cfull/t:.0f}%)")

    total = len(benchmark)
    print(f"\n{'='*65}")
    print(f"HYBRID v4 — LLM Chapter + LLM Candidates + Tree Elimination")
    print(f"{'='*65}")
    print(f"Chapter  (2): {100*c2/total:.1f}% ({c2}/{total})")
    print(f"Heading  (4): {100*c4/total:.1f}% ({c4}/{total})")
    print(f"Subhead  (6): {100*c6/total:.1f}% ({c6}/{total})")
    print(f"Stat     (8): {100*c8/total:.1f}% ({c8}/{total})")
    print(f"Full    (10): {100*cfull/total:.1f}% ({cfull}/{total})")
    print(f"LLM calls: {llm_calls}, ~${llm_calls * 0.00005:.4f}")

    # Key cases
    key_ids = {1, 5, 58, 98}
    print(f"\n--- Key Cases ---")
    for r in results:
        if r["id"] in key_ids:
            s = "✅" if r.get("m6") else "❌"
            print(f"{s} [{r['id']}] {r.get('name','')[:50]}")
            print(f"   Actual: {r['actual']}  Predicted: {r.get('predicted','')}")
            print(f"   Path: {r.get('path',[])}  Chapters: {r.get('chapters_picked',[])}")
            print(f"   Candidates: {r.get('candidates',[])[:8]}")
            print()

    # Save
    summary = {
        "benchmark": "CBP 100 — Hybrid v4",
        "total": total, "llm_calls": llm_calls,
        "accuracy": {"ch":round(100*c2/total,2),"h4":round(100*c4/total,2),
            "h6":round(100*c6/total,2),"h8":round(100*c8/total,2),"full":round(100*cfull/total,2)},
        "results": results,
    }
    with open(OUTPUT_FILE, "w") as f:
        json.dump(summary, f, indent=2, ensure_ascii=False)
    print(f"\nSaved to {OUTPUT_FILE}")


if __name__ == "__main__":
    main()
