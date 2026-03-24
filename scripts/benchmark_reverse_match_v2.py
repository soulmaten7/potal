#!/usr/bin/env python3
"""
Reverse Match v2 — Improved with:
1. Full description text matching (not just item_name)
2. TF-IDF-like scoring (rare words matter more)
3. Hierarchical: chapter → heading → subheading → national line
4. Stop words removal
5. N-gram matching
6. "Other" codes as catch-all at each level
"""

import csv
import json
import re
import math
from collections import Counter, defaultdict

GOV_FILE = "/Volumes/soulmaten/POTAL/benchmark/gov_tariff_descriptions.csv"
BENCHMARK_FILE = "/Volumes/soulmaten/POTAL/benchmark_test_data.json"
OUTPUT_FILE = "/Volumes/soulmaten/POTAL/benchmark/results/reverse_match_v2_results.json"

STOP_WORDS = {
    "the", "a", "an", "of", "in", "on", "at", "to", "for", "and", "or", "is",
    "are", "was", "were", "be", "been", "being", "have", "has", "had", "do",
    "does", "did", "will", "would", "shall", "should", "may", "might", "can",
    "could", "with", "from", "by", "as", "into", "than", "that", "this",
    "these", "those", "it", "its", "not", "no", "nor", "but", "if", "so",
    "such", "which", "who", "whom", "what", "when", "where", "how", "all",
    "each", "every", "both", "few", "more", "most", "other", "some", "any",
    "per", "up", "out", "about", "between", "through", "during", "before",
    "after", "above", "below", "under", "over", "new", "also", "whether",
    "described", "item", "items", "subject", "tariff", "classification",
    "country", "origin", "eligibility", "treatment", "marking", "correction",
    "ruling", "number", "various", "countries", "identified",
}


def tokenize(text):
    tokens = set(re.sub(r'[^a-z0-9\s-]', ' ', text.lower()).split())
    return tokens - STOP_WORDS - {''}


def get_ngrams(text, n=2):
    words = [w for w in re.sub(r'[^a-z0-9\s-]', ' ', text.lower()).split() if w not in STOP_WORDS and len(w) > 1]
    ngrams = set()
    for i in range(len(words) - n + 1):
        ngrams.add(' '.join(words[i:i+n]))
    return ngrams


def load_entries():
    entries = []
    with open(GOV_FILE, "r") as f:
        reader = csv.DictReader(f)
        for row in reader:
            desc = row.get("description", "")
            hs = row["hs_code"]
            entries.append({
                "country": row["country"],
                "hs_code": hs,
                "description": desc,
                "desc_lower": desc.lower(),
                "tokens": tokenize(desc),
                "bigrams": get_ngrams(desc, 2),
                "chapter": hs[:2],
                "heading": hs[:4],
                "subheading": hs[:6],
                "code_len": len(hs.replace(".", "")),
            })
    return entries


def compute_idf(entries):
    """Compute IDF for all tokens across all entries."""
    doc_freq = Counter()
    for e in entries:
        for token in e["tokens"]:
            doc_freq[token] += 1
    N = len(entries)
    idf = {}
    for token, df in doc_freq.items():
        idf[token] = math.log(N / (df + 1)) + 1
    return idf


def score_entry(product_tokens, product_bigrams, product_text_lower, entry, idf, is_chapter_match):
    """Score a single tariff entry against a product."""
    score = 0
    matched = []

    # 1. TF-IDF weighted token overlap
    for token in product_tokens:
        if token in entry["tokens"]:
            weight = idf.get(token, 1)
            # Cap at 5 to prevent single rare word from dominating
            score += min(weight, 5)
            matched.append(token)

    # 2. Bigram matches (much more meaningful)
    bigram_hits = 0
    for bg in product_bigrams:
        if bg in entry["bigrams"]:
            score += 8  # Bigrams are valuable
            bigram_hits += 1

    # 3. Substring matches for longer terms
    for token in product_tokens:
        if len(token) >= 5 and token in entry["desc_lower"]:
            score += 3

    # 4. Chapter match bonus
    if is_chapter_match:
        score += 10

    # 5. Specificity bonus (more specific = better)
    if entry["code_len"] >= 8:
        score += 2
    if entry["code_len"] >= 10:
        score += 2

    # 6. Penalties
    desc_stripped = entry["desc_lower"].strip()
    if desc_stripped in ("other", "other:", "others", "other,"):
        score -= 20
    if desc_stripped.startswith("other") and len(desc_stripped) < 15:
        score -= 10
    if len(desc_stripped) < 8:
        score -= 10

    return score, matched


