# 검색 로직(Search Logic) 분석 — CTO 점검용

## 1. 데이터 출처 (Data Source)

### 현재 구조

| 구간 | 위치 | 데이터 출처 | 비고 |
|------|------|-------------|------|
| **1차 (정상)** | `app/api/search/route.ts` GET | **외부 API** | `lib/amazonApi.searchProducts(q, page)` → RapidAPI **Real-Time Amazon Data** |
| **2차 (빈 결과)** | 동일 GET | **Mock** | `products.length === 0` 이면 `generateEmergencyMockData(query)` 사용 |
| **3차 (에러)** | GET `catch` | **Mock** | 예외 시 `generateEmergencyMockData(query)` 반환 |

### 클라이언트 호출

- **`app/page.tsx`**  
  - `executeSearch()` → `fetch('/api/search?q=' + encodeURIComponent(trimmed) + '&page=1')`  
  - 응답: `{ results: Product[], total, metadata: { domesticCount, internationalCount } }`  
  - **하드코딩 Mock은 없음.** 모든 검색 데이터는 **API 라우트**를 통해서만 옴.

### 정리

- **일반 동작**: 100% **RapidAPI Amazon(실제 외부 API)**.
- **한도/에러/빈 결과**: 100% **가짜 데이터** (`generateEmergencyMockData`).
- 프론트는 Mock을 직접 만들지 않고, API가 주는 `results`만 사용.

---

## 2. Domestic vs Global 분리 로직

### 2-1. API / 데이터 계층

**`app/lib/amazonApi.ts` — `assignShipping(item, index)`**

- **입력**: API 원본 `item`, `index`.
- **기준 (우선순위)**  
  1. `item.shipping`, `item.shipping_info`, `item.delivery_days` 등 문자열을 합쳐서 검사.  
  2. `us|domestic|prime|2-?day|fast|free\s*ship` → **Domestic**  
  3. `international|global|china|import|2-?3\s*week|slow` → **International**  
  4. **둘 다 없으면**: `index % 2 === 0` → Domestic, else → International (지퍼용으로 번갈아 할당).

**`app/api/search/route.ts` — Emergency Mock**

- `generateEmergencyMockData()` 내부:  
  - 사이트별로 `shipping: 'Domestic' | 'International'`를 **하드코딩** (Amazon/Walmart/… → Domestic, Temu/AliExpress → International).
- 즉, Mock은 **type(사이트) 기준**으로 Domestic/International 고정.

### 2-2. 클라이언트

**`app/page.tsx` — `executeSearch` 내부**

```ts
const allResults = data.results || [];
const domesticResults = allResults.filter((p: any) => {
  const val = (p.shipping || (p as any).category || '').toString().toLowerCase();
  return val.includes('domestic');
});
const internationalResults = allResults.filter((p: any) => {
  const val = (p.shipping || (p as any).category || '').toString().toLowerCase();
  return val.includes('international');
});
setDomestic(domesticResults);
setInternational(internationalResults);
```

- **기준**: 각 상품의 **`shipping` (또는 fallback `category`) 문자열**에  
  `'domestic'` / `'international'` 포함 여부 (소문자 변환 후).
- **배송일/가격으로 나누지 않음.**  
  Domestic/International 구분은 **전부 `shipping`(및 대체 필드) 한 필드**로만 수행.

### 요약

- **실제 API 경로**:  
  RapidAPI 응답 → `assignShipping()`으로 **배송 관련 필드 + 없으면 index % 2** → `shipping: 'Domestic' | 'International'` 부여.
- **Mock 경로**:  
  사이트 이름에 따른 **고정 Domestic/International**.
- **클라이언트**:  
  API/Mock 모두 `shipping`(또는 category) 문자열로 이미 나뉜 상태이므로, **그 필드만 보고 domestic/international 리스트로 필터링**.

---

## 3. 진짜 API로 갈아끼우기 위한 인터페이스 제안

### 3-1. 현재 상태

- **Product 타입**: `app/types/product.ts`에 이미 정의됨 (`id`, `name`, `price`, `image`, `site`, `shipping`, `deliveryDays`, `link`, `trustScore`, `variants` 등).
- **검색 진입점**: `app/api/search/route.ts` GET에서 `searchProducts(query, page)` 한 곳만 호출 → 그 결과를 그대로 `results`로 내려줌.

### 3-2. 제안: 검색 공급자(Search Provider) 추상화

**목표**: Amazon뿐 아니라 Coupang, 자체 백엔드 등 **다른 데이터 소스로 교체·추가**가 쉽게.

**1) 공통 검색 결과 타입 (이미 있으면 재사용)**

```ts
// app/types/product.ts 또는 app/types/search.ts
export interface Product {
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

export interface SearchResult {
  results: Product[];
  total: number;
  metadata?: { domesticCount: number; internationalCount: number };
}
```

**2) 검색 공급자 인터페이스**

```ts
// app/lib/search/types.ts (신설 권장)
export interface SearchProvider {
  name: string;
  search(query: string, page: number): Promise<SearchResult>;
}
```

**3) 구현 예시**

- `app/lib/search/amazonProvider.ts`: 기존 `amazonApi.searchProducts` 래핑 → `SearchResult` 반환.
- `app/lib/search/coupangProvider.ts`: Coupang API 호출 후 동일 `Product` 형태로 매핑해 `SearchResult` 반환.
- `app/lib/search/mockProvider.ts`: `generateEmergencyMockData` 래핑.

**4) API 라우트에서 사용**

```ts
// app/api/search/route.ts (개념)
const provider = getSearchProvider(); // env에 따라 amazon | coupang | mock
const { results, total, metadata } = await provider.search(queryTrimmed, page);
return NextResponse.json({ results, total, metadata });
```

- 에러/한도 시: `mockProvider.search()`로 폴백하도록 하면, 현재의 “Emergency Mock” 동작을 그대로 유지 가능.

### 3-3. Domestic/International 일관 규칙

- **모든 Provider**는 반환하는 `Product[]`에 **`shipping: 'Domestic' | 'International'`** 를 반드시 넣어줌.
- API/라우트는 `metadata.domesticCount` / `internationalCount`를  
  `results.filter(p => p.shipping === 'Domestic').length` 등으로 일관되게 계산해도 됨.
- 클라이언트는 **지금처럼 `shipping` 필드만 보고** domestic/international 나누면 됨.

### 3-4. 정리

- **지금**: “가짜 두뇌”는 **한도/에러 시에만** Emergency Mock으로 동작하고, 정상 시에는 **실제 RapidAPI Amazon**만 사용.
- **진짜 두뇌로 확장**:  
  - `Product` / `SearchResult` 타입 유지.  
  - `SearchProvider` 인터페이스 도입 후 Amazon/Coupang/Mock을 각각 구현체로 두고,  
  - API 라우트는 “한 개의 Provider”만 호출하도록 하면, 나중에 교체·추가가 쉬움.
