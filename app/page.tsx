"use client";

import React, { useState, useEffect, useRef } from 'react';

interface ProductVariant {
  site: string;
  price: string;
  link: string;
  shipping: 'Domestic' | 'International';
  trustScore?: number;
}

interface Product {
  id: string;
  name: string;
  price: string;
  image: string;
  site: string;
  shipping: 'Domestic' | 'International';
  deliveryDays?: string;
  link?: string;
  trustScore?: number;
  variants?: ProductVariant[];
  bestPrice?: string;
  bestPriceSite?: string;
}

interface SearchResponse {
  results: Product[];
  total: number;
  metadata?: {
    domesticCount: number;
    internationalCount: number;
  };
}

// Category system - Amazon-style main + sub categories
const MAIN_CATEGORIES = [
  'Electronics',
  'Computers',
  'Smart Home',
  'Arts & Crafts',
  'Automotive',
  'Baby',
  'Beauty',
  'Fashion',
  'Health',
  'Home & Kitchen',
  'Luggage',
  'Sports',
  'Toys & Games',
  'Video Games',
] as const;

type MainCategoryId = (typeof MAIN_CATEGORIES)[number];
type MainCategory = MainCategoryId | null;

const CATEGORY_TREE: {
  id: MainCategoryId;
  label: string;
  icon: string;
  subCategories: {
    label: string;
    details: string[];
  }[];
}[] = [
  {
    id: 'Electronics',
    label: 'Electronics',
    icon: '📱',
    subCategories: [
      {
        label: 'Cell Phones',
        details: ['iPhone', 'Samsung Galaxy', 'Google Pixel', 'OnePlus', 'Accessories'],
      },
      {
        label: 'Headphones',
        details: ['Earbuds', 'Over-ear', 'Noise Canceling', 'Gaming', 'Wireless'],
      },
      {
        label: 'Camera & Photo',
        details: ['DSLR Cameras', 'Mirrorless', 'Action Cameras', 'Lenses', 'Tripods'],
      },
      {
        label: 'Wearable Tech',
        details: ['Smartwatches', 'Fitness Trackers', 'VR Headsets', 'Smart Glasses'],
      },
      {
        label: 'TV & Home Theater',
        details: ['4K TVs', 'Soundbars', 'Streaming Devices', 'Projectors'],
      },
      {
        label: 'Portable Audio',
        details: ['Bluetooth Speakers', 'MP3 Players', 'Audio Docks', 'Headphone Amps'],
      },
    ],
  },
  {
    id: 'Computers',
    label: 'Computers',
    icon: '💻',
    subCategories: [
      {
        label: 'Laptops',
        details: ['Gaming Laptops', 'Business Laptops', 'Ultrabooks', 'Chromebooks', 'MacBooks'],
      },
      {
        label: 'Desktops',
        details: ['Gaming PCs', 'Workstations', 'All-in-One', 'Mini PCs'],
      },
      {
        label: 'Monitors',
        details: ['4K Monitors', 'Gaming Monitors', 'Ultrawide', 'Curved'],
      },
      {
        label: 'PC Components',
        details: ['Graphics Cards', 'Processors', 'Motherboards', 'RAM', 'Power Supplies'],
      },
      {
        label: 'Storage & Memory',
        details: ['SSD', 'HDD', 'USB Drives', 'Memory Cards'],
      },
      {
        label: 'Networking',
        details: ['Routers', 'Modems', 'Network Adapters', 'Cables'],
      },
    ],
  },
  {
    id: 'Smart Home',
    label: 'Smart Home',
    icon: '🏠',
    subCategories: [
      {
        label: 'Smart Speakers',
        details: ['Amazon Echo', 'Google Nest', 'Apple HomePod', 'Sonos'],
      },
      {
        label: 'Smart Lighting',
        details: ['Smart Bulbs', 'Light Strips', 'Smart Switches', 'Dimmers'],
      },
      {
        label: 'Security Cameras',
        details: ['Indoor Cameras', 'Outdoor Cameras', 'Doorbell Cameras', 'Security Systems'],
      },
      {
        label: 'Smart Plugs',
        details: ['WiFi Plugs', 'Energy Monitoring', 'Outdoor Plugs'],
      },
      {
        label: 'Thermostats',
        details: ['Nest Thermostat', 'Ecobee', 'Honeywell', 'Programmable'],
      },
      {
        label: 'Smart Locks',
        details: ['Keyless Entry', 'Smart Deadbolts', 'Keypads'],
      },
    ],
  },
  {
    id: 'Arts & Crafts',
    label: 'Arts & Crafts',
    icon: '🎨',
    subCategories: [
      {
        label: 'Painting Supplies',
        details: ['Acrylic Paints', 'Watercolors', 'Oil Paints', 'Brushes', 'Canvases'],
      },
      {
        label: 'Drawing Tools',
        details: ['Pencils', 'Markers', 'Pens', 'Charcoal', 'Pastels'],
      },
      {
        label: 'Craft Kits',
        details: ['DIY Kits', 'Jewelry Making', 'Scrapbooking', 'Origami'],
      },
      {
        label: 'Sewing & Fabric',
        details: ['Fabric', 'Thread', 'Sewing Machines', 'Patterns'],
      },
      {
        label: 'Beading & Jewelry',
        details: ['Beads', 'Jewelry Tools', 'Findings', 'Wire'],
      },
      {
        label: 'Kids Crafts',
        details: ['Craft Sets', 'Model Kits', 'Art Supplies', 'Stickers'],
      },
    ],
  },
  {
    id: 'Automotive',
    label: 'Automotive',
    icon: '🚗',
    subCategories: [
      {
        label: 'Car Accessories',
        details: ['Floor Mats', 'Seat Covers', 'Cargo Liners', 'Sun Shades'],
      },
      {
        label: 'Tools & Equipment',
        details: ['Tool Sets', 'Jack Stands', 'Battery Chargers', 'Diagnostic Tools'],
      },
      {
        label: 'Motorcycle',
        details: ['Helmets', 'Gear', 'Parts', 'Accessories'],
      },
      {
        label: 'Tires & Wheels',
        details: ['All-Season Tires', 'Winter Tires', 'Wheel Covers', 'Rims'],
      },
      {
        label: 'Oils & Fluids',
        details: ['Motor Oil', 'Brake Fluid', 'Coolant', 'Transmission Fluid'],
      },
      {
        label: 'Car Electronics',
        details: ['Dash Cams', 'GPS', 'Car Stereos', 'Backup Cameras'],
      },
    ],
  },
  {
    id: 'Baby',
    label: 'Baby',
    icon: '👶',
    subCategories: [
      {
        label: 'Strollers',
        details: ['Full-Size', 'Lightweight', 'Jogging', 'Travel Systems'],
      },
      {
        label: 'Car Seats',
        details: ['Infant', 'Convertible', 'Booster', 'All-in-One'],
      },
      {
        label: 'Nursery',
        details: ['Cribs', 'Changing Tables', 'Dressers', 'Rockers'],
      },
      {
        label: 'Feeding',
        details: ['Bottles', 'High Chairs', 'Bibs', 'Utensils'],
      },
      {
        label: 'Diapering',
        details: ['Diapers', 'Wipes', 'Diaper Bags', 'Changing Pads'],
      },
      {
        label: 'Baby Care',
        details: ['Baby Monitors', 'Bath Time', 'Health & Safety', 'Toys'],
      },
    ],
  },
  {
    id: 'Beauty',
    label: 'Beauty',
    icon: '💄',
    subCategories: [
      {
        label: 'Skincare',
        details: ['Cleansers', 'Moisturizers', 'Serums', 'Sunscreen', 'Face Masks'],
      },
      {
        label: 'Makeup',
        details: ['Foundation', 'Lipstick', 'Eyeshadow', 'Mascara', 'Concealer'],
      },
      {
        label: 'Hair Care',
        details: ['Shampoo', 'Conditioner', 'Hair Tools', 'Hair Color', 'Styling Products'],
      },
      {
        label: 'Fragrance',
        details: ['Perfume', 'Cologne', 'Body Sprays', 'Gift Sets'],
      },
      {
        label: 'Tools & Accessories',
        details: ['Makeup Brushes', 'Hair Brushes', 'Mirrors', 'Organizers'],
      },
      {
        label: 'Men Grooming',
        details: ['Razors', 'Shaving Cream', 'Beard Care', 'Skincare'],
      },
    ],
  },
  {
    id: 'Fashion',
    label: 'Fashion',
    icon: '👔',
    subCategories: [
      {
        label: 'Women Clothing',
        details: ['Dresses', 'Tops', 'Bottoms', 'Outerwear', 'Activewear'],
      },
      {
        label: 'Men Clothing',
        details: ['Shirts', 'Pants', 'Jackets', 'Suits', 'Casual'],
      },
      {
        label: 'Shoes',
        details: ['Sneakers', 'Boots', 'Sandals', 'Heels', 'Flats'],
      },
      {
        label: 'Handbags',
        details: ['Totes', 'Crossbody', 'Backpacks', 'Clutches', 'Wallets'],
      },
      {
        label: 'Accessories',
        details: ['Watches', 'Sunglasses', 'Belts', 'Hats', 'Scarves'],
      },
      {
        label: 'Jewelry',
        details: ['Necklaces', 'Earrings', 'Rings', 'Bracelets', 'Watches'],
      },
    ],
  },
  {
    id: 'Health',
    label: 'Health',
    icon: '🩺',
    subCategories: [
      {
        label: 'Vitamins',
        details: ['Multivitamins', 'Vitamin D', 'Vitamin C', 'B-Complex', 'Prenatal'],
      },
      {
        label: 'Wellness',
        details: ['Supplements', 'Herbs', 'Probiotics', 'Omega-3'],
      },
      {
        label: 'Fitness Trackers',
        details: ['Fitness Bands', 'Smartwatches', 'Heart Rate Monitors'],
      },
      {
        label: 'Medical Supplies',
        details: ['First Aid', 'Blood Pressure Monitors', 'Thermometers', 'Masks'],
      },
      {
        label: 'Personal Care',
        details: ['Oral Care', 'Hair Removal', 'Massage Tools', 'Sleep Aids'],
      },
      {
        label: 'Supplements',
        details: ['Protein', 'Pre-Workout', 'Weight Management', 'Joint Support'],
      },
    ],
  },
  {
    id: 'Home & Kitchen',
    label: 'Home & Kitchen',
    icon: '🏡',
    subCategories: [
      {
        label: 'Kitchen Appliances',
        details: ['Coffee Makers', 'Blenders', 'Microwaves', 'Air Fryers', 'Mixers'],
      },
      {
        label: 'Cookware',
        details: ['Pots & Pans', 'Bakeware', 'Knives', 'Cutting Boards'],
      },
      {
        label: 'Home Décor',
        details: ['Wall Art', 'Candles', 'Vases', 'Throw Pillows', 'Rugs'],
      },
      {
        label: 'Storage & Organization',
        details: ['Bins', 'Shelving', 'Closet Organizers', 'Drawer Organizers'],
      },
      {
        label: 'Bedding',
        details: ['Sheets', 'Comforters', 'Pillows', 'Mattress Toppers'],
      },
      {
        label: 'Furniture',
        details: ['Chairs', 'Tables', 'Storage', 'Desks'],
      },
    ],
  },
  {
    id: 'Luggage',
    label: 'Luggage',
    icon: '🧳',
    subCategories: [
      {
        label: 'Suitcases',
        details: ['Hard Shell', 'Soft Shell', 'Spinner', 'Carry-on Size'],
      },
      {
        label: 'Carry-on Luggage',
        details: ['Rolling', 'Backpack Style', 'Underseat', 'Expandable'],
      },
      {
        label: 'Backpacks',
        details: ['Travel Backpacks', 'Laptop Backpacks', 'Daypacks', 'Hiking'],
      },
      {
        label: 'Travel Accessories',
        details: ['Packing Cubes', 'Travel Adapters', 'Luggage Tags', 'Locks'],
      },
      {
        label: 'Duffel Bags',
        details: ['Gym Bags', 'Weekend Bags', 'Sports Duffels'],
      },
      {
        label: 'Laptop Bags',
        details: ['Messenger Bags', 'Briefcases', 'Sleeves', 'Backpacks'],
      },
    ],
  },
  {
    id: 'Sports',
    label: 'Sports',
    icon: '🏃',
    subCategories: [
      {
        label: 'Fitness',
        details: ['Weights', 'Yoga Mats', 'Resistance Bands', 'Exercise Bikes', 'Treadmills'],
      },
      {
        label: 'Outdoor Recreation',
        details: ['Camping Gear', 'Hiking', 'Fishing', 'Hunting'],
      },
      {
        label: 'Team Sports',
        details: ['Basketball', 'Soccer', 'Football', 'Baseball', 'Tennis'],
      },
      {
        label: 'Cycling',
        details: ['Bikes', 'Helmets', 'Accessories', 'Parts'],
      },
      {
        label: 'Running',
        details: ['Running Shoes', 'Apparel', 'Watches', 'Hydration'],
      },
      {
        label: 'Winter Sports',
        details: ['Skiing', 'Snowboarding', 'Ice Skating', 'Sledding'],
      },
    ],
  },
  {
    id: 'Toys & Games',
    label: 'Toys & Games',
    icon: '🧸',
    subCategories: [
      {
        label: 'Building Sets',
        details: ['LEGO Star Wars', 'LEGO Technic', 'LEGO City', 'LEGO Ninjago', 'LEGO Friends'],
      },
      {
        label: 'Board Games',
        details: ['Family Games', 'Strategy Games', 'Party Games', 'Card Games'],
      },
      {
        label: 'STEM Toys',
        details: ['Robotics', 'Science Kits', 'Coding Toys', 'Engineering'],
      },
      {
        label: 'Action Figures',
        details: ['Superheroes', 'Star Wars', 'Marvel', 'DC Comics'],
      },
      {
        label: 'Dolls & Accessories',
        details: ['Fashion Dolls', 'Baby Dolls', 'Dollhouses', 'Accessories'],
      },
      {
        label: 'Outdoor Play',
        details: ['Playground Sets', 'Bikes', 'Scooters', 'Water Toys'],
      },
    ],
  },
  {
    id: 'Video Games',
    label: 'Video Games',
    icon: '🎮',
    subCategories: [
      {
        label: 'PlayStation',
        details: ['PS5', 'PS4', 'Games', 'Controllers', 'Accessories'],
      },
      {
        label: 'Xbox',
        details: ['Xbox Series X/S', 'Xbox One', 'Games', 'Controllers'],
      },
      {
        label: 'Nintendo',
        details: ['Switch', 'Switch Lite', 'Games', 'Accessories'],
      },
      {
        label: 'PC Gaming',
        details: ['Gaming PCs', 'Components', 'Peripherals', 'Games'],
      },
      {
        label: 'Gaming Accessories',
        details: ['Headsets', 'Keyboards', 'Mice', 'Chairs', 'Monitors'],
      },
      {
        label: 'Digital Codes',
        details: ['Game Codes', 'Gift Cards', 'Subscriptions'],
      },
    ],
  },
];

