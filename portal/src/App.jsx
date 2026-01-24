import React, { useState, useEffect } from 'react';
import { 
  Search, User, LogOut, Grid, Truck, Plane, ShoppingCart, X, Menu, ChevronDown, ChevronRight, ChevronLeft, Globe,
  Smartphone, Home, Shirt, Dumbbell, Heart, Sparkles, 
  BookOpen, Gamepad2, Car, PawPrint,
  Laptop, Tablet, Speaker, Camera, Watch, Tv, Monitor,
  Armchair, Utensils, Bed, ShowerHead, Lamp, Package, Lightbulb, TreePine, Wrench,
  Footprints, Wallet, Gem, Clock, ShoppingBag, Snowflake,
  Mountain, Users, Waves, Bike, Tent,
  Pill, Activity, Stethoscope, Apple, Cross, Wind,
  Palette, Scissors, Flower, Droplet, Leaf, Gift,
  Book, GraduationCap, Headphones,
  Puzzle, Blocks, Baby, Atom,
  Settings, Circle,
  Dog, Cat, Fish, Bird, Rabbit, Bone
} from 'lucide-react';
import SearchResults from './components/SearchResults';
import { useAuth } from './contexts/AuthContext';
import { useWishlist } from './contexts/WishlistContext'; // 중복 선언 해결 완료!
import { getMockProductsByStore } from './data/mockData';
import { addAmazonAffiliateTag } from './utils/affiliate';

// 가격 검증 및 파싱 유틸리티 함수
const parsePrice = (price) => {
  if (!price || price === null || price === undefined) {
    return null;
  }
  
  // 문자열인 경우 숫자 추출
  if (typeof price === 'string') {
    // "Check price", "Out of stock" 같은 텍스트 제외
    const invalidTexts = ['check price', 'out of stock', 'n/a', 'na', 'unavailable', 'sold out', 'coming soon'];
    const lowerPrice = price.toLowerCase().trim();
    if (invalidTexts.some(text => lowerPrice.includes(text))) {
      return null;
    }
    
    // 숫자만 추출 (통화 기호, 쉼표 제거)
    const numericValue = parseFloat(price.replace(/[^0-9.-]/g, ''));
    if (isNaN(numericValue) || numericValue <= 0) {
      return null;
    }
    return numericValue;
  }
  
  // 숫자인 경우
  if (typeof price === 'number') {
    return price > 0 ? price : null;
  }
  
  return null;
};

const isValidPrice = (price) => {
  const parsed = parsePrice(price);
  return parsed !== null && parsed > 0;
};

// formatPrice 함수는 컴포넌트 내부에서 환율을 받아서 사용하도록 변경됨
// (아래 컴포넌트 내부에 정의)

const translations = {
  US: { 
    loading: 'Finding the best deals worldwide...', 
    placeholder: 'Search for any product...',
    sections: {
      recommended: 'Recommended for You',
      topDeals: 'Top Deals by Store',
      seasonalBanner: 'Seasonal Specials',
      searchResults: 'Search Results',
      wishlist: 'Wishlist',
      compare: 'Compare Prices'
    },
    categories: {
      electronics: 'Electronics',
      fashion: 'Fashion',
      home: 'Home & Living',
      beauty: 'Beauty',
      sports: 'Sports',
      automotive: 'Automotive',
      books: 'Books',
      toys: 'Toys & Games',
      health: 'Health & Wellness',
      pet: 'Pet Supplies'
    },
    buttons: {
      search: 'Search',
      addToWishlist: 'Add to Wishlist',
      removeFromWishlist: 'Remove',
      viewDetails: 'View Details',
      compare: 'Compare',
      buyNow: 'Buy Now',
      checkPrice: 'Check Price on Store',
      save: 'Save',
      close: 'Close'
    },
    faq: {
      title: 'How to use Portal',
      items: [
        {
          question: 'How does it work?',
          answer: 'Portal is a global shopping portal that allows you to search and compare products from major shopping malls worldwide at once. When you search for a product, it compares prices across multiple stores to find the lowest price for you.'
        },
        {
          question: 'How do I find the lowest priced products?',
          answer: 'Search results are automatically sorted by price, and the total cost including shipping and taxes is calculated to display the cheapest option at the top. You can compare prices, shipping costs, and estimated delivery times at a glance.'
        },
        {
          question: 'Are international shipping costs calculated?',
          answer: 'Yes, Portal calculates the total cost including international shipping and customs duties. You can select shipping methods (air, sea) by country, and check shipping costs and estimated delivery times for each method.'
        },
        {
          question: 'Which stores are supported?',
          answer: 'We support 20 major US shopping malls including Amazon, Walmart, eBay, Temu, Target, Best Buy, Home Depot, Costco, Wayfair, Apple, AliExpress, Macy\'s, Lowe\'s, Shein, Kohl\'s, Sephora, Chewy, Etsy, Newegg, and Zappos. Popular stores are displayed first based on your country settings.'
        },
        {
          question: 'How do I pay?',
          answer: 'Portal only provides price comparison services. Actual purchases are made on each store\'s website. When you select the lowest priced product, you will be redirected to that store where you can use their existing payment methods.'
        },
        {
          question: 'Can I change the language and currency?',
          answer: 'Yes, you can change the language, country/region, and currency by clicking the global settings button in the top right. When you change settings, popular stores and currency for that country will be updated.'
        }
      ]
    }
  },
  KR: { 
    loading: '전 세계 최저가를 찾는 중입니다...', 
    placeholder: '전 세계 상품 검색...',
    sections: {
      recommended: '고객님을 위한 추천',
      topDeals: '오늘의 핫딜',
      seasonalBanner: '시즌 특가',
      searchResults: '검색 결과',
      wishlist: '위시리스트',
      compare: '가격 비교'
    },
    categories: {
      electronics: '전자기기',
      fashion: '패션',
      home: '홈/리빙',
      beauty: '뷰티',
      sports: '스포츠',
      automotive: '자동차',
      books: '도서',
      toys: '장난감/게임',
      health: '건강/웰니스',
      pet: '반려동물용품'
    },
    buttons: {
      search: '검색',
      addToWishlist: '위시리스트 추가',
      removeFromWishlist: '제거',
      viewDetails: '상세보기',
      compare: '비교하기',
      buyNow: '구매하기',
      checkPrice: '스토어에서 가격 확인',
      save: '저장',
      close: '닫기'
    },
    faq: {
      title: 'Portal 사용 방법',
      items: [
        {
          question: '어떻게 작동하나요?',
          answer: 'Portal은 전 세계 주요 쇼핑몰의 상품을 한 번에 검색하고 비교할 수 있는 글로벌 쇼핑 포털입니다. 원하는 상품을 검색하면 여러 스토어의 가격을 비교하여 최저가를 찾아드립니다.'
        },
        {
          question: '최저가 상품을 어떻게 찾나요?',
          answer: '검색 결과는 자동으로 가격순으로 정렬되며, 배송비와 세금을 포함한 총 비용을 계산하여 가장 저렴한 옵션을 상단에 표시합니다. 각 상품의 가격, 배송비, 예상 배송 시간을 한눈에 비교할 수 있습니다.'
        },
        {
          question: '해외 배송비도 계산되나요?',
          answer: '네, Portal은 해외 배송비와 관세를 포함한 총 비용을 계산합니다. 국가별 배송 방법(항공, 해상)을 선택할 수 있으며, 각 방법에 따른 배송비와 예상 소요 시간을 확인할 수 있습니다.'
        },
        {
          question: '어떤 스토어를 지원하나요?',
          answer: '미국 시장의 주요 쇼핑몰을 지원합니다: Amazon, Walmart, eBay, Temu, Target, Best Buy, Home Depot, Costco, Wayfair, Apple, AliExpress, Macy\'s, Lowe\'s, Shein, Kohl\'s, Sephora, Chewy, Etsy, Newegg, Zappos 등 20개 스토어. 인기 스토어가 우선 표시됩니다.'
        },
        {
          question: '결제는 어떻게 하나요?',
          answer: 'Portal은 가격 비교 서비스만 제공하며, 실제 구매는 각 스토어의 웹사이트에서 진행됩니다. 최저가 상품을 선택하면 해당 스토어로 이동하여 기존 결제 방식을 사용할 수 있습니다.'
        },
        {
          question: '언어와 통화를 변경할 수 있나요?',
          answer: '네, 상단 우측의 글로벌 설정 버튼을 클릭하여 언어, 국가/지역, 통화를 변경할 수 있습니다. 설정을 변경하면 해당 국가의 인기 스토어와 통화로 표시가 업데이트됩니다.'
        }
      ]
    }
  },
};

// AI 추천 컴포넌트
const AISuggestions = ({ wishlistPreferences, currency, formatPrice }) => {
  const { wishlist } = useWishlist();
  
  // 위시리스트 기반 추천 로직
  const getRecommendations = () => {
    let rawRecommendations = [];
    
    if (wishlist.length === 0) {
      // 위시리스트가 없으면 인기 상품 표시
      rawRecommendations = [
        { id: 1, name: 'Wireless Earbuds', price: '$29.99', site: 'Target', image: null },
        { id: 2, name: 'Smart Watch', price: '$199.99', site: 'Walmart', image: null },
        { id: 3, name: '4K TV 55"', price: '$449.99', site: 'Best Buy', image: null },
        { id: 4, name: 'Laptop Backpack', price: '$24.99', site: 'Amazon', image: null },
        { id: 5, name: 'Air Purifier', price: '$89.99', site: 'Target', image: null },
      ];
    } else {
      // 위시리스트의 선호 브랜드와 카테고리 키워드를 기반으로 추천
      const { preferredBrands, categoryKeywords } = wishlistPreferences;
      rawRecommendations = wishlist.slice(0, 5).map((item, idx) => ({
        ...item,
        id: item.id || idx,
      }));
    }
    
    // 가격 필터링 강화: 유효한 가격만 필터링
    const validRecommendations = rawRecommendations.filter(item => {
      const isValid = isValidPrice(item.price);
      if (!isValid && item.price) {
        console.error(`[AI Recommendations] Invalid price detected:`, {
          store: item.site || 'Unknown',
          product: item.name || item.title,
          price: item.price,
          id: item.id
        });
      }
      return isValid;
    });
    
    return validRecommendations;
  };

  const recommendations = getRecommendations();

  return (
    <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-5 gap-4">
      {(() => {
        const safeRecommendations = recommendations || [];
        if (!Array.isArray(safeRecommendations) || safeRecommendations.length === 0) {
          return <div className="text-center py-8 text-gray-500">No recommendations available.</div>;
        }
        return safeRecommendations.map((product) => (
        <button
          key={product.id}
          onClick={() => {
            // 최저가 비교 검색 실행
            if (window.handleProductClick) {
              window.handleProductClick(product);
            }
          }}
          className="bg-white p-4 rounded-xl border border-gray-100 shadow-sm hover:shadow-lg hover:border-indigo-300 transition-all text-left"
        >
          <div className="bg-gray-200 aspect-square rounded-lg mb-3 flex items-center justify-center">
            {product.image ? (
              <img 
                src={product.image} 
                alt={product.name} 
                className="w-full h-full object-cover rounded-lg" 
                loading="lazy"
                decoding="async"
              />
            ) : (
              <span className="text-gray-400 text-xs">{product.site || 'Product'}</span>
            )}
          </div>
          <p className="text-xs text-indigo-600 font-semibold mb-1">{product.site || 'Brand'}</p>
          <h4 className="text-sm font-medium text-gray-900 mb-2 line-clamp-2">{product.name || product.title}</h4>
          {formatPrice(product.price, currency) ? (
            <p className="text-lg font-bold text-gray-900">{formatPrice(product.price, currency)}</p>
          ) : (
            <button className="text-sm text-indigo-600 font-semibold hover:text-indigo-700 underline">
              Check Price on Store
            </button>
          )}
        </button>
        ));
      })()}
    </div>
  );
};

