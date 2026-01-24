import { createContext, useContext, useState, useEffect } from 'react';

const WishlistContext = createContext();

export const useWishlist = () => {
  const context = useContext(WishlistContext);
  if (!context) {
    throw new Error('useWishlist must be used within WishlistProvider');
  }
  return context;
};

export const WishlistProvider = ({ children }) => {
  const [wishlist, setWishlist] = useState([]);
  const [cart, setCart] = useState([]);

  // LocalStorage에서 데이터 로드
  useEffect(() => {
    const savedWishlist = localStorage.getItem('portal_wishlist');
    const savedCart = localStorage.getItem('portal_cart');
    
    if (savedWishlist) {
      try {
        setWishlist(JSON.parse(savedWishlist));
      } catch (e) {
        console.error('Failed to load wishlist:', e);
      }
    }
    
    if (savedCart) {
      try {
        setCart(JSON.parse(savedCart));
      } catch (e) {
        console.error('Failed to load cart:', e);
      }
    }
  }, []);

  // LocalStorage에 저장
  useEffect(() => {
    localStorage.setItem('portal_wishlist', JSON.stringify(wishlist));
  }, [wishlist]);

  useEffect(() => {
    localStorage.setItem('portal_cart', JSON.stringify(cart));
  }, [cart]);

  // 위시리스트에 상품 추가/제거
  const toggleWishlist = (product) => {
    setWishlist(prev => {
      const productId = product.id || `${product.site}_${product.name}_${product.price}`;
      const exists = prev.find(item => {
        const itemId = item.id || `${item.site}_${item.name}_${item.price}`;
        return itemId === productId;
      });
      
      if (exists) {
        return prev.filter(item => {
          const itemId = item.id || `${item.site}_${item.name}_${item.price}`;
          return itemId !== productId;
        });
      } else {
        return [...prev, { ...product, id: productId, addedAt: new Date().toISOString() }];
      }
    });
  };

  // 장바구니에 상품 추가/제거
  const toggleCart = (product) => {
    setCart(prev => {
      const productId = product.id || `${product.site}_${product.name}_${product.price}`;
      const exists = prev.find(item => {
        const itemId = item.id || `${item.site}_${item.name}_${item.price}`;
        return itemId === productId;
      });
      
      if (exists) {
        return prev.filter(item => {
          const itemId = item.id || `${item.site}_${item.name}_${item.price}`;
          return itemId !== productId;
        });
      } else {
        return [...prev, { ...product, id: productId, addedAt: new Date().toISOString() }];
      }
    });
  };

  // 상품이 위시리스트에 있는지 확인
  const isInWishlist = (product) => {
    const productId = product.id || `${product.site}_${product.name}_${product.price}`;
    return wishlist.some(item => {
      const itemId = item.id || `${item.site}_${item.name}_${item.price}`;
      return itemId === productId;
    });
  };

  // 상품이 장바구니에 있는지 확인
  const isInCart = (product) => {
    const productId = product.id || `${product.site}_${product.name}_${product.price}`;
    return cart.some(item => {
      const itemId = item.id || `${item.site}_${item.name}_${item.price}`;
      return itemId === productId;
    });
  };

  // 위시리스트에서 상품 제거
  const removeFromWishlist = (productId) => {
    setWishlist(prev => prev.filter(item => {
      const itemId = item.id || `${item.site}_${item.name}_${item.price}`;
      return itemId !== productId;
    }));
  };

  // 장바구니에서 상품 제거
  const removeFromCart = (productId) => {
    setCart(prev => prev.filter(item => {
      const itemId = item.id || `${item.site}_${item.name}_${item.price}`;
      return itemId !== productId;
    }));
  };

  // 위시리스트 가져오기 (AI Recommendations에 활용)
  const getWishlistPreferences = () => {
    // 브랜드별 선호도 분석
    const brandCounts = {};
    const categoryKeywords = [];
    
    wishlist.forEach(item => {
      const brand = item.site || item.brand || 'Unknown';
      brandCounts[brand] = (brandCounts[brand] || 0) + 1;
      
      // 상품명에서 키워드 추출 (간단한 예시)
      if (item.name) {
        const words = item.name.toLowerCase().split(/\s+/);
        categoryKeywords.push(...words.filter(w => w.length > 3));
      }
    });

    return {
      preferredBrands: Object.entries(brandCounts)
        .sort((a, b) => b[1] - a[1])
        .slice(0, 5)
        .map(([brand]) => brand),
      categoryKeywords: [...new Set(categoryKeywords)].slice(0, 10),
      totalItems: wishlist.length
    };
  };

  const value = {
    wishlist,
    cart,
    toggleWishlist,
    toggleCart,
    isInWishlist,
    isInCart,
    removeFromWishlist,
    removeFromCart,
    getWishlistPreferences
  };

  return (
    <WishlistContext.Provider value={value}>
      {children}
    </WishlistContext.Provider>
  );
};
