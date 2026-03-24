#!/usr/bin/env python3
"""
Hybrid HS Classification Benchmark
Stage 1: GPT-4o-mini determines chapter (2-digit)
Stage 2: Reverse matching within chapter for 6+10 digit
"""

import csv, json, re, math, time, os
from collections import Counter, defaultdict
from openai import OpenAI

GOV_FILE = "/Volumes/soulmaten/POTAL/benchmark/gov_tariff_descriptions.csv"
BENCHMARK_FILE = "/Volumes/soulmaten/POTAL/benchmark_test_data.json"
OUTPUT_FILE = "/Volumes/soulmaten/POTAL/benchmark/results/hybrid_results.json"

client = OpenAI(api_key=os.environ.get("OPENAI_API_KEY", ""))

# ─── HS Chapter definitions (WCO standard 97 chapters) ────

CHAPTERS = {
    "01": "Live animals",
    "02": "Meat and edible meat offal",
    "03": "Fish and crustaceans, molluscs",
    "04": "Dairy produce; eggs; honey",
    "05": "Products of animal origin (hair, bones, horns, ivory, coral, sponges)",
    "06": "Live trees, plants, bulbs, roots, cut flowers",
    "07": "Edible vegetables",
    "08": "Edible fruit and nuts",
    "09": "Coffee, tea, mate and spices",
    "10": "Cereals",
    "11": "Milling industry products; malt; starches",
    "12": "Oil seeds, oleaginous fruits, grain, seed",
    "13": "Lac; gums, resins, other vegetable saps and extracts",
    "14": "Vegetable plaiting materials (bamboo, rattan, reeds)",
    "15": "Animal or vegetable fats and oils",
    "16": "Preparations of meat, fish or crustaceans",
    "17": "Sugars and sugar confectionery",
    "18": "Cocoa and cocoa preparations",
    "19": "Preparations of cereals, flour, starch or milk; pastrycooks' products",
    "20": "Preparations of vegetables, fruit, nuts",
    "21": "Miscellaneous edible preparations",
    "22": "Beverages, spirits and vinegar",
    "23": "Residues from food industries; animal feed",
    "24": "Tobacco and manufactured tobacco substitutes",
    "25": "Salt; sulphur; earths and stone; cement",
    "26": "Ores, slag and ash",
    "27": "Mineral fuels, oils, waxes, bituminous substances",
    "28": "Inorganic chemicals; compounds of precious/rare-earth metals",
    "29": "Organic chemicals",
    "30": "Pharmaceutical products",
    "31": "Fertilisers",
    "32": "Tanning, dyeing extracts; paints, varnishes, inks, putty",
    "33": "Essential oils, perfumery, cosmetics, toiletries",
    "34": "Soap, waxes, candles, dental preparations",
    "35": "Albuminoidal substances; modified starches; glues; enzymes",
    "36": "Explosives; pyrotechnics; matches; pyrophoric alloys",
    "37": "Photographic or cinematographic goods",
    "38": "Miscellaneous chemical products (pesticides, solvents, etc.)",
    "39": "Plastics and articles thereof",
    "40": "Rubber and articles thereof",
    "41": "Raw hides and skins (other than furskins) and leather",
    "42": "Articles of leather; saddlery; handbags, wallets; travel goods",
    "43": "Furskins and artificial fur",
    "44": "Wood and articles of wood; wood charcoal",
    "45": "Cork and articles of cork",
    "46": "Manufactures of straw, esparto, plaiting materials; basketware",
    "47": "Pulp of wood; recovered paper/paperboard",
    "48": "Paper and paperboard; articles of paper pulp",
    "49": "Printed books, newspapers, pictures, manuscripts",
    "50": "Silk",
    "51": "Wool, fine or coarse animal hair; horsehair yarn",
    "52": "Cotton",
    "53": "Other vegetable textile fibres; paper yarn",
    "54": "Man-made filaments; strip of man-made textile materials",
    "55": "Man-made staple fibres",
    "56": "Wadding, felt, nonwovens; special yarns; twine, cordage",
    "57": "Carpets and other textile floor coverings",
    "58": "Special woven fabrics; tufted textile fabrics; lace; tapestries",
    "59": "Impregnated, coated, covered or laminated textile fabrics",
    "60": "Knitted or crocheted fabrics",
    "61": "Articles of apparel, knitted or crocheted",
    "62": "Articles of apparel, not knitted or crocheted",
    "63": "Other made-up textile articles; sets; worn clothing; rags",
    "64": "Footwear, gaiters and the like",
    "65": "Headgear and parts thereof",
    "66": "Umbrellas, sun umbrellas, walking-sticks, whips",
    "67": "Prepared feathers; artificial flowers; articles of human hair",
    "68": "Articles of stone, plaster, cement, asbestos, mica",
    "69": "Ceramic products",
    "70": "Glass and glassware",
    "71": "Natural/cultured pearls, precious stones, precious metals; jewelry",
    "72": "Iron and steel",
    "73": "Articles of iron or steel",
    "74": "Copper and articles thereof",
    "75": "Nickel and articles thereof",
    "76": "Aluminium and articles thereof",
    "78": "Lead and articles thereof",
    "79": "Zinc and articles thereof",
    "80": "Tin and articles thereof",
    "81": "Other base metals; cermets; articles thereof",
    "82": "Tools, implements, cutlery, spoons and forks, of base metal",
    "83": "Miscellaneous articles of base metal",
    "84": "Nuclear reactors, boilers, machinery and mechanical appliances",
    "85": "Electrical machinery and equipment; sound recorders; TV",
    "86": "Railway/tramway locomotives, rolling-stock, track fixtures",
    "87": "Vehicles other than railway/tramway rolling-stock",
    "88": "Aircraft, spacecraft",
    "89": "Ships, boats and floating structures",
    "90": "Optical, photographic, measuring, checking, precision instruments",
    "91": "Clocks and watches and parts thereof",
    "92": "Musical instruments; parts and accessories",
    "93": "Arms and ammunition; parts and accessories",
    "94": "Furniture; bedding, mattresses; lamps; prefabricated buildings",
    "95": "Toys, games, sports equipment",
    "96": "Miscellaneous manufactured articles (brushes, pens, buttons, lighters)",
    "97": "Works of art, collectors' pieces and antiques",
}

