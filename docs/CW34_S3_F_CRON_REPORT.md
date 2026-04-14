# CW34-S3-F Cron Integration Report
**작성일**: 2026-04-14 KST
**상태**: ✅ 완료

## 구현 내용

### 1. Vercel Cron Route
- **경로**: `/api/cron/rulings-update-monitor`
- **스케줄**: `0 6 * * 1` (매주 월요일 06:00 UTC = KST 15:00)
- **역할**: EBTI/CROSS 소스 변경 감지 + 텔레그램 알람
- **제한**: Vercel에서 외장하드 접근 불가 → 감지만, 처리는 로컬

### 2. 감지 방법
| 소스 | 방법 | URL |
|------|------|-----|
| EBTI | HEAD 요청 → Last-Modified 헤더 | `ec.europa.eu/taxation_customs/dds2/ebti/` |
| CROSS | JSON API → 최신 ruling date | `rulings.cbp.gov/api/search?sortBy=issueDate&order=desc&pageSize=1` |

DB의 `max(ruling_date)` per source와 비교 → 신규 있으면 `needs_refresh: true`.

### 3. 알람 경로
`needs_refresh=true` → Telegram 메시지 → 은태님이 맥에서 `npm run warehouse:refresh` 실행

### 4. 로컬 Refresh 파이프라인
```
npm run warehouse:refresh
  ├── 1/5: download-sources.mjs  (현재 수동, CW34-S5에서 자동화)
  ├── 2/5: ingest-bronze.mjs     (SHA256 delta — 변경 파일만)
  ├── 3/5: build-silver.mjs      (정규화)
  ├── 4/5: build-gold.mjs        (business rules)
  └── 5/5: load-platinum.mjs     (Supabase staging load)
```
최종 SWAP은 Supabase Studio SQL Editor에서 수동 실행.

### 5. package.json Scripts
| Command | 설명 |
|---------|------|
| `npm run warehouse:refresh` | 전체 파이프라인 (1→5) |
| `npm run warehouse:bronze` | Bronze ingest만 |
| `npm run warehouse:silver` | Silver 빌드만 |
| `npm run warehouse:gold` | Gold 빌드만 |
| `npm run warehouse:platinum` | Supabase staging load만 |

### 6. vercel.json
25번째 cron으로 추가. 빌드 확인: `✅ /api/cron/rulings-update-monitor` (Dynamic)

## 생성 파일
- `app/api/cron/rulings-update-monitor/route.ts`
- `scripts/warehouse/refresh-all.mjs`
- `scripts/warehouse/download-sources.mjs`
- `vercel.json` (cron entry 추가)
- `package.json` (scripts 추가)

## 다음 단계
CW34-S3-G Verification (1,000 sample manual review)
