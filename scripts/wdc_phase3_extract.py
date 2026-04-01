#!/usr/bin/env python3
"""
WDC Phase 3: Extract unique (category, product_name_pattern) pairs from JSONL.
Streams through the 324GB file, collects category→subcategory frequencies.
Output: wdc_phase3_categories.json
"""
import json
import sys
import os
import re
import time
from collections import defaultdict, Counter

JSONL_PATH = "/Volumes/soulmaten/POTAL/wdc-products/extracted/products_detailed.jsonl"
OUTPUT_DIR = "/Users/maegbug/potal/scripts/wdc_phase3_output"
LOG_FILE = "/Users/maegbug/potal/wdc_phase3.log"

os.makedirs(OUTPUT_DIR, exist_ok=True)

def log(msg):
    ts = time.strftime("%Y-%m-%d %H:%M:%S")
    line = f"[{ts}] {msg}"
    print(line)
    with open(LOG_FILE, "a") as f:
        f.write(line + "\n")

def normalize_name(name):
    """Normalize product name to a clean pattern."""
    if not name or not isinstance(name, str):
        return None
    # Remove URLs, emails
    name = re.sub(r'https?://\S+', '', name)
    name = re.sub(r'\S+@\S+', '', name)
    # Remove excessive special chars
    name = re.sub(r'[^\w\s\-&/,.]', ' ', name)
    # Collapse whitespace
    name = re.sub(r'\s+', ' ', name).strip()
    # Skip if too short or too long
    if len(name) < 3 or len(name) > 200:
        return None
    # Skip if mostly numbers
    alpha = sum(1 for c in name if c.isalpha())
    if alpha < len(name) * 0.3:
        return None
    return name

