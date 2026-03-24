#!/usr/bin/env python3
"""
Hybrid v6 — Top-down narrowing with feedback loops (v2 base)

Stage 1: 97 chapters → pick 1-3
Stage 2: ~30 headings in chapter → pick 1-3. "None fit" → back to S1 (exclude chapter)
Stage 3: ~10 subheadings in heading → pick 1-2. "None fit" → back to S2
Stage 4: ~5 stat suffixes in subheading → pick 1. "None fit" → back to S3

Every stage NARROWS, never decides. Feedback carries exclusion info.
"""

import csv, json, re, time
from collections import defaultdict
from openai import OpenAI

GOV_FILE = "/Volumes/soulmaten/POTAL/benchmark/gov_tariff_descriptions.csv"
BENCHMARK_FILE = "/Volumes/soulmaten/POTAL/benchmark_test_data.json"
OUTPUT_FILE = "/Volumes/soulmaten/POTAL/benchmark/results/hybrid_v6_results.json"

client = OpenAI(api_key=os.environ.get("OPENAI_API_KEY", ""))

CHAPTERS = {
    "01":"Live animals","02":"Meat and edible meat offal","03":"Fish, crustaceans, molluscs",
    "04":"Dairy; eggs; honey","05":"Products of animal origin (hair, bones, horns, ivory, coral)",
    "06":"Live trees, plants, bulbs, cut flowers","07":"Edible vegetables",
    "08":"Edible fruit and nuts; citrus peel","09":"Coffee, tea, mate, spices",
    "10":"Cereals","11":"Milling products; malt; starches; inulin; wheat gluten",
    "12":"Oil seeds, oleaginous fruits; miscellaneous grain, seed, fruit",
    "13":"Lac; gums, resins, other vegetable saps and extracts",
    "14":"Vegetable plaiting materials (bamboo, rattan, reeds, rushes)",
    "15":"Animal or vegetable fats, oils, greases, waxes",
    "16":"Preparations of meat, fish, crustaceans","17":"Sugars and sugar confectionery",
    "18":"Cocoa and cocoa preparations","19":"Preparations of cereals, flour, starch, milk; bakers' wares",
    "20":"Preparations of vegetables, fruit, nuts","21":"Miscellaneous edible preparations",
    "22":"Beverages, spirits, vinegar","23":"Residues from food industries; animal feed",
    "24":"Tobacco and manufactured tobacco substitutes",
    "25":"Salt; sulphur; earths, stone; cement, lime","26":"Ores, slag and ash",
    "27":"Mineral fuels, petroleum oils, waxes, bituminous substances",
    "28":"Inorganic chemicals; compounds of precious/rare-earth metals, radioactive elements",
    "29":"Organic chemicals","30":"Pharmaceutical products",
    "31":"Fertilisers","32":"Tanning/dyeing extracts; paints, varnishes, putty, inks",
    "33":"Essential oils, resinoids; perfumery, cosmetics, toiletries",
    "34":"Soap; waxes; scouring preparations; candles; dental preparations",
    "35":"Albuminoidal substances; modified starches; glues; enzymes",
    "36":"Explosives; pyrotechnic products; matches; pyrophoric alloys; combustible preparations",
    "37":"Photographic or cinematographic goods",
    "38":"Miscellaneous chemical products (pesticides, solvents, activated carbon, etc.)",
    "39":"Plastics and articles thereof","40":"Rubber and articles thereof",
    "41":"Raw hides, skins (not furskins) and leather",
    "42":"Articles of leather; handbags; wallets; belts; travel goods",
    "43":"Furskins and artificial fur; manufactures thereof",
    "44":"Wood and articles of wood; wood charcoal",
    "45":"Cork and articles of cork","46":"Manufactures of straw, esparto, other plaiting materials; basketware",
    "47":"Pulp of wood; recovered (waste and scrap) paper/paperboard",
    "48":"Paper and paperboard; articles of paper pulp, paper, paperboard",
    "49":"Printed books, newspapers, pictures; manuscripts, typescripts, plans; decals, labels, transfers",
    "50":"Silk, including yarns and woven fabrics thereof",
    "51":"Wool, fine or coarse animal hair; horsehair yarn and woven fabric",
    "52":"Cotton, including yarns and woven fabrics thereof",
    "53":"Other vegetable textile fibres; paper yarn and woven fabrics of paper yarn",
    "54":"Man-made filaments; strip and the like of man-made textile materials",
    "55":"Man-made staple fibres","56":"Wadding, felt, nonwovens; special yarns; twine, cordage, ropes",
    "57":"Carpets and other textile floor coverings",
    "58":"Special woven fabrics; tufted textile fabrics; lace; tapestries; trimmings; embroidery",
    "59":"Impregnated, coated, covered or laminated textile fabrics; textile articles for industrial use",
    "60":"Knitted or crocheted fabrics",
    "61":"Articles of apparel and clothing accessories, knitted or crocheted",
    "62":"Articles of apparel and clothing accessories, not knitted or crocheted",
    "63":"Other made up textile articles; sets; worn clothing and worn textile articles; rags",
    "64":"Footwear, gaiters and the like; parts of such articles",
    "65":"Headgear and parts thereof",
    "66":"Umbrellas, sun umbrellas, walking-sticks, seat-sticks, whips, riding-crops; parts thereof",
    "67":"Prepared feathers and down; artificial flowers; articles of human hair",
    "68":"Articles of stone, plaster, cement, asbestos, mica or similar materials",
    "69":"Ceramic products","70":"Glass and glassware",
    "71":"Natural or cultured pearls, precious or semi-precious stones, precious metals; imitation jewellery; coin",
    "72":"Iron and steel","73":"Articles of iron or steel",
    "74":"Copper and articles thereof","75":"Nickel and articles thereof",
    "76":"Aluminium and articles thereof","78":"Lead and articles thereof",
    "79":"Zinc and articles thereof","80":"Tin and articles thereof",
    "81":"Other base metals; cermets; articles thereof",
    "82":"Tools, implements, cutlery, spoons and forks, of base metal; parts thereof",
    "83":"Miscellaneous articles of base metal (clasps, hooks, hangers, statuettes, frames, signs)",
    "84":"Nuclear reactors, boilers, machinery and mechanical appliances; parts thereof",
    "85":"Electrical machinery and equipment and parts; sound recorders, television",
    "86":"Railway or tramway locomotives, rolling-stock, track fixtures and fittings",
    "87":"Vehicles other than railway or tramway rolling-stock, and parts/accessories",
    "88":"Aircraft, spacecraft, and parts thereof",
    "89":"Ships, boats and floating structures",
    "90":"Optical, photographic, cinematographic, measuring, checking, precision, medical instruments",
    "91":"Clocks and watches and parts thereof","92":"Musical instruments; parts and accessories thereof",
    "93":"Arms and ammunition; parts and accessories thereof",
    "94":"Furniture; bedding, mattresses, cushions; lamps; illuminated signs; prefabricated buildings",
    "95":"Toys, games and sports requisites; parts and accessories thereof",
    "96":"Miscellaneous manufactured articles (brooms, brushes, pens, pencils, buttons, lighters, combs)",
    "97":"Works of art, collectors' pieces and antiques",
}