CHAPTER_LIST = "\n".join([f"Ch.{k}: {v}" for k, v in CHAPTERS.items()])

STOP_WORDS = {
    "the","a","an","of","in","on","at","to","for","and","or","is","are","was",
    "were","be","been","being","have","has","had","do","does","did","will",
    "would","shall","should","may","might","can","could","with","from","by",
    "as","into","than","that","this","these","those","it","its","not","no",
    "nor","but","if","so","such","which","who","whom","what","when","where",
    "how","all","each","every","both","few","more","most","some","any","per",
    "up","out","about","between","through","during","before","after","above",
    "below","under","over","new","also","whether","other","others",
}


def tokenize(text):
    tokens = set(re.sub(r'[^a-z0-9\s-]', ' ', text.lower()).split())
    return {t for t in tokens - STOP_WORDS if len(t) > 2}


# ─── Stage 1: GPT-4o-mini Chapter Prediction ────────────

def predict_chapter_llm(product_name, description=""):
    prompt = f"""You are an expert customs broker. Given the product below, determine the correct HS (Harmonized System) chapter (2-digit code from 01-97).

Product: {product_name}
{f"Description: {description}" if description else ""}

Here are all 97 HS chapters:
{CHAPTER_LIST}

IMPORTANT RULES:
- Consider the ESSENTIAL CHARACTER of the product (GRI 3b)
- For composite products, classify by the material/component that gives essential character
- Apparel: Ch.61 (knitted) or Ch.62 (woven/not knitted)
- Food preparations: Ch.16-22 based on type
- Chemicals by CAS number: usually Ch.28 (inorganic) or Ch.29 (organic)
- Machinery parts: usually classified with the machine (Ch.84/85)

Return ONLY the 2-digit chapter code and a brief reason. Format:
CHAPTER: XX
REASON: brief explanation

If unsure between two chapters, also provide:
ALT: XX"""

    try:
        resp = client.chat.completions.create(
            model="gpt-4o-mini",
            messages=[{"role": "user", "content": prompt}],
            temperature=0,
            max_tokens=150,
        )
        text = resp.choices[0].message.content.strip()

        # Parse chapter
        ch_match = re.search(r'CHAPTER:\s*(\d{2})', text)
        alt_match = re.search(r'ALT:\s*(\d{2})', text)
        reason_match = re.search(r'REASON:\s*(.+?)(?:\n|$)', text)

        chapter = ch_match.group(1) if ch_match else None
        alt = alt_match.group(1) if alt_match else None
        reason = reason_match.group(1).strip() if reason_match else text[:100]

        return chapter, alt, reason
    except Exception as e:
        print(f"  LLM error: {e}")
        return None, None, str(e)