def classify_product(product_text, us_entries, idf):
    """Hierarchical reverse matching classification."""
    tokens = tokenize(product_text)
    bigrams = get_ngrams(product_text, 2)
    text_lower = product_text.lower()

    if not tokens:
        return None, [], "no tokens"

    # ─── Stage 1: Find best chapters ─────────────────────
    chapter_scores = defaultdict(float)
    for entry in us_entries:
        s, _ = score_entry(tokens, bigrams, text_lower, entry, idf, False)
        if s > 0:
            chapter_scores[entry["chapter"]] += s

    if not chapter_scores:
        return None, [], "no chapter match"

    # Take top 5 chapters
    top_chapters = sorted(chapter_scores.items(), key=lambda x: -x[1])[:5]
    top_chapter_set = set(ch for ch, _ in top_chapters)

    # ─── Stage 2: Score within top chapters ──────────────
    candidates = []
    for entry in us_entries:
        if entry["chapter"] not in top_chapter_set:
            continue
        is_ch = entry["chapter"] == top_chapters[0][0]
        s, matched = score_entry(tokens, bigrams, text_lower, entry, idf, is_ch)
        if s > 5:
            candidates.append((entry, s, matched))

    candidates.sort(key=lambda x: -x[1])

    # ─── Stage 3: HS6 consensus voting ───────────────────
    hs6_scores = defaultdict(float)
    for entry, s, _ in candidates[:30]:
        hs6_scores[entry["subheading"]] += s

    # ─── Stage 4: Heading (4-digit) consensus ────────────
    heading_scores = defaultdict(float)
    for entry, s, _ in candidates[:30]:
        heading_scores[entry["heading"]] += s

    best_heading = max(heading_scores.items(), key=lambda x: x[1])[0] if heading_scores else ""
    best_hs6 = max(hs6_scores.items(), key=lambda x: x[1])[0] if hs6_scores else ""

    decision = f"Chapters: {[f'{ch}({s:.0f})' for ch, s in top_chapters[:3]]} | Heading: {best_heading} | HS6: {best_hs6}"

    top3 = [
        {"code": e["hs_code"], "score": round(s, 1), "desc": e["description"][:60], "matched": m[:5]}
        for e, s, m in candidates[:3]
    ]

    return {
        "predicted_full": candidates[0][0]["hs_code"] if candidates else "",
        "predicted_6": best_hs6,
        "predicted_4": best_heading,
        "best_score": round(candidates[0][1], 1) if candidates else 0,
        "best_desc": candidates[0][0]["description"][:100] if candidates else "",
        "top_chapters": [(ch, round(s, 1)) for ch, s in top_chapters[:5]],
        "top3": top3,
        "num_candidates": len(candidates),
    }, candidates[:3], decision


def normalize_hs(code):
    return re.sub(r'[^0-9]', '', str(code))


