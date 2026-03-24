#!/usr/bin/env python3
"""
Hybrid v7 — v2 structure + GPT-4o + limited feedback (S3/S4 only)

Stage 1: GPT-4o → Chapter (no feedback, trust it)
Stage 2: GPT-4o → Heading (no feedback, trust it)
Stage 3: GPT-4o → Subheading. "None fit" → back to S2 with exclusion
Stage 4: GPT-4o → 10-digit. "None fit" → back to S3 with exclusion
"""

import csv, json, re, time
from collections import defaultdict
from openai import OpenAI

GOV_FILE = "/Volumes/soulmaten/POTAL/benchmark/gov_tariff_descriptions.csv"
BENCHMARK_FILE = "/Volumes/soulmaten/POTAL/benchmark_test_data.json"
OUTPUT_FILE = "/Volumes/soulmaten/POTAL/benchmark/results/hybrid_v7_results.json"

client = OpenAI(api_key=os.environ.get("OPENAI_API_KEY", ""))

MODEL = "gpt-4o"

CHAPTERS = {
    "01":"Live animals","02":"Meat and edible meat offal","03":"Fish, crustaceans, molluscs",
    "04":"Dairy; eggs; honey","05":"Products of animal origin (hair, bones, horns, ivory, coral)",
    "06":"Live trees, plants, bulbs, cut flowers","07":"Edible vegetables",
    "08":"Edible fruit and nuts; citrus peel","09":"Coffee, tea, mate, spices",
    "10":"Cereals","11":"Milling products; malt; starches; inulin; wheat gluten",
    "12":"Oil seeds, oleaginous fruits; miscellaneous grain, seed, fruit",
    "13":"Lac; gums, resins, other vegetable saps and extracts",
    "14":"Vegetable plaiting materials (bamboo, rattan, reeds, rushes)",
    "15":"Animal or vegetable fats, oils, greases, waxes; prepared edible fats",
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
    "36":"Explosives; pyrotechnic products; matches; combustible preparations; propellant powders",
    "37":"Photographic or cinematographic goods",
    "38":"Miscellaneous chemical products (pesticides, herbicides, disinfectants, etc.)",
    "39":"Plastics and articles thereof","40":"Rubber and articles thereof",
    "41":"Raw hides, skins (not furskins) and leather",
    "42":"Articles of leather; handbags; wallets; belts; travel goods",
    "43":"Furskins and artificial fur; manufactures thereof",
    "44":"Wood and articles of wood; wood charcoal",
    "45":"Cork and articles of cork",
    "46":"Manufactures of straw, esparto, other plaiting materials; basketware",
    "47":"Pulp of wood; recovered (waste and scrap) paper/paperboard",
    "48":"Paper and paperboard; articles of paper pulp, paper, paperboard",
    "49":"Printed books, newspapers, pictures; manuscripts, typescripts, plans; transfers, decals, labels",
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
    "62":"Articles of apparel and clothing accessories, not knitted or crocheted (woven)",
    "63":"Other made up textile articles; sets; worn clothing; rags",
    "64":"Footwear, gaiters and the like; parts of such articles",
    "65":"Headgear and parts thereof",
    "66":"Umbrellas, sun umbrellas, walking-sticks, seat-sticks, whips, riding-crops",
    "67":"Prepared feathers and down; artificial flowers; articles of human hair",
    "68":"Articles of stone, plaster, cement, asbestos, mica or similar materials",
    "69":"Ceramic products","70":"Glass and glassware",
    "71":"Natural/cultured pearls, precious stones, precious metals; imitation jewellery; coin",
    "72":"Iron and steel","73":"Articles of iron or steel",
    "74":"Copper and articles thereof","75":"Nickel and articles thereof",
    "76":"Aluminium and articles thereof","78":"Lead and articles thereof",
    "79":"Zinc and articles thereof","80":"Tin and articles thereof",
    "81":"Other base metals; cermets; articles thereof",
    "82":"Tools, implements, cutlery, spoons and forks, of base metal",
    "83":"Miscellaneous articles of base metal (clasps, hooks, hangers, statuettes, frames, signs, fittings)",
    "84":"Nuclear reactors, boilers, machinery and mechanical appliances; parts thereof",
    "85":"Electrical machinery and equipment; sound recorders; television; parts thereof",
    "86":"Railway or tramway locomotives, rolling-stock, track fixtures and fittings",
    "87":"Vehicles other than railway/tramway rolling-stock, and parts/accessories thereof",
    "88":"Aircraft, spacecraft, and parts thereof",
    "89":"Ships, boats and floating structures",
    "90":"Optical, photographic, measuring, checking, precision, medical/surgical instruments",
    "91":"Clocks and watches and parts thereof","92":"Musical instruments; parts and accessories",
    "93":"Arms and ammunition; parts and accessories thereof",
    "94":"Furniture; bedding, mattresses, cushions; lamps; illuminated signs; prefabricated buildings",
    "95":"Toys, games and sports requisites; parts and accessories thereof",
    "96":"Miscellaneous manufactured articles (brooms, brushes, buttons, pens, pencils, lighters, combs)",
    "97":"Works of art, collectors' pieces and antiques",
}


