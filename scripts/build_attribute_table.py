#!/usr/bin/env python3
"""
Phase 0: Build attribute table from 25,029 US HTS descriptions.
Extract structured attributes from each code's official description.
One-time build, saved as JSON for instant lookup.
"""

import csv, json, re
from collections import defaultdict

GOV_FILE = "/Volumes/soulmaten/POTAL/benchmark/gov_tariff_descriptions.csv"
OUTPUT = "/Volumes/soulmaten/POTAL/benchmark/formulas/us_attribute_table.json"

# ─── Attribute extraction rules ────────────────────────

MATERIALS = {
    "cotton": ["cotton"], "polyester": ["polyester"], "wool": ["wool","woolen","woollen"],
    "silk": ["silk"], "nylon": ["nylon","polyamide"], "linen": ["linen","flax"],
    "leather": ["leather"], "suede": ["suede"], "fur": ["furskin","fur skin"],
    "rubber": ["rubber","latex"], "plastic": ["plastic","plastics","pvc","polyethylene","polypropylene","polycarbonate","polyurethane","acrylic"],
    "steel": ["steel","stainless steel"], "iron": ["iron","cast iron"],
    "aluminum": ["aluminum","aluminium"], "copper": ["copper","brass","bronze"],
    "nickel": ["nickel"], "zinc": ["zinc"], "tin": ["tin "], "lead": ["lead "],
    "titanium": ["titanium"], "tungsten": ["tungsten"],
    "gold": ["gold"], "silver": ["silver"], "platinum": ["platinum"],
    "wood": ["wood","wooden","timber","plywood"], "bamboo": ["bamboo"],
    "cork": ["cork"], "paper": ["paper","paperboard","cardboard","cellulose"],
    "glass": ["glass","crystal"], "ceramic": ["ceramic","porcelain","stoneware","earthenware","terra cotta"],
    "stone": ["stone","marble","granite","slate","cement","concrete","plaster","asbestos"],
    "carbon_fiber": ["carbon fiber","carbon fibre","graphite"],
    "resin": ["resin","epoxy"], "fiberglass": ["fiberglass","fibreglass"],
    "hemp": ["hemp"], "jute": ["jute"], "sisal": ["sisal"],
    "rayon": ["rayon","viscose"], "spandex": ["spandex","elastane"],
}

FORMS = {
    "powder": ["powder","powdered","dust"], "liquid": ["liquid","solution","suspension"],
    "solid": ["solid","block","brick","slab","ingot","billet"],
    "sheet": ["sheet","plate","foil","film","strip","coil"],
    "wire": ["wire","cable","cord"], "tube": ["tube","pipe","hose"],
    "bar": ["bar","rod","beam","rail","angle","profile"],
    "yarn": ["yarn","thread","filament","fibre","fiber"],
    "fabric": ["fabric","textile","cloth","woven","knitted","nonwoven","felt"],
    "granule": ["granule","pellet","flake","chip","bead","grain"],
    "paste": ["paste","gel","cream","ointment"],
    "gas": ["gas","gaseous"],
}

FUNCTIONS = {
    "clothing": ["apparel","garment","clothing","jacket","coat","shirt","trouser","dress","skirt","blouse","sweater","vest"],
    "footwear": ["footwear","shoe","boot","sandal","slipper"],
    "headgear": ["hat","cap","headgear","helmet","headband"],
    "food": ["food","edible","eat","baked","cooked","prepared","preserved","canned","frozen","dried","smoked","salted"],
    "beverage": ["beverage","drink","wine","beer","spirit","juice","water","tea","coffee"],
    "medical": ["medical","surgical","pharmaceutical","drug","medicine","tablet","capsule","dosage","vaccine","diagnostic"],
    "electrical": ["electrical","electronic","battery","motor","generator","transformer","circuit","semiconductor","led","display","speaker"],
    "optical": ["optical","lens","camera","telescope","microscope","laser"],
    "vehicle": ["vehicle","car","automobile","truck","motorcycle","bicycle","trailer"],
    "aircraft": ["aircraft","airplane","helicopter","drone"],
    "ship": ["ship","boat","vessel","yacht","canoe","kayak"],
    "machinery": ["machine","machinery","engine","pump","compressor","turbine","conveyor","crane","forklift"],
    "tool": ["tool","wrench","screwdriver","plier","hammer","saw","drill","knife","blade","scissor","cutlery"],
    "furniture": ["furniture","chair","table","desk","bed","mattress","shelf","cabinet","wardrobe","sofa","cushion","lamp"],
    "toy": ["toy","game","sport","doll","puzzle","costume","fancy dress"],
    "jewelry": ["jewelry","jewellery","necklace","bracelet","ring","earring","brooch","clasp","finding"],
    "cosmetic": ["cosmetic","perfume","soap","shampoo","lotion","cream","lipstick","mascara"],
    "musical": ["musical","instrument","piano","guitar","violin","drum","organ"],
    "weapon": ["weapon","arm","ammunition","firearm","pistol","rifle","sword","explosive","propellant"],
    "agricultural": ["agricultural","farm","tractor","plow","seed","fertiliser","fertilizer","pesticide","herbicide","insecticide"],
    "packaging": ["package","packing","container","bottle","jar","can","box","bag","sack","carton","wrapper"],
    "ornamental": ["ornamental","decorative","ornament","statuette","figurine","vase","trophy","frame"],
    "stationery": ["pen","pencil","eraser","notebook","envelope","label","sticker","decal","stamp","postcard","poster","calendar"],
    "textile_article": ["curtain","blanket","towel","tablecloth","bedding","carpet","rug","mat","flag","pennant","lanyard","banner"],
}

