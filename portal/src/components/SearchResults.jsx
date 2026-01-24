import { useEffect, useRef, useMemo } from 'react';
import { Heart, ShoppingCart } from 'lucide-react';
import { useWishlist } from '../contexts/WishlistContext';

function SearchResults({ 
  results, 
  selectedSites = [], 
  darkMode = false, 
  toggleSite, 
  uniqueSites = [], 
  clearAllFilters, 
  user, 
  lastSearchQuery = '',
  displayedCount = 20,
  loadingMore = false,
  selectedSiteTab = 'Amazon',
  setSelectedSiteTab,
  loadMoreItems,
  formatPrice,
  currency = 'USD',
  isValidPrice,
  shippingMethod = 'all'
}) {
  const observerRef = useRef(null);
  const loadMoreRef = useRef(null);
  const { toggleWishlist, toggleCart, isInWishlist, isInCart } = useWishlist();

  // displayedCount만큼만 표시 (메모이제이션) - null/undefined 방어 로직 추가
  const displayedResults = useMemo(() => {
    if (!results || !Array.isArray(results)) return [];
    // null, undefined, 빈 객체 필터링
    const validResults = results.filter(item => 
      item && 
      typeof item === 'object' && 
      (item.name || item.title) &&
      item.site
    );
    return validResults.slice(0, displayedCount);
  }, [results, displayedCount]);

  // Intersection Observer로 하단 감지
  useEffect(() => {
    if (!loadMoreItems || displayedCount >= results.length) return;

    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting && !loadingMore) {
          loadMoreItems();
        }
      },
      { threshold: 0.1 }
    );

    if (loadMoreRef.current) {
      observer.observe(loadMoreRef.current);
    }

    return () => {
      if (loadMoreRef.current) {
        observer.unobserve(loadMoreRef.current);
      }
    };
  }, [displayedCount, results.length, loadingMore, loadMoreItems]);
  // AI Recommendations용 데이터
  const aiRecommendations = [
    { id: 1, brand: 'Target', name: 'Wireless Earbuds', price: '$29.99', originalPrice: '$49.99', discount: 40, image: null },
    { id: 2, brand: 'Walmart', name: 'Smart Watch Series 9', price: '$199.99', originalPrice: '$299.99', discount: 33, image: null },
    { id: 3, brand: 'Best Buy', name: '4K Ultra HD TV 55"', price: '$449.99', originalPrice: '$599.99', discount: 25, image: null },
    { id: 4, brand: 'Amazon', name: 'Laptop Backpack', price: '$24.99', originalPrice: '$39.99', discount: 38, image: null },
    { id: 5, brand: 'Target', name: 'Air Purifier', price: '$89.99', originalPrice: '$129.99', discount: 31, image: null },
    { id: 6, brand: 'Walmart', name: 'Bluetooth Speaker', price: '$39.99', originalPrice: '$59.99', discount: 33, image: null },
    { id: 7, brand: 'Best Buy', name: 'Gaming Mouse', price: '$49.99', originalPrice: '$79.99', discount: 38, image: null },
    { id: 8, brand: 'Amazon', name: 'Phone Case Set', price: '$12.99', originalPrice: '$19.99', discount: 35, image: null },
    { id: 9, brand: 'Target', name: 'Stand Mixer', price: '$179.99', originalPrice: '$249.99', discount: 28, image: null },
    { id: 10, brand: 'Walmart', name: 'Robot Vacuum', price: '$249.99', originalPrice: '$349.99', discount: 29, image: null },
  ];

  // Price Drop Alerts용 데이터 (할인율 20% 이상)
  const priceDropProducts = [
    { id: 11, brand: 'Amazon', name: 'Noise Cancelling Headphones', price: '$89.99', originalPrice: '$149.99', discount: 40, image: null },
    { id: 12, brand: 'Target', name: 'Smart Thermostat', price: '$119.99', originalPrice: '$179.99', discount: 33, image: null },
    { id: 13, brand: 'Walmart', name: 'Electric Scooter', price: '$199.99', originalPrice: '$299.99', discount: 33, image: null },
    { id: 14, brand: 'Amazon', name: 'Portable Projector', price: '$79.99', originalPrice: '$129.99', discount: 39, image: null },
    { id: 15, brand: 'Target', name: 'Yoga Mat Set', price: '$24.99', originalPrice: '$39.99', discount: 38, image: null },
    { id: 16, brand: 'Walmart', name: 'Meal Prep Containers', price: '$12.99', originalPrice: '$19.99', discount: 35, image: null },
    { id: 17, brand: 'Amazon', name: 'LED Strip Lights', price: '$18.99', originalPrice: '$29.99', discount: 37, image: null },
    { id: 18, brand: 'Target', name: 'Coffee Maker', price: '$59.99', originalPrice: '$89.99', discount: 33, image: null },
  ];

  // Site-Specific Best Sellers용 데이터
  const siteBestSellers = {
    Amazon: [
      { id: 21, brand: 'Amazon', name: 'Echo Dot 5th Gen', price: '$29.99', originalPrice: '$49.99', discount: 40, image: null },
      { id: 22, brand: 'Amazon', name: 'Fire TV Stick 4K', price: '$24.99', originalPrice: '$49.99', discount: 50, image: null },
      { id: 23, brand: 'Amazon', name: 'Kindle Paperwhite', price: '$99.99', originalPrice: '$139.99', discount: 29, image: null },
      { id: 24, brand: 'Amazon', name: 'Ring Doorbell', price: '$59.99', originalPrice: '$99.99', discount: 40, image: null },
      { id: 25, brand: 'Amazon', name: 'Fire Tablet 10"', price: '$79.99', originalPrice: '$149.99', discount: 47, image: null },
    ],
    Target: [
      { id: 31, brand: 'Target', name: 'Roomba Robot Vacuum', price: '$199.99', originalPrice: '$279.99', discount: 29, image: null },
      { id: 32, brand: 'Target', name: 'KitchenAid Mixer', price: '$179.99', originalPrice: '$249.99', discount: 28, image: null },
      { id: 33, brand: 'Target', name: 'Nest Thermostat', price: '$119.99', originalPrice: '$179.99', discount: 33, image: null },
      { id: 34, brand: 'Target', name: 'Dyson V8 Vacuum', price: '$299.99', originalPrice: '$399.99', discount: 25, image: null },
      { id: 35, brand: 'Target', name: 'Instant Pot Duo', price: '$69.99', originalPrice: '$99.99', discount: 30, image: null },
    ],
    Walmart: [
      { id: 41, brand: 'Walmart', name: 'ONN TV 50" 4K', price: '$228.00', originalPrice: '$298.00', discount: 23, image: null },
      { id: 42, brand: 'Walmart', name: 'HyperX Gaming Headset', price: '$49.99', originalPrice: '$79.99', discount: 38, image: null },
      { id: 43, brand: 'Walmart', name: 'Mainstays Mattress', price: '$79.99', originalPrice: '$119.99', discount: 33, image: null },
      { id: 44, brand: 'Walmart', name: 'Ozark Trail Cooler', price: '$29.99', originalPrice: '$44.99', discount: 33, image: null },
      { id: 45, brand: 'Walmart', name: 'Great Value Coffee', price: '$4.98', originalPrice: '$7.98', discount: 38, image: null },
    ],
  };

  // 검색 결과가 없을 때 처리
  if (!results || results.length === 0) {
    // 검색을 했는데 결과가 없는 경우
    if (lastSearchQuery) {
      return (
        <div className="w-full mt-12 px-4">
          <div className="text-center py-20">
            <div className="max-w-md mx-auto">
              <div className="mb-6">
                <svg className="w-24 h-24 mx-auto text-gray-300 dark:text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                </svg>
              </div>
              <h3 className={`text-2xl font-semibold mb-3 ${darkMode ? 'text-gray-200' : 'text-gray-900'}`}>
                No results found
              </h3>
              <p className={`text-base mb-2 ${darkMode ? 'text-gray-400' : 'text-gray-600'}`}>
                No results found for <span className="font-semibold text-slate-700 dark:text-slate-300">"{lastSearchQuery}"</span>.
              </p>
              <p className={`text-sm ${darkMode ? 'text-gray-500' : 'text-gray-500'}`}>
                Try searching for something else.
              </p>
            </div>
          </div>
        </div>
      );
    }
    
    // 검색 전 홈 화면
    return (
      <div className="w-full mt-12 px-4 max-w-7xl mx-auto">
        {/* AI Recommendations (Row 1) */}
        <div className="mb-16">
          <h2 className="text-3xl font-bold text-gray-900 dark:text-gray-100 mb-8">
            AI Recommendations for You
          </h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-6 justify-center mx-auto max-w-7xl">
            {(() => {
              const safeRecommendations = aiRecommendations || [];
              if (!Array.isArray(safeRecommendations) || safeRecommendations.length === 0) {
                return <div className="col-span-full text-center py-8 text-gray-500">No recommendations available.</div>;
              }
              return safeRecommendations.map((product) => (
              <div
                key={product.id}
                className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg overflow-hidden hover:shadow-xl transition-all duration-300 group"
              >
                {/* 상품 이미지 플레이스홀더 */}
                <div className="w-full bg-gray-100 dark:bg-gray-700 relative group" style={{ aspectRatio: '1 / 1', overflow: 'hidden' }}>
                  {/* 위시리스트 버튼 */}
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      toggleWishlist({ ...product, site: product.brand });
                    }}
                    className={`absolute top-2 right-2 z-10 p-2 rounded-full shadow-lg backdrop-blur-sm transition-all duration-200 hover:scale-110 opacity-0 group-hover:opacity-100 ${
                      isInWishlist({ ...product, site: product.brand }) 
                        ? 'bg-red-500 text-white opacity-100' 
                        : 'bg-white/90 text-gray-600 hover:bg-red-50'
                    }`}
                    title={isInWishlist({ ...product, site: product.brand }) ? 'Remove from wishlist' : 'Add to wishlist'}
                  >
                    <Heart 
                      size={16} 
                      className={isInWishlist({ ...product, site: product.brand }) ? 'fill-current' : ''}
                    />
                  </button>
                  <div className="w-full h-full bg-gradient-to-br from-gray-200 to-gray-300 dark:from-gray-600 dark:to-gray-700 flex items-center justify-center">
                    <span className="text-gray-400 dark:text-gray-500 text-sm font-medium">
                      {product.brand}
                    </span>
                  </div>
                </div>

                {/* 상품 정보 */}
                <div className="p-4">
                  {/* 브랜드 이름 */}
                  <div className="mb-2">
                    <span className="text-xs font-semibold text-indigo-600 dark:text-indigo-400 uppercase tracking-wide">
                      {product.brand}
                    </span>
                  </div>

                  {/* 상품명 */}
                  <h4 className="text-sm font-medium text-gray-900 dark:text-gray-100 mb-3 line-clamp-2 min-h-[2.5rem]">
                    {product.name}
                  </h4>

                  {/* 가격 및 할인율 */}
                  <div className="mb-4">
                    <div className="flex items-baseline gap-2 mb-1">
                      <span className="text-xl font-bold text-gray-900 dark:text-gray-100">
                        {product.price}
                      </span>
                      <span className="text-sm text-red-600 dark:text-red-400 font-semibold">
                        -{product.discount}%
                      </span>
                    </div>
                    <span className="text-xs text-gray-500 dark:text-gray-400 line-through">
                      {product.originalPrice}
                    </span>
                  </div>

                  {/* View Deal 버튼 */}
                  <button className="w-full py-2.5 px-4 bg-slate-700 dark:bg-slate-600 text-white text-sm font-medium rounded-md hover:bg-slate-800 dark:hover:bg-slate-700 transition-colors">
                    View Deal
                  </button>
                </div>
              </div>
            ));
            })()}
          </div>
        </div>

        {/* Price Drop Alerts (Row 2) - 할인율 20% 이상 상품 */}
        <div className="mb-16">
          <h2 className="text-3xl font-bold text-gray-900 dark:text-gray-100 mb-8">
            Price Drop Alerts
          </h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-6 justify-center mx-auto max-w-7xl">
            {(() => {
              const safePriceDrop = priceDropProducts || [];
              if (!Array.isArray(safePriceDrop) || safePriceDrop.length === 0) {
                return <div className="col-span-full text-center py-8 text-gray-500">No price drop products available.</div>;
              }
              return safePriceDrop.map((product) => (
              <div
                key={`price-drop-${product.id}`}
                className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg overflow-hidden hover:shadow-xl transition-all duration-300 group relative"
              >
                {/* Price Dropped! 뱃지 */}
                <div className="absolute top-2 left-2 z-10 bg-red-500 text-white px-3 py-1 rounded-full text-xs font-bold shadow-lg">
                  Price Dropped!
                </div>
                
                {/* 상품 이미지 플레이스홀더 */}
                <div className="w-full bg-gray-100 dark:bg-gray-700 relative" style={{ aspectRatio: '1 / 1', overflow: 'hidden' }}>
                  <div className="w-full h-full bg-gradient-to-br from-red-100 to-red-200 dark:from-red-900 dark:to-red-800 flex items-center justify-center">
                    <span className="text-red-600 dark:text-red-300 text-sm font-medium">
                      {product.brand}
                    </span>
                  </div>
                </div>

                {/* 상품 정보 */}
                <div className="p-4">
                  <div className="mb-2">
                    <span className="text-xs font-semibold text-red-600 dark:text-red-400 uppercase tracking-wide">
                      {product.brand}
                    </span>
                  </div>
                  <h4 className="text-sm font-medium text-gray-900 dark:text-gray-100 mb-3 line-clamp-2 min-h-[2.5rem]">
                    {product.name}
                  </h4>
                  <div className="mb-4">
                    <div className="flex items-baseline gap-2 mb-1">
                      <span className="text-xl font-bold text-red-600 dark:text-red-400">
                        {product.price}
                      </span>
                      <span className="text-sm text-red-600 dark:text-red-400 font-semibold">
                        -{product.discount}%
                      </span>
                    </div>
                    <span className="text-xs text-gray-500 dark:text-gray-400 line-through">
                      {product.originalPrice}
                    </span>
                  </div>
                  <button className="w-full py-2.5 px-4 bg-red-600 text-white text-sm font-medium rounded-md hover:bg-red-700 transition-colors">
                    View Deal
                  </button>
                </div>
              </div>
            ));
            })()}
          </div>
        </div>

        {/* Site-Specific Best Sellers (Row 3) - 탭 메뉴 */}
        <div className="mb-16">
          <div className="flex items-center justify-between mb-8">
            <h2 className="text-3xl font-bold text-gray-900 dark:text-gray-100">
              Best Sellers by Store
            </h2>
            {/* 탭 메뉴 */}
            <div className="flex gap-2 bg-gray-100 dark:bg-gray-800 p-1 rounded-lg">
              {['Amazon', 'Target', 'Walmart'].map((site) => (
                <button
                  key={site}
                  onClick={() => {
                    if (setSelectedSiteTab) {
                      setSelectedSiteTab(site);
                    }
                  }}
                  className={`px-6 py-2 rounded-md text-sm font-semibold transition-all ${
                    selectedSiteTab === site
                      ? 'bg-white dark:bg-gray-700 text-indigo-600 dark:text-indigo-400 shadow-sm' 
                      : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-200'
                  }`}
                >
                  {site}
                </button>
              ))}
            </div>
          </div>

          {/* 선택된 사이트별 인기 상품 그리드 */}
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-6 justify-center mx-auto max-w-7xl">
            {(() => {
              const safeBestSellers = siteBestSellers[selectedSiteTab || 'Amazon'] || [];
              if (!Array.isArray(safeBestSellers) || safeBestSellers.length === 0) {
                return <div className="col-span-full text-center py-8 text-gray-500">No best sellers available.</div>;
              }
              return safeBestSellers.map((product) => (
              <div
                key={`bestseller-${product.id}`}
                className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg overflow-hidden hover:shadow-xl transition-all duration-300 group"
              >
                {/* 상품 이미지 플레이스홀더 */}
                <div className="w-full bg-gray-100 dark:bg-gray-700 relative" style={{ aspectRatio: '1 / 1', overflow: 'hidden' }}>
                  <div className="w-full h-full bg-gradient-to-br from-indigo-100 to-indigo-200 dark:from-indigo-900 dark:to-indigo-800 flex items-center justify-center">
                    <span className="text-indigo-600 dark:text-indigo-300 text-sm font-medium">
                      {product.brand}
                    </span>
                  </div>
                </div>

                {/* 상품 정보 */}
                <div className="p-4">
                  <div className="mb-2">
                    <span className="text-xs font-semibold text-indigo-600 dark:text-indigo-400 uppercase tracking-wide">
                      {product.brand}
                    </span>
                  </div>
                  <h4 className="text-sm font-medium text-gray-900 dark:text-gray-100 mb-3 line-clamp-2 min-h-[2.5rem]">
                    {product.name}
                  </h4>
                  <div className="mb-4">
                    <div className="flex items-baseline gap-2 mb-1">
                      <span className="text-xl font-bold text-gray-900 dark:text-gray-100">
                        {product.price}
                      </span>
                      {product.discount > 0 && (
                        <span className="text-sm text-red-600 dark:text-red-400 font-semibold">
                          -{product.discount}%
                        </span>
                      )}
                    </div>
                    {product.originalPrice && (
                      <span className="text-xs text-gray-500 dark:text-gray-400 line-through">
                        {product.originalPrice}
                      </span>
                    )}
                  </div>
                  <button className="w-full py-2.5 px-4 bg-slate-700 dark:bg-slate-600 text-white text-sm font-medium rounded-md hover:bg-slate-800 dark:hover:bg-slate-700 transition-colors">
                    View Deal
                  </button>
                </div>
              </div>
            ));
            })()}
          </div>
        </div>
      </div>
    )
  }

  // 사이트별 필터링 및 배송 방법 필터링 (표시된 결과에 대해서만, 메모이제이션)
  const filteredResults = useMemo(() => {
    let filtered = displayedResults;
    
    // 스토어 필터링
    if (selectedSites.length > 0) {
      filtered = filtered.filter(item => selectedSites.includes(item.site));
    }
    
    // 배송 방법 필터링
    if (shippingMethod === 'domestic') {
      filtered = filtered.filter(item => !overseasSites.includes(item.site));
    } else if (shippingMethod === 'international') {
      filtered = filtered.filter(item => overseasSites.includes(item.site));
    }
    // shippingMethod === 'all'이면 필터링 없음
    
    return filtered;
  }, [displayedResults, selectedSites, shippingMethod]);

  // 원화 환산 함수 (1 USD = 1,400 KRW 고정)
  const convertToKRW = (priceStr) => {
    const priceNum = parseFloat(priceStr.replace(/[$,]/g, '')) || 0;
    return Math.round(priceNum * 1400).toLocaleString('ko-KR');
  };

  // 해외직구 사이트 목록
  const overseasSites = ['AliExpress', 'iHerb', 'Etsy', 'Temu'];
  
  // 배송 정보 파싱 (Arrives by, Ships in 등 추출)
  const parseShipping = (shipping) => {
    if (!shipping) return '';
    const lowerShipping = shipping.toLowerCase();
    if (lowerShipping.includes('arrives') || lowerShipping.includes('arrives by')) {
      return shipping;
    }
    if (lowerShipping.includes('ships in') || lowerShipping.includes('ships')) {
      return shipping;
    }
    return shipping;
  };

  return (
    <div className="w-full mt-12 px-4">
      <div className="flex gap-6">
        {/* 좌측 필터 바 (쿠팡 스타일) */}
        <div className="hidden lg:block w-64 flex-shrink-0">
          <div className={`sticky top-20 ${darkMode ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200'} border rounded-lg p-4 shadow-sm`}>
            <h3 className={`text-lg font-bold mb-4 ${darkMode ? 'text-gray-200' : 'text-gray-900'}`}>
              Filter by Store
            </h3>
            <div className="space-y-2 max-h-[600px] overflow-y-auto">
              {selectedSites.length === 0 ? (
                <p className={`text-sm ${darkMode ? 'text-gray-400' : 'text-gray-500'} mb-2`}>
                  All stores selected
                </p>
              ) : (
                <p className={`text-sm ${darkMode ? 'text-gray-400' : 'text-gray-500'} mb-2`}>
                  {selectedSites.length} store{selectedSites.length !== 1 ? 's' : ''} selected
                </p>
              )}
              {selectedSites.length > 0 && clearAllFilters && (
                <button
                  onClick={clearAllFilters}
                  className={`w-full text-left text-xs ${darkMode ? 'text-gray-400 hover:text-gray-300' : 'text-gray-600 hover:text-gray-800'} mb-4`}
                >
                  Clear all
                </button>
              )}
              {(() => {
                const safeUniqueSites = uniqueSites || [];
                if (!Array.isArray(safeUniqueSites) || safeUniqueSites.length === 0) {
                  return <p className={`text-sm ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>No stores available</p>;
                }
                return safeUniqueSites.map((site) => {
                  const isChecked = selectedSites.length === 0 || selectedSites.includes(site);
                  return (
                    <label
                      key={site}
                      className={`flex items-center gap-3 px-3 py-2 rounded-md cursor-pointer transition-colors ${
                        isChecked
                          ? darkMode
                            ? 'bg-indigo-900/30 text-indigo-300'
                            : 'bg-indigo-50 text-indigo-700'
                          : darkMode
                          ? 'hover:bg-gray-700 text-gray-300'
                          : 'hover:bg-gray-50 text-gray-700'
                      }`}
                    >
                      <input
                        type="checkbox"
                        checked={isChecked}
                        onChange={() => toggleSite(site)}
                        className={`w-4 h-4 rounded border-gray-300 text-indigo-600 focus:ring-indigo-500 cursor-pointer ${
                          darkMode ? 'bg-gray-700 border-gray-600' : ''
                        }`}
                      />
                      <span className="text-sm font-medium flex-1">{site}</span>
                      <span className={`text-xs ${darkMode ? 'text-gray-500' : 'text-gray-400'}`}>
                        {(results && Array.isArray(results) ? results.filter(r => r && r.site === site) : []).length}
                      </span>
                    </label>
                  );
                });
              })()}
            </div>
          </div>
        </div>

        {/* 메인 상품 그리드 */}
        <div className="flex-1">
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-4 justify-center mx-auto max-w-7xl">
            {(() => {
              // 안전장치: filteredResults가 없거나 배열이 아닐 때 빈 배열로 처리
              const safeFilteredResults = filteredResults || [];
              if (!Array.isArray(safeFilteredResults) || safeFilteredResults.length === 0) {
                return (
                  <div className="col-span-full text-center py-12">
                    <p className="text-gray-500 text-lg mb-2">No products found.</p>
                    <p className="text-gray-400 text-sm">Try adjusting your search or filters.</p>
                  </div>
                );
              }
              return safeFilteredResults.map((item, index) => {
              // null/undefined 방어 로직
              if (!item || typeof item !== 'object') return null;
              
              const itemName = item.name || item.title || 'Product';
              const itemSite = item.site || 'Unknown';
              const itemPriceRaw = item.price;
              const hasValidPrice = formatPrice && isValidPrice ? isValidPrice(itemPriceRaw) : (itemPriceRaw && itemPriceRaw !== '$0.00' && itemPriceRaw !== '0');
              const itemPrice = hasValidPrice && formatPrice
                ? formatPrice(itemPriceRaw, currency) 
                : null;
              const itemImage = item.img || item.image || null;
              const itemLinkRaw = item.link || item.url || '#';
              // Amazon 링크에 Affiliate Tag 강제 적용
              const itemLink = addAmazonAffiliateTag(itemLinkRaw);
              const itemShipping = item.shipping || '';
              
              const isOverseas = overseasSites.includes(itemSite);
              const shippingInfo = parseShipping(itemShipping);
              
              return (
            <div
              key={`${itemSite}-${index}-${itemLink || index}`}
              className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg overflow-hidden hover:shadow-xl transition-all duration-300 animate-fade-in group"
              style={{
                animation: `fadeIn 0.3s ease-in ${index * 0.03}s both`,
              }}
            >
              {/* 상품 이미지 - 고정 크기 */}
              <div className="w-full bg-gray-100 dark:bg-gray-700 relative" style={{ aspectRatio: '1 / 1', overflow: 'hidden' }}>
                {/* 위시리스트 & 장바구니 버튼 */}
                <div className="absolute top-2 right-2 z-10 flex flex-col gap-2 opacity-0 group-hover:opacity-100 transition-opacity duration-200">
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      toggleWishlist(item);
                    }}
                    className={`p-2 rounded-full shadow-lg backdrop-blur-sm transition-all duration-200 hover:scale-110 ${
                      isInWishlist(item) 
                        ? 'bg-red-500 text-white' 
                        : 'bg-white/90 text-gray-600 hover:bg-red-50'
                    }`}
                    title={isInWishlist(item) ? 'Remove from wishlist' : 'Add to wishlist'}
                  >
                    <Heart 
                      size={18} 
                      className={isInWishlist(item) ? 'fill-current' : ''}
                    />
                  </button>
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      toggleCart(item);
                    }}
                    className={`p-2 rounded-full shadow-lg backdrop-blur-sm transition-all duration-200 hover:scale-110 ${
                      isInCart(item) 
                        ? 'bg-indigo-500 text-white' 
                        : 'bg-white/90 text-gray-600 hover:bg-indigo-50'
                    }`}
                    title={isInCart(item) ? 'Remove from cart' : 'Add to cart'}
                  >
                    <ShoppingCart 
                      size={18} 
                      className={isInCart(item) ? 'fill-current' : ''}
                    />
                  </button>
                </div>
                {itemImage ? (
                  <img
                    src={itemImage}
                    alt={itemName}
                    className="w-full h-full object-contain p-3 group-hover:scale-105 transition-transform duration-300"
                    onError={(e) => {
                      e.target.style.display = 'none'
                      const placeholder = e.target.parentElement.querySelector('.image-placeholder')
                      if (placeholder) placeholder.style.display = 'flex'
                    }}
                    loading="lazy"
                  />
                ) : null}
                <div 
                  className="image-placeholder w-full h-full bg-gradient-to-br from-gray-100 to-gray-200 dark:from-gray-700 dark:to-gray-800 flex flex-col items-center justify-center p-4"
                  style={{ display: itemImage ? 'none' : 'flex' }}
                >
                  <svg className="w-16 h-16 text-gray-300 dark:text-gray-600 mb-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                  </svg>
                  <span className="text-gray-400 dark:text-gray-500 text-xs font-medium text-center">
                    {itemSite}
                  </span>
                </div>
              </div>

              {/* 상품 정보 - 티켓 스타일 (정보 전달 위주) */}
              <div className="p-4 border-t-2 border-gray-100">
                {/* 상단: 스토어 로고 + 배송 정보 */}
                <div className="flex items-center justify-between mb-3">
                  {/* 스토어 로고 (브랜드 컬러) */}
                  <span className={`text-xs font-bold uppercase tracking-wide px-3 py-1.5 rounded-md shadow-sm ${
                    itemSite === 'Target' ? 'bg-red-500 text-white' :
                    itemSite === 'Walmart' ? 'bg-blue-500 text-white' :
                    itemSite === 'Amazon' ? 'bg-orange-500 text-white' :
                    itemSite === 'Best Buy' ? 'bg-yellow-400 text-black' :
                    itemSite === 'Nike' ? 'bg-black text-white' :
                    itemSite === 'eBay' ? 'bg-green-500 text-white' :
                    itemSite === 'Home Depot' ? 'bg-orange-600 text-white' :
                    itemSite === 'Costco' ? 'bg-red-600 text-white' :
                    itemSite === 'Wayfair' ? 'bg-blue-600 text-white' :
                    itemSite === 'Apple' ? 'bg-gray-800 text-white' :
                    itemSite === 'Macy\'s' ? 'bg-red-600 text-white' :
                    itemSite === 'Lowe\'s' ? 'bg-blue-600 text-white' :
                    itemSite === 'Kohl\'s' ? 'bg-green-600 text-white' :
                    itemSite === 'Sephora' ? 'bg-pink-500 text-white' :
                    itemSite === 'Chewy' ? 'bg-blue-500 text-white' :
                    itemSite === 'Etsy' ? 'bg-orange-500 text-white' :
                    itemSite === 'Newegg' ? 'bg-orange-500 text-white' :
                    itemSite === 'Zappos' ? 'bg-blue-500 text-white' :
                    itemSite === 'Temu' ? 'bg-red-500 text-white' :
                    itemSite === 'Shein' ? 'bg-pink-500 text-white' :
                    itemSite === 'AliExpress' ? 'bg-red-500 text-white' :
                    'bg-gray-600 text-white'
                  }`}>
                    {itemSite}
                  </span>
                  
                  {/* 배송 정보 (아이콘 + 정확한 배송일) */}
                  {isOverseas ? (
                    <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-yellow-100 dark:bg-yellow-900/30 border border-yellow-300">
                      <span className="text-xs">🚢</span>
                      <span className="text-xs font-semibold text-yellow-700">
                        {shippingInfo || 'International'}
                      </span>
                    </div>
                  ) : (
                    <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-green-100 dark:bg-green-900/30 border border-green-300">
                      <span className="text-xs">🚀</span>
                      <span className="text-xs font-semibold text-green-700">
                        {shippingInfo || '2-3 Days'}
                      </span>
                    </div>
                  )}
                </div>

                {/* 상품명 (간결하게) */}
                <h3 className="text-sm font-semibold text-gray-900 dark:text-gray-100 mb-3 line-clamp-2 min-h-[2.5rem]">
                  {itemName}
                </h3>

                {/* 가격 (가장 크게 강조) */}
                <div className="mb-3">
                  {hasValidPrice && itemPrice ? (
                    <div className="flex items-baseline gap-2 flex-wrap">
                      <span className="text-2xl font-bold text-gray-900 dark:text-gray-100">
                        {itemPrice}
                      </span>
                      {/* Lowest Price 배지 */}
                      {(() => {
                        const safeResults = results || [];
                        if (!Array.isArray(safeResults)) return null;
                        const sameNameItems = safeResults.filter(r => 
                          r && (r.name || r.title) && 
                          (r.name || r.title).toLowerCase() === itemName.toLowerCase()
                        );
                        if (sameNameItems.length > 1) {
                          const prices = sameNameItems
                            .map(r => parseFloat((r.price || '0').replace(/[$,]/g, '')))
                            .filter(p => p > 0);
                          if (prices.length > 0) {
                            const minPrice = Math.min(...prices);
                            const currentPrice = parseFloat((itemPriceRaw || '0').replace(/[$,]/g, ''));
                            if (currentPrice > 0 && Math.abs(currentPrice - minPrice) < 0.01) {
                              return (
                                <span className="text-xs font-bold bg-green-500 text-white px-2 py-0.5 rounded-full shadow-sm">
                                  🏆 Lowest
                                </span>
                              );
                            }
                          }
                        }
                        return null;
                      })()}
                    </div>
                  ) : (
                    <button className="text-sm text-indigo-600 dark:text-indigo-400 font-semibold hover:text-indigo-700 dark:hover:text-indigo-300 underline">
                      Check Price on Store
                    </button>
                  )}
                </div>

                {/* Visit Site 버튼 (눈에 띄는 색상, 클릭 유도) */}
                {itemLink && itemLink !== '#' && (
                  <a
                    href={itemLink}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="block w-full text-center py-3 px-4 bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-sm rounded-lg shadow-md hover:shadow-lg transition-all"
                  >
                    Visit Site →
                  </a>
                )}
              </div>
            </div>
              );
            });
            })()}
          </div>
          
          {/* 무한 스크롤 트리거 및 로딩 스피너 */}
          {displayedCount < results.length && (
            <div ref={loadMoreRef} className="col-span-full flex justify-center items-center py-12">
              {loadingMore ? (
                <div className="flex flex-col items-center gap-4 animate-fade-in">
                  <div className="relative">
                    <div className="w-12 h-12 border-4 border-slate-200 dark:border-gray-700 border-t-slate-600 dark:border-t-slate-400 rounded-full animate-spin"></div>
                    <div className="absolute inset-0 w-12 h-12 border-4 border-transparent border-r-slate-400 dark:border-r-slate-500 rounded-full animate-spin" style={{ animationDirection: 'reverse', animationDuration: '0.8s' }}></div>
                  </div>
                  <span className={`text-sm font-medium ${darkMode ? 'text-gray-300' : 'text-gray-700'}`}>
                    Loading more products...
                  </span>
                  <span className={`text-xs ${darkMode ? 'text-gray-500' : 'text-gray-500'}`}>
                    {displayedCount} of {results.length} products shown
                  </span>
                </div>
              ) : (
                <div className="h-24 flex items-center justify-center">
                  <div className={`w-1 h-1 rounded-full ${darkMode ? 'bg-gray-600' : 'bg-gray-300'} animate-pulse`}></div>
              </div>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Recommended for [User Name] 섹션 (로그인한 사용자용) */}
      {user && (
        <div className="mt-16 mb-8">
          <h3 className="text-2xl font-bold text-gray-900 dark:text-gray-100 mb-6">
            Recommended for {user.displayName || 'You'}
          </h3>
          <div className="text-center py-12 px-4 rounded-lg border border-dashed border-gray-300 dark:border-gray-700">
            <p className="text-gray-500 dark:text-gray-400">
              Personalized recommendations will appear here soon...
            </p>
          </div>
      </div>
      )}
    </div>
  )
}

export default SearchResults
