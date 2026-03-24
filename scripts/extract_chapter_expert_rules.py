#!/usr/bin/env python3
"""
CBP CROSS Chapter Expert Rules Extraction
- Sample 5 rulings per chapter (97 × 5 = ~485)
- Analyze classification reasoning via LLM
- Extract decision tree rules per chapter
"""

import csv, json, os, random, time, sys
from collections import defaultdict

CBP_CSV = '/Volumes/soulmaten/POTAL/cbp_cross_combined_mappings.csv'
OUTPUT_DIR = '/Volumes/soulmaten/POTAL/hs_correlation'
OPENAI_API_KEY = os.environ.get('OPENAI_API_KEY', '')

# Load heading + subheading descriptions for context
sys.path.insert(0, os.path.join(os.path.dirname(__file__), '..'))

def load_hs_descriptions():
    """Load heading descriptions from the TS data file."""
    descs = {}
    ts_path = 'app/lib/cost-engine/gri-classifier/data/heading-descriptions.ts'
    try:
        with open(ts_path, 'r') as f:
            content = f.read()
        import re
        for m in re.finditer(r"'(\d{4})':\s*'([^']*)'", content):
            descs[m.group(1)] = m.group(2)
    except:
        pass
    # Also load subheadings
    ts_path2 = 'app/lib/cost-engine/gri-classifier/data/subheading-descriptions.ts'
    try:
        with open(ts_path2, 'r') as f:
            content = f.read()
        import re
        for m in re.finditer(r"'(\d{6})':\s*'([^']*)'", content):
            descs[m.group(1)] = m.group(2)
    except:
        pass
    return descs

def call_openai(prompt, max_tokens=1500):
    """Call OpenAI GPT-4o-mini."""
    import urllib.request
    headers = {
        'Authorization': f'Bearer {OPENAI_API_KEY}',
        'Content-Type': 'application/json',
    }
    body = json.dumps({
        'model': 'gpt-4o-mini',
        'messages': [{'role': 'user', 'content': prompt}],
        'temperature': 0,
        'max_tokens': max_tokens,
        'response_format': {'type': 'json_object'},
    }).encode('utf-8')

    req = urllib.request.Request('https://api.openai.com/v1/chat/completions',
                                 data=body, headers=headers, method='POST')
    try:
        with urllib.request.urlopen(req, timeout=30) as resp:
            data = json.loads(resp.read().decode('utf-8'))
            content = data['choices'][0]['message']['content']
            return json.loads(content)
    except Exception as e:
        return {'error': str(e)}

