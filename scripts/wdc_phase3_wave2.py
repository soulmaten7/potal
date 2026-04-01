#!/usr/bin/env python3
"""
WDC Phase 3 Wave 2: Multi-language categories + subcategories + path-style categories.
"""
import json
import subprocess
import time
import sys
import re
import os

LOG_FILE = "/Users/maegbug/potal/wdc_phase3.log"
SUPABASE_PROJECT = "zyurflkhiregundhisky"
SUPABASE_TOKEN = os.environ.get("SUPABASE_MGMT_TOKEN", "")

def log(msg):
    ts = time.strftime("%Y-%m-%d %H:%M:%S")
    line = f"[{ts}] {msg}"
    print(line, flush=True)
    with open(LOG_FILE, "a") as f:
        f.write(line + "\n")

def run_sql(query, retries=3):
    for attempt in range(retries):
        try:
            result = subprocess.run(
                ["curl", "-s", "-X", "POST",
                 f"https://api.supabase.com/v1/projects/{SUPABASE_PROJECT}/database/query",
                 "-H", f"Authorization: Bearer {SUPABASE_TOKEN}",
                 "-H", "Content-Type: application/json",
                 "-d", json.dumps({"query": query})],
                capture_output=True, text=True, timeout=120
            )
            resp = result.stdout
            if '"message"' in resp and 'ERROR' in resp:
                if attempt < retries - 1:
                    time.sleep(1)
                    continue
                return None, resp[:200]
            return json.loads(resp), None
        except Exception as e:
            if attempt < retries - 1:
                time.sleep(1)
                continue
            return None, str(e)
    return None, "retries exceeded"

