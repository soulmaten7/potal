# F109 CSV Export/Import — 신규 구현

> ⚠️ 이 기능(F109)만 작업합니다. 다른 기능은 절대 수정하지 마세요.
> 현재 상태: **미구현** — CSV 파싱/내보내기 코드 없음

## 배경
대량의 상품을 한번에 HS 분류하거나 관세 계산할 때 CSV 업로드/다운로드 필수.
경쟁사 (Avalara, Zonos) 모두 CSV bulk 기능 제공.

## 구현할 파일

### 1. `app/lib/csv/parser.ts` (신규 생성)
```typescript
import Papa from 'papaparse'; // npm install papaparse @types/papaparse

export interface CsvParseResult {
  rows: Record<string, string>[];
  errors: { row: number; message: string }[];
  totalRows: number;
  validRows: number;
  headers: string[];
}

export function parseCsvFile(fileContent: string, options?: {
  maxRows?: number;        // 기본 10,000
  requiredColumns?: string[];  // 예: ['product_name', 'origin_country']
  skipEmptyRows?: boolean;
}): CsvParseResult {
  // 1. Papa.parse로 파싱
  // 2. 헤더 검증 (필수 컬럼 존재 여부)
  // 3. 각 행 유효성 검사 (빈 값, 형식 오류)
  // 4. maxRows 초과 시 에러 반환
  // 5. BOM (Byte Order Mark) 제거 처리
  // 6. 인코딩 감지 (UTF-8, EUC-KR, Shift_JIS 등)
}
```

### 2. `app/lib/csv/exporter.ts` (신규 생성)
```typescript
export interface CsvExportOptions {
  filename: string;
  columns: { key: string; header: string }[];
  data: Record<string, unknown>[];
  includeHeaders?: boolean;  // 기본 true
  delimiter?: string;        // 기본 ','
  encoding?: 'utf-8' | 'utf-8-bom'; // 기본 utf-8-bom (Excel 호환)
}

export function generateCsv(options: CsvExportOptions): string {
  // 1. BOM 추가 (Excel에서 한국어/일본어 깨짐 방지)
  // 2. 헤더 행 생성
  // 3. 데이터 행 생성 (특수문자 이스케이프)
  // 4. 줄바꿈: \r\n (Windows 호환)
}
```

### 3. `app/api/v1/classify/csv/route.ts` (신규 생성)
```typescript
// POST: CSV 업로드 → 대량 HS 코드 분류
// 요청: multipart/form-data (file 필드) 또는 JSON { rows: [...] }
// 응답: { results: [...], summary: { total, classified, failed }, downloadUrl }

export async function POST(request: NextRequest) {
  // 1. 인증 확인 (API key)
  // 2. 플랜별 행 수 제한: Free 50행, Basic 500행, Pro 5000행, Enterprise 10000행
  // 3. CSV 파싱 → 필수 컬럼 검증 (product_name 필수, hs_code/origin/category 선택)
  // 4. 각 행에 대해 classifyProductAsync() 호출
  //    - 동시 처리: 5개씩 (Promise.allSettled)
  //    - 각 행 결과: { row, product_name, hs_code, confidence, source }
  //    - 실패 행: { row, error }
  // 5. 결과 CSV 생성 (원본 + hs_code, confidence 컬럼 추가)
  // 6. 요약 반환: { total, classified, failed, avgConfidence }
}
```

### 4. `app/api/v1/calculate/csv/route.ts` (신규 생성)
```typescript
// POST: CSV 업로드 → 대량 관세 계산
// 필수 컬럼: product_name, hs_code, origin, destination, value, currency
// 선택 컬럼: weight, quantity, shipping_cost
// 응답: 원본 CSV + duty_rate, duty_amount, vat, total_landed_cost 컬럼 추가

export async function POST(request: NextRequest) {
  // 1. 인증 + 플랜 제한 (위와 동일)
  // 2. CSV 파싱 → 필수 컬럼 검증
  // 3. 각 행에 대해 calculateGlobalLandedCostAsync() 호출
  //    - 동시 처리: 5개씩
  //    - 캐시 히트 확인 (precomputed_landed_costs)
  // 4. 결과 CSV 생성
  // 5. 에러 행은 별도 CSV로 분리
}
```

### 5. `app/api/v1/export/route.ts` (수정 또는 신규)
```typescript
// GET: 기존 계산/분류 결과를 CSV로 내보내기
// 파라미터: type=classifications|calculations|audit, format=csv|json, dateFrom, dateTo
// 응답: Content-Type: text/csv, Content-Disposition: attachment

export async function GET(request: NextRequest) {
  // 1. 인증 확인
  // 2. type별 데이터 조회 (Supabase)
  // 3. CSV 생성 (exporter.ts 사용)
  // 4. 스트리밍 응답 (대용량 파일)
}
```

## 의존성 설치
```bash
npm install papaparse @types/papaparse
```

## 테스트 (12개)
```
1. CSV 파싱: 정상 CSV 10행 → 10행 파싱 성공
2. CSV 파싱: 빈 행 포함 → skipEmptyRows=true일 때 스킵
3. CSV 파싱: 필수 컬럼 누락 → 에러 반환 (어떤 컬럼 누락인지 명시)
4. CSV 파싱: maxRows 초과 → "Maximum 10,000 rows" 에러
5. CSV 파싱: BOM 포함 UTF-8 → 정상 처리
6. CSV 내보내기: 10행 데이터 → UTF-8 BOM CSV, Excel에서 열림
7. CSV 내보내기: 특수문자 (쉼표, 따옴표, 줄바꿈) → 올바르게 이스케이프
8. classify/csv: 5행 상품 업로드 → 5행 HS 코드 결과 + confidence
9. classify/csv: 1행 실패 + 4행 성공 → 성공 4 + 에러 1 분리
10. calculate/csv: 3행 관세 계산 → duty, vat, total 컬럼 추가
11. export: classifications 타입 → CSV 다운로드
12. 플랜 제한: Free 플랜 51행 → "Free plan: max 50 rows" 에러
```

## 검증
```
=== 검증 단계 ===
1. npm run build — 빌드 성공
2. 테스트 12개 PASS
3. curl로 classify/csv 엔드포인트 테스트 (실제 CSV 파일)
4. curl로 calculate/csv 엔드포인트 테스트
5. export 엔드포인트에서 Content-Disposition 헤더 확인
6. 기존 classify/batch, calculate/batch에 영향 없음
```

## 결과
```
=== F109 CSV Export/Import — 구현 완료 ===
- 신규 파일: 4개 (parser.ts, exporter.ts, classify/csv, calculate/csv)
- 수정 파일: 1개 (export/route.ts)
- 의존성: papaparse
- 테스트: 12개
- 빌드: PASS/FAIL
```
