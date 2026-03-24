# Amazon 실제 상품으로 v3 벤치마크

아래 전체를 순서대로 실행해라.

## Step 1: Amazon API 필드 조사

```bash
# Search API 응답 구조 확인
curl -s "https://real-time-amazon-data.p.rapidapi.com/search?query=cotton+t-shirt&page=1&country=US" \
  -H "x-rapidapi-key: 862297c953msh18d0e20a472b36bp1e3751jsn9810b160cdbe" \
  -H "x-rapidapi-host: real-time-amazon-data.p.rapidapi.com" | python3 -c "
import json,sys
d=json.load(sys.stdin)
products=d.get('data',{}).get('products',d.get('products',[]))
if products:
    print('=== 첫 번째 상품 전체 필드 ===')
    print(json.dumps(products[0], indent=2, ensure_ascii=False))
    print(f'\n필드 목록: {list(products[0].keys())}')
    print(f'상품 수: {len(products)}')
else:
    print('products 없음. 전체 응답:')
    print(json.dumps(d, indent=2)[:2000])
"
```

```bash
# Product Detail API 확인 (위에서 나온 ASIN 사용, 없으면 B09V3KXJPB)
curl -s "https://real-time-amazon-data.p.rapidapi.com/product-details?asin=B09V3KXJPB&country=US" \
  -H "x-rapidapi-key: 862297c953msh18d0e20a472b36bp1e3751jsn9810b160cdbe" \
  -H "x-rapidapi-host: real-time-amazon-data.p.rapidapi.com" | python3 -c "
import json,sys
d=json.load(sys.stdin)
detail=d.get('data',d)
print('=== Product Detail 전체 필드 ===')
print(json.dumps(detail, indent=2, ensure_ascii=False)[:3000])
print(f'\n필드 목록: {list(detail.keys()) if isinstance(detail,dict) else type(detail)}')
"
```

## Step 2: 위 응답 결과를 보고 판단

Search API와 Detail API 응답에서:
- product_title/title (상품명)
- product_description/description (설명)
- product_information 또는 about_product (material, weight 등 상세)
- category_path (카테고리)
- price (가격)

어떤 필드가 있는지 확인한 뒤,
**material 정보가 가장 풍부한 API 엔드포인트**를 사용해서 Step 3 진행.

## Step 3: 10개 카테고리 × 5개 = 50개 수집 + v3 벤치마크

Step 1-2 결과를 바탕으로 Python 스크립트를 작성해서:

1. 아래 10개 검색어로 Search → 각 5개 ASIN 추출 → Detail API로 상세 정보 수집:
   - "cotton t-shirt" (의류/면)
   - "stainless steel water bottle" (주방/스테인리스)
   - "leather wallet" (가죽)
   - "ceramic coffee mug" (도자기)
   - "wooden cutting board" (목재)
   - "rubber yoga mat" (고무)
   - "silk scarf" (실크)
   - "aluminum laptop stand" (알루미늄)
   - "glass wine glasses" (유리)
   - "plastic storage container" (플라스틱)

2. 각 상품에서 9-Field 추출:
   ```json
   {
     "product_name": "API 상품명",
     "material": "상품명/description/product_information에서 추출",
     "origin_country": "CN",
     "category": "API 카테고리 또는 검색 카테고리",
     "description": "API description",
     "price": 29.99,
     "weight_spec": "API weight (있으면)",
     "source_asin": "ASIN"
   }
   ```

3. `/Volumes/soulmaten/POTAL/7field_benchmark/amazon_50_products.json`에 저장

4. v3 파이프라인으로 50건 전부 분류 실행:
   ```
   npx tsx scripts/run_amazon_bench.ts
   ```
   (스크립트도 직접 작성해라)

5. 결과 출력:
   - 각 상품: product_name → Section/Chapter/Heading/HS6 + decision_path
   - 요약: Section/Chapter/Heading/HS6 정확도 (수동 검증 필요하니 일단 결과만 출력)
   - `/Volumes/soulmaten/POTAL/7field_benchmark/amazon_bench_result.json`에 저장

**Rate limit 주의**: API 호출 사이 1초 sleep 넣어라.
**에러 처리**: 4xx/5xx 시 3회 재시도.

전체를 한번에 자동으로 끝까지 실행해라. 중간에 멈추지 마라.
