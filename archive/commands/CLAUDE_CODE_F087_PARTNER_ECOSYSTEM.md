# F087 Partner Ecosystem (1400+) — 프로덕션 강화

> ⚠️ 이 기능(F087)만 작업합니다.

## 현재 파일
- `app/api/v1/partners/ecosystem/route.ts` — 파트너 에코시스템 API

## CRITICAL 3개

### C1: 파트너 데이터 정적 하드코딩
14개 카테고리, 1400+ 파트너 수가 코드에 고정. 실제 파트너 DB 없음.
**수정**: 파트너 정보 DB 마이그레이션 또는 최소한 업데이트 가능한 구조
```typescript
// 현재: const PARTNERS = { carriers: [...350개...] } 하드코딩
// 수정: DB 또는 JSON 파일로 분리
// 당장은 JSON 파일 분리 + 카테고리별 수만 정확하게
const partnersData = require('./partners-data.json'); // 별도 파일
// 검증: 총 수 = 카테고리별 합계
const totalPartners = Object.values(partnersData).reduce((sum, cat) => sum + cat.length, 0);
response.metadata = { totalPartners, lastUpdated: partnersData.lastUpdated, categories: Object.keys(partnersData).length };
```

### C2: 파트너 검색/필터 없음
전체 목록만 반환. 국가별, 서비스별, 통합 유형별 필터 없음.
**수정**: 필터링 + 검색
```typescript
const category = searchParams.get('category'); // 'carriers', 'customs_brokers', etc.
const country = searchParams.get('country'); // 서비스 제공 국가
const integrationType = searchParams.get('integration'); // 'api', 'webhook', 'plugin'
const search = searchParams.get('q'); // 이름 검색

let filtered = allPartners;
if (category) filtered = filtered.filter(p => p.category === category);
if (country) filtered = filtered.filter(p => p.countries?.includes(country));
if (integrationType) filtered = filtered.filter(p => p.integrationType === integrationType);
if (search) filtered = filtered.filter(p => p.name.toLowerCase().includes(search.toLowerCase()));

// 페이지네이션
const page = parseInt(searchParams.get('page') || '1');
const limit = Math.min(parseInt(searchParams.get('limit') || '20'), 100);
```

### C3: 파트너 연동 상태 미표시
각 파트너가 POTAL과 실제 연동 가능한지, API 가용한지 표시 없음.
**수정**: 연동 상태 필드 추가
```typescript
interface Partner {
  id: string;
  name: string;
  category: string;
  integrationStatus: 'active' | 'planned' | 'community' | 'self_service';
  // active: POTAL 직접 연동
  // planned: 개발 예정
  // community: 커뮤니티 플러그인
  // self_service: 셀러가 직접 설정
  apiAvailable: boolean;
  documentationUrl?: string;
}
```

## 테스트 6개
```
1. 전체 조회 → totalPartners >= 1400
2. category=carriers → 캐리어만 반환
3. country=US → 미국 서비스 파트너만
4. search=DHL → DHL 관련 결과
5. 페이지네이션 → page=2, limit=20
6. integrationStatus 필드 → 모든 파트너에 포함
```