def main():
    print("Loading data...")
    entries = load_entries()
    us_entries = [e for e in entries if e["country"] == "US"]
    print(f"US entries: {len(us_entries)}")

    print("Computing IDF...")
    idf = compute_idf(us_entries)
    print(f"Vocabulary size: {len(idf)}")

    with open(BENCHMARK_FILE, "r") as f:
        benchmark = json.load(f)
    print(f"Benchmark items: {len(benchmark)}")

    results = []
    correct_6 = 0
    correct_4 = 0
    correct_2 = 0
    correct_full = 0

    for i, item in enumerate(benchmark):
        product_name = item["item_name"]
        description = item.get("description", "")
        # Use BOTH item_name and description for matching
        full_text = f"{product_name} {description}"
        answer = normalize_hs(item["hts_code_answer"])

        result, candidates, decision = classify_product(full_text, us_entries, idf)

        if result is None:
            results.append({
                "id": item["id"],
                "product_name": product_name,
                "actual": answer,
                "predicted_6": "",
                "match_6": False,
                "match_4": False,
                "match_2": False,
                "decision": decision,
            })
            continue

        pred_6 = result["predicted_6"]
        pred_4 = result["predicted_4"]
        pred_full = normalize_hs(result["predicted_full"])

        match_6 = pred_6 == answer[:6]
        match_4 = pred_4 == answer[:4]
        match_2 = pred_4[:2] == answer[:2] if pred_4 else False
        match_full = pred_full == answer

        if match_6: correct_6 += 1
        if match_4: correct_4 += 1
        if match_2: correct_2 += 1
        if match_full: correct_full += 1

        results.append({
            "id": item["id"],
            "product_name": product_name[:60],
            "actual": answer,
            "actual_6": answer[:6],
            "actual_4": answer[:4],
            "actual_2": answer[:2],
            "predicted_6": pred_6,
            "predicted_4": pred_4,
            "predicted_full": pred_full,
            "match_2": match_2,
            "match_4": match_4,
            "match_6": match_6,
            "match_full": match_full,
            "best_score": result["best_score"],
            "best_desc": result["best_desc"],
            "top_chapters": result["top_chapters"],
            "top3": result["top3"],
            "decision": decision,
        })

        if (i + 1) % 10 == 0:
            print(f"[{i+1}/100] Ch: {correct_2}/{i+1} ({100*correct_2/(i+1):.1f}%) | 4-dig: {correct_4}/{i+1} ({100*correct_4/(i+1):.1f}%) | 6-dig: {correct_6}/{i+1} ({100*correct_6/(i+1):.1f}%)")

    total = len(benchmark)
    print(f"\n=== Reverse Match v2 Results ===")
    print(f"Chapter (2-digit): {100*correct_2/total:.1f}% ({correct_2}/{total})")
    print(f"Heading (4-digit): {100*correct_4/total:.1f}% ({correct_4}/{total})")
    print(f"Subheading (6-digit): {100*correct_6/total:.1f}% ({correct_6}/{total})")
    print(f"Full (10-digit): {100*correct_full/total:.1f}% ({correct_full}/{total})")

    # Analyze chapter misses
    ch_misses = [r for r in results if not r.get("match_2", False)]
    print(f"\nChapter misses: {len(ch_misses)}")
    for r in ch_misses[:10]:
        chs = r.get("top_chapters", [])
        ch_str = ", ".join([f"{c}({s})" for c, s in chs[:3]]) if chs else "none"
        print(f"  [{r['id']}] {r['product_name'][:50]} | actual Ch.{r.get('actual_2','')} | predicted: {ch_str}")

    summary = {
        "benchmark": "CBP 100 - Reverse Match v2 (TF-IDF + hierarchical)",
        "total": total,
        "correct_2": correct_2,
        "correct_4": correct_4,
        "correct_6": correct_6,
        "correct_full": correct_full,
        "accuracy_2": round(100*correct_2/total, 2),
        "accuracy_4": round(100*correct_4/total, 2),
        "accuracy_6": round(100*correct_6/total, 2),
        "accuracy_full": round(100*correct_full/total, 2),
        "results": results,
    }

    with open(OUTPUT_FILE, "w") as f:
        json.dump(summary, f, indent=2, ensure_ascii=False)
    print(f"\nSaved to {OUTPUT_FILE}")


if __name__ == "__main__":
    main()