// Site options used across filters (with stable logo URLs + emoji fallback)
const SITE_OPTIONS = {
  domestic: [
    {
      name: 'Amazon',
      icon: 'https://upload.wikimedia.org/wikipedia/commons/4/4a/Amazon_icon.svg',
      fallbackIcon: '📦',
    },
    {
      name: 'Walmart',
      icon: 'https://upload.wikimedia.org/wikipedia/commons/c/c7/Walmart_Spark.svg',
      fallbackIcon: '🛒',
    },
    {
      name: 'Best Buy',
      icon: 'https://upload.wikimedia.org/wikipedia/commons/f/f5/Best_Buy_Logo.svg',
      fallbackIcon: '🏷️',
    },
    {
      name: 'Target',
      icon:
        'https://upload.wikimedia.org/wikipedia/commons/c/c5/Target_Corporation_logo_%28vector%29.svg',
      fallbackIcon: '🎯',
    },
    {
      name: 'eBay',
      icon: 'https://upload.wikimedia.org/wikipedia/commons/1/1b/EBay_logo.svg',
      fallbackIcon: '🔖',
    },
    {
      name: 'Costco',
      icon:
        'https://upload.wikimedia.org/wikipedia/commons/5/59/Costco_Wholesale_logo_2010-10-26.svg',
      fallbackIcon: '🏬',
    },
    {
      name: 'Newegg',
      icon: '',
      fallbackIcon: '🥚',
    },
    {
      name: 'Home Depot',
      icon: 'https://upload.wikimedia.org/wikipedia/commons/5/5f/TheHomeDepot.svg',
      fallbackIcon: '🛠️',
    },
    {
      name: 'Wayfair',
      icon: 'https://upload.wikimedia.org/wikipedia/commons/0/0a/Wayfair_logo.svg',
      fallbackIcon: '🛋️',
    },
    {
      name: 'Macys',
      icon: 'https://upload.wikimedia.org/wikipedia/commons/a/a2/Macys_logo.svg',
      fallbackIcon: '🛍️',
    },
  ],
  international: [
    {
      name: 'Temu',
      icon: 'https://upload.wikimedia.org/wikipedia/commons/b/b3/Temu_logo.svg',
      fallbackIcon: '🪁',
    },
    {
      name: 'AliExpress',
      icon: 'https://upload.wikimedia.org/wikipedia/commons/3/3b/Aliexpress_logo.svg',
      fallbackIcon: '🏮',
    },
  ],
} as const;