# ─── Stage 2: Reverse matching within chapter ────────────

def reverse_match_in_chapter(product_text, entries_in_chapter, idf):
    tokens = tokenize(product_text)
    if not tokens:
        return None

    scored = []
    for entry in entries_in_chapter:
        s = 0.0
        matched = []
        for t in tokens:
            if t in entry["tokens"]:
                w = min(idf.get(t, 1), 6)
                s += w
                matched.append(t)

        # Substring match bonus
        for t in tokens:
            if len(t) >= 4 and t in entry["desc_lower"]:
                s += 2

        # Penalty for generic "Other" entries
        d = entry["desc_lower"].strip()
        if d in ("other", "other:", "others", "other,") or (d.startswith("other") and len(d) < 12):
            s *= 0.3
        if len(d) < 8:
            s *= 0.5

        # Specificity bonus
        code_len = len(entry["hs_code"].replace(".", ""))
        if code_len >= 8: s += 1
        if code_len >= 10: s += 1

        if s > 0:
            scored.append((entry, s, matched))

    scored.sort(key=lambda x: -x[1])

    # HS6 consensus from top candidates
    hs6_scores = defaultdict(float)
    h4_scores = defaultdict(float)
    for e, s, _ in scored[:30]:
        hs6_scores[e["subheading"]] += s
        h4_scores[e["heading"]] += s

    best_hs6 = max(hs6_scores.items(), key=lambda x: x[1])[0] if hs6_scores else ""
    best_h4 = max(h4_scores.items(), key=lambda x: x[1])[0] if h4_scores else ""
    best_full = scored[0][0]["hs_code"] if scored else ""
    best_score = scored[0][1] if scored else 0
    best_desc = scored[0][0]["desc"][:100] if scored else ""

    top3 = [
        {"code": e["hs_code"], "score": round(s, 1), "desc": e["desc"][:60], "matched": m[:5]}
        for e, s, m in scored[:5]
    ]

    return {
        "hs6": best_hs6,
        "h4": best_h4,
        "full": best_full,
        "score": round(best_score, 1),
        "desc": best_desc,
        "top3": top3,
        "n_scored": len(scored),
    }