CONSTRUCTIONS = {
    "knitted": ["knitted","knit","crocheted"], "woven": ["woven","weave"],
    "nonwoven": ["nonwoven","non-woven","felted"],
    "cast": ["cast","molded","moulded"], "forged": ["forged","stamped"],
    "extruded": ["extruded"], "rolled": ["rolled","hot-rolled","cold-rolled"],
    "welded": ["welded"], "coated": ["coated","plated","galvanized","anodized","painted","lacquered","laminated"],
    "printed": ["printed","dyed","bleached","unbleached"],
    "tanned": ["tanned","chrome-tanned"],
    "assembled": ["assembled","unassembled"],
}

PROCESSING = {
    "raw": ["raw","crude","unprocessed","unrefined","natural","live","fresh"],
    "processed": ["processed","refined","purified","distilled","filtered","concentrated"],
    "semi_processed": ["semi-processed","semi-finished","partly"],
    "preserved": ["preserved","canned","dried","frozen","smoked","salted","pickled","fermented","roasted"],
}

VALUE_PATTERNS = [
    (r'valued (?:over|exceeding) \$?([\d,.]+)', 'value_over'),
    (r'valued not (?:over|exceeding) \$?([\d,.]+)', 'value_not_over'),
]

WEIGHT_PATTERNS = [
    (r'weighing (?:more than|over|exceeding) ([\d,.]+)\s*(?:kg|g)', 'weight_over'),
    (r'weighing (?:not more than|not over|not exceeding|less than) ([\d,.]+)\s*(?:kg|g)', 'weight_not_over'),
]

COMPOSITION_PATTERNS = [
    (r'(\d+)\s*(?:percent|%) or more', 'composition_min'),
    (r'less than (\d+)\s*(?:percent|%)', 'composition_max'),
    (r'containing by weight (\d+)', 'composition_contains'),
]

GENDER = {
    "mens": ["men's","mens","boys'","boys","male"],
    "womens": ["women's","womens","girls'","girls","female"],
    "children": ["children","infant","baby","babies"],
}


def extract_attributes(desc):
    """Extract structured attributes from a tariff code description."""
    lower = desc.lower()
    attrs = {}

    # Materials
    mats = []
    for mat, keywords in MATERIALS.items():
        for kw in keywords:
            if kw in lower:
                mats.append(mat)
                break
    if mats: attrs["material"] = mats

    # Form
    forms = []
    for form, keywords in FORMS.items():
        for kw in keywords:
            if kw in lower:
                forms.append(form)
                break
    if forms: attrs["form"] = forms

    # Function
    funcs = []
    for func, keywords in FUNCTIONS.items():
        for kw in keywords:
            if kw in lower:
                funcs.append(func)
                break
    if funcs: attrs["function"] = funcs

    # Construction
    cons = []
    for con, keywords in CONSTRUCTIONS.items():
        for kw in keywords:
            if kw in lower:
                cons.append(con)
                break
    if cons: attrs["construction"] = cons

    # Processing
    procs = []
    for proc, keywords in PROCESSING.items():
        for kw in keywords:
            if kw in lower:
                procs.append(proc)
                break
    if procs: attrs["processing"] = procs

    # Gender
    genders = []
    for g, keywords in GENDER.items():
        for kw in keywords:
            if kw in lower:
                genders.append(g)
                break
    if genders: attrs["gender"] = genders

    # Value conditions
    for pat, label in VALUE_PATTERNS:
        m = re.search(pat, lower)
        if m:
            attrs[label] = float(m.group(1).replace(",", ""))

    # Weight conditions
    for pat, label in WEIGHT_PATTERNS:
        m = re.search(pat, lower)
        if m:
            attrs[label] = float(m.group(1).replace(",", ""))

    # Composition
    for pat, label in COMPOSITION_PATTERNS:
        m = re.search(pat, lower)
        if m:
            attrs[label] = int(m.group(1))

    return attrs


def main():
    print("Building attribute table from US HTS...")
    entries = []
    with open(GOV_FILE, "r") as f:
        for row in csv.DictReader(f):
            if row["country"] != "US" or row["hs_code"][:2] in ("98", "99"):
                continue
            entries.append({"code": row["hs_code"], "desc": row.get("description", "")})

    print(f"Processing {len(entries)} entries...")

    table = {}
    attr_stats = defaultdict(int)
    empty = 0

    for e in entries:
        attrs = extract_attributes(e["desc"])
        table[e["code"]] = {
            "desc": e["desc"],
            "attrs": attrs,
        }
        if not attrs:
            empty += 1
        for k in attrs:
            attr_stats[k] += 1

    print(f"\nAttribute coverage:")
    for k, v in sorted(attr_stats.items(), key=lambda x: -x[1]):
        print(f"  {k}: {v} ({100*v/len(entries):.1f}%)")
    print(f"  empty (no attrs): {empty} ({100*empty/len(entries):.1f}%)")

    with open(OUTPUT, "w") as f:
        json.dump(table, f, ensure_ascii=False)
    print(f"\nSaved to {OUTPUT} ({len(table)} entries)")


if __name__ == "__main__":
    main()
