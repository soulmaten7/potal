import os
import httpx
import asyncio
import uvicorn
import json
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from dotenv import load_dotenv

# 인프라 안정성 및 캐싱 모듈 import
from utils import get_request_headers, random_delay, get_cache_ttl, is_special_event
from cache import cached, generate_cache_key, get_cache, set_cache

# 1. 환경 변수 로드 (.env 내용을 즉시 반영합니다)
load_dotenv(override=True)
app = FastAPI()

# 2. CORS 설정 (프론트엔드 연동 필수)
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_methods=["*"],
    allow_headers=["*"],
)

class SearchRequest(BaseModel):
    query: str
    country: str = "US"  # 기본값은 US

# --- 🚀 데이터 정제 엔진 (공통 형식: name, price, image, link, site, shipping) ---
def parse_amazon(item):
    """Amazon 상품 데이터를 공통 형식으로 파싱"""
    from utils import add_affiliate_params
    try:
        name = str(item.get("product_title") or "No Title")
        price = str(item.get("product_price") or "$0")
        image = str(item.get("product_photo") or "")
        link = str(item.get("product_url") or "")
        
        # Amazon 제휴 링크는 add_affiliate_params에서 처리
        
        price_num = float(str(price).replace("$", "").replace(",", "").strip() or 0)
        
        product = {
            "site": "Amazon",
            "name": name,
            "price": price,
            "price_num": price_num,
            "image": image,
            "link": link,
            "shipping": "Prime"
        }
        # Amazon Affiliate Tag 강제 적용
        from utils import add_affiliate_params
        return add_affiliate_params(product, "Amazon")
    except Exception as e:
        print(f"⚠️ Amazon 파싱 에러: {str(e)}")
        return None

def parse_aliexpress(item):
    try:
        # AliExpress 응답 필드명 - 정밀 구조로 고정
        # name: item.get('title', {}).get('displayTitle')
        title_obj = item.get("title", {})
        name = ""
        if isinstance(title_obj, dict):
            name = title_obj.get("displayTitle") or ""
        else:
            name = str(title_obj) if title_obj else ""
        
        # name이 비어있으면 fallback
        if not name:
            name = item.get("title") or item.get("product_title") or item.get("name") or "No Title"
        
        # 최종적으로 무조건 문자열로 변환
        name = str(name) if name else "No Title"
        
        # 가격: item.get('prices', {}).get('salePrice', {}).get('formattedPrice')
        prices_obj = item.get("prices", {})
        price_formatted = "$0"
        price_num = 0.0
        
        if isinstance(prices_obj, dict):
            sale_price_obj = prices_obj.get("salePrice", {})
            if isinstance(sale_price_obj, dict):
                price_formatted = sale_price_obj.get("formattedPrice") or "$0"
            else:
                price_formatted = str(sale_price_obj) if sale_price_obj else "$0"
        
        # 가격이 없으면 fallback
        if not price_formatted or price_formatted == "$0":
            price_raw = item.get("price") or item.get("sale_price") or item.get("current_price") or item.get("product_price") or "0"
            price_formatted = str(price_raw)
        
        # 가격 문자열에서 숫자 추출
        price_str = str(price_formatted).replace("$", "").replace(",", "").replace("USD", "").strip()
        try:
            price_num = float(price_str) if price_str else 0.0
        except (ValueError, TypeError):
            price_num = 0.0
        
        # 이미지: item.get('image', {}).get('imgUrl')
        image_obj = item.get("image", {})
        image = ""
        if isinstance(image_obj, dict):
            image = image_obj.get("imgUrl") or ""
        else:
            image = str(image_obj) if image_obj else ""
        
        # 이미지가 없으면 fallback
        if not image:
            image = item.get("product_photo") or item.get("thumbnail") or item.get("image_url") or ""
        
        # 이미지 URL 교정: //로 시작하면 https:를 붙이기
        if image and str(image).startswith('//'):
            image = 'https:' + str(image)
        
        # 상세 페이지 링크: item.get('productDetailUrl')
        link = item.get("productDetailUrl") or item.get("url") or item.get("product_url") or item.get("link") or ""
        
        # 링크 생성 보장: link가 비어있으면 productId로 직접 링크 생성
        if not link or str(link).strip() == "":
            product_id = item.get("productId") or item.get("product_id") or item.get("id")
            if product_id:
                link = f"https://www.aliexpress.com/item/{str(product_id)}.html"
            else:
                link = ""  # productId도 없으면 빈 문자열 유지
        
        # 배송 날짜 정밀 추출
        delivery_info = ""
        
        # 1단계: delivery 또는 delivery_date 키 확인
        delivery = item.get("delivery") or item.get("delivery_date") or item.get("deliveryDate")
        if delivery:
            delivery_info = str(delivery)
        
        # 2단계: sellingPoints 배열에서 delivery 관련 정보 찾기
        if not delivery_info or str(delivery_info).strip() == "":
            selling_points = item.get("sellingPoints", [])
            if isinstance(selling_points, list):
                for point in selling_points:
                    if isinstance(point, dict):
                        tag_text = point.get("tagText") or point.get("text") or point.get("tag") or ""
                        if tag_text:
                            tag_text_str = str(tag_text).lower()
                            # 'delivery', 'days', 'arrives' 같은 단어가 포함된 경우
                            if any(keyword in tag_text_str for keyword in ['delivery', 'days', 'arrives', 'ships', 'shipping', 'day']):
                                delivery_info = str(tag_text)
                                break
        
        # 3단계: 판매량 정보 (tradeDesc)
        trade_obj = item.get("trade", {})
        trade_desc = ""
        if isinstance(trade_obj, dict):
            trade_desc = str(trade_obj.get("tradeDesc") or "")
        
        # 4단계: shipping 정보 포맷팅 - '[배송정보] | [판매량]' 형태
        shipping_parts = []
        
        # isChoice 값이 true면 'Choice '를 앞에 붙이기
        is_choice = item.get("isChoice", False)
        choice_prefix = ""
        if is_choice:
            choice_prefix = "Choice "
        
        # 배송 정보 추가 (isChoice가 있으면 앞에 붙이기)
        if delivery_info and str(delivery_info).strip():
            delivery_info_str = str(delivery_info).strip()
            if choice_prefix:
                shipping_parts.append(f"{choice_prefix}{delivery_info_str}")
            else:
                shipping_parts.append(delivery_info_str)
        
        # 판매량 정보 추가
        if trade_desc and str(trade_desc).strip():
            shipping_parts.append(str(trade_desc).strip())
        
        # 포맷팅: 각 부분을 ' | '로 연결
        if shipping_parts:
            shipping = ' | '.join(shipping_parts)
        else:
            # 날짜 정보가 없으면 기존처럼 판매량 정보만 보여주거나 기본값
            if trade_desc and str(trade_desc).strip():
                shipping = str(trade_desc).strip()
            else:
                shipping = "Global Shipping"
        
        # 가격 포맷팅 강화: formattedPrice를 최우선으로 사용하고 문자열 처리 확실히
        if not price_formatted or price_formatted == "$0":
            # formattedPrice가 없으면 다시 시도
            if isinstance(prices_obj, dict):
                sale_price_obj = prices_obj.get("salePrice", {})
                if isinstance(sale_price_obj, dict):
                    price_formatted = sale_price_obj.get("formattedPrice") or "$0"
        
        # 가격 문자열 정리
        price_formatted = str(price_formatted).strip()
        if not price_formatted or price_formatted == "$0":
            price_formatted = "$0"
        
        # 공통 형식으로 반환 (name, price, image, link, site, shipping)
        return {
            "site": "AliExpress",
            "name": str(name),
            "price": str(price_formatted),
            "price_num": float(price_num),
            "image": str(image),
            "link": str(link),
            "shipping": str(shipping)
        }
    except Exception as e:
        print(f"⚠️ AliExpress 파싱 에러: {str(e)}")
        import traceback
        traceback.print_exc()
        return None