def load_us_data():
    entries = []
    with open(GOV_FILE, "r") as f:
        for row in csv.DictReader(f):
            if row["country"] != "US" or row["hs_code"][:2] in ("98", "99"):
                continue
            entries.append({"code": row["hs_code"], "desc": row.get("description", "")})
    desc_map = {e["code"]: e["desc"] for e in entries}
    by_ch = defaultdict(list)
    by_h4 = defaultdict(list)
    by_h6 = defaultdict(list)
    for e in entries:
        by_ch[e["code"][:2]].append(e)
        if len(e["code"]) >= 4: by_h4[e["code"][:4]].append(e)
        if len(e["code"]) >= 6: by_h6[e["code"][:6]].append(e)
    return entries, desc_map, by_ch, by_h4, by_h6


def ask(prompt, max_tokens=150):
    try:
        r = client.chat.completions.create(
            model=MODEL, messages=[{"role": "user", "content": prompt}],
            temperature=0, max_tokens=max_tokens,
        )
        return r.choices[0].message.content.strip()
    except Exception as e:
        return f"ERROR:{e}"


def s1_chapter(name, desc):
    ch_text = "\n".join(f"{k}: {v}" for k, v in CHAPTERS.items())
    prompt = f"""You are narrowing the HS tariff classification. Pick the 1-2 most likely chapters.

Product: {name}
{f"Description: {desc[:500]}" if desc else ""}

Chapters:
{ch_text}

Reply ONLY with comma-separated 2-digit codes."""
    text = ask(prompt, 20)
    pat = r'(\d{2})'
    return re.findall(pat, text)[:2]


def s2_heading(name, desc, ch, ch_entries):
    h4s = {}
    for e in ch_entries:
        h4 = e["code"][:4]
        if h4 not in h4s:
            h4s[h4] = e["desc"][:120]
    h_text = "\n".join(f"{k}: {v}" for k, v in sorted(h4s.items()))

    prompt = f"""Narrowing within Chapter {ch}. Pick 1-3 most likely headings.

Product: {name}
{f"Description: {desc[:400]}" if desc else ""}

Headings:
{h_text}

Reply ONLY with comma-separated 4-digit codes."""
    text = ask(prompt, 30)
    pat = r'(\d{4})'
    return re.findall(pat, text)[:3]


def s3_subheading(name, desc, h4, h4_entries, excluded=None):
    excluded = excluded or []
    subs = {}
    for e in h4_entries:
        if len(e["code"]) >= 6:
            h6 = e["code"][:6]
            if h6 not in subs and h6 not in excluded:
                subs[h6] = e["desc"][:120]
    if not subs:
        return "NONE", []

    s_text = "\n".join(f"{k}: {v}" for k, v in sorted(subs.items()))
    excl = f"\nAlready excluded (not these): {','.join(excluded)}" if excluded else ""

    prompt = f"""Narrowing within heading {h4}. Pick 1-2 most likely subheadings.
If NONE of these fit, reply exactly: NONE

Product: {name}
{f"Description: {desc[:350]}" if desc else ""}

Subheadings:
{s_text}{excl}

Reply with comma-separated 6-digit codes, or NONE."""
    text = ask(prompt, 30)
    if "NONE" in text.upper() and not re.findall(r'\d{6}', text):
        return "NONE", []
    codes = re.findall(r'(\d{6})', text)
    return "OK", [c for c in codes[:2] if c not in excluded]


