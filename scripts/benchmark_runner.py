#!/usr/bin/env python3
"""
POTAL Benchmark Runner
Runs HS classification benchmarks against POTAL /api/v1/classify API.
"""

import json
import os
import sys
import time
import requests
from datetime import datetime

API_URL = "https://www.potal.app/api/v1/classify"
API_KEY = "sk_live_BENCHMARK_TEST_KEY_2026_POTAL_OK"
RESULTS_DIR = "/Volumes/soulmaten/POTAL/benchmark/results"
LOG_FILE = "/Volumes/soulmaten/POTAL/benchmark/benchmark.log"
MAX_RETRIES = 3
RATE_LIMIT_DELAY = 1.0  # 1 second between requests

os.makedirs(RESULTS_DIR, exist_ok=True)
os.makedirs(os.path.dirname(LOG_FILE), exist_ok=True)


def log(msg):
    timestamp = datetime.now().strftime("%Y-%m-%d %H:%M:%S")
    line = f"[{timestamp}] {msg}"
    print(line)
    with open(LOG_FILE, "a") as f:
        f.write(line + "\n")


def classify_product(product_name, description=None, destination_country="US"):
    """Call POTAL classify API with retries."""
    payload = {"productName": product_name}
    if description:
        payload["category"] = description[:200]  # category hint
    if destination_country:
        payload["destinationCountry"] = destination_country

    headers = {
        "Content-Type": "application/json",
        "X-API-Key": API_KEY,
    }

    for attempt in range(MAX_RETRIES):
        try:
            resp = requests.post(API_URL, json=payload, headers=headers, timeout=30)
            if resp.status_code == 429:
                wait = int(resp.headers.get("Retry-After", 5))
                log(f"  Rate limited, waiting {wait}s...")
                time.sleep(wait)
                continue
            data = resp.json()
            if data.get("success"):
                return data.get("data", {})
            else:
                log(f"  API error: {data.get('error', {}).get('message', 'unknown')}")
                if attempt < MAX_RETRIES - 1:
                    time.sleep(2)
                    continue
                return None
        except Exception as e:
            log(f"  Request error (attempt {attempt+1}): {e}")
            if attempt < MAX_RETRIES - 1:
                time.sleep(2)
            else:
                return None
    return None


def normalize_hs(code):
    """Remove dots/spaces and return clean digits."""
    if not code:
        return ""
    return str(code).replace(".", "").replace(" ", "").replace("-", "").strip()


def compare_hs(predicted, actual):
    """Compare HS codes at 6-digit and full (10-digit) level."""
    pred = normalize_hs(predicted)
    act = normalize_hs(actual)

    match_6 = pred[:6] == act[:6] if len(pred) >= 6 and len(act) >= 6 else False
    match_full = pred == act if pred and act else False
    # Also check 4-digit (chapter+heading) match
    match_4 = pred[:4] == act[:4] if len(pred) >= 4 and len(act) >= 4 else False

    return {
        "match_4digit": match_4,
        "match_6digit": match_6,
        "match_full": match_full,
        "predicted_clean": pred,
        "actual_clean": act,
    }


def categorize_error(result, api_response):
    """Categorize why the classification was wrong."""
    if api_response is None:
        return "API_ERROR"

    method = api_response.get("method", "")
    confidence = api_response.get("confidence", 0)

    # Check if it's an industrial/specialty item
    actual_chapter = result["actual_clean"][:2] if result["actual_clean"] else ""
    industrial_chapters = {"28", "29", "30", "31", "32", "34", "35", "36", "37", "38",
                          "39", "40", "68", "69", "70", "71", "72", "73", "74", "75",
                          "76", "78", "79", "80", "81", "82", "83", "84", "85", "86",
                          "87", "88", "89", "90", "91"}

    if confidence < 0.5:
        return "AMBIGUOUS_PRODUCT"
    if method == "ai" and confidence < 0.7:
        return "NO_MAPPING"
    if actual_chapter in industrial_chapters and not result["match_4digit"]:
        return "INDUSTRIAL_SPECIALTY"
    if not result["match_4digit"]:
        return "WRONG_MAPPING"
    if result["match_4digit"] and not result["match_6digit"]:
        return "COUNTRY_SPECIFIC"

    return "OTHER"