def parse_walmart(item):
    try:
        # 상품명, 가격, 이미지, 링크 4개 필드에 집중
        # 상품명
        name = item.get("name") or item.get("product_title") or item.get("title") or "No Title"
        name = str(name) if name else "No Title"
        
        # 가격
        p_data = item.get("price", {})
        p = p_data.get("raw") if isinstance(p_data, dict) else item.get("price") or item.get("salePrice") or item.get("current_price") or "0"
        p_str = str(p).replace("$", "").replace(",", "").strip()
        try:
            price_num = float(p_str) if p_str else 0.0
        except (ValueError, TypeError):
            price_num = 0.0
        price_formatted = f"${price_num:.2f}" if price_num > 0 else "$0"
        
        # 이미지 - thumbnail 우선 확인
        image = item.get("thumbnail") or item.get("image") or item.get("product_photo") or item.get("thumbnailImage") or ""
        image = str(image) if image else ""
        
        # 이미지 URL 교정: //로 시작하면 https:를 붙이기
        if image and str(image).startswith('//'):
            image = 'https:' + str(image)
        
        # 링크
        link = item.get("link") or item.get("product_url") or item.get("url") or ""
        link = str(link) if link else ""
        
        # 공통 형식으로 반환 (name, price, image, link, site, shipping)
        return {
            "site": "Walmart",
            "name": str(name),
            "price": str(price_formatted),
            "price_num": float(price_num),
            "image": str(image),
            "link": str(link),
            "shipping": "2nd Day"
        }
    except Exception as e:
        print(f"⚠️ Walmart 파싱 에러: {str(e)}")
        import traceback
        traceback.print_exc()
        return None

def parse_target(item):
    """Target 상품 데이터를 공통 형식으로 파싱 (Pinto Studio API)"""
    try:
        # AliExpress와 비슷한 구조로 파싱
        # 상품명
        title_obj = item.get("title", {})
        name = ""
        if isinstance(title_obj, dict):
            name = title_obj.get("displayTitle") or title_obj.get("title") or ""
        else:
            name = str(title_obj) if title_obj else ""
        
        if not name:
            name = item.get("title") or item.get("product_title") or item.get("name") or "No Title"
        name = str(name) if name else "No Title"
        
        # 가격
        prices_obj = item.get("prices", {})
        price_formatted = "$0"
        price_num = 0.0
        
        if isinstance(prices_obj, dict):
            sale_price_obj = prices_obj.get("salePrice", {}) or prices_obj.get("currentPrice", {})
            if isinstance(sale_price_obj, dict):
                price_formatted = sale_price_obj.get("formattedPrice") or sale_price_obj.get("value") or "$0"
            else:
                price_formatted = str(sale_price_obj) if sale_price_obj else "$0"
        
        if not price_formatted or price_formatted == "$0":
            price_raw = item.get("price") or item.get("sale_price") or item.get("current_price") or "0"
            price_formatted = str(price_raw)
        
        price_str = str(price_formatted).replace("$", "").replace(",", "").replace("USD", "").strip()
        try:
            price_num = float(price_str) if price_str else 0.0
        except (ValueError, TypeError):
            price_num = 0.0
        
        # 이미지 - main_image와 images 배열 모두 확인
        image = ""
        
        # 1순위: main_image 확인
        main_image = item.get("main_image")
        if main_image:
            image = str(main_image)
        
        # 2순위: images 배열 확인
        if not image:
            images = item.get("images", [])
            if isinstance(images, list) and len(images) > 0:
                first_image = images[0]
                if isinstance(first_image, dict):
                    image = first_image.get("url") or first_image.get("imgUrl") or first_image.get("imageUrl") or ""
                else:
                    image = str(first_image) if first_image else ""
        
        # 3순위: image 객체 확인
        if not image:
            image_obj = item.get("image", {})
            if isinstance(image_obj, dict):
                image = image_obj.get("imgUrl") or image_obj.get("url") or image_obj.get("imageUrl") or ""
            else:
                image = str(image_obj) if image_obj else ""
        
        # 4순위: 기타 이미지 필드 확인
        if not image:
            image = item.get("product_photo") or item.get("thumbnail") or item.get("image_url") or item.get("product_image") or ""
        
        # 이미지 URL 교정: //로 시작하면 https:를 붙이기
        if image and str(image).startswith('//'):
            image = 'https:' + str(image)
        
        # 링크
        link = item.get("productDetailUrl") or item.get("url") or item.get("product_url") or item.get("link") or ""
        if not link or str(link).strip() == "":
            product_id = item.get("productId") or item.get("product_id") or item.get("id")
            if product_id:
                link = f"https://www.target.com/p/{str(product_id)}"
        
        # 배송 정보
        shipping = item.get("shipping") or item.get("delivery") or "Free Shipping"
        
        return {
            "site": "Target",
            "name": str(name),
            "price": str(price_formatted),
            "price_num": float(price_num),
            "image": str(image),
            "link": str(link),
            "shipping": str(shipping)
        }
    except Exception as e:
        print(f"⚠️ Target 파싱 에러: {str(e)}")
        import traceback
        traceback.print_exc()
        return None

def parse_bestbuy(item):
    """Best Buy 상품 데이터를 공통 형식으로 파싱 (Pinto Studio API)"""
    try:
        # AliExpress와 비슷한 구조로 파싱
        # 상품명
        title_obj = item.get("title", {})
        name = ""
        if isinstance(title_obj, dict):
            name = title_obj.get("displayTitle") or title_obj.get("title") or ""
        else:
            name = str(title_obj) if title_obj else ""
        
        if not name:
            name = item.get("title") or item.get("product_title") or item.get("name") or "No Title"
        name = str(name) if name else "No Title"
        
        # 가격
        prices_obj = item.get("prices", {})
        price_formatted = "$0"
        price_num = 0.0
        
        if isinstance(prices_obj, dict):
            sale_price_obj = prices_obj.get("salePrice", {}) or prices_obj.get("currentPrice", {})
            if isinstance(sale_price_obj, dict):
                price_formatted = sale_price_obj.get("formattedPrice") or sale_price_obj.get("value") or "$0"
            else:
                price_formatted = str(sale_price_obj) if sale_price_obj else "$0"
        
        if not price_formatted or price_formatted == "$0":
            price_raw = item.get("price") or item.get("sale_price") or item.get("current_price") or "0"
            price_formatted = str(price_raw)
        
        price_str = str(price_formatted).replace("$", "").replace(",", "").replace("USD", "").strip()
        try:
            price_num = float(price_str) if price_str else 0.0
        except (ValueError, TypeError):
            price_num = 0.0
        
        # 이미지
        image_obj = item.get("image", {})
        image = ""
        if isinstance(image_obj, dict):
            image = image_obj.get("imgUrl") or image_obj.get("url") or ""
        else:
            image = str(image_obj) if image_obj else ""
        
        if not image:
            image = item.get("product_photo") or item.get("thumbnail") or item.get("image_url") or ""
        
        if image and str(image).startswith('//'):
            image = 'https:' + str(image)
        
        # 링크
        link = item.get("productDetailUrl") or item.get("url") or item.get("product_url") or item.get("link") or ""
        if not link or str(link).strip() == "":
            product_id = item.get("productId") or item.get("product_id") or item.get("id") or item.get("sku")
            if product_id:
                link = f"https://www.bestbuy.com/site/{str(product_id)}.p"
        
        # 배송 정보
        shipping = item.get("shipping") or item.get("delivery") or "Free Shipping"
        
        return {
            "site": "Best Buy",
            "name": str(name),
            "price": str(price_formatted),
            "price_num": float(price_num),
            "image": str(image),
            "link": str(link),
            "shipping": str(shipping)
        }
    except Exception as e:
        print(f"⚠️ Best Buy 파싱 에러: {str(e)}")
        import traceback
        traceback.print_exc()
        return None