def main():
    hs_descs = load_hs_descriptions()
    print(f"Loaded {len(hs_descs)} HS descriptions")

    # 1. Load and group CBP data by chapter
    print("Loading CBP CROSS data...")
    chapter_data = defaultdict(list)
    with open(CBP_CSV, 'r', encoding='utf-8', errors='replace') as f:
        reader = csv.DictReader(f)
        for row in reader:
            hs6_raw = str(row.get('hs6_code', '')).strip().lstrip('(')
            hs6 = hs6_raw.replace('.', '')
            if len(hs6) < 4:
                continue
            try:
                ch = int(hs6[:2])
            except:
                continue
            if ch < 1 or ch > 97:
                continue

            name = row.get('product_name', '').strip()[:150]
            hts = row.get('hts_code', '').strip().lstrip('(')
            ruling = row.get('ruling_number', '').strip()
            desc = row.get('description', '').strip()[:200]

            if name:
                chapter_data[ch].append({
                    'product_name': name,
                    'hs6': hs6[:6].ljust(6, '0'),
                    'hts': hts,
                    'ruling': ruling,
                    'desc': desc,
                })

    print(f"Chapters with data: {len(chapter_data)}")

    # 2. Sample 5 per chapter
    random.seed(42)  # Reproducible
    samples = {}
    total_sampled = 0
    for ch in range(1, 98):
        if ch == 77:
            continue
        records = chapter_data.get(ch, [])
        if len(records) == 0:
            samples[ch] = []
            continue
        n = min(5, len(records))
        # Pick diverse samples (different headings if possible)
        headings_seen = set()
        diverse = []
        shuffled = random.sample(records, min(len(records), 50))
        for r in shuffled:
            h4 = r['hs6'][:4]
            if h4 not in headings_seen:
                diverse.append(r)
                headings_seen.add(h4)
                if len(diverse) >= n:
                    break
        # Fill remaining from random
        while len(diverse) < n and len(records) > 0:
            pick = random.choice(records)
            if pick not in diverse:
                diverse.append(pick)
        samples[ch] = diverse[:n]
        total_sampled += len(diverse[:n])

    print(f"Total sampled: {total_sampled} rulings across {sum(1 for v in samples.values() if v)} chapters")

    # 3. For each chapter, send samples to LLM for analysis
    print("\nAnalyzing chapters with LLM...")
    all_rules = {}

    chapters_to_process = sorted([ch for ch in samples if samples[ch]])

    for idx, ch in enumerate(chapters_to_process):
        ch_samples = samples[ch]
        ch_str = str(ch).zfill(2)

        # Get heading descriptions for this chapter
        ch_headings = {k: v for k, v in hs_descs.items() if len(k) == 4 and k.startswith(ch_str)}
        heading_list = '\n'.join(f"  {k}: {v}" for k, v in sorted(ch_headings.items()))

        sample_text = ''
        for i, s in enumerate(ch_samples):
            hs_desc = hs_descs.get(s['hs6'], hs_descs.get(s['hs6'][:4], ''))
            sample_text += f"\n  Ruling {i+1}: Product=\"{s['product_name'][:100]}\" → HS {s['hs6']} ({hs_desc[:60]})"

        prompt = f"""Analyze these {len(ch_samples)} CBP CROSS classification rulings for HS Chapter {ch} and extract expert decision rules.

## Chapter {ch} Headings:
{heading_list if heading_list else f"Chapter {ch} (no heading descriptions available)"}

## Sample Rulings:
{sample_text}

## YOUR TASK:
Based on these real CBP classification decisions, extract the DECISION RULES that a customs broker uses to classify products in Chapter {ch}.

Output STRICT JSON:
{{
  "chapter": {ch},
  "chapter_description": "one-line description of what this chapter covers",
  "key_distinctions": ["list of 3-5 key factors that determine classification within this chapter"],
  "decision_rules": [
    {{
      "rule_id": "ch{ch_str}_r1",
      "if_condition": "IF the product is/has [condition]",
      "then_heading": "XXXX",
      "because": "short reason why this heading applies",
      "watch_out": "common mistake or trap to avoid"
    }}
  ],
  "common_traps": ["1-3 common misclassification traps for this chapter"],
  "material_matters": true/false,
  "function_matters": true/false,
  "processing_level_matters": true/false
}}

Rules should be specific and actionable. 3-6 rules per chapter. Focus on the distinctions that DIFFERENTIATE headings within this chapter."""

        result = call_openai(prompt, max_tokens=1200)

        if 'error' in result:
            print(f"  Ch.{ch:02d}: ERROR — {result['error'][:60]}")
            all_rules[ch] = {'chapter': ch, 'error': result['error']}
        else:
            all_rules[ch] = result
            n_rules = len(result.get('decision_rules', []))
            print(f"  Ch.{ch:02d}: {n_rules} rules extracted — {result.get('chapter_description', '')[:50]}")

        if (idx + 1) % 10 == 0:
            print(f"  --- Progress: {idx+1}/{len(chapters_to_process)} chapters ---")

        # Rate limit
        time.sleep(0.3)

    # 4. Save results
    output_path = os.path.join(OUTPUT_DIR, 'chapter_expert_rules.json')
    with open(output_path, 'w', encoding='utf-8') as f:
        json.dump(all_rules, f, indent=2, ensure_ascii=False)

    # 5. Print summary
    print("\n" + "=" * 70)
    print("CHAPTER EXPERT RULES SUMMARY")
    print("=" * 70)

    total_rules = 0
    for ch in sorted(all_rules.keys(), key=int):
        data = all_rules[ch]
        if 'error' in data:
            continue
        rules = data.get('decision_rules', [])
        total_rules += len(rules)
        desc = data.get('chapter_description', '')[:55]
        traps = data.get('common_traps', [])
        distinctions = data.get('key_distinctions', [])

        print(f"\n{'─'*70}")
        print(f"Ch.{int(ch):02d}: {desc}")
        print(f"  Rules: {len(rules)} | Material: {'✓' if data.get('material_matters') else '✗'} | Function: {'✓' if data.get('function_matters') else '✗'} | Processing: {'✓' if data.get('processing_level_matters') else '✗'}")

        if distinctions:
            print(f"  Key distinctions: {'; '.join(d[:40] for d in distinctions[:3])}")

        for rule in rules[:4]:
            cond = rule.get('if_condition', '')[:60]
            heading = rule.get('then_heading', '?')
            print(f"    → {cond} → {heading}")
        if len(rules) > 4:
            print(f"    → ... +{len(rules)-4} more rules")

        if traps:
            print(f"  ⚠ Traps: {traps[0][:60]}")

    print(f"\n{'='*70}")
    print(f"Total: {len([c for c in all_rules.values() if 'error' not in c])} chapters analyzed, {total_rules} rules extracted")
    print(f"Saved: {output_path}")


if __name__ == '__main__':
    main()
