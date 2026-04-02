#!/usr/bin/env python3
"""
Grade all 6 content-posting skill evaluation outputs.
Checks 8 key assertions programmatically.
"""

import json
import re
import os
from pathlib import Path

# Base path for all evaluation runs
BASE_PATH = Path("/sessions/adoring-lucid-archimedes/mnt/potal/.claude/skills/content-posting-workspace/iteration-1")

# Define evaluation directories and their run types
EVALS = [
    ("eval-1-competitor-compare", "with_skill"),
    ("eval-1-competitor-compare", "without_skill"),
    ("eval-2-hs-code-deepdive", "with_skill"),
    ("eval-2-hs-code-deepdive", "without_skill"),
    ("eval-3-building-journey", "with_skill"),
    ("eval-3-building-journey", "without_skill"),
]

# List of 11 platforms to check
PLATFORMS = [
    "LinkedIn",
    "DEV.to",
    "Indie Hackers",
    "X/Twitter",
    "X Twitter",  # alternate spelling
    "Instagram",
    "디스콰이어트",  # Korean
    "Reddit",
    "Medium",
    "Facebook",
    "Threads",
    "YouTube",
]

# Banned words (English and Korean)
BANNED_WORDS = [
    "insane",
    "revolutionary",
    "crazy",
    "mind-blowing",
    "game-changer",
    "역대급",
    "혁명적",
    "미친",
]

# Begging phrases
BEGGING_PHRASES = [
    "Drop a comment",
    "follow",
    "share please",
    "팔로우 해주세요",
    "공유 부탁",
]

# Key numbers to check for accuracy
KEY_NUMBERS = {
    "140": "features count",
    "무료": "free plan",
    "$0": "free cost",
    "1,500": "Avalara pricing",
    "$1,500": "Avalara pricing",
    "4,000": "Zonos pricing",
    "$4,000": "Zonos pricing",
    "240": "countries count",
}


def read_file(filepath):
    """Read file content, handling encoding issues."""
    try:
        with open(filepath, 'r', encoding='utf-8') as f:
            return f.read()
    except Exception as e:
        return f"ERROR reading file: {e}"


def check_all_11_platforms(content):
    """Check if all 11 platforms are mentioned."""
    found_platforms = []

    for platform in PLATFORMS:
        # Case-insensitive search for platform names
        if re.search(re.escape(platform), content, re.IGNORECASE):
            found_platforms.append(platform)

    # Unique found platforms
    unique_found = set(found_platforms)

    # Count successful matches (at least 10 of 11 should be found due to possible duplicates in list)
    passed = len(unique_found) >= 10  # Allow for X/Twitter and X Twitter as same
    evidence = f"Found {len(unique_found)} platforms: {', '.join(sorted(unique_found)[:5])}..."

    return passed, evidence


def check_korean_translations(content):
    """Check if Korean text exists (look for Korean characters)."""
    # Look for Hangul characters (Korean script)
    korean_pattern = r'[\uac00-\ud7af\u1100-\u11ff]+'
    matches = re.findall(korean_pattern, content)

    passed = len(matches) > 0
    count = len(matches)
    evidence = f"Found {count} Korean text segments" if passed else "No Korean text found"

    return passed, evidence


def check_no_exaggeration(content):
    """Check for banned exaggeration words."""
    found_banned = []

    for word in BANNED_WORDS:
        # Case-insensitive search
        if re.search(r'\b' + re.escape(word) + r'\b', content, re.IGNORECASE):
            found_banned.append(word)

    passed = len(found_banned) == 0
    evidence = f"No banned words found" if passed else f"Found: {', '.join(found_banned)}"

    return passed, evidence


def check_no_begging(content):
    """Check for begging phrases."""
    found_begging = []

    for phrase in BEGGING_PHRASES:
        if re.search(re.escape(phrase), content, re.IGNORECASE):
            found_begging.append(phrase)

    passed = len(found_begging) == 0
    evidence = f"No begging phrases found" if passed else f"Found: {', '.join(found_begging)}"

    return passed, evidence


def check_accurate_numbers(content):
    """Check if key numbers appear in content."""
    found_numbers = []

    for num, description in KEY_NUMBERS.items():
        if num in content or re.search(re.escape(num), content):
            found_numbers.append(description)

    # Should find at least 3 of the 8 key numbers
    passed = len(found_numbers) >= 3
    evidence = f"Found {len(found_numbers)}/8 key numbers: {', '.join(found_numbers[:3])}..."

    return passed, evidence


def check_correct_api_urls(content):
    """Check if API URLs use correct domain (potal.app/api/v1/)."""
    # Look for common incorrect API URLs
    wrong_patterns = [
        r'api\.potal\.io',
        r'potal\.io/api',
        r'api\.potal\.com',
    ]

    found_wrong = []
    for pattern in wrong_patterns:
        if re.search(pattern, content, re.IGNORECASE):
            found_wrong.append(pattern)

    # Look for correct pattern
    correct_pattern = r'potal\.app/api/v1/'
    has_correct = bool(re.search(correct_pattern, content, re.IGNORECASE))

    # Pass if no wrong patterns found (or has correct pattern)
    passed = len(found_wrong) == 0
    evidence = f"No incorrect API URLs found" if passed else f"Found wrong URLs: {', '.join(found_wrong)}"

    return passed, evidence