def parse_ebay(item):
    """eBay 상품 데이터를 공통 형식으로 파싱"""
    try:
        # 상품명
        name = item.get("title") or item.get("name") or item.get("product_title") or item.get("itemTitle") or "No Title"
        name = str(name) if name else "No Title"
        
        # 가격 - currentPrice, price, value 필드 모두 확인
        price_value = None
        
        # 1순위: currentPrice 확인
        current_price = item.get("currentPrice")
        if current_price:
            if isinstance(current_price, dict):
                price_value = current_price.get("value") or current_price.get("@currencyId") or current_price.get("__value__")
            elif isinstance(current_price, (int, float)):
                price_value = current_price
            else:
                price_value = str(current_price)
        
        # 2순위: price 필드 확인
        if not price_value or price_value == "0" or (isinstance(price_value, (int, float)) and price_value == 0):
            price_obj = item.get("price")
            if price_obj:
                if isinstance(price_obj, dict):
                    price_value = price_obj.get("value") or price_obj.get("raw") or price_obj.get("amount") or price_obj.get("@currencyId") or price_obj.get("__value__")
                elif isinstance(price_obj, (int, float)):
                    price_value = price_obj
                else:
                    price_value = str(price_obj)
        
        # 3순위: 기타 가격 필드 확인
        if not price_value or price_value == "0" or (isinstance(price_value, (int, float)) and price_value == 0):
            price_value = item.get("salePrice") or item.get("buyItNowPrice") or item.get("price_value") or item.get("bidPrice") or "0"
        
        # 문자열 정제
        price_str = str(price_value).replace("$", "").replace(",", "").replace("USD", "").strip() if price_value else "0"
        try:
            price_num = float(price_str) if price_str and price_str != "0" else 0.0
        except (ValueError, TypeError):
            price_num = 0.0
        
        # 가격 포맷팅 (0이 아닐 때만 표시)
        if price_num > 0:
            price_formatted = f"${price_num:.2f}"
        else:
            # 가격이 없으면 기본값 설정
            price_formatted = "$0"
        
        # 이미지
        image = ""
        image_obj = item.get("image") or item.get("galleryURL") or item.get("thumbnailImages") or item.get("pictureURL")
        if isinstance(image_obj, dict):
            image = image_obj.get("url") or image_obj.get("galleryURL") or image_obj.get(0) or ""
        elif isinstance(image_obj, list):
            image = image_obj[0] if len(image_obj) > 0 else ""
        else:
            image = str(image_obj) if image_obj else ""
        
        # 이미지가 없으면 fallback
        if not image:
            image = item.get("product_photo") or item.get("thumbnail") or item.get("image_url") or ""
        
        # 이미지 URL 교정: //로 시작하면 https:를 붙이기
        if image and str(image).startswith('//'):
            image = 'https:' + str(image)
        
        # 링크
        link = item.get("itemURL") or item.get("viewItemURL") or item.get("link") or item.get("url") or item.get("product_url") or ""
        link = str(link) if link else ""
        
        # 배송 정보
        shipping_info = item.get("shippingInfo", {})
        shipping_cost = ""
        if isinstance(shipping_info, dict):
            shipping_cost = shipping_info.get("shippingServiceCost", {}).get("value") or shipping_info.get("shippingCost") or ""
        shipping = f"${shipping_cost}" if shipping_cost and str(shipping_cost) != "0" else "Free Shipping"
        
        # 공통 형식으로 반환 (name, price, image, link, site, shipping)
        return {
            "site": "eBay",
            "name": str(name),
            "price": str(price_formatted),
            "price_num": float(price_num),
            "image": str(image),
            "link": str(link),
            "shipping": str(shipping)
        }
    except Exception as e:
        print(f"⚠️ eBay 파싱 에러: {str(e)}")
        import traceback
        traceback.print_exc()
        return None

# --- 🆕 신규 API 파싱 함수 (8개) ---
def parse_wayfair(item):
    """Wayfair 상품 데이터를 공통 형식으로 파싱"""
    try:
        name = str(item.get("name") or item.get("title") or item.get("product_title") or "No Title")
        price = str(item.get("price") or item.get("salePrice") or item.get("current_price") or "$0")
        image = str(item.get("image") or item.get("thumbnail") or item.get("product_photo") or "")
        if image.startswith('//'): image = 'https:' + image
        link = str(item.get("url") or item.get("link") or item.get("product_url") or "")
        price_num = float(str(price).replace("$", "").replace(",", "").strip() or 0)
        shipping = str(item.get("shipping") or item.get("delivery") or "Free Shipping")
        return {"site": "Wayfair", "name": name, "price": price, "price_num": price_num, "image": image, "link": link, "shipping": shipping} if price_num > 0 else None
    except: return None

def parse_sephora(item):
    """Sephora 상품 데이터를 공통 형식으로 파싱"""
    try:
        name = str(item.get("name") or item.get("title") or "No Title")
        price = str(item.get("price") or item.get("salePrice") or "$0")
        image = str(item.get("image") or item.get("thumbnail") or "")
        if image.startswith('//'): image = 'https:' + image
        link = str(item.get("url") or item.get("link") or "")
        price_num = float(str(price).replace("$", "").replace(",", "").strip() or 0)
        shipping = str(item.get("shipping") or "Free Shipping")
        return {"site": "Sephora", "name": name, "price": price, "price_num": price_num, "image": image, "link": link, "shipping": shipping} if price_num > 0 else None
    except: return None

def parse_iherb(item):
    """iHerb 상품 데이터를 공통 형식으로 파싱"""
    try:
        name = str(item.get("name") or item.get("title") or "No Title")
        price = str(item.get("price") or item.get("salePrice") or "$0")
        image = str(item.get("image") or item.get("thumbnail") or "")
        if image.startswith('//'): image = 'https:' + image
        link = str(item.get("url") or item.get("link") or "")
        price_num = float(str(price).replace("$", "").replace(",", "").strip() or 0)
        shipping = str(item.get("shipping") or "Free Shipping")
        return {"site": "iHerb", "name": name, "price": price, "price_num": price_num, "image": image, "link": link, "shipping": shipping} if price_num > 0 else None
    except: return None

def parse_newegg(item):
    """Newegg 상품 데이터를 공통 형식으로 파싱"""
    try:
        name = str(item.get("name") or item.get("title") or "No Title")
        price = str(item.get("price") or item.get("salePrice") or "$0")
        image = str(item.get("image") or item.get("thumbnail") or "")
        if image.startswith('//'): image = 'https:' + image
        link = str(item.get("url") or item.get("link") or "")
        price_num = float(str(price).replace("$", "").replace(",", "").strip() or 0)
        shipping = str(item.get("shipping") or "Free Shipping")
        return {"site": "Newegg", "name": name, "price": price, "price_num": price_num, "image": image, "link": link, "shipping": shipping} if price_num > 0 else None
    except: return None

def parse_nike(item):
    """Nike 상품 데이터를 공통 형식으로 파싱"""
    try:
        name = str(item.get("name") or item.get("title") or item.get("product_title") or "No Title")
        price = str(item.get("price") or item.get("currentPrice") or item.get("salePrice") or "$0")
        image = str(item.get("image") or item.get("thumbnail") or item.get("product_image") or "")
        if image.startswith('//'): image = 'https:' + image
        link = str(item.get("url") or item.get("link") or item.get("product_url") or "")
        sku = str(item.get("sku") or item.get("productId") or item.get("id") or "")
        price_num = float(str(price).replace("$", "").replace(",", "").strip() or 0)
        shipping = str(item.get("shipping") or item.get("delivery") or "Free Shipping")
        return {"site": "Nike", "name": name, "price": price, "price_num": price_num, "image": image, "link": link, "shipping": shipping, "sku": sku} if price_num > 0 else None
    except: return None

def parse_homedepot(item):
    """Home Depot 상품 데이터를 공통 형식으로 파싱"""
    try:
        name = str(item.get("name") or item.get("title") or "No Title")
        price = str(item.get("price") or item.get("salePrice") or "$0")
        image = str(item.get("image") or item.get("thumbnail") or "")
        if image.startswith('//'): image = 'https:' + image
        link = str(item.get("url") or item.get("link") or "")
        price_num = float(str(price).replace("$", "").replace(",", "").strip() or 0)
        shipping = str(item.get("shipping") or "Free Shipping")
        return {"site": "Home Depot", "name": name, "price": price, "price_num": price_num, "image": image, "link": link, "shipping": shipping} if price_num > 0 else None
    except: return None

def parse_etsy(item):
    """Etsy 상품 데이터를 공통 형식으로 파싱"""
    try:
        name = str(item.get("name") or item.get("title") or "No Title")
        price = str(item.get("price") or item.get("salePrice") or "$0")
        image = str(item.get("image") or item.get("thumbnail") or "")
        if image.startswith('//'): image = 'https:' + image
        link = str(item.get("url") or item.get("link") or "")
        price_num = float(str(price).replace("$", "").replace(",", "").strip() or 0)
        shipping = str(item.get("shipping") or "Free Shipping")
        return {"site": "Etsy", "name": name, "price": price, "price_num": price_num, "image": image, "link": link, "shipping": shipping} if price_num > 0 else None
    except: return None

def parse_costco(item):
    """Costco 상품 데이터를 공통 형식으로 파싱"""
    try:
        name = str(item.get("name") or item.get("title") or "No Title")
        price = str(item.get("price") or item.get("salePrice") or "$0")
        image = str(item.get("image") or item.get("thumbnail") or "")
        if image.startswith('//'): image = 'https:' + image
        link = str(item.get("url") or item.get("link") or "")
        price_num = float(str(price).replace("$", "").replace(",", "").strip() or 0)
        shipping = str(item.get("shipping") or "Free Shipping")
        return {"site": "Costco", "name": name, "price": price, "price_num": price_num, "image": image, "link": link, "shipping": shipping} if price_num > 0 else None
    except: return None