# Wave 2: Multi-language + subcategory + specific product mappings
WAVE2_MAP = {
    # ===== MULTI-LANGUAGE: German =====
    "Kleider": "620442",         # Dresses
    "Jacken": "620293",          # Jackets
    "Hosen": "620342",           # Pants
    "Zubehör": "420329",         # Accessories
    "Schmuck": "711319",         # Jewelry
    "Sonnenbrillen": "900410",   # Sunglasses
    "Ringe": "711319",           # Rings
    "Rucksäcke": "420292",       # Backpacks
    "Herren Jeans": "620342",    # Men's Jeans
    "Fahrzeuge & Teile": "870899",  # Vehicles & Parts
    "Ohrringe": "711319",        # Earrings
    "Halsketten": "711319",      # Necklaces
    "Armbänder": "711319",       # Bracelets
    "Schuhe": "640419",          # Shoes
    "Stiefel": "640399",         # Boots
    "Hemden": "620520",          # Shirts
    "Mäntel": "620293",          # Coats
    "Röcke": "620442",           # Skirts
    "Handschuhe": "621600",      # Gloves
    "Mützen": "650590",          # Caps/Beanies
    "Taschen": "420222",         # Bags
    "Gürtel": "420340",          # Belts
    "Uhren": "910211",           # Watches
    "Möbel": "940360",           # Furniture
    "Teppiche": "570242",        # Carpets/Rugs
    "Lampen": "940540",          # Lamps
    "Kerzen": "340600",          # Candles
    "Spielzeug": "950300",       # Toys
    "Bücher": "490199",          # Books
    "Werkzeug": "820590",        # Tools

    # ===== MULTI-LANGUAGE: French =====
    "Boucles d'oreilles": "711319",  # Earrings
    "Colliers": "711319",            # Necklaces
    "Bagues": "711319",              # Rings
    "Bracelets": "711319",           # same in English
    "Chaussures": "640419",          # Shoes
    "Robes": "620442",               # Dresses
    "Pantalons": "620342",           # Pants
    "Vestes": "620293",              # Jackets
    "Manteaux": "620293",            # Coats
    "Jupes": "620442",               # Skirts
    "Sacs": "420222",                # Bags
    "Montres": "910211",             # Watches
    "Lunettes": "900410",            # Glasses
    "Ceintures": "420340",           # Belts
    "Écharpes": "621410",            # Scarves
    "Gants": "621600",               # Gloves
    "Chapeaux": "650590",            # Hats
    "Meubles": "940360",             # Furniture
    "Tapis": "570242",               # Rugs
    "Bougies": "340600",             # Candles
    "Jouets": "950300",              # Toys
    "Livres": "490199",              # Books
    "Parfum": "330300",              # Perfume

    # ===== MULTI-LANGUAGE: Spanish =====
    "Accesorios": "420329",          # Accessories
    "Zapatos": "640419",             # Shoes
    "Vestidos": "620442",            # Dresses
    "Pantalones": "620342",          # Pants
    "Camisetas": "610910",           # T-Shirts
    "Chaquetas": "620293",           # Jackets
    "Faldas": "620442",              # Skirts
    "Bolsos": "420222",              # Bags
    "Relojes": "910211",             # Watches
    "Anillos": "711319",             # Rings
    "Pendientes": "711319",          # Earrings
    "Collares": "711319",            # Necklaces
    "Pulseras": "711319",            # Bracelets
    "Gafas": "900410",              # Glasses
    "Cinturones": "420340",          # Belts
    "Gorras": "650590",              # Caps
    "Muebles": "940360",             # Furniture
    "Alfombras": "570242",           # Rugs
    "Velas": "340600",               # Candles
    "Juguetes": "950300",            # Toys
    "Libros": "490199",              # Books
    "Ropa": "620342",                # Clothing
    "Calzado": "640419",             # Footwear
    "Denominación": "220421",         # Wine denomination
    "Vino": "220421",                # Wine

    # ===== MULTI-LANGUAGE: Italian =====
    "Accessori": "420329",           # Accessories
    "Scarpe": "640419",              # Shoes
    "Orecchini": "711319",           # Earrings
    "Anelli": "711319",              # Rings
    "Collane": "711319",             # Necklaces
    "Bracciali": "711319",           # Bracelets
    "Borse": "420222",               # Bags
    "Orologi": "910211",             # Watches
    "Abiti": "620442",               # Dresses
    "Pantaloni": "620342",           # Pants
    "Giacche": "620293",             # Jackets
    "Gonne": "620442",               # Skirts
    "Magliette": "610910",           # T-Shirts
    "Cinture": "420340",             # Belts
    "Cappelli": "650590",            # Hats
    "Mobili": "940360",              # Furniture
    "Tappeti": "570242",             # Rugs
    "Candele": "340600",             # Candles
    "Giocattoli": "950300",          # Toys
    "Abbigliamento": "620342",       # Clothing
    "Ciabatte": "640520",            # Slippers

    # ===== MULTI-LANGUAGE: Portuguese =====
    "Sapatos": "640419",             # Shoes
    "Vestidos": "620442",            # Dresses (same as Spanish)
    "Brincos": "711319",             # Earrings
    "Anéis": "711319",               # Rings
    "Colares": "711319",             # Necklaces
    "Pulseiras": "711319",           # Bracelets
    "Bolsas": "420222",              # Bags
    "Relógios": "910211",            # Watches

    # ===== MULTI-LANGUAGE: Romanian =====
    "Pantofi cu toc": "640419",      # High heels
    "Bijuterii": "711319",           # Jewelry
    "Sandale": "640420",             # Sandals
    "Cercei": "711319",              # Earrings
    "Incaltaminte dama": "640419",   # Women's footwear
    "Incaltaminte": "640419",        # Footwear
    "Femei": "620442",               # Women

    # ===== MULTI-LANGUAGE: Hungarian =====
    "Casual cipők": "640419",        # Casual shoes
    "Szandálok": "640420",           # Sandals

    # ===== MULTI-LANGUAGE: Russian =====
    "Коврики в салон автомобиля": "570242",  # Car floor mats
    "свадебные платья": "620442",     # Wedding dresses
    "Шины": "401110",                # Tires
    "Кофти та светри жіночі": "611030",  # Women's sweaters (Ukrainian)
    "Забавні": "950300",              # Fun/Toys

    # ===== MULTI-LANGUAGE: Japanese =====
    "雑誌": "490210",                # Magazines
    "注射用ステロイド": "300439",     # Injectable steroids (pharma)

    # ===== MULTI-LANGUAGE: Chinese =====
    "杂志": "490210",                # Magazines

    # ===== MULTI-LANGUAGE: Korean =====
    "잡지": "490210",                # Magazines

    # ===== MULTI-LANGUAGE: Czech/Slovak =====
    "CYKLODRESY": "611020",          # Cycling jerseys

    # ===== MULTI-LANGUAGE: Polish =====
    "Strona główna": "999999",       # Home page (skip)

    # ===== MULTI-LANGUAGE: Persian =====
    "کفش اسپرت و ورزشی": "640411",   # Sports shoes
    "کفش روزمره": "640419",           # Casual shoes
    "نیم بوت": "640399",              # Ankle boots

    # ===== MULTI-LANGUAGE: Danish =====
    "Damer": "620442",               # Women
    "Profiltøj": "620342",           # Work wear

    # ===== MULTI-LANGUAGE: Greek =====
    "Σανδάλια με τακούνι": "640419",  # Heeled sandals

    # ===== SUBCATEGORIES & SPECIFIC =====
    "Active Tops": "611020",
    "Skin Care": "330499",
    "Skincare": "330499",
    "Dining Chairs": "940169",
    "Accent Chairs": "940161",
    "Recliners": "940161",
    "Saree": "500790",               # Silk saree
    "Knitwear": "611030",
    "Trousers": "620342",
    "Pullover": "611030",
    "Active Tops": "611020",
    "Yardage": "520942",             # Fabric by the yard
    "Occasional Tables": "940369",
    "Pokemon Single": "950490",      # Trading cards
    "Yugioh Single": "950490",       # Trading cards
    "Trainers/Trainers": "640411",
    "Stationery": "482010",
    "Papeterie": "482010",           # French: Stationery
    "Comics": "490110",
    "Manga": "490110",
    "Wedding Dresses": "620442",
    "Engagement Ring": "711319",
    "Pendant": "711319",
    "Pendants": "711319",
    "Charm": "711319",
    "Vinyl": "852380",
    "Mattress Sets": "940429",
    "Beds": "940140",
    "Ottomans": "940161",
    "Sectionals": "940161",
    "Sofas": "940161",
    "Sofa": "940161",
    "Living Room Furniture": "940161",
    "Seating": "940161",
    "Tables": "940369",
    "Lamps": "940540",
    "Drinkware": "701310",
    "Mugs": "691110",
    "Mug": "691110",
    "Cushions": "940490",
    "Pillow": "940490",
    "Pillows": "940490",
    "Bedding": "630210",
    "Wallpaper": "481490",
    "Canvas Print": "970110",
    "Art Print": "970110",
    "Artwork": "970110",
    "Painting": "970110",
    "Wall Art": "970110",
    "Glass": "701090",
    "Vase": "691390",
    "Decor": "940599",
    "Home Decor": "940599",
    "Candle": "340600",
    "Backpack": "420292",
    "Backpacks": "420292",
    "Handbag": "420221",
    "Handbags": "420221",
    "Wallet": "420231",
    "Bag": "420222",
    "Earring": "711319",
    "Sneaker": "640419",
    "Tees": "610910",
    "Tee": "610910",
    "Jersey": "611020",
    "Jerseys": "611020",
    "Blouse": "620640",
    "Blouses": "620640",
    "Skirt": "620442",
    "Scarf": "621410",
    "Gloves": "621600",
    "Hat": "650590",
    "Headwear": "650590",
    "Boot": "640399",
    "Boots": "640399",
    "Sandals": "640420",
    "Slippers": "640520",
    "Eyeglasses": "900490",
    "Glasses": "900490",
    "Book": "490199",
    "Album": "852380",
    "Poster": "490900",
    "Print": "490900",
    "Prints": "490900",
    "Sticker": "490110",
    "Greeting Card": "490110",
    "Greeting Cards": "490110",
    "Gift Card": "490199",
    "Gift Cards": "490199",
    "Pattern": "490199",
    "Candle": "340600",
    "Makeup": "330420",
    "Make up": "330420",
    "Beauty": "330499",
    "Health & Beauty": "330499",
    "Personal Care": "330499",
    "Hair Care": "330510",
    "Shampoo": "330510",
    "Fragrance": "330300",
    "Perfume": "330300",
    "Nail Polish": "330430",
    "Supplements": "210690",
    "Vitamins & Supplements": "210690",
    "Food": "210690",
    "Snacks": "190590",
    "Beverages": "220290",
    "Drinks": "220290",
    "Coffee": "090111",
    "Beer": "220300",
    "Wine": "220421",
    "Scotch": "220830",
    "Grocery": "210690",
    "Desserts": "190590",
    "Pasta": "190219",
    "Salads": "200599",
    "Sandwiches": "190590",
    "Board Games": "950490",
    "Games": "950490",
    "Toys": "950300",
    "Video Games": "950430",
    "Speakers": "851829",
    "Audio": "851829",
    "Laptops": "847130",
    "Smartphones": "851712",
    "Smart Phones": "851712",
    "Mobile Phones": "851712",
    "Mobiles": "851712",
    "Electronics": "854231",
    "PC, Laptop": "847130",
    "Scooters": "871200",
    "Golf Carts": "870390",
    "Watercraft": "890399",
    "Cruiser": "871200",
    "Cars": "870332",
    "Used Car": "870332",
    "Tools": "820590",
    "Equipment": "847989",
    "Hardware": "830160",
    "Parts": "870899",
    "Spare Parts": "870899",
    "Paint": "320990",
    "Ink": "321519",
    "Pet Supplies": "230910",
    "Pets": "230910",
    "Baby": "611130",
    "Kids": "950300",
    "Plants": "060290",
    "Flowers": "060310",
    "Seeds": "120991",
    "Art": "970110",
    "Canvas": "590320",
    "Fabrics": "520942",
    "Chair": "940169",
    "Insurance": "999999",         # Not a product
    "Real Estate": "999999",       # Not a product
    "Vacant Land": "999999",       # Not a product
    "Residential": "999999",       # Not a product
    "Single Family": "999999",     # Not a product
    "Self Storage": "999999",      # Not a product
    "5G Internet": "999999",       # Service
    "5G Home": "999999",           # Service
    "Fiber": "999999",             # Service
    "DSL": "999999",               # Service
    "Internet Service Provider": "999999",  # Service
    "Lifestyle": "999999",         # Generic
    "Uncategorized": "999999",
    "Misc": "999999",
    "Other": "999999",
    "Others": "999999",
    "General": "999999",
    "Miscellaneous": "999999",
    "Unclassified": "999999",
    "All Products": "999999",
    "All": "999999",
    "New": "999999",
    "Best Sellers": "999999",
    "Sale": "999999",
    "Outlet": "999999",
    "Default": "999999",
    "Products": "999999",
    "Product": "999999",
    "Casual": "999999",
    "Simple": "999999",
    "simple": "999999",
    "Standard": "999999",
    "Bundle": "999999",
    "Bundle Product": "999999",
    "Sets": "999999",
    "Set": "999999",
    "Family": "999999",
    "Gifts": "999999",
    "Business": "999999",

    # ===== SPECIFIC PRODUCT TYPES (not in Wave 1) =====
    "Men's running shoes": "640411",
    "Patchwork": "581099",           # Patchwork fabric
    "Drum Loops": "852380",          # Digital audio
    "Fine Cut Tobacco": "240311",
    "Appetizers": "210690",
    "Cakes & Dessert Bars": "190590",
    "Valentine's Day": "950510",     # Holiday items
    "Thanksgiving": "950510",
    "Christmas": "950510",
    "Sport": "950691",
    "Sports": "950691",
    "Weed": "999999",               # Skip
    "Injectable Steroids": "300439",
    "Winter": "620293",              # Winter outerwear
    "Around the House": "940599",
    "Womens": "620442",
    "Merchandise": "610910",
    "Fashion": "620342",
    "Bra": "621210",
    "Lingerie": "621210",
    "Blazer": "620311",
    "Sweatshirt": "611020",
    "Sweatshirts": "611020",
    "Rug": "570242",
    "Area Rugs": "570242",
    "Sweater": "611030",
    "Storage": "940360",
    "Living Room Furniture": "940161",
    "Office": "940360",
    "Kitchen": "732399",
    "Cruiser": "871200",
    "Body": "330499",                # Body care
    "Face": "330499",                # Face care

    # ===== Path-style categories (take last segment) =====
    "Wine/Red Wine": "220421",
    "Home & Garden > Plants > Flowers": "060310",
    "Home & Garden > Plants > Outdoor Plants": "060290",
    "Vehicles & Parts > Vehicles > Motor Vehicles > Motorcycles & Scooters": "871120",
    "Vehicles & Parts > Vehicle Parts & Accessories > Motor Vehicle Parts": "870899",
    "Posters, Prints, & Visual Artwork": "490900",
}