const SHIPPING_SPEED_OPTIONS = [
  'Express (1-3 days)',
  'Standard (3-7 days)',
  'Economy (7+ days)',
] as const;

export default function Home() {
  const [query, setQuery] = useState('');
  const [mainCategory, setMainCategory] = useState<MainCategory>(null);
  const [subCategory, setSubCategory] = useState<string | null>(null);
  const [megaMenuOpen, setMegaMenuOpen] = useState(false);
  const [activeMain, setActiveMain] = useState<MainCategoryId | null>(null);
  const [activeSub, setActiveSub] = useState<string | null>(null);
  const [directOnly, setDirectOnly] = useState(false);
  const [usedOnly, setUsedOnly] = useState(false);
  const [domestic, setDomestic] = useState<Product[]>([]);
  const [international, setInternational] = useState<Product[]>([]);
  const [loading, setLoading] = useState(false);
  const [searched, setSearched] = useState(false);
  const [metadata, setMetadata] = useState<{ domesticCount: number; internationalCount: number } | null>(null);
  const [recentSearches, setRecentSearches] = useState<string[]>([]);
  const [showRecentDropdown, setShowRecentDropdown] = useState(false);
  const [recentSearchesEnabled, setRecentSearchesEnabled] = useState(true);
  // Committed filter state (applied to list)
  const [priceRange, setPriceRange] = useState(1000); // 0 ~ 1000 (1000+)
  const [selectedSites, setSelectedSites] = useState<string[]>([]);
  const [selectedSpeeds, setSelectedSpeeds] = useState<string[]>([]);
  const [sortBy, setSortBy] = useState<'relevance' | 'price_asc' | 'price_desc'>('relevance');
  // Temporary filter state (edited via UI before applying)
  const [tempPriceRange, setTempPriceRange] = useState(1000);
  const [tempSelectedSites, setTempSelectedSites] = useState<string[]>([]);
  const [tempSelectedSpeeds, setTempSelectedSpeeds] = useState<string[]>([]);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [mobileActiveMain, setMobileActiveMain] = useState<MainCategoryId | null>(null);
  const searchInputRef = useRef<HTMLInputElement>(null);
  const recentDropdownRef = useRef<HTMLDivElement>(null);
  
  // Display count for "Show more" functionality
  const [domesticDisplayCount, setDomesticDisplayCount] = useState(10);
  const [internationalDisplayCount, setInternationalDisplayCount] = useState(10);

  // Load recent searches and enabled state from localStorage on mount
  useEffect(() => {
    const stored = localStorage.getItem('potal_recent_searches');
    if (stored) {
      try {
        setRecentSearches(JSON.parse(stored));
      } catch (e) {
        console.error('Failed to parse recent searches:', e);
      }
    }

    const enabled = localStorage.getItem('potal_recent_searches_enabled');
    if (enabled !== null) {
      setRecentSearchesEnabled(JSON.parse(enabled));
    }
  }, []);

  // Keep temp filter state in sync with committed state (e.g. after reset)
  useEffect(() => {
    setTempPriceRange(priceRange);
    setTempSelectedSites(selectedSites);
    setTempSelectedSpeeds(selectedSpeeds);
  }, [priceRange, selectedSites, selectedSpeeds]);

  // Save search query to recent searches
  const saveToRecentSearches = (searchQuery: string) => {
    if (!searchQuery.trim()) return;
    
    setRecentSearches((prev) => {
      // Remove duplicates and add to front
      const filtered = prev.filter((item) => item.toLowerCase() !== searchQuery.toLowerCase());
      const updated = [searchQuery, ...filtered].slice(0, 10); // Max 10 items
      localStorage.setItem('potal_recent_searches', JSON.stringify(updated));
      return updated;
    });
  };

  // Clear all recent searches
  const clearRecentSearches = () => {
    setRecentSearches([]);
    localStorage.removeItem('potal_recent_searches');
  };

  // Turn off recent searches feature
  const turnOffRecentSearches = () => {
    setRecentSearchesEnabled(false);
    localStorage.setItem('potal_recent_searches_enabled', JSON.stringify(false));
    // Keep dropdown open to show "Turn on" option
  };

  // Turn on recent searches feature
  const turnOnRecentSearches = () => {
    setRecentSearchesEnabled(true);
    localStorage.setItem('potal_recent_searches_enabled', JSON.stringify(true));
    // Dropdown will automatically show list if there are recent searches
  };

  // Handle click outside to close dropdown
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        recentDropdownRef.current &&
        !recentDropdownRef.current.contains(event.target as Node) &&
        searchInputRef.current &&
        !searchInputRef.current.contains(event.target as Node)
      ) {
        setShowRecentDropdown(false);
      }
    };

    if (showRecentDropdown) {
      document.addEventListener('mousedown', handleClickOutside);
      return () => {
        document.removeEventListener('mousedown', handleClickOutside);
      };
    }
  }, [showRecentDropdown]);

  // Extracted search execution logic - can be called from anywhere
  const executeSearch = async (
    searchQuery: string,
    mainCat: MainCategory | null,
    subCat: string | null,
  ) => {
    if (!searchQuery.trim()) return;

    // Save to recent searches
    saveToRecentSearches(searchQuery);
    setShowRecentDropdown(false);

    setLoading(true);
    setSearched(true);
    setDomestic([]);
    setInternational([]);
    setDomesticDisplayCount(10);
    setInternationalDisplayCount(10);

    try {
      const res = await fetch('/api/search', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          query: searchQuery,
          page: 1,
          mainCategory: mainCat,
          subCategory: subCat,
        }),
      });

      const data: SearchResponse = await res.json();
      const allResults = data.results || [];
      
      // 1. Filtering logic (domestic vs. international)
      //    Search all relevant fields for 'domestic' / 'international' strings (case-insensitive)
      const domesticResults = allResults.filter((p: any) => {
        const val = (p.shipping || (p as any).category || '').toString().toLowerCase();
        return val.includes('domestic');
      });

      const internationalResults = allResults.filter((p: any) => {
        const val = (p.shipping || (p as any).category || '').toString().toLowerCase();
        return val.includes('international');
      });
      
      console.log('📊 Results:', {
        total: allResults.length,
        domestic: domesticResults.length,
        international: internationalResults.length,
        internationalDetails: {
          total: internationalResults.length,
          allIds: internationalResults.map(p => p.id),
          sample: internationalResults.slice(0, 10).map(p => ({
            id: p.id,
            name: p.name.substring(0, 40),
            shipping: p.shipping,
            category: (p as any).category
          }))
        }
      });
      
      // Set results and reset display counts simultaneously - EXACT SAME LOGIC FOR BOTH
      setDomestic(domesticResults);
      setInternational(internationalResults);
      setDomesticDisplayCount(10);
      setInternationalDisplayCount(10);
      setMetadata(data.metadata || null);
      
      console.log('✅ State Updated:', {
        domesticCount: domesticResults.length,
        internationalCount: internationalResults.length,
        domesticDisplayCount: 10,
        internationalDisplayCount: 10
      });
    } catch (err) {
      console.error('Search failed:', err);
      setDomestic([]);
      setInternational([]);
      setMetadata(null);
    } finally {
      setLoading(false);
    }
  };

  const handleSearch = async (e: React.FormEvent) => {
    e.preventDefault();
    await executeSearch(query, mainCategory, subCategory);
  };

  // --- Filtering helpers for sidebar filters ---

  const parsePrice = (price: string | number | undefined): number | null => {
    if (typeof price === 'number') return price;
    if (!price) return null;
    const numeric = parseFloat(String(price).replace(/[^0-9.]/g, ''));
    return Number.isNaN(numeric) ? null : numeric;
  };

  const classifySpeed = (deliveryDays?: string | null): string | null => {
    if (!deliveryDays) return null;
    const text = deliveryDays.toLowerCase();
    const match = text.match(/(\d+)\s*-\s*(\d+)/);
    if (match) {
      const min = parseInt(match[1], 10);
      const max = parseInt(match[2], 10);
      const avg = (min + max) / 2;
      if (avg <= 3) return 'Express (1-3 days)';
      if (avg <= 7) return 'Standard (3-7 days)';
      return 'Economy (7+ days)';
    }
    if (text.includes('1-3')) return 'Express (1-3 days)';
    if (text.includes('3-7')) return 'Standard (3-7 days)';
    if (text.includes('7')) return 'Economy (7+ days)';
    return null;
  };

  const applyFilters = (products: Product[]): Product[] =>
    products.filter((p) => {
      // Price filter (only when slider below max sentinel)
      const numericPrice = parsePrice(p.price);
      if (priceRange < 1000 && numericPrice !== null && numericPrice > priceRange) {
        return false;
      }

      // Site filter
      if (selectedSites.length > 0 && !selectedSites.includes(p.site)) {
        return false;
      }

      // Shipping speed filter
      if (selectedSpeeds.length > 0) {
        const speedLabel = classifySpeed(p.deliveryDays);
        if (!speedLabel || !selectedSpeeds.includes(speedLabel)) {
          return false;
        }
      }

      return true;
    });

  const areStringArraysEqual = (a: string[], b: string[]) => {
    if (a.length !== b.length) return false;
    const sa = [...a].sort();
    const sb = [...b].sort();
    return sa.every((v, i) => v === sb[i]);
  };

  // Reset to home screen - clears all state
  const resetToHome = () => {
    setQuery('');
    setSearched(false);
    setDomestic([]);
    setInternational([]);
    setMainCategory(null);
    setSubCategory(null);
    setDirectOnly(false);
    setUsedOnly(false);
    setMegaMenuOpen(false);
    setActiveMain(null);
    setActiveSub(null);
    // Reset filter state
    setPriceRange(1000);
    setSelectedSites([]);
    setSelectedSpeeds([]);
    setTempPriceRange(1000);
    setTempSelectedSites([]);
    setTempSelectedSpeeds([]);
    setDomesticDisplayCount(10);
    setInternationalDisplayCount(10);
    setMetadata(null);
    setLoading(false);
    setShowRecentDropdown(false);
  };

  const showMoreDomestic = () => {
    setDomesticDisplayCount(prev => prev + 10);
  };

  const showMoreInternational = () => {
    setInternationalDisplayCount(prev => prev + 10);
  };

  // Reset display count when results change - ensure both update simultaneously
  useEffect(() => {
    if (domestic.length > 0) {
      setDomesticDisplayCount(10);
      console.log('🔄 Domestic display count reset to 10, total items:', domestic.length);
    }
  }, [domestic.length]);

  useEffect(() => {
    if (international.length > 0) {
      setInternationalDisplayCount(10);
      console.log('🔄 International display count reset to 10, total items:', international.length);
    }
  }, [international.length]);

  // Apply sidebar filters to original results
  const filteredDomestic = applyFilters(domestic);
  const filteredInternational = applyFilters(international);

  // Get displayed products (first N items) based on filtered lists
  const sortProducts = (products: Product[]): Product[] => {
    const arr = [...products];
    if (sortBy === 'price_asc' || sortBy === 'price_desc') {
      arr.sort((a, b) => {
        const pa = parsePrice(a.price) ?? Number.POSITIVE_INFINITY;
        const pb = parsePrice(b.price) ?? Number.POSITIVE_INFINITY;
        if (pa === pb) return 0;
        return sortBy === 'price_asc' ? pa - pb : pb - pa;
      });
    }
    // 'relevance'일 때는 원래 순서 유지 (백엔드 정렬에 따름)
    return arr;
  };

  const sortedDomestic = Array.isArray(filteredDomestic) ? sortProducts(filteredDomestic) : [];
  const sortedInternational = Array.isArray(filteredInternational)
    ? sortProducts(filteredInternational)
    : [];

  const displayedDomestic = sortedDomestic.slice(0, domesticDisplayCount);
  const displayedInternational = sortedInternational.slice(0, internationalDisplayCount);
  
  // Check if there are more products to show - identical logic for both sections
  const hasMoreDomestic =
    Array.isArray(filteredDomestic) && filteredDomestic.length > domesticDisplayCount;
  const hasMoreInternational =
    Array.isArray(filteredInternational) && filteredInternational.length > internationalDisplayCount;

  // Debug logs - EXACT SAME STRUCTURE FOR BOTH
  if (searched && !loading) {
    console.log('🔍 Display State:', {
      domestic: { 
        total: domestic.length, 
        displayed: displayedDomestic.length, 
        displayCount: domesticDisplayCount,
        hasMore: hasMoreDomestic,
        condition: `${domestic.length} > ${domesticDisplayCount}`,
        displayedIds: displayedDomestic.map(p => p.id)
      },
      international: { 
        total: international.length, 
        displayed: displayedInternational.length, 
        displayCount: internationalDisplayCount,
        hasMore: hasMoreInternational,
        condition: `${international.length} > ${internationalDisplayCount}`,
        displayedIds: displayedInternational.map(p => p.id),
        allIds: international.map(p => p.id)
      },
    });
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="border-b bg-white sticky top-0 z-50 shadow-sm">
        <div className="max-w-7xl mx-auto px-4 py-4">
          <button
            type="button"
            onClick={resetToHome}
            className="cursor-pointer hover:opacity-80 transition-opacity"
          >
            <h1 className="text-3xl font-black text-indigo-900 tracking-tight">POTAL</h1>
          </button>
          <p className="text-sm text-black mt-1">Compare US Fast Delivery vs Global Best Price</p>
        </div>
      </header>

      {/* Main Content */}
      <main className="w-full max-w-[1600px] mx-auto px-8 py-8">
        <div className="bg-white rounded-2xl shadow-lg px-6 py-6">
          {/* Big Centered Search Input */}
          <div className="relative max-w-3xl mx-auto mb-3">
            <form onSubmit={handleSearch} className="relative">
              <input
                ref={searchInputRef}
                type="text"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                onFocus={() => {
                  // Always show dropdown when focused, regardless of enabled state
                  // If enabled and has searches: show list
                  // If disabled: show "Turn on" message
                  setShowRecentDropdown(true);
                }}
                placeholder="Search for products (e.g., LEGO, AirPods, Headphones)..."
                className="w-full px-6 py-5 pl-16 pr-36 text-lg border-2 border-gray-200 rounded-full focus:ring-4 focus:ring-indigo-500/20 focus:border-indigo-500 outline-none transition-all shadow-sm bg-gray-50 text-black placeholder:text-gray-600"
                autoFocus
              />
              <svg
                className="absolute left-6 top-1/2 transform -translate-y-1/2 text-black w-6 h-6"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
                />
              </svg>
              <button
                type="submit"
                disabled={loading || !query.trim()}
                className="absolute right-3 top-1/2 transform -translate-y-1/2 px-8 py-3 bg-indigo-600 text-white rounded-full font-semibold hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                {loading ? 'Searching...' : 'Search'}
              </button>
            </form>

            {/* Recent Searches Dropdown */}
            {showRecentDropdown && (
              <div
                ref={recentDropdownRef}
                className="absolute left-0 right-0 top-full mt-2 z-[100] bg-white rounded-lg shadow-lg border border-gray-200 overflow-hidden"
              >
                {recentSearchesEnabled && recentSearches.length > 0 ? (
                  // On 상태: 최근 검색어 목록 표시
                  <>
                    <div className="px-4 py-2 border-b border-gray-200 bg-gray-50">
                      <span className="text-xs font-semibold text-black">Recent Searches</span>
                    </div>
                    <div className="max-h-64 overflow-y-auto">
                      {recentSearches.map((search, idx) => (
                        <button
                          key={idx}
                          type="button"
                          onClick={async () => {
                            setQuery(search);
                            await executeSearch(search, mainCategory, subCategory);
                          }}
                          className="w-full text-left px-4 py-3 text-sm text-black hover:bg-indigo-50 hover:text-indigo-700 transition-colors border-b border-gray-100 last:border-b-0"
                        >
                          {search}
                        </button>
                      ))}
                    </div>
                    <div className="px-4 py-2 border-t border-gray-200 bg-gray-50 flex items-center justify-between">
                      <button
                        type="button"
                        onClick={clearRecentSearches}
                        className="text-xs text-gray-600 hover:text-black transition-colors"
                      >
                        Clear All
                      </button>
                      <button
                        type="button"
                        onClick={turnOffRecentSearches}
                        className="text-xs text-gray-500 hover:text-gray-700 transition-colors"
                      >
                        Turn off
                      </button>
                    </div>
                  </>
                ) : (
                  // Off 상태: 안내 메시지 + Turn on 버튼 (컴팩트 가로 레이아웃)
                  <div className="px-4 py-3 flex items-center justify-between">
                    <p className="text-xs text-gray-500">Recent searches are turned off.</p>
                    <button
                      type="button"
                      onClick={turnOnRecentSearches}
                      className="text-sm text-indigo-600 hover:text-indigo-700 font-medium transition-colors"
                    >
                      Turn on
                    </button>
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Popular tags (home screen emphasis) */}
          {!searched && (
            <div className="max-w-3xl mx-auto mb-3 flex flex-wrap items-center gap-2 text-xs text-black">
              <span className="mr-1">Popular:</span>
              {['Lego', 'AirPods', 'iPhone'].map((tag) => (
                <button
                  key={tag}
                  type="button"
                  className="px-2.5 py-1 rounded-full bg-gray-100 text-gray-800 hover:bg-gray-200 transition-colors"
                  onClick={() => setQuery(tag)}
                >
                  {tag}
                </button>
              ))}
            </div>
          )}

          {/* Category Button - Coupang style */}
          <div
            className="relative max-w-3xl mx-auto mb-3"
            onMouseLeave={() => {
              setMegaMenuOpen(false);
              setActiveMain(null);
              setActiveSub(null);
            }}
          >
            {/* Mobile trigger */}
            <button
              type="button"
              onClick={() => setMobileMenuOpen(true)}
              className="w-full flex lg:hidden items-center gap-2 px-4 py-3 rounded-lg border border-gray-300 bg-white text-sm font-semibold text-black hover:bg-gray-50 transition-colors"
            >
              <span className="text-lg">☰</span>
              <span>All Categories</span>
            </button>

            {/* Desktop trigger */}
            <button
              type="button"
              onClick={() => setMegaMenuOpen(!megaMenuOpen)}
              className="hidden lg:flex w-full items-center gap-2 px-4 py-3 rounded-lg border border-gray-300 bg-white text-sm font-semibold text-black hover:bg-gray-50 transition-colors"
            >
              <span className="text-lg">☰</span>
              <span>All Categories</span>
            </button>

            {/* 3-Tier Vertical Panorama Menu (Desktop only) */}
            {megaMenuOpen && (
              <div
                className="hidden lg:block absolute left-0 top-full pt-1 z-[100]"
                onMouseEnter={() => setMegaMenuOpen(true)}
                style={{ width: '800px' }}
              >
                <div className="bg-white border border-gray-200 shadow-2xl rounded-lg overflow-hidden">
                  <div className="flex" style={{ minHeight: '500px' }}>
                    {/* 1단: Main Categories (Left) */}
                    <div className="w-48 border-r border-gray-200 bg-gray-50 overflow-y-auto">
                      {CATEGORY_TREE.map((cat) => {
                        const isActive = activeMain === cat.id;
                        return (
                          <button
                            key={cat.id}
                            type="button"
                            onMouseEnter={() => {
                              setActiveMain(cat.id);
                              setActiveSub(null);
                            }}
                            onClick={() => {
                              setMainCategory(cat.id);
                              setSubCategory(null);
                              setMegaMenuOpen(false);
                            }}
                            className={`w-full text-left px-4 py-3 text-sm text-black border-b border-gray-200 transition-colors ${
                              isActive
                                ? 'bg-white border-l-4 border-l-indigo-600 font-semibold'
                                : 'hover:bg-white'
                            }`}
                          >
                            <span className="mr-2">{cat.icon}</span>
                            {cat.label}
                          </button>
                        );
                      })}
                    </div>

                    {/* 2단: Sub Categories (Middle) */}
                    {activeMain && (
                      <div className="w-56 border-r border-gray-200 bg-white overflow-y-auto">
                        {CATEGORY_TREE.find((c) => c.id === activeMain)?.subCategories.map(
                          (sub, idx) => {
                            const isActive = activeSub === sub.label;
                            return (
                              <button
                                key={idx}
                                type="button"
                                onMouseEnter={() => setActiveSub(sub.label)}
                                onClick={() => {
                                  setMainCategory(activeMain);
                                  setSubCategory(sub.label);
                                  setMegaMenuOpen(false);
                                }}
                                className={`w-full text-left px-4 py-3 text-sm text-black border-b border-gray-100 transition-colors ${
                                  isActive
                                    ? 'bg-indigo-50 font-semibold border-l-4 border-l-indigo-500'
                                    : 'hover:bg-gray-50'
                                }`}
                              >
                                {sub.label}
                              </button>
                            );
                          },
                        )}
                      </div>
                    )}

                    {/* 3단: Details (Right) */}
                    {activeMain && activeSub && (
                      <div className="flex-1 bg-white p-4 overflow-y-auto">
                        <div className="grid grid-cols-2 gap-2">
                          {CATEGORY_TREE.find((c) => c.id === activeMain)
                            ?.subCategories.find((s) => s.label === activeSub)
                            ?.details.map((detail, idx) => (
                              <button
                                key={idx}
                                type="button"
                                onClick={async () => {
                                  setQuery(detail);
                                  setMainCategory(activeMain);
                                  setSubCategory(activeSub);
                                  setMegaMenuOpen(false);
                                  await executeSearch(detail, activeMain, activeSub);
                                }}
                                className="text-left px-3 py-2 text-xs text-black rounded-md hover:bg-indigo-50 hover:font-semibold transition-colors"
                              >
                                {detail}
                              </button>
                            ))}
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Mobile Category Drawer */}
          {mobileMenuOpen && (
            <div className="fixed inset-0 z-[120] bg-black/40 flex lg:hidden">
              {/* Slide-in panel */}
              <div className="w-3/4 max-w-xs bg-white h-full shadow-xl transform transition-transform duration-200 ease-out translate-x-0">
                <div className="flex items-center justify-between px-4 py-3 border-b border-gray-200">
                  <span className="text-sm font-semibold text-black">Categories</span>
                  <button
                    type="button"
                    onClick={() => setMobileMenuOpen(false)}
                    className="text-sm text-gray-500 hover:text-black"
                  >
                    ✕
                  </button>
                </div>
                <div className="h-full overflow-y-auto px-2 py-2 space-y-1">
                  {CATEGORY_TREE.map((cat) => {
                    const isOpen = mobileActiveMain === cat.id;
                    return (
                      <div key={cat.id} className="border-b border-gray-100 pb-1">
                        <button
                          type="button"
                          onClick={() =>
                            setMobileActiveMain(isOpen ? null : cat.id)
                          }
                          className="w-full flex items-center justify-between px-3 py-2 text-sm text-black hover:bg-gray-50 rounded-md"
                        >
                          <span className="flex items-center gap-2">
                            <span>{cat.icon}</span>
                            <span>{cat.label}</span>
                          </span>
                          <span className="text-xs text-gray-500">
                            {isOpen ? '−' : '+'}
                          </span>
                        </button>
                        {isOpen && (
                          <div className="mt-1 pl-6 space-y-1">
                            {cat.subCategories.map((sub) => (
                              <button
                                key={sub.label}
                                type="button"
                                onClick={async () => {
                                  setQuery(sub.label);
                                  setMainCategory(cat.id);
                                  setSubCategory(sub.label);
                                  setMobileMenuOpen(false);
                                  await executeSearch(sub.label, cat.id, sub.label);
                                }}
                                className="w-full text-left px-2 py-1 text-xs text-black rounded hover:bg-indigo-50"
                              >
                                {sub.label}
                              </button>
                            ))}
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>
              {/* Clickable overlay to close */}
              <button
                type="button"
                className="flex-1"
                onClick={() => setMobileMenuOpen(false)}
              />
            </div>
          )}

          {/* Results - Three Column Layout (Sidebar 240px | Domestic | International) */}
          {searched && (
            <div className="flex flex-col gap-6 lg:grid lg:grid-cols-[240px_minmax(0,1fr)_minmax(0,1fr)] lg:items-start">
              {/* Left Sidebar: Filters (240px on desktop, hidden on mobile) */}
              <aside className="hidden lg:block bg-gray-50 border-r border-gray-200 px-4 py-4">
                <div className="sticky top-20 space-y-6 text-sm">
                  <div>
                    <h2 className="text-sm font-semibold text-gray-900 uppercase tracking-wide">
                      Filters
                    </h2>
                    <p className="mt-1 text-xs text-black">
                      Fine-tune your results by price, site and speed.
                    </p>
                  </div>

                  {/* Price Range Slider */}
                  <div>
                    <h3 className="text-xs font-semibold text-gray-800 uppercase tracking-wide mb-2">
                      Price Range (USD)
                    </h3>
                    <div className="space-y-2">
                      <div className="flex items-center justify-between text-[11px] text-black">
                        <span>$0</span>
                        <span className="font-semibold">
                          {tempPriceRange >= 1000 ? 'Max: $1000+' : `Max: $${tempPriceRange}`}
                        </span>
                      </div>
                      <input
                        type="range"
                        min={0}
                        max={1000}
                        value={tempPriceRange}
                        onChange={(e) => setTempPriceRange(Number(e.target.value))}
                        className="w-full accent-indigo-600"
                      />
                    </div>
                  </div>

                  {/* Sites Filter */}
                  <div>
                    <h3 className="text-xs font-semibold text-gray-800 uppercase tracking-wide mb-2">
                      Sites
                    </h3>
                    <div className="space-y-3 text-xs text-gray-800">
                      <div>
                        <p className="text-[11px] font-semibold text-gray-600 mb-1">
                          Domestic (US)
                        </p>
                        <div className="space-y-1.5">
                          {SITE_OPTIONS.domestic.map((site: { name: string; icon?: string; fallbackIcon?: string }) => (
                            <label
                              key={site.name}
                              className="flex items-center gap-2 cursor-pointer"
                            >
                              <input
                                type="checkbox"
                                checked={tempSelectedSites.includes(site.name)}
                                onChange={(e) => {
                                  const checked = e.target.checked;
                                  setTempSelectedSites((prev) =>
                                    checked ? [...prev, site.name] : prev.filter((s) => s !== site.name),
                                  );
                                }}
                                className="h-3.5 w-3.5 rounded border-gray-300 text-indigo-600 focus:ring-indigo-500"
                              />
                              {site.icon ? (
                                <>
                                  <img
                                    src={site.icon}
                                    alt={site.name}
                                    className="w-5 h-5 object-contain"
                                    onError={(e) => {
                                      e.currentTarget.style.display = 'none';
                                      const fallback =
                                        e.currentTarget.nextElementSibling as HTMLElement | null;
                                      if (fallback) {
                                        fallback.classList.remove('hidden');
                                      }
                                    }}
                                  />
                                  <span className="hidden text-lg">
                                    {site.fallbackIcon || '📦'}
                                  </span>
                                </>
                              ) : (
                                <span className="text-lg">
                                  {site.fallbackIcon || '📦'}
                                </span>
                              )}
                              <span>{site.name}</span>
                            </label>
                          ))}
                        </div>
                      </div>
                      <div>
                        <p className="text-[11px] font-semibold text-gray-600 mb-1">
                          International
                        </p>
                        <div className="space-y-1.5">
                          {SITE_OPTIONS.international.map((site: { name: string; icon?: string; fallbackIcon?: string }) => (
                            <label
                              key={site.name}
                              className="flex items-center gap-2 cursor-pointer"
                            >
                              <input
                                type="checkbox"
                                checked={tempSelectedSites.includes(site.name)}
                                onChange={(e) => {
                                  const checked = e.target.checked;
                                  setTempSelectedSites((prev) =>
                                    checked ? [...prev, site.name] : prev.filter((s) => s !== site.name),
                                  );
                                }}
                                className="h-3.5 w-3.5 rounded border-gray-300 text-indigo-600 focus:ring-indigo-500"
                              />
                              {site.icon ? (
                                <>
                                  <img
                                    src={site.icon}
                                    alt={site.name}
                                    className="w-5 h-5 object-contain"
                                    onError={(e) => {
                                      e.currentTarget.style.display = 'none';
                                      const fallback =
                                        e.currentTarget.nextElementSibling as HTMLElement | null;
                                      if (fallback) {
                                        fallback.classList.remove('hidden');
                                      }
                                    }}
                                  />
                                  <span className="hidden text-lg">
                                    {site.fallbackIcon || '📦'}
                                  </span>
                                </>
                              ) : (
                                <span className="text-lg">
                                  {site.fallbackIcon || '📦'}
                                </span>
                              )}
                              <span>{site.name}</span>
                            </label>
                          ))}
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Shipping Speed */}
                  <div>
                    <h3 className="text-xs font-semibold text-gray-800 uppercase tracking-wide mb-2">
                      Shipping Speed
                    </h3>
                    <div className="space-y-1.5 text-xs text-gray-800">
                      {SHIPPING_SPEED_OPTIONS.map((label) => (
                        <label
                          key={label}
                          className="flex items-center gap-2 cursor-pointer"
                        >
                          <input
                            type="checkbox"
                            checked={tempSelectedSpeeds.includes(label)}
                            onChange={(e) => {
                              const checked = e.target.checked;
                              setTempSelectedSpeeds((prev) =>
                                checked ? [...prev, label] : prev.filter((s) => s !== label),
                              );
                            }}
                            className="h-3.5 w-3.5 rounded border-gray-300 text-indigo-600 focus:ring-indigo-500"
                          />
                          <span>{label}</span>
                        </label>
                      ))}
                    </div>
                  </div>

                  {/* Apply Filters Button */}
                  <div className="pt-3">
                    <button
                      type="button"
                      onClick={() => {
                        setPriceRange(tempPriceRange);
                        setSelectedSites(tempSelectedSites);
                        setSelectedSpeeds(tempSelectedSpeeds);
                      }}
                      disabled={
                        priceRange === tempPriceRange &&
                        areStringArraysEqual(selectedSites, tempSelectedSites) &&
                        areStringArraysEqual(selectedSpeeds, tempSelectedSpeeds)
                      }
                      className="mt-2 w-full rounded-lg bg-indigo-600 text-white text-xs font-semibold py-2 hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                    >
                      Apply Filters
                    </button>
                  </div>
                </div>
              </aside>

              {/* Middle Column: 🇺🇸 Domestic */}
              <section className="flex flex-col">
                {/* Header + Sort */}
                <div className="flex items-center gap-3 px-4 py-3 border-b border-gray-300 bg-white flex-shrink-0">
                  <span className="text-xl">🇺🇸</span>
                  <div className="flex-1">
                    <h2 className="text-lg font-bold text-gray-900">Domestic (Ships from US)</h2>
                    <p className="text-xs text-black">US Stock • Fast Delivery</p>
                  </div>
                  <span className="bg-blue-100 text-blue-800 text-xs px-2 py-1 rounded-full font-semibold">
                    {metadata?.domesticCount ?? domestic.length}
                  </span>
                  <div className="ml-2">
                    <label className="flex items-center gap-1 text-[11px] text-black">
                      <span>Sort by</span>
                      <select
                        value={sortBy}
                        onChange={(e) =>
                          setSortBy(e.target.value as 'relevance' | 'price_asc' | 'price_desc')
                        }
                        className="border border-gray-300 rounded-md text-[11px] px-1.5 py-1 bg-white focus:outline-none focus:ring-1 focus:ring-indigo-500"
                      >
                        <option value="relevance">Best Match</option>
                        <option value="price_asc">Price: Low to High</option>
                        <option value="price_desc">Price: High to Low</option>
                      </select>
                    </label>
                  </div>
                </div>

                {/* Content */}
                <div className="px-4 py-3">
                  {loading ? (
                    <div className="space-y-4">
                      <div className="text-center text-sm text-black mb-2">
                        AI is analyzing the best prices in the US...
                      </div>
                      {[1, 2, 3, 4].map((i) => (
                        <div
                          key={i}
                          className="border border-gray-200 rounded-lg p-3 animate-pulse bg-gray-50"
                        >
                          <div className="flex gap-3">
                            <div className="w-16 h-16 bg-gray-200 rounded" />
                            <div className="flex-1 space-y-2">
                              <div className="h-3 bg-gray-200 rounded w-3/4" />
                              <div className="h-3 bg-gray-200 rounded w-1/2" />
                              <div className="h-4 bg-gray-200 rounded w-1/3" />
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : filteredDomestic.length === 0 ? (
                    <div className="text-center py-12 text-black">
                      <p>No products found in this category</p>
                    </div>
                  ) : (
                    <>
                      <div className="space-y-3">
                        {displayedDomestic.map((item) => (
                          <ProductCard key={item.id} product={item} type="domestic" />
                        ))}
                      </div>
                    </>
                  )}
                </div>
              </section>

              {/* Right Column: 🌏 International */}
              <section className="flex flex-col">
                {/* Header + Sort (공유 상태 사용) */}
                <div className="flex items-center gap-3 px-4 py-3 border-b border-gray-300 bg-white flex-shrink-0">
                  <span className="text-xl">🌏</span>
                  <div className="flex-1">
                    <h2 className="text-lg font-bold text-gray-900">
                      International (Global Direct)
                    </h2>
                    <p className="text-xs text-black">Global Direct • Lowest Price</p>
                  </div>
                  <span className="bg-orange-100 text-orange-800 text-xs px-2 py-1 rounded-full font-semibold">
                    {metadata?.internationalCount ?? international.length}
                  </span>
                  <div className="ml-2">
                    <label className="flex items-center gap-1 text-[11px] text-black">
                      <span>Sort by</span>
                      <select
                        value={sortBy}
                        onChange={(e) =>
                          setSortBy(e.target.value as 'relevance' | 'price_asc' | 'price_desc')
                        }
                        className="border border-gray-300 rounded-md text-[11px] px-1.5 py-1 bg-white focus:outline-none focus:ring-1 focus:ring-indigo-500"
                      >
                        <option value="relevance">Best Match</option>
                        <option value="price_asc">Price: Low to High</option>
                        <option value="price_desc">Price: High to Low</option>
                      </select>
                    </label>
                  </div>
                </div>

                {/* Content */}
                <div className="px-4 py-3">
                  {loading ? (
                    <div className="space-y-4">
                      <div className="text-center text-sm text-black mb-2">
                        Comparing global prices across Amazon, Temu, and others...
                      </div>
                      {[1, 2, 3, 4].map((i) => (
                        <div
                          key={i}
                          className="border border-gray-200 rounded-lg p-3 animate-pulse bg-gray-50"
                        >
                          <div className="flex gap-3">
                            <div className="w-16 h-16 bg-gray-200 rounded" />
                            <div className="flex-1 space-y-2">
                              <div className="h-3 bg-gray-200 rounded w-3/4" />
                              <div className="h-3 bg-gray-200 rounded w-1/2" />
                              <div className="h-4 bg-gray-200 rounded w-1/3" />
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : filteredInternational.length === 0 ? (
                    <div className="text-center py-12 text-black">
                      <p>No products found in this category</p>
                    </div>
                  ) : (
                    <>
                      <div className="space-y-3">
                        {displayedInternational.map((item) => (
                          <ProductCard key={item.id} product={item} type="international" />
                        ))}
                      </div>
                    </>
                  )}
                </div>
              </section>

              {/* Unified "Show more" button for both Domestic & International */}
              {(hasMoreDomestic || hasMoreInternational) && (
                <div className="col-span-2 col-start-2 mt-4 pb-4">
                  <button
                    type="button"
                    onClick={() => {
                      showMoreDomestic();
                      showMoreInternational();
                    }}
                    className="w-full py-4 px-6 bg-white border-2 border-indigo-100 text-indigo-600 font-bold rounded-xl hover:bg-indigo-50 shadow-sm transition-all"
                  >
                    Show more results
                  </button>
                </div>
              )}
            </div>
          )}

          {/* Empty State */}
          {!searched && (
            <div className="text-center py-20">
              <p className="text-xl text-black mb-4">
                Start searching to compare products
              </p>
              <p className="text-sm text-black">
                Compare fast US delivery vs global best prices
              </p>
            </div>
          )}
        </div>
      </main>
    </div>
  );
}

/**
 * Product Card Component - Compact Design
 */
function ProductCard({ product, type }: { product: Product; type: 'domestic' | 'international' }) {
  const isDomestic = type === 'domestic';
  const hasVariants = product.variants && product.variants.length > 0;
  const isChinaLikeInternational =
    !isDomestic && ['Temu', 'AliExpress', 'Coupang'].includes(product.site);

  const ctaLabel = isDomestic
    ? '🇺🇸 View Deal'
    : isChinaLikeInternational
    ? '🇨🇳 View Deal'
    : '🌏 View Deal';

  return (
    <div className="border border-gray-300 rounded-lg p-2.5 hover:shadow-sm transition-shadow bg-white">
      <div className="flex gap-2.5">
        {/* Product Image - Compact */}
        <div className="flex-shrink-0">
          <img
            src={product.image || '/placeholder-product.png'}
            alt={product.name}
            className="w-16 h-16 object-cover rounded border border-gray-200 bg-gray-100"
            onError={(e) => {
              (e.target as HTMLImageElement).src = '/placeholder-product.png';
            }}
          />
        </div>

        {/* Product Info - Compact */}
        <div className="flex-1 min-w-0">
          <div className="flex items-start justify-between mb-1">
            <h3 className="font-medium text-sm text-gray-900 line-clamp-2 flex-1 leading-tight">{product.name}</h3>
            {hasVariants && (
              <span className="ml-1.5 text-[10px] px-1.5 py-0.5 rounded bg-green-100 text-green-800 font-medium whitespace-nowrap">
                More prices
              </span>
            )}
          </div>
          
          {/* Store Badge and Info - Compact */}
          <div className="flex items-center gap-1.5 mb-1.5 flex-wrap">
            <span className={`text-[10px] px-1.5 py-0.5 rounded font-medium ${
              isDomestic ? 'bg-blue-100 text-blue-800' : 'bg-orange-100 text-orange-800'
            }`}>
              {product.site}
            </span>
            {product.deliveryDays && (
              <span className="text-[10px] text-black">
                🚚 {product.deliveryDays}
              </span>
            )}
            {product.trustScore !== undefined && (
              <span className="text-[10px] text-black">
                ⭐ {product.trustScore}
              </span>
            )}
          </div>

          {/* Price - Compact */}
          <div className="mb-1.5">
            <p className="text-lg font-bold text-gray-900">
              {product.price.toString().startsWith('$') ? product.price : '$' + product.price}
            </p>
          </div>

          {/* CTA Button - Compact (Domestic vs International 색·국기 구분) */}
          <a
            href={product.link || '#'}
            target="_blank"
            rel="noopener noreferrer"
            className={`block w-full text-center px-2 py-1.5 rounded-lg text-xs font-bold text-white transition-colors ${
              isDomestic
                ? 'bg-blue-600 hover:bg-blue-700'
                : 'bg-orange-500 hover:bg-orange-600'
            }`}
          >
            {ctaLabel}
          </a>
        </div>
      </div>
    </div>
  );
}