def parse_temu(item):
    """Temu 상품 데이터를 공통 형식으로 파싱"""
    try:
        name = str(item.get("name") or item.get("title") or "No Title")
        price = str(item.get("price") or item.get("salePrice") or "$0")
        image = str(item.get("image") or item.get("thumbnail") or "")
        if image.startswith('//'): image = 'https:' + image
        link = str(item.get("url") or item.get("link") or "")
        price_num = float(str(price).replace("$", "").replace(",", "").strip() or 0)
        shipping = str(item.get("shipping") or item.get("delivery") or "Free Shipping")
        return {"site": "Temu", "name": name, "price": price, "price_num": price_num, "image": image, "link": link, "shipping": shipping} if price_num > 0 else None
    except: return None

def parse_macys(item):
    """Macy's 상품 데이터를 공통 형식으로 파싱"""
    try:
        name = str(item.get("name") or item.get("title") or "No Title")
        price = str(item.get("price") or item.get("salePrice") or "$0")
        image = str(item.get("image") or item.get("thumbnail") or "")
        if image.startswith('//'): image = 'https:' + image
        link = str(item.get("url") or item.get("link") or "")
        price_num = float(str(price).replace("$", "").replace(",", "").strip() or 0)
        shipping = str(item.get("shipping") or "Free Shipping")
        return {"site": "Macy's", "name": name, "price": price, "price_num": price_num, "image": image, "link": link, "shipping": shipping} if price_num > 0 else None
    except: return None

def parse_kohls(item):
    """Kohl's 상품 데이터를 공통 형식으로 파싱"""
    try:
        name = str(item.get("name") or item.get("title") or "No Title")
        price = str(item.get("price") or item.get("salePrice") or "$0")
        image = str(item.get("image") or item.get("thumbnail") or "")
        if image.startswith('//'): image = 'https:' + image
        link = str(item.get("url") or item.get("link") or "")
        price_num = float(str(price).replace("$", "").replace(",", "").strip() or 0)
        shipping = str(item.get("shipping") or "Free Shipping")
        return {"site": "Kohl's", "name": name, "price": price, "price_num": price_num, "image": image, "link": link, "shipping": shipping} if price_num > 0 else None
    except: return None

# --- 🔧 헬퍼 함수: JSON에서 상품 리스트 추출 ---
def find_list_recursive(obj, path="", depth=0, max_depth=5):
    """재귀적으로 객체를 탐색하여 상품 리스트를 찾는 함수"""
    if depth > max_depth:
        return None
    
    # 리스트인 경우
    if isinstance(obj, list):
        if len(obj) > 0:
            if isinstance(obj[0], dict):
                first_item = obj[0]
                product_keys = [
                    "title", "name", "product_title", "price", "image", "url", "link", "product_url",
                    "item", "productId", "imageUrl", "thumbnail", "product_name", "product_image",
                    "product_price", "sale_price", "current_price", "original_price"
                ]
                if any(key in first_item for key in product_keys):
                    return obj
    
    # 딕셔너리인 경우
    if isinstance(obj, dict):
        for key, value in obj.items():
            new_path = f"{path}.{key}" if path else key
            
            if isinstance(value, list) and len(value) > 0:
                if isinstance(value[0], dict):
                    first_item = value[0]
                    product_keys = [
                        "title", "name", "product_title", "price", "image", "url", "link", "product_url",
                        "item", "productId", "imageUrl", "thumbnail", "product_name", "product_image",
                        "product_price", "sale_price", "current_price", "original_price"
                    ]
                    if any(k in first_item for k in product_keys):
                        return value
            
            found = find_list_recursive(value, new_path, depth + 1, max_depth)
            if found:
                return found
    
    return None

def extract_products_from_response(data, site_name="Unknown"):
    """API 응답에서 상품 리스트를 추출하는 공통 함수"""
    items = []
    
    # data 키를 우선적으로 탐색
    if "data" in data:
        data_value = data.get("data")
        
        if isinstance(data_value, list):
            items = data_value
        elif isinstance(data_value, dict):
            # 일반적인 키 이름으로 시도
            items = (
                data_value.get("products", []) or
                data_value.get("product", []) or
                data_value.get("result", []) or
                data_value.get("results", []) or
                data_value.get("list", []) or
                data_value.get("items", []) or
                data_value.get("item", []) or
                data_value.get("docs", []) or
                []
            )
            
            # 재귀 탐색
            if not items:
                found_list = find_list_recursive(data_value, "data", max_depth=5)
                if found_list:
                    items = found_list
    else:
        # data 키가 없으면 전체 구조 탐색
        found_list = find_list_recursive(data, "", max_depth=5)
        if found_list:
            items = found_list
        else:
            # 최상위 레벨에서 일반 키 확인
            items = (
                data.get("products", []) or
                data.get("product", []) or
                data.get("result", []) or
                data.get("results", []) or
                data.get("items", []) or
                []
            )
    
    return items


# --- 🎯 검색 정확도(관련도) 스코어링 함수 ---
def compute_text_relevance(query: str, text: str) -> float:
    """
    검색어와 상품 텍스트의 관련도 점수 계산 (검색 정확도 제1원칙):
    - 검색어가 상품명에 포함된 정도가 가장 높은 순서로 정렬
    - 전체 검색어가 정확히 일치하면 최고 점수
    - 단어 단위 매칭 시 추가 점수
    - 브랜드(Nike 등)에 대한 하드코딩 가중치 완전 제거
    """
    if not query or not text:
        return 0.0

    q = str(query).strip().lower()
    t = str(text).lower()

    # 빈 문자열 처리
    if not q or not t:
        return 0.0

    score = 0.0

    # 1순위: 전체 검색어가 정확히 포함되면 최고 가중치 (100점)
    if q in t:
        score += 100.0
        # 검색어가 제목 시작 부분에 있으면 추가 보너스
        if t.startswith(q):
            score += 30.0

    # 2순위: 단어 단위 매칭 (더 정확한 매칭)
    q_tokens = {token.strip() for token in q.replace(",", " ").split() if token.strip()}
    t_tokens = {token.strip() for token in t.replace(",", " ").split() if token.strip()}

    if q_tokens and t_tokens:
        overlap = q_tokens & t_tokens
        # 모든 검색어 단어가 포함되면 추가 보너스
        if len(overlap) == len(q_tokens):
            score += 50.0
        # 부분 매칭에 대한 점수
        score += 15.0 * len(overlap)

    # 3순위: 부분 문자열 매칭 (단어의 일부 포함)
    for q_token in q_tokens:
        if len(q_token) > 2:  # 3글자 이상의 단어만
            if q_token in t:
                score += 5.0

    return score

# --- 💰 제휴 마케팅 파라미터 추가 함수 ---
def add_affiliate_params(product, site):
    """
    쇼핑몰별 제휴 마케팅 ID를 링크에 자동으로 추가
    환경 변수에서 제휴 ID를 읽어와서 적용
    """
    from urllib.parse import urlencode, urlparse, parse_qs, urlunparse
    
    if not product or not product.get("link"):
        return product
    
    link = product.get("link", "")
    if not link or link.strip() == "":
        return product
    
    try:
        # 환경 변수에서 제휴 ID 가져오기 (선택적)
        amazon_tag = os.getenv("AMAZON_AFFILIATE_TAG", "soulmaten7-20")
        aliexpress_affiliate = os.getenv("ALIEXPRESS_AFFILIATE_ID", "")
        ebay_campid = os.getenv("EBAY_CAMPID", "")
        walmart_affiliate = os.getenv("WALMART_AFFILIATE_ID", "")
        
        parsed = urlparse(link)
        query_params = parse_qs(parsed.query)
        
        # 쇼핑몰별 제휴 파라미터 추가
        if site == "Amazon":
            # Amazon: &tag=사장님ID
            if "tag" not in query_params:
                query_params["tag"] = [amazon_tag]
        
        elif site == "AliExpress":
            # AliExpress: &dl_target_url= 방식 또는 제휴 링크 변환
            if aliexpress_affiliate and "dl_target_url" not in query_params:
                # AliExpress 제휴 링크는 보통 특정 형식으로 변환 필요
                # 일반적으로 파트너 ID를 URL에 포함
                # 예: &src=google&aff_fcid=... 또는 다른 형식
                # 실제 AliExpress 제휴 프로그램 규칙에 따라 수정 필요
                if "aff_fcid" not in query_params:
                    query_params["aff_fcid"] = [aliexpress_affiliate]
        
        elif site == "eBay":
            # eBay: &campid=사장님ID
            if ebay_campid and "campid" not in query_params:
                query_params["campid"] = [ebay_campid]
        
        elif site == "Walmart":
            # Walmart: 제휴 ID가 있는 경우 추가
            if walmart_affiliate:
                # Walmart 제휴 프로그램에 따라 파라미터 형식 결정
                # 일반적으로 publisherId 또는 다른 형식 사용
                if "publisherId" not in query_params:
                    query_params["publisherId"] = [walmart_affiliate]
        
        # URL 재구성
        new_query = urlencode(query_params, doseq=True)
        new_parsed = parsed._replace(query=new_query)
        new_link = urlunparse(new_parsed)
        
        product["link"] = new_link
        
    except Exception as e:
        print(f"⚠️ 제휴 링크 추가 에러 ({site}): {str(e)}")
        # 에러가 나도 원본 링크 유지
    
    return product

