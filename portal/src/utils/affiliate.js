/**
 * Amazon Affiliate Tag 강제 적용 유틸리티
 * 모든 Amazon 링크에 soulmaten7-20 태그를 자동으로 추가
 */

const AMAZON_AFFILIATE_TAG = import.meta.env.VITE_AMAZON_AFFILIATE_TAG || 'soulmaten7-20';

/**
 * Amazon 링크에 Affiliate Tag를 강제로 추가
 * @param {string} url - 원본 URL
 * @returns {string} - 태그가 추가된 URL
 */
export function addAmazonAffiliateTag(url) {
  if (!url || typeof url !== 'string') {
    return url || '#';
  }

  // Amazon 링크가 아니면 그대로 반환
  if (!url.includes('amazon.com') && !url.includes('amzn.to')) {
    return url;
  }

  try {
    const urlObj = new URL(url);
    
    // 이미 tag 파라미터가 있으면 기존 것을 제거하고 새로 추가
    urlObj.searchParams.delete('tag');
    urlObj.searchParams.set('tag', AMAZON_AFFILIATE_TAG);
    
    const finalUrl = urlObj.toString();
    
    // 콘솔에 생성된 링크 예시 출력
    console.log(`✅ Amazon Affiliate Tag 적용: ${finalUrl}`);
    
    return finalUrl;
  } catch (error) {
    // URL 파싱 실패 시 간단한 문자열 처리
    console.warn('⚠️ URL 파싱 실패, 간단한 문자열 처리:', error);
    
    if (url.includes('?')) {
      // 기존 쿼리 파라미터가 있는 경우
      if (url.includes('tag=')) {
        // 기존 tag 제거
        url = url.replace(/[?&]tag=[^&]*/g, '');
      }
      return `${url}&tag=${AMAZON_AFFILIATE_TAG}`;
    } else {
      return `${url}?tag=${AMAZON_AFFILIATE_TAG}`;
    }
  }
}

/**
 * 상품 객체의 링크에 Amazon Affiliate Tag 적용
 * @param {Object} product - 상품 객체
 * @returns {Object} - 링크가 수정된 상품 객체
 */
export function processProductLink(product) {
  if (!product || typeof product !== 'object') {
    return product;
  }

  const linkField = product.link || product.url || product.product_url;
  
  if (linkField && (linkField.includes('amazon.com') || linkField.includes('amzn.to'))) {
    return {
      ...product,
      link: addAmazonAffiliateTag(linkField),
      url: addAmazonAffiliateTag(linkField),
      product_url: addAmazonAffiliateTag(linkField),
    };
  }

  return product;
}

/**
 * 상품 배열의 모든 Amazon 링크에 Affiliate Tag 적용
 * @param {Array} products - 상품 배열
 * @returns {Array} - 링크가 수정된 상품 배열
 */
export function processProductLinks(products) {
  if (!Array.isArray(products)) {
    return products;
  }

  return products.map(product => processProductLink(product));
}
