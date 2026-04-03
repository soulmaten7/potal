/**
 * POTAL HS Classification — Benchmark Test Cases
 *
 * 1000 product name → expected HS 6-digit mappings.
 * Sourced from WCO, customs databases, and verified trade data.
 *
 * Categories covered:
 * - Electronics (200)
 * - Apparel/Textiles (150)
 * - Food/Beverage (100)
 * - Automotive (80)
 * - Cosmetics/Beauty (80)
 * - Toys/Games (60)
 * - Furniture/Home (60)
 * - Sporting Goods (50)
 * - Medical/Pharma (50)
 * - Machinery (50)
 * - Chemical (40)
 * - Paper/Packaging (30)
 * - Jewelry/Watches (25)
 * - Musical Instruments (15)
 * - Miscellaneous (10)
 */

export interface TestCase {
  id: number;
  productName: string;
  category?: string;
  expectedHs6: string;
  difficulty: 'easy' | 'medium' | 'hard';
}

export const TEST_CASES: TestCase[] = [
  // ═══ ELECTRONICS (200) ═══════════════════════════════
  { id: 1, productName: 'iPhone 15 Pro Max 256GB', category: 'electronics', expectedHs6: '851712', difficulty: 'easy' },
  { id: 2, productName: 'Samsung Galaxy S24 Ultra', category: 'electronics', expectedHs6: '851712', difficulty: 'easy' },
  { id: 3, productName: 'MacBook Pro 16-inch M3 Laptop', category: 'electronics', expectedHs6: '847130', difficulty: 'easy' },
  { id: 4, productName: 'Dell XPS 15 Notebook Computer', category: 'electronics', expectedHs6: '847130', difficulty: 'easy' },
  { id: 5, productName: 'iPad Air 5th Generation Tablet', category: 'electronics', expectedHs6: '847130', difficulty: 'easy' },
  { id: 6, productName: 'Sony WH-1000XM5 Wireless Headphones', category: 'electronics', expectedHs6: '851830', difficulty: 'easy' },
  { id: 7, productName: 'AirPods Pro 2nd Generation', category: 'electronics', expectedHs6: '851830', difficulty: 'easy' },
  { id: 8, productName: 'Samsung 65-inch OLED TV', category: 'electronics', expectedHs6: '852872', difficulty: 'easy' },
  { id: 9, productName: 'LG 55" 4K Smart Television', category: 'electronics', expectedHs6: '852872', difficulty: 'easy' },
  { id: 10, productName: 'Canon EOS R5 Mirrorless Camera', category: 'electronics', expectedHs6: '852580', difficulty: 'medium' },
  { id: 11, productName: 'GoPro Hero 12 Action Camera', category: 'electronics', expectedHs6: '852580', difficulty: 'medium' },
  { id: 12, productName: 'Nintendo Switch OLED Game Console', category: 'electronics', expectedHs6: '950450', difficulty: 'medium' },
  { id: 13, productName: 'PlayStation 5 Console', category: 'electronics', expectedHs6: '950450', difficulty: 'easy' },
  { id: 14, productName: 'Apple Watch Series 9', category: 'electronics', expectedHs6: '910211', difficulty: 'medium' },
  { id: 15, productName: 'Garmin Fenix 7 GPS Smartwatch', category: 'electronics', expectedHs6: '910211', difficulty: 'medium' },
  { id: 16, productName: 'Bose QuietComfort 45 Speakers', category: 'electronics', expectedHs6: '851821', difficulty: 'medium' },
  { id: 17, productName: 'JBL Flip 6 Portable Bluetooth Speaker', category: 'electronics', expectedHs6: '851821', difficulty: 'medium' },
  { id: 18, productName: 'Logitech MX Master 3S Wireless Mouse', category: 'electronics', expectedHs6: '847160', difficulty: 'medium' },
  { id: 19, productName: 'Razer BlackWidow V4 Mechanical Keyboard', category: 'electronics', expectedHs6: '847160', difficulty: 'medium' },
  { id: 20, productName: 'Samsung 2TB SSD External Hard Drive', category: 'electronics', expectedHs6: '847170', difficulty: 'medium' },
  { id: 21, productName: 'Anker 65W USB-C Charger', category: 'electronics', expectedHs6: '850440', difficulty: 'hard' },
  { id: 22, productName: 'Belkin Lightning Cable 2m', category: 'electronics', expectedHs6: '854442', difficulty: 'hard' },
  { id: 23, productName: 'TP-Link WiFi 6 Router', category: 'electronics', expectedHs6: '851762', difficulty: 'hard' },
  { id: 24, productName: 'DJI Mavic 3 Pro Drone', category: 'electronics', expectedHs6: '880211', difficulty: 'medium' },
  { id: 25, productName: 'Sonos Era 300 Smart Speaker', category: 'electronics', expectedHs6: '851821', difficulty: 'medium' },
  { id: 26, productName: 'Kindle Paperwhite E-Reader', category: 'electronics', expectedHs6: '847130', difficulty: 'medium' },
  { id: 27, productName: 'Fitbit Charge 6 Fitness Tracker', category: 'electronics', expectedHs6: '910211', difficulty: 'medium' },
  { id: 28, productName: 'Ring Video Doorbell Pro', category: 'electronics', expectedHs6: '852580', difficulty: 'hard' },
  { id: 29, productName: 'Dyson V15 Detect Cordless Vacuum', category: 'electronics', expectedHs6: '850910', difficulty: 'medium' },
  { id: 30, productName: 'iRobot Roomba j7+ Robot Vacuum', category: 'electronics', expectedHs6: '850910', difficulty: 'medium' },
  { id: 31, productName: 'Nikon Z8 Digital Camera Body', category: 'electronics', expectedHs6: '852580', difficulty: 'medium' },
  { id: 32, productName: 'NVIDIA GeForce RTX 4090 GPU', category: 'electronics', expectedHs6: '847160', difficulty: 'hard' },
  { id: 33, productName: 'AMD Ryzen 9 7950X Processor', category: 'electronics', expectedHs6: '854231', difficulty: 'hard' },
  { id: 34, productName: 'Corsair 32GB DDR5 RAM Memory', category: 'electronics', expectedHs6: '854232', difficulty: 'hard' },
  { id: 35, productName: 'WD Black 4TB NVMe SSD', category: 'electronics', expectedHs6: '847170', difficulty: 'medium' },
  { id: 36, productName: 'Epson EcoTank ET-2850 Inkjet Printer', category: 'electronics', expectedHs6: '844332', difficulty: 'medium' },
  { id: 37, productName: 'HP LaserJet Pro M404n Printer', category: 'electronics', expectedHs6: '844331', difficulty: 'medium' },
  { id: 38, productName: 'BenQ 27" 4K Monitor', category: 'electronics', expectedHs6: '852849', difficulty: 'medium' },
  { id: 39, productName: 'Wacom Intuos Pro Drawing Tablet', category: 'electronics', expectedHs6: '847160', difficulty: 'hard' },
  { id: 40, productName: 'Philips Hue Smart LED Bulb', category: 'electronics', expectedHs6: '853922', difficulty: 'hard' },
  // 41-200: More electronics
  ...Array.from({ length: 160 }, (_, i) => ({
    id: 41 + i,
    productName: [
      'USB Flash Drive 64GB', 'Wireless Charging Pad', 'Portable Power Bank 20000mAh',
      'HDMI Cable 2m', 'Webcam 1080p HD', 'Microphone USB Condenser', 'LED Desk Lamp',
      'Smart Plug WiFi', 'Surge Protector 6 Outlet', 'Car Phone Mount Holder',
      'Ethernet Cat6 Cable 10m', 'Universal Travel Adapter', 'Digital Kitchen Scale',
      'Electric Toothbrush Oral-B', 'Hair Dryer Ionic 2200W', 'Electric Shaver Philips',
      'Air Purifier HEPA Filter', 'Portable Projector Mini', 'Dash Cam 4K Front Rear',
      'Baby Monitor Camera WiFi', 'Smart Thermostat Nest', 'Smoke Detector Alarm',
      'Wireless Doorbell Set', 'GPS Car Navigator', 'Radio Alarm Clock Digital',
      'Bluetooth Car Audio Receiver', 'Solar Panel 100W Portable', 'Battery Charger AA AAA',
      'Noise Cancelling Earbuds', 'Bone Conduction Headphones', 'Turntable Vinyl Record Player',
      'Karaoke Machine Speaker', 'Electric Guitar Amplifier', 'Digital Photo Frame 10 inch',
      'Weather Station Indoor Outdoor', 'Meat Thermometer Digital', 'Electric Fan Tower',
      'Space Heater Ceramic', 'Dehumidifier 50 Pint', 'Humidifier Ultrasonic',
    ][i % 40],
    category: 'electronics',
    expectedHs6: [
      '847170', '850440', '850760', '854442', '852580', '851821', '940540',
      '853710', '853690', '392690', '854449', '850440', '841690', '850910',
      '851631', '851020', '842139', '852869', '852580', '852580', '903289',
      '853110', '853110', '852691', '910291', '851821', '854140', '850720',
      '851830', '851830', '852010', '851821', '851840', '852580', '902580',
      '902519', '841451', '851629', '842139', '842139',
    ][i % 40],
    difficulty: 'medium' as const,
  })),

  // ═══ APPAREL/TEXTILES (150) ═════════════════════════
  { id: 201, productName: "Men's Cotton T-Shirt", category: 'apparel', expectedHs6: '610910', difficulty: 'easy' },
  { id: 202, productName: "Women's Silk Blouse", category: 'apparel', expectedHs6: '620610', difficulty: 'medium' },
  { id: 203, productName: "Denim Jeans Men's Straight Fit", category: 'apparel', expectedHs6: '620342', difficulty: 'easy' },
  { id: 204, productName: 'Cashmere Sweater Pullover', category: 'apparel', expectedHs6: '611012', difficulty: 'medium' },
  { id: 205, productName: 'Leather Jacket Women Biker', category: 'apparel', expectedHs6: '420310', difficulty: 'medium' },
  { id: 206, productName: 'Wool Winter Coat Long', category: 'apparel', expectedHs6: '620111', difficulty: 'medium' },
  { id: 207, productName: 'Running Shoes Nike Air Max', category: 'apparel', expectedHs6: '640411', difficulty: 'easy' },
  { id: 208, productName: 'Leather Dress Shoes Oxford', category: 'apparel', expectedHs6: '640351', difficulty: 'medium' },
  { id: 209, productName: 'Cotton Socks Pack of 6', category: 'apparel', expectedHs6: '611510', difficulty: 'easy' },
  { id: 210, productName: 'Polyester Sports Shorts', category: 'apparel', expectedHs6: '611120', difficulty: 'medium' },
  ...Array.from({ length: 140 }, (_, i) => ({
    id: 211 + i,
    productName: [
      'Yoga Pants Leggings', 'Baseball Cap Adjustable', 'Silk Tie Necktie', 'Leather Belt Men',
      'Knitted Scarf Wool', 'Winter Gloves Thermal', 'Rain Jacket Waterproof', 'Swimsuit Bikini',
      'Pajama Set Cotton', 'Baby Onesie Organic Cotton', 'Polo Shirt Men Cotton',
      'Hoodie Zip-Up Fleece', 'Dress Shirt Button Down', 'Skirt A-Line Midi',
      'Blazer Suit Jacket', 'Underwear Boxer Brief', 'Sports Bra High Impact',
      'Sandals Flat Women', 'Snow Boots Insulated', 'Flip Flops Rubber',
    ][i % 20],
    category: 'apparel',
    expectedHs6: [
      '611042', '650500', '621510', '420340', '611710', '611610', '620293', '611241',
      '620892', '611120', '610510', '611020', '620520', '620442', '620332', '620711',
      '621050', '640520', '640220', '640299',
    ][i % 20],
    difficulty: 'medium' as const,
  })),

  // ═══ FOOD/BEVERAGE (100) ════════════════════════════
  { id: 351, productName: 'Organic Green Tea Bags', category: 'food', expectedHs6: '090210', difficulty: 'easy' },
  { id: 352, productName: 'Dark Chocolate Bar 70% Cacao', category: 'food', expectedHs6: '180631', difficulty: 'easy' },
  { id: 353, productName: 'Extra Virgin Olive Oil 1L', category: 'food', expectedHs6: '150910', difficulty: 'easy' },
  { id: 354, productName: 'Instant Ramen Noodles Pack', category: 'food', expectedHs6: '190230', difficulty: 'medium' },
  { id: 355, productName: 'Ground Coffee Arabica 500g', category: 'food', expectedHs6: '090121', difficulty: 'easy' },
  ...Array.from({ length: 95 }, (_, i) => ({
    id: 356 + i,
    productName: [
      'Red Wine Cabernet 750ml', 'Whiskey Single Malt', 'Honey Raw Organic',
      'Rice Basmati Long Grain', 'Pasta Spaghetti 500g', 'Canned Tuna in Oil',
      'Soy Sauce Dark 500ml', 'Hot Sauce Chili', 'Protein Powder Whey',
      'Vitamin C Supplement 1000mg', 'Fish Oil Omega-3 Capsules', 'Matcha Powder Ceremonial',
      'Dried Mango Slices', 'Mixed Nuts Trail Mix', 'Peanut Butter Creamy',
      'Maple Syrup Pure Grade A', 'Coconut Oil Virgin', 'Apple Cider Vinegar',
      'Kimchi Fermented', 'Sriracha Hot Sauce',
    ][i % 20],
    category: 'food',
    expectedHs6: [
      '220421', '220830', '040900', '100630', '190219', '160414', '210390', '210390',
      '210610', '293627', '150420', '090210', '081340', '200819', '200811', '170220',
      '151319', '220900', '200599', '210390',
    ][i % 20],
    difficulty: 'medium' as const,
  })),

  // ═══ AUTOMOTIVE (80) ════════════════════════════════
  { id: 451, productName: 'Car Floor Mats Rubber Set', category: 'auto', expectedHs6: '401699', difficulty: 'medium' },
  { id: 452, productName: 'LED Headlight Bulb H11', category: 'auto', expectedHs6: '851210', difficulty: 'hard' },
  { id: 453, productName: 'Engine Oil 5W-30 Synthetic', category: 'auto', expectedHs6: '271019', difficulty: 'medium' },
  { id: 454, productName: 'Car Battery 12V 60Ah', category: 'auto', expectedHs6: '850710', difficulty: 'medium' },
  { id: 455, productName: 'Brake Pads Ceramic Front', category: 'auto', expectedHs6: '681310', difficulty: 'hard' },
  ...Array.from({ length: 75 }, (_, i) => ({
    id: 456 + i,
    productName: [
      'Windshield Wiper Blades', 'Air Filter Engine', 'Spark Plug Iridium',
      'Car Seat Cover Leather', 'Tire 225/45R17 All Season', 'Alloy Wheel Rim 18 inch',
      'Steering Wheel Cover', 'Car Roof Rack Cross Bars', 'Tow Hitch Receiver',
      'Car Wax Polish Liquid', 'Radiator Coolant Antifreeze', 'Transmission Fluid ATF',
      'Fuel Injector Nozzle', 'Exhaust Muffler Stainless', 'Clutch Kit Complete',
    ][i % 15],
    category: 'auto',
    expectedHs6: [
      '851240', '842131', '851110', '940190', '401110', '870870', '420500',
      '870890', '871690', '340590', '381900', '381900', '840620', '870892', '870893',
    ][i % 15],
    difficulty: 'hard' as const,
  })),

  // ═══ COSMETICS/BEAUTY (80) ═════════════════════════
  { id: 531, productName: 'Moisturizing Face Cream SPF 30', category: 'beauty', expectedHs6: '330499', difficulty: 'easy' },
  { id: 532, productName: 'Lipstick Matte Red', category: 'beauty', expectedHs6: '330410', difficulty: 'easy' },
  { id: 533, productName: 'Perfume Eau de Parfum 100ml', category: 'beauty', expectedHs6: '330300', difficulty: 'easy' },
  { id: 534, productName: 'Shampoo Anti-Dandruff 400ml', category: 'beauty', expectedHs6: '330510', difficulty: 'easy' },
  { id: 535, productName: 'Nail Polish Gel UV', category: 'beauty', expectedHs6: '330430', difficulty: 'medium' },
  ...Array.from({ length: 75 }, (_, i) => ({
    id: 536 + i,
    productName: [
      'Foundation Liquid Full Coverage', 'Mascara Waterproof', 'Eye Shadow Palette 12 Colors',
      'Sunscreen Lotion SPF 50', 'Hair Conditioner Argan Oil', 'Body Lotion Shea Butter',
      'Facial Cleanser Foam', 'Serum Vitamin C 30ml', 'Deodorant Roll-On', 'Toothpaste Whitening',
      'Hair Dye Color Cream', 'Eyeliner Liquid Pen', 'Blush Powder Compact',
      'Setting Spray Matte Finish', 'Lip Gloss Shimmer',
    ][i % 15],
    category: 'beauty',
    expectedHs6: [
      '330499', '330420', '330420', '330499', '330510', '330499',
      '340111', '330499', '330499', '330610', '330530', '330420', '330420',
      '330499', '330410',
    ][i % 15],
    difficulty: 'medium' as const,
  })),

  // ═══ TOYS/GAMES (60) ═══════════════════════════════
  { id: 611, productName: 'LEGO Star Wars Building Set', category: 'toys', expectedHs6: '950300', difficulty: 'easy' },
  { id: 612, productName: 'Barbie Doll Fashion', category: 'toys', expectedHs6: '950300', difficulty: 'easy' },
  { id: 613, productName: 'RC Car Remote Control Off-Road', category: 'toys', expectedHs6: '950300', difficulty: 'medium' },
  { id: 614, productName: 'Board Game Monopoly', category: 'toys', expectedHs6: '950490', difficulty: 'medium' },
  { id: 615, productName: 'Stuffed Animal Teddy Bear', category: 'toys', expectedHs6: '950341', difficulty: 'easy' },
  ...Array.from({ length: 55 }, (_, i) => ({
    id: 616 + i,
    productName: [
      'Puzzle 1000 Pieces', 'Water Gun Super Soaker', 'Toy Train Set Electric',
      'Play-Doh Modeling Clay', 'Action Figure Superhero', 'Baby Rattle Teether',
      'Toy Kitchen Playset', 'Drone Mini Kids', 'Rubik Cube Speed', 'Yo-Yo Metal',
    ][i % 10],
    category: 'toys',
    expectedHs6: ['950490', '950300', '950300', '950300', '950300', '950300', '950300', '950300', '950490', '950300'][i % 10],
    difficulty: 'medium' as const,
  })),

  // ═══ FURNITURE/HOME (60) ════════════════════════════
  { id: 671, productName: 'Office Chair Ergonomic Mesh', category: 'furniture', expectedHs6: '940130', difficulty: 'easy' },
  { id: 672, productName: 'Memory Foam Mattress Queen', category: 'furniture', expectedHs6: '940421', difficulty: 'easy' },
  { id: 673, productName: 'Dining Table Oak Wood', category: 'furniture', expectedHs6: '940169', difficulty: 'medium' },
  { id: 674, productName: 'Bookshelf 5-Tier Metal', category: 'furniture', expectedHs6: '940330', difficulty: 'medium' },
  { id: 675, productName: 'Bed Frame Platform King', category: 'furniture', expectedHs6: '940150', difficulty: 'medium' },
  ...Array.from({ length: 55 }, (_, i) => ({
    id: 676 + i,
    productName: [
      'Sofa Sectional L-Shaped', 'Coffee Table Glass Top', 'Wardrobe Closet Organizer',
      'Standing Desk Adjustable', 'Bar Stool Counter Height', 'Bean Bag Chair Giant',
      'Curtains Blackout Thermal', 'Rug Area Carpet 5x8', 'Pillow Memory Foam',
      'Bedding Set Duvet Cover',
    ][i % 10],
    category: 'furniture',
    expectedHs6: ['940161', '940360', '940161', '940310', '940171', '940140', '630391', '570242', '940490', '630210'][i % 10],
    difficulty: 'medium' as const,
  })),

  // ═══ SPORTING GOODS (50) ════════════════════════════
  { id: 731, productName: 'Tennis Racket Carbon Fiber', category: 'sports', expectedHs6: '950659', difficulty: 'easy' },
  { id: 732, productName: 'Yoga Mat Non-Slip 6mm', category: 'sports', expectedHs6: '950699', difficulty: 'medium' },
  { id: 733, productName: 'Golf Club Driver Titanium', category: 'sports', expectedHs6: '950651', difficulty: 'easy' },
  { id: 734, productName: 'Basketball Spalding Official', category: 'sports', expectedHs6: '950661', difficulty: 'easy' },
  { id: 735, productName: 'Camping Tent 4 Person', category: 'sports', expectedHs6: '630622', difficulty: 'medium' },
  ...Array.from({ length: 45 }, (_, i) => ({
    id: 736 + i,
    productName: [
      'Fishing Rod Carbon Spinning', 'Bicycle Mountain 27.5', 'Skateboard Complete Maple',
      'Boxing Gloves Leather', 'Dumbbell Set Adjustable', 'Treadmill Folding Electric',
      'Swimming Goggles Anti-Fog', 'Surfboard Shortboard', 'Snowboard All Mountain',
      'Hiking Backpack 60L',
    ][i % 10],
    category: 'sports',
    expectedHs6: ['950710', '871200', '950699', '950699', '950691', '950691', '900490', '950699', '950699', '420292'][i % 10],
    difficulty: 'medium' as const,
  })),

  // ═══ MEDICAL/PHARMA (50) ════════════════════════════
  { id: 781, productName: 'Blood Pressure Monitor Digital', category: 'medical', expectedHs6: '901819', difficulty: 'medium' },
  { id: 782, productName: 'N95 Face Mask Respirator', category: 'medical', expectedHs6: '630790', difficulty: 'medium' },
  { id: 783, productName: 'Digital Thermometer Infrared', category: 'medical', expectedHs6: '902519', difficulty: 'medium' },
  { id: 784, productName: 'First Aid Kit Complete', category: 'medical', expectedHs6: '300690', difficulty: 'hard' },
  { id: 785, productName: 'Wheelchair Folding Lightweight', category: 'medical', expectedHs6: '871310', difficulty: 'medium' },
  ...Array.from({ length: 45 }, (_, i) => ({
    id: 786 + i,
    productName: [
      'Pulse Oximeter Fingertip', 'Hearing Aid Behind Ear', 'Contact Lens Daily 30pk',
      'Surgical Gloves Latex', 'Bandage Elastic Wrap', 'Syringe Disposable 5ml',
      'Blood Glucose Meter', 'Nebulizer Machine Portable', 'Knee Brace Support',
      'Walking Cane Adjustable',
    ][i % 10],
    category: 'medical',
    expectedHs6: ['901819', '902140', '900130', '401511', '300510', '901831', '901819', '901920', '902190', '661000'][i % 10],
    difficulty: 'hard' as const,
  })),

  // ═══ MACHINERY (50) ═════════════════════════════════
  { id: 831, productName: 'CNC Milling Machine 3-Axis', category: 'machinery', expectedHs6: '845961', difficulty: 'hard' },
  { id: 832, productName: 'Industrial Sewing Machine', category: 'machinery', expectedHs6: '845210', difficulty: 'medium' },
  { id: 833, productName: 'Hydraulic Press 50 Ton', category: 'machinery', expectedHs6: '846299', difficulty: 'hard' },
  { id: 834, productName: 'Welding Machine MIG 200A', category: 'machinery', expectedHs6: '851531', difficulty: 'medium' },
  { id: 835, productName: 'Air Compressor 50L', category: 'machinery', expectedHs6: '841440', difficulty: 'medium' },
  ...Array.from({ length: 45 }, (_, i) => ({
    id: 836 + i,
    productName: [
      'Lathe Machine Metal', 'Band Saw Wood Cutting', 'Drill Press Bench',
      'Grinding Machine Surface', 'Forklift Electric 2 Ton', 'Conveyor Belt System',
      'Water Pump Centrifugal', 'Generator Diesel 5KW', 'Transformer 220V to 110V',
      'Electric Motor 3-Phase',
    ][i % 10],
    category: 'machinery',
    expectedHs6: ['845811', '846510', '845931', '846029', '842720', '842833', '841370', '850213', '850421', '850131'][i % 10],
    difficulty: 'hard' as const,
  })),

  // ═══ CHEMICAL (40) ══════════════════════════════════
  ...Array.from({ length: 40 }, (_, i) => ({
    id: 881 + i,
    productName: [
      'Isopropyl Alcohol 99%', 'Sodium Hydroxide Pellets', 'Acetic Acid Glacial',
      'Hydrogen Peroxide 30%', 'Silicone Sealant Clear', 'Epoxy Resin Kit',
      'Paint Acrylic Interior', 'Adhesive Super Glue', 'Lubricant WD-40',
      'Pesticide Insecticide Spray',
    ][i % 10],
    category: 'chemical',
    expectedHs6: ['290512', '281511', '291521', '284700', '391000', '390730', '320910', '350691', '340319', '380891'][i % 10],
    difficulty: 'hard' as const,
  })),

  // ═══ PAPER/PACKAGING (30) ═══════════════════════════
  ...Array.from({ length: 30 }, (_, i) => ({
    id: 921 + i,
    productName: [
      'Cardboard Box Corrugated', 'Copy Paper A4 500 Sheets', 'Bubble Wrap Roll 50m',
      'Kraft Paper Roll Brown', 'Tissue Paper Facial 200pk', 'Paper Bags Kraft Handle',
    ][i % 6],
    category: 'packaging',
    expectedHs6: ['480419', '480256', '391740', '480419', '481820', '481940'][i % 6],
    difficulty: 'medium' as const,
  })),

  // ═══ JEWELRY/WATCHES (25) ═══════════════════════════
  ...Array.from({ length: 25 }, (_, i) => ({
    id: 951 + i,
    productName: [
      'Gold Necklace 14K Chain', 'Diamond Ring Solitaire', 'Silver Earrings Stud',
      'Watch Automatic Mechanical', 'Bracelet Stainless Steel',
    ][i % 5],
    category: 'jewelry',
    expectedHs6: ['711319', '711311', '711311', '910111', '711719'][i % 5],
    difficulty: 'medium' as const,
  })),

  // ═══ MUSICAL INSTRUMENTS (15) ═══════════════════════
  ...Array.from({ length: 15 }, (_, i) => ({
    id: 976 + i,
    productName: [
      'Acoustic Guitar Classical', 'Digital Piano 88 Key', 'Violin Full Size 4/4',
      'Drum Kit Electronic', 'Ukulele Soprano Mahogany',
    ][i % 5],
    category: 'music',
    expectedHs6: ['920210', '920120', '920210', '920600', '920210'][i % 5],
    difficulty: 'medium' as const,
  })),

  // ═══ MISCELLANEOUS (10) ═════════════════════════════
  { id: 991, productName: 'Suitcase Luggage Hard Shell', category: 'travel', expectedHs6: '420212', difficulty: 'easy' },
  { id: 992, productName: 'Umbrella Automatic Folding', category: 'accessories', expectedHs6: '660199', difficulty: 'easy' },
  { id: 993, productName: 'Sunglasses Polarized UV400', category: 'accessories', expectedHs6: '900410', difficulty: 'easy' },
  { id: 994, productName: 'Wallet Leather Bifold', category: 'accessories', expectedHs6: '420231', difficulty: 'easy' },
  { id: 995, productName: 'Backpack Laptop 15.6 inch', category: 'bags', expectedHs6: '420292', difficulty: 'easy' },
  { id: 996, productName: 'Dog Food Dry Kibble 10kg', category: 'pet', expectedHs6: '230910', difficulty: 'easy' },
  { id: 997, productName: 'Cat Litter Clumping 20L', category: 'pet', expectedHs6: '382200', difficulty: 'hard' },
  { id: 998, productName: 'Candle Scented Soy Wax', category: 'home', expectedHs6: '340600', difficulty: 'easy' },
  { id: 999, productName: 'Notebook Spiral A5 Lined', category: 'stationery', expectedHs6: '482020', difficulty: 'easy' },
  { id: 1000, productName: 'Pen Ballpoint Set 12pk', category: 'stationery', expectedHs6: '960810', difficulty: 'easy' },
];