# --- 🛒 각 쇼핑몰 API 호출 함수 (독립 실행) ---
async def fetch_amazon_products(client, query, api_key):
    """Amazon 상품 검색 (차단 방지 로직 적용)"""
    results = []
    try:
        # 랜덤 딜레이 (0.5~1.5초) - 봇 차단 방지
        await random_delay(0.5, 1.5)
        
        host = os.getenv("AMAZON_HOST")
        url = f"https://{host}/search"
        headers = get_request_headers(api_key, host)  # 무작위 User-Agent 포함
        params = {"query": query, "country": "US"}
        
        res = await client.get(url, headers=headers, params=params, timeout=20.0)
        
        if res.status_code == 200:
            data = res.json()
            items = extract_products_from_response(data, "Amazon")
            
            for item in items:
                cleaned = parse_amazon(item)
                if cleaned:
                    # 제휴 링크 추가
                    cleaned = add_affiliate_params(cleaned, "Amazon")
                    results.append(cleaned)
            
            print(f"✅ Amazon에서 {len(results)}개 상품 획득")
        elif res.status_code == 429:
            print(f"⚠️ Amazon Quota Exceeded (429)")
        else:
            print(f"⚠️ Amazon HTTP {res.status_code} 에러")
    
    except Exception as e:
        print(f"🚨 Amazon 연결 에러: {str(e)}")
    
    return results

async def fetch_aliexpress_products(client, query, api_key):
    """AliExpress 상품 검색 (차단 방지 로직 적용)"""
    results = []
    try:
        # 랜덤 딜레이 (0.5~1.5초) - 봇 차단 방지
        await random_delay(0.5, 1.5)
        
        host = os.getenv("ALIEXPRESS_HOST")
        url = f"https://{host}/product/search"
        headers = get_request_headers(api_key, host)  # 무작위 User-Agent 포함
        params = {"query": query}
        
        res = await client.get(url, headers=headers, params=params, timeout=20.0)
        print(f"📢 AliExpress /product/search 응답 코드: {res.status_code}")
        
        if res.status_code == 200:
            data = res.json()
            
            # AliExpress는 복잡한 중첩 구조이므로 특별 처리
            items = []
            data_value = data.get("data")
            
            if data_value is None:
                print("⚠️ AliExpress: 'data' 키가 없습니다.")
            else:
                if isinstance(data_value, list):
                    items = data_value
                elif isinstance(data_value, dict):
                    # 일반 키 확인
                    items = (
                        data_value.get("products", []) or
                        data_value.get("product", []) or
                        data_value.get("result", []) or
                        data_value.get("results", []) or
                        data_value.get("list", []) or
                        data_value.get("items", []) or
                        data_value.get("item", []) or
                        data_value.get("docs", []) or
                        []
                    )
                    
                    # 재귀 탐색
                    if not items:
                        found_list = find_list_recursive(data_value, "data", max_depth=5)
                        if found_list:
                            items = found_list
            
            for item in items:
                cleaned = parse_aliexpress(item)
                if cleaned:
                    # 제휴 링크 추가
                    cleaned = add_affiliate_params(cleaned, "AliExpress")
                    results.append(cleaned)
            
            print(f"✅ AliExpress에서 {len(results)}개 상품 획득")
        else:
            print(f"⚠️ AliExpress HTTP {res.status_code} 에러: {res.text[:200]}")
    
    except Exception as e:
        print(f"🚨 AliExpress 연결 에러: {str(e)}")
        import traceback
        traceback.print_exc()
    
    return results

async def fetch_walmart_products(client, query, api_key):
    """Walmart 상품 검색 (차단 방지 로직 적용)"""
    results = []
    host = os.getenv("WALMART_HOST")
    
    # 랜덤 딜레이 (0.5~1.5초) - 봇 차단 방지
    await random_delay(0.5, 1.5)
    
    # Axesso Walmart API 최종 주소 - keyword 파라미터 사용
    endpoints = [
        ("/wlm/walmart-search-by-keyword", "keyword"),  # 최종 확정 주소
    ]
    
    for endpoint, param_key in endpoints:
        try:
            url = f"https://{host}{endpoint}"
            params = {
                param_key: query,
                "page": 1  # 필수 파라미터 (400 에러 방지)
            }
            headers = get_request_headers(api_key, host, {"useQueryString": "true"})  # 무작위 User-Agent 포함
            
            res = await client.get(url, headers=headers, params=params, timeout=20.0)
            print(f"📢 Walmart {endpoint} ({param_key}) 응답 코드: {res.status_code}")
            
            if res.status_code == 200:
                data = res.json()
                items = extract_products_from_response(data, "Walmart")
                
                for item in items:
                    cleaned = parse_walmart(item)
                    if cleaned:
                        # 제휴 링크 추가
                        cleaned = add_affiliate_params(cleaned, "Walmart")
                        results.append(cleaned)
                
                print(f"✅ Walmart에서 {len(results)}개 상품 획득")
                print(f"✅ Walmart 성공")
                break  # 성공하면 더 이상 시도하지 않음
            elif res.status_code == 404:
                print(f"⚠️ Walmart {endpoint} ({param_key}) - 404 (다음 경로 시도)")
            else:
                error_text = res.text[:200] if res.text else "No error message"
                print(f"⚠️ Walmart {endpoint} ({param_key}) - HTTP {res.status_code}: {error_text}")
        
        except Exception as e:
            print(f"🚨 Walmart {endpoint} ({param_key}) 연결 에러: {str(e)}")
    
    return results

async def fetch_ebay_products(client, query, api_key):
    """eBay 상품 검색 (차단 방지 로직 적용)"""
    results = []
    try:
        # 랜덤 딜레이 (0.5~1.5초) - 봇 차단 방지
        await random_delay(0.5, 1.5)
        
        host = os.getenv("EBAY_HOST")
        if not host:
            print("⚠️ EBAY_HOST 환경변수가 설정되지 않았습니다.")
            return results
        
        # eBay 엔드포인트 최종: /search_more - query와 tld=com 파라미터 사용
        endpoints = [
            ("/search_more", "query"),  # 최종 확정 주소
        ]
        
        for endpoint, param_key in endpoints:
            try:
                url = f"https://{host}{endpoint}"
                headers = get_request_headers(api_key, host)  # 무작위 User-Agent 포함
                params = {
                    param_key: query,
                    "tld": "com"  # 필수 파라미터
                }
                
                res = await client.get(url, headers=headers, params=params, timeout=20.0)
                print(f"📢 eBay {endpoint} ({param_key}) 응답 코드: {res.status_code}")
        
                if res.status_code == 200:
                    data = res.json()
                    items = extract_products_from_response(data, "eBay")
                    
                    for item in items:
                        cleaned = parse_ebay(item)
                        if cleaned:
                            # 제휴 링크 추가
                            cleaned = add_affiliate_params(cleaned, "eBay")
                            results.append(cleaned)
                    
                    print(f"✅ eBay에서 {len(results)}개 상품 획득")
                    break  # 성공하면 더 이상 시도하지 않음
                elif res.status_code == 404:
                    print(f"⚠️ eBay {endpoint} ({param_key}) - 404 (다음 경로 시도)")
                elif res.status_code == 429:
                    print(f"⚠️ eBay Quota Exceeded (429)")
                    break
                else:
                    print(f"⚠️ eBay {endpoint} ({param_key}) - HTTP {res.status_code}: {res.text[:200]}")
            
            except Exception as e:
                print(f"🚨 eBay {endpoint} ({param_key}) 연결 에러: {str(e)}")
                continue
        
    except Exception as e:
        print(f"🚨 eBay 연결 에러: {str(e)}")
        import traceback
        traceback.print_exc()
    
    return results

