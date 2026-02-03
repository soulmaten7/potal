"use client";

import React, { useState, useEffect, useLayoutEffect, useRef, useMemo, useCallback, Suspense } from 'react';
import Link from 'next/link';
import { useSupabase } from './context/SupabaseProvider';
import { useUserPreferences } from './hooks/useUserPreferences';
import { useProductSearch, inferCategoriesFromQuery, HOME_INIT_SEARCH_KEYWORD } from './hooks/useProductSearch';
import type { Product } from './types/product';
import { Header } from './components/Header';
import { ProductCard } from './components/ProductCard';
import { BottomNav } from './components/BottomNav';
import { CategoryScreen } from './components/CategoryScreen';
import { FilterBar } from './components/FilterBar';
import { SearchOverlay } from './components/SearchOverlay';
import { SearchInsight } from './components/search/SearchInsight';
import { ShippingGuideModal } from './components/ShippingGuideModal';
import { EmptyState } from './components/EmptyState';
import { interleaveDomesticInternational } from './lib/product-utils';
import { filterSuggestions, MOCK_SUGGESTIONS } from './lib/suggestions';

export type { Product } from './types/product';

type Recommendation = Product & {
  keywords: string[];
};

// Search icon for hero search button
function SearchIcon(props: React.SVGProps<SVGSVGElement>) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" {...props}>
      <path d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
    </svg>
  );
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