def check_file_structure(content):
    """Check if file has standardized structure with date, topic, category headers."""
    has_date = bool(re.search(r'\d{4}-\d{2}-\d{2}|Date|날짜', content, re.IGNORECASE))
    has_topic = bool(re.search(r'Topic|주제|##\s*\w+', content, re.IGNORECASE))
    has_category = bool(re.search(r'Category|카테고리|Platform|플랫폼', content, re.IGNORECASE))
    has_headers = bool(re.search(r'^#+\s+\w+', content, re.MULTILINE))

    # Should have at least date + headers or topic/category
    passed = (has_date or has_topic or has_category) and has_headers

    structure_found = []
    if has_date:
        structure_found.append("date")
    if has_topic:
        structure_found.append("topic")
    if has_category:
        structure_found.append("category")
    if has_headers:
        structure_found.append("headers")

    evidence = f"Structure: {', '.join(structure_found)}"

    return passed, evidence


def check_platform_tone_diff(content):
    """Check if different platforms have noticeably different content lengths."""
    # Split content by platform headers (looking for platform section markers)
    platform_sections = re.split(r'#{1,3}\s+(?:LinkedIn|DEV\.to|Instagram|X|Twitter|Reddit|Medium|Facebook|Threads|YouTube)', content, re.IGNORECASE)

    # Filter out empty sections and get their lengths
    section_lengths = [len(s.strip()) for s in platform_sections if len(s.strip()) > 20]

    # Should have variation in content lengths (not all the same)
    if len(section_lengths) >= 3:
        avg_length = sum(section_lengths) / len(section_lengths)
        max_length = max(section_lengths)
        min_length = min(section_lengths)

        # Check if there's at least 30% variation
        variation = (max_length - min_length) / avg_length if avg_length > 0 else 0
        passed = variation > 0.3

        evidence = f"Found {len(section_lengths)} platform sections with {variation:.1%} variation (min:{min_length}, max:{max_length})"
    else:
        passed = len(section_lengths) >= 2
        evidence = f"Found {len(section_lengths)} platform sections"

    return passed, evidence


def grade_file(filepath, eval_name, run_type):
    """Grade a single file and return results."""
    content = read_file(filepath)

    if content.startswith("ERROR"):
        return None

    results = {
        "eval": eval_name,
        "run_type": run_type,
        "file": str(filepath),
        "expectations": [
            {
                "text": "all_11_platforms",
                "passed": check_all_11_platforms(content)[0],
                "evidence": check_all_11_platforms(content)[1],
            },
            {
                "text": "korean_translations",
                "passed": check_korean_translations(content)[0],
                "evidence": check_korean_translations(content)[1],
            },
            {
                "text": "no_exaggeration",
                "passed": check_no_exaggeration(content)[0],
                "evidence": check_no_exaggeration(content)[1],
            },
            {
                "text": "no_begging",
                "passed": check_no_begging(content)[0],
                "evidence": check_no_begging(content)[1],
            },
            {
                "text": "accurate_numbers",
                "passed": check_accurate_numbers(content)[0],
                "evidence": check_accurate_numbers(content)[1],
            },
            {
                "text": "correct_api_urls",
                "passed": check_correct_api_urls(content)[0],
                "evidence": check_correct_api_urls(content)[1],
            },
            {
                "text": "file_structure",
                "passed": check_file_structure(content)[0],
                "evidence": check_file_structure(content)[1],
            },
            {
                "text": "platform_tone_diff",
                "passed": check_platform_tone_diff(content)[0],
                "evidence": check_platform_tone_diff(content)[1],
            },
        ]
    }

    return results


def main():
    """Grade all 6 evaluation outputs."""
    all_results = []

    print("Grading all 6 content-posting skill evaluation outputs...\n")

    for eval_name, run_type in EVALS:
        filepath = BASE_PATH / eval_name / run_type / "outputs" / "daily-content.md"

        if not filepath.exists():
            print(f"WARNING: File not found: {filepath}")
            continue

        print(f"Grading: {eval_name} ({run_type})...")
        results = grade_file(filepath, eval_name, run_type)

        if results:
            all_results.append(results)

            # Save grading.json to the eval directory
            output_dir = filepath.parent.parent
            output_file = output_dir / "grading.json"

            grading_output = {
                "run_type": run_type,
                "expectations": results["expectations"]
            }

            with open(output_file, 'w', encoding='utf-8') as f:
                json.dump(grading_output, f, indent=2, ensure_ascii=False)

            print(f"  Saved: {output_file}")

            # Count passed assertions
            passed = sum(1 for e in results["expectations"] if e["passed"])
            print(f"  Passed: {passed}/8 assertions\n")

    # Save comprehensive results
    summary_file = BASE_PATH / "grading_summary.json"
    with open(summary_file, 'w', encoding='utf-8') as f:
        json.dump(all_results, f, indent=2, ensure_ascii=False)

    print(f"\nSummary saved: {summary_file}")

    # Print comparison table
    print("\n" + "=" * 100)
    print("GRADING SUMMARY")
    print("=" * 100)

    for result in all_results:
        passed = sum(1 for e in result["expectations"] if e["passed"])
        print(f"{result['eval']:30s} | {result['run_type']:15s} | {passed}/8 passed")

    print("=" * 100)


if __name__ == "__main__":
    main()