def run_benchmark(name, data_file, output_file, extract_fn):
    """
    Generic benchmark runner.
    extract_fn: function(item) -> (product_name, description, answer_hs, extra_info)
    """
    log(f"=== Starting benchmark: {name} ===")

    with open(data_file, "r") as f:
        items = json.load(f)

    total = len(items)
    log(f"Loaded {total} items from {data_file}")

    results = []
    correct_6 = 0
    correct_full = 0
    correct_4 = 0
    errors = 0

    for i, item in enumerate(items):
        product_name, description, answer_hs, extra = extract_fn(item)

        log(f"[{i+1}/{total}] {product_name[:60]}...")

        api_resp = classify_product(product_name, description)
        time.sleep(RATE_LIMIT_DELAY)

        if api_resp is None:
            predicted_hs = ""
            errors += 1
        else:
            # Try hsCode10 first (more precise), then hsCode
            predicted_hs = api_resp.get("hsCode10") or api_resp.get("hsCode", "")

        comparison = compare_hs(predicted_hs, answer_hs)

        if comparison["match_6digit"]:
            correct_6 += 1
        if comparison["match_full"]:
            correct_full += 1
        if comparison["match_4digit"]:
            correct_4 += 1

        error_category = None
        if not comparison["match_6digit"]:
            error_category = categorize_error(comparison, api_resp)

        result_item = {
            "id": extra.get("id", i + 1),
            "product_name": product_name,
            "predicted_hs": predicted_hs,
            "predicted_clean": comparison["predicted_clean"],
            "actual_hs": answer_hs,
            "actual_clean": comparison["actual_clean"],
            "match_4digit": comparison["match_4digit"],
            "match_6digit": comparison["match_6digit"],
            "match_full": comparison["match_full"],
            "confidence": api_resp.get("confidence") if api_resp else None,
            "method": api_resp.get("method") if api_resp else None,
            "error_category": error_category,
            **extra,
        }
        results.append(result_item)

        if (i + 1) % 10 == 0:
            log(f"  Progress: {i+1}/{total} | 6-digit: {correct_6}/{i+1} ({100*correct_6/(i+1):.1f}%) | 4-digit: {correct_4}/{i+1} ({100*correct_4/(i+1):.1f}%)")

    # Summary
    accuracy_6 = 100 * correct_6 / total if total > 0 else 0
    accuracy_full = 100 * correct_full / total if total > 0 else 0
    accuracy_4 = 100 * correct_4 / total if total > 0 else 0

    wrong_items = [r for r in results if not r["match_6digit"]]

    # Error category breakdown
    error_categories = {}
    for r in wrong_items:
        cat = r.get("error_category", "OTHER")
        error_categories[cat] = error_categories.get(cat, 0) + 1

    summary = {
        "benchmark_name": name,
        "timestamp": datetime.now().isoformat(),
        "total_items": total,
        "correct_4digit": correct_4,
        "correct_6digit": correct_6,
        "correct_full": correct_full,
        "api_errors": errors,
        "accuracy_4digit": round(accuracy_4, 2),
        "accuracy_6digit": round(accuracy_6, 2),
        "accuracy_full": round(accuracy_full, 2),
        "error_categories": error_categories,
        "wrong_items": wrong_items,
        "all_results": results,
    }

    with open(output_file, "w") as f:
        json.dump(summary, f, indent=2, ensure_ascii=False)

    log(f"=== {name} Complete ===")
    log(f"  4-digit accuracy: {accuracy_4:.1f}% ({correct_4}/{total})")
    log(f"  6-digit accuracy: {accuracy_6:.1f}% ({correct_6}/{total})")
    log(f"  Full accuracy:    {accuracy_full:.1f}% ({correct_full}/{total})")
    log(f"  API errors: {errors}")
    log(f"  Error breakdown: {error_categories}")
    log(f"  Results saved to: {output_file}")

    return summary


def run_cbp_100():
    """Run CBP 100-item benchmark."""
    data_file = "/Volumes/soulmaten/POTAL/benchmark_test_data.json"
    output_file = os.path.join(RESULTS_DIR, "cbp_100_results.json")

    def extract(item):
        return (
            item["item_name"],
            item.get("description", ""),
            item["hts_code_answer"],
            {
                "id": item["id"],
                "ruling_number": item.get("ruling_number"),
                "hs_chapter": item.get("hs_chapter"),
                "hs6": item.get("hs6"),
                "ruling_date": item.get("ruling_date"),
            },
        )

    return run_benchmark("CBP 100-Item Benchmark", data_file, output_file, extract)


def run_generic_benchmark(name, data_file, output_file):
    """Run a generic HS classification benchmark (hs_questions.json format)."""

    def extract(item):
        # Flexible extraction for different formats
        product_name = (
            item.get("product_name")
            or item.get("product_description")
            or item.get("description")
            or item.get("item_name")
            or item.get("question", "")
        )
        description = item.get("description", "")
        answer = (
            item.get("hs_code")
            or item.get("hts_code")
            or item.get("answer")
            or item.get("correct_hs")
            or ""
        )
        return (
            product_name,
            description,
            str(answer),
            {"id": item.get("id", 0)},
        )

    return run_benchmark(name, data_file, output_file, extract)


if __name__ == "__main__":
    if len(sys.argv) < 2:
        print("Usage: python benchmark_runner.py <benchmark_name>")
        print("  cbp100    - Run CBP 100-item benchmark")
        print("  cble      - Run CBLE exam benchmark")
        print("  atlas     - Run ATLAS 18K benchmark")
        print("  hscodecomp - Run HSCodeComp 632 benchmark")
        print("  korea     - Run Korea customs exam benchmark")
        print("  japan     - Run Japan customs exam benchmark")
        sys.exit(1)

    name = sys.argv[1]

    if name == "cbp100":
        run_cbp_100()
    elif name == "cble":
        run_generic_benchmark(
            "CBLE Exam Benchmark",
            "/Volumes/soulmaten/POTAL/benchmark/cble/hs_questions.json",
            os.path.join(RESULTS_DIR, "cble_results.json"),
        )
    elif name == "atlas":
        run_generic_benchmark(
            "ATLAS 18K Benchmark",
            "/Volumes/soulmaten/POTAL/benchmark/atlas/hs_questions.json",
            os.path.join(RESULTS_DIR, "atlas_results.json"),
        )
    elif name == "hscodecomp":
        run_generic_benchmark(
            "HSCodeComp 632 Benchmark",
            "/Volumes/soulmaten/POTAL/benchmark/hscodecomp/hs_questions.json",
            os.path.join(RESULTS_DIR, "hscodecomp_results.json"),
        )
    elif name == "korea":
        run_generic_benchmark(
            "Korea Customs Exam Benchmark",
            "/Volumes/soulmaten/POTAL/benchmark/korea_customs/hs_questions.json",
            os.path.join(RESULTS_DIR, "korea_results.json"),
        )
    elif name == "japan":
        run_generic_benchmark(
            "Japan Customs Exam Benchmark",
            "/Volumes/soulmaten/POTAL/benchmark/japan_customs/hs_questions.json",
            os.path.join(RESULTS_DIR, "japan_results.json"),
        )
    else:
        print(f"Unknown benchmark: {name}")
        sys.exit(1)