function HomeContent() {
  const { supabase, session } = useSupabase();
  const { addCategory, interestedCategories } = useUserPreferences();
  const search = useProductSearch();
  const {
    query,
    setQuery,
    domestic,
    international,
    loading,
    searched,
    metadata,
    personalization,
    visibleCount,
    setVisibleCount,
    loadingMore,
    isHomeMode,
    setIsHomeMode,
    isFallbackMode,
    homeSearchKeyword,
    homeProfile,
    searchCount,
    showLimitModal,
    setShowLimitModal,
    recentSearches,
    showRecentDropdown,
    setShowRecentDropdown,
    recentSearchesEnabled,
    setRecentSearchesEnabled,
    aiFilterOptions,
    selectedAiFilters,
    setSelectedAiFilters,
    aiFiltersLoading,
    sortBy,
    setSortBy,
    priceRange,
    setPriceRange,
    hasMorePages,
    lastSearchQuery,
    executeSearch,
    loadMoreResults,
    clearRecentSearches,
    removeRecentSearch,
    turnOffRecentSearches,
    turnOnRecentSearches,
  } = search;

  /** 상품 클릭 시 관심 카테고리 반영 (My Picks 정렬에 사용) */
  const handleProductClick = useCallback(
    (product: Product & { keywords?: string[] }) => {
      const keywords = product.keywords && product.keywords.length > 0
        ? product.keywords
        : inferCategoriesFromQuery(product.name);
      keywords.forEach((c) => addCategory(c));
    },
    [addCategory],
  );

  const [mainCategory, setMainCategory] = useState<MainCategory>(null);
  const [subCategory, setSubCategory] = useState<string | null>(null);
  const [megaMenuOpen, setMegaMenuOpen] = useState(false);
  const [activeMain, setActiveMain] = useState<MainCategoryId | null>(null);
  const [activeSub, setActiveSub] = useState<string | null>(null);
  const [directOnly, setDirectOnly] = useState(false);
  const [usedOnly, setUsedOnly] = useState(false);
  const [isSearchOverlayOpen, setIsSearchOverlayOpen] = useState(false);
  const [showSplash, setShowSplash] = useState(true);
  const [splashOpacity, setSplashOpacity] = useState(0);
  const [suggestions, setSuggestions] = useState<string[]>([]);
  const [suggestionHighlightIndex, setSuggestionHighlightIndex] = useState(-1);
  const [toastMessage, setToastMessage] = useState('');
  const [showToast, setShowToast] = useState(false);
  const [selectedSites, setSelectedSites] = useState<string[]>([]);
  const [selectedSpeeds, setSelectedSpeeds] = useState<string[]>([]);
  const [tempPriceRange, setTempPriceRange] = useState(1000);
  const [tempSelectedSites, setTempSelectedSites] = useState<string[]>([]);
  const [tempSelectedSpeeds, setTempSelectedSpeeds] = useState<string[]>([]);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [mobileActiveMain, setMobileActiveMain] = useState<MainCategoryId | null>(null);
  const [isMobileFilterOpen, setIsMobileFilterOpen] = useState(false);
  const [profileMenuOpen, setProfileMenuOpen] = useState(false);
  const [mobileTab, setMobileTab] = useState<'all' | 'domestic' | 'global'>('all');
  const [mobileTabLoading, setMobileTabLoading] = useState(false);
  const [isCategoryOpen, setIsCategoryOpen] = useState(false);
  const [showShippingGuide, setShowShippingGuide] = useState(false);
  const searchInputRef = useRef<HTMLInputElement>(null);
  const recentDropdownRef = useRef<HTMLDivElement>(null);

  // Keep temp filter state in sync with committed state (e.g. after reset)
  useEffect(() => {
    setTempPriceRange(priceRange);
    setTempSelectedSites(selectedSites);
    setTempSelectedSpeeds(selectedSpeeds);
  }, [priceRange, selectedSites, selectedSpeeds]);

  // 필터 적용 시 리스트가 바뀌므로 visibleCount를 16으로 초기화
  useEffect(() => {
    setVisibleCount(16);
  }, [selectedAiFilters, priceRange, selectedSites, selectedSpeeds, setVisibleCount]);

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

  // Autocomplete: 2자 이상 입력 시 Mock 데이터 필터링 (PC/모바일 공통, 즉시 반영)
  useEffect(() => {
    const trimmed = query.trim();
    if (trimmed.length < 2) {
      setSuggestions([]);
      setSuggestionHighlightIndex(-1);
      return;
    }
    const list = filterSuggestions(trimmed, MOCK_SUGGESTIONS);
    setSuggestions(list);
    setSuggestionHighlightIndex(list.length > 0 ? 0 : -1);
  }, [query]);

  // 인트로 스플래시: useLayoutEffect 최상단에서 sessionStorage 체크 → Hydration 불일치 방지 및 깜빡임 최소화
  useLayoutEffect(() => {
    if (typeof window === 'undefined') return;
    if (sessionStorage.getItem('potal_intro_shown') === '1') {
      setShowSplash(false);
      return;
    }
    const isDesktop = window.matchMedia('(min-width: 768px)').matches;
    if (isDesktop) {
      setShowSplash(false);
      return;
    }
    const t1 = setTimeout(() => setSplashOpacity(1), 50);
    const t2 = setTimeout(() => setSplashOpacity(0), 1200);
    const t3 = setTimeout(() => {
      sessionStorage.setItem('potal_intro_shown', '1');
      setShowSplash(false);
    }, 1500);
    return () => { clearTimeout(t1); clearTimeout(t2); clearTimeout(t3); };
  }, []);

  const handleSearch = async (e: React.FormEvent) => {
    e.preventDefault();
    const trimmed = query.trim();
    if (loading || !trimmed) return;
    setIsHomeMode(false);
    setMobileTab('all');
    await executeSearch(trimmed, mainCategory, subCategory);
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

  const getAiFilterLabels = (): string[] => {
    const labels: string[] = [];
    for (const [groupName, values] of Object.entries(aiFilterOptions)) {
      for (const label of values) {
        const id = `ai-${groupName}-${String(label).toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, '')}`;
        if (selectedAiFilters.has(id)) labels.push(label);
      }
    }
    return labels;
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

      const aiLabels = getAiFilterLabels();
      if (aiLabels.length > 0) {
        const searchText = [p.name, p.site, p.shipping, p.deliveryDays, (p as { category?: string }).category, (p as { brand?: string }).brand]
          .filter(Boolean)
          .map((s) => String(s).toLowerCase())
          .join(' ');
        const escapeRegex = (s: string) => s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
        if (!aiLabels.every((label) => {
          const regex = new RegExp('\\b' + escapeRegex(label) + '\\b', 'i');
          return regex.test(searchText);
        })) return false;
      }

      return true;
    });

  const areStringArraysEqual = (a: string[], b: string[]) => {
    if (a.length !== b.length) return false;
    const sa = [...a].sort();
    const sb = [...b].sort();
    return sa.every((v, i) => v === sb[i]);
  };

  const resetToHome = () => {
    if (typeof window !== 'undefined') {
      try {
        window.sessionStorage.clear();
      } catch {
        // ignore
      }
      window.location.href = '/';
    }
  };

  const handleShowMore = async () => {
    if (loadingMore) return;
    const hasMoreInMemory =
      visibleCount < sortedDomestic.length || visibleCount < sortedInternational.length;
    if (hasMoreInMemory) {
      setVisibleCount((prev) => prev + 16);
      return;
    }
    await loadMoreResults();
  };

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

  // 클라이언트 사이드 페이지네이션: 현재 로드된 데이터 중 visibleCount만큼만 렌더링
  const displayedDomestic = sortedDomestic.slice(0, visibleCount);
  const displayedInternational = sortedInternational.slice(0, visibleCount);

  // 모바일·PC 공통: 강제 지퍼 [Dom[0], Intl[0], Dom[1], Intl[1], ...]. 부족한 쪽은 null(빈 슬롯), 반대쪽 열 침범 방지
  const mobileDisplayedList = useMemo((): { product: Product | null; type: 'domestic' | 'international' }[] => {
    if (!searched) return [];
    if (mobileTab === 'all') {
      const zipper = interleaveDomesticInternational(displayedDomestic, displayedInternational, { fillNull: true });
      return zipper.map((slot) => ({ product: slot.item, type: slot.type }));
    }
    if (mobileTab === 'domestic') return displayedDomestic.map((p) => ({ product: p, type: 'domestic' as const }));
    return displayedInternational.map((p) => ({ product: p, type: 'international' as const }));
  }, [searched, mobileTab, displayedDomestic, displayedInternational]);

  const hasMoreResults =
    searched &&
    !loadingMore &&
    (domestic.length > 0 || international.length > 0) &&
    (visibleCount < sortedDomestic.length ||
      visibleCount < sortedInternational.length ||
      hasMorePages);

  const showEmptyState =
    searched &&
    !loading &&
    !isHomeMode &&
    domestic.length === 0 &&
    international.length === 0 &&
    !isFallbackMode;

  // Debug logs - display state
  if (searched && !loading) {
    console.log('🔍 Display State:', {
      domestic: { total: domestic.length, displayed: displayedDomestic.length, visibleCount },
      international: { total: international.length, displayed: displayedInternational.length, visibleCount },
    });
  }

  const handleMobileTabChange = (tab: 'all' | 'domestic' | 'global') => {
    setMobileTab(tab);
    setVisibleCount(16);
    setMobileTabLoading(true);
    setTimeout(() => setMobileTabLoading(false), 500);
  };


  const showToastMessage = (msg: string) => {
    setToastMessage(msg);
    setShowToast(true);
    setTimeout(() => {
      setShowToast(false);
      setTimeout(() => setToastMessage(''), 350);
    }, 2000);
  };
  const homeBadgeLabel = isHomeMode
    ? homeSearchKeyword === HOME_INIT_SEARCH_KEYWORD
      ? 'Trending'
      : 'For You'
    : '';
  const homeBadgeDisplayText = homeBadgeLabel;
  const homeHeaderText =
    homeBadgeLabel === 'For You'
      ? '✨ Personalized Picks for You'
      : homeBadgeLabel === 'Trending'
        ? '🔥 Global Trending Picks'
        : '';

  /** 홈 모드 서브헤더: Domestic/Global 동일. 로그인 → 관심사 기반, 게스트 → 트렌딩 (POTAL 비교 본질) */
  const getHomeSubtitle = (): string => {
    if (!isHomeMode) return '';
    return session ? '🎯 Based on your interests' : '🔥 Trending Now';
  };
  const getDomesticSubtitle = getHomeSubtitle;
  const getGlobalSubtitle = getHomeSubtitle;

  return (
    <div className="min-h-screen bg-slate-50">

      {/* 인트로 스플래시: 모바일만, 세션당 1회. 클라이언트에서 이미 표시된 경우 렌더 원천 차단(좀비 스플래시 방지) */}
      {showSplash && (
        <div
          className="fixed inset-0 z-[99999] flex items-center justify-center bg-white md:hidden"
          style={{ opacity: splashOpacity, transition: 'opacity 0.45s ease-in-out', transform: `scale(${0.96 + splashOpacity * 0.04})` }}
          aria-hidden="true"
        >
          <span className="text-5xl font-bold text-indigo-600 tracking-tight">POTAL</span>
        </div>
      )}

      {/* PC 헤더: md 이상에서만 표시 */}
      <div className="hidden md:block">
        <Header
          resetToHome={resetToHome}
          profileMenuOpen={profileMenuOpen}
          setProfileMenuOpen={setProfileMenuOpen}
        />
      </div>

      {/* Main Content: 모바일 gap 최소화(검색창–FilterBar 밀착), 하단 네비 여백 */}
      <main className="w-full px-0 sm:px-6 py-0 md:py-8 pb-16 md:pb-8 mt-0">
        <div className="bg-white md:rounded-2xl md:shadow-sm md:border border-gray-200 px-0 sm:px-6 py-0 md:py-6 sm:py-8 overflow-visible">
          {/* 검색 행: PC에서만 표시 (모바일은 상단 슬림 검색 사용) */}
          <div className="relative hidden md:flex flex-col gap-3 sm:flex-row sm:items-stretch sm:gap-2 mb-4 overflow-visible">
            {/* 2인자: All Categories - w-64 (사이드바와 라인 맞춤) */}
            <div className="relative z-[3000] hidden sm:block w-full sm:w-64 flex-shrink-0 overflow-visible">
              <button
                type="button"
                onClick={() => setMegaMenuOpen((prev) => !prev)}
                className="w-full h-14 inline-flex items-center justify-center gap-2 px-4 rounded-xl border-2 border-indigo-500 bg-indigo-600 text-white text-sm font-medium hover:bg-indigo-700 transition-colors shadow-sm"
              >
                <span className="text-lg">☰</span>
                <span>All Categories</span>
              </button>
              {megaMenuOpen && (
                <div
                  className="absolute left-0 top-full mt-1 z-[3000] bg-white"
                  onMouseLeave={() => {
                    setMegaMenuOpen(false);
                    setActiveMain(null);
                    setActiveSub(null);
                  }}
                >
                  <div className="flex w-max min-w-[800px] bg-white border border-slate-200 shadow-xl rounded-lg overflow-hidden">
                    <div className="w-56 bg-slate-50 border-r border-slate-200 max-h-[520px] overflow-y-auto">
                      {CATEGORY_TREE.map((cat) => {
                        const isActive = activeMain === cat.id;
                        return (
                          <button
                            key={cat.id}
                            type="button"
                            onMouseEnter={() => { setActiveMain(cat.id); setActiveSub(null); }}
                            onClick={() => { setMainCategory(cat.id); setSubCategory(null); setMegaMenuOpen(false); }}
                            className={`w-full text-left px-4 py-3 text-sm flex items-center gap-2 transition-colors ${isActive ? 'bg-white border-l-4 border-l-indigo-600 font-semibold text-slate-900' : 'hover:bg-white text-slate-700'}`}
                          >
                            <span className="text-lg">{cat.icon}</span>
                            <span>{cat.label}</span>
                          </button>
                        );
                      })}
                    </div>
                    {activeMain && (
                      <div className="w-52 border-r border-slate-200 bg-white max-h-[520px] overflow-y-auto">
                        {CATEGORY_TREE.find((c) => c.id === activeMain)?.subCategories.map((sub, idx) => {
                          const isActive = activeSub === sub.label;
                          return (
                            <button
                              key={idx}
                              type="button"
                              onMouseEnter={() => setActiveSub(sub.label)}
                              onClick={() => { setMainCategory(activeMain); setSubCategory(sub.label); setMegaMenuOpen(false); }}
                              className={`w-full text-left px-4 py-3 text-sm text-slate-700 transition-colors ${isActive ? 'bg-indigo-50 font-semibold border-l-4 border-l-indigo-500 text-slate-900' : 'hover:bg-slate-50'}`}
                            >
                              {sub.label}
                            </button>
                          );
                        })}
                      </div>
                    )}
                    {activeMain && activeSub && (
                      <div className="flex-1 min-w-[300px] bg-white p-4 max-h-[520px] overflow-y-auto">
                        <div className="grid grid-cols-2 gap-2">
                          {CATEGORY_TREE.find((c) => c.id === activeMain)?.subCategories.find((s) => s.label === activeSub)?.details.map((detail, idx) => (
                            <button
                              key={idx}
                              type="button"
                              onClick={async () => {
                                setQuery(detail);
                                setMainCategory(activeMain);
                                setSubCategory(activeSub);
                                setMegaMenuOpen(false);
                                setIsHomeMode(false);
                                await executeSearch(detail, activeMain, activeSub);
                              }}
                              className="text-left px-3 py-2 text-sm text-slate-700 rounded-md hover:bg-indigo-50 hover:font-semibold transition-colors"
                            >
                              {detail}
                            </button>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>
            {/* 검색창 & 최근 검색어 드롭다운 - z-[2500] (All Categories z-3000 다음, AI/리스트 위) */}
            <div className="flex-1 min-w-0 w-full relative z-[2500] flex-[1_1_0%]">
              <form onSubmit={handleSearch} className="relative h-14 rounded-xl shadow-sm border-2 border-indigo-500 bg-white overflow-hidden focus-within:ring-2 focus-within:ring-indigo-500 focus-within:ring-offset-0">
                <input
                  ref={searchInputRef}
                  type="text"
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  onFocus={() => setShowRecentDropdown(true)}
                  onKeyDown={(e) => {
                    if (query.trim().length >= 2 && showRecentDropdown && suggestions.length > 0) {
                      if (e.key === 'ArrowDown') {
                        e.preventDefault();
                        setSuggestionHighlightIndex((prev) => (prev < suggestions.length - 1 ? prev + 1 : 0));
                      } else if (e.key === 'ArrowUp') {
                        e.preventDefault();
                        setSuggestionHighlightIndex((prev) => (prev <= 0 ? suggestions.length - 1 : prev - 1));
                      } else if (e.key === 'Enter' && suggestionHighlightIndex >= 0 && suggestionHighlightIndex < suggestions.length) {
                        e.preventDefault();
                        const selected = suggestions[suggestionHighlightIndex];
                        setQuery(selected);
                        setShowRecentDropdown(false);
                        setIsHomeMode(false);
                        executeSearch(selected, mainCategory, subCategory);
                      }
                    }
                  }}
                  placeholder="Search for products..."
                  className="h-full w-full px-5 pl-12 pr-[75px] md:pr-[130px] text-base text-slate-800 placeholder:text-slate-500 focus:outline-none border-0 bg-transparent"
                />
                <span className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none w-5 h-5">
                  <SearchIcon className="w-full h-full" />
                </span>
                {query.length > 0 && (
                  <button
                    type="button"
                    onClick={() => {
                      setQuery("");
                      searchInputRef.current?.focus();
                    }}
                    className="md:hidden absolute right-[50px] top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 z-10 p-3 min-h-[44px] min-w-[44px] flex items-center justify-center rounded touch-manipulation"
                    aria-label="Clear search"
                  >
                    <svg className="h-5 w-5" fill="currentColor" viewBox="0 0 20 20" aria-hidden="true">
                      <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                    </svg>
                  </button>
                )}
                <button
                  type="submit"
                  className="absolute right-2 top-1/2 -translate-y-1/2 min-h-[44px] min-w-[44px] inline-flex items-center justify-center gap-2 px-4 py-3 bg-indigo-600 text-white rounded-lg font-semibold hover:bg-indigo-700 transition-colors shadow-sm cursor-pointer"
                >
                  <SearchIcon className="w-5 h-5 text-white" />
                  {loading ? 'Searching...' : 'Search'}
                </button>
              </form>
              {showRecentDropdown && (
                <div
                  ref={recentDropdownRef}
                  className="absolute left-0 right-0 top-full mt-2 z-[60] bg-white rounded-xl shadow-lg border border-gray-200 overflow-hidden"
                >
                  {query.trim().length >= 2 ? (
                    <>
                      <div className="px-4 py-2 border-b border-gray-200 bg-slate-50">
                        <span className="text-xs font-semibold text-slate-800">Suggestions</span>
                      </div>
                      <div className="max-h-64 overflow-y-auto">
                        {suggestions.length === 0 ? (
                          <div className="px-4 py-3 text-xs text-slate-500">No suggestions.</div>
                        ) : (
                          suggestions.map((s, idx) => (
                            <button
                              key={idx}
                              type="button"
                              onClick={async () => {
                                setQuery(s);
                                setShowRecentDropdown(false);
                                setIsHomeMode(false);
                                await executeSearch(s, mainCategory, subCategory);
                              }}
                              className={`w-full text-left px-4 py-3 text-sm transition-colors border-b border-gray-100 last:border-b-0 ${idx === suggestionHighlightIndex ? 'bg-indigo-50 text-indigo-700' : 'text-slate-800 hover:bg-indigo-50 hover:text-indigo-700'}`}
                            >
                              {s}
                            </button>
                          ))
                        )}
                      </div>
                    </>
                  ) : recentSearchesEnabled && recentSearches.length > 0 ? (
                    <>
                      <div className="px-4 py-2 border-b border-gray-200 bg-slate-50">
                        <span className="text-xs font-semibold text-slate-800">Recent Searches</span>
                      </div>
                      <div className="max-h-64 overflow-y-auto">
                        {recentSearches.map((search, idx) => (
                          <button
                            key={idx}
                            type="button"
                            onClick={async () => {
                              setQuery(search);
                              setIsHomeMode(false);
                              await executeSearch(search, mainCategory, subCategory);
                            }}
                            className="w-full text-left px-4 py-3 text-sm text-slate-800 hover:bg-indigo-50 hover:text-indigo-700 transition-colors border-b border-gray-100 last:border-b-0"
                          >
                            {search}
                          </button>
                        ))}
                      </div>
                      <div className="px-4 py-2 border-t border-gray-200 bg-slate-50 flex items-center justify-between">
                        <button type="button" onClick={clearRecentSearches} className="text-xs text-slate-500 hover:text-slate-800 transition-colors">Clear All</button>
                        <button type="button" onClick={turnOffRecentSearches} className="text-xs text-slate-500 hover:text-slate-700 transition-colors">Turn off</button>
                      </div>
                    </>
                  ) : (
                    <div className="px-4 py-3 flex items-center justify-between">
                      <p className="text-xs text-slate-500">Recent searches are turned off.</p>
                      <button type="button" onClick={turnOnRecentSearches} className="text-sm text-indigo-600 hover:text-indigo-700 font-medium transition-colors">Turn on</button>
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>

          {/* 모바일 전용: 슈퍼 스티키(검색창+FilterBar+헤더) + 콘텐츠 */}
          <div className="md:hidden">
            {/* 단일 스티키 컨테이너: 배경 비침 방지 */}
            <div className="sticky top-0 z-[1000] bg-white border-b border-slate-200 shadow-md flex flex-col gap-0">
              {/* 1. 검색 영역 */}
              <div className="p-3">
                <div className="flex items-center gap-4 min-h-[44px]">
                  {searched && !isHomeMode ? (
                    <button
                      type="button"
                      onClick={resetToHome}
                      className="shrink-0 flex items-center justify-center w-10 h-10 rounded-full text-slate-700 hover:bg-slate-100 active:bg-slate-200 transition-colors"
                      aria-label="Back to home"
                    >
                      <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" /></svg>
                    </button>
                  ) : (
                    <button
                      type="button"
                      onClick={resetToHome}
                      className="shrink-0 inline-flex items-center gap-1 cursor-pointer hover:opacity-90 min-w-0"
                      aria-label="POTAL Home"
                    >
                      <span className="shrink-0 text-xl font-bold text-indigo-600 tracking-tight">POTAL</span>
                    </button>
                  )}
                  <div className="flex-1 min-w-0">
                    <button
                      type="button"
                      onClick={() => setIsSearchOverlayOpen(true)}
                      className="relative w-full h-10 rounded-xl bg-white border-2 border-indigo-500 shadow-sm overflow-hidden flex items-center text-left cursor-pointer hover:border-indigo-600 transition-colors"
                      aria-label="Search (tap to open search)"
                    >
                      <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 w-4 h-4 pointer-events-none">
                        <SearchIcon className="w-full h-full" />
                      </span>
                      <span className={`pl-9 pr-3 text-sm truncate block w-full ${query ? 'text-slate-800' : 'text-slate-500'}`}>
                        {query || 'Search for products...'}
                      </span>
                    </button>
                  </div>
                </div>
              </div>
              {/* 2. FilterBar (검색 결과 있고 !isHomeMode 일 때만) */}
              {searched && !isHomeMode && (
                <div className="mt-0">
                  <FilterBar
                    mobileTab={mobileTab}
                    onTabChange={handleMobileTabChange}
                    onFilterClick={() => setIsMobileFilterOpen(true)}
                    onShippingGuideClick={() => setShowShippingGuide(true)}
                  />
                </div>
              )}
              {/* 3. Domestic/Global 헤더 (검색 결과 있을 때만) */}
              {searched && (isHomeMode ? (
                <>
                  <div className="grid grid-cols-2 gap-2 px-2 py-2 bg-slate-50 border-b border-slate-200">
                    <div className="text-center text-xs font-bold text-slate-700">🇺🇸 Domestic (Fast)</div>
                    <div className="text-center text-xs font-bold text-slate-700">🌏 Global (Cheap)</div>
                  </div>
                  <div className="px-2 py-0.5 border-b border-slate-100/80">
                    <p className="text-sm text-slate-500 text-center whitespace-nowrap">
                      {getHomeSubtitle()}
                    </p>
                  </div>
                </>
              ) : mobileTab === 'all' ? (
                <div className="grid grid-cols-2 gap-2 px-2 py-2 bg-slate-50 border-b border-slate-200">
                  <div className="text-center text-xs font-bold text-slate-700">🇺🇸 Domestic (Fast)</div>
                  <div className="text-center text-xs font-bold text-slate-700">🌏 Global (Cheap)</div>
                </div>
              ) : null)}
            </div>

            {/* 스티키 밖: fallback 배너, 로딩, 그리드 */}
            {searched && !isHomeMode && isFallbackMode && (
              <div className="mx-2 mt-2 rounded-xl border border-amber-200 bg-amber-50/90 px-3 py-3 flex gap-2">
                <span className="shrink-0 text-lg" aria-hidden>💡</span>
                <div>
                  <p className="text-sm font-semibold text-slate-800">No results for &quot;{query}&quot;.</p>
                  <p className="text-xs text-slate-600 mt-0.5">Showing {session ? 'Personalized' : 'Trending'} picks instead.</p>
                </div>
              </div>
            )}
            {!searched && (
              <div className="flex items-center gap-2 px-2 pt-0 pb-0.5 border-b border-slate-100 min-h-0">
                <span className="font-bold text-sm text-slate-800">Loading real products...</span>
              </div>
            )}
            <div className="pt-0 pb-1 px-2">
              {mobileTabLoading || !searched ? (
                <div className="grid grid-cols-2 gap-2 w-full">
                  {[1, 2, 3, 4, 5, 6].map((i) => (
                    <div key={i} className="rounded-xl border border-slate-100 overflow-hidden bg-slate-50 animate-pulse">
                      <div className="h-40 bg-slate-200" />
                      <div className="p-2 space-y-1.5">
                        <div className="h-3 bg-slate-200 rounded w-full" />
                        <div className="h-3 bg-slate-200 rounded w-4/5" />
                        <div className="h-4 bg-slate-200 rounded w-1/3 mt-2" />
                      </div>
                    </div>
                  ))}
                </div>
              ) : (() => {
                const hasAnyProduct = mobileDisplayedList.some(({ product }) => product != null);
                if (!hasAnyProduct && !loading) {
                  return (
                    <EmptyState
                      query={query}
                      onKeywordClick={(kw) => executeSearch(kw, mainCategory, subCategory)}
                    />
                  );
                }
                return (
                  <div className={`grid grid-cols-2 w-full ${mobileTab === 'all' ? 'gap-x-0 gap-y-2' : 'gap-2'}`}>
                    {mobileDisplayedList.map(({ product, type }, index) => (
                      <div
                        key={mobileTab === 'all' ? `slot-${type}-${index}` : `${product?.id ?? 'n'}-${index}`}
                        className={`min-w-0 ${mobileTab === 'all' ? (index % 2 === 0 ? 'border-r border-slate-200/60 pr-1' : 'pl-1 bg-slate-50/40') : ''}`}
                      >
                        {product ? (
                          <ProductCard
                            product={product}
                            type={type}
                            compact={false}
                            dense
                            onWishlistChange={(added) => showToastMessage(added ? "Saved to your list" : "Removed from saved")}
                            onProductClick={handleProductClick}
                          />
                        ) : (
                          <div className="min-h-[200px] rounded-xl border border-dashed border-slate-200/60 bg-slate-50/30 flex items-center justify-center" aria-hidden>
                            <span className="text-[10px] text-slate-400">{type === 'domestic' ? '🇺🇸' : '🌏'} —</span>
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                );
              })()}
            {searched && hasMoreResults && (
              <div className="mt-4 pb-4 flex justify-center px-2">
                <button
                  type="button"
                  onClick={handleShowMore}
                  disabled={loadingMore}
                  className="w-full py-3 rounded-full bg-white border border-purple-200 text-purple-700 font-semibold shadow-sm hover:bg-purple-50 hover:shadow-md transition-all disabled:opacity-70 disabled:cursor-not-allowed"
                >
                  {loadingMore ? (
                    <span className="inline-flex items-center gap-2">
                      <svg className="animate-spin h-5 w-5 text-purple-600" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" aria-hidden="true">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                      </svg>
                      Loading...
                    </span>
                  ) : (
                    '👇 Show More Results'
                  )}
                </button>
              </div>
            )}
            </div>
          </div>

          {/* PC 전용: 기존 레이아웃 (사이드바 + 홈/검색 결과). 홈(Trending)일 때는 사이드바 미표시 */}
          <div className="hidden md:block">
          <div className={searched ? (isHomeMode ? 'relative z-[1000] overflow-visible' : 'relative z-[1000] lg:grid lg:grid-cols-[16rem_minmax(0,1fr)] lg:gap-4 lg:items-start overflow-visible') : ''}>
            {/* Grid 첫 번째 컬럼: 사이드바 w-64 (검색 결과일 때만, 홈 뷰 제외) */}
            {searched && !isHomeMode && (
            <div className="hidden lg:block w-64 flex-shrink-0 overflow-visible min-w-0 relative z-[1000]">
            <aside className="w-64 flex-shrink-0 overflow-visible">
              <div className="sticky top-20 space-y-4 text-sm overflow-visible">
                {/* [섹션 1] ✨ AI Smart Filters - AI의 제안, 보라 톤 강조 */}
                <div className="w-full bg-purple-50/90 border border-purple-200 rounded-xl shadow-sm px-4 py-4">
                  <h2 className="text-sm font-semibold text-slate-800 uppercase tracking-wide flex items-center gap-1.5">
                    <span aria-hidden>✨</span> AI Smart Filters
                  </h2>
                  <p className="mt-0.5 text-xs text-slate-600 mb-2">Refine with AI-Recommended Filters</p>
                  {aiFiltersLoading ? (
                    <div className="space-y-2 text-xs text-slate-500 animate-pulse">
                      <div className="h-4 bg-purple-200/60 rounded w-full" />
                      <div className="h-4 bg-purple-200/60 rounded w-4/5" />
                      <div className="h-4 bg-purple-200/60 rounded w-3/4" />
                      <p className="pt-1 text-[11px] font-medium text-indigo-600">AI is thinking...</p>
                    </div>
                  ) : Object.keys(aiFilterOptions).length === 0 ? (
                    <p className="text-xs text-slate-500">Search to see AI filters.</p>
                  ) : (
                    <div className="space-y-2 text-xs text-gray-800">
                      {Object.entries(aiFilterOptions).map(([groupName, values]) => (
                        <div key={groupName}>
                          <p className="font-semibold text-slate-800 mb-2">{groupName}</p>
                          <div className="flex flex-wrap gap-2">
                            {values.map((label) => {
                              const id = `ai-${groupName}-${String(label).toLowerCase().replace(/\s+/g, "-").replace(/[^a-z0-9-]/g, "")}`;
                              const checked = selectedAiFilters.has(id);
                              return (
                                <button
                                  key={id}
                                  type="button"
                                  onClick={() => {
                                    setSelectedAiFilters((prev) => {
                                      const next = new Set(prev);
                                      if (checked) next.delete(id);
                                      else next.add(id);
                                      return next;
                                    });
                                  }}
                                  className={`py-2 px-3 rounded-lg text-xs font-medium whitespace-nowrap max-w-[11rem] truncate transition-colors border ${
                                    checked ? "bg-indigo-600 border-transparent text-white font-bold shadow-md" : "bg-white border-slate-200 text-slate-700 hover:bg-slate-50"
                                  }`}
                                >
                                  {label}
                                </button>
                              );
                            })}
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
                <div className="w-full bg-slate-50/80 border border-slate-200 rounded-xl shadow-sm px-4 py-4">
                  <div className="space-y-4">
                    <div>
                      <h2 className="text-sm font-semibold text-slate-800 uppercase tracking-wide">Filters</h2>
                      <p className="mt-0.5 text-xs text-slate-500">Fine-tune your results by price, site and speed.</p>
                    </div>
                    <div>
                      <h3 className="text-xs font-semibold text-gray-800 uppercase tracking-wide mb-2 flex items-center gap-1"><span aria-hidden>⚡</span> Price Range (USD)</h3>
                      <div className="space-y-2">
                        <div className="flex items-center justify-between text-[11px] text-black">
                          <span>$0</span>
                          <span className="font-semibold">{tempPriceRange >= 1000 ? 'Max: $1000+' : `Max: $${tempPriceRange}`}</span>
                        </div>
                        <input type="range" min={0} max={1000} value={tempPriceRange} onChange={(e) => setTempPriceRange(Number(e.target.value))} className="w-full accent-indigo-600" />
                      </div>
                    </div>
                    {/* [섹션 2] 🌐 Sites - Hub, 한 줄에 3~4개 짧고 굵은 칩 */}
                    <div>
                      <h3 className="text-xs font-semibold text-gray-800 uppercase tracking-wide mb-2 flex items-center gap-1"><span aria-hidden>🌐</span> Sites</h3>
                      <div className="flex flex-wrap gap-2">
                        {[...SITE_OPTIONS.domestic, ...SITE_OPTIONS.international].map((site: { name: string }) => {
                          const checked = tempSelectedSites.includes(site.name);
                          return (
                            <button
                              key={site.name}
                              type="button"
                              onClick={() => setTempSelectedSites((p) => checked ? p.filter((s) => s !== site.name) : [...p, site.name])}
                              className={`py-2 px-3 rounded-lg text-xs font-medium whitespace-nowrap transition-colors border ${
                                checked ? "bg-indigo-600 border-transparent text-white font-bold shadow-md" : "bg-white border-slate-200 text-slate-700 hover:bg-slate-50"
                              }`}
                            >
                              {site.name}
                            </button>
                          );
                        })}
                      </div>
                    </div>
                    {/* [섹션 3] ⚡ Speed & Price - 표준 회색 라인 칩 */}
                    <div>
                      <h3 className="text-xs font-semibold text-gray-800 uppercase tracking-wide mb-2 flex items-center gap-1"><span aria-hidden>⚡</span> Shipping Speed</h3>
                      <div className="flex flex-wrap gap-2">
                        {SHIPPING_SPEED_OPTIONS.map((label) => {
                          const checked = tempSelectedSpeeds.includes(label);
                          return (
                            <button
                              key={label}
                              type="button"
                              onClick={() => setTempSelectedSpeeds((p) => checked ? p.filter((s) => s !== label) : [...p, label])}
                              className={`py-2 px-3 rounded-lg text-xs font-medium whitespace-nowrap transition-colors border ${
                                checked ? "bg-indigo-600 border-transparent text-white font-bold shadow-md" : "bg-white border-slate-200 text-slate-700 hover:bg-slate-50"
                              }`}
                            >
                              {label}
                            </button>
                          );
                        })}
                      </div>
                    </div>
                    <div className="pt-3">
                      <button type="button" onClick={() => { setPriceRange(tempPriceRange); setSelectedSites(tempSelectedSites); setSelectedSpeeds(tempSelectedSpeeds); }} disabled={priceRange === tempPriceRange && areStringArraysEqual(selectedSites, tempSelectedSites) && areStringArraysEqual(selectedSpeeds, tempSelectedSpeeds)} className="mt-2 w-full rounded-lg bg-indigo-600 text-white text-xs font-semibold py-2 hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors">Apply Filters</button>
                    </div>
                  </div>
                </div>
              </div>
            </aside>
            </div>
            )}
            <div className="min-w-0 overflow-visible">
          {/* 홈 섹션: 로그인 시 AI Picks, 비로그인 시 Trending */}
          {!searched && (
            <section className="w-full mb-6">
              <div className="flex items-center justify-between mb-3 gap-2">
                <h2 className="text-sm font-semibold text-slate-800 uppercase tracking-wide">Loading real products...</h2>
              </div>
              <div className="grid grid-cols-1 gap-4 lg:grid-cols-2 lg:gap-4">
                {/* Domestic 컬럼 */}
                <div className="flex flex-col min-w-0 w-full">
                  <div className="w-full border-b border-slate-200 bg-white flex-shrink-0 box-border mb-2">
                    <div className="flex items-center gap-2 w-full px-4 pt-3 pb-1 min-w-0 box-border">
                      <span className="text-xl flex-shrink-0">🇺🇸</span>
                      <h3 className="text-lg font-bold text-slate-800">Domestic (Fast)</h3>
                    </div>
                    <div className="px-4 pb-3 pt-1">
                      <p className="text-xs text-slate-500">US Stock • Fast Delivery</p>
                    </div>
                  </div>
                  <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 lg:gap-3 w-full">
                    {[1, 2, 3, 4, 5, 6].map((i) => (
                      <div key={i} className="rounded-xl border border-slate-100 overflow-hidden bg-slate-50 animate-pulse">
                        <div className="h-52 bg-slate-200" />
                        <div className="p-3 space-y-2">
                          <div className="h-3 bg-slate-200 rounded w-full" />
                          <div className="h-3 bg-slate-200 rounded w-4/5" />
                          <div className="h-5 bg-slate-200 rounded w-1/3 mt-2" />
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
                <div className="flex flex-col min-w-0 w-full">
                  <div className="w-full border-b border-slate-200 bg-white flex-shrink-0 box-border mb-2">
                    <div className="flex items-center gap-2 w-full px-4 pt-3 pb-1 min-w-0 box-border">
                      <span className="text-xl flex-shrink-0">🌏</span>
                      <h3 className="text-lg font-bold text-slate-800">Global (Cheap)</h3>
                    </div>
                    <div className="px-4 pb-3 pt-1">
                      <p className="text-xs text-slate-500">Global Direct • Lowest Price</p>
                    </div>
                  </div>
                  <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 lg:gap-3 w-full">
                    {[1, 2, 3, 4, 5, 6].map((i) => (
                      <div key={i} className="rounded-xl border border-slate-100 overflow-hidden bg-slate-50 animate-pulse">
                        <div className="h-52 bg-slate-200" />
                        <div className="p-3 space-y-2">
                          <div className="h-3 bg-slate-200 rounded w-full" />
                          <div className="h-3 bg-slate-200 rounded w-4/5" />
                          <div className="h-5 bg-slate-200 rounded w-1/3 mt-2" />
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </section>
          )}

          {/* All Categories 버튼: md~lg에서만 표시 (모바일은 하단 네비 Categories 사용) */}
          <div className="hidden md:block lg:hidden mb-3">
            <button
              type="button"
              onClick={() => setMobileMenuOpen(true)}
              className="h-14 w-full inline-flex items-center justify-center gap-2 px-4 rounded-xl bg-indigo-600 text-white text-sm font-medium hover:bg-indigo-700 transition-colors"
              aria-label="All Categories"
            >
              <span className="text-lg" aria-hidden>☰</span>
              <span>All Categories</span>
            </button>
          </div>

          {/* Mobile Category Drawer: 풀스크린 모바일 드로어 (h-14 버튼 + 화살표) */}
          {mobileMenuOpen && (
            <div className="fixed inset-0 z-[10001] flex md:hidden" aria-modal="true">
              <div className="absolute inset-0 bg-white flex flex-col">
                <div className="flex items-center justify-between px-4 py-3 border-b border-slate-200 shrink-0">
                  <span className="text-lg font-semibold text-slate-800">Categories</span>
                  <button
                    type="button"
                    onClick={() => setMobileMenuOpen(false)}
                    className="p-2 rounded-full text-slate-500 hover:bg-slate-100 hover:text-slate-800"
                    aria-label="Close"
                  >
                    <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
                  </button>
                </div>
                <div className="flex-1 overflow-y-auto">
                  {CATEGORY_TREE.map((cat) => {
                    const isOpen = mobileActiveMain === cat.id;
                    return (
                      <div key={cat.id} className="border-b border-slate-100">
                        <button
                          type="button"
                          onClick={() => setMobileActiveMain(isOpen ? null : cat.id)}
                          className="w-full h-14 flex items-center justify-between px-4 text-base text-slate-800 hover:bg-slate-50 active:bg-slate-100 transition-colors"
                        >
                          <span className="flex items-center gap-3">
                            <span className="text-xl">{cat.icon}</span>
                            <span className="font-medium">{cat.label}</span>
                          </span>
                          <span className="text-slate-400">
                            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" /></svg>
                          </span>
                        </button>
                        {isOpen && (
                          <div className="bg-slate-50 border-t border-slate-100">
                            {cat.subCategories.map((sub) => (
                              <button
                                key={sub.label}
                                type="button"
                                onClick={async () => {
                                  setQuery(sub.label);
                                  setMainCategory(cat.id);
                                  setSubCategory(sub.label);
                                  setMobileMenuOpen(false);
                                  setIsHomeMode(false);
                                  await executeSearch(sub.label, cat.id, sub.label);
                                }}
                                className="w-full h-12 flex items-center justify-between px-4 pl-12 text-sm text-slate-700 hover:bg-white active:bg-slate-50 border-b border-slate-100/80 last:border-b-0"
                              >
                                <span>{sub.label}</span>
                                <svg className="w-4 h-4 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" /></svg>
                              </button>
                            ))}
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>
          )}

          {/* 4. 일반 시민: 검색 결과 그리드 - z-0으로 최하단 */}
              {searched && (
              <>
              {/* 검색 결과 0건: Empty State (PC·모바일 동일) */}
              {showEmptyState ? (
                <EmptyState
                  query={query}
                  onKeywordClick={(kw) => executeSearch(kw, mainCategory, subCategory)}
                />
              ) : (
              <>
              {/* Fallback 모드: 0건 검색 후 대체 검색으로 채운 경우 — 배너로 명시 */}
              {isFallbackMode && (
                <div className="mb-4 rounded-xl border border-amber-200 bg-amber-50/90 px-4 py-4 flex flex-col sm:flex-row sm:items-start gap-3">
                  <span className="shrink-0 text-2xl" aria-hidden>💡</span>
                  <div>
                    <p className="font-semibold text-slate-800">
                      No results found for &quot;{query}&quot;.
                    </p>
                    <p className="mt-1 text-sm text-slate-600">
                      We couldn&apos;t find exact matches, but we picked these {session ? 'Personalized' : 'Trending'} items for you!
                    </p>
                  </div>
                </div>
              )}
              {/* 규칙 기반 AI 브리핑: 검색 모드에서만 표시. PC: 요약 박스 우측에 Shipping Guide 버튼 통합 */}
              {!isHomeMode && !isFallbackMode && (
              <SearchInsight
                domestic={domestic}
                international={international}
                loading={loading}
                rightAction={
                  <button
                    type="button"
                    onClick={() => setShowShippingGuide(true)}
                    className="hidden sm:inline-flex items-center gap-1.5 px-3 py-2 rounded-lg border border-slate-200 bg-white text-xs font-medium text-slate-700 hover:text-indigo-600 hover:border-indigo-200 hover:bg-indigo-50/80 transition-colors"
                    aria-label="Shipping Guide"
                  >
                    <span aria-hidden>📦</span>
                    Shipping Guide
                  </button>
                }
              />
              )}
              {/* 모바일/태블릿: Filter 버튼만 (Shipping Guide는 FilterBar 칩으로 이동) */}
              {!isHomeMode && (
              <div className="lg:hidden flex justify-end gap-2 mt-2 mb-2">
                <button
                  type="button"
                  onClick={() => setIsMobileFilterOpen(true)}
                  className="inline-flex items-center gap-2 px-4 py-2 rounded-xl border border-slate-200 bg-white text-sm font-medium text-slate-700 hover:bg-slate-50 shadow-sm"
                >
                  <svg className="w-5 h-5 text-slate-600" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden>
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 4a1 1 0 011-1h16a1 1 0 011 1v2.586a1 1 0 01-.293.707l-6.414 6.414a1 1 0 00-.293.707V17l-4 4v-6.586a1 1 0 00-.293-.707L3.293 7.293A1 1 0 013 6.586V4z" />
                  </svg>
                  Filter
                </button>
              </div>
              )}
              <div className="relative z-0 grid grid-cols-1 gap-4 lg:grid-cols-2 lg:gap-4">
              {/* Domestic Column - 헤더 border-b와 콘텐츠 박스 라인 일치(동일 px) */}
              <section className="flex flex-col min-w-0 w-full">
                <div className="w-full border-b border-slate-200 bg-white flex-shrink-0 box-border sticky top-0 z-[40] bg-white">
                  <div className="flex items-center gap-2 w-full px-4 pt-3 pb-1 min-w-0 box-border">
                    <span className="text-xl flex-shrink-0">🇺🇸</span>
                    <h2 className="text-lg font-bold text-slate-800 min-w-0 flex items-baseline gap-2 flex-wrap">
                      <span className="truncate">Domestic (Fast){homeBadgeDisplayText ? ` · ${homeBadgeDisplayText}` : ''}</span>
                      {!isHomeMode && !isFallbackMode && (
                      <span className="text-sm text-slate-500 font-normal shrink-0">({metadata?.domesticCount ?? domestic.length} items)</span>
                      )}
                    </h2>
                  </div>
                  <div className="flex items-center justify-between w-full px-4 pb-3 pt-1 box-border flex-wrap gap-2 min-h-[24px]">
                    {isHomeMode ? (
                      <p className="text-sm text-slate-500">{getDomesticSubtitle()}</p>
                    ) : (
                      <>
                        <div className="min-h-[24px] flex items-center min-w-0">
                          <p className="text-xs text-slate-500">{homeHeaderText || 'US Stock • Fast Delivery'}</p>
                        </div>
                        <div className="flex items-center gap-2 shrink-0">
                          <label className="flex items-center gap-1 text-xs text-slate-700">
                            <span>Sort by</span>
                            <select
                              value={sortBy}
                              onChange={(e) =>
                                setSortBy(e.target.value as 'relevance' | 'price_asc' | 'price_desc')
                              }
                              className="border border-slate-200 rounded-md text-xs px-2 py-1 bg-white focus:outline-none focus:ring-1 focus:ring-indigo-500"
                            >
                              <option value="relevance">Best Match</option>
                              <option value="price_asc">Price: Low to High</option>
                              <option value="price_desc">Price: High to Low</option>
                            </select>
                          </label>
                        </div>
                      </>
                    )}
                  </div>
                </div>

                {/* Content - 헤더와 동일 px-4, 박스감 일치 */}
                <div className="px-4 py-3 w-full min-w-0 box-border">
                  {loading ? (
                    <div className="space-y-4">
                      <div className="text-center text-sm text-slate-700 mb-2">
                        {isHomeMode
                          ? (session ? 'Loading picks for you...' : 'Loading trending...')
                          : 'Comparing prices...'}
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
                    <div className="text-center py-12 text-slate-600 text-sm">
                      <p>No products found in this category</p>
                    </div>
                  ) : (
                    <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 lg:gap-3 w-full">
                      {displayedDomestic.map((item, index) => (
                        <div key={`${item.id}-${index}`} className="min-w-0 w-full">
                          <ProductCard product={item} type="domestic" onWishlistChange={(added) => showToastMessage(added ? "Saved to your list" : "Removed from saved")} onProductClick={handleProductClick} />
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </section>

              {/* Right Column: 🌏 Global - 헤더/콘텐츠 라인 일치 */}
              <section className="flex flex-col min-w-0 w-full">
                <div className="w-full border-b border-slate-200 bg-white flex-shrink-0 box-border sticky top-0 z-[40] bg-white">
                  <div className="flex items-center gap-2 w-full px-4 pt-3 pb-1 min-w-0 box-border">
                    <span className="text-xl flex-shrink-0">🌏</span>
                    <h2 className="text-lg font-bold text-slate-800 min-w-0 flex items-baseline gap-2 flex-wrap">
                      <span className="truncate">Global (Cheap){homeBadgeDisplayText ? ` · ${homeBadgeDisplayText}` : ''}</span>
                      {!isHomeMode && !isFallbackMode && (
                      <span className="text-sm text-slate-500 font-normal shrink-0">({metadata?.internationalCount ?? international.length} items)</span>
                    )}
                    </h2>
                  </div>
                  <div className="flex items-center justify-between w-full px-4 pb-3 pt-1 box-border min-h-[24px]">
                    {isHomeMode ? (
                      <p className="text-sm text-slate-500">{getGlobalSubtitle()}</p>
                    ) : (
                      <>
                        <div className="min-h-[24px] flex items-center min-w-0">
                          <p className="text-xs text-slate-500">{homeHeaderText || 'Global Direct • Lowest Price'}</p>
                        </div>
                        <label className="flex items-center gap-1 text-xs text-slate-700 shrink-0">
                          <span>Sort by</span>
                          <select
                            value={sortBy}
                            onChange={(e) =>
                              setSortBy(e.target.value as 'relevance' | 'price_asc' | 'price_desc')
                            }
                            className="border border-slate-200 rounded-md text-xs px-2 py-1 bg-white focus:outline-none focus:ring-1 focus:ring-indigo-500"
                          >
                            <option value="relevance">Best Match</option>
                            <option value="price_asc">Price: Low to High</option>
                            <option value="price_desc">Price: High to Low</option>
                          </select>
                        </label>
                      </>
                    )}
                  </div>
                </div>

                {/* Content - 헤더와 동일 px-4, 박스감 일치 */}
                <div className="px-4 py-3 w-full min-w-0 box-border">
                  {loading ? (
                    <div className="space-y-4">
                      <div className="text-center text-sm text-slate-700 mb-2">
                        {isHomeMode
                          ? (session ? 'Loading picks for you...' : 'Loading trending...')
                          : 'Comparing prices...'}
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
                    <div className="text-center py-12 text-slate-600 text-sm">
                      <p>No products found in this category</p>
                    </div>
                  ) : (
                    <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 lg:gap-3 w-full">
                      {displayedInternational.map((item, index) => (
                        <div key={`${item.id}-${index}`} className="min-w-0 w-full">
                          <ProductCard product={item} type="international" onWishlistChange={(added) => showToastMessage(added ? "Saved to your list" : "Removed from saved")} onProductClick={handleProductClick} />
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </section>
              </div>

              {/* Show More: visibleCount 기반 더 보기 (PC) */}
              {hasMoreResults && (
                <div className="mt-6 pb-4 flex justify-center">
                  <button
                    type="button"
                    onClick={handleShowMore}
                    disabled={loadingMore}
                    className="w-[300px] py-3 rounded-full bg-white border border-purple-200 text-purple-700 font-semibold shadow-sm hover:bg-purple-50 hover:shadow-md transition-all disabled:opacity-70 disabled:cursor-not-allowed"
                  >
                    {loadingMore ? (
                      <span className="inline-flex items-center gap-2">
                        <svg className="animate-spin h-5 w-5 text-purple-600" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" aria-hidden="true">
                          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                        </svg>
                        Loading...
                      </span>
                    ) : (
                      '👇 Show More Results'
                    )}
                  </button>
                </div>
              )}
              </>
              )}
            </>
          )}

            </div>
          </div>
          </div>
        </div>
      </main>

      <BottomNav
        activeTab={isHomeMode ? 'home' : 'search'}
        session={session}
        onCategoriesClick={() => setIsCategoryOpen(true)}
        onSearchClick={() => {
          if (typeof window !== 'undefined' && window.matchMedia('(max-width: 767px)').matches) {
            setIsSearchOverlayOpen(true);
          } else {
            searchInputRef.current?.focus();
          }
        }}
      />

      <CategoryScreen
        isOpen={isCategoryOpen}
        onClose={() => setIsCategoryOpen(false)}
        categories={CATEGORY_TREE}
        onSelectCategory={(mainId, subLabel, detailItem) => {
          const query = detailItem ?? subLabel;
          setQuery(query);
          setMainCategory(mainId as MainCategory);
          setSubCategory(subLabel);
          setIsCategoryOpen(false);
          setIsHomeMode(false);
          executeSearch(query, mainId as MainCategory, subLabel);
        }}
      />

      {/* Mobile Filter Overlay: 풀스크린 흰색 모달, 헤더 Filter + X, 푸터 View Results (쿠팡 스타일) */}
      <ShippingGuideModal open={showShippingGuide} onClose={() => setShowShippingGuide(false)} />
      {isMobileFilterOpen && searched && (
        <div className="fixed inset-0 z-[10000] flex flex-col bg-white lg:hidden" aria-modal="true" role="dialog">
          <header className="flex items-center justify-between px-4 py-3 border-b border-slate-200 shrink-0">
            <h2 className="text-lg font-semibold text-slate-800">Filter</h2>
            <button
              type="button"
              onClick={() => setIsMobileFilterOpen(false)}
              className="p-2 rounded-full text-slate-500 hover:bg-slate-100 hover:text-slate-800 transition-colors"
              aria-label="Close"
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
            </button>
          </header>
          <div className="flex-1 overflow-y-auto overflow-x-hidden px-4 py-3 pb-24 space-y-4">
            {/* [섹션 1] ✨ AI Smart Filters - PC와 동일 구조 */}
            <section className="bg-purple-50/80 border border-purple-200 rounded-xl p-4">
              <h3 className="font-semibold text-slate-800 uppercase tracking-wide text-sm flex items-center gap-1.5 mb-0.5">
                <span aria-hidden>✨</span> AI Smart Filters
              </h3>
              <p className="text-xs text-slate-600 mb-3">Refine with AI-Recommended Filters</p>
              {aiFiltersLoading ? (
                <div className="flex flex-wrap gap-2">
                  {[1, 2, 3, 4, 5].map((i) => (
                    <div key={i} className="h-9 w-20 rounded-lg bg-purple-200/60 animate-pulse" />
                  ))}
                </div>
              ) : Object.keys(aiFilterOptions).length === 0 ? (
                <p className="text-xs text-slate-500">Search to see AI filters.</p>
              ) : (
                <div className="space-y-2">
                  {Object.entries(aiFilterOptions).map(([groupName, values]) => (
                    <div key={groupName}>
                      <p className="font-semibold text-slate-700 text-xs mb-2">{groupName}</p>
                      <div className="flex flex-wrap gap-2">
                        {values.map((label) => {
                          const id = `ai-${groupName}-${String(label).toLowerCase().replace(/\s+/g, "-").replace(/[^a-z0-9-]/g, "")}`;
                          const checked = selectedAiFilters.has(id);
                          return (
                            <button
                              key={id}
                              type="button"
                              onClick={() => {
                                setSelectedAiFilters((prev) => {
                                  const next = new Set(prev);
                                  if (checked) next.delete(id);
                                  else next.add(id);
                                  return next;
                                });
                              }}
                              className={`py-2 px-3 rounded-lg text-xs font-medium whitespace-nowrap max-w-[11rem] truncate transition-colors border ${
                                checked ? "bg-indigo-600 border-transparent text-white font-bold shadow-md" : "bg-white border-slate-200 text-slate-700 hover:bg-slate-50"
                              }`}
                            >
                              {label}
                            </button>
                          );
                        })}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </section>

            {/* [섹션 2] Filters - PC와 동일: Price → Sites → Shipping Speed */}
            <section className="bg-slate-50/80 border border-slate-200 rounded-xl p-4">
              <h3 className="font-semibold text-slate-800 uppercase tracking-wide text-sm mb-0.5">Filters</h3>
              <p className="text-xs text-slate-500 mb-3">Fine-tune your results by price, site and speed.</p>
              <div className="space-y-4">
                <div>
                  <h4 className="text-xs font-semibold text-gray-800 uppercase tracking-wide mb-2 flex items-center gap-1"><span aria-hidden>⚡</span> Price Range (USD)</h4>
                  <div className="flex items-center justify-between text-[11px] text-black mb-1">
                    <span>$0</span>
                    <span className="font-semibold">{tempPriceRange >= 1000 ? 'Max: $1000+' : `Max: $${tempPriceRange}`}</span>
                  </div>
                  <input type="range" min={0} max={1000} value={tempPriceRange} onChange={(e) => setTempPriceRange(Number(e.target.value))} className="w-full h-3 accent-indigo-600 mb-2" />
                </div>
                <div>
                  <h4 className="text-xs font-semibold text-gray-800 uppercase tracking-wide mb-2 flex items-center gap-1"><span aria-hidden>🌐</span> Sites</h4>
                  <div className="flex flex-wrap gap-2">
                    {[...SITE_OPTIONS.domestic, ...SITE_OPTIONS.international].map((site: { name: string }) => {
                      const checked = tempSelectedSites.includes(site.name);
                      return (
                        <button
                          key={site.name}
                          type="button"
                          onClick={() => {
                            setTempSelectedSites((p) =>
                              checked ? p.filter((s) => s !== site.name) : [...p, site.name]
                            );
                          }}
                          className={`py-2 px-3 rounded-lg text-xs font-medium whitespace-nowrap transition-colors border ${
                            checked ? "bg-indigo-600 border-transparent text-white font-bold shadow-md" : "bg-white border-slate-200 text-slate-700 hover:bg-slate-50"
                          }`}
                        >
                          {site.name}
                        </button>
                      );
                    })}
                  </div>
                </div>
                <div>
                  <h4 className="text-xs font-semibold text-gray-800 uppercase tracking-wide mb-2 flex items-center gap-1"><span aria-hidden>⚡</span> Shipping Speed</h4>
                  <div className="flex flex-wrap gap-2">
                    {SHIPPING_SPEED_OPTIONS.map((label) => {
                      const checked = tempSelectedSpeeds.includes(label);
                      return (
                        <button
                          key={label}
                          type="button"
                          onClick={() => {
                            setTempSelectedSpeeds((p) =>
                              checked ? p.filter((s) => s !== label) : [...p, label]
                            );
                          }}
                          className={`py-2 px-3 rounded-lg text-xs font-medium whitespace-nowrap transition-colors border ${
                            checked ? "bg-indigo-600 border-transparent text-white font-bold shadow-md" : "bg-white border-slate-200 text-slate-700 hover:bg-slate-50"
                          }`}
                        >
                          {label}
                        </button>
                      );
                    })}
                  </div>
                </div>
              </div>
            </section>
          </div>
          <footer className="sticky bottom-0 left-0 right-0 p-4 border-t border-slate-200 bg-white safe-area-pb">
            <button
              type="button"
              onClick={() => { setPriceRange(tempPriceRange); setSelectedSites(tempSelectedSites); setSelectedSpeeds(tempSelectedSpeeds); setIsMobileFilterOpen(false); }}
              className="w-full py-4 rounded-xl bg-indigo-600 text-white font-bold text-base hover:bg-indigo-700 active:bg-indigo-800 transition-colors shadow-md"
            >
              View Results
            </button>
          </footer>
        </div>
      )}

      {/* 쿠팡 스타일 검색 집중 모드 (모바일 전용): 검색창 focus 시 풀스크린 오버레이 */}
      <SearchOverlay
        isOpen={isSearchOverlayOpen}
        onClose={() => setIsSearchOverlayOpen(false)}
        query={query}
        setQuery={(q) => setQuery(q)}
        onSearch={(q) => {
          setQuery(q);
          setIsHomeMode(false);
          executeSearch(q, mainCategory, subCategory);
          setIsSearchOverlayOpen(false);
        }}
        recentSearches={recentSearches}
        onRemoveItem={removeRecentSearch}
        onClearAll={clearRecentSearches}
        suggestions={suggestions}
        onSuggestionSelect={(term) => {
          setQuery(term);
          setIsHomeMode(false);
          executeSearch(term, mainCategory, subCategory);
          setIsSearchOverlayOpen(false);
        }}
      />
      {/* 토스트 알림: 찜 추가/제거 피드백 */}
      {toastMessage && (
        <div
          className={`fixed left-1/2 -translate-x-1/2 bottom-20 z-[9999] flex items-center gap-2 bg-slate-800/90 text-white px-4 py-2 rounded-full shadow-lg transition-all duration-300 ${
            showToast ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'
          }`}
          aria-live="polite"
        >
          <span className="text-white shrink-0">✓</span>
          <span>{toastMessage}</span>
        </div>
      )}


      {/* Login promotion modal for free search limit */}
      {showLimitModal && (
        <div className="fixed inset-0 z-[130] flex items-center justify-center bg-black/40">
          <div className="w-full max-w-md rounded-2xl bg-white p-6 shadow-xl">
            <h2 className="mb-2 text-xl font-bold text-slate-800">Free search limit reached</h2>
            <p className="mb-4 text-sm text-slate-600">
              You have used all 5 free searches for today. Please sign in with Google for unlimited searches.
            </p>
            <div className="flex justify-end gap-2">
              <button
                type="button"
                onClick={() => setShowLimitModal(false)}
                className="rounded-lg border border-gray-200 px-4 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-50"
              >
                Close
              </button>
              <button
                type="button"
                onClick={async () => {
                  try {
                    await supabase.auth.signInWithOAuth({
                      provider: 'google',
                      options: {
                        redirectTo: `${typeof window !== 'undefined' ? window.location.origin : ''}/auth/callback`,
                      },
                    });
                  } catch (error) {
                    console.error('Login failed:', error);
                  }
                }}
                className="rounded-lg bg-indigo-600 px-4 py-2 text-sm font-semibold text-white hover:bg-indigo-700"
              >
                Sign in with Google
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default function Home() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen bg-slate-50 flex items-center justify-center">
          <div>Loading...</div>
        </div>
      }
    >
      <HomeContent />
    </Suspense>
  );
}