def s4_national(name, desc, h6, h6_entries, excluded=None):
    excluded = excluded or []
    specifics = [e for e in h6_entries
                 if e["code"].startswith(h6) and len(e["code"]) > 6 and e["code"] not in excluded]
    if not specifics:
        return "ONLY", h6

    if len(specifics) == 1:
        return "OK", specifics[0]["code"]

    c_text = "\n".join(f"{e['code']}: {e['desc'][:100]}" for e in specifics)
    excl = f"\nAlready excluded: {','.join(excluded)}" if excluded else ""

    prompt = f"""Final narrowing within {h6}. Pick the single best code.
If NONE fit, reply: NONE

Product: {name}
{f"Description: {desc[:300]}" if desc else ""}

Codes:
{c_text}{excl}

Reply with ONLY one code, or NONE."""
    text = ask(prompt, 20)
    if "NONE" in text.upper() and not re.findall(r'\d{7,}', text):
        return "NONE", ""
    codes = re.findall(r'(\d{7,10})', text)
    if codes:
        valid = [c for c in codes if any(e["code"] == c for e in specifics)]
        if valid:
            return "OK", valid[0]
        # Prefix match
        for c in codes:
            for e in specifics:
                if e["code"].startswith(c) or c.startswith(e["code"]):
                    return "OK", e["code"]
    # Fallback: first non-"Other"
    for e in specifics:
        if e["desc"].strip().lower() not in ("other", "other:", "others"):
            return "OK", e["code"]
    return "OK", specifics[0]["code"]


def classify(name, desc, desc_map, by_ch, by_h4, by_h6):
    trace = []
    llm = 0
    fb = 0

    # ── S1: Chapter (no feedback) ──
    chapters = s1_chapter(name, desc)
    llm += 1
    if not chapters:
        return "", trace, llm, fb
    trace.append({"s": 1, "ch": chapters})

    for ch in chapters:
        if ch not in by_ch:
            continue

        # ── S2: Heading (no feedback) ──
        headings = s2_heading(name, desc, ch, by_ch[ch])
        llm += 1
        if not headings:
            continue
        trace.append({"s": 2, "ch": ch, "h4": headings})

        for h4 in headings:
            if h4 not in by_h4:
                continue

            # ── S3: Subheading (with feedback to S2) ──
            excluded_h6 = []
            for s3_try in range(3):
                status, subs = s3_subheading(name, desc, h4, by_h4[h4], excluded_h6)
                llm += 1
                if status == "NONE" or not subs:
                    fb += 1
                    trace.append({"s": 3, "h4": h4, "try": s3_try, "fb": "NONE→S2"})
                    break  # try next heading
                trace.append({"s": 3, "h4": h4, "try": s3_try, "h6": subs})

                for h6 in subs:
                    # ── S4: National line (with feedback to S3) ──
                    excluded_10 = []
                    for s4_try in range(2):
                        status4, code = s4_national(name, desc, h6, by_h6.get(h6, []), excluded_10)
                        llm += 1

                        if status4 == "ONLY":
                            trace.append({"s": 4, "h6": h6, "code": code, "note": "only_option"})
                            return code, trace, llm, fb

                        if status4 == "NONE":
                            fb += 1
                            trace.append({"s": 4, "h6": h6, "try": s4_try, "fb": "NONE→S3"})
                            excluded_h6.append(h6)
                            break  # back to S3

                        if status4 == "OK" and code:
                            trace.append({"s": 4, "h6": h6, "code": code})
                            return code, trace, llm, fb

                    # S4 exhausted for this h6 → try next sub
                    continue

                # If S4 didn't return for any sub, S3 feedback loop continues
                continue

            # S3 exhausted for this heading → try next heading
            continue

        # All headings exhausted for this chapter → try next chapter
        continue

    # Nothing worked — return best partial
    for t in reversed(trace):
        if "code" in t: return t["code"], trace, llm, fb
        if "h6" in t: return t["h6"][0], trace, llm, fb
        if "h4" in t: return t["h4"][0], trace, llm, fb
        if "ch" in t: return t["ch"][0], trace, llm, fb
    return "", trace, llm, fb


