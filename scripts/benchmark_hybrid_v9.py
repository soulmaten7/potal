#!/usr/bin/env python3
"""
Hybrid v9 — Attribute-based classification

Phase 1: GPT-4o → "What IS this product?" (attributes, not code)
Phase 2: Country filter (US 25,029 codes)
Phase 3: Mechanical attribute matching → 5-15 candidates
Phase 4: GPT-4o-mini → 4-stage narrowing (ch→h4→h6→10) from candidates
"""

import csv, json, re, time
from collections import defaultdict, Counter
from openai import OpenAI

GOV_FILE = "/Volumes/soulmaten/POTAL/benchmark/gov_tariff_descriptions.csv"
ATTR_FILE = "/Volumes/soulmaten/POTAL/benchmark/formulas/us_attribute_table.json"
BENCHMARK_FILE = "/Volumes/soulmaten/POTAL/benchmark_test_data.json"
OUTPUT_FILE = "/Volumes/soulmaten/POTAL/benchmark/results/hybrid_v9_results.json"

client = OpenAI(api_key=os.environ.get("OPENAI_API_KEY", ""))


def load_data():
    # Load attribute table
    with open(ATTR_FILE, "r") as f:
        attr_table = json.load(f)

    # Load raw entries for description access
    entries = []
    with open(GOV_FILE, "r") as f:
        for row in csv.DictReader(f):
            if row["country"] != "US" or row["hs_code"][:2] in ("98", "99"):
                continue
            entries.append({"code": row["hs_code"], "desc": row.get("description", "")})

    by_ch = defaultdict(list)
    for e in entries:
        by_ch[e["code"][:2]].append(e)

    return attr_table, entries, by_ch


# ─── Phase 1: GPT-4o product analysis ────────────────────

def phase1_analyze(name, desc):
    """GPT-4o extracts product attributes. This is world knowledge, not HS knowledge."""
    prompt = f"""Analyze this product and extract its physical attributes. Do NOT classify it — just describe what it IS.

Product: {name}
{f"Details: {desc[:400]}" if desc else ""}

Extract these attributes as JSON:
{{
  "identity": "what this product fundamentally is (1 line)",
  "materials": ["primary material", "secondary material", ...],
  "form": "physical form (powder/liquid/solid/sheet/wire/yarn/fabric/granule/etc)",
  "function": "primary use category (clothing/footwear/food/electrical/tool/furniture/toy/medical/vehicle/jewelry/cosmetic/packaging/ornamental/stationery/textile_article/weapon/agricultural/musical/etc)",
  "construction": "how it's made (knitted/woven/cast/forged/molded/printed/coated/etc or null)",
  "gender": "target gender if applicable (mens/womens/children or null)",
  "processing": "processing state (raw/processed/preserved/semi_processed or null)",
  "price_range": "low/medium/high/luxury",
  "key_descriptors": ["3-5 most defining words for this specific product"]
}}

Reply with ONLY the JSON object."""

    try:
        resp = client.chat.completions.create(
            model="gpt-4o", messages=[{"role": "user", "content": prompt}],
            temperature=0, max_tokens=300,
        )
        text = resp.choices[0].message.content.strip()
        # Extract JSON
        match = re.search(r'\{[\s\S]+\}', text)
        if match:
            return json.loads(match.group())
        return None
    except Exception as e:
        print(f"  Phase1 error: {e}")
        return None


# ─── Phase 3: Mechanical attribute matching ──────────────

