"""
인프라 안정성 및 최적화 유틸리티 모듈
- 차단 방지 로직 (User-Agent, Proxy, Delay)
- 이미지 최적화
- 캐싱 헬퍼
"""
import random
import time
import asyncio
from typing import Optional, Dict, Any
from urllib.parse import urlparse, urlencode, parse_qs, urlunparse

# User-Agent 풀 (실제 브라우저 User-Agent 목록)
USER_AGENTS = [
    "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
    "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
    "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/119.0.0.0 Safari/537.36",
    "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.1 Safari/605.1.15",
    "Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:121.0) Gecko/20100101 Firefox/121.0",
    "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36 Edg/120.0.0.0",
    "Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
]

def get_random_user_agent() -> str:
    """무작위 User-Agent 반환"""
    return random.choice(USER_AGENTS)

def get_request_headers(api_key: str, host: str, custom_headers: Optional[Dict[str, str]] = None) -> Dict[str, str]:
    """API 요청 헤더 생성 (무작위 User-Agent 포함)"""
    headers = {
        "x-rapidapi-key": api_key,
        "x-rapidapi-host": host,
        "User-Agent": get_random_user_agent(),
        "Accept": "application/json",
        "Accept-Language": "en-US,en;q=0.9",
        "Accept-Encoding": "gzip, deflate, br",
        "Connection": "keep-alive",
        "Upgrade-Insecure-Requests": "1",
    }
    if custom_headers:
        headers.update(custom_headers)
    return headers

async def random_delay(min_seconds: float = 0.5, max_seconds: float = 1.5):
    """랜덤 딜레이 (0.5~1.5초 기본값) - 봇 차단 방지"""
    delay = random.uniform(min_seconds, max_seconds)
    await asyncio.sleep(delay)

# Proxy Rotation 미들웨어 구조 (향후 확장용)
class ProxyRotator:
    """Proxy Rotation 서비스 연동을 위한 미들웨어 구조"""
    def __init__(self):
        self.proxies = []  # 환경 변수에서 로드 가능
        self.current_index = 0
    
    def get_proxy(self) -> Optional[Dict[str, str]]:
        """다음 프록시 반환 (순환)"""
        if not self.proxies:
            return None
        proxy = self.proxies[self.current_index]
        self.current_index = (self.current_index + 1) % len(self.proxies)
        return proxy
    
    def add_proxy(self, proxy_url: str):
        """프록시 추가 (환경 변수에서 로드 가능)"""
        self.proxies.append(proxy_url)

# 전역 Proxy Rotator 인스턴스
proxy_rotator = ProxyRotator()

def get_image_proxy_url(original_url: str, width: Optional[int] = None, height: Optional[int] = None, format: str = "webp") -> str:
    """
    이미지 프록시 URL 생성 (향후 이미지 최적화 서버 연동용)
    실제 구현 시 이미지 리사이징/최적화 서버로 리다이렉트
    """
    if not original_url:
        return ""
    
    # 실제 구현 시 이미지 프록시 서버 URL로 변환
    # 예: https://image-proxy.example.com/resize?url={original_url}&width={width}&height={height}&format={format}
    # 현재는 원본 URL 반환 (프론트엔드에서 lazy loading 적용)
    return original_url

def is_special_event(query: str) -> bool:
    """스페셜 이벤트/핫딜 키워드 감지"""
    special_keywords = [
        "valentine", "winter", "new year", "black friday", "cyber monday",
        "limited", "deal", "sale", "discount", "hot", "flash", "clearance"
    ]
    query_lower = query.lower()
    return any(keyword in query_lower for keyword in special_keywords)

def get_cache_ttl(data_type: str, query: str = "") -> int:
    """
    데이터 타입별 TTL 반환 (초 단위)
    - 상품 기본 정보: 24시간 (86400초)
    - 일반 가격 정보: 1시간 (3600초)
    - 스페셜 이벤트/핫딜: 10분 (600초)
    - 검색 결과: 30분 (1800초)
    """
    if data_type == "product_basic":
        return 86400  # 24시간
    elif data_type == "price_general":
        return 3600  # 1시간
    elif data_type == "price_special" or is_special_event(query):
        return 600  # 10분
    elif data_type == "search_results":
        return 1800  # 30분
    else:
        return 3600  # 기본값: 1시간

def add_affiliate_params(product: Dict[str, Any], site: str) -> Dict[str, Any]:
    """
    상품 링크에 Affiliate 파라미터 추가
    Amazon의 경우 soulmaten7-20 태그 강제 적용
    """
    import os
    from urllib.parse import urlparse, urlencode, parse_qs, urlunparse
    
    if not product or not isinstance(product, dict):
        return product
    
    link = product.get("link") or product.get("url") or product.get("product_url") or ""
    if not link or not isinstance(link, str):
        return product
    
    # Amazon 링크인 경우
    if site.lower() == "amazon" or "amazon.com" in link.lower() or "amzn.to" in link.lower():
        amazon_tag = os.getenv("AMAZON_AFFILIATE_TAG", "soulmaten7-20")
        
        try:
            parsed = urlparse(link)
            query_params = parse_qs(parsed.query)
            
            # 기존 tag 제거하고 새로 추가
            query_params.pop("tag", None)
            query_params["tag"] = [amazon_tag]
            
            # URL 재구성
            new_query = urlencode(query_params, doseq=True)
            new_parsed = parsed._replace(query=new_query)
            new_link = urlunparse(new_parsed)
            
            # 상품 객체 업데이트
            result = product.copy()
            if "link" in result:
                result["link"] = new_link
            if "url" in result:
                result["url"] = new_link
            if "product_url" in result:
                result["product_url"] = new_link
            
            print(f"✅ Amazon Affiliate Tag 적용: {new_link}")
            return result
        except Exception as e:
            print(f"⚠️ Affiliate Tag 추가 실패: {e}")
            # 실패 시 간단한 문자열 처리
            separator = "&" if "?" in link else "?"
            if "tag=" in link:
                # 기존 tag 제거
                import re
                link = re.sub(r"[?&]tag=[^&]*", "", link)
                separator = "&" if "?" in link else "?"
            new_link = f"{link}{separator}tag={amazon_tag}"
            result = product.copy()
            if "link" in result:
                result["link"] = new_link
            if "url" in result:
                result["url"] = new_link
            return result
    
    return product