def main():
    print(f"Model: {MODEL}")
    print("Loading US HTS data...")
    entries, desc_map, by_ch, by_h4, by_h6 = load_us_data()
    print(f"Entries: {len(entries)}")

    with open(BENCHMARK_FILE, "r") as f:
        benchmark = json.load(f)
    print(f"Benchmark: {len(benchmark)} items\n")

    results = []
    c2 = c4 = c6 = c8 = cf = 0
    total_llm = 0
    total_fb = 0

    for i, item in enumerate(benchmark):
        name = item["item_name"]
        desc = item.get("description", "")
        answer = re.sub(r'[^0-9]', '', item["hts_code_answer"])

        code, trace, llm, fb = classify(name, desc, desc_map, by_ch, by_h4, by_h6)
        total_llm += llm
        total_fb += fb
        time.sleep(0.05)

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
        if mf: cf += 1

        results.append({
            "id": item["id"], "name": name[:55], "actual": answer,
            "predicted": pred, "pred_desc": desc_map.get(pred, "")[:80],
            "llm": llm, "fb": fb,
            "m2": m2, "m4": m4, "m6": m6, "m8": m8, "m_full": mf,
            "trace": trace,
        })

        if (i + 1) % 10 == 0:
            t = i + 1
            print(f"[{t}/100] Ch:{c2}/{t}({100*c2/t:.0f}%) H4:{c4}/{t}({100*c4/t:.0f}%) "
                  f"H6:{c6}/{t}({100*c6/t:.0f}%) H8:{c8}/{t}({100*c8/t:.0f}%) "
                  f"Full:{cf}/{t}({100*cf/t:.0f}%) | LLM:{total_llm} FB:{total_fb}")

    total = len(benchmark)

    # Cost: GPT-4o ~$2.50/1M input + $10/1M output. ~300 input + 20 output tokens per call
    cost_per_call = (300 * 2.50 + 20 * 10.0) / 1_000_000
    est_cost = total_llm * cost_per_call

    print(f"\n{'='*70}")
    print(f"HYBRID v7 — GPT-4o + top-down 4-stage + S3/S4 feedback")
    print(f"{'='*70}")
    print(f"Chapter  (2): {100*c2/total:.1f}% ({c2}/{total})")
    print(f"Heading  (4): {100*c4/total:.1f}% ({c4}/{total})")
    print(f"Subhead  (6): {100*c6/total:.1f}% ({c6}/{total})")
    print(f"Stat     (8): {100*c8/total:.1f}% ({c8}/{total})")
    print(f"Full    (10): {100*cf/total:.1f}% ({cf}/{total})")
    print(f"\nLLM calls: {total_llm} (avg {total_llm/total:.1f}/item)")
    print(f"Feedbacks: {total_fb}")
    print(f"Est cost: ~${est_cost:.4f}")

    # Key cases
    key_ids = {1, 5, 58, 98}
    print(f"\n--- Key Cases ---")
    for r in results:
        if r["id"] in key_ids:
            s = "✅" if r["m6"] else "❌"
            print(f"{s} [{r['id']}] {r['name'][:50]}")
            print(f"   Actual: {r['actual']}  Pred: {r['predicted']}  LLM:{r['llm']} FB:{r['fb']}")
            print(f"   Desc: {r['pred_desc']}")
            for t in r["trace"]:
                parts = []
                if "ch" in t: parts.append(f"ch={t['ch']}")
                if "h4" in t: parts.append(f"h4={t['h4']}")
                if "h6" in t: parts.append(f"h6={t['h6']}")
                if "code" in t: parts.append(f"code={t['code']}")
                if "fb" in t: parts.append(f"FB:{t['fb']}")
                print(f"   S{t['s']}: {' '.join(parts)}")
            print()

    # v2 comparison
    print("--- v2 vs v7 ---")
    try:
        v2 = json.load(open("/Volumes/soulmaten/POTAL/benchmark/results/hybrid_v2_results.json"))
        v2_map = {r["id"]: r for r in v2["results"]}
        gained = [r for r in results if r["m6"] and not v2_map.get(r["id"], {}).get("m6")]
        lost = [r for r in results if not r["m6"] and v2_map.get(r["id"], {}).get("m6")]
        v2_6 = sum(1 for r in v2["results"] if r.get("m6"))
        print(f"  v2: {v2_6}/100 (6-digit)  v7: {c6}/100")
        print(f"  Gained ({len(gained)}):")
        for r in gained[:10]:
            print(f"    [{r['id']}] {r['name'][:40]} → {r['predicted'][:6]}")
        print(f"  Lost ({len(lost)}):")
        for r in lost[:10]:
            print(f"    [{r['id']}] {r['name'][:40]} actual={r['actual'][:6]} pred={r['predicted'][:6]}")
    except Exception as e:
        print(f"  Comparison failed: {e}")

    summary = {
        "benchmark": f"CBP 100 — Hybrid v7 ({MODEL} + feedback S3/S4)",
        "model": MODEL,
        "total": total, "llm_calls": total_llm, "feedbacks": total_fb,
        "est_cost_usd": round(est_cost, 4),
        "accuracy": {
            "ch": round(100*c2/total, 2), "h4": round(100*c4/total, 2),
            "h6": round(100*c6/total, 2), "h8": round(100*c8/total, 2),
            "full": round(100*cf/total, 2),
        },
        "results": results,
    }
    with open(OUTPUT_FILE, "w") as f:
        json.dump(summary, f, indent=2, ensure_ascii=False)
    print(f"\nSaved to {OUTPUT_FILE}")


if __name__ == "__main__":
    main()
