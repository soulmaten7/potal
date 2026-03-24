#!/usr/bin/env python3
"""
Amazon 300+ product collection + 9-field extraction
Usage: python3 scripts/amazon_300_collect.py
"""
import requests, json, time, sys

API_KEY = '862297c953msh18d0e20a472b36bp1e3751jsn9810b160cdbe'
HEADERS = {
    'x-rapidapi-key': API_KEY,
    'x-rapidapi-host': 'real-time-amazon-data.p.rapidapi.com'
}
BASE = '/Volumes/soulmaten/POTAL/7field_benchmark'
OUTPUT = f'{BASE}/amazon_all_products.json'

CATEGORIES = [
    "organic coffee beans",
    "frozen shrimp seafood",
    "dried fruit snack",
    "olive oil extra virgin",
    "honey raw organic",
    "essential oil aromatherapy",
    "plastic food container set",
    "rubber yoga mat",
    "candle soy wax scented",
    "cleaning spray disinfectant",
    "leather wallet mens",
    "bamboo cutting board",
    "notebook journal hardcover",
    "cardboard shipping box",
    "cotton t-shirt mens",
    "silk scarf women",
    "polyester jacket windbreaker",
    "wool sweater knitted",
    "linen tablecloth",
    "running shoes mens",
    "ceramic coffee mug",
    "glass vase decorative",
    "silver necklace pendant",
    "stainless steel water bottle",
    "cast iron skillet",
    "cordless drill power tool",
    "blender kitchen appliance",
    "bicycle helmet adult",
    "digital watch sport",
    "board game family",
]

def search(query):
    try:
        r = requests.get('https://real-time-amazon-data.p.rapidapi.com/search',
            headers=HEADERS, params={'query': query, 'country': 'US', 'page': '1'}, timeout=15)
        if r.status_code != 200:
            print(f'  Search error {r.status_code}')
            return []
        data = r.json()
        return data.get('data', {}).get('products', [])
    except Exception as e:
        print(f'  Search exception: {e}')
        return []

def detail(asin):
    try:
        r = requests.get('https://real-time-amazon-data.p.rapidapi.com/product-details',
            headers=HEADERS, params={'asin': asin, 'country': 'US'}, timeout=15)
        if r.status_code != 200:
            return None
        return r.json().get('data', {})
    except:
        return None

def extract_9field(d, query):
    if not d:
        return None
    info = d.get('product_information', {}) or {}
    details = d.get('product_details', {}) or {}
    about = d.get('about_product', []) or []
    about_text = ' '.join(about) if isinstance(about, list) else str(about or '')

    # Material from multiple sources
    mat = (details.get('Material', '') or details.get('Fabric Type', '') or
           info.get('Material', '') or info.get('Fabric type', '') or
           details.get('Material Type', '') or details.get('Blade Material', '') or
           details.get('Frame Material', '') or '')

    # Category from multiple sources
    cat_parts = []
    for k in ['Department', 'Category', 'Best Sellers Rank']:
        v = details.get(k, '')
        if v and isinstance(v, str) and not v.startswith('#'):
            cat_parts.append(v)
    category = ' > '.join(cat_parts) if cat_parts else ''
    if not category:
        category = d.get('category_path', '') or ''

    # Price parsing
    price_str = d.get('product_price', '') or ''
    price = None
    if price_str:
        cleaned = price_str.replace('$', '').replace(',', '').strip()
        try:
            price = float(cleaned)
        except:
            pass

    # Origin
    origin = info.get('Country of Origin', '') or info.get('Country of origin', '') or ''
    if not origin:
        origin = 'CN'  # default
    elif 'China' in origin:
        origin = 'CN'
    elif 'India' in origin:
        origin = 'IN'
    elif 'United States' in origin or 'USA' in origin:
        origin = 'US'
    elif 'Vietnam' in origin:
        origin = 'VN'
    elif 'Japan' in origin:
        origin = 'JP'
    elif 'Korea' in origin:
        origin = 'KR'
    elif len(origin) == 2:
        pass  # already ISO
    else:
        origin = 'CN'

    return {
        'product_name': d.get('product_title', ''),
        'material': mat,
        'origin_country': origin,
        'category': category[:200],
        'description': about_text[:500],
        'processing': '',
        'composition': details.get('Fabric Type', '') or details.get('Material Composition', '') or '',
        'weight_spec': info.get('Item Weight', '') or info.get('Product Dimensions', '') or '',
        'price': price,
        'source_asin': d.get('asin', ''),
        'search_query': query,
    }

# Load existing 50 products
existing = []
try:
    existing = json.load(open(f'{BASE}/amazon_50_products.json'))
    print(f'Loaded {len(existing)} existing products')
except:
    print('No existing products found')
existing_asins = {p.get('source_asin') for p in existing}

# Collect new products
all_new = []
for qi, query in enumerate(CATEGORIES):
    print(f'\n[{qi+1}/{len(CATEGORIES)}] Searching: "{query}"')
    products = search(query)
    if not products:
        print('  No search results')
        time.sleep(1)
        continue

    print(f'  Found {len(products)} results')
    # Take top 10 ASINs
    asins = []
    for p in products[:15]:
        asin = p.get('asin', '')
        if asin and asin not in existing_asins and asin not in {x.get('source_asin') for x in all_new}:
            asins.append(asin)
        if len(asins) >= 10:
            break

    for ai, asin in enumerate(asins):
        d = detail(asin)
        if not d:
            print(f'  [{ai+1}/{len(asins)}] {asin} — detail failed')
            time.sleep(1)
            continue

        product = extract_9field(d, query)
        if product and product['product_name']:
            all_new.append(product)
            mat_short = product['material'][:20] if product['material'] else '-'
            print(f'  [{ai+1}/{len(asins)}] {product["product_name"][:40]} | mat={mat_short}')
        time.sleep(1)

    time.sleep(1)

# Combine
all_products = existing + all_new
print(f'\n=== Collection Complete ===')
print(f'Existing: {len(existing)}')
print(f'New: {len(all_new)}')
print(f'Total: {len(all_products)}')

# Field quality
fields = ['product_name', 'material', 'origin_country', 'category', 'description', 'processing', 'composition', 'weight_spec', 'price']
print('\n=== Field Quality ===')
for f in fields:
    filled = sum(1 for p in all_products if p.get(f))
    print(f'  {f}: {filled}/{len(all_products)} ({filled*100//len(all_products)}%)')

json.dump(all_products, open(OUTPUT, 'w'), indent=2, ensure_ascii=False)
print(f'\nSaved: {OUTPUT}')
