#!/usr/bin/env python3
"""
Hybrid v10: v8 structure + "describe then classify" prompts
Stage 1: GPT-4o → Chapter (2-digit)
Stage 2: GPT-4o → Heading + Subheading (4-6 digit)
Stage 3: GPT-4o → National line (8-10 digit)
All prompts: "First describe what this product IS, then pick from the list."
"""

import csv, json, re, math, time, os
from collections import Counter, defaultdict
from openai import OpenAI

GOV_FILE = "/Volumes/soulmaten/POTAL/benchmark/gov_tariff_descriptions.csv"
BENCHMARK_FILE = "/Volumes/soulmaten/POTAL/benchmark_test_data.json"
OUTPUT_FILE = "/Volumes/soulmaten/POTAL/benchmark/results/hybrid_v10_results.json"

client = OpenAI(api_key=os.environ.get("OPENAI_API_KEY", ""))

CHAPTERS = {
    "01":"Live animals","02":"Meat and edible meat offal","03":"Fish, crustaceans, molluscs",
    "04":"Dairy; eggs; honey","05":"Products of animal origin (hair, bones, ivory)",
    "06":"Live trees, plants, cut flowers","07":"Edible vegetables","08":"Edible fruit and nuts",
    "09":"Coffee, tea, spices","10":"Cereals","11":"Milling products; malt; starches",
    "12":"Oil seeds, oleaginous fruits","13":"Lac; gums, resins, vegetable extracts",
    "14":"Vegetable plaiting materials (bamboo, rattan)","15":"Animal/vegetable fats and oils",
    "16":"Preparations of meat/fish","17":"Sugars","18":"Cocoa preparations",
    "19":"Preparations of cereals/flour/milk","20":"Preparations of vegetables/fruit",
    "21":"Misc edible preparations","22":"Beverages, spirits, vinegar",
    "23":"Residues from food; animal feed","24":"Tobacco",
    "25":"Salt; earth; stone; cement","26":"Ores, slag, ash",
    "27":"Mineral fuels, oils, waxes","28":"Inorganic chemicals",
    "29":"Organic chemicals","30":"Pharmaceutical products","31":"Fertilisers",
    "32":"Tanning/dyeing extracts; paints, inks","33":"Essential oils; cosmetics",
    "34":"Soap, waxes, candles","35":"Albuminoidal substances; glues; enzymes",
    "36":"Explosives; pyrotechnics; matches","37":"Photographic goods",
    "38":"Misc chemical products (pesticides etc)","39":"Plastics",
    "40":"Rubber","41":"Raw hides, skins, leather","42":"Leather articles; handbags; travel goods",
    "43":"Furskins and artificial fur","44":"Wood; wood charcoal",
    "45":"Cork","46":"Straw/plaiting materials; basketware",
    "47":"Wood pulp; recovered paper","48":"Paper and paperboard",
    "49":"Printed books, newspapers, manuscripts","50":"Silk",
    "51":"Wool, animal hair","52":"Cotton","53":"Other vegetable textile fibres; paper yarn",
    "54":"Man-made filaments","55":"Man-made staple fibres",
    "56":"Wadding, felt, nonwovens; twine","57":"Carpets, textile floor coverings",
    "58":"Special woven fabrics; lace; tapestries","59":"Coated/laminated textile fabrics",
    "60":"Knitted/crocheted fabrics","61":"Apparel, knitted/crocheted",
    "62":"Apparel, not knitted","63":"Other textile articles; rags",
    "64":"Footwear","65":"Headgear","66":"Umbrellas, walking-sticks, whips",
    "67":"Prepared feathers; artificial flowers","68":"Articles of stone, cement, asbestos",
    "69":"Ceramic products","70":"Glass and glassware",
    "71":"Pearls, precious stones, metals; jewelry","72":"Iron and steel",
    "73":"Articles of iron/steel","74":"Copper","75":"Nickel",
    "76":"Aluminium","78":"Lead","79":"Zinc","80":"Tin",
    "81":"Other base metals; cermets","82":"Tools, cutlery of base metal",
    "83":"Misc articles of base metal","84":"Machinery, mechanical appliances",
    "85":"Electrical machinery; sound/TV equipment","86":"Railway locomotives/rolling-stock",
    "87":"Vehicles (not railway)","88":"Aircraft, spacecraft",
    "89":"Ships, boats","90":"Optical, measuring, precision instruments",
    "91":"Clocks and watches","92":"Musical instruments",
    "93":"Arms and ammunition","94":"Furniture; bedding; lamps; prefab buildings",
    "95":"Toys, games, sports equipment","96":"Misc manufactured articles (pens, buttons)",
    "97":"Works of art, antiques",
}