async def fetch_target_products(client, query, api_key):
    """Target 상품 검색 (차단 방지 로직 적용)"""
    results = []
    try:
        # 랜덤 딜레이 (0.5~1.5초) - 봇 차단 방지
        await random_delay(0.5, 1.5)
        
        host = os.getenv("TARGET_HOST")  # Pinto Studio Target API
        if not host:
            print("⚠️ TARGET_HOST 환경변수가 설정되지 않았습니다.")
            return results
        
        url = f"https://{host}/product_search"
        headers = get_request_headers(api_key, host)  # 무작위 User-Agent 포함
        params = {
            "keyword": query,  # 검색어
            "store_id": "1122"  # 기본값 (캡처 기반)
        }
        
        res = await client.get(url, headers=headers, params=params, timeout=20.0)
        print(f"📢 Target /product_search (keyword={query}, store_id=1122) 응답 코드: {res.status_code}")
        
        if res.status_code == 200:
            data = res.json()
            
            # Pinto Studio API는 AliExpress와 비슷한 구조
            items = []
            data_value = data.get("data")
            
            if data_value is None:
                print("⚠️ Target: 'data' 키가 없습니다.")
            else:
                if isinstance(data_value, list):
                    items = data_value
                elif isinstance(data_value, dict):
                    items = (
                        data_value.get("products", []) or
                        data_value.get("product", []) or
                        data_value.get("result", []) or
                        data_value.get("results", []) or
                        data_value.get("list", []) or
                        data_value.get("items", []) or
                        data_value.get("item", []) or
                        data_value.get("docs", []) or
                        []
                    )
                    
                    if not items:
                        found_list = find_list_recursive(data_value, "data", max_depth=5)
                        if found_list:
                            items = found_list
            
            for item in items:
                cleaned = parse_target(item)
                if cleaned:
                    # 제휴 링크 추가
                    cleaned = add_affiliate_params(cleaned, "Target")
                    results.append(cleaned)
            
            print(f"✅ Target에서 {len(results)}개 상품 획득")
        else:
            print(f"⚠️ Target HTTP {res.status_code} 에러: {res.text[:200]}")
    
    except Exception as e:
        print(f"🚨 Target 연결 에러: {str(e)}")
        import traceback
        traceback.print_exc()
    
    return results

async def fetch_bestbuy_products(client, query, api_key):
    """Best Buy 상품 검색 (차단 방지 로직 적용)"""
    results = []
    try:
        # 랜덤 딜레이 (0.5~1.5초) - 봇 차단 방지
        await random_delay(0.5, 1.5)
        
        host = os.getenv("BESTBUY_HOST")  # Pinto Studio Best Buy API
        if not host:
            print("⚠️ BESTBUY_HOST 환경변수가 설정되지 않았습니다.")
            return results
        
        url = f"https://{host}/search"
        headers = get_request_headers(api_key, host)  # 무작위 User-Agent 포함
        params = {"query": query}
        
        res = await client.get(url, headers=headers, params=params, timeout=20.0)
        print(f"📢 Best Buy /search 응답 코드: {res.status_code}")
        
        if res.status_code == 200:
            data = res.json()
            
            # Best Buy API 응답 구조 확인 및 디버깅
            print(f"🔍 Best Buy 응답 키들: {list(data.keys()) if isinstance(data, dict) else 'Not a dict'}")
            
            items = []
            # Best Buy는 최상위에 products나 items가 있을 수 있음
            if isinstance(data, dict):
                # 1순위: 최상위 products 확인
                items = (
                    data.get("products", []) or
                    data.get("items", []) or
                    data.get("product", []) or
                    data.get("results", []) or
                    data.get("result", []) or
                    []
                )
                
                # 2순위: data 키 확인
                if not items:
                    data_value = data.get("data")
                    if data_value:
                        if isinstance(data_value, list):
                            items = data_value
                        elif isinstance(data_value, dict):
                            items = (
                                data_value.get("products", []) or
                                data_value.get("items", []) or
                                data_value.get("product", []) or
                                data_value.get("results", []) or
                                data_value.get("result", []) or
                                []
                            )
                            
                            if not items:
                                found_list = find_list_recursive(data_value, "data", max_depth=5)
                                if found_list:
                                    items = found_list
                
                # 3순위: 재귀 탐색
                if not items:
                    found_list = find_list_recursive(data, "", max_depth=5)
                    if found_list:
                        items = found_list
            
            if not items:
                print("⚠️ Best Buy: 상품 리스트를 찾지 못했습니다.")
                print(f"🔍 Best Buy 응답 샘플: {str(data)[:500]}")
            
            for item in items:
                cleaned = parse_bestbuy(item)
                if cleaned:
                    # 제휴 링크 추가
                    cleaned = add_affiliate_params(cleaned, "Best Buy")
                    results.append(cleaned)
            
            print(f"✅ Best Buy에서 {len(results)}개 상품 획득")
        else:
            print(f"⚠️ Best Buy HTTP {res.status_code} 에러: {res.text[:200]}")
    
    except Exception as e:
        print(f"🚨 Best Buy 연결 에러: {str(e)}")
        import traceback
        traceback.print_exc()
    
    return results

# --- 🆕 신규 8개 API fetch 함수 ---
async def fetch_wayfair_products(client, query, api_key):
    """Wayfair 상품 검색 (차단 방지 로직 적용)"""
    results = []
    try:
        await random_delay(0.5, 1.5)
        host = os.getenv("WAYFAIR_HOST")
        if not host:
            return results
        url = f"https://{host}/search"
        headers = get_request_headers(api_key, host)
        params = {"query": query}
        res = await client.get(url, headers=headers, params=params, timeout=20.0)
        if res.status_code == 200:
            data = res.json()
            items = extract_products_from_response(data, "Wayfair")
            for item in items:
                cleaned = parse_wayfair(item)
                if cleaned:
                    cleaned = add_affiliate_params(cleaned, "Wayfair")
                    results.append(cleaned)
            print(f"✅ Wayfair에서 {len(results)}개 상품 획득")
    except Exception as e:
        print(f"🚨 Wayfair 연결 에러: {str(e)}")
    return results

async def fetch_sephora_products(client, query, api_key):
    """Sephora 상품 검색 (차단 방지 로직 적용)"""
    results = []
    try:
        await random_delay(0.5, 1.5)
        host = os.getenv("SEPHORA_HOST")
        if not host:
            return results
        url = f"https://{host}/search"
        headers = get_request_headers(api_key, host)
        params = {"keyword": query}  # keyword 파라미터 사용
        res = await client.get(url, headers=headers, params=params, timeout=20.0)
        if res.status_code == 200:
            data = res.json()
            items = extract_products_from_response(data, "Sephora")
            for item in items:
                cleaned = parse_sephora(item)
                if cleaned:
                    cleaned = add_affiliate_params(cleaned, "Sephora")
                    results.append(cleaned)
            print(f"✅ Sephora에서 {len(results)}개 상품 획득")
    except Exception as e:
        print(f"🚨 Sephora 연결 에러: {str(e)}")
    return results

async def fetch_iherb_products(client, query, api_key):
    """iHerb 상품 검색 (차단 방지 로직 적용)"""
    results = []
    try:
        await random_delay(0.5, 1.5)
        host = os.getenv("IHERB_HOST")
        if not host:
            return results
        url = f"https://{host}/search"
        headers = get_request_headers(api_key, host)
        params = {"query": query}
        res = await client.get(url, headers=headers, params=params, timeout=20.0)
        if res.status_code == 200:
            data = res.json()
            items = extract_products_from_response(data, "iHerb")
            for item in items:
                cleaned = parse_iherb(item)
                if cleaned:
                    cleaned = add_affiliate_params(cleaned, "iHerb")
                    results.append(cleaned)
            print(f"✅ iHerb에서 {len(results)}개 상품 획득")
    except Exception as e:
        print(f"🚨 iHerb 연결 에러: {str(e)}")
    return results

async def fetch_newegg_products(client, query, api_key):
    """Newegg 상품 검색 (차단 방지 로직 적용)"""
    results = []
    try:
        await random_delay(0.5, 1.5)
        host = os.getenv("NEWEGG_HOST")
        if not host:
            return results
        url = f"https://{host}/search"
        headers = get_request_headers(api_key, host)
        # query 또는 searchTerm 시도
        for param_key in ["query", "searchTerm"]:
            params = {param_key: query}
            res = await client.get(url, headers=headers, params=params, timeout=20.0)
            if res.status_code == 200:
                data = res.json()
                items = extract_products_from_response(data, "Newegg")
                for item in items:
                    cleaned = parse_newegg(item)
                    if cleaned:
                        cleaned = add_affiliate_params(cleaned, "Newegg")
                        results.append(cleaned)
                if len(results) > 0:
                    break
                print(f"✅ Newegg에서 {len(results)}개 상품 획득")
                break
        else:
            if res.status_code != 200:
                print(f"⚠️ Newegg HTTP {res.status_code} 에러")
    except Exception as e:
        print(f"🚨 Newegg 연결 에러: {str(e)}")
    return results

