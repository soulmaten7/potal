#!/usr/bin/env python3
"""
Hybrid v5 — Iterative Narrowing with Feedback Loop

Core changes from v4:
1. LLM never "decides" — only narrows. "Don't pick the answer. Narrow candidates."
2. Full country-specific code list as input (US=28,718)
3. Up to 4 LLM rounds with tree elimination between each
4. Early exit when narrowed to 1 code
"""

import csv, json, re, time
from collections import Counter, defaultdict
from openai import OpenAI

GOV_FILE = "/Volumes/soulmaten/POTAL/benchmark/gov_tariff_descriptions.csv"
BENCHMARK_FILE = "/Volumes/soulmaten/POTAL/benchmark_test_data.json"
OUTPUT_FILE = "/Volumes/soulmaten/POTAL/benchmark/results/hybrid_v5_results.json"

client = OpenAI(api_key=os.environ.get("OPENAI_API_KEY", ""))


# ─── Data Loading ─────────────────────────────────────────

def load_data():
    by_country = defaultdict(list)
    with open(GOV_FILE, "r") as f:
        for row in csv.DictReader(f):
            code = row["hs_code"]
            if code[:2] in ("98", "99"):
                continue
            by_country[row["country"]].append({
                "code": code,
                "desc": row.get("description", ""),
            })
    # Build desc_map per country
    desc_maps = {}
    for country, entries in by_country.items():
        desc_maps[country] = {e["code"]: e["desc"] for e in entries}
    return by_country, desc_maps


def build_chapter_index(entries):
    """Group entries by chapter, with heading-level summaries."""
    chapters = defaultdict(list)
    for e in entries:
        chapters[e["code"][:2]].append(e)

    # Build chapter summaries: chapter → list of headings with descriptions
    ch_summaries = {}
    for ch, ch_entries in chapters.items():
        headings = {}
        for e in ch_entries:
            h4 = e["code"][:4]
            if h4 not in headings:
                headings[h4] = e["desc"][:100]
        ch_summaries[ch] = headings

    return chapters, ch_summaries


# ─── LLM Narrowing ───────────────────────────────────────

def llm_narrow(product_name, description, code_list_text, round_num, prev_context=""):
    """
    Ask LLM to narrow candidates. Never pick a final answer.
    Returns list of code strings the LLM thinks are possible.
    """
    if round_num == 1:
        instruction = f"""You are a US Customs classification expert. Your job is NOT to pick the final answer.
Your job is to NARROW DOWN the candidates.

Product to classify: {product_name}
{f"Product details: {description[:500]}" if description else ""}

Below is the complete list of HS code headings (4-digit) with descriptions.
Return ALL headings (4-digit codes) that could POSSIBLY apply to this product.
Do NOT limit the number — return every heading that has any chance of being correct.
If you're unsure whether a heading applies, INCLUDE it.

{code_list_text}

Reply with ONLY comma-separated 4-digit codes. Nothing else."""

    elif round_num == 2:
        instruction = f"""You are narrowing HS classification candidates. Do NOT pick a final answer.

Product: {product_name}
{f"Details: {description[:400]}" if description else ""}

Previous round narrowed to these headings. Now look at the SPECIFIC subheadings and statistical suffixes below.
Return ALL codes that could POSSIBLY apply. Include every code with any chance of being correct.
If you cannot narrow further, return all of them.

Remaining candidates:
{code_list_text}

{prev_context}

Reply with ONLY comma-separated codes. Nothing else."""

    elif round_num == 3:
        instruction = f"""Continue narrowing. Do NOT pick a final answer unless only one code remains.

Product: {product_name}
{f"Details: {description[:300]}" if description else ""}

Remaining candidates after previous rounds:
{code_list_text}

Consider:
- Material composition (cotton, polyester, steel, etc.)
- Product form (powder, liquid, sheet, wire, etc.)
- Construction method (knitted, woven, cast, forged, etc.)
- Value/weight thresholds in the descriptions
- "Other" codes are catch-alls — only use if no specific code matches

{prev_context}

Reply with ONLY comma-separated codes of ALL that could still apply."""

    else:  # round 4
        instruction = f"""Final narrowing round. If you can narrow to 1-3 codes, do it. If not, return all remaining.

Product: {product_name}
{f"Details: {description[:200]}" if description else ""}

Remaining candidates:
{code_list_text}

{prev_context}

Pick the MOST LIKELY codes. Reply with ONLY comma-separated codes."""

    try:
        resp = client.chat.completions.create(
            model="gpt-4o-mini",
            messages=[{"role": "user", "content": instruction}],
            temperature=0,
            max_tokens=500,
        )
        text = resp.choices[0].message.content.strip()
        codes = re.findall(r'(\d{4,10})', text)
        return codes
    except Exception as e:
        print(f"  LLM R{round_num} error: {e}")
        return []