def main():
    log("=" * 60)
    log("WDC Phase 3 Wave 2: Multi-language + Subcategory Mappings")
    log("=" * 60)

    # Get existing names
    data, err = run_sql("SELECT product_name FROM product_hs_mappings;")
    if err:
        log(f"Error: {err}")
        return
    existing = {r['product_name'].lower().strip() for r in data}
    log(f"Existing mappings: {len(existing)}")

    vdata, verr = run_sql("SELECT product_name FROM hs_classification_vectors;")
    existing_vec = set()
    if vdata:
        existing_vec = {r['product_name'].lower().strip() for r in vdata}
    log(f"Existing vectors: {len(existing_vec)}")

    # Filter new
    new_mappings = []
    new_vectors = []
    for pn, hs6 in WAVE2_MAP.items():
        if hs6 == "999999":
            continue
        if pn.lower().strip() not in existing:
            new_mappings.append((pn, hs6))
        if pn.lower().strip() not in existing_vec:
            new_vectors.append((pn, hs6))

    log(f"New mappings: {len(new_mappings)}")
    log(f"New vectors: {len(new_vectors)}")

    # Insert mappings
    batch_size = 50
    inserted = 0
    errors = 0
    for i in range(0, len(new_mappings), batch_size):
        batch = new_mappings[i:i+batch_size]
        values = []
        for pn, hs6 in batch:
            pn_esc = pn.replace("'", "''")
            values.append(f"('{pn_esc}', '{pn_esc}', '{hs6}', 0.93, 'wdc_phase3_multilang', '{{}}'::jsonb, NOW())")
        sql = f"INSERT INTO product_hs_mappings (product_name, category, hs6, confidence, source, metadata, created_at) VALUES {','.join(values)};"
        result, err = run_sql(sql)
        if err:
            log(f"  Batch error: {err}")
            for pn, hs6 in batch:
                pn_esc = pn.replace("'", "''")
                single = f"INSERT INTO product_hs_mappings (product_name, category, hs6, confidence, source, metadata, created_at) VALUES ('{pn_esc}', '{pn_esc}', '{hs6}', 0.93, 'wdc_phase3_multilang', '{{}}'::jsonb, NOW());"
                r, e = run_sql(single)
                if e:
                    errors += 1
                else:
                    inserted += 1
        else:
            inserted += len(batch)

    log(f"Mappings: {inserted} inserted, {errors} errors")

    # Insert vectors
    vec_inserted = 0
    vec_errors = 0
    for i in range(0, len(new_vectors), batch_size):
        batch = new_vectors[i:i+batch_size]
        values = []
        for pn, hs6 in batch:
            pn_esc = pn.replace("'", "''")
            values.append(f"('{pn_esc}', '{pn_esc}', '{hs6}', 'wdc_phase3_multilang', 0.93, NOW(), NOW())")
        sql = f"INSERT INTO hs_classification_vectors (product_name, category, hs_code, source, confidence, created_at, updated_at) VALUES {','.join(values)};"
        result, err = run_sql(sql)
        if err:
            for pn, hs6 in batch:
                pn_esc = pn.replace("'", "''")
                single = f"INSERT INTO hs_classification_vectors (product_name, category, hs_code, source, confidence, created_at, updated_at) VALUES ('{pn_esc}', '{pn_esc}', '{hs6}', 'wdc_phase3_multilang', 0.93, NOW(), NOW());"
                r, e = run_sql(single)
                if e:
                    vec_errors += 1
                else:
                    vec_inserted += 1
        else:
            vec_inserted += len(batch)

    log(f"Vectors: {vec_inserted} inserted, {vec_errors} errors")

    # Final counts
    cnt1, _ = run_sql("SELECT COUNT(*) as cnt FROM product_hs_mappings;")
    cnt2, _ = run_sql("SELECT COUNT(*) as cnt FROM hs_classification_vectors;")
    log(f"Final product_hs_mappings: {cnt1[0]['cnt'] if cnt1 else '?'}")
    log(f"Final hs_classification_vectors: {cnt2[0]['cnt'] if cnt2 else '?'}")
    log("Wave 2 complete!")

if __name__ == "__main__":
    main()