STOP_WORDS = {
    "the","a","an","of","in","on","at","to","for","and","or","is","are","was",
    "were","be","been","have","has","had","with","from","by","as","into","than",
    "that","this","it","its","not","no","but","if","so","such","which","who",
    "what","when","where","how","all","each","every","both","more","most","some",
    "any","per","up","out","about","other","others",
}

def tokenize(text):
    tokens = set(re.sub(r'[^a-z0-9\s-]', ' ', text.lower()).split())
    return {t for t in tokens - STOP_WORDS if len(t) > 2}


GRI_RULES = """WCO General Rules of Interpretation (GRI):
GRI 1: Classification is determined by the terms of headings and section/chapter notes.
GRI 2a: Incomplete/unassembled articles are classified as complete articles.
GRI 2b: Mixtures/composite materials are classified by their constituent materials.
GRI 3a: The most specific description takes precedence over general descriptions.
GRI 3b: Composite goods are classified by the component giving ESSENTIAL CHARACTER.
GRI 3c: When 3a and 3b fail, classify under the last applicable heading in numerical order.
GRI 4: Goods not classifiable above are classified under the heading for most similar goods.
GRI 6: Subheading classification follows the same principles as heading classification."""


def stage1_chapter(name, desc):
    """GPT-4o: describe product then classify chapter."""
    ch_list = "\n".join([f"{k}: {v}" for k,v in CHAPTERS.items()])
    prompt = f"""Step 1: Describe what this product IS:
- Material (what is it made of?)
- Purpose (what is it used for?)
- Construction (how is it made?)
- Category (clothing, food, chemical, machinery, etc.)

Product: {name}
{f"Detail: {desc[:300]}" if desc else ""}

Step 2: Apply WCO classification rules to pick the best chapter:
{GRI_RULES}

Step 3: Pick from this list:
{ch_list}

Reply in this EXACT format:
DESCRIPTION: [material, purpose, construction, category in 1 line]
GRI: [which GRI rule applies and why, briefly]
CHAPTER: [2-digit code]"""

    try:
        resp = client.chat.completions.create(
            model="gpt-4o", messages=[{"role":"user","content":prompt}],
            temperature=0, max_tokens=150,
        )
        text = resp.choices[0].message.content.strip()
        pat = r'CHAPTER:\s*(\d{2})'
        match = re.search(pat, text)
        if not match:
            pat2 = r'(\d{2})'
            match = re.search(pat2, text)
        return match.group(1) if match else None
    except Exception as e:
        print(f"  Stage1 error: {e}")
        return None