// 사이트별 베스트셀러 컴포넌트 (10개 상품, 5x2 그리드)
const SiteBestSellers = ({ selectedSite, country, currency, formatPrice }) => {
  // Mock Data에서 상품 가져오기 (API 한도 초과 시 사용)
  const mockProducts = getMockProductsByStore(selectedSite);
  
  // 기존 sampleProducts는 Mock Data가 없을 때만 사용 (하위 호환성)
  const sampleProducts = {
    Target: [
      { id: 1, name: 'Roomba Robot Vacuum', price: '$199.99', image: null },
      { id: 2, name: 'KitchenAid Mixer', price: '$179.99', image: null },
      { id: 3, name: 'Nest Thermostat', price: '$119.99', image: null },
      { id: 4, name: 'Dyson V15 Vacuum', price: '$599.99', image: null },
      { id: 5, name: 'Instant Pot Duo', price: '$89.99', image: null },
      { id: 6, name: 'AirPods Pro 2', price: '$249.99', image: null },
      { id: 7, name: 'Samsung 55" TV', price: '$449.99', image: null },
      { id: 8, name: 'Nike Air Max', price: '$129.99', image: null },
      { id: 9, name: 'LEGO Star Wars Set', price: '$79.99', image: null },
      { id: 10, name: 'Yeti Tumbler', price: '$34.99', image: null },
    ],
    Walmart: [
      { id: 11, name: 'ONN TV 50" 4K', price: '$228.00', image: null },
      { id: 12, name: 'HyperX Gaming Headset', price: '$49.99', image: null },
      { id: 13, name: 'Mainstays Mattress', price: '$79.99', image: null },
      { id: 14, name: 'Ozark Trail Cooler', price: '$29.99', image: null },
      { id: 15, name: 'Great Value Coffee', price: '$4.98', image: null },
      { id: 16, name: 'Equate Vitamins', price: '$8.97', image: null },
      { id: 17, name: 'Onn Streaming Device', price: '$19.88', image: null },
      { id: 18, name: 'Timex Watch', price: '$24.99', image: null },
      { id: 19, name: 'Hanes T-Shirt Pack', price: '$12.98', image: null },
      { id: 20, name: 'Better Homes Bedding', price: '$19.99', image: null },
    ],
    'Best Buy': [
      { id: 21, name: '4K Ultra HD TV 55"', price: '$449.99', image: null },
      { id: 22, name: 'Gaming Mouse', price: '$49.99', image: null },
      { id: 23, name: 'Wireless Earbuds', price: '$29.99', image: null },
      { id: 24, name: 'MacBook Air M2', price: '$999.99', image: null },
      { id: 25, name: 'Sony WH-1000XM5', price: '$399.99', image: null },
      { id: 26, name: 'Nintendo Switch OLED', price: '$349.99', image: null },
      { id: 27, name: 'iPad Air', price: '$599.99', image: null },
      { id: 28, name: 'Samsung Galaxy Watch', price: '$249.99', image: null },
      { id: 29, name: 'LG Monitor 27"', price: '$199.99', image: null },
      { id: 30, name: 'Logitech Keyboard', price: '$79.99', image: null },
    ],
    Amazon: [
      { id: 31, name: 'Echo Dot 5th Gen', price: '$29.99', image: null },
      { id: 32, name: 'Fire TV Stick 4K', price: '$24.99', image: null },
      { id: 33, name: 'Kindle Paperwhite', price: '$99.99', image: null },
      { id: 34, name: 'Ring Doorbell', price: '$99.99', image: null },
      { id: 35, name: 'Blink Security Camera', price: '$29.99', image: null },
      { id: 36, name: 'Amazon Basics Backpack', price: '$19.99', image: null },
      { id: 37, name: 'Echo Show 8', price: '$79.99', image: null },
      { id: 38, name: 'Fire Tablet 10"', price: '$149.99', image: null },
      { id: 39, name: 'Alexa Smart Plug', price: '$24.99', image: null },
      { id: 40, name: 'Amazon Basics Charger', price: '$12.99', image: null },
    ],
    // 미국 시장 20개 스토어
    'eBay': [
      { id: 71, name: 'Vintage Watch Collection', price: '$89.99', image: null },
      { id: 72, name: 'Gaming Console Bundle', price: '$299.99', image: null },
      { id: 73, name: 'Designer Handbag', price: '$199.99', image: null },
      { id: 74, name: 'Smartphone Unlocked', price: '$449.99', image: null },
      { id: 75, name: 'Vintage Camera', price: '$129.99', image: null },
      { id: 76, name: 'Collectible Action Figure', price: '$39.99', image: null },
      { id: 77, name: 'Vintage Vinyl Records', price: '$24.99', image: null },
      { id: 78, name: 'Antique Jewelry', price: '$179.99', image: null },
      { id: 79, name: 'Rare Book Collection', price: '$59.99', image: null },
      { id: 80, name: 'Vintage Electronics', price: '$79.99', image: null },
    ],
    'Temu': [
      { id: 81, name: 'Budget Phone Case', price: '$4.99', image: null },
      { id: 82, name: 'Affordable Home Decor', price: '$9.99', image: null },
      { id: 83, name: 'Cheap Fashion Accessories', price: '$6.99', image: null },
      { id: 84, name: 'Budget Electronics', price: '$12.99', image: null },
      { id: 85, name: 'Affordable Kitchen Tools', price: '$8.99', image: null },
      { id: 86, name: 'Budget Beauty Products', price: '$5.99', image: null },
      { id: 87, name: 'Cheap Phone Accessories', price: '$3.99', image: null },
      { id: 88, name: 'Affordable Pet Supplies', price: '$7.99', image: null },
      { id: 89, name: 'Budget Fitness Gear', price: '$11.99', image: null },
      { id: 90, name: 'Cheap Home Organization', price: '$9.99', image: null },
    ],
    'Home Depot': [
      { id: 91, name: 'Power Drill Set', price: '$79.99', image: null },
      { id: 92, name: 'Paint Brush Set', price: '$19.99', image: null },
      { id: 93, name: 'Garden Tools Kit', price: '$49.99', image: null },
      { id: 94, name: 'Light Fixture', price: '$89.99', image: null },
      { id: 95, name: 'Hardware Toolbox', price: '$39.99', image: null },
      { id: 96, name: 'Lawn Mower', price: '$299.99', image: null },
      { id: 97, name: 'Paint Roller Set', price: '$14.99', image: null },
      { id: 98, name: 'Screwdriver Set', price: '$24.99', image: null },
      { id: 99, name: 'Extension Cord', price: '$12.99', image: null },
      { id: 100, name: 'Work Gloves', price: '$9.99', image: null },
    ],
    'Costco': [
      { id: 101, name: 'Bulk Paper Towels', price: '$24.99', image: null },
      { id: 102, name: 'Family Size Snacks', price: '$18.99', image: null },
      { id: 103, name: 'Bulk Toilet Paper', price: '$19.99', image: null },
      { id: 104, name: 'Large Coffee Pack', price: '$29.99', image: null },
      { id: 105, name: 'Bulk Cleaning Supplies', price: '$34.99', image: null },
      { id: 106, name: 'Family Size Detergent', price: '$22.99', image: null },
      { id: 107, name: 'Bulk Batteries', price: '$16.99', image: null },
      { id: 108, name: 'Large Pack Water', price: '$8.99', image: null },
      { id: 109, name: 'Bulk Pet Food', price: '$39.99', image: null },
      { id: 110, name: 'Family Size Cereal', price: '$12.99', image: null },
    ],
    'Wayfair': [
      { id: 111, name: 'Modern Sofa', price: '$599.99', image: null },
      { id: 112, name: 'Dining Table Set', price: '$449.99', image: null },
      { id: 113, name: 'Bedroom Dresser', price: '$299.99', image: null },
      { id: 114, name: 'Coffee Table', price: '$199.99', image: null },
      { id: 115, name: 'Bookshelf', price: '$149.99', image: null },
      { id: 116, name: 'Accent Chair', price: '$179.99', image: null },
      { id: 117, name: 'TV Stand', price: '$249.99', image: null },
      { id: 118, name: 'Nightstand', price: '$89.99', image: null },
      { id: 119, name: 'Dining Chairs Set', price: '$199.99', image: null },
      { id: 120, name: 'Console Table', price: '$129.99', image: null },
    ],
    'Apple': [
      { id: 121, name: 'iPhone 15 Pro', price: '$999.99', image: null },
      { id: 122, name: 'MacBook Pro 14"', price: '$1,999.99', image: null },
      { id: 123, name: 'AirPods Pro', price: '$249.99', image: null },
      { id: 124, name: 'iPad Pro', price: '$799.99', image: null },
      { id: 125, name: 'Apple Watch Series 9', price: '$399.99', image: null },
      { id: 126, name: 'MacBook Air M2', price: '$1,199.99', image: null },
      { id: 127, name: 'AirPods Max', price: '$549.99', image: null },
      { id: 128, name: 'Magic Keyboard', price: '$149.99', image: null },
      { id: 129, name: 'Magic Mouse', price: '$79.99', image: null },
      { id: 130, name: 'Apple Pencil', price: '$129.99', image: null },
    ],
    'Macy\'s': [
      { id: 131, name: 'Designer Handbag', price: '$199.99', image: null },
      { id: 132, name: 'Fashion Watch', price: '$149.99', image: null },
      { id: 133, name: 'Perfume Set', price: '$79.99', image: null },
      { id: 134, name: 'Designer Sunglasses', price: '$129.99', image: null },
      { id: 135, name: 'Jewelry Set', price: '$89.99', image: null },
      { id: 136, name: 'Designer Wallet', price: '$99.99', image: null },
      { id: 137, name: 'Fashion Scarf', price: '$39.99', image: null },
      { id: 138, name: 'Designer Belt', price: '$79.99', image: null },
      { id: 139, name: 'Luxury Candle', price: '$29.99', image: null },
      { id: 140, name: 'Designer Keychain', price: '$19.99', image: null },
    ],
    'Lowe\'s': [
      { id: 141, name: 'Paint Gallon', price: '$34.99', image: null },
      { id: 142, name: 'Hardware Tool Set', price: '$49.99', image: null },
      { id: 143, name: 'Garden Hose', price: '$24.99', image: null },
      { id: 144, name: 'Light Bulb Pack', price: '$12.99', image: null },
      { id: 145, name: 'Paint Brush Kit', price: '$18.99', image: null },
      { id: 146, name: 'Extension Ladder', price: '$89.99', image: null },
      { id: 147, name: 'Tool Storage Box', price: '$39.99', image: null },
      { id: 148, name: 'Garden Shovel', price: '$14.99', image: null },
      { id: 149, name: 'Paint Roller', price: '$8.99', image: null },
      { id: 150, name: 'Hardware Screws Pack', price: '$6.99', image: null },
    ],
    'Shein': [
      { id: 151, name: 'Trendy Top', price: '$12.99', image: null },
      { id: 152, name: 'Fashion Dress', price: '$19.99', image: null },
      { id: 153, name: 'Casual Pants', price: '$15.99', image: null },
      { id: 154, name: 'Stylish Jacket', price: '$24.99', image: null },
      { id: 155, name: 'Fashion Shoes', price: '$29.99', image: null },
      { id: 156, name: 'Trendy Accessories', price: '$8.99', image: null },
      { id: 157, name: 'Fashion Bag', price: '$16.99', image: null },
      { id: 158, name: 'Stylish Jewelry', price: '$9.99', image: null },
      { id: 159, name: 'Trendy Hat', price: '$11.99', image: null },
      { id: 160, name: 'Fashion Scarf', price: '$7.99', image: null },
    ],
    'Kohl\'s': [
      { id: 161, name: 'Branded T-Shirt', price: '$19.99', image: null },
      { id: 162, name: 'Fashion Jeans', price: '$39.99', image: null },
      { id: 163, name: 'Casual Sneakers', price: '$49.99', image: null },
      { id: 164, name: 'Branded Hoodie', price: '$44.99', image: null },
      { id: 165, name: 'Fashion Jacket', price: '$59.99', image: null },
      { id: 166, name: 'Branded Shorts', price: '$24.99', image: null },
      { id: 167, name: 'Casual Pants', price: '$34.99', image: null },
      { id: 168, name: 'Fashion Dress', price: '$39.99', image: null },
      { id: 169, name: 'Branded Sweater', price: '$49.99', image: null },
      { id: 170, name: 'Fashion Accessories', price: '$14.99', image: null },
    ],
    'Sephora': [
      { id: 171, name: 'Luxury Foundation', price: '$49.99', image: null },
      { id: 172, name: 'Designer Perfume', price: '$89.99', image: null },
      { id: 173, name: 'High-End Lipstick', price: '$29.99', image: null },
      { id: 174, name: 'Luxury Skincare Set', price: '$79.99', image: null },
      { id: 175, name: 'Designer Mascara', price: '$24.99', image: null },
      { id: 176, name: 'Luxury Eyeshadow Palette', price: '$59.99', image: null },
      { id: 177, name: 'High-End Serum', price: '$69.99', image: null },
      { id: 178, name: 'Designer Blush', price: '$34.99', image: null },
      { id: 179, name: 'Luxury Face Mask', price: '$19.99', image: null },
      { id: 180, name: 'High-End Cleanser', price: '$39.99', image: null },
    ],
    'Chewy': [
      { id: 181, name: 'Premium Dog Food', price: '$49.99', image: null },
      { id: 182, name: 'Cat Litter', price: '$24.99', image: null },
      { id: 183, name: 'Dog Toys Pack', price: '$19.99', image: null },
      { id: 184, name: 'Cat Food', price: '$34.99', image: null },
      { id: 185, name: 'Pet Bed', price: '$39.99', image: null },
      { id: 186, name: 'Dog Leash Set', price: '$14.99', image: null },
      { id: 187, name: 'Cat Scratching Post', price: '$29.99', image: null },
      { id: 188, name: 'Pet Grooming Kit', price: '$24.99', image: null },
      { id: 189, name: 'Dog Treats', price: '$12.99', image: null },
      { id: 190, name: 'Pet Carrier', price: '$44.99', image: null },
    ],
    'Etsy': [
      { id: 191, name: 'Handmade Jewelry', price: '$34.99', image: null },
      { id: 192, name: 'Custom Art Print', price: '$24.99', image: null },
      { id: 193, name: 'Handmade Soap Set', price: '$19.99', image: null },
      { id: 194, name: 'Vintage Poster', price: '$29.99', image: null },
      { id: 195, name: 'Handmade Candle', price: '$16.99', image: null },
      { id: 196, name: 'Custom T-Shirt', price: '$24.99', image: null },
      { id: 197, name: 'Handmade Pottery', price: '$39.99', image: null },
      { id: 198, name: 'Vintage Decor', price: '$19.99', image: null },
      { id: 199, name: 'Handmade Bag', price: '$44.99', image: null },
      { id: 200, name: 'Custom Wall Art', price: '$34.99', image: null },
    ],
    'Newegg': [
      { id: 201, name: 'Gaming Graphics Card', price: '$499.99', image: null },
      { id: 202, name: 'Gaming Monitor', price: '$299.99', image: null },
      { id: 203, name: 'Mechanical Keyboard', price: '$89.99', image: null },
      { id: 204, name: 'Gaming Mouse', price: '$59.99', image: null },
      { id: 205, name: 'PC Case', price: '$79.99', image: null },
      { id: 206, name: 'Power Supply Unit', price: '$89.99', image: null },
      { id: 207, name: 'RAM Memory Kit', price: '$129.99', image: null },
      { id: 208, name: 'SSD Storage', price: '$79.99', image: null },
      { id: 209, name: 'CPU Cooler', price: '$49.99', image: null },
      { id: 210, name: 'Motherboard', price: '$199.99', image: null },
    ],
    'Zappos': [
      { id: 211, name: 'Running Shoes', price: '$119.99', image: null },
      { id: 212, name: 'Casual Sneakers', price: '$89.99', image: null },
      { id: 213, name: 'Dress Shoes', price: '$149.99', image: null },
      { id: 214, name: 'Boots', price: '$179.99', image: null },
      { id: 215, name: 'Sandals', price: '$49.99', image: null },
      { id: 216, name: 'Athletic Shoes', price: '$99.99', image: null },
      { id: 217, name: 'Fashion Sneakers', price: '$129.99', image: null },
      { id: 218, name: 'Hiking Boots', price: '$159.99', image: null },
      { id: 219, name: 'Slip-On Shoes', price: '$69.99', image: null },
      { id: 220, name: 'Formal Shoes', price: '$139.99', image: null },
    ],
    'AliExpress': [
      { id: 221, name: 'Budget Electronics', price: '$15.99', image: null },
      { id: 222, name: 'Phone Accessories', price: '$8.99', image: null },
      { id: 223, name: 'Home Decor Items', price: '$12.99', image: null },
      { id: 224, name: 'Fashion Accessories', price: '$6.99', image: null },
      { id: 225, name: 'Kitchen Gadgets', price: '$9.99', image: null },
      { id: 226, name: 'Beauty Products', price: '$7.99', image: null },
      { id: 227, name: 'Phone Cases', price: '$4.99', image: null },
      { id: 228, name: 'Jewelry Pieces', price: '$5.99', image: null },
      { id: 229, name: 'Tech Accessories', price: '$11.99', image: null },
      { id: 230, name: 'Home Organization', price: '$10.99', image: null },
    ],
  };

  // Mock Data 우선 사용, 없으면 sampleProducts 사용
  const rawProducts = mockProducts.length > 0 ? mockProducts : (sampleProducts[selectedSite] || []);
  
  // 가격 필터링 강화: 유효한 가격만 필터링 ($0, null, undefined 완전 제거)
  const products = rawProducts.filter(product => {
    // price_num이 있으면 우선 사용, 없으면 price에서 파싱
    const priceValue = product.price_num !== undefined 
      ? product.price_num 
      : parsePrice(product.price);
    
    const isValid = priceValue !== null && priceValue > 0;
    
    if (!isValid && product.price) {
      console.error(`[Top Deals by Store] Invalid price detected:`, {
        store: selectedSite,
        product: product.name,
        price: product.price,
        price_num: product.price_num,
        id: product.id
      });
    }
    return isValid;
  });

  return (
    <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4">
      {(() => {
        const safeProducts = products || [];
        if (!Array.isArray(safeProducts) || safeProducts.length === 0) {
          return (
            <div className="col-span-full text-center py-12">
              <div className="text-gray-500">Loading...</div>
            </div>
          );
        }
        return safeProducts.slice(0, 10).map((product) => {
          if (!product || typeof product !== 'object') return null;
          return (
          <div key={product.id} className="bg-white p-4 rounded-xl border border-gray-100 shadow-sm hover:shadow-md transition-shadow">
            <div className="bg-gray-200 aspect-square rounded-lg mb-3 flex items-center justify-center">
              <span className="text-gray-400 text-xs">{selectedSite}</span>
            </div>
            <p className="text-xs text-indigo-600 font-semibold mb-1">{selectedSite}</p>
            <h4 className="text-sm font-medium text-gray-900 mb-2 line-clamp-2">{product.name}</h4>
            {formatPrice && formatPrice(product.price, currency) ? (
              <p className="text-lg font-bold text-gray-900">{formatPrice(product.price, currency)}</p>
            ) : (
              <button className="text-sm text-indigo-600 font-semibold hover:text-indigo-700 underline">
                Check Price on Store
              </button>
            )}
          </div>
          );
        });
      })()}
    </div>
  );
};

