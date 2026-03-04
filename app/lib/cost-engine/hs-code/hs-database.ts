/**
 * POTAL HS Code Database
 *
 * Common consumer product HS Codes with keyword matching.
 * Covers the top categories in cross-border e-commerce.
 *
 * Sources: WCO Harmonized System, US HTSUS, EU TARIC
 *
 * Phase 1: ~100 most common product categories (keyword match)
 * Phase 5: AI-assisted classification + full HS database
 */

import type { HsCodeEntry } from './types';

export const HS_DATABASE: HsCodeEntry[] = [
  // ═══ CHAPTER 42: LEATHER GOODS ═══
  { code: '4202', description: 'Trunks, suitcases, handbags, wallets', chapter: '42', category: 'bags',
    keywords: ['handbag', 'purse', 'wallet', 'backpack', 'luggage', 'suitcase', 'bag', 'tote', 'clutch', 'briefcase'] },

  // ═══ CHAPTER 61: KNITTED APPAREL ═══
  { code: '6109', description: 'T-shirts, singlets, tank tops (knitted)', chapter: '61', category: 'apparel',
    keywords: ['t-shirt', 'tshirt', 'tee', 'tank top', 'singlet', 'undershirt'] },
  { code: '6110', description: 'Jerseys, pullovers, sweaters, cardigans', chapter: '61', category: 'apparel',
    keywords: ['sweater', 'pullover', 'cardigan', 'jersey', 'hoodie', 'sweatshirt', 'fleece'] },
  { code: '6104', description: 'Women suits, dresses, skirts (knitted)', chapter: '61', category: 'apparel',
    keywords: ['dress', 'skirt', 'women suit', 'knit dress'] },
  { code: '6103', description: 'Men suits, trousers (knitted)', chapter: '61', category: 'apparel',
    keywords: ['jogger', 'sweatpant', 'knit trouser', 'knit pant'] },
  { code: '6115', description: 'Hosiery, socks, stockings', chapter: '61', category: 'apparel',
    keywords: ['sock', 'socks', 'stocking', 'hosiery', 'tights', 'pantyhose'] },
  { code: '6116', description: 'Gloves (knitted)', chapter: '61', category: 'apparel',
    keywords: ['glove', 'mittens', 'knit glove'] },

  // ═══ CHAPTER 62: WOVEN APPAREL ═══
  { code: '6201', description: 'Men overcoats, jackets (woven)', chapter: '62', category: 'apparel',
    keywords: ['jacket', 'coat', 'overcoat', 'parka', 'windbreaker', 'blazer'] },
  { code: '6203', description: 'Men suits, trousers, shorts (woven)', chapter: '62', category: 'apparel',
    keywords: ['pants', 'trousers', 'jeans', 'shorts', 'suit', 'chinos', 'khakis'] },
  { code: '6204', description: 'Women suits, dresses, skirts (woven)', chapter: '62', category: 'apparel',
    keywords: ['women pants', 'women shorts', 'blouse', 'women jacket'] },
  { code: '6205', description: 'Men shirts (woven)', chapter: '62', category: 'apparel',
    keywords: ['shirt', 'button-up', 'dress shirt', 'polo', 'oxford'] },
  { code: '6211', description: 'Tracksuits, ski suits, swimwear', chapter: '62', category: 'apparel',
    keywords: ['tracksuit', 'swimsuit', 'bikini', 'swim trunk', 'swimwear', 'ski suit', 'rash guard'] },

  // ═══ CHAPTER 64: FOOTWEAR ═══
  { code: '6401', description: 'Waterproof footwear (rubber/plastic)', chapter: '64', category: 'footwear',
    keywords: ['rain boot', 'rubber boot', 'waterproof shoe', 'wellington'] },
  { code: '6402', description: 'Sports shoes, sneakers (rubber/plastic)', chapter: '64', category: 'footwear',
    keywords: ['sneaker', 'running shoe', 'athletic shoe', 'sport shoe', 'trainer', 'tennis shoe'] },
  { code: '6403', description: 'Leather shoes, boots, sandals', chapter: '64', category: 'footwear',
    keywords: ['leather shoe', 'boot', 'sandal', 'loafer', 'oxford', 'heel', 'dress shoe', 'ankle boot'] },
  { code: '6404', description: 'Textile upper footwear', chapter: '64', category: 'footwear',
    keywords: ['canvas shoe', 'slipper', 'espadrille', 'flat', 'slip-on'] },

  // ═══ CHAPTER 65: HEADWEAR ═══
  { code: '6505', description: 'Hats, caps, headwear', chapter: '65', category: 'accessories',
    keywords: ['hat', 'cap', 'beanie', 'baseball cap', 'snapback', 'bucket hat', 'visor', 'headband'] },

  // ═══ CHAPTER 71: JEWELRY ═══
  { code: '7113', description: 'Jewelry of precious metal', chapter: '71', category: 'jewelry',
    keywords: ['gold ring', 'silver necklace', 'diamond', 'platinum', 'gold bracelet', 'precious jewelry'] },
  { code: '7117', description: 'Imitation/costume jewelry', chapter: '71', category: 'jewelry',
    keywords: ['jewelry', 'necklace', 'bracelet', 'earring', 'ring', 'pendant', 'brooch', 'costume jewelry', 'fashion jewelry'] },

  // ═══ CHAPTER 84: MACHINERY & COMPUTERS ═══
  { code: '8471', description: 'Computers, laptops, tablets', chapter: '84', category: 'electronics',
    keywords: ['laptop', 'computer', 'tablet', 'desktop', 'notebook', 'chromebook', 'ipad', 'macbook'] },
  { code: '8473', description: 'Computer parts and accessories', chapter: '84', category: 'electronics',
    keywords: ['keyboard', 'mouse', 'hard drive', 'ssd', 'ram', 'gpu', 'motherboard', 'computer part', 'usb hub'] },
  { code: '8443', description: 'Printers, scanners', chapter: '84', category: 'electronics',
    keywords: ['printer', 'scanner', '3d printer', 'ink cartridge', 'toner'] },
  { code: '8467', description: 'Power tools', chapter: '84', category: 'tools',
    keywords: ['drill', 'power tool', 'sander', 'grinder', 'saw', 'impact driver'] },

  // ═══ CHAPTER 85: ELECTRICAL/ELECTRONICS ═══
  { code: '8517', description: 'Smartphones, telecom equipment', chapter: '85', category: 'electronics',
    keywords: ['phone', 'smartphone', 'iphone', 'samsung', 'pixel', 'mobile phone', 'cell phone', 'telephone'] },
  { code: '8518', description: 'Speakers, headphones, microphones', chapter: '85', category: 'electronics',
    keywords: ['headphone', 'earphone', 'speaker', 'bluetooth speaker', 'airpods', 'earbuds', 'microphone', 'amplifier'] },
  { code: '8519', description: 'Sound recording/reproducing apparatus', chapter: '85', category: 'electronics',
    keywords: ['mp3 player', 'turntable', 'record player', 'audio recorder'] },
  { code: '8521', description: 'Video recording apparatus', chapter: '85', category: 'electronics',
    keywords: ['dvd player', 'blu-ray', 'video recorder', 'streaming device', 'media player'] },
  { code: '8523', description: 'Storage media (USB, SD cards)', chapter: '85', category: 'electronics',
    keywords: ['usb drive', 'flash drive', 'sd card', 'memory card', 'usb stick'] },
  { code: '8525', description: 'Cameras, camcorders', chapter: '85', category: 'electronics',
    keywords: ['camera', 'webcam', 'gopro', 'action camera', 'camcorder', 'dslr', 'mirrorless', 'drone'] },
  { code: '8528', description: 'Monitors, TVs, projectors', chapter: '85', category: 'electronics',
    keywords: ['monitor', 'tv', 'television', 'projector', 'display', 'screen', 'led tv', 'oled'] },
  { code: '8504', description: 'Chargers, power adapters, batteries', chapter: '85', category: 'electronics',
    keywords: ['charger', 'power bank', 'battery', 'adapter', 'power supply', 'usb charger', 'wireless charger'] },
  { code: '8516', description: 'Electric heaters, hair dryers, irons', chapter: '85', category: 'appliances',
    keywords: ['hair dryer', 'iron', 'heater', 'toaster', 'kettle', 'electric blanket', 'space heater'] },
  { code: '8509', description: 'Domestic appliances (vacuum, etc.)', chapter: '85', category: 'appliances',
    keywords: ['vacuum', 'blender', 'food processor', 'mixer', 'juicer', 'robot vacuum'] },

  // ═══ CHAPTER 87: VEHICLES ═══
  { code: '8711', description: 'Motorcycles, e-bikes, scooters', chapter: '87', category: 'vehicles',
    keywords: ['e-bike', 'electric scooter', 'motorcycle', 'e-scooter', 'electric bike', 'moped'] },
  { code: '8712', description: 'Bicycles', chapter: '87', category: 'vehicles',
    keywords: ['bicycle', 'bike', 'mountain bike', 'road bike', 'bmx'] },

  // ═══ CHAPTER 90: OPTICAL/MEDICAL ═══
  { code: '9003', description: 'Eyeglass frames', chapter: '90', category: 'accessories',
    keywords: ['glasses', 'eyeglasses', 'spectacles', 'sunglasses', 'eyeglass frame'] },
  { code: '9004', description: 'Sunglasses', chapter: '90', category: 'accessories',
    keywords: ['sunglasses', 'shades', 'aviator', 'ray-ban'] },
  { code: '9018', description: 'Medical instruments', chapter: '90', category: 'health',
    keywords: ['blood pressure monitor', 'thermometer', 'stethoscope', 'medical device'] },
  { code: '9019', description: 'Massage apparatus, therapy equipment', chapter: '90', category: 'health',
    keywords: ['massage gun', 'massager', 'therapy', 'tens unit', 'massage chair'] },

  // ═══ CHAPTER 91: WATCHES ═══
  { code: '9101', description: 'Wristwatches (precious metal)', chapter: '91', category: 'watches',
    keywords: ['luxury watch', 'gold watch', 'rolex', 'omega'] },
  { code: '9102', description: 'Wristwatches (other)', chapter: '91', category: 'watches',
    keywords: ['watch', 'smartwatch', 'apple watch', 'fitness watch', 'digital watch', 'wristwatch'] },

  // ═══ CHAPTER 94: FURNITURE ═══
  { code: '9401', description: 'Seats, chairs', chapter: '94', category: 'furniture',
    keywords: ['chair', 'office chair', 'gaming chair', 'stool', 'sofa', 'couch', 'recliner', 'bean bag'] },
  { code: '9403', description: 'Other furniture', chapter: '94', category: 'furniture',
    keywords: ['desk', 'table', 'shelf', 'bookcase', 'cabinet', 'dresser', 'bed frame', 'nightstand'] },
  { code: '9404', description: 'Mattresses, bedding', chapter: '94', category: 'furniture',
    keywords: ['mattress', 'pillow', 'bedding', 'duvet', 'comforter', 'mattress topper', 'sleeping bag'] },
  { code: '9405', description: 'Lamps, light fixtures', chapter: '94', category: 'furniture',
    keywords: ['lamp', 'light', 'chandelier', 'led strip', 'desk lamp', 'floor lamp', 'pendant light'] },

  // ═══ CHAPTER 95: TOYS & SPORTS ═══
  { code: '9503', description: 'Toys, puzzles, models', chapter: '95', category: 'toys',
    keywords: ['toy', 'lego', 'puzzle', 'doll', 'action figure', 'board game', 'plush', 'stuffed animal', 'model kit'] },
  { code: '9504', description: 'Video game consoles, games', chapter: '95', category: 'electronics',
    keywords: ['playstation', 'xbox', 'nintendo', 'switch', 'game console', 'video game', 'controller', 'gaming'] },
  { code: '9506', description: 'Sports equipment', chapter: '95', category: 'sports',
    keywords: ['yoga mat', 'dumbbell', 'weight', 'gym equipment', 'tennis racket', 'golf club', 'basketball', 'fitness'] },

  // ═══ CHAPTER 96: MISC MANUFACTURED ═══
  { code: '9603', description: 'Brooms, brushes, mops', chapter: '96', category: 'home',
    keywords: ['brush', 'broom', 'mop', 'toothbrush', 'paint brush', 'makeup brush'] },
  { code: '9608', description: 'Pens, pencils, markers', chapter: '96', category: 'stationery',
    keywords: ['pen', 'pencil', 'marker', 'fountain pen', 'ballpoint', 'highlighter'] },
  { code: '9616', description: 'Perfume sprayers, cosmetic applicators', chapter: '96', category: 'beauty',
    keywords: ['perfume', 'cologne', 'fragrance', 'body spray'] },

  // ═══ CHAPTER 33: COSMETICS & PERFUMES ═══
  { code: '3304', description: 'Beauty/makeup products', chapter: '33', category: 'beauty',
    keywords: ['makeup', 'lipstick', 'foundation', 'mascara', 'eyeshadow', 'concealer', 'blush', 'cosmetic'] },
  { code: '3305', description: 'Hair care products', chapter: '33', category: 'beauty',
    keywords: ['shampoo', 'conditioner', 'hair oil', 'hair spray', 'hair dye', 'hair mask'] },
  { code: '3307', description: 'Skincare, sunscreen, deodorant', chapter: '33', category: 'beauty',
    keywords: ['skincare', 'moisturizer', 'sunscreen', 'serum', 'cleanser', 'lotion', 'deodorant', 'body wash'] },

  // ═══ CHAPTER 39: PLASTICS ═══
  { code: '3924', description: 'Plastic household articles', chapter: '39', category: 'home',
    keywords: ['plastic container', 'storage bin', 'water bottle', 'tupperware', 'lunch box', 'plastic cup'] },
  { code: '3926', description: 'Other plastic articles', chapter: '39', category: 'accessories',
    keywords: ['phone case', 'plastic cover', 'screen protector', 'protective case', 'silicone case'] },

  // ═══ CHAPTER 63: TEXTILE ARTICLES ═══
  { code: '6302', description: 'Bed linen, towels', chapter: '63', category: 'home',
    keywords: ['towel', 'bed sheet', 'pillowcase', 'blanket', 'bath towel', 'linen'] },
  { code: '6307', description: 'Other textile articles', chapter: '63', category: 'home',
    keywords: ['face mask', 'cleaning cloth', 'textile bag', 'flag', 'banner'] },

  // ═══ CHAPTER 73: IRON/STEEL ARTICLES ═══
  { code: '7323', description: 'Kitchen/tableware of steel', chapter: '73', category: 'home',
    keywords: ['pot', 'pan', 'cookware', 'stainless steel', 'baking sheet', 'wok', 'frying pan', 'kitchen knife'] },

  // ═══ CHAPTER 69: CERAMICS ═══
  { code: '6911', description: 'Tableware of porcelain/china', chapter: '69', category: 'home',
    keywords: ['mug', 'cup', 'plate', 'bowl', 'ceramic', 'porcelain', 'dinnerware', 'tea set'] },

  // ═══ CHAPTER 49: BOOKS ═══
  { code: '4901', description: 'Printed books, brochures', chapter: '49', category: 'books',
    keywords: ['book', 'novel', 'textbook', 'comic', 'manga', 'guide', 'cookbook'] },

  // ═══ CHAPTER 34: SOAP/CANDLES ═══
  { code: '3406', description: 'Candles', chapter: '34', category: 'home',
    keywords: ['candle', 'scented candle', 'wax melt', 'tealight'] },
];

/**
 * Get HS Code entry by exact code
 */
export function getHsEntry(code: string): HsCodeEntry | undefined {
  return HS_DATABASE.find(e => e.code === code);
}

/**
 * Get all entries for a chapter
 */
export function getChapterEntries(chapter: string): HsCodeEntry[] {
  return HS_DATABASE.filter(e => e.chapter === chapter);
}

/**
 * Get all entries for a category
 */
export function getCategoryEntries(category: string): HsCodeEntry[] {
  return HS_DATABASE.filter(e => e.category === category);
}