def stage2_subheading(name, desc, chapter, entries_in_chapter):
    """GPT-4o-mini: pick best HS6 from the chapter's descriptions."""
    # Build a compact list of unique HS6 codes with descriptions
    hs6_descs = {}
    for e in entries_in_chapter:
        h6 = e["subheading"]
        if h6 not in hs6_descs:
            hs6_descs[h6] = e["desc"][:120]
        # Also collect heading-level descriptions
        h4 = e["heading"]
        if h4 not in hs6_descs:
            hs6_descs[h4] = e["desc"][:120]

    # Sort and format
    sorted_codes = sorted(hs6_descs.items())
    # If too many, take only the HS6-level ones
    hs6_only = [(k,v) for k,v in sorted_codes if len(k) == 6]
    if len(hs6_only) > 150:
        # Too many — need to pre-filter by heading first
        # Get headings
        h4_descs = {}
        for e in entries_in_chapter:
            h4 = e["heading"]
            if h4 not in h4_descs:
                h4_descs[h4] = e["desc"][:120]

        h4_list = "\n".join([f"{k}: {v}" for k,v in sorted(h4_descs.items())])

        # First pick heading
        prompt_h4 = f"""Step 1: Describe this product — material, purpose, construction, category.

Product: {name}
{f"Detail: {desc[:200]}" if desc else ""}

Step 2: Apply GRI rules (GRI 1: heading terms first, GRI 3a: most specific description wins, GRI 3b: essential character for composites).

Step 3: Pick the best 4-digit heading from Chapter {chapter}:
{h4_list}

Reply:
DESCRIPTION: [1 line]
GRI: [rule + reason]
HEADING: [4-digit code]"""

        try:
            resp = client.chat.completions.create(
                model="gpt-4o", messages=[{"role":"user","content":prompt_h4}],
                temperature=0, max_tokens=150,
            )
            raw = resp.choices[0].message.content.strip()
            h4_match = re.search(r'HEADING:\s*(\d{4})', raw)
            if not h4_match:
                h4_match = re.search(r'(\d{4})', raw)
            h4_pick = h4_match
            h4_pick = h4_pick.group(1) if h4_pick else None
        except:
            h4_pick = None

        if h4_pick:
            # Filter HS6 by this heading
            hs6_only = [(k,v) for k,v in hs6_only if k[:4] == h4_pick]

    if not hs6_only:
        return None, None

    code_list = "\n".join([f"{k}: {v}" for k,v in hs6_only[:80]])

    prompt = f"""Step 1: Describe this product — material, purpose, construction, category.

Product: {name}
{f"Detail: {desc[:200]}" if desc else ""}

Step 2: Apply GRI rules:
- GRI 1: Match the heading/subheading terms exactly
- GRI 3a: Most specific description wins over general ones
- GRI 3b: For composites, classify by essential character
- GRI 6: Subheading classification follows same principles

Step 3: Pick the best 6-digit subheading:
{code_list}

Reply:
DESCRIPTION: [1 line]
GRI: [rule + reason]
SUBHEADING: [6-digit code]"""

    try:
        resp = client.chat.completions.create(
            model="gpt-4o", messages=[{"role":"user","content":prompt}],
            temperature=0, max_tokens=150,
        )
        text = resp.choices[0].message.content.strip()
        h6_match = re.search(r'SUBHEADING:\s*(\d{6})', text)
        if not h6_match:
            h6_match = re.search(r'(\d{6})', text)
        h6 = h6_match.group(1) if h6_match else None
        h4 = h6[:4] if h6 else (h4_pick if 'h4_pick' in dir() else None)
        return h6, h4
    except Exception as e:
        print(f"  Stage2 error: {e}")
        return None, None


def stage3_national_line(name, desc, h6, entries_in_chapter):
    """GPT-4o: pick best 8-10 digit code within the HS6 subheading."""
    candidates = [e for e in entries_in_chapter if e["hs_code"].startswith(h6) and len(e["hs_code"]) > 6]

    if not candidates:
        return h6 + "0000" if h6 else "", "", 0

    if len(candidates) == 1:
        return candidates[0]["hs_code"], candidates[0]["desc"][:100], 1.0

    c_text = "\n".join(f"{e['hs_code']}: {e['desc'][:100]}" for e in candidates)

    prompt = f"""Step 1: Describe this product — material, purpose, construction, category.

Product: {name}
{f"Details: {desc[:250]}" if desc else ""}

Step 2: Apply GRI rules (GRI 1: terms of the code, GRI 3a: most specific wins). Check value/weight thresholds in descriptions.

Step 3: Pick the single best code from subheading {h6}:
{c_text}

Reply:
DESCRIPTION: [1 line]
GRI: [rule + reason]
CODE: [8-10 digit code]"""

    try:
        resp = client.chat.completions.create(
            model="gpt-4o", messages=[{"role":"user","content":prompt}],
            temperature=0, max_tokens=150,
        )
        text = resp.choices[0].message.content.strip()
        code_match = re.search(r'CODE:\s*(\d{8,10})', text)
        if code_match:
            codes = [code_match.group(1)]
        else:
            pat = r'(\d{8,10})'
            codes = re.findall(pat, text)
        if codes:
            valid = [c for c in codes if any(e["hs_code"] == c for e in candidates)]
            if valid:
                d = next((e["desc"] for e in candidates if e["hs_code"] == valid[0]), "")
                return valid[0], d[:100], 1.0
        # Fallback: first non-Other
        for e in candidates:
            if e["desc"].strip().lower() not in ("other","other:","others"):
                return e["hs_code"], e["desc"][:100], 0.5
        return candidates[0]["hs_code"], candidates[0]["desc"][:100], 0.5
    except Exception as e:
        return candidates[0]["hs_code"], candidates[0]["desc"][:100], 0.0