function App() {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [lastSearchQuery, setLastSearchQuery] = useState('');
  const [displayedCount, setDisplayedCount] = useState(20);
  const [loadingMore, setLoadingMore] = useState(false);
  // localStorage에서 설정 불러오기 (MVP: US/KR만 지원)
  const [country, setCountry] = useState(() => {
    const saved = localStorage.getItem('portal_country');
    return saved === 'KR' ? 'KR' : 'US'; // US 또는 KR만 허용
  });
  const [language, setLanguage] = useState(() => {
    const saved = localStorage.getItem('portal_language');
    return saved === 'KO' ? 'KO' : 'EN'; // EN 또는 KO만 허용
  });
  const [currency, setCurrency] = useState(() => {
    const saved = localStorage.getItem('portal_currency');
    return saved === 'KRW' ? 'KRW' : 'USD'; // USD 또는 KRW만 허용
  });
  
  // 실시간 환율 상태 (USD 대 KRW)
  const [exchangeRate, setExchangeRate] = useState(() => {
    const saved = localStorage.getItem('portal_exchange_rate');
    return saved ? parseFloat(saved) : 1450; // 기본값 1,450원 (Fallback)
  });
  
  // 실시간 환율 API 호출 (앱 로드 시)
  React.useEffect(() => {
    const fetchExchangeRate = async () => {
      try {
        const response = await fetch('https://api.exchangerate-api.com/v4/latest/USD');
        if (!response.ok) {
          throw new Error('Failed to fetch exchange rate');
        }
        const data = await response.json();
        const krwRate = data.rates?.KRW;
        if (krwRate && typeof krwRate === 'number' && krwRate > 0) {
          setExchangeRate(krwRate);
          localStorage.setItem('portal_exchange_rate', krwRate.toString());
          console.log(`✅ 실시간 환율 업데이트: 1 USD = ${krwRate.toFixed(2)} KRW`);
        } else {
          throw new Error('Invalid exchange rate data');
        }
      } catch (error) {
        console.warn(`⚠️ 환율 API 호출 실패, Fallback 사용 (1,450원):`, error);
        // Fallback: 1,450원 사용
        setExchangeRate(1450);
      }
    };
    
    fetchExchangeRate();
    
    // 1시간마다 환율 갱신
    const interval = setInterval(fetchExchangeRate, 60 * 60 * 1000);
    return () => clearInterval(interval);
  }, []);
  
  // 설정 변경 시 localStorage에 저장
  React.useEffect(() => {
    localStorage.setItem('portal_country', country);
    localStorage.setItem('portal_language', language);
    localStorage.setItem('portal_currency', currency);
  }, [country, language, currency]);
  
  // formatPrice 함수 (컴포넌트 내부에서 환율 사용)
  const formatPrice = React.useCallback((price, currencyType = currency) => {
    const parsed = parsePrice(price);
    if (parsed === null) {
      return null; // UI에서 "Check Price on Store"로 대체
    }
    
    // 통화별 포맷팅 및 환율 계산
    if (currencyType === 'KRW') {
      // USD 가격에 실시간 환율 적용, 10원 단위 반올림
      const krwAmount = Math.round((parsed * exchangeRate) / 10) * 10;
      return `₩${krwAmount.toLocaleString('ko-KR')}`;
    } else if (currencyType === 'USD') {
      return `$${parsed.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
    } else {
      // MVP에서는 USD와 KRW만 지원, 나머지는 USD로 표시
      return `$${parsed.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
    }
  }, [currency, exchangeRate]); // currency와 exchangeRate가 변경되면 함수 재생성
  const [selectedSites, setSelectedSites] = useState([]);
  const [shippingMethod, setShippingMethod] = useState('all');
  const [showStoreFilter, setShowStoreFilter] = useState(false);
  const [showGlobalSettings, setShowGlobalSettings] = useState(false);
  const [showLoginModal, setShowLoginModal] = useState(false);
  const [hoveredCategory, setHoveredCategory] = useState(null);
  const [selectedCategory, setSelectedCategory] = useState(null);
  const [showCategoryDropdown, setShowCategoryDropdown] = useState(null);
  const [showCountryMenu, setShowCountryMenu] = useState(false);

  // 모달 상태 디버깅
  useEffect(() => {
    console.log('[App] showGlobalSettings changed to:', showGlobalSettings);
  }, [showGlobalSettings]);
  const { user, signInWithGoogle, signOut } = useAuth();
  const [showUserMenu, setShowUserMenu] = useState(false);
  const [isDesktop, setIsDesktop] = useState(false);
  const [selectedSiteTab, setSelectedSiteTab] = useState(() => {
    // 미국 시장 전용 - Amazon 기본값
    return 'Amazon';
  });
  const [showWishlistMenu, setShowWishlistMenu] = useState(false);
  const [sidebarOpen, setSidebarOpen] = useState(true); // 사이드바 열림/닫힘 상태
  const [expandedCategories, setExpandedCategories] = useState({}); // 아코디언 상태
  const [expandedFAQ, setExpandedFAQ] = useState({}); // FAQ 아코디언 상태
  const [selectedProduct, setSelectedProduct] = useState(null); // 최저가 비교용 선택된 상품
  const [compareResults, setCompareResults] = useState([]); // 비교 검색 결과
  const { wishlist, removeFromWishlist, getWishlistPreferences } = useWishlist();
  
  // 국가별 스토어 인기 순서 (구매량 기준) - 미국 시장 전면 개편
  const getStoreOrderByCountry = (countryCode) => {
    const storeOrders = {
      US: ['Amazon', 'Walmart', 'eBay', 'Temu', 'Target', 'Best Buy', 'Home Depot', 'Costco', 'Wayfair', 'Apple', 'AliExpress', 'Macy\'s', 'Lowe\'s', 'Shein', 'Kohl\'s', 'Sephora', 'Chewy', 'Etsy', 'Newegg', 'Zappos'],
      KR: ['Amazon', 'Walmart', 'eBay', 'Temu', 'Target', 'Best Buy'], // 한국 스토어 제거, 미국 스토어로 대체
      JP: ['Amazon', 'Rakuten', 'Yahoo Shopping', 'ZOZOTOWN'],
      CN: ['Taobao', 'Tmall', 'JD.com', 'Pinduoduo'],
      GB: ['Amazon', 'eBay', 'Argos', 'Tesco'],
      CA: ['Amazon', 'Walmart', 'Best Buy', 'Canadian Tire'],
      AU: ['Amazon', 'eBay', 'Kogan', 'JB Hi-Fi'],
      DE: ['Amazon', 'eBay', 'Zalando', 'MediaMarkt'],
      FR: ['Amazon', 'Cdiscount', 'Fnac', 'Carrefour'],
      IT: ['Amazon', 'eBay', 'Zalando', 'MediaWorld'],
      ES: ['Amazon', 'eBay', 'El Corte Inglés', 'Zara'],
    };
    return storeOrders[countryCode] || storeOrders.US;
  };

  // .env 기반 동적 스토어 목록 (환경변수에서 읽어오기, 없으면 기본값 사용)
  const availableStoresRaw = React.useMemo(() => {
    // Vite 환경변수에서 스토어 목록 읽기 (VITE_STORES=Target,Walmart,Best Buy 형식)
    const envStores = import.meta.env.VITE_STORES;
    if (envStores && typeof envStores === 'string') {
      return envStores.split(',').map(s => s.trim()).filter(Boolean);
    }
    // 기본값: 미국 시장 20개 스토어만 (한국 스토어 완전 제거)
    const usStores = ['Amazon', 'Walmart', 'eBay', 'Temu', 'Target', 'Best Buy', 'Home Depot', 'Costco', 'Wayfair', 'Apple', 'AliExpress', 'Macy\'s', 'Lowe\'s', 'Shein', 'Kohl\'s', 'Sephora', 'Chewy', 'Etsy', 'Newegg', 'Zappos'];
    return usStores;
  }, []);

  // 국가별 스토어 동적 정렬 (인기 순서) - 미국 시장 전용
  const availableStores = React.useMemo(() => {
    const countryOrder = getStoreOrderByCountry('US'); // 항상 미국 순서 사용
    const koreanStores = ['Coupang', '11st', 'Naver', 'Gmarket', 'Auction', 'Interpark'];
    
    // 국가별 인기 순서에 따라 정렬
    const ordered = [];
    const unordered = [];
    
    // 한국 스토어 완전 제거
    const filteredStores = availableStoresRaw.filter(store => !koreanStores.includes(store));
    
    // 국가별 인기 순서에 따라 정렬
    countryOrder.forEach(store => {
      if (filteredStores.includes(store)) {
        ordered.push(store);
      }
    });
    
    // 순서에 없는 스토어는 뒤에 추가
    filteredStores.forEach(store => {
      if (!ordered.includes(store)) {
        unordered.push(store);
      }
    });
    
    return [...ordered, ...unordered];
  }, [country, availableStoresRaw]);
  
  useEffect(() => {
    const checkDesktop = () => {
      setIsDesktop(window.innerWidth >= 768 && window.matchMedia('(hover: hover)').matches);
    };
    checkDesktop();
    window.addEventListener('resize', checkDesktop);
    return () => window.removeEventListener('resize', checkDesktop);
  }, []);
  
  const t = translations[country] || translations.US;

  // 시즌별 특별 태그 생성 함수
  const getSpecialDayTags = () => {
    const now = new Date();
    const month = now.getMonth() + 1; // 1-12
    const day = now.getDate(); // 1-31
    
    const specialTags = [];
    
    // 1월 하순~2월 초: Valentine's Day
    if ((month === 1 && day >= 20) || (month === 2 && day <= 14)) {
      specialTags.push({ emoji: '💝', text: 'Valentine\'s Day Gifts', query: 'valentine gifts romantic' });
      specialTags.push({ emoji: '❄️', text: 'Winter Clearance', query: 'winter sale clearance' });
    }
    
    // 3월~4월: Spring
    if (month >= 3 && month <= 4) {
      specialTags.push({ emoji: '🌸', text: 'Spring Essentials', query: 'spring fashion home decor' });
      specialTags.push({ emoji: '🪴', text: 'Spring Gardening', query: 'gardening tools plants' });
    }
    
    // 5월: Mother's Day
    if (month === 5) {
      specialTags.push({ emoji: '🎁', text: 'Mother\'s Day Specials', query: 'mothers day gifts' });
      specialTags.push({ emoji: '🪴', text: 'Spring Gardening', query: 'gardening tools plants' });
    }
    
    // 6월: Father's Day
    if (month === 6) {
      specialTags.push({ emoji: '👔', text: 'Father\'s Day Gifts', query: 'fathers day gifts' });
      specialTags.push({ emoji: '☀️', text: 'Summer Essentials', query: 'summer fashion outdoor' });
    }
    
    // 7월~8월: Summer
    if (month >= 7 && month <= 8) {
      specialTags.push({ emoji: '🏖️', text: 'Summer Vacation', query: 'beach essentials travel' });
      specialTags.push({ emoji: '☀️', text: 'Summer Sale', query: 'summer sale discount' });
    }
    
    // 9월: Back to School
    if (month === 9) {
      specialTags.push({ emoji: '📚', text: 'Back to School', query: 'school supplies laptops' });
      specialTags.push({ emoji: '🍂', text: 'Fall Fashion', query: 'fall clothing autumn' });
    }
    
    // 10월: Halloween
    if (month === 10) {
      specialTags.push({ emoji: '🎃', text: 'Halloween Specials', query: 'halloween costumes decorations' });
      specialTags.push({ emoji: '🍂', text: 'Fall Essentials', query: 'fall fashion home decor' });
    }
    
    // 11월: Black Friday Early Access
    if (month === 11) {
      specialTags.push({ emoji: '🖤', text: 'Black Friday Early Access', query: 'black friday deals' });
      specialTags.push({ emoji: '🦃', text: 'Thanksgiving Prep', query: 'thanksgiving kitchen home' });
    }
    
    // 12월: Holiday Season
    if (month === 12) {
      specialTags.push({ emoji: '🎄', text: 'Holiday Gifts', query: 'christmas gifts holiday' });
      specialTags.push({ emoji: '❄️', text: 'Winter Essentials', query: 'winter clothing accessories' });
    }
    
    return specialTags;
  };

  // 기본 추천 태그
  const defaultTags = [
    { emoji: '🎁', text: 'Gift Finder', query: 'gifts' },
    { emoji: '🏠', text: 'Home Essentials', query: 'home essentials' },
    { emoji: '🔥', text: 'Price Drop Alerts', query: 'sale discount' },
    { emoji: '👟', text: 'Runners', query: 'running shoes' },
    { emoji: '💄', text: 'Beauty', query: 'beauty products' },
    { emoji: '🎮', text: 'Gaming', query: 'gaming accessories' },
  ];

  // 시즌별 태그와 기본 태그 결합 (시즌 태그 우선)
  const recommendedTags = React.useMemo(() => {
    const special = getSpecialDayTags();
    // 시즌 태그가 있으면 앞에 배치, 없으면 기본 태그만 사용
    return special.length > 0 ? [...special, ...defaultTags] : defaultTags;
  }, []);

  // 시즌별 퀵 리본 데이터 생성 함수
  const getSeasonalRibbonItems = () => {
    const now = new Date();
    const month = now.getMonth() + 1; // 1-12
    const day = now.getDate(); // 1-31
    
    const ribbonItems = [];
    
    // 1월 하순~2월 초: Valentine's Day
    if ((month === 1 && day >= 20) || (month === 2 && day <= 14)) {
      ribbonItems.push(
        { emoji: '💝', text: 'Valentine\'s Day', query: 'valentine gifts romantic', previewQuery: 'valentine gifts' },
        { emoji: '🎁', text: 'For Her', query: 'gifts for her women', previewQuery: 'gifts for women' },
        { emoji: '🍫', text: 'Chocolate Deals', query: 'chocolate gifts valentine', previewQuery: 'chocolate' }
      );
    }
    
    // 3월~4월: Spring
    if (month >= 3 && month <= 4) {
      ribbonItems.push(
        { emoji: '🌸', text: 'Spring Fashion', query: 'spring clothing fashion', previewQuery: 'spring fashion' },
        { emoji: '🪴', text: 'Gardening', query: 'gardening tools plants', previewQuery: 'gardening' },
        { emoji: '🏡', text: 'Home Refresh', query: 'home decor spring', previewQuery: 'home decor' }
      );
    }
    
    // 5월: Mother's Day
    if (month === 5) {
      ribbonItems.push(
        { emoji: '🎁', text: 'Mother\'s Day', query: 'mothers day gifts', previewQuery: 'mothers day' },
        { emoji: '💐', text: 'Flowers & Gifts', query: 'flowers gifts mothers day', previewQuery: 'flowers' },
        { emoji: '🪴', text: 'Gardening', query: 'gardening tools plants', previewQuery: 'gardening' }
      );
    }
    
    // 6월: Father's Day
    if (month === 6) {
      ribbonItems.push(
        { emoji: '👔', text: 'Father\'s Day', query: 'fathers day gifts', previewQuery: 'fathers day' },
        { emoji: '🛠️', text: 'Tools & Tech', query: 'tools tech gadgets', previewQuery: 'tools' },
        { emoji: '☀️', text: 'Summer Prep', query: 'summer essentials', previewQuery: 'summer' }
      );
    }
    
    // 7월~8월: Summer
    if (month >= 7 && month <= 8) {
      ribbonItems.push(
        { emoji: '🏖️', text: 'Beach Essentials', query: 'beach vacation essentials', previewQuery: 'beach' },
        { emoji: '☀️', text: 'Summer Sale', query: 'summer sale discount', previewQuery: 'summer sale' },
        { emoji: '🎒', text: 'Travel Gear', query: 'travel luggage bags', previewQuery: 'travel' }
      );
    }
    
    // 9월: Back to School
    if (month === 9) {
      ribbonItems.push(
        { emoji: '📚', text: 'Back to School', query: 'school supplies laptops', previewQuery: 'school supplies' },
        { emoji: '💻', text: 'Tech for Students', query: 'laptops tablets students', previewQuery: 'laptops' },
        { emoji: '🍂', text: 'Fall Fashion', query: 'fall clothing autumn', previewQuery: 'fall fashion' }
      );
    }
    
    // 10월: Halloween
    if (month === 10) {
      ribbonItems.push(
        { emoji: '🎃', text: 'Halloween', query: 'halloween costumes decorations', previewQuery: 'halloween' },
        { emoji: '👻', text: 'Party Supplies', query: 'halloween party supplies', previewQuery: 'party supplies' },
        { emoji: '🍂', text: 'Fall Essentials', query: 'fall fashion home decor', previewQuery: 'fall' }
      );
    }
    
    // 11월: Black Friday
    if (month === 11) {
      ribbonItems.push(
        { emoji: '🖤', text: 'Black Friday', query: 'black friday deals', previewQuery: 'black friday' },
        { emoji: '🦃', text: 'Thanksgiving', query: 'thanksgiving kitchen home', previewQuery: 'thanksgiving' },
        { emoji: '🎁', text: 'Early Gifts', query: 'holiday gifts early', previewQuery: 'holiday gifts' }
      );
    }
    
    // 12월: Holiday Season
    if (month === 12) {
      ribbonItems.push(
        { emoji: '🎄', text: 'Holiday Gifts', query: 'christmas gifts holiday', previewQuery: 'christmas gifts' },
        { emoji: '❄️', text: 'Winter Essentials', query: 'winter clothing accessories', previewQuery: 'winter' },
        { emoji: '🎁', text: 'Last Minute', query: 'last minute gifts', previewQuery: 'gifts' }
      );
    }
    
    // 기본값 (시즌이 없을 경우)
    if (ribbonItems.length === 0) {
      ribbonItems.push(
        { emoji: '🔥', text: 'Hot Deals', query: 'sale discount deals', previewQuery: 'sale' },
        { emoji: '⭐', text: 'Best Sellers', query: 'best sellers popular', previewQuery: 'best sellers' },
        { emoji: '🆕', text: 'New Arrivals', query: 'new products latest', previewQuery: 'new' }
      );
    }
    
    return ribbonItems;
  };

  // 다중 테마 시스템 (Contextual Themes) - 현재 날짜와 계절 반영
  const getContextualThemes = () => {
    const now = new Date();
    const month = now.getMonth() + 1; // 1-12
    const day = now.getDate();
    const year = now.getFullYear();
    
    const themes = [];
    
    // Theme 1: Event-based (Valentine's Day - 1월 하순~2월 초)
    if ((month === 1 && day >= 20) || (month === 2 && day <= 14)) {
      themes.push({
        id: 'valentine',
        name: "Valentine's Day",
        query: 'valentine gifts romantic',
        bannerQuery: 'valentine gifts',
        emoji: '💝',
        icon: '💝',
        type: 'event'
      });
    }
    
    // Theme 2: Season-based (Winter Essentials - 1월, 2월, 12월, 현재 미국 날씨 반영)
    if (month === 1 || month === 2 || month === 12) {
      themes.push({
        id: 'winter',
        name: 'Winter Essentials',
        query: 'winter clothing warmers heating',
        bannerQuery: 'winter essentials',
        emoji: '❄️',
        icon: '❄️',
        type: 'season'
      });
    }
    
    // Theme 3: New Year (2026 New Start - 1월)
    if (month === 1) {
      themes.push({
        id: 'newyear',
        name: '2026 New Start',
        query: 'new year resolution fitness health',
        bannerQuery: 'new year 2026',
        emoji: '🎆',
        icon: '🎆',
        type: 'newyear'
      });
    }
    
    // 기본 테마 (테마가 없을 경우)
    if (themes.length === 0) {
      themes.push(
        {
          id: 'hotdeals',
          name: 'Hot Deals',
          query: 'sale discount deals',
          bannerQuery: 'sale',
          emoji: '🔥',
          icon: '🔥',
          type: 'default'
        }
      );
    }
    
    return themes;
  };

  // 다중 테마 목록
  const contextualThemes = React.useMemo(() => getContextualThemes(), [country]);
  
  const [selectedTheme, setSelectedTheme] = useState(null);
  const [themeProducts, setThemeProducts] = useState({}); // 각 테마별 상품 저장 (3개씩)
  const [currentSlide, setCurrentSlide] = useState(0);
  const [currentThemeIndex, setCurrentThemeIndex] = useState(0); // 현재 표시 중인 테마 인덱스
  const [currentProductIndex, setCurrentProductIndex] = useState(0); // 현재 테마 내 상품 인덱스 (0-2)
  const [hoveredRibbonItem, setHoveredRibbonItem] = useState(null);
  const [ribbonPreviewData, setRibbonPreviewData] = useState([]);
  const [loadingPreview, setLoadingPreview] = useState(false);
  const [loadingBanner, setLoadingBanner] = useState(false);
  const [recommendedScrollRef, setRecommendedScrollRef] = useState(null);
  const [canScrollLeft, setCanScrollLeft] = useState(false);
  const [canScrollRight, setCanScrollRight] = useState(true);

  // 초기 선택 테마 설정
  React.useEffect(() => {
    if (contextualThemes.length > 0 && !selectedTheme) {
      setSelectedTheme(contextualThemes[0]);
      setCurrentThemeIndex(0);
    }
  }, [contextualThemes, selectedTheme]);

  // 각 테마별 상품 로드 (각 테마당 인기 상품 3개씩)
  const loadThemeProducts = async (theme) => {
    if (!theme || !theme.bannerQuery) return;
    
    // 이미 로드된 테마는 스킵
    if (themeProducts[theme.id] && themeProducts[theme.id].length >= 3) {
      return;
    }
    
    setLoadingBanner(true);
    try {
      const response = await fetch("http://localhost:8000/search", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ query: theme.bannerQuery, country, shipping_method: shippingMethod }),
      });
      
      if (response.ok) {
        const data = await response.json();
        if (data.results && Array.isArray(data.results)) {
          const validResults = data.results
            .filter(item => {
              // 기본 필터링: 이미지와 이름/제목이 있어야 함
              if (!item || !item.image || !(item.name || item.title)) {
                return false;
              }
              
              // 가격 필터링 강화: 유효한 가격이 있어야 함
              const isValid = isValidPrice(item.price);
              if (!isValid && item.price) {
                console.error(`[Theme Products] Invalid price detected:`, {
                  theme: theme.name,
                  store: item.site || 'Unknown',
                  product: item.name || item.title,
                  price: item.price
                });
              }
              return isValid;
            })
            .slice(0, 3); // 각 테마당 인기 상품 3개
          
          setThemeProducts(prev => ({
            ...prev,
            [theme.id]: validResults
          }));
        }
      }
    } catch (err) {
      console.error('Theme load error:', err);
      setThemeProducts(prev => ({
        ...prev,
        [theme.id]: []
      }));
    } finally {
      setLoadingBanner(false);
    }
  };

  // 모든 테마 상품 로드
  React.useEffect(() => {
    contextualThemes.forEach(theme => {
      loadThemeProducts(theme);
    });
  }, [contextualThemes]);

  // 선택된 테마 변경 시 배너 업데이트 (첫 번째 상품부터 시작)
  React.useEffect(() => {
    if (selectedTheme) {
      setCurrentProductIndex(0);
      setCurrentSlide(0);
    }
  }, [selectedTheme]);

  // 테마별 릴레이 슬라이드 로직 (Nested Slider)
  React.useEffect(() => {
    if (contextualThemes.length === 0 || !selectedTheme) return;
    
    const themeProductsList = themeProducts[selectedTheme.id] || [];
    if (themeProductsList.length === 0) return;
    
    // 테마 내 상품 슬라이드 (3초 간격)
    const productInterval = setInterval(() => {
      setCurrentProductIndex((prev) => {
        const nextIndex = (prev + 1) % themeProductsList.length;
        return nextIndex;
      });
    }, 3000); // 3초마다 상품 전환
    
    // 테마 전환 (3개 상품 * 3초 = 9초 후 다음 테마로)
    const themeInterval = setInterval(() => {
      setCurrentThemeIndex((prev) => {
        const nextIndex = (prev + 1) % contextualThemes.length;
        const nextTheme = contextualThemes[nextIndex];
        if (nextTheme) {
          setSelectedTheme(nextTheme);
          setCurrentProductIndex(0); // 새 테마의 첫 번째 상품부터 시작
        }
        return nextIndex;
      });
    }, 9000); // 9초마다 테마 전환 (3개 상품 * 3초)
    
    return () => {
      clearInterval(productInterval);
      clearInterval(themeInterval);
    };
  }, [contextualThemes, selectedTheme, themeProducts]);

  // 현재 표시할 상품 (선택된 테마의 현재 상품 인덱스)
  const currentBannerProduct = React.useMemo(() => {
    if (!selectedTheme) return null;
    const products = themeProducts[selectedTheme.id] || [];
    return products[currentProductIndex] || products[0] || null;
  }, [selectedTheme, themeProducts, currentProductIndex]);

  // Recommended for You 스크롤 상태 초기 체크
  React.useEffect(() => {
    if (recommendedScrollRef) {
      const checkScroll = () => {
        const { scrollLeft, scrollWidth, clientWidth } = recommendedScrollRef;
        setCanScrollLeft(scrollLeft > 0);
        setCanScrollRight(scrollLeft < scrollWidth - clientWidth - 10);
      };
      
      // 초기 체크
      checkScroll();
      
      // 리사이즈 이벤트 리스너 추가
      window.addEventListener('resize', checkScroll);
      return () => window.removeEventListener('resize', checkScroll);
    }
  }, [recommendedScrollRef, recommendedTags]);

  // 호버 미리보기 데이터 로드
  const loadRibbonPreview = async (previewQuery) => {
    if (!previewQuery) return;
    
    setLoadingPreview(true);
    try {
      const response = await fetch("http://localhost:8000/search", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ query: previewQuery, country, shipping_method: shippingMethod }),
      });
      
      if (response.ok) {
        const data = await response.json();
        if (data.results && Array.isArray(data.results)) {
          const validResults = data.results
            .filter(item => {
              // 기본 필터링: 이미지와 이름/제목이 있어야 함
              if (!item || !item.image || !(item.name || item.title)) {
                return false;
              }
              
              // 가격 필터링 강화: 유효한 가격이 있어야 함
              const isValid = isValidPrice(item.price);
              if (!isValid && item.price) {
                console.error(`[Ribbon Preview] Invalid price detected:`, {
                  query: previewQuery,
                  store: item.site || 'Unknown',
                  product: item.name || item.title,
                  price: item.price
                });
              }
              return isValid;
            })
            .slice(0, 3);
          setRibbonPreviewData(validResults);
        }
      }
    } catch (err) {
      console.error('Preview load error:', err);
      setRibbonPreviewData([]);
    } finally {
      setLoadingPreview(false);
    }
  };


  // 카테고리 데이터
  const categories = [
    { name: 'Electronics', icon: Smartphone, subcategories: ['Smartphones', 'Laptops', 'Tablets', 'Audio', 'Cameras', 'Wearable Tech', 'Gaming', 'TV & Home Theater', 'Smart Home', 'Computer Accessories'] },
    { name: 'Home', icon: Home, subcategories: ['Furniture', 'Kitchen & Dining', 'Bedding', 'Bath', 'Home Decor', 'Storage & Organization', 'Lighting', 'Outdoor Living', 'Home Improvement', 'Cleaning Supplies'] },
    { name: 'Fashion', icon: Shirt, subcategories: ['Men\'s Clothing', 'Women\'s Clothing', 'Shoes', 'Accessories', 'Jewelry', 'Watches', 'Bags & Luggage', 'Underwear & Socks', 'Activewear', 'Seasonal Wear'] },
    { name: 'Sports', icon: Dumbbell, subcategories: ['Exercise & Fitness', 'Outdoor Sports', 'Team Sports', 'Water Sports', 'Winter Sports', 'Cycling', 'Running', 'Yoga & Pilates', 'Sports Equipment', 'Camping & Hiking'] },
    { name: 'Health', icon: Heart, subcategories: ['Vitamins & Supplements', 'Personal Care', 'Health Monitors', 'Medical Supplies', 'Wellness', 'Fitness Nutrition', 'Pain Relief', 'First Aid', 'Respiratory Care', 'Digestive Health'] },
    { name: 'Beauty', icon: Sparkles, subcategories: ['Skincare', 'Makeup', 'Hair Care', 'Fragrance', 'Men\'s Grooming', 'Nail Care', 'Tools & Accessories', 'Bath & Body', 'Natural & Organic', 'Gift Sets'] },
    { name: 'Books', icon: BookOpen, subcategories: ['Fiction', 'Non-Fiction', 'Children\'s Books', 'Textbooks', 'eBooks', 'Audiobooks', 'Magazines', 'Comics & Graphic Novels', 'Reference', 'Self-Help'] },
    { name: 'Toys', icon: Gamepad2, subcategories: ['Action Figures', 'Board Games', 'Building Sets', 'Dolls', 'Educational Toys', 'Electronic Toys', 'Outdoor Toys', 'Puzzles', 'STEM Toys', 'Video Games'] },
    { name: 'Automotive', icon: Car, subcategories: ['Car Care', 'Tools & Equipment', 'Parts & Accessories', 'Tires & Wheels', 'Interior Accessories', 'Exterior Accessories', 'Performance Parts', 'Motorcycle', 'RV & Trailer', 'Truck Accessories'] },
    { name: 'Pet Supplies', icon: PawPrint, subcategories: ['Dog Supplies', 'Cat Supplies', 'Fish & Aquatic', 'Bird Supplies', 'Small Animal', 'Reptile Supplies', 'Pet Health', 'Pet Food', 'Toys & Treats', 'Pet Grooming'] },
  ];

  // 카테고리 아코디언 토글
  const toggleCategory = (categoryName) => {
    setExpandedCategories(prev => ({
      ...prev,
      [categoryName]: !prev[categoryName]
    }));
  };

  const handleSearch = async (e, searchQuery = null) => {
    try {
      if (e) e.preventDefault();
      
      // 안전장치: searchQuery가 null이거나 undefined일 때 처리
      const searchTerm = searchQuery || query || '';
      if (!searchTerm || typeof searchTerm !== 'string' || !searchTerm.trim()) {
        console.warn('[handleSearch] Invalid search term:', searchTerm);
        setError(new Error('Invalid search term'));
        setLoading(false);
        return;
      }

      // 화이트 스크린 방지: 상태 초기화 전에 안전하게 처리
      setError(null);
      setLoading(true);
      setLastSearchQuery(searchTerm);
      setSelectedProduct(null); // 이전 선택 상품 초기화
      
      // 검색어를 input에도 반영
      if (searchQuery && typeof searchQuery === 'string') {
        setQuery(searchQuery);
      }
      const response = await fetch("http://localhost:8000/search", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ query: searchTerm, country, shipping_method: shippingMethod }),
      });
      
      if (!response.ok) {
        throw new Error(`Search failed: ${response.status}`);
      }
      
      const data = await response.json();
      
      // 데이터 유효성 검사 강화 + 가격 필터링
      if (data && data.results && Array.isArray(data.results) && data.results.length > 0) {
        // null/undefined 필터링 및 가격 검증
        const validResults = data.results.filter(item => {
          // 기본 필터링
          if (!item || typeof item !== 'object' || !(item.name || item.title) || !item.site) {
            return false;
          }
          
          // 가격 필터링 강화: 유효한 가격이 있어야 함
          const isValid = isValidPrice(item.price);
          if (!isValid && item.price) {
            console.error(`[Search Results] Invalid price detected:`, {
              store: item.site,
              product: item.name || item.title,
              price: item.price,
              searchTerm: searchTerm
            });
          }
          return isValid;
        });
        
        if (validResults.length > 0) {
          const sorted = [...validResults].sort((a, b) => {
            const score = (text) => {
              if (!text) return 0;
              const lowerText = String(text).toLowerCase();
              const lowerTerm = searchTerm.toLowerCase();
              return lowerText.includes(lowerTerm) ? 100 : 0;
            };
            return score(b.name || b.title) - score(a.name || a.title);
          });
          setResults(sorted);
          setDisplayedCount(20);
        } else {
          setResults([]);
        }
      } else {
        // 데이터가 없거나 빈 배열인 경우 안전하게 처리
        setResults([]);
        setError(null); // 에러가 아닌 경우이므로 null로 설정
      }
    } catch (err) {
      console.error('[handleSearch] Search error:', err);
      // 에러 발생 시에도 앱이 죽지 않도록 안전하게 처리
      setError(err instanceof Error ? err : new Error(String(err)));
      setResults([]); // 에러 시 빈 배열로 설정하여 화이트 스크린 방지
      setLastSearchQuery(''); // 검색어 초기화
    } finally {
      setLoading(false);
      // 검색 결과 영역으로 부드럽게 스크롤 (안전하게)
      try {
        setTimeout(() => {
          const resultsSection = document.getElementById('search-results-section');
          if (resultsSection) {
            resultsSection.scrollIntoView({ behavior: 'smooth', block: 'start' });
          }
        }, 100);
      } catch (scrollErr) {
        console.warn('[handleSearch] Scroll error:', scrollErr);
      }
    }
  };

  // 🚀 로고 클릭 시 화이트 스크린 방지 및 상태 초기화 로직 강화
  const handleHome = () => {
    setQuery('');
    setResults([]);
    setLastSearchQuery('');
    setError(null);
    setLoading(false);
    setSelectedCategory(null);
    setHoveredCategory(null);
    setShowCategoryDropdown(null);
    setShippingMethod('all');
    setSelectedSites([]);
    setDisplayedCount(20);
    setSelectedSiteTab('Target');
    setSelectedProduct(null);
    setCompareResults([]);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  // 최저가 비교 검색: 상품 클릭 시 실행
  const handleProductClick = async (product) => {
    const productName = product.name || product.title || '';
    if (!productName.trim()) return;

    // 선택된 상품 저장
    setSelectedProduct(product);
    
    // 검색 실행
    await handleSearch(null, productName);
    
    // 비교 검색 결과는 handleSearch에서 자동으로 results에 포함됨
    // 가격순 정렬
    setTimeout(() => {
      const sorted = [...results].sort((a, b) => {
        const priceA = parseFloat(a.price_num || 0);
        const priceB = parseFloat(b.price_num || 0);
        return priceA - priceB;
      });
      setCompareResults(sorted);
    }, 500);
  };

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      <nav className="w-full bg-white border-b sticky top-0 z-[9999] shadow-sm relative" style={{ zIndex: 9999 }}>
        <div className="max-w-7xl mx-auto px-4 h-16 flex justify-between items-center">
          <button
            onClick={handleHome} 
            className="text-4xl font-bold text-indigo-900 hover:text-indigo-700 transition-colors cursor-pointer"
          >
            Portal
          </button>
          
          <div className="flex items-center gap-6">
            {/* 글로벌 설정 버튼 - 스카이스캐너 스타일 (Border-less, 텍스트 링크) */}
            <button 
              type="button"
              onClick={(e) => {
                e.preventDefault();
                e.stopPropagation();
                console.log('[Settings Button] Clicked, opening modal. Current state:', showGlobalSettings);
                // 모달 열 때 현재 설정을 임시 상태로 복사
                setTempLanguage(language);
                setTempCountry(country);
                setTempCurrency(currency);
                console.log('[Settings Button] Setting showGlobalSettings to true');
                setShowGlobalSettings(true);
                console.log('[Settings Button] showGlobalSettings set to:', true);
              }}
              className="flex items-center gap-1.5 px-3 py-2 text-sm font-medium text-gray-700 hover:bg-gray-100/50 hover:text-gray-900 rounded-lg transition-colors cursor-pointer"
              style={{ pointerEvents: 'auto', position: 'relative', zIndex: 10001 }}
            >
              <Globe size={16} className="text-gray-600" />
              <span className="hidden sm:inline">
                {language === 'EN' ? 'EN' : language === 'KO' ? 'KO' : language} | {currency}
              </span>
            </button>
            <button onClick={() => setShowWishlistMenu(true)} className="relative p-2 text-gray-600 hover:bg-gray-100 rounded-lg transition-colors">
              <Heart className={wishlist.length > 0 ? 'fill-red-500 text-red-500' : ''} />
              {wishlist.length > 0 && <span className="absolute top-0 right-0 bg-red-500 text-white text-[10px] rounded-full w-4 h-4 flex items-center justify-center">{wishlist.length}</span>}
            </button>
            <button 
              type="button"
              onClick={(e) => {
                e.preventDefault();
                e.stopPropagation();
                if (user) {
                  signOut();
                } else {
                  setShowLoginModal(true);
                }
              }}
              className="px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-100/50 hover:text-gray-900 rounded-lg transition-colors uppercase cursor-pointer"
              style={{ pointerEvents: 'auto', position: 'relative', zIndex: 510 }}
            >
              {user ? user.displayName : (language === 'KO' ? '로그인' : 'LOGIN')}
            </button>
          </div>
        </div>
      </nav>

      {/* 로그인 모달 */}
      {showLoginModal && (
        <div className="fixed inset-0 bg-black/50 z-[300] flex items-center justify-center p-4" onClick={() => setShowLoginModal(false)}>
          <div className="bg-white rounded-lg shadow-xl max-w-md w-full border border-gray-200" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-between px-6 py-4 border-b border-gray-200">
              <h2 className="text-xl font-semibold text-gray-900">Sign in to Portal</h2>
              <button 
                onClick={() => setShowLoginModal(false)}
                className="p-1 hover:bg-gray-100 rounded transition-colors"
              >
                <X size={18} className="text-gray-500" />
              </button>
            </div>
            
            <div className="px-6 py-6 space-y-3">
              {/* Google Login */}
              <button
                onClick={() => {
                  alert("Login feature coming soon!");
                  setShowLoginModal(false);
                }}
                className="w-full flex items-center justify-center gap-3 px-4 py-3 border-2 border-gray-300 rounded-lg hover:bg-gray-50 transition-colors font-medium text-gray-700"
              >
                <svg className="w-5 h-5" viewBox="0 0 24 24">
                  <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                  <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                  <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
                  <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
                </svg>
                <span>Continue with Google</span>
              </button>
              
              {/* Apple Login */}
              <button
                onClick={() => {
                  alert("Login feature coming soon!");
                  setShowLoginModal(false);
                }}
                className="w-full flex items-center justify-center gap-3 px-4 py-3 border-2 border-gray-300 rounded-lg hover:bg-gray-50 transition-colors font-medium text-gray-700"
              >
                <Apple size={20} className="text-gray-900" />
                <span>Continue with Apple</span>
              </button>
              
              {/* Email Login */}
              <button
                onClick={() => {
                  alert("Login feature coming soon!");
                  setShowLoginModal(false);
                }}
                className="w-full flex items-center justify-center gap-3 px-4 py-3 border-2 border-gray-300 rounded-lg hover:bg-gray-50 transition-colors font-medium text-gray-700"
              >
                <span>Continue with Email</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 글로벌 설정 모달 - 스카이스캐너 스타일 미니멀 디자인 */}
      {showGlobalSettings && (
        <div 
          className="fixed inset-0 bg-black/50 flex items-center justify-center p-4" 
          style={{ zIndex: 10000 }}
          onClick={() => {
          // 모달 닫을 때 임시 상태를 현재 설정으로 리셋
          setTempLanguage(language);
          setTempCountry(country);
          setTempCurrency(currency);
          setShowGlobalSettings(false);
        }}>
          <div className="bg-white rounded-lg shadow-lg max-w-md w-full border border-gray-200" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-between px-6 py-4 border-b border-gray-200">
              <h2 className="text-lg font-semibold text-gray-900">{tempLanguage === 'KO' ? '설정' : 'Settings'}</h2>
              <button 
                onClick={() => {
                  // 모달 닫을 때 임시 상태를 현재 설정으로 리셋
                  setTempLanguage(language);
                  setTempCountry(country);
                  setTempCurrency(currency);
                  setShowGlobalSettings(false);
                }}
                className="p-1 hover:bg-gray-100 rounded transition-colors"
              >
                <X size={18} className="text-gray-500" />
              </button>
            </div>
            
            <div className="px-6 py-6 space-y-5">
              {/* 언어 선택 (임시 상태) */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">{tempLanguage === 'KO' ? '언어' : 'Language'}</label>
                <select
                  value={tempLanguage}
                  onChange={(e) => setTempLanguage(e.target.value)}
                  className="w-full px-3 py-2 border-b border-gray-300 bg-transparent focus:outline-none focus:border-indigo-500 text-sm"
                >
                  <option value="EN">English</option>
                  <option value="KO">한국어</option>
                </select>
              </div>

              {/* 국가/지역 선택 (임시 상태) */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">{tempLanguage === 'KO' ? '국가/지역' : 'Country/Region'}</label>
                <select
                  value={tempCountry}
                  onChange={(e) => {
                    setTempCountry(e.target.value);
                    // 국가 변경 시 통화 자동 업데이트 (임시 상태만)
                    if (e.target.value === 'US') {
                      setTempCurrency('USD');
                      setTempLanguage('EN');
                    } else if (e.target.value === 'KR') {
                      setTempCurrency('KRW');
                      setTempLanguage('KO');
                    }
                  }}
                  className="w-full px-3 py-2 border-b border-gray-300 bg-transparent focus:outline-none focus:border-indigo-500 text-sm"
                >
                  <option value="US">United States</option>
                  <option value="KR">South Korea</option>
                </select>
              </div>

              {/* 통화 선택 (임시 상태) */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">{tempLanguage === 'KO' ? '통화' : 'Currency'}</label>
                <select
                  value={tempCurrency}
                  onChange={(e) => setTempCurrency(e.target.value)}
                  className="w-full px-3 py-2 border-b border-gray-300 bg-transparent focus:outline-none focus:border-indigo-500 text-sm"
                >
                  <option value="USD">USD - US Dollar</option>
                  <option value="KRW">KRW - Korean Won</option>
                </select>
              </div>

              {/* 저장 버튼 (Save 클릭 시에만 실제 설정에 반영) */}
              <button
                onClick={() => {
                  // 임시 상태를 실제 전역 설정에 반영
                  setLanguage(tempLanguage);
                  setCountry(tempCountry);
                  setCurrency(tempCurrency);
                  
                  // localStorage에 저장
                  localStorage.setItem('portal_language', tempLanguage);
                  localStorage.setItem('portal_country', tempCountry);
                  localStorage.setItem('portal_currency', tempCurrency);
                  
                  // 국가별 기본 스토어 탭 설정
                  if (tempCountry === 'US') {
                    setSelectedSiteTab('Amazon');
                  } else if (tempCountry === 'KR') {
                    setSelectedSiteTab('Amazon');
                  }
                  
                  setShowGlobalSettings(false);
                }}
                className="w-full py-2.5 bg-indigo-600 text-white font-medium rounded-md hover:bg-indigo-700 transition-colors text-sm"
              >
                {tempLanguage === 'KO' ? '저장' : 'Save'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 메인 컨텐츠 영역: 사이드바 제거, 메인만 */}
      <div className="flex-1 flex">
        {/* 메인 컨텐츠 영역 */}
        <main className="flex-1 flex flex-col w-full">

          {/* Hero Section - 스카이스캐너형 검색 위젯 (화면 상단 1/3) */}
          <div className="w-full min-h-[600px] h-auto pb-32 relative bg-gradient-to-br from-slate-900 via-indigo-900 to-slate-800 overflow-visible">
            {/* 배경 이미지 딤 처리 (선택사항) */}
            <div className="absolute inset-0 bg-black/30"></div>
            
            {/* Hero Content */}
            <div className="relative z-10 h-full flex flex-col items-center justify-center px-4">
              {/* Row 1: 큰 타이틀 (위젯 위쪽, 배경색/그림자 추가) */}
              <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold text-center mb-10 md:mb-12" style={{ 
                color: '#FFFFFF', 
                textShadow: '2px 2px 8px rgba(0, 0, 0, 0.8), 0 0 20px rgba(0, 0, 0, 0.5)'
              }}>
                {language === 'KO' ? '어디서든 최고의 딜을 찾아, 당신의 문 앞까지' : 'The best deals from anywhere, to your door.'}
              </h1>
              
              {/* Row 2: 통합 검색 위젯 (너비 확장) */}
              <div className="w-full max-w-[1200px] mb-16">
                <form onSubmit={handleSearch} className="bg-white rounded-xl shadow-2xl p-6">
                  {/* Row 1: 상품 검색 (전체 폭, 높이 통일) */}
                  <div className="mb-4">
                    <label className="block text-xs font-semibold text-gray-600 uppercase mb-2">
                      <Search size={14} className="inline mr-1" />
                      {language === 'KO' ? '상품 검색' : 'Search Products'}
                    </label>
                    <input
                      type="text"
                      className="w-full h-14 px-4 border-2 border-gray-200 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 text-lg"
                      placeholder={t.placeholder}
                      value={query}
                      onChange={(e) => setQuery(e.target.value)}
                    />
                  </div>
                  
                  {/* Row 2: 스토어 선택 + 배송 옵션 (50% + 50%, 높이 통일) */}
                  <div className="flex flex-col md:flex-row gap-4 mb-4">
                    {/* 스토어 선택 (50%) */}
                    <div className="flex-1 relative">
                      <label className="block text-xs font-semibold text-gray-600 uppercase mb-2">
                        <Grid size={14} className="inline mr-1" />
                        {language === 'KO' ? '스토어 선택' : 'Select Stores'}
                      </label>
                      <button
                        type="button"
                        onClick={() => setShowStoreFilter(!showStoreFilter)}
                        className="w-full h-14 px-4 border-2 border-gray-200 rounded-lg hover:border-indigo-500 focus:ring-2 focus:ring-indigo-500 text-left flex items-center justify-between bg-white"
                      >
                        <span className="text-gray-700">
                          {selectedSites.length === 0 
                            ? (language === 'KO' ? '모든 스토어' : 'All Stores')
                            : `${selectedSites.length} ${language === 'KO' ? '개 선택' : 'selected'}`
                          }
                        </span>
                        <ChevronDown size={20} className={`text-gray-400 transition-transform ${showStoreFilter ? 'rotate-180' : ''}`} />
                      </button>
                      
                      {/* 스토어 필터 드롭다운 - z-index 높여서 다른 요소 위에 표시, overflow 해제 */}
                      {showStoreFilter && (
                        <div className="absolute top-full left-0 right-0 mt-2 bg-white border-2 border-gray-200 rounded-lg shadow-xl z-[9999] max-h-96 overflow-y-auto">
                          <div className="p-3 border-b border-gray-200 sticky top-0 bg-white z-10">
                            <div className="flex items-center justify-between mb-2">
                              <span className="text-xs font-semibold text-gray-700 uppercase">{language === 'KO' ? '스토어 선택' : 'Select Stores'}</span>
                              <button
                                type="button"
                                onClick={() => {
                                  if (selectedSites.length === availableStores.length) {
                                    setSelectedSites([]);
                                  } else {
                                    setSelectedSites([...availableStores]);
                                  }
                                }}
                                className="text-xs text-indigo-600 hover:text-indigo-700 font-medium"
                              >
                                {selectedSites.length === availableStores.length 
                                  ? (language === 'KO' ? '전체 해제' : 'Deselect All')
                                  : (language === 'KO' ? '전체 선택' : 'Select All')
                                }
                              </button>
                            </div>
                          </div>
                          <div className="p-2 space-y-1">
                            {(() => {
                              const safeStores = availableStores || [];
                              if (!Array.isArray(safeStores) || safeStores.length === 0) {
                                return <div className="text-center py-4 text-gray-500 text-sm">Loading stores...</div>;
                              }
                              return safeStores.map((store) => {
                                if (!store || typeof store !== 'string') return null;
                                const isSelected = selectedSites.length === 0 || selectedSites.includes(store);
                                return (
                                <label
                                  key={store}
                                  className="flex items-center gap-3 px-3 py-2 rounded-md hover:bg-gray-50 cursor-pointer transition-colors"
                                >
                                  <input
                                    type="checkbox"
                                    checked={isSelected}
                                    onChange={() => {
                                      if (selectedSites.length === 0) {
                                        setSelectedSites(availableStores.filter(s => s !== store));
                                      } else if (isSelected) {
                                        setSelectedSites(selectedSites.filter(s => s !== store));
                                      } else {
                                        setSelectedSites([...selectedSites, store]);
                                      }
                                    }}
                                    className="w-4 h-4 rounded border-gray-300 text-indigo-600 focus:ring-indigo-500 cursor-pointer"
                                  />
                                  <span className="text-sm text-gray-700 flex-1">{store}</span>
                                </label>
                                );
                              });
                            })()}
                          </div>
                        </div>
                      )}
                    </div>
                    
                    {/* 배송 옵션 (Shipping) - 가로 3열 그리드, 컴팩트하게 */}
                    <div className="flex-1">
                      <label className="block text-xs font-semibold text-gray-600 uppercase mb-2">
                        {language === 'KO' ? '배송 방법' : 'Shipping'}
                      </label>
                      <div className="grid grid-cols-3 gap-2">
                        {[
                          { value: 'all', label: language === 'KO' ? '전체' : 'All', icon: Grid },
                          { value: 'domestic', label: language === 'KO' ? '국내' : 'Domestic', icon: Truck },
                          { value: 'international', label: language === 'KO' ? '해외' : 'International', icon: Plane },
                        ].map((option) => (
                          <button
                            key={option.value}
                            type="button"
                            onClick={() => setShippingMethod(option.value)}
                            className={`h-14 flex flex-col items-center justify-center gap-1.5 px-3 py-2 rounded-lg text-sm font-semibold transition-all cursor-pointer ${
                              shippingMethod === option.value
                                ? option.value === 'domestic'
                                  ? 'bg-green-500 text-white shadow-md'
                                  : option.value === 'international'
                                  ? 'bg-purple-500 text-white shadow-md'
                                  : 'bg-indigo-500 text-white shadow-md'
                                : 'bg-gray-50 text-gray-700 hover:bg-gray-100 border-2 border-transparent'
                            }`}
                            style={{ zIndex: 9999, position: 'relative' }}
                          >
                            {React.createElement(option.icon, { size: 20 })}
                            <span>{option.label}</span>
                          </button>
                        ))}
                      </div>
                    </div>
                  </div>
                  
                  {/* Row 3: Search 버튼 (전체 너비) */}
                  <div className="flex justify-end">
                    <button
                      type="submit"
                      className="w-full md:w-auto px-8 py-3 bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-lg rounded-lg shadow-lg transition-colors"
                    >
                      {language === 'KO' ? '검색' : 'Search'}
                    </button>
                  </div>
                </form>
              </div>
            </div>
          </div>

          {/* 가로형 카테고리 바 (검색 위젯 바로 아래, Airbnb 스타일) */}
          {!lastSearchQuery && (
            <div 
              className="w-full bg-white border-b border-gray-200 py-6 px-4"
              onClick={(e) => {
                // 카테고리 바 외부 클릭 시 드롭다운 닫기
                if (e.target === e.currentTarget || !e.target.closest('.category-item')) {
                  setShowCategoryDropdown(null);
                }
              }}
            >
              <div className="max-w-[1200px] mx-auto">
                <div className="flex gap-6 overflow-x-auto scrollbar-hide pb-2 scroll-smooth" style={{ scrollbarWidth: 'thin', WebkitOverflowScrolling: 'touch' }}>
                  {(() => {
                    const safeCategories = categories || [];
                    if (!Array.isArray(safeCategories) || safeCategories.length === 0) {
                      return <div className="text-center py-4 text-gray-500">Loading categories...</div>;
                    }
                    return safeCategories.map((category) => {
                      if (!category || typeof category !== 'object' || !category.name) return null;
                      return (
                    <div key={category.name} className="relative category-item">
                      <button
                        onClick={(e) => {
                          e.preventDefault();
                          e.stopPropagation();
                          // 카테고리 클릭 시 드롭다운 토글
                          if (showCategoryDropdown === category.name) {
                            setShowCategoryDropdown(null);
                          } else {
                            setShowCategoryDropdown(category.name);
                          }
                        }}
                        className="flex flex-col items-center gap-2 min-w-[80px] px-4 py-3 rounded-lg hover:bg-gray-50 transition-colors group cursor-pointer"
                        style={{ zIndex: 9999, position: 'relative' }}
                      >
                        <div className="p-3 rounded-full bg-gray-100 group-hover:bg-indigo-100 transition-colors">
                          {React.createElement(category.icon, { size: 24, className: 'text-gray-700 group-hover:text-indigo-600' })}
                        </div>
                        <span className="text-xs font-medium text-gray-700 group-hover:text-indigo-600 text-center whitespace-nowrap">
                          {category.name}
                        </span>
                      </button>
                      
                      {/* 세부 카테고리 드롭다운 */}
                      {showCategoryDropdown === category.name && category.subcategories && Array.isArray(category.subcategories) && category.subcategories.length > 0 && (
                        <div className="absolute top-full left-1/2 transform -translate-x-1/2 mt-2 bg-white border-2 border-gray-200 rounded-lg shadow-xl min-w-[200px] max-h-96 overflow-y-auto" style={{ zIndex: 10000, position: 'relative' }}>
                          <div className="p-3 border-b border-gray-200 sticky top-0 bg-white z-10">
                            <div className="flex items-center justify-between">
                              <span className="text-sm font-semibold text-gray-900">{category.name}</span>
                              <button
                                onClick={(e) => {
                                  e.stopPropagation();
                                  setShowCategoryDropdown(null);
                                }}
                                className="p-1 hover:bg-gray-100 rounded transition-colors cursor-pointer"
                                style={{ zIndex: 10001, position: 'relative' }}
                              >
                                <X size={16} className="text-gray-500" />
                              </button>
                            </div>
                          </div>
                          <div className="p-2 space-y-1">
                            {(() => {
                              const safeSubcategories = category.subcategories || [];
                              if (!Array.isArray(safeSubcategories) || safeSubcategories.length === 0) {
                                return <div className="text-center py-4 text-gray-500 text-sm">No subcategories available</div>;
                              }
                              return safeSubcategories.map((subcategory) => {
                                if (!subcategory || typeof subcategory !== 'string') return null;
                                return (
                              <button
                                key={subcategory}
                                onClick={async (e) => {
                                  e.preventDefault();
                                  e.stopPropagation();
                                  try {
                                    setShowCategoryDropdown(null);
                                    setLoading(true);
                                    setError(null);
                                    await handleSearch(null, subcategory);
                                  } catch (error) {
                                    console.error('[Subcategory Click] Error:', error);
                                    setError(error instanceof Error ? error : new Error(String(error)));
                                    setLoading(false);
                                    setResults([]);
                                  }
                                }}
                                className="w-full text-left px-4 py-2 rounded-md hover:bg-indigo-50 text-sm text-gray-700 hover:text-indigo-700 transition-colors cursor-pointer"
                                style={{ zIndex: 10001, position: 'relative' }}
                              >
                                {subcategory}
                              </button>
                                );
                              });
                            })()}
                          </div>
                        </div>
                      )}
                    </div>
                      );
                    });
                  })()}
                </div>
              </div>
            </div>
          )}

          {/* 검색 결과 영역 */}
          <div className="flex-1 flex items-start py-8 px-4">
          </div>

          {/* 검색 결과 노출 */}
          {lastSearchQuery && (
            <div id="search-results-section" className="w-full max-w-6xl space-y-8">
              {/* Featured Deal 섹션 - 대장 상품 강조 */}
              {selectedProduct && (
                <section className="bg-gradient-to-r from-indigo-50 via-purple-50 to-pink-50 rounded-2xl p-8 border-4 border-indigo-300 shadow-xl">
                  <div className="flex items-center gap-2 mb-4">
                    <span className="text-xs font-bold bg-indigo-600 text-white px-3 py-1 rounded-full uppercase tracking-wide">Featured Deal</span>
                    <span className="text-sm text-gray-600">Your Selected Product</span>
        </div>
                  <div className="bg-white rounded-xl p-8 shadow-2xl flex flex-col md:flex-row gap-8">
                    <div className="w-full md:w-64 h-64 bg-gray-100 rounded-xl flex-shrink-0 flex items-center justify-center overflow-hidden border-4 border-indigo-200">
                      {selectedProduct.image || selectedProduct.img ? (
                        <img 
                          src={selectedProduct.image || selectedProduct.img} 
                          alt={selectedProduct.name || selectedProduct.title}
                          className="w-full h-full object-contain rounded-lg"
                        />
                      ) : (
                        <span className="text-gray-400 text-lg font-semibold">{selectedProduct.site || 'Product'}</span>
      )}
    </div>
                    <div className="flex-1">
                      <p className="text-sm text-indigo-600 font-bold mb-2 uppercase tracking-wider">{selectedProduct.site || 'Store'}</p>
                      <h3 className="text-2xl md:text-3xl font-bold text-gray-900 mb-4 leading-tight">{selectedProduct.name || selectedProduct.title || 'Product Name'}</h3>
                      <div className="mb-6">
                        <p className="text-4xl font-bold text-indigo-600 mb-2">{selectedProduct.price || 'N/A'}</p>
                        {selectedProduct.original_price && (
                          <p className="text-lg text-gray-500 line-through">{selectedProduct.original_price}</p>
                        )}
                      </div>
                      {selectedProduct.link && (
                        <a
                          href={selectedProduct.link}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="inline-block px-8 py-4 bg-indigo-600 text-white font-bold rounded-xl hover:bg-indigo-700 transition-all shadow-lg hover:shadow-xl transform hover:scale-105"
                        >
                          View Deal →
                        </a>
                      )}
                    </div>
                  </div>
                </section>
              )}

              {/* Compare with Other Stores 섹션 - "여기가 더 싸네?" 강조 */}
              {selectedProduct && results && results.length > 0 && (
                <section>
                  <div className="flex items-center justify-between mb-6">
                    <h2 className="text-3xl font-bold text-gray-900">Compare with Other Stores</h2>
                    <span className="text-sm text-gray-600 bg-gray-100 px-4 py-2 rounded-full">
                      {results.length} stores found
                    </span>
        </div>
                  <div className="bg-white rounded-xl border-2 border-gray-200 p-6 shadow-lg">
                    <p className="text-sm text-gray-600 mb-6 text-center">Prices sorted from lowest to highest</p>
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 justify-center mx-auto">
                      {(() => {
                        // 안전장치: results가 없거나 배열이 아닐 때 빈 배열 반환
                        const safeResults = results || [];
                        if (!Array.isArray(safeResults) || safeResults.length === 0) {
                          return (
                            <div className="col-span-full text-center py-12">
                              <p className="text-gray-500">No products found.</p>
                            </div>
                          );
                        }
                        
                        return safeResults
                          .filter(item => item && item.name && item.site && item.price)
                          .sort((a, b) => {
                            const priceA = parseFloat(a.price_num || 0) || parseFloat((a.price || '0').replace(/[$,]/g, '')) || 0;
                            const priceB = parseFloat(b.price_num || 0) || parseFloat((b.price || '0').replace(/[$,]/g, '')) || 0;
                            return priceA - priceB;
                          })
                          .slice(0, 6)
                          .map((item, idx) => {
                          const itemPrice = parseFloat(item.price_num || 0) || parseFloat((item.price || '0').replace(/[$,]/g, '')) || 0;
                          const selectedPrice = parseFloat(selectedProduct.price_num || 0) || parseFloat((selectedProduct.price || '0').replace(/[$,]/g, '')) || 0;
                          const priceDiff = selectedPrice - itemPrice;
                          const isCheaper = priceDiff > 0;
                          const savingsPercent = selectedPrice > 0 ? Math.round((priceDiff / selectedPrice) * 100) : 0;
                          
                          return (
                            <div
                              key={`${item.site || 'unknown'}-${idx}-${item.link || idx}`}
                              className={`p-5 rounded-xl border-3 transition-all shadow-md hover:shadow-xl ${
                                item.site === selectedProduct.site
                                  ? 'border-indigo-500 bg-indigo-50 ring-4 ring-indigo-200'
                                  : idx === 0
                                  ? 'border-green-500 bg-green-50 ring-4 ring-green-200'
                                  : 'border-gray-300 hover:border-indigo-400 bg-white'
                              }`}
                            >
                              <div className="flex items-start justify-between mb-3">
                                <span className={`text-sm font-bold px-3 py-1.5 rounded-lg ${
                                  item.site === 'Target' ? 'bg-red-100 text-red-700' :
                                  item.site === 'Walmart' ? 'bg-blue-100 text-blue-700' :
                                  item.site === 'Amazon' ? 'bg-orange-100 text-orange-700' :
                                  item.site === 'Best Buy' ? 'bg-yellow-100 text-yellow-700' :
                                  'bg-gray-100 text-gray-700'
                                }`}>
                                  {item.site || 'Unknown'}
                                </span>
                                <div className="flex flex-col gap-1 items-end">
                                  {idx === 0 && (
                                    <span className="text-xs font-bold bg-green-600 text-white px-3 py-1 rounded-full shadow-lg animate-pulse">🏆 Best Price!</span>
                                  )}
                                  {item.site === selectedProduct.site && (
                                    <span className="text-xs font-bold bg-indigo-600 text-white px-3 py-1 rounded-full">Your Choice</span>
      )}
    </div>
                              </div>
                              <h4 className="text-base font-semibold text-gray-900 mb-3 line-clamp-2 min-h-[3rem]">{item.name || 'Product'}</h4>
                              <div className="mb-4">
                                {formatPrice(item.price, currency) ? (
                                  <p className="text-2xl font-bold text-gray-900 mb-2">{formatPrice(item.price, currency)}</p>
                                ) : (
                                  <button className="text-base text-indigo-600 font-semibold hover:text-indigo-700 underline mb-2 cursor-pointer" style={{ zIndex: 9999, position: 'relative' }}>
                                    Check Price on Store
                                  </button>
                                )}
                                {selectedProduct.site !== item.site && priceDiff !== 0 && (
                                  <div className={`p-3 rounded-lg ${
                                    isCheaper ? 'bg-green-100 border-2 border-green-300' : 'bg-red-100 border-2 border-red-300'
                                  }`}>
                                    <p className={`text-sm font-bold ${
                                      isCheaper ? 'text-green-700' : 'text-red-700'
                                    }`}>
                                      {isCheaper 
                                        ? `💰 Save $${Math.abs(priceDiff).toFixed(2)} (${savingsPercent}% off!)`
                                        : `⚠️ $${Math.abs(priceDiff).toFixed(2)} more expensive`
                                      }
                                    </p>
                                  </div>
                                )}
                              </div>
                              {item.link && (
                                <a
                                  href={item.link}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  className={`block w-full text-center py-3 px-4 rounded-lg font-bold transition-all cursor-pointer ${
                                    idx === 0 
                                      ? 'bg-green-600 text-white hover:bg-green-700 shadow-lg'
                                      : 'bg-indigo-600 text-white hover:bg-indigo-700'
                                  }`}
                                  style={{ zIndex: 9999, position: 'relative' }}
                                >
                                  {idx === 0 ? 'Get Best Deal →' : 'View Deal →'}
                                </a>
                              )}
                            </div>
                          );
                        });
                      })()}
                    </div>
                  </div>
                </section>
              )}

              {/* 일반 검색 결과 - selectedProduct가 없을 때만 표시 */}
              {!selectedProduct && (
                <div className="w-full">
                  {loading ? (
                    <div className="text-center py-20">
                      <div className="inline-block animate-spin rounded-full h-12 w-12 border-4 border-indigo-600 border-t-transparent mb-4"></div>
                      <p className="text-gray-600 text-lg">Loading...</p>
                    </div>
                  ) : error ? (
                    <div className="text-center py-20">
                      <p className="text-red-600 text-lg mb-2">Error loading products</p>
                      <p className="text-gray-500 text-sm">{error.message || 'Please try again later.'}</p>
                    </div>
                  ) : (!results || !Array.isArray(results) || results.length === 0) && lastSearchQuery ? (
                    <div className="text-center py-20">
                      <p className="text-gray-500 text-lg">No products found. Try a different search.</p>
                    </div>
                  ) : (
                    <SearchResults 
                      results={(() => {
                        // 안전장치: results가 없거나 배열이 아닐 때 빈 배열 반환
                        if (!results || !Array.isArray(results)) {
                          return [];
                        }
                        return results.filter(item => item && item.name && item.site).slice(0, displayedCount || 20);
                      })()} 
                      user={user}
                      formatPrice={formatPrice}
                      currency={currency}
                      isValidPrice={isValidPrice}
                      selectedSites={selectedSites || []}
                      shippingMethod={shippingMethod}
                      lastSearchQuery={lastSearchQuery || ''}
                    />
                  )}
                </div>
              )}
            </div>
          )}
        </main>
      </div>

      {/* FAQ & 푸터 섹션 - 사이트 최하단 (Full-width) */}
      <footer className="w-full bg-white border-t border-gray-200 mt-16">
        <div className="w-full px-4 py-12">
          {/* FAQ 섹션 - 스카이스캐너 스타일 2열 그리드, 다국어 지원 */}
          <section className="mb-12 max-w-7xl mx-auto">
            <h2 className="text-2xl font-bold text-gray-900 mb-6">
              {t.faq?.title || (language === 'KO' ? 'Portal 사용 방법' : 'How to use Portal')}
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {(() => {
                const safeFaqItems = t.faq?.items || (language === 'KO' ? translations.KR.faq.items : translations.US.faq.items) || [];
                if (!Array.isArray(safeFaqItems) || safeFaqItems.length === 0) {
                  return <div className="col-span-full text-center py-8 text-gray-500">Loading FAQ...</div>;
                }
                return safeFaqItems.map((faq, idx) => {
                  if (!faq || typeof faq !== 'object') return null;
                  return (
                <div key={idx} className="border border-gray-200 rounded-lg overflow-hidden">
                  <button
                    onClick={() => setExpandedFAQ(prev => ({ ...prev, [idx]: !prev[idx] }))}
                    className="w-full px-6 py-4 text-left flex items-center justify-between hover:bg-gray-50 transition-colors cursor-pointer"
                    style={{ zIndex: 9999, position: 'relative' }}
                  >
                    <span className="font-semibold text-gray-900">{faq.question}</span>
                    <ChevronDown 
                      size={20} 
                      className={`text-gray-600 transition-transform ${expandedFAQ[idx] ? 'rotate-180' : ''}`}
                    />
                  </button>
                  {expandedFAQ[idx] && (
                    <div className="px-6 py-4 bg-gray-50 border-t border-gray-200">
                      <p className="text-gray-700 leading-relaxed">{faq.answer}</p>
                    </div>
                  )}
                </div>
                  );
                });
              })()}
            </div>
          </section>

          {/* 회사 정보 푸터 - 스카이스캐너 스타일 (Full-width) */}
          <div className="border-t border-gray-200 pt-8 max-w-7xl mx-auto">
            {/* 상단: Global Sites와 주요 링크 */}
            <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-8 mb-8">
              {/* Global Sites */}
              <div>
                <h3 className="font-bold text-gray-900 mb-4 text-sm">Global Sites</h3>
                <ul className="space-y-2 text-sm">
                  <li><a href="#" className="text-gray-600 hover:text-indigo-600 transition-colors">Portal US</a></li>
                  <li><a href="#" className="text-gray-600 hover:text-indigo-600 transition-colors">Portal KR</a></li>
                  <li><a href="#" className="text-gray-600 hover:text-indigo-600 transition-colors">Portal JP</a></li>
                  <li><a href="#" className="text-gray-600 hover:text-indigo-600 transition-colors">Portal EU</a></li>
                </ul>
              </div>

              {/* Services */}
              <div>
                <h3 className="font-bold text-gray-900 mb-4 text-sm">Services</h3>
                <ul className="space-y-2 text-sm">
                  <li><a href="#" className="text-gray-600 hover:text-indigo-600 transition-colors">Price Comparison</a></li>
                  <li><a href="#" className="text-gray-600 hover:text-indigo-600 transition-colors">Global Shipping</a></li>
                  <li><a href="#" className="text-gray-600 hover:text-indigo-600 transition-colors">Deal Alerts</a></li>
                  <li><a href="#" className="text-gray-600 hover:text-indigo-600 transition-colors">Wishlist</a></li>
                </ul>
              </div>

              {/* Legal */}
              <div>
                <h3 className="font-bold text-gray-900 mb-4 text-sm">Legal</h3>
                <ul className="space-y-2 text-sm">
                  <li><a href="#" className="text-gray-600 hover:text-indigo-600 transition-colors">Terms of Service</a></li>
                  <li><a href="#" className="text-gray-600 hover:text-indigo-600 transition-colors">Privacy Policy</a></li>
                  <li><a href="#" className="text-gray-600 hover:text-indigo-600 transition-colors">Cookie Policy</a></li>
                  <li><a href="#" className="text-gray-600 hover:text-indigo-600 transition-colors">Disclaimer</a></li>
                </ul>
              </div>

              {/* About Portal */}
              <div>
                <h3 className="font-bold text-gray-900 mb-4 text-sm">About Portal</h3>
                <ul className="space-y-2 text-sm">
                  <li><a href="#" className="text-gray-600 hover:text-indigo-600 transition-colors">About Us</a></li>
                  <li><a href="#" className="text-gray-600 hover:text-indigo-600 transition-colors">Contact</a></li>
                  <li><a href="#" className="text-gray-600 hover:text-indigo-600 transition-colors">Careers</a></li>
                  <li><a href="#" className="text-gray-600 hover:text-indigo-600 transition-colors">Blog</a></li>
                </ul>
              </div>

              {/* Help */}
              <div>
                <h3 className="font-bold text-gray-900 mb-4 text-sm">Help</h3>
                <ul className="space-y-2 text-sm">
                  <li><a href="#" className="text-gray-600 hover:text-indigo-600 transition-colors">FAQ</a></li>
                  <li><a href="#" className="text-gray-600 hover:text-indigo-600 transition-colors">Support</a></li>
                  <li><a href="#" className="text-gray-600 hover:text-indigo-600 transition-colors">Shipping Info</a></li>
                  <li><a href="#" className="text-gray-600 hover:text-indigo-600 transition-colors">Returns</a></li>
                </ul>
              </div>

              {/* Social Media */}
              <div>
                <h3 className="font-bold text-gray-900 mb-4 text-sm">Follow Us</h3>
                <div className="flex gap-4">
                  <a href="#" className="text-gray-400 hover:text-indigo-600 transition-colors" aria-label="Facebook">
                    <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                      <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"/>
                    </svg>
                  </a>
                  <a href="#" className="text-gray-400 hover:text-indigo-600 transition-colors" aria-label="Twitter">
                    <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                      <path d="M8.29 20.251c7.547 0 11.675-6.253 11.675-11.675 0-.178 0-.355-.012-.53A8.348 8.348 0 0022 5.92a8.19 8.19 0 01-2.357.646 4.118 4.118 0 001.804-2.27 8.224 8.224 0 01-2.605.996 4.107 4.107 0 00-6.993 3.743 11.65 11.65 0 01-8.457-4.287 4.106 4.106 0 001.27 5.477A4.072 4.072 0 012.8 9.713v.052a4.105 4.105 0 003.292 4.022 4.095 4.095 0 01-1.853.07 4.108 4.108 0 003.834 2.85A8.233 8.233 0 012 18.407a11.616 11.616 0 006.29 1.84"/>
                    </svg>
                  </a>
                  <a href="#" className="text-gray-400 hover:text-indigo-600 transition-colors" aria-label="Instagram">
                    <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                      <path fillRule="evenodd" d="M12.315 2c2.43 0 2.784.013 3.808.06 1.064.049 1.791.218 2.427.465a4.902 4.902 0 011.772 1.153 4.902 4.902 0 011.153 1.772c.247.636.416 1.363.465 2.427.048 1.067.06 1.407.06 4.123v.08c0 2.643-.012 2.987-.06 4.043-.049 1.064-.218 1.791-.465 2.427a4.902 4.902 0 01-1.153 1.772 4.902 4.902 0 01-1.772 1.153c-.636.247-1.363.416-2.427.465-1.067.048-1.407.06-4.123.06h-.08c-2.643 0-2.987-.012-4.043-.06-1.064-.049-1.791-.218-2.427-.465a4.902 4.902 0 01-1.772-1.153 4.902 4.902 0 01-1.153-1.772c-.247-.636-.416-1.363-.465-2.427-.047-1.024-.06-1.379-.06-3.808v-.63c0-2.43.013-2.784.06-3.808.049-1.064.218-1.791.465-2.427a4.902 4.902 0 011.153-1.772A4.902 4.902 0 015.45 2.525c.636-.247 1.363-.416 2.427-.465C8.901 2.013 9.256 2 11.685 2h.63zm-.081 1.802h-.468c-2.456 0-2.784.011-3.807.058-.975.045-1.504.207-1.857.344-.467.182-.8.398-1.15.748-.35.35-.566.683-.748 1.15-.137.353-.3.882-.344 1.857-.047 1.023-.058 1.351-.058 3.807v.468c0 2.456.011 2.784.058 3.807.045.975.207 1.504.344 1.857.182.466.398.8.748 1.15.35.35.683.566 1.15.748.353.137.882.3 1.857.344 1.054.048 1.37.058 4.041.058h.08c2.597 0 2.917-.01 3.96-.058.976-.045 1.505-.207 1.858-.344.466-.182.8-.398 1.15-.748.35-.35.566-.683.748-1.15.137-.353.3-.882.344-1.857.048-1.055.058-1.37.058-4.041v-.08c0-2.597-.01-2.917-.058-3.96-.045-.976-.207-1.505-.344-1.858a3.097 3.097 0 00-.748-1.15 3.098 3.098 0 00-1.15-.748c-.353-.137-.882-.3-1.857-.344-1.023-.047-1.351-.058-3.807-.058zM12 6.865a5.135 5.135 0 110 10.27 5.135 5.135 0 010-10.27zm0 1.802a3.333 3.333 0 100 6.666 3.333 3.333 0 000-6.666zm5.338-3.205a1.2 1.2 0 110 2.4 1.2 1.2 0 010-2.4z" clipRule="evenodd"/>
                    </svg>
                  </a>
                </div>
              </div>
            </div>

            {/* 하단: 저작권 정보 바 */}
            <div className="border-t border-gray-200 pt-6 pb-4">
              <div className="flex flex-col md:flex-row justify-between items-center gap-4">
                <p className="text-sm text-gray-600">&copy; {new Date().getFullYear()} Portal. All rights reserved.</p>
                <div className="flex gap-6 text-sm text-gray-600">
                  <a href="#" className="hover:text-indigo-600 transition-colors">Terms</a>
                  <a href="#" className="hover:text-indigo-600 transition-colors">Privacy</a>
                  <a href="#" className="hover:text-indigo-600 transition-colors">Cookies</a>
                </div>
              </div>
            </div>
          </div>
        </div>
      </footer>

      {/* 위시리스트 슬라이드 메뉴 구현 (략) */}
      {/* 위시리스트 비교함 모달 (테이블 형태) */}
      {showWishlistMenu && (
        <div className="fixed inset-0 z-[110] flex">
          <div className="flex-1 bg-black/50" onClick={() => setShowWishlistMenu(false)} />
          <div className="w-full max-w-6xl bg-white shadow-2xl animate-slide-in overflow-y-auto max-h-[90vh]">
            <div className="sticky top-0 bg-white border-b border-gray-200 px-6 py-4 flex justify-between items-center z-10">
              <div>
                <h2 className="text-2xl font-bold text-gray-900">{language === 'KO' ? '가격 비교함' : 'Price Comparison'}</h2>
                <p className="text-sm text-gray-500 mt-1">{wishlist.length} {language === 'KO' ? '개 상품' : 'items'}</p>
              </div>
              <button 
                onClick={() => setShowWishlistMenu(false)}
                className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
              >
                <X size={24} />
              </button>
            </div>
            
            {wishlist.length === 0 ? (
              <div className="p-12 text-center">
                <Heart size={48} className="mx-auto text-gray-300 mb-4" />
                <p className="text-gray-500 text-lg">{language === 'KO' ? '위시리스트가 비어있습니다' : 'Your wishlist is empty'}</p>
              </div>
            ) : (
              <div className="p-6">
                <div className="overflow-x-auto">
                  <table className="w-full border-collapse">
                    <thead>
                      <tr className="bg-gray-50 border-b-2 border-gray-200">
                        <th className="px-4 py-3 text-left text-xs font-bold text-gray-700 uppercase tracking-wider">{language === 'KO' ? '상품명' : 'Product'}</th>
                        <th className="px-4 py-3 text-left text-xs font-bold text-gray-700 uppercase tracking-wider">{language === 'KO' ? '스토어' : 'Store'}</th>
                        <th className="px-4 py-3 text-right text-xs font-bold text-gray-700 uppercase tracking-wider">{language === 'KO' ? '가격' : 'Price'}</th>
                        <th className="px-4 py-3 text-left text-xs font-bold text-gray-700 uppercase tracking-wider">{language === 'KO' ? '배송' : 'Shipping'}</th>
                        <th className="px-4 py-3 text-center text-xs font-bold text-gray-700 uppercase tracking-wider">{language === 'KO' ? '액션' : 'Action'}</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-200">
                      {(() => {
                        const safeWishlist = wishlist || [];
                        if (!Array.isArray(safeWishlist) || safeWishlist.length === 0) {
                          return (
                            <tr>
                              <td colSpan={5} className="px-4 py-8 text-center text-gray-500">
                                {language === 'KO' ? '위시리스트가 비어있습니다.' : 'Wishlist is empty.'}
                              </td>
                            </tr>
                          );
                        }
                        return safeWishlist.map((item, idx) => {
                        const itemName = item.name || item.title || 'Product';
                        const itemSite = item.site || 'Unknown';
                        const itemPriceRaw = item.price;
                        const hasValidPrice = isValidPrice ? isValidPrice(itemPriceRaw) : (itemPriceRaw && itemPriceRaw !== '$0.00' && itemPriceRaw !== '0');
                        const itemPrice = hasValidPrice && formatPrice ? formatPrice(itemPriceRaw, currency) : null;
                        const itemLinkRaw = item.link || item.url || '#';
                        // Amazon 링크에 Affiliate Tag 강제 적용
                        const itemLink = addAmazonAffiliateTag(itemLinkRaw);
                        const isOverseas = ['AliExpress', 'iHerb', 'Etsy', 'Temu'].includes(itemSite);
                        
                        return (
                          <tr key={`${itemSite}-${idx}-${itemLink}`} className="hover:bg-gray-50 transition-colors">
                            <td className="px-4 py-4">
                              <div className="flex items-center gap-3">
                                {item.img || item.image ? (
                                  <img 
                                    src={item.img || item.image} 
                                    alt={itemName}
                                    className="w-16 h-16 object-contain bg-gray-100 rounded"
                                    onError={(e) => e.target.style.display = 'none'}
                                  />
                                ) : null}
                                <span className="text-sm font-medium text-gray-900 line-clamp-2">{itemName}</span>
                              </div>
                            </td>
                            <td className="px-4 py-4">
                              <span className={`text-xs font-bold uppercase px-2 py-1 rounded ${
                                itemSite === 'Target' ? 'bg-red-500 text-white' :
                                itemSite === 'Walmart' ? 'bg-blue-500 text-white' :
                                itemSite === 'Amazon' ? 'bg-orange-500 text-white' :
                                itemSite === 'Best Buy' ? 'bg-yellow-400 text-black' :
                                itemSite === 'eBay' ? 'bg-green-500 text-white' :
                                'bg-gray-600 text-white'
                              }`}>
                                {itemSite}
                              </span>
                            </td>
                            <td className="px-4 py-4 text-right">
                              {itemPrice ? (
                                <span className="text-lg font-bold text-gray-900">{itemPrice}</span>
                              ) : (
                                <span className="text-sm text-gray-400">{language === 'KO' ? '가격 확인' : 'Check Price'}</span>
                              )}
                            </td>
                            <td className="px-4 py-4">
                              {isOverseas ? (
                                <span className="text-xs font-semibold text-yellow-700 bg-yellow-100 px-2 py-1 rounded">🚢 International</span>
                              ) : (
                                <span className="text-xs font-semibold text-green-700 bg-green-100 px-2 py-1 rounded">🚀 2-3 Days</span>
                              )}
                            </td>
                            <td className="px-4 py-4 text-center">
                              <div className="flex items-center justify-center gap-2">
                                <a
                                  href={itemLink}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold rounded transition-colors"
                                >
                                  {language === 'KO' ? '구매' : 'Buy'}
                                </a>
                                <button
                                  onClick={() => toggleWishlist(item)}
                                  className="p-2 text-red-500 hover:bg-red-50 rounded transition-colors"
                                  title={language === 'KO' ? '위시리스트에서 제거' : 'Remove from wishlist'}
                                >
                                  <Heart size={18} className="fill-current" />
                                </button>
                              </div>
                            </td>
                          </tr>
                        );
                        });
                      })()}
                    </tbody>
                  </table>
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

export default App;