def extract_product_type(name):
    """Extract the general product type from a specific product name.
    E.g., 'Nike Air Max 90 Running Shoes Size 10' -> 'running shoes'
    """
    if not name:
        return None
    name_lower = name.lower()

    # Common product type patterns (noun phrases at end)
    product_types = [
        # Clothing
        'running shoes', 'dress shoes', 'casual shoes', 'athletic shoes', 'hiking boots',
        'ankle boots', 'knee boots', 'rain boots', 'snow boots', 'chelsea boots',
        'sneakers', 'sandals', 'loafers', 'oxfords', 'heels', 'flats', 'slippers',
        'flip flops', 'clogs', 'moccasins', 'espadrilles', 'wedges',
        't-shirt', 't-shirts', 'polo shirt', 'dress shirt', 'button-down shirt',
        'tank top', 'crop top', 'blouse', 'tunic', 'camisole', 'henley',
        'hoodie', 'hoodies', 'sweatshirt', 'sweatshirts', 'pullover', 'cardigan',
        'sweater', 'sweaters', 'fleece', 'vest', 'gilet',
        'jeans', 'leggings', 'joggers', 'chinos', 'cargo pants', 'dress pants',
        'sweatpants', 'culottes', 'palazzo pants', 'capris',
        'mini skirt', 'maxi skirt', 'midi skirt', 'pencil skirt', 'pleated skirt',
        'maxi dress', 'mini dress', 'midi dress', 'cocktail dress', 'evening dress',
        'sundress', 'wrap dress', 'shift dress', 'a-line dress', 'bodycon dress',
        'parka', 'windbreaker', 'trench coat', 'bomber jacket', 'leather jacket',
        'denim jacket', 'blazer', 'peacoat', 'raincoat', 'overcoat',
        'bikini', 'one-piece swimsuit', 'swim trunks', 'board shorts', 'rash guard',
        'boxer briefs', 'boxers', 'briefs', 'thong', 'bra', 'sports bra',
        'pajamas', 'robe', 'nightgown', 'lounge pants',
        # Accessories
        'stud earrings', 'hoop earrings', 'drop earrings', 'dangle earrings',
        'clip-on earrings', 'ear cuffs', 'huggie earrings',
        'pendant necklace', 'chain necklace', 'choker', 'lariat necklace',
        'tennis bracelet', 'bangle', 'cuff bracelet', 'charm bracelet', 'beaded bracelet',
        'engagement ring', 'wedding band', 'cocktail ring', 'signet ring', 'stackable ring',
        'aviator sunglasses', 'wayfarer sunglasses', 'cat eye sunglasses', 'round sunglasses',
        'sport sunglasses', 'oversized sunglasses', 'polarized sunglasses',
        'baseball cap', 'beanie', 'fedora', 'bucket hat', 'visor', 'snapback',
        'trucker hat', 'beret', 'sun hat', 'wide brim hat',
        'messenger bag', 'tote bag', 'crossbody bag', 'backpack', 'clutch',
        'satchel', 'duffle bag', 'fanny pack', 'shoulder bag', 'hobo bag',
        'wallet', 'card holder', 'coin purse', 'money clip',
        'analog watch', 'digital watch', 'smartwatch', 'chronograph', 'dive watch',
        'wristwatch', 'pocket watch',
        'scarf', 'gloves', 'belt', 'tie', 'bow tie', 'suspenders',
        # Electronics
        'laptop', 'desktop computer', 'tablet', 'smartphone', 'smartwatch',
        'headphones', 'earbuds', 'wireless earbuds', 'speaker', 'bluetooth speaker',
        'monitor', 'keyboard', 'mouse', 'webcam', 'microphone',
        'printer', 'scanner', 'router', 'modem', 'network switch',
        'usb cable', 'hdmi cable', 'charger', 'power bank', 'adapter',
        'ssd', 'hard drive', 'memory card', 'usb drive', 'ram',
        'graphics card', 'processor', 'motherboard', 'power supply',
        'smart tv', 'projector', 'streaming device', 'game console',
        'drone', 'action camera', 'dslr camera', 'mirrorless camera', 'lens',
        'tripod', 'camera bag', 'memory card', 'camera strap',
        'phone case', 'screen protector', 'tablet case', 'laptop sleeve',
        # Home & Garden
        'sofa', 'couch', 'loveseat', 'sectional', 'futon', 'recliner',
        'dining table', 'coffee table', 'end table', 'console table', 'desk',
        'office chair', 'dining chair', 'bar stool', 'accent chair', 'rocking chair',
        'bookshelf', 'dresser', 'nightstand', 'cabinet', 'wardrobe', 'tv stand',
        'bed frame', 'mattress', 'pillow', 'comforter', 'duvet', 'sheets',
        'blanket', 'throw pillow', 'curtains', 'blinds', 'rug', 'carpet',
        'chandelier', 'pendant light', 'floor lamp', 'table lamp', 'wall sconce',
        'ceiling fan', 'desk lamp', 'led strip', 'string lights',
        'faucet', 'showerhead', 'toilet', 'bathtub', 'vanity', 'mirror',
        'towel', 'bath mat', 'shower curtain', 'soap dispenser',
        'dinnerware set', 'flatware', 'drinking glass', 'wine glass', 'mug',
        'plate', 'bowl', 'serving tray', 'cutting board', 'knife set',
        'blender', 'mixer', 'toaster', 'coffee maker', 'microwave',
        'air fryer', 'instant pot', 'slow cooker', 'food processor', 'juicer',
        'candle', 'vase', 'picture frame', 'wall art', 'clock',
        'planter', 'garden hose', 'lawn mower', 'shovel', 'rake',
        'patio set', 'outdoor chair', 'hammock', 'grill', 'fire pit',
        # Sports & Outdoors
        'yoga mat', 'dumbbell', 'resistance band', 'kettlebell', 'jump rope',
        'treadmill', 'exercise bike', 'elliptical', 'rowing machine', 'weight bench',
        'basketball', 'soccer ball', 'football', 'baseball', 'tennis ball',
        'golf club', 'tennis racket', 'hockey stick', 'badminton racket',
        'bicycle', 'mountain bike', 'road bike', 'electric bike', 'bike helmet',
        'skateboard', 'scooter', 'roller skates', 'surfboard', 'paddleboard',
        'tent', 'sleeping bag', 'camping chair', 'cooler', 'lantern',
        'hiking backpack', 'water bottle', 'thermos', 'compass', 'binoculars',
        'fishing rod', 'fishing reel', 'tackle box', 'fish finder', 'fishing line',
        'ski', 'snowboard', 'ski goggles', 'ski jacket', 'ski boots',
        # Automotive
        'car battery', 'tire', 'wheel', 'brake pad', 'oil filter',
        'air filter', 'spark plug', 'wiper blade', 'headlight', 'tail light',
        'car seat cover', 'floor mat', 'steering wheel cover', 'dash cam',
        'car charger', 'gps navigator', 'car mount', 'jump starter',
        'motorcycle helmet', 'motorcycle jacket', 'motorcycle gloves',
        # Beauty & Health
        'lipstick', 'lip gloss', 'foundation', 'concealer', 'mascara',
        'eyeshadow', 'eyeliner', 'blush', 'bronzer', 'highlighter',
        'face cream', 'moisturizer', 'serum', 'sunscreen', 'face wash',
        'shampoo', 'conditioner', 'hair oil', 'hair spray', 'hair dryer',
        'perfume', 'cologne', 'body lotion', 'hand cream', 'deodorant',
        'nail polish', 'nail art', 'makeup brush', 'makeup palette',
        'vitamin', 'supplement', 'protein powder', 'essential oil',
        'toothbrush', 'toothpaste', 'mouthwash', 'dental floss',
        # Toys & Games
        'action figure', 'doll', 'stuffed animal', 'plush toy',
        'board game', 'card game', 'puzzle', 'jigsaw puzzle',
        'building blocks', 'lego set', 'model kit', 'remote control car',
        'toy car', 'toy truck', 'train set', 'play set',
        'video game', 'controller', 'gaming headset', 'gaming mouse',
        # Books & Media
        'hardcover book', 'paperback', 'ebook', 'audiobook',
        'vinyl record', 'cd', 'dvd', 'blu-ray',
        'poster', 'print', 'canvas', 'greeting card', 'sticker',
        # Food & Beverage
        'coffee beans', 'tea bags', 'protein bar', 'energy drink',
        'chocolate', 'candy', 'snack', 'cereal', 'sauce', 'spice',
        'red wine', 'white wine', 'beer', 'whiskey', 'vodka', 'tequila',
        # Office & School
        'notebook', 'pen', 'pencil', 'marker', 'highlighter pen',
        'stapler', 'tape dispenser', 'paper clip', 'binder', 'folder',
        'desk organizer', 'file cabinet', 'whiteboard', 'bulletin board',
        # Pet Supplies
        'dog food', 'cat food', 'dog toy', 'cat toy', 'pet bed',
        'dog collar', 'dog leash', 'cat litter', 'fish tank', 'bird cage',
        # Baby & Kids
        'baby stroller', 'car seat', 'high chair', 'crib', 'baby monitor',
        'diaper', 'baby bottle', 'pacifier', 'baby clothes', 'baby blanket',
        # Tools
        'drill', 'screwdriver', 'wrench', 'hammer', 'pliers',
        'saw', 'sander', 'level', 'tape measure', 'toolbox',
        # Musical Instruments
        'acoustic guitar', 'electric guitar', 'bass guitar', 'ukulele',
        'keyboard piano', 'drum kit', 'violin', 'trumpet', 'saxophone', 'flute',
    ]

    for pt in product_types:
        if pt in name_lower:
            return pt

    return None