def load_us_data():
    entries = []
    with open(GOV_FILE, "r") as f:
        for row in csv.DictReader(f):
            if row["country"] != "US" or row["hs_code"][:2] in ("98","99"):
                continue
            entries.append({"code": row["hs_code"], "desc": row.get("description","")})
    desc_map = {e["code"]: e["desc"] for e in entries}
    by_chapter = defaultdict(list)
    by_heading = defaultdict(list)
    by_subheading = defaultdict(list)
    for e in entries:
        by_chapter[e["code"][:2]].append(e)
        if len(e["code"]) >= 4:
            by_heading[e["code"][:4]].append(e)
        if len(e["code"]) >= 6:
            by_subheading[e["code"][:6]].append(e)
    return entries, desc_map, by_chapter, by_heading, by_subheading


def ask_llm(prompt):
    try:
        resp = client.chat.completions.create(
            model="gpt-4o-mini", messages=[{"role":"user","content":prompt}],
            temperature=0, max_tokens=300,
        )
        return resp.choices[0].message.content.strip()
    except Exception as e:
        return f"ERROR: {e}"


def stage1_chapter(name, desc, excluded=None):
    """Pick 1-3 chapters from 97. Returns list of chapter codes."""
    excluded = excluded or []
    ch_lines = []
    for k, v in CHAPTERS.items():
        if k not in excluded:
            ch_lines.append(f"{k}: {v}")
    ch_text = "\n".join(ch_lines)

    excl_note = ""
    if excluded:
        excl_note = f"\n\nPreviously tried and EXCLUDED (do NOT pick these): {', '.join(excluded)}"

    prompt = f"""You are narrowing the HS classification for this product. Do NOT pick a final answer — just narrow to the most likely chapter(s).

Product: {name}
{f"Details: {desc[:400]}" if desc else ""}
{excl_note}

Chapters:
{ch_text}

RULES:
- Return 1-3 most likely chapters
- If the product could plausibly fit multiple chapters, include all of them
- Printed lanyards/flags/pennants/labels/decals → Ch.49
- Costumes/fancy dress → Ch.95
- Furskins/artificial fur → Ch.43
- Animal fats/greases/used cooking oil → Ch.15
- Organic chemicals (CAS numbers) → Ch.29
- Propellant powder/pyrotechnics → Ch.36
- Composite goods: essential character (GRI 3b)

Reply ONLY with comma-separated 2-digit codes. Example: 49,63"""

    text = ask_llm(prompt)
    codes = re.findall(r'(\d{2})', text)
    return [c for c in codes[:3] if c not in excluded]