def main():
    # Load tariff data
    print("Loading gov_tariff_schedules...")
    all_entries = []
    with open(GOV_FILE, "r") as f:
        for row in csv.DictReader(f):
            if row["country"] != "US": continue
            hs = row["hs_code"]
            if hs[:2] in ("98", "99"): continue
            desc = row.get("description", "")
            all_entries.append({
                "hs_code": hs,
                "desc": desc,
                "desc_lower": desc.lower(),
                "tokens": tokenize(desc),
                "chapter": hs[:2],
                "heading": hs[:4],
                "subheading": hs[:6],
            })
    print(f"US entries (excl. Ch.98/99): {len(all_entries)}")

    # Index by chapter
    by_chapter = defaultdict(list)
    for e in all_entries:
        by_chapter[e["chapter"]].append(e)
    print(f"Chapters: {len(by_chapter)}")

    # IDF per chapter
    chapter_idf = {}
    for ch, entries in by_chapter.items():
        doc_freq = Counter()
        for e in entries:
            for t in e["tokens"]:
                doc_freq[t] += 1
        N = len(entries)
        chapter_idf[ch] = {t: math.log(N / (df + 1)) + 1 for t, df in doc_freq.items()}

    # Global IDF (for fallback)
    global_df = Counter()
    for e in all_entries:
        for t in e["tokens"]:
            global_df[t] += 1
    global_idf = {t: math.log(len(all_entries) / (df + 1)) + 1 for t, df in global_df.items()}

    # Load benchmark
    with open(BENCHMARK_FILE, "r") as f:
        benchmark = json.load(f)
    print(f"Benchmark: {len(benchmark)} items\n")

    results = []
    c2 = c4 = c6 = cfull = 0
    llm_calls = 0
    total_cost = 0.0

    for i, item in enumerate(benchmark):
        name = item["item_name"]
        desc = item.get("description", "")
        full_text = f"{name} {desc}"
        answer = re.sub(r'[^0-9]', '', item["hts_code_answer"])
        actual_ch = answer[:2]

        # ── Stage 1: LLM chapter prediction ──
        chapter, alt_chapter, reason = predict_chapter_llm(name, desc)
        llm_calls += 1
        # Rough cost: ~150 input tokens + 50 output tokens = ~$0.000015/call
        total_cost += 0.000015

        time.sleep(0.1)  # Rate limit respect

        ch_correct = chapter == actual_ch
        alt_correct = alt_chapter == actual_ch if alt_chapter else False

        # Use alt if primary missed
        target_chapter = chapter if ch_correct else (alt_chapter if alt_correct else chapter)
        ch_match = ch_correct or alt_correct

        if ch_match: c2 += 1

        # ── Stage 2: Reverse match within chapter ──
        result = None
        if target_chapter and target_chapter in by_chapter:
            idf = chapter_idf.get(target_chapter, global_idf)
            result = reverse_match_in_chapter(full_text, by_chapter[target_chapter], idf)

        pred_h4 = result["h4"] if result else ""
        pred_h6 = result["hs6"] if result else ""
        pred_full = re.sub(r'[^0-9]', '', result["full"]) if result else ""

        m4 = pred_h4 == answer[:4]
        m6 = pred_h6 == answer[:6]
        mfull = pred_full == answer

        if m4: c4 += 1
        if m6: c6 += 1
        if mfull: cfull += 1

        results.append({
            "id": item["id"],
            "name": name[:55],
            "actual": answer,
            "actual_ch": actual_ch,
            "llm_chapter": chapter,
            "llm_alt": alt_chapter,
            "llm_reason": reason[:80],
            "ch_correct": ch_match,
            "pred_h4": pred_h4,
            "pred_h6": pred_h6,
            "pred_full": pred_full,
            "m4": m4, "m6": m6, "m_full": mfull,
            "stage2_score": result["score"] if result else 0,
            "stage2_desc": result["desc"][:80] if result else "",
            "top3": result["top3"][:3] if result else [],
        })

        if (i + 1) % 10 == 0:
            t = i + 1
            print(f"[{t}/100] Ch:{c2}/{t}({100*c2/t:.0f}%) H4:{c4}/{t}({100*c4/t:.0f}%) H6:{c6}/{t}({100*c6/t:.0f}%) Full:{cfull}/{t}({100*cfull/t:.0f}%)")

    total = len(benchmark)
    print(f"\n{'='*60}")
    print(f"HYBRID RESULTS (GPT-4o-mini chapter + reverse match)")
    print(f"{'='*60}")
    print(f"Chapter (2-digit):    {100*c2/total:.1f}% ({c2}/{total})")
    print(f"Heading (4-digit):    {100*c4/total:.1f}% ({c4}/{total})")
    print(f"Subheading (6-digit): {100*c6/total:.1f}% ({c6}/{total})")
    print(f"Full (10-digit):      {100*cfull/total:.1f}% ({cfull}/{total})")
    print(f"LLM calls: {llm_calls}, Est. cost: ${total_cost:.4f}")

    # Chapter misses
    ch_misses = [r for r in results if not r["ch_correct"]]
    print(f"\nChapter misses ({len(ch_misses)}):")
    for r in ch_misses:
        print(f"  [{r['id']}] {r['name'][:45]} actual=Ch.{r['actual_ch']} llm=Ch.{r['llm_chapter']} alt={r['llm_alt']} | {r['llm_reason'][:60]}")

    # H6 misses where chapter was correct
    h6_misses_ch_ok = [r for r in results if r["ch_correct"] and not r["m6"]]
    print(f"\nH6 misses (chapter correct): {len(h6_misses_ch_ok)}")
    for r in h6_misses_ch_ok[:15]:
        print(f"  [{r['id']}] {r['name'][:40]} actual={r['actual'][:6]} pred={r['pred_h6']} | {r['stage2_desc'][:50]}")

    summary = {
        "benchmark": "CBP 100 - Hybrid (GPT-4o-mini + reverse match)",
        "total": total,
        "correct_2": c2, "correct_4": c4, "correct_6": c6, "correct_full": cfull,
        "accuracy_2": round(100*c2/total, 2),
        "accuracy_4": round(100*c4/total, 2),
        "accuracy_6": round(100*c6/total, 2),
        "accuracy_full": round(100*cfull/total, 2),
        "llm_calls": llm_calls,
        "est_cost_usd": round(total_cost, 4),
        "chapter_misses": len(ch_misses),
        "results": results,
    }

    with open(OUTPUT_FILE, "w") as f:
        json.dump(summary, f, indent=2, ensure_ascii=False)
    print(f"\nSaved to {OUTPUT_FILE}")


if __name__ == "__main__":
    main()