# ─── Tree Elimination ────────────────────────────────────

def tree_eliminate(candidates, desc_map):
    """
    Given candidate codes, vote for ancestors and walk down the tree.
    Returns the single best code path.
    """
    if not candidates:
        return None

    # Validate against desc_map
    valid = set()
    for c in candidates:
        if c in desc_map:
            valid.add(c)
        # Expand: find all desc_map codes that start with this candidate
        for k in desc_map:
            if k.startswith(c):
                valid.add(k)

    if not valid:
        valid = set(candidates)

    # Vote
    votes = Counter()
    for code in valid:
        for length in (10, 8, 6, 4, 2):
            if len(code) >= length:
                votes[code[:length]] += 1

    # Walk down picking highest-voted
    path = []
    for level in (2, 4, 6, 8, 10):
        parent = path[-1] if path else ""
        level_votes = {k: v for k, v in votes.items()
                       if len(k) == level and k.startswith(parent)}
        if level_votes:
            best = max(level_votes, key=lambda k: (level_votes[k], k))
            path.append(best)

    return path[-1] if path else list(valid)[0], path, dict(votes)


def get_children_text(parent_code, entries, desc_map):
    """Get formatted text of all codes under a parent code."""
    children = []
    for e in entries:
        if e["code"].startswith(parent_code) and e["code"] != parent_code:
            d = e["desc"][:100]
            children.append(f"{e['code']}: {d}")
    return "\n".join(children)


# ─── Main Pipeline ────────────────────────────────────────