def stage2_heading(name, desc, chapter, chapter_entries, excluded_headings=None):
    """Pick 1-3 headings within a chapter. Returns headings or "NONE"."""
    excluded_headings = excluded_headings or []

    # Build heading list (unique 4-digit with descriptions)
    headings = {}
    for e in chapter_entries:
        h4 = e["code"][:4]
        if h4 not in headings and h4 not in excluded_headings:
            headings[h4] = e["desc"][:120]

    if not headings:
        return "NONE", []

    h_text = "\n".join(f"{k}: {v}" for k, v in sorted(headings.items()))
    excl_note = ""
    if excluded_headings:
        excl_note = f"\nExcluded headings (already tried, don't pick): {', '.join(excluded_headings)}"

    prompt = f"""You are narrowing the HS classification within Chapter {chapter}.

Product: {name}
{f"Details: {desc[:350]}" if desc else ""}

Headings in Ch.{chapter}:
{h_text}
{excl_note}

Pick 1-3 most likely headings.
If NONE of these headings fit this product, reply exactly: NONE

Reply with comma-separated 4-digit codes, or NONE."""

    text = ask_llm(prompt)
    if "NONE" in text.upper() and not re.findall(r'\d{4}', text):
        return "NONE", []

    codes = re.findall(r'(\d{4})', text)
    return "OK", [c for c in codes[:3] if c not in excluded_headings]