def phase3_match(product_attrs, attr_table):
    """Match product attributes against all codes. Return scored candidates."""
    if not product_attrs:
        return []

    p_materials = set(product_attrs.get("materials", []))
    p_form = product_attrs.get("form", "")
    p_function = product_attrs.get("function", "")
    p_construction = product_attrs.get("construction", "")
    p_gender = product_attrs.get("gender", "")
    p_processing = product_attrs.get("processing", "")
    p_descriptors = set(w.lower() for w in product_attrs.get("key_descriptors", []))

    scored = []

    for code, entry in attr_table.items():
        attrs = entry.get("attrs", {})
        if not attrs:
            continue

        score = 0
        matched_on = []

        # Material match (highest weight)
        c_materials = set(attrs.get("material", []))
        mat_overlap = p_materials & c_materials
        if mat_overlap:
            score += len(mat_overlap) * 10
            matched_on.append(f"material:{','.join(mat_overlap)}")

        # Form match
        c_forms = set(attrs.get("form", []))
        if p_form and p_form in c_forms:
            score += 8
            matched_on.append(f"form:{p_form}")

        # Function match (high weight)
        c_functions = set(attrs.get("function", []))
        if p_function and p_function in c_functions:
            score += 12
            matched_on.append(f"function:{p_function}")

        # Construction match
        c_constructions = set(attrs.get("construction", []))
        if p_construction and p_construction in c_constructions:
            score += 6
            matched_on.append(f"construction:{p_construction}")

        # Gender match
        c_genders = set(attrs.get("gender", []))
        if p_gender and p_gender in c_genders:
            score += 5
            matched_on.append(f"gender:{p_gender}")

        # Processing match
        c_processing = set(attrs.get("processing", []))
        if p_processing and p_processing in c_processing:
            score += 4
            matched_on.append(f"processing:{p_processing}")

        # Key descriptor match against description text
        desc_lower = entry.get("desc", "").lower()
        desc_hits = 0
        for kw in p_descriptors:
            if kw in desc_lower:
                desc_hits += 1
        if desc_hits:
            score += desc_hits * 3
            matched_on.append(f"descriptors:{desc_hits}")

        # Code specificity bonus
        code_len = len(code)
        if code_len >= 10:
            score += 2
        elif code_len >= 8:
            score += 1

        # "Other" penalty
        if desc_lower.strip() in ("other", "other:", "others"):
            score *= 0.3

        if score > 0:
            scored.append({
                "code": code,
                "desc": entry.get("desc", "")[:100],
                "score": round(score, 1),
                "matched_on": matched_on,
            })

    scored.sort(key=lambda x: -x["score"])
    return scored[:50]  # Top 50 for Phase 4


# ─── Phase 4: GPT-4o-mini 4-stage narrowing ─────────────