def classify_product(product_name, description, dest_country, country_entries, desc_map):
    """
    Full classification pipeline with up to 4 narrowing rounds.
    Returns (final_code, path, round_completed, llm_calls, trace).
    """
    trace = []
    total_llm = 0

    # ── Round 1: Narrow from all headings ──
    # Build heading list (4-digit with descriptions)
    headings = {}
    for e in country_entries:
        h4 = e["code"][:4]
        if h4 not in headings:
            headings[h4] = e["desc"][:100]

    heading_text = "\n".join(f"{k}: {v}" for k, v in sorted(headings.items()))
    r1_codes = llm_narrow(product_name, description, heading_text, round_num=1)
    total_llm += 1

    if not r1_codes:
        return None, [], 0, total_llm, trace

    # Expand headings to all codes under them
    r1_expanded = set()
    for h4 in r1_codes:
        h4 = h4[:4]
        for e in country_entries:
            if e["code"][:4] == h4:
                r1_expanded.add(e["code"])

    trace.append({"round": 1, "input_headings": len(headings), "llm_returned": len(r1_codes),
                   "expanded": len(r1_expanded), "headings": r1_codes[:20]})

    # Tree eliminate to find consensus path
    best_code, path, votes = tree_eliminate(list(r1_expanded), desc_map)

    # If only 1 heading returned → might be done
    unique_h6 = set(c[:6] for c in r1_expanded if len(c) >= 6)
    if len(unique_h6) <= 1 and len(r1_expanded) <= 1:
        return best_code, path, 1, total_llm, trace

    # ── Round 2: Narrow within selected headings ──
    # Get all codes under the top heading(s) from round 1
    r1_headings = set(c[:4] for c in r1_codes if len(c) >= 4)
    # Limit to top 5 headings by vote count
    h4_votes = Counter()
    for c in r1_expanded:
        h4_votes[c[:4]] += 1
    top_h4 = [h for h, _ in h4_votes.most_common(5)]

    r2_pool = [e for e in country_entries if e["code"][:4] in top_h4]
    r2_text = "\n".join(f"{e['code']}: {e['desc'][:100]}" for e in r2_pool)

    # Truncate if too long
    if len(r2_text) > 15000:
        r2_pool = r2_pool[:300]
        r2_text = "\n".join(f"{e['code']}: {e['desc'][:80]}" for e in r2_pool)

    prev = f"Round 1 narrowed to headings: {', '.join(top_h4)}"
    r2_codes = llm_narrow(product_name, description, r2_text, round_num=2, prev_context=prev)
    total_llm += 1

    if not r2_codes:
        return best_code, path, 1, total_llm, trace

    # Validate r2 codes
    r2_valid = set()
    for c in r2_codes:
        if c in desc_map:
            r2_valid.add(c)
        for k in desc_map:
            if k.startswith(c) or c.startswith(k):
                r2_valid.add(k)

    if not r2_valid:
        r2_valid = set(r2_codes)

    best_code, path, votes = tree_eliminate(list(r2_valid), desc_map)
    trace.append({"round": 2, "input_codes": len(r2_pool), "llm_returned": len(r2_codes),
                   "validated": len(r2_valid)})

    if len(r2_valid) <= 1:
        return best_code, path, 2, total_llm, trace

    # ── Round 3: Further narrowing ──
    # Use only the remaining valid codes
    r3_text = "\n".join(f"{c}: {desc_map.get(c, '?')[:100]}" for c in sorted(r2_valid))
    if len(r3_text) > 10000:
        r2_valid_list = sorted(r2_valid)[:200]
        r3_text = "\n".join(f"{c}: {desc_map.get(c, '?')[:80]}" for c in r2_valid_list)

    prev = f"Round 2 narrowed to {len(r2_valid)} codes under headings {', '.join(top_h4)}"
    r3_codes = llm_narrow(product_name, description, r3_text, round_num=3, prev_context=prev)
    total_llm += 1

    if not r3_codes:
        return best_code, path, 2, total_llm, trace

    r3_valid = set()
    for c in r3_codes:
        if c in desc_map:
            r3_valid.add(c)
        for k in desc_map:
            if k.startswith(c) and len(k) - len(c) <= 4:
                r3_valid.add(k)

    if r3_valid:
        best_code, path, votes = tree_eliminate(list(r3_valid), desc_map)
    trace.append({"round": 3, "llm_returned": len(r3_codes), "validated": len(r3_valid)})

    if len(r3_valid) <= 1:
        return best_code, path, 3, total_llm, trace

    # ── Round 4: Final narrowing ──
    r4_text = "\n".join(f"{c}: {desc_map.get(c, '?')[:100]}" for c in sorted(r3_valid)[:50])
    prev = f"Round 3 narrowed to {len(r3_valid)} codes"
    r4_codes = llm_narrow(product_name, description, r4_text, round_num=4, prev_context=prev)
    total_llm += 1

    if r4_codes:
        r4_valid = set()
        for c in r4_codes:
            if c in desc_map:
                r4_valid.add(c)
            for k in desc_map:
                if k == c or (k.startswith(c) and len(k) - len(c) <= 2):
                    r4_valid.add(k)
        if r4_valid:
            best_code, path, votes = tree_eliminate(list(r4_valid), desc_map)

    trace.append({"round": 4, "llm_returned": len(r4_codes) if r4_codes else 0})

    return best_code, path, 4, total_llm, trace


# ─── Main ─────────────────────────────────────────────────

