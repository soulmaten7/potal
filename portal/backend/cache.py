"""
계층적 캐싱 시스템 (Redis/메모리)
- Redis 우선 사용, 없으면 메모리 캐시로 폴백
"""
import json
import hashlib
import time
from typing import Optional, Any, Dict
from functools import wraps

# 메모리 캐시 (Redis가 없을 때 사용)
_memory_cache: Dict[str, Dict[str, Any]] = {}

try:
    import redis
    redis_client = redis.Redis(
        host=os.getenv("REDIS_HOST", "localhost"),
        port=int(os.getenv("REDIS_PORT", 6379)),
        db=0,
        decode_responses=True
    )
    redis_client.ping()  # 연결 테스트
    USE_REDIS = True
    print("✅ Redis 연결 성공")
except Exception as e:
    USE_REDIS = False
    print(f"⚠️ Redis 연결 실패, 메모리 캐시 사용: {str(e)}")
    redis_client = None

def generate_cache_key(prefix: str, *args, **kwargs) -> str:
    """캐시 키 생성"""
    key_data = f"{prefix}:{json.dumps(args, sort_keys=True)}:{json.dumps(kwargs, sort_keys=True)}"
    return hashlib.md5(key_data.encode()).hexdigest()

def get_cache(key: str) -> Optional[Any]:
    """캐시에서 데이터 가져오기"""
    try:
        if USE_REDIS and redis_client:
            cached = redis_client.get(key)
            if cached:
                return json.loads(cached)
        else:
            # 메모리 캐시
            if key in _memory_cache:
                entry = _memory_cache[key]
                if time.time() < entry["expires_at"]:
                    return entry["data"]
                else:
                    del _memory_cache[key]
    except Exception as e:
        print(f"⚠️ 캐시 읽기 에러: {str(e)}")
    return None

def set_cache(key: str, value: Any, ttl: int):
    """캐시에 데이터 저장"""
    try:
        if USE_REDIS and redis_client:
            redis_client.setex(key, ttl, json.dumps(value))
        else:
            # 메모리 캐시
            _memory_cache[key] = {
                "data": value,
                "expires_at": time.time() + ttl
            }
            # 메모리 캐시 크기 제한 (최대 1000개)
            if len(_memory_cache) > 1000:
                # 가장 오래된 항목 제거
                oldest_key = min(_memory_cache.keys(), key=lambda k: _memory_cache[k]["expires_at"])
                del _memory_cache[oldest_key]
    except Exception as e:
        print(f"⚠️ 캐시 쓰기 에러: {str(e)}")

def cached(data_type: str, ttl_func=None):
    """
    캐싱 데코레이터
    사용 예:
    @cached("search_results", lambda query: get_cache_ttl("search_results", query))
    async def search_products(query):
        ...
    """
    def decorator(func):
        @wraps(func)
        async def wrapper(*args, **kwargs):
            # 캐시 키 생성
            cache_key = generate_cache_key(data_type, *args, **kwargs)
            
            # 캐시에서 가져오기
            cached_result = get_cache(cache_key)
            if cached_result is not None:
                print(f"✅ 캐시 히트: {data_type}")
                return cached_result
            
            # 캐시 미스 - 함수 실행
            result = await func(*args, **kwargs)
            
            # TTL 계산
            if ttl_func:
                ttl = ttl_func(*args, **kwargs)
            else:
                from utils import get_cache_ttl
                query = kwargs.get("query", args[0] if args else "")
                ttl = get_cache_ttl(data_type, query)
            
            # 캐시에 저장
            set_cache(cache_key, result, ttl)
            print(f"💾 캐시 저장: {data_type} (TTL: {ttl}초)")
            
            return result
        return wrapper
    return decorator