def phase4_narrow(name, desc, product_attrs, candidates):
    """Use GPT-4o-mini to narrow candidates to final code."""
    if not candidates:
        return "", ""

    if len(candidates) == 1:
        return candidates[0]["code"], candidates[0]["desc"]

    # Get unique chapters from candidates
    chapters = {}
    for c in candidates:
        ch = c["code"][:2]
        if ch not in chapters:
            chapters[ch] = c["desc"][:60]

    # Stage 1: If multiple chapters, narrow to 1-2
    target_ch = list(chapters.keys())
    if len(chapters) > 2:
        ch_text = "\n".join(f"{k}: {v}" for k, v in chapters.items())
        identity = product_attrs.get("identity", name) if product_attrs else name

        prompt = f"""Product: {identity}
Materials: {product_attrs.get('materials', []) if product_attrs else 'unknown'}
Function: {product_attrs.get('function', 'unknown') if product_attrs else 'unknown'}

Which 1-2 chapters best fit?
{ch_text}

Reply ONLY with comma-separated 2-digit codes."""
        try:
            resp = client.chat.completions.create(
                model="gpt-4o-mini", messages=[{"role": "user", "content": prompt}],
                temperature=0, max_tokens=15,
            )
            pat = r'(\d{2})'
            target_ch = re.findall(pat, resp.choices[0].message.content.strip())[:2]
        except:
            pass

    # Filter candidates to target chapters
    filtered = [c for c in candidates if c["code"][:2] in target_ch]
    if not filtered:
        filtered = candidates[:20]

    # Stage 2: Narrow to heading
    headings = {}
    for c in filtered:
        h4 = c["code"][:4]
        if h4 not in headings:
            headings[h4] = c["desc"][:80]

    target_h4 = list(headings.keys())
    if len(headings) > 3:
        h_text = "\n".join(f"{k}: {v}" for k, v in sorted(headings.items()))
        prompt = f"""Product: {name}
Which 1-3 headings best fit?
{h_text}
Reply ONLY with comma-separated 4-digit codes."""
        try:
            resp = client.chat.completions.create(
                model="gpt-4o-mini", messages=[{"role": "user", "content": prompt}],
                temperature=0, max_tokens=20,
            )
            pat = r'(\d{4})'
            picks = re.findall(pat, resp.choices[0].message.content.strip())[:3]
            if picks:
                target_h4 = picks
        except:
            pass

    filtered = [c for c in filtered if c["code"][:4] in target_h4]
    if not filtered:
        filtered = candidates[:10]

    # Stage 3: Narrow to subheading
    subheadings = {}
    for c in filtered:
        h6 = c["code"][:6]
        if h6 not in subheadings:
            subheadings[h6] = c["desc"][:80]

    if len(subheadings) > 2:
        s_text = "\n".join(f"{k}: {v}" for k, v in sorted(subheadings.items()))
        prompt = f"""Product: {name}
{f"Details: {desc[:200]}" if desc else ""}
Which 1-2 subheadings best fit?
{s_text}
Reply ONLY with comma-separated 6-digit codes."""
        try:
            resp = client.chat.completions.create(
                model="gpt-4o-mini", messages=[{"role": "user", "content": prompt}],
                temperature=0, max_tokens=20,
            )
            pat = r'(\d{6})'
            picks = re.findall(pat, resp.choices[0].message.content.strip())[:2]
            if picks:
                filtered = [c for c in filtered if c["code"][:6] in picks]
        except:
            pass

    if not filtered:
        filtered = candidates[:5]

    # Stage 4: Pick final code
    if len(filtered) == 1:
        return filtered[0]["code"], filtered[0]["desc"]

    c_text = "\n".join(f"{c['code']}: {c['desc'][:80]}" for c in filtered[:15])
    prompt = f"""Pick the single best code for this product.

Product: {name}
{f"Details: {desc[:200]}" if desc else ""}

Codes:
{c_text}

Consider material, form, value/weight conditions.
Reply with ONLY one code."""
    try:
        resp = client.chat.completions.create(
            model="gpt-4o-mini", messages=[{"role": "user", "content": prompt}],
            temperature=0, max_tokens=15,
        )
        pat = r'(\d{6,10})'
        codes = re.findall(pat, resp.choices[0].message.content.strip())
        if codes:
            # Validate against candidates
            for c in codes:
                for cand in filtered:
                    if cand["code"] == c or cand["code"].startswith(c):
                        return cand["code"], cand["desc"]
            return codes[0], ""
    except:
        pass

    return filtered[0]["code"], filtered[0]["desc"]


# ─── Main ─────────────────────────────────────────────────