def main():
    print("Loading gov_tariff_schedules...")
    all_entries = []
    with open(GOV_FILE, "r") as f:
        for row in csv.DictReader(f):
            if row["country"] != "US": continue
            hs = row["hs_code"]
            if hs[:2] in ("98","99"): continue
            desc = row.get("description","")
            all_entries.append({
                "hs_code": hs, "desc": desc, "desc_lower": desc.lower(),
                "tokens": tokenize(desc), "chapter": hs[:2],
                "heading": hs[:4], "subheading": hs[:6],
            })

    by_chapter = defaultdict(list)
    for e in all_entries:
        by_chapter[e["chapter"]].append(e)
    print(f"US entries: {len(all_entries)}, Chapters: {len(by_chapter)}")

    with open(BENCHMARK_FILE, "r") as f:
        benchmark = json.load(f)
    print(f"Benchmark: {len(benchmark)} items\n")

    results = []
    c2 = c4 = c6 = cfull = 0
    llm_calls = 0

    for i, item in enumerate(benchmark):
        name = item["item_name"]
        desc = item.get("description", "")
        full_text = f"{name} {desc}"
        answer = re.sub(r'[^0-9]', '', item["hts_code_answer"])

        # Stage 1: Chapter
        chapter = stage1_chapter(name, desc)
        llm_calls += 1
        time.sleep(0.05)

        ch_ok = chapter == answer[:2]
        if ch_ok: c2 += 1

        # Stage 2: HS6 (only if chapter valid)
        pred_h6 = pred_h4 = None
        if chapter and chapter in by_chapter:
            pred_h6, pred_h4 = stage2_subheading(name, desc, chapter, by_chapter[chapter])
            llm_calls += 1  # or 2 if heading was also called
            time.sleep(0.05)

        m4 = (pred_h4 or (pred_h6[:4] if pred_h6 else "")) == answer[:4]
        m6 = (pred_h6 or "") == answer[:6]
        if m4: c4 += 1
        if m6: c6 += 1

        # Stage 3: National line (reverse match)
        pred_full = ""
        s3_desc = ""
        s3_score = 0
        if pred_h6 and chapter in by_chapter:
            pred_full, s3_desc, s3_score = stage3_national_line(name, desc, pred_h6, by_chapter[chapter])

        pred_full_clean = re.sub(r'[^0-9]', '', pred_full)
        m_full = pred_full_clean == answer
        if m_full: cfull += 1

        results.append({
            "id": item["id"], "name": name[:55],
            "actual": answer, "actual_ch": answer[:2],
            "s1_chapter": chapter, "ch_ok": ch_ok,
            "s2_h6": pred_h6, "s2_h4": pred_h4,
            "m4": m4, "m6": m6,
            "s3_full": pred_full_clean, "s3_desc": s3_desc[:60],
            "m_full": m_full,
        })

        if (i+1) % 10 == 0:
            t = i+1
            print(f"[{t}/100] Ch:{c2}/{t}({100*c2/t:.0f}%) H4:{c4}/{t}({100*c4/t:.0f}%) H6:{c6}/{t}({100*c6/t:.0f}%) Full:{cfull}/{t}({100*cfull/t:.0f}%)")

    total = len(benchmark)
    print(f"\n{'='*60}")
    print(f"HYBRID v10 (GPT-4o, v8 structure, describe-then-classify prompts)")
    print(f"{'='*60}")
    print(f"Chapter (2):    {100*c2/total:.1f}% ({c2}/{total})")
    print(f"Heading (4):    {100*c4/total:.1f}% ({c4}/{total})")
    print(f"Subheading (6): {100*c6/total:.1f}% ({c6}/{total})")
    print(f"Full (10):      {100*cfull/total:.1f}% ({cfull}/{total})")
    print(f"LLM calls: {llm_calls}")

    # Analyze misses
    ch_miss = [r for r in results if not r["ch_ok"]]
    h6_miss_ch_ok = [r for r in results if r["ch_ok"] and not r["m6"]]
    print(f"\nChapter misses: {len(ch_miss)}")
    for r in ch_miss[:10]:
        print(f"  [{r['id']}] {r['name'][:40]} actual=Ch.{r['actual_ch']} llm=Ch.{r['s1_chapter']}")
    print(f"\nH6 misses (ch OK): {len(h6_miss_ch_ok)}")
    for r in h6_miss_ch_ok[:10]:
        print(f"  [{r['id']}] {r['name'][:40]} actual={r['actual'][:6]} pred={r['s2_h6']}")

    with open(OUTPUT_FILE, "w") as f:
        json.dump({"accuracy_2":round(100*c2/total,2),"accuracy_4":round(100*c4/total,2),
                    "accuracy_6":round(100*c6/total,2),"accuracy_full":round(100*cfull/total,2),
                    "llm_calls":llm_calls,"results":results}, f, indent=2, ensure_ascii=False)
    print(f"\nSaved to {OUTPUT_FILE}")


if __name__ == "__main__":
    main()