def stage3_subheading(name, desc, heading, heading_entries, excluded_sub=None):
    """Pick 1-2 subheadings (6-digit) within a heading. Returns subheadings or "NONE"."""
    excluded_sub = excluded_sub or []

    subs = {}
    for e in heading_entries:
        if len(e["code"]) >= 6:
            h6 = e["code"][:6]
            if h6 not in subs and h6 not in excluded_sub:
                subs[h6] = e["desc"][:120]

    if not subs:
        return "NONE", []

    s_text = "\n".join(f"{k}: {v}" for k, v in sorted(subs.items()))
    excl_note = ""
    if excluded_sub:
        excl_note = f"\nExcluded (already tried): {', '.join(excluded_sub)}"

    prompt = f"""Narrowing within heading {heading}.

Product: {name}
{f"Details: {desc[:300]}" if desc else ""}

Subheadings:
{s_text}
{excl_note}

Pick 1-2 most likely subheadings.
If NONE fit, reply exactly: NONE

Reply with comma-separated 6-digit codes, or NONE."""

    text = ask_llm(prompt)
    if "NONE" in text.upper() and not re.findall(r'\d{6}', text):
        return "NONE", []

    codes = re.findall(r'(\d{6})', text)
    return "OK", [c for c in codes[:2] if c not in excluded_sub]


def stage4_national(name, desc, subheading, sub_entries):
    """Pick the best 8-10 digit code within a subheading."""
    codes_in_sub = []
    for e in sub_entries:
        if e["code"].startswith(subheading) and len(e["code"]) > 6:
            codes_in_sub.append(e)

    if not codes_in_sub:
        return subheading  # No more specific codes exist

    if len(codes_in_sub) == 1:
        return codes_in_sub[0]["code"]  # Only one option

    c_text = "\n".join(f"{e['code']}: {e['desc'][:100]}" for e in codes_in_sub)

    prompt = f"""Final narrowing within subheading {subheading}.

Product: {name}
{f"Details: {desc[:250]}" if desc else ""}

Available codes:
{c_text}

Pick the single BEST matching code. Consider material, form, value, weight conditions.
If multiple could work, pick the most specific one that matches.

Reply with ONLY one code."""

    text = ask_llm(prompt)
    codes = re.findall(r'(\d{8,10})', text)
    if codes:
        # Validate
        valid = [c for c in codes if any(e["code"] == c for e in codes_in_sub)]
        if valid:
            return valid[0]
        # Try prefix match
        for c in codes:
            for e in codes_in_sub:
                if e["code"].startswith(c) or c.startswith(e["code"]):
                    return e["code"]
    # Fallback: first non-"Other" code
    for e in codes_in_sub:
        if e["desc"].strip().lower() not in ("other","other:","others"):
            return e["code"]
    return codes_in_sub[0]["code"]


def classify(name, desc, entries, desc_map, by_chapter, by_heading, by_subheading):
    """Full classification with feedback loops. Returns (code, trace)."""
    trace = []
    llm_calls = 0
    excluded_chapters = []
    max_ch_retries = 2

    for ch_attempt in range(1 + max_ch_retries):
        # ── Stage 1: Chapter ──
        chapters = stage1_chapter(name, desc, excluded=excluded_chapters)
        llm_calls += 1

        if not chapters:
            trace.append({"stage":1, "attempt":ch_attempt, "result":"no_chapters"})
            break

        trace.append({"stage":1, "attempt":ch_attempt, "chapters":chapters})

        for ch in chapters:
            if ch not in by_chapter:
                continue

            excluded_headings = []
            max_h_retries = 1

            for h_attempt in range(1 + max_h_retries):
                # ── Stage 2: Heading ──
                status, headings = stage2_heading(name, desc, ch, by_chapter[ch], excluded_headings)
                llm_calls += 1

                if status == "NONE" or not headings:
                    trace.append({"stage":2, "chapter":ch, "attempt":h_attempt, "result":"NONE_feedback_to_S1"})
                    excluded_chapters.append(ch)
                    break  # back to S1

                trace.append({"stage":2, "chapter":ch, "attempt":h_attempt, "headings":headings})

                for h4 in headings:
                    if h4 not in by_heading:
                        continue

                    excluded_subs = []
                    max_s_retries = 1

                    for s_attempt in range(1 + max_s_retries):
                        # ── Stage 3: Subheading ──
                        status, subs = stage3_subheading(name, desc, h4, by_heading[h4], excluded_subs)
                        llm_calls += 1

                        if status == "NONE" or not subs:
                            trace.append({"stage":3, "heading":h4, "attempt":s_attempt, "result":"NONE_feedback_to_S2"})
                            excluded_headings.append(h4)
                            break  # back to S2

                        trace.append({"stage":3, "heading":h4, "attempt":s_attempt, "subs":subs})

                        for h6 in subs:
                            # ── Stage 4: National line ──
                            sub_entries = by_subheading.get(h6, [])
                            final_code = stage4_national(name, desc, h6, sub_entries)
                            llm_calls += 1

                            trace.append({"stage":4, "subheading":h6, "final":final_code})
                            return final_code, trace, llm_calls

                        # If we get here, all subs tried → feedback to S2
                        continue

                    # After heading retries, if still no result, try next heading
                    continue

                # If all headings exhausted, feedback to S1
                if not any(t.get("stage") == 4 for t in trace):
                    excluded_chapters.append(ch)
                    continue

            # If we reached stage 4, we already returned
            continue

    # Fallback: use whatever path we got
    # Find best partial result from trace
    for t in reversed(trace):
        if t.get("stage") == 4 and t.get("final"):
            return t["final"], trace, llm_calls
        if t.get("stage") == 3 and t.get("subs"):
            return t["subs"][0], trace, llm_calls
        if t.get("stage") == 2 and t.get("headings"):
            return t["headings"][0], trace, llm_calls
        if t.get("stage") == 1 and t.get("chapters"):
            return t["chapters"][0], trace, llm_calls

    return "", trace, llm_calls