async def fetch_nike_products(client, query, api_key):
    """Nike 상품 검색 (차단 방지 로직 적용)"""
    results = []
    try:
        await random_delay(0.5, 1.5)
        host = os.getenv("NIKE_HOST")
        if not host:
            return results
        
        # Nike는 /get-womens-clothing과 /get-mens-shoes를 동시에 호출
        async def fetch_nike_category(category):
            category_results = []
            try:
                url = f"https://{host}/{category}"
                headers = get_request_headers(api_key, host)
                params = {"query": query}
                res = await client.get(url, headers=headers, params=params, timeout=20.0)
                print(f"📢 Nike {category} 응답 코드: {res.status_code}")
                if res.status_code == 200:
                    data = res.json()
                    items = extract_products_from_response(data, "Nike")
                    for item in items:
                        cleaned = parse_nike(item)
                        if cleaned:
                            cleaned = add_affiliate_params(cleaned, "Nike")
                            category_results.append(cleaned)
            except Exception as e:
                print(f"🚨 Nike {category} 연결 에러: {str(e)}")
            return category_results
        
        # 동시 호출: /get-womens-clothing과 /get-mens-shoes
        womens_results, mens_results = await asyncio.gather(
            fetch_nike_category("get-womens-clothing"),
            fetch_nike_category("get-mens-shoes"),
            return_exceptions=True
        )
        
        # SKU 기반 중복 제거
        seen_skus = set()
        all_results = []
        if not isinstance(womens_results, Exception):
            all_results.extend(womens_results)
        if not isinstance(mens_results, Exception):
            all_results.extend(mens_results)
        
        for item in all_results:
            sku = item.get("sku", "")
            if sku and sku not in seen_skus:
                seen_skus.add(sku)
                results.append(item)
            elif not sku:
                # SKU가 없으면 그냥 추가
                results.append(item)
        
        print(f"✅ Nike에서 {len(results)}개 상품 획득 (중복 제거 후)")
    except Exception as e:
        print(f"🚨 Nike 연결 에러: {str(e)}")
    return results

async def fetch_homedepot_products(client, query, api_key):
    """Home Depot 상품 검색 (차단 방지 로직 적용)"""
    results = []
    try:
        await random_delay(0.5, 1.5)
        host = os.getenv("HOMEDEPOT_HOST")
        if not host:
            return results
        url = f"https://{host}/search"
        headers = get_request_headers(api_key, host)
        params = {"query": query}
        res = await client.get(url, headers=headers, params=params, timeout=20.0)
        if res.status_code == 200:
            data = res.json()
            items = extract_products_from_response(data, "Home Depot")
            for item in items:
                cleaned = parse_homedepot(item)
                if cleaned:
                    cleaned = add_affiliate_params(cleaned, "Home Depot")
                    results.append(cleaned)
            print(f"✅ Home Depot에서 {len(results)}개 상품 획득")
    except Exception as e:
        print(f"🚨 Home Depot 연결 에러: {str(e)}")
    return results

async def fetch_etsy_products(client, query, api_key):
    """Etsy 상품 검색 (차단 방지 로직 적용)"""
    results = []
    try:
        await random_delay(0.5, 1.5)
        host = os.getenv("ETSY_HOST")
        if not host:
            return results
        url = f"https://{host}/search"
        headers = get_request_headers(api_key, host)
        # query 또는 searchTerm 시도
        for param_key in ["query", "searchTerm"]:
            params = {param_key: query}
            res = await client.get(url, headers=headers, params=params, timeout=20.0)
            if res.status_code == 200:
                data = res.json()
                items = extract_products_from_response(data, "Etsy")
                for item in items:
                    cleaned = parse_etsy(item)
                    if cleaned:
                        cleaned = add_affiliate_params(cleaned, "Etsy")
                        results.append(cleaned)
                if len(results) > 0:
                    break
                print(f"✅ Etsy에서 {len(results)}개 상품 획득")
                break
        else:
            if res.status_code != 200:
                print(f"⚠️ Etsy HTTP {res.status_code} 에러")
    except Exception as e:
        print(f"🚨 Etsy 연결 에러: {str(e)}")
    return results

async def fetch_costco_products(client, query, api_key):
    """Costco 상품 검색 (차단 방지 로직 적용)"""
    results = []
    try:
        await random_delay(0.5, 1.5)
        host = os.getenv("COSTCO_HOST")
        if not host:
            return results
        url = f"https://{host}/search"
        headers = get_request_headers(api_key, host)
        # query 또는 searchTerm 시도
        for param_key in ["query", "searchTerm"]:
            params = {param_key: query}
            res = await client.get(url, headers=headers, params=params, timeout=20.0)
            if res.status_code == 200:
                data = res.json()
                items = extract_products_from_response(data, "Costco")
                for item in items:
                    cleaned = parse_costco(item)
                    if cleaned:
                        cleaned = add_affiliate_params(cleaned, "Costco")
                        results.append(cleaned)
                if len(results) > 0:
                    break
                print(f"✅ Costco에서 {len(results)}개 상품 획득")
                break
        else:
            if res.status_code != 200:
                print(f"⚠️ Costco HTTP {res.status_code} 에러")
    except Exception as e:
        print(f"🚨 Costco 연결 에러: {str(e)}")
    return results

async def fetch_temu_products(client, query, api_key):
    """Temu 상품 검색 (차단 방지 로직 적용)"""
    results = []
    try:
        await random_delay(0.5, 1.5)
        host = os.getenv("TEMU_HOST")
        if not host:
            return results
        url = f"https://{host}/search"
        headers = get_request_headers(api_key, host)
        params = {"query": query}
        res = await client.get(url, headers=headers, params=params, timeout=20.0)
        if res.status_code == 200:
            data = res.json()
            items = extract_products_from_response(data, "Temu")
            for item in items:
                cleaned = parse_temu(item)
                if cleaned:
                    cleaned = add_affiliate_params(cleaned, "Temu")
                    results.append(cleaned)
            print(f"✅ Temu에서 {len(results)}개 상품 획득")
    except Exception as e:
        print(f"🚨 Temu 연결 에러: {str(e)}")
    return results

async def fetch_macys_products(client, query, api_key):
    """Macy's 상품 검색 (차단 방지 로직 적용)"""
    results = []
    try:
        await random_delay(0.5, 1.5)
        host = os.getenv("MACYS_HOST")
        if not host:
            return results
        url = f"https://{host}/search"
        headers = get_request_headers(api_key, host)
        params = {"q": query}  # q 파라미터 사용
        res = await client.get(url, headers=headers, params=params, timeout=20.0)
        if res.status_code == 200:
            data = res.json()
            items = extract_products_from_response(data, "Macy's")
            for item in items:
                cleaned = parse_macys(item)
                if cleaned:
                    cleaned = add_affiliate_params(cleaned, "Macy's")
                    results.append(cleaned)
            print(f"✅ Macy's에서 {len(results)}개 상품 획득")
    except Exception as e:
        print(f"🚨 Macy's 연결 에러: {str(e)}")
    return results

async def fetch_kohls_products(client, query, api_key):
    """Kohl's 상품 검색 (차단 방지 로직 적용)"""
    results = []
    try:
        await random_delay(0.5, 1.5)
        host = os.getenv("KOHLS_HOST")
        if not host:
            return results
        url = f"https://{host}/search"
        headers = get_request_headers(api_key, host)
        params = {"keyword": query}  # keyword 파라미터 사용
        res = await client.get(url, headers=headers, params=params, timeout=20.0)
        if res.status_code == 200:
            data = res.json()
            items = extract_products_from_response(data, "Kohl's")
            for item in items:
                cleaned = parse_kohls(item)
                if cleaned:
                    cleaned = add_affiliate_params(cleaned, "Kohl's")
                    results.append(cleaned)
            print(f"✅ Kohl's에서 {len(results)}개 상품 획득")
    except Exception as e:
        print(f"🚨 Kohl's 연결 에러: {str(e)}")
    return results

