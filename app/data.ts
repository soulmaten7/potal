// app/data.ts

// 1. 메인 카테고리 목록
export const MAIN_CATEGORIES = [
    'Electronics', 'Computers', 'Smart Home', 'Arts & Crafts', 'Automotive', 'Baby', 'Beauty', 'Fashion',
    'Health', 'Home & Kitchen', 'Luggage', 'Sports', 'Toys & Games', 'Video Games',
  ] as const;
  
  // 2. 타입 정의 (page.tsx에서 import해서 씀)
  export type MainCategoryId = (typeof MAIN_CATEGORIES)[number];
  export type MainCategory = MainCategoryId | null;
  
  // 3. 푸터 아코디언 데이터 (4단 그리드용 - 필수!)
  export const FOOTER_ACCORDIONS = [
    { title: "Explore", links: ["Electronics", "Fashion", "Beauty", "Home & Garden", "Sports", "Toys & Hobbies", "Automotive", "Health"] },
    { title: "Company", links: ["About POTAL", "Why POTAL?", "Sustainability", "Media", "Our people", "Accessibility", "Jobs", "Security"] },
    { title: "Partners", links: ["Sell on POTAL", "Affiliate Program", "Logistics Partners", "Advertise with us", "Travel Insight"] },
    { title: "My POTAL", links: ["Track Order", "Price Alerts", "Wishlist", "Past Orders", "Account Settings"] },
    { title: "International Sites", links: ["(US) USA", "(KR) South Korea", "(UK) United Kingdom", "(JP) Japan", "(DE) Germany", "(FR) France", "(CN) China", "(CA) Canada", "(AU) Australia"] }
  ];
  
  // 4. 배송 속도 옵션
  export const SHIPPING_SPEED_OPTIONS = [
    'Express (1-3 days)',
    'Standard (3-7 days)',
    'Economy (7+ days)',
  ] as const;
  
  // 5. 사이트 옵션 (로고 포함)
  export const SITE_OPTIONS = {
    domestic: [
      { name: 'Amazon', icon: 'https://upload.wikimedia.org/wikipedia/commons/4/4a/Amazon_icon.svg', fallbackIcon: '📦' },
      { name: 'Walmart', icon: 'https://upload.wikimedia.org/wikipedia/commons/c/c7/Walmart_Spark.svg', fallbackIcon: '🛒' },
      { name: 'Best Buy', icon: 'https://upload.wikimedia.org/wikipedia/commons/f/f5/Best_Buy_Logo.svg', fallbackIcon: '🏷️' },
      { name: 'Target', icon: 'https://upload.wikimedia.org/wikipedia/commons/c/c5/Target_Corporation_logo_%28vector%29.svg', fallbackIcon: '🎯' },
      { name: 'eBay', icon: 'https://upload.wikimedia.org/wikipedia/commons/1/1b/EBay_logo.svg', fallbackIcon: '🔖' },
      { name: 'Costco', icon: 'https://upload.wikimedia.org/wikipedia/commons/5/59/Costco_Wholesale_logo_2010-10-26.svg', fallbackIcon: '🏬' },
      { name: 'Newegg', icon: '', fallbackIcon: '🥚' },
      { name: 'Home Depot', icon: 'https://upload.wikimedia.org/wikipedia/commons/5/5f/TheHomeDepot.svg', fallbackIcon: '🛠️' },
      { name: 'Wayfair', icon: 'https://upload.wikimedia.org/wikipedia/commons/0/0a/Wayfair_logo.svg', fallbackIcon: '🛋️' },
      { name: 'Macys', icon: 'https://upload.wikimedia.org/wikipedia/commons/a/a2/Macys_logo.svg', fallbackIcon: '🛍️' },
    ],
    international: [
      { name: 'Temu', icon: 'https://upload.wikimedia.org/wikipedia/commons/b/b3/Temu_logo.svg', fallbackIcon: '🪁' },
      { name: 'AliExpress', icon: 'https://upload.wikimedia.org/wikipedia/commons/3/3b/Aliexpress_logo.svg', fallbackIcon: '🏮' },
    ],
  } as const;
  
  // 6. 카테고리 트리 (방대한 데이터)
  export const CATEGORY_TREE = [
    {
      id: 'Electronics', label: 'Electronics', icon: '📱',
      subCategories: [
        { label: 'Cell Phones', details: ['iPhone', 'Samsung Galaxy', 'Google Pixel', 'OnePlus', 'Accessories'] },
        { label: 'Headphones', details: ['Earbuds', 'Over-ear', 'Noise Canceling', 'Gaming', 'Wireless'] },
        { label: 'Camera & Photo', details: ['DSLR Cameras', 'Mirrorless', 'Action Cameras', 'Lenses', 'Tripods'] },
        { label: 'Wearable Tech', details: ['Smartwatches', 'Fitness Trackers', 'VR Headsets', 'Smart Glasses'] },
        { label: 'TV & Home Theater', details: ['4K TVs', 'Soundbars', 'Streaming Devices', 'Projectors'] },
        { label: 'Portable Audio', details: ['Bluetooth Speakers', 'MP3 Players', 'Audio Docks', 'Headphone Amps'] },
      ],
    },
    {
      id: 'Computers', label: 'Computers', icon: '💻',
      subCategories: [
        { label: 'Laptops', details: ['Gaming Laptops', 'Business Laptops', 'Ultrabooks', 'Chromebooks', 'MacBooks'] },
        { label: 'Desktops', details: ['Gaming PCs', 'Workstations', 'All-in-One', 'Mini PCs'] },
        { label: 'Monitors', details: ['4K Monitors', 'Gaming Monitors', 'Ultrawide', 'Curved'] },
        { label: 'PC Components', details: ['Graphics Cards', 'Processors', 'Motherboards', 'RAM', 'Power Supplies'] },
        { label: 'Storage & Memory', details: ['SSD', 'HDD', 'USB Drives', 'Memory Cards'] },
        { label: 'Networking', details: ['Routers', 'Modems', 'Network Adapters', 'Cables'] },
      ],
    },
    {
      id: 'Smart Home', label: 'Smart Home', icon: '🏠',
      subCategories: [
        { label: 'Smart Speakers', details: ['Amazon Echo', 'Google Nest', 'Apple HomePod', 'Sonos'] },
        { label: 'Smart Lighting', details: ['Smart Bulbs', 'Light Strips', 'Smart Switches', 'Dimmers'] },
        { label: 'Security Cameras', details: ['Indoor Cameras', 'Outdoor Cameras', 'Doorbell Cameras', 'Security Systems'] },
        { label: 'Smart Plugs', details: ['WiFi Plugs', 'Energy Monitoring', 'Outdoor Plugs'] },
        { label: 'Thermostats', details: ['Nest Thermostat', 'Ecobee', 'Honeywell', 'Programmable'] },
        { label: 'Smart Locks', details: ['Keyless Entry', 'Smart Deadbolts', 'Keypads'] },
      ],
    },
    {
      id: 'Arts & Crafts', label: 'Arts & Crafts', icon: '🎨',
      subCategories: [
        { label: 'Painting Supplies', details: ['Acrylic Paints', 'Watercolors', 'Oil Paints', 'Brushes', 'Canvases'] },
        { label: 'Drawing Tools', details: ['Pencils', 'Markers', 'Pens', 'Charcoal', 'Pastels'] },
        { label: 'Craft Kits', details: ['DIY Kits', 'Jewelry Making', 'Scrapbooking', 'Origami'] },
        { label: 'Sewing & Fabric', details: ['Fabric', 'Thread', 'Sewing Machines', 'Patterns'] },
        { label: 'Beading & Jewelry', details: ['Beads', 'Jewelry Tools', 'Findings', 'Wire'] },
        { label: 'Kids Crafts', details: ['Craft Sets', 'Model Kits', 'Art Supplies', 'Stickers'] },
      ],
    },
    {
      id: 'Automotive', label: 'Automotive', icon: '🚗',
      subCategories: [
        { label: 'Car Accessories', details: ['Floor Mats', 'Seat Covers', 'Cargo Liners', 'Sun Shades'] },
        { label: 'Tools & Equipment', details: ['Tool Sets', 'Jack Stands', 'Battery Chargers', 'Diagnostic Tools'] },
        { label: 'Motorcycle', details: ['Helmets', 'Gear', 'Parts', 'Accessories'] },
        { label: 'Tires & Wheels', details: ['All-Season Tires', 'Winter Tires', 'Wheel Covers', 'Rims'] },
        { label: 'Oils & Fluids', details: ['Motor Oil', 'Brake Fluid', 'Coolant', 'Transmission Fluid'] },
        { label: 'Car Electronics', details: ['Dash Cams', 'GPS', 'Car Stereos', 'Backup Cameras'] },
      ],
    },
    {
      id: 'Baby', label: 'Baby', icon: '👶',
      subCategories: [
        { label: 'Strollers', details: ['Full-Size', 'Lightweight', 'Jogging', 'Travel Systems'] },
        { label: 'Car Seats', details: ['Infant', 'Convertible', 'Booster', 'All-in-One'] },
        { label: 'Nursery', details: ['Cribs', 'Changing Tables', 'Dressers', 'Rockers'] },
        { label: 'Feeding', details: ['Bottles', 'High Chairs', 'Bibs', 'Utensils'] },
        { label: 'Diapering', details: ['Diapers', 'Wipes', 'Diaper Bags', 'Changing Pads'] },
        { label: 'Baby Care', details: ['Baby Monitors', 'Bath Time', 'Health & Safety', 'Toys'] },
      ],
    },
    {
      id: 'Beauty', label: 'Beauty', icon: '💄',
      subCategories: [
        { label: 'Skincare', details: ['Cleansers', 'Moisturizers', 'Serums', 'Sunscreen', 'Face Masks'] },
        { label: 'Makeup', details: ['Foundation', 'Lipstick', 'Eyeshadow', 'Mascara', 'Concealer'] },
        { label: 'Hair Care', details: ['Shampoo', 'Conditioner', 'Hair Tools', 'Hair Color', 'Styling Products'] },
        { label: 'Fragrance', details: ['Perfume', 'Cologne', 'Body Sprays', 'Gift Sets'] },
        { label: 'Tools & Accessories', details: ['Makeup Brushes', 'Hair Brushes', 'Mirrors', 'Organizers'] },
        { label: 'Men Grooming', details: ['Razors', 'Shaving Cream', 'Beard Care', 'Skincare'] },
      ],
    },
    {
      id: 'Fashion', label: 'Fashion', icon: '👔',
      subCategories: [
        { label: 'Women Clothing', details: ['Dresses', 'Tops', 'Bottoms', 'Outerwear', 'Activewear'] },
        { label: 'Men Clothing', details: ['Shirts', 'Pants', 'Jackets', 'Suits', 'Casual'] },
        { label: 'Shoes', details: ['Sneakers', 'Boots', 'Sandals', 'Heels', 'Flats'] },
        { label: 'Handbags', details: ['Totes', 'Crossbody', 'Backpacks', 'Clutches', 'Wallets'] },
        { label: 'Accessories', details: ['Watches', 'Sunglasses', 'Belts', 'Hats', 'Scarves'] },
        { label: 'Jewelry', details: ['Necklaces', 'Earrings', 'Rings', 'Bracelets', 'Watches'] },
      ],
    },
    {
      id: 'Health', label: 'Health', icon: '🩺',
      subCategories: [
        { label: 'Vitamins', details: ['Multivitamins', 'Vitamin D', 'Vitamin C', 'B-Complex', 'Prenatal'] },
        { label: 'Wellness', details: ['Supplements', 'Herbs', 'Probiotics', 'Omega-3'] },
        { label: 'Fitness Trackers', details: ['Fitness Bands', 'Smartwatches', 'Heart Rate Monitors'] },
        { label: 'Medical Supplies', details: ['First Aid', 'Blood Pressure Monitors', 'Thermometers', 'Masks'] },
        { label: 'Personal Care', details: ['Oral Care', 'Hair Removal', 'Massage Tools', 'Sleep Aids'] },
        { label: 'Supplements', details: ['Protein', 'Pre-Workout', 'Weight Management', 'Joint Support'] },
      ],
    },
    {
      id: 'Home & Kitchen', label: 'Home & Kitchen', icon: '🏡',
      subCategories: [
        { label: 'Kitchen Appliances', details: ['Coffee Makers', 'Blenders', 'Microwaves', 'Air Fryers', 'Mixers'] },
        { label: 'Cookware', details: ['Pots & Pans', 'Bakeware', 'Knives', 'Cutting Boards'] },
        { label: 'Home Décor', details: ['Wall Art', 'Candles', 'Vases', 'Throw Pillows', 'Rugs'] },
        { label: 'Storage & Organization', details: ['Bins', 'Shelving', 'Closet Organizers', 'Drawer Organizers'] },
        { label: 'Bedding', details: ['Sheets', 'Comforters', 'Pillows', 'Mattress Toppers'] },
        { label: 'Furniture', details: ['Chairs', 'Tables', 'Storage', 'Desks'] },
      ],
    },
    {
      id: 'Luggage', label: 'Luggage', icon: '🧳',
      subCategories: [
        { label: 'Suitcases', details: ['Hard Shell', 'Soft Shell', 'Spinner', 'Carry-on Size'] },
        { label: 'Carry-on Luggage', details: ['Rolling', 'Backpack Style', 'Underseat', 'Expandable'] },
        { label: 'Backpacks', details: ['Travel Backpacks', 'Laptop Backpacks', 'Daypacks', 'Hiking'] },
        { label: 'Travel Accessories', details: ['Packing Cubes', 'Travel Adapters', 'Luggage Tags', 'Locks'] },
        { label: 'Duffel Bags', details: ['Gym Bags', 'Weekend Bags', 'Sports Duffels'] },
        { label: 'Laptop Bags', details: ['Messenger Bags', 'Briefcases', 'Sleeves', 'Backpacks'] },
      ],
    },
    {
      id: 'Sports', label: 'Sports', icon: '🏃',
      subCategories: [
        { label: 'Fitness', details: ['Weights', 'Yoga Mats', 'Resistance Bands', 'Exercise Bikes', 'Treadmills'] },
        { label: 'Outdoor Recreation', details: ['Camping Gear', 'Hiking', 'Fishing', 'Hunting'] },
        { label: 'Team Sports', details: ['Basketball', 'Soccer', 'Football', 'Baseball', 'Tennis'] },
        { label: 'Cycling', details: ['Bikes', 'Helmets', 'Accessories', 'Parts'] },
        { label: 'Running', details: ['Running Shoes', 'Apparel', 'Watches', 'Hydration'] },
        { label: 'Winter Sports', details: ['Skiing', 'Snowboarding', 'Ice Skating', 'Sledding'] },
      ],
    },
    {
      id: 'Toys & Games', label: 'Toys & Games', icon: '🧸',
      subCategories: [
        { label: 'Building Sets', details: ['LEGO Star Wars', 'LEGO Technic', 'LEGO City', 'LEGO Ninjago', 'LEGO Friends'] },
        { label: 'Board Games', details: ['Family Games', 'Strategy Games', 'Party Games', 'Card Games'] },
        { label: 'STEM Toys', details: ['Robotics', 'Science Kits', 'Coding Toys', 'Engineering'] },
        { label: 'Action Figures', details: ['Superheroes', 'Star Wars', 'Marvel', 'DC Comics'] },
        { label: 'Dolls & Accessories', details: ['Fashion Dolls', 'Baby Dolls', 'Dollhouses', 'Accessories'] },
        { label: 'Outdoor Play', details: ['Playground Sets', 'Bikes', 'Scooters', 'Water Toys'] },
      ],
    },
    {
      id: 'Video Games', label: 'Video Games', icon: '🎮',
      subCategories: [
        { label: 'PlayStation', details: ['PS5', 'PS4', 'Games', 'Controllers', 'Accessories'] },
        { label: 'Xbox', details: ['Xbox Series X/S', 'Xbox One', 'Games', 'Controllers'] },
        { label: 'Nintendo', details: ['Switch', 'Switch Lite', 'Games', 'Accessories'] },
        { label: 'PC Gaming', details: ['Gaming PCs', 'Components', 'Peripherals', 'Games'] },
        { label: 'Gaming Accessories', details: ['Headsets', 'Keyboards', 'Mice', 'Chairs', 'Monitors'] },
        { label: 'Digital Codes', details: ['Game Codes', 'Gift Cards', 'Subscriptions'] },
      ],
    },
  ];