def main():
    print("Loading data...")
    attr_table, entries, by_ch = load_data()
    print(f"Attribute table: {len(attr_table)} codes")
    print(f"Entries: {len(entries)}")

    with open(BENCHMARK_FILE, "r") as f:
        benchmark = json.load(f)
    print(f"Benchmark: {len(benchmark)} items\n")

    results = []
    c2 = c4 = c6 = c8 = cf = 0
    llm_4o = 0
    llm_mini = 0

    for i, item in enumerate(benchmark):
        name = item["item_name"]
        desc = item.get("description", "")
        answer = re.sub(r'[^0-9]', '', item["hts_code_answer"])

        # Phase 1: GPT-4o product analysis
        product_attrs = phase1_analyze(name, desc)
        llm_4o += 1
        time.sleep(0.1)

        # Phase 2: Country filter (already US-only)
        # Phase 3: Mechanical matching
        candidates = phase3_match(product_attrs, attr_table)

        # Phase 4: GPT-4o-mini narrowing
        pred, pred_desc = phase4_narrow(name, desc, product_attrs, candidates)
        llm_mini += 4  # up to 4 stages
        time.sleep(0.05)

        pred_clean = re.sub(r'[^0-9]', '', pred)
        m2 = len(pred_clean) >= 2 and pred_clean[:2] == answer[:2]
        m4 = len(pred_clean) >= 4 and pred_clean[:4] == answer[:4]
        m6 = len(pred_clean) >= 6 and pred_clean[:6] == answer[:6]
        m8 = len(pred_clean) >= 8 and len(answer) >= 8 and pred_clean[:8] == answer[:8]
        mf = pred_clean == answer

        if m2: c2 += 1
        if m4: c4 += 1
        if m6: c6 += 1
        if m8: c8 += 1
        if mf: cf += 1

        # Check if correct answer was in candidates
        answer_in_cands = any(c["code"][:6] == answer[:6] for c in candidates)

        results.append({
            "id": item["id"], "name": name[:55], "actual": answer,
            "predicted": pred_clean, "pred_desc": pred_desc[:80],
            "product_attrs": product_attrs,
            "n_candidates": len(candidates),
            "answer_in_candidates": answer_in_cands,
            "top3_candidates": [{"code": c["code"], "score": c["score"], "matched": c["matched_on"][:3]} for c in candidates[:3]],
            "m2": m2, "m4": m4, "m6": m6, "m8": m8, "m_full": mf,
        })

        if (i + 1) % 10 == 0:
            t = i + 1
            in_cands = sum(1 for r in results if r.get("answer_in_candidates"))
            print(f"[{t}/100] Ch:{c2}/{t}({100*c2/t:.0f}%) H4:{c4}/{t}({100*c4/t:.0f}%) "
                  f"H6:{c6}/{t}({100*c6/t:.0f}%) Full:{cf}/{t}({100*cf/t:.0f}%) "
                  f"| InCands:{in_cands}/{t}({100*in_cands/t:.0f}%)")

    total = len(benchmark)
    in_cands_total = sum(1 for r in results if r.get("answer_in_candidates"))

    # Cost: GPT-4o ~$2.50/1M in + $10/1M out (~400 tokens each)
    cost_4o = llm_4o * (400 * 2.50 + 200 * 10.0) / 1_000_000
    cost_mini = llm_mini * (300 * 0.15 + 50 * 0.60) / 1_000_000
    total_cost = cost_4o + cost_mini

    print(f"\n{'='*70}")
    print(f"HYBRID v9 — Attribute matching + GPT-4o analysis + GPT-4o-mini narrowing")
    print(f"{'='*70}")
    print(f"Chapter  (2): {100*c2/total:.1f}% ({c2}/{total})")
    print(f"Heading  (4): {100*c4/total:.1f}% ({c4}/{total})")
    print(f"Subhead  (6): {100*c6/total:.1f}% ({c6}/{total})")
    print(f"Stat     (8): {100*c8/total:.1f}% ({c8}/{total})")
    print(f"Full    (10): {100*cf/total:.1f}% ({cf}/{total})")
    print(f"\nAnswer in Phase 3 candidates: {in_cands_total}/{total} ({100*in_cands_total/total:.1f}%)")
    print(f"GPT-4o calls: {llm_4o}, GPT-4o-mini calls: ~{llm_mini}")
    print(f"Est cost: ${total_cost:.4f}")

    # Key cases
    key_ids = {1, 5, 58, 98}
    print(f"\n--- Key Cases ---")
    for r in results:
        if r["id"] in key_ids:
            s = "✅" if r["m6"] else "❌"
            in_c = "✅" if r.get("answer_in_candidates") else "❌"
            attrs = r.get("product_attrs", {})
            print(f"{s} [{r['id']}] {r['name'][:50]}")
            print(f"   Actual: {r['actual']}  Pred: {r['predicted']}")
            print(f"   Identity: {attrs.get('identity', '?')}")
            print(f"   Materials: {attrs.get('materials', [])}, Function: {attrs.get('function', '?')}")
            print(f"   InCandidates: {in_c} ({r['n_candidates']} total)")
            if r.get("top3_candidates"):
                for c in r["top3_candidates"]:
                    print(f"   → {c['code']} (score={c['score']}) {c['matched']}")
            print()

    # v8 comparison
    print("--- v8 vs v9 ---")
    try:
        v8 = json.load(open("/Volumes/soulmaten/POTAL/benchmark/results/hybrid_v8_results.json"))
        v8_6 = v8["accuracy"]["accuracy_6"]
        print(f"  v8: {v8_6}% (6-digit)  v9: {100*c6/total:.1f}%")
    except:
        print("  v8 comparison not available")

    summary = {
        "benchmark": "CBP 100 — Hybrid v9 (attribute matching)",
        "total": total,
        "llm_calls": {"gpt4o": llm_4o, "gpt4o_mini": llm_mini},
        "est_cost": round(total_cost, 4),
        "answer_in_candidates": in_cands_total,
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