def main():
    print("Loading data...")
    by_country, desc_maps = load_data()
    for c, entries in by_country.items():
        print(f"  {c}: {len(entries)} entries")

    with open(BENCHMARK_FILE, "r") as f:
        benchmark = json.load(f)
    print(f"Benchmark: {len(benchmark)} items\n")

    dest = "US"
    country_entries = by_country[dest]
    desc_map = desc_maps[dest]

    results = []
    c2 = c4 = c6 = c8 = cfull = 0
    total_llm = 0
    round_stats = Counter()

    for i, item in enumerate(benchmark):
        name = item["item_name"]
        desc = item.get("description", "")
        answer = re.sub(r'[^0-9]', '', item["hts_code_answer"])

        code, path, completed_round, llm_calls, trace = classify_product(
            name, desc, dest, country_entries, desc_map
        )
        total_llm += llm_calls
        round_stats[completed_round] += 1
        time.sleep(0.02)

        pred = code or ""
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
            "id": item["id"], "name": name[:55], "actual": answer,
            "predicted": pred, "pred_desc": desc_map.get(pred, "")[:80],
            "path": path, "round": completed_round, "llm_calls": llm_calls,
            "m2": m2, "m4": m4, "m6": m6, "m8": m8, "m_full": m_full,
            "trace_summary": [
                {k: v for k, v in t.items() if k != "headings"}
                for t in trace
            ],
        })

        if (i + 1) % 10 == 0:
            t = i + 1
            print(f"[{t}/100] Ch:{c2}/{t}({100*c2/t:.0f}%) H4:{c4}/{t}({100*c4/t:.0f}%) "
                  f"H6:{c6}/{t}({100*c6/t:.0f}%) H8:{c8}/{t}({100*c8/t:.0f}%) "
                  f"Full:{cfull}/{t}({100*cfull/t:.0f}%) | LLM:{total_llm}")

    total = len(benchmark)
    print(f"\n{'='*70}")
    print(f"HYBRID v5 — Iterative Narrowing (4-round feedback loop)")
    print(f"{'='*70}")
    print(f"Chapter  (2): {100*c2/total:.1f}% ({c2}/{total})")
    print(f"Heading  (4): {100*c4/total:.1f}% ({c4}/{total})")
    print(f"Subhead  (6): {100*c6/total:.1f}% ({c6}/{total})")
    print(f"Stat     (8): {100*c8/total:.1f}% ({c8}/{total})")
    print(f"Full    (10): {100*cfull/total:.1f}% ({cfull}/{total})")
    print(f"\nLLM calls: {total_llm} (avg {total_llm/total:.1f}/item)")
    print(f"Est cost: ~${total_llm * 0.00005:.4f}")
    print(f"\nRound completion: {dict(round_stats)}")

    # Key cases
    key_ids = {1, 5, 58, 98}
    print(f"\n--- Key Cases ---")
    for r in results:
        if r["id"] in key_ids:
            s = "✅" if r["m6"] else "❌"
            print(f"{s} [{r['id']}] {r['name'][:50]}")
            print(f"   Actual: {r['actual']}  Pred: {r['predicted']}  Round: {r['round']}")
            print(f"   Path: {r['path']}")
            print(f"   Desc: {r['pred_desc']}")
            print()

    # v4 comparison
    print("--- v4 comparison (6-digit) ---")
    try:
        v4 = json.load(open("/Volumes/soulmaten/POTAL/benchmark/results/hybrid_v4_results.json"))
        v4_map = {r["id"]: r for r in v4["results"]}
        gained = []
        lost = []
        for r in results:
            v4r = v4_map.get(r["id"])
            if v4r:
                if r["m6"] and not v4r.get("m6"):
                    gained.append(r)
                elif not r["m6"] and v4r.get("m6"):
                    lost.append(r)
        print(f"  Gained (v4❌→v5✅): {len(gained)}")
        for r in gained[:10]:
            print(f"    [{r['id']}] {r['name'][:40]} → {r['predicted'][:6]}")
        print(f"  Lost (v4✅→v5❌): {len(lost)}")
        for r in lost[:10]:
            print(f"    [{r['id']}] {r['name'][:40]} actual={r['actual'][:6]} pred={r['predicted'][:6]}")
    except:
        print("  v4 results not found for comparison")

    summary = {
        "benchmark": "CBP 100 — Hybrid v5 Iterative Narrowing",
        "total": total, "llm_calls": total_llm,
        "round_stats": dict(round_stats),
        "accuracy": {
            "ch": round(100*c2/total, 2), "h4": round(100*c4/total, 2),
            "h6": round(100*c6/total, 2), "h8": round(100*c8/total, 2),
            "full": round(100*cfull/total, 2),
        },
        "results": results,
    }
    with open(OUTPUT_FILE, "w") as f:
        json.dump(summary, f, indent=2, ensure_ascii=False)
    print(f"\nSaved to {OUTPUT_FILE}")


if __name__ == "__main__":
    main()