# --- 🎯 메인 검색 로직 (병렬 호출 + 캐싱) ---
@app.post("/search")
async def search_products(request: SearchRequest):
    api_key = os.getenv("RAPIDAPI_KEY")
    
    # 캐시 키 생성
    cache_key = generate_cache_key("search_results", request.query, request.country)
    
    # 캐시에서 가져오기
    cached_result = get_cache(cache_key)
    if cached_result is not None:
        print(f"✅ 검색 결과 캐시 히트: {request.query}")
        return cached_result
    
    async with httpx.AsyncClient() as client:
        # 🚀 병렬 호출: 모든 쇼핑몰 API를 동시에 실행
        print(f"🔍 검색 시작: '{request.query}' (병렬 처리)")
        
        # 16개 쇼핑몰 병렬 호출 (기존 + 신규)
        amazon_results, aliexpress_results, walmart_results, ebay_results, target_results, bestbuy_results, wayfair_results, sephora_results, iherb_results, newegg_results, nike_results, homedepot_results, etsy_results, costco_results, temu_results, macys_results, kohls_results = await asyncio.gather(
            fetch_amazon_products(client, request.query, api_key),
            fetch_aliexpress_products(client, request.query, api_key),
            fetch_walmart_products(client, request.query, api_key),
            fetch_ebay_products(client, request.query, api_key),
            fetch_target_products(client, request.query, api_key),
            fetch_bestbuy_products(client, request.query, api_key),
            fetch_wayfair_products(client, request.query, api_key),
            fetch_sephora_products(client, request.query, api_key),
            fetch_iherb_products(client, request.query, api_key),
            fetch_newegg_products(client, request.query, api_key),
            fetch_nike_products(client, request.query, api_key),
            fetch_homedepot_products(client, request.query, api_key),
            fetch_etsy_products(client, request.query, api_key),
            fetch_costco_products(client, request.query, api_key),
            fetch_temu_products(client, request.query, api_key),
            fetch_macys_products(client, request.query, api_key),
            fetch_kohls_products(client, request.query, api_key),
            return_exceptions=True  # 하나가 실패해도 다른 것은 계속 실행
        )
        
        # 결과 수집 (에러가 발생한 경우 빈 리스트로 처리)
        results = []
        
        if isinstance(amazon_results, Exception):
            print(f"🚨 Amazon 예외 발생: {amazon_results}")
        else:
            results.extend(amazon_results)
        
        if isinstance(aliexpress_results, Exception):
            print(f"🚨 AliExpress 예외 발생: {aliexpress_results}")
        else:
            results.extend(aliexpress_results)
        
        if isinstance(walmart_results, Exception):
            print(f"🚨 Walmart 예외 발생: {walmart_results}")
        else:
            results.extend(walmart_results)
        
        if isinstance(ebay_results, Exception):
            print(f"🚨 eBay 예외 발생: {ebay_results}")
        else:
            results.extend(ebay_results)
        
        if isinstance(target_results, Exception):
            print(f"🚨 Target 예외 발생: {target_results}")
        else:
            results.extend(target_results)
        
        if isinstance(bestbuy_results, Exception):
            print(f"🚨 Best Buy 예외 발생: {bestbuy_results}")
        else:
            results.extend(bestbuy_results)
        
        # 신규 8개 API 결과 수집
        if isinstance(wayfair_results, Exception):
            print(f"🚨 Wayfair 예외 발생: {wayfair_results}")
        else:
            results.extend(wayfair_results)
        
        if isinstance(sephora_results, Exception):
            print(f"🚨 Sephora 예외 발생: {sephora_results}")
        else:
            results.extend(sephora_results)
        
        if isinstance(iherb_results, Exception):
            print(f"🚨 iHerb 예외 발생: {iherb_results}")
        else:
            results.extend(iherb_results)
        
        if isinstance(newegg_results, Exception):
            print(f"🚨 Newegg 예외 발생: {newegg_results}")
        else:
            results.extend(newegg_results)
        
        if isinstance(nike_results, Exception):
            print(f"🚨 Nike 예외 발생: {nike_results}")
        else:
            results.extend(nike_results)
        
        if isinstance(homedepot_results, Exception):
            print(f"🚨 Home Depot 예외 발생: {homedepot_results}")
        else:
            results.extend(homedepot_results)
        
        if isinstance(etsy_results, Exception):
            print(f"🚨 Etsy 예외 발생: {etsy_results}")
        else:
            results.extend(etsy_results)
        
        if isinstance(costco_results, Exception):
            print(f"🚨 Costco 예외 발생: {costco_results}")
        else:
            results.extend(costco_results)

        # 결과 정렬: 1순위 검색 정확도(Relevance), 2순위 가격순
        if results:
            try:
                query_text = request.query or ""

                # 각 상품에 대해 검색어와의 관련도 점수 계산
                for r in results:
                    name_text = r.get("name", "")
                    # 일부 파서에서 description / subtitle / details 등을 사용할 수 있도록 확장
                    desc_text = (
                        r.get("description")
                        or r.get("subtitle")
                        or r.get("details")
                        or ""
                    )
                    relevance_from_name = compute_text_relevance(query_text, name_text)
                    relevance_from_desc = compute_text_relevance(query_text, desc_text)
                    relevance_score = max(relevance_from_name, relevance_from_desc)
                    r["_relevance"] = relevance_score

                # $0 가격 제외
                valid_results = [r for r in results if r.get("price_num", 0) > 0]
                zero_price_results = [r for r in results if r.get("price_num", 0) == 0]

                # 1순위: 관련도 점수 내림차순, 2순위: 가격 오름차순
                valid_results.sort(
                    key=lambda x: (
                        -(x.get("_relevance", 0.0) or 0.0),
                        x.get("price_num", 0.0) or 0.0,
                    )
                )

                # $0 가격 상품도 관련도 기준으로만 정렬 후 뒤에 배치
                zero_price_results.sort(
                    key=lambda x: -(x.get("_relevance", 0.0) or 0.0)
                )

                results = valid_results + zero_price_results
            except Exception as e:
                print(f"⚠️ 정렬 중 에러 발생: {str(e)}")
        
        # 최종 결과 로그
        print(f"🏁 최종 화면으로 전달할 상품 수: {len(results)}개")
        if len(results) > 0:
            print(f"   - Amazon: {sum(1 for r in results if r.get('site') == 'Amazon')}개")
            print(f"   - AliExpress: {sum(1 for r in results if r.get('site') == 'AliExpress')}개")
            print(f"   - Walmart: {sum(1 for r in results if r.get('site') == 'Walmart')}개")
            print(f"   - eBay: {sum(1 for r in results if r.get('site') == 'eBay')}개")
            print(f"   - Target: {sum(1 for r in results if r.get('site') == 'Target')}개")
            print(f"   - Best Buy: {sum(1 for r in results if r.get('site') == 'Best Buy')}개")
            print(f"   - Wayfair: {sum(1 for r in results if r.get('site') == 'Wayfair')}개")
            print(f"   - Sephora: {sum(1 for r in results if r.get('site') == 'Sephora')}개")
            print(f"   - iHerb: {sum(1 for r in results if r.get('site') == 'iHerb')}개")
            print(f"   - Newegg: {sum(1 for r in results if r.get('site') == 'Newegg')}개")
            print(f"   - Nike: {sum(1 for r in results if r.get('site') == 'Nike')}개")
            print(f"   - Home Depot: {sum(1 for r in results if r.get('site') == 'Home Depot')}개")
            print(f"   - Etsy: {sum(1 for r in results if r.get('site') == 'Etsy')}개")
            print(f"   - Costco: {sum(1 for r in results if r.get('site') == 'Costco')}개")
            print(f"   - Temu: {sum(1 for r in results if r.get('site') == 'Temu')}개")
            macys_count = sum(1 for r in results if r.get('site') == "Macy's")
            kohls_count = sum(1 for r in results if r.get('site') == "Kohl's")
            print(f"   - Macy's: {macys_count}개")
            print(f"   - Kohl's: {kohls_count}개")
        
        # 결과 반환 전 캐시에 저장
        response_data = {"results": results}
        
        # TTL 계산 (스페셜 이벤트 여부에 따라)
        if is_special_event(request.query):
            ttl = get_cache_ttl("price_special", request.query)  # 10분
        else:
            ttl = get_cache_ttl("search_results", request.query)  # 30분
        
        set_cache(cache_key, response_data, ttl)
        print(f"💾 검색 결과 캐시 저장: {request.query} (TTL: {ttl}초)")
        
        # 공통된 JSON 형식으로 반환 (name, price, image, link, site)
        # 모든 결과는 이미 parse_* 함수에서 통일된 형식으로 반환됨
        return response_data

if __name__ == "__main__":
    uvicorn.run(app, host="0.0.0.0", port=8000)