def main():
    log("=" * 60)
    log("WDC Phase 3: Category + Product Name Pattern Extraction")
    log("=" * 60)

    # Data structures
    category_counts = Counter()  # category -> count
    category_product_types = defaultdict(Counter)  # category -> {product_type: count}
    product_type_counts = Counter()  # global product_type -> count
    name_samples = defaultdict(list)  # category -> [sample names] (max 5 per category)

    total_lines = 0
    valid_lines = 0
    with_category = 0
    with_product_type = 0
    errors = 0

    start_time = time.time()
    last_report = start_time

    log(f"Starting to stream {JSONL_PATH}")

    try:
        with open(JSONL_PATH, 'r', encoding='utf-8', errors='replace') as f:
            for line in f:
                total_lines += 1

                # Progress report every 5M lines
                if total_lines % 5000000 == 0:
                    elapsed = time.time() - start_time
                    rate = total_lines / elapsed
                    log(f"  Progress: {total_lines:,} lines ({valid_lines:,} valid, {with_category:,} with category, {with_product_type:,} with product type) | {rate:,.0f} lines/sec")

                    # Save intermediate results every 50M lines
                    if total_lines % 50000000 == 0:
                        save_results(category_counts, category_product_types, product_type_counts, name_samples, total_lines)

                try:
                    data = json.loads(line.strip())
                except (json.JSONDecodeError, ValueError):
                    errors += 1
                    continue

                valid_lines += 1

                name = data.get('name', '')
                category = data.get('category', '')

                if category and isinstance(category, str) and len(category) > 2:
                    # Clean category
                    cat_clean = category.strip()
                    if len(cat_clean) < 100 and not cat_clean.startswith('http'):
                        with_category += 1
                        category_counts[cat_clean] += 1

                        # Collect sample names
                        if len(name_samples[cat_clean]) < 5 and name and len(name) > 5:
                            name_samples[cat_clean].append(name[:200])

                # Extract product type from name
                if name and isinstance(name, str):
                    pt = extract_product_type(name)
                    if pt:
                        with_product_type += 1
                        product_type_counts[pt] += 1
                        if category:
                            category_product_types[category.strip()][pt] += 1

    except KeyboardInterrupt:
        log("Interrupted! Saving partial results...")
    except Exception as e:
        log(f"Error at line {total_lines}: {e}")

    elapsed = time.time() - start_time
    log(f"\nExtraction complete!")
    log(f"Total lines: {total_lines:,}")
    log(f"Valid JSON: {valid_lines:,}")
    log(f"With category: {with_category:,}")
    log(f"With product type: {with_product_type:,}")
    log(f"Parse errors: {errors:,}")
    log(f"Unique categories: {len(category_counts):,}")
    log(f"Unique product types: {len(product_type_counts):,}")
    log(f"Elapsed: {elapsed/3600:.1f} hours ({elapsed:.0f} sec)")

    save_results(category_counts, category_product_types, product_type_counts, name_samples, total_lines)