def main():
    print("Loading US HTS data...")
    entries, desc_map, by_chapter, by_heading, by_subheading = load_us_data()
    print(f"Entries: {len(entries)}, Chapters: {len(by_chapter)}, Headings: {len(by_heading)}, Subheadings: {len(by_subheading)}")

    with open(BENCHMARK_FILE, "r") as f:
        benchmark = json.load(f)
    print(f"Benchmark: {len(benchmark)} items\n")

    results = []
    c2 = c4 = c6 = c8 = cfull = 0
    total_llm = 0
    feedback_count = 0

    for i, item in enumerate(benchmark):
        name = item["item_name"]
        desc = item.get("description", "")
        answer = re.sub(r'[^0-9]', '', item["hts_code_answer"])

        code, trace, llm_calls = classify(name, desc, entries, desc_map, by_chapter, by_heading, by_subheading)
        total_llm += llm_calls
        time.sleep(0.02)

        # Count feedbacks
        for t in trace:
            if "feedback" in str(t.get("result", "")):
                feedback_count += 1

        pred = code or ""
        m2 = len(pred) >= 2 and pred[:2] == answer[:2]
        m4 = len(pred) >= 4 and pred[:4] == answer[:4]
        m6 = len(pred) >= 6 and pred[:6] == answer[:6]
        m8 = len(pred) >= 8 and len(answer) >= 8 and pred[:8] == answer[:8]
        mf = pred == answer

        if m2: c2 += 1
        if m4: c4 += 1
        if m6: c6 += 1
        if m8: c8 += 1
        if mf: cfull += 1

        # Compact trace for output
        compact_trace = []
        for t in trace:
            ct = {"s": t.get("stage"), "r": t.get("result","")}
            if "chapters" in t: ct["ch"] = t["chapters"]
            if "headings" in t: ct["h4"] = t["headings"]
            if "subs" in t: ct["h6"] = t["subs"]
            if "final" in t: ct["code"] = t["final"]
            compact_trace.append(ct)

        results.append({
            "id": item["id"], "name": name[:55], "actual": answer,
            "predicted": pred, "pred_desc": desc_map.get(pred,"")[:80],
            "llm_calls": llm_calls,
            "m2":m2, "m4":m4, "m6":m6, "m8":m8, "m_full":mf,
            "trace": compact_trace,
        })

        if (i+1) % 10 == 0:
            t = i+1
            print(f"[{t}/100] Ch:{c2}/{t}({100*c2/t:.0f}%) H4:{c4}/{t}({100*c4/t:.0f}%) "
                  f"H6:{c6}/{t}({100*c6/t:.0f}%) H8:{c8}/{t}({100*c8/t:.0f}%) "
                  f"Full:{cfull}/{t}({100*cfull/t:.0f}%) LLM:{total_llm} FB:{feedback_count}")

    total = len(benchmark)
    print(f"\n{'='*70}")
    print(f"HYBRID v6 — Top-down narrowing + feedback loops (v2 base)")
    print(f"{'='*70}")
    print(f"Chapter  (2): {100*c2/total:.1f}% ({c2}/{total})")
    print(f"Heading  (4): {100*c4/total:.1f}% ({c4}/{total})")
    print(f"Subhead  (6): {100*c6/total:.1f}% ({c6}/{total})")
    print(f"Stat     (8): {100*c8/total:.1f}% ({c8}/{total})")
    print(f"Full    (10): {100*cfull/total:.1f}% ({cfull}/{total})")
    print(f"\nLLM calls: {total_llm} (avg {total_llm/total:.1f}/item), Feedbacks: {feedback_count}")
    print(f"Est cost: ~${total_llm * 0.00005:.4f}")

    # Key cases
    key_ids = {1, 5, 58, 98}
    print(f"\n--- Key Cases ---")
    for r in results:
        if r["id"] in key_ids:
            s = "✅" if r["m6"] else "❌"
            print(f"{s} [{r['id']}] {r['name'][:50]}")
            print(f"   Actual: {r['actual']}  Pred: {r['predicted']}  LLM:{r['llm_calls']}")
            print(f"   Desc: {r['pred_desc']}")
            # Show trace
            for t in r["trace"]:
                if t.get("ch"): print(f"   S1: chapters={t['ch']}")
                elif t.get("h4"): print(f"   S2: headings={t['h4']}")
                elif t.get("h6"): print(f"   S3: subs={t['h6']}")
                elif t.get("code"): print(f"   S4: final={t['code']}")
                elif t.get("r"): print(f"   FB: {t['r']}")
            print()

    # v2 comparison
    print("--- v2 vs v6 (6-digit) ---")
    try:
        v2 = json.load(open("/Volumes/soulmaten/POTAL/benchmark/results/hybrid_v2_results.json"))
        v2_map = {r["id"]: r for r in v2["results"]}
        gained = [r for r in results if r["m6"] and not v2_map.get(r["id"],{}).get("m6")]
        lost = [r for r in results if not r["m6"] and v2_map.get(r["id"],{}).get("m6")]
        print(f"  v2 H6: {v2['accuracy']['accuracy_6']}%  v6 H6: {100*c6/total:.1f}%")
        print(f"  Gained: {len(gained)}")
        for r in gained[:8]:
            print(f"    [{r['id']}] {r['name'][:40]}")
        print(f"  Lost: {len(lost)}")
        for r in lost[:8]:
            print(f"    [{r['id']}] {r['name'][:40]} actual={r['actual'][:6]} pred={r['predicted'][:6]}")
    except Exception as e:
        print(f"  v2 comparison failed: {e}")

    summary = {
        "benchmark": "CBP 100 — Hybrid v6 (top-down + feedback)",
        "total": total, "llm_calls": total_llm, "feedbacks": feedback_count,
        "accuracy": {"ch":round(100*c2/total,2),"h4":round(100*c4/total,2),
            "h6":round(100*c6/total,2),"h8":round(100*c8/total,2),"full":round(100*cfull/total,2)},
        "results": results,
    }
    with open(OUTPUT_FILE, "w") as f:
        json.dump(summary, f, indent=2, ensure_ascii=False)
    print(f"\nSaved to {OUTPUT_FILE}")


if __name__ == "__main__":
    main()