def save_results(category_counts, category_product_types, product_type_counts, name_samples, total_lines):
    """Save all extracted data to files."""
    log(f"Saving results at {total_lines:,} lines...")

    # 1. All categories with counts (top 10000)
    top_cats = category_counts.most_common(10000)
    with open(f"{OUTPUT_DIR}/all_categories.json", 'w') as f:
        json.dump(dict(top_cats), f, ensure_ascii=False, indent=2)
    log(f"  Saved {len(top_cats)} categories")

    # 2. Product type frequencies
    with open(f"{OUTPUT_DIR}/product_types.json", 'w') as f:
        json.dump(dict(product_type_counts.most_common()), f, ensure_ascii=False, indent=2)
    log(f"  Saved {len(product_type_counts)} product types")

    # 3. Category -> product types mapping (top 500 categories)
    cat_pt_map = {}
    for cat, _ in category_counts.most_common(500):
        if cat in category_product_types:
            cat_pt_map[cat] = dict(category_product_types[cat].most_common(20))
    with open(f"{OUTPUT_DIR}/category_product_types.json", 'w') as f:
        json.dump(cat_pt_map, f, ensure_ascii=False, indent=2)
    log(f"  Saved category->product_type map for {len(cat_pt_map)} categories")

    # 4. Name samples per category (top 500)
    samples = {}
    for cat, _ in category_counts.most_common(500):
        if cat in name_samples and name_samples[cat]:
            samples[cat] = name_samples[cat]
    with open(f"{OUTPUT_DIR}/name_samples.json", 'w') as f:
        json.dump(samples, f, ensure_ascii=False, indent=2)
    log(f"  Saved name samples for {len(samples)} categories")

    # 5. Progress marker
    with open(f"{OUTPUT_DIR}/progress.json", 'w') as f:
        json.dump({
            "total_lines": total_lines,
            "unique_categories": len(category_counts),
            "unique_product_types": len(product_type_counts),
            "timestamp": time.strftime("%Y-%m-%d %H:%M:%S")
        }, f, indent=2)

    log(f"  Results saved to {OUTPUT_DIR}/")

if __name__ == "__main__":
    main()
