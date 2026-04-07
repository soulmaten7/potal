# SOURCE_PUBLICATION_TICKER.md — 원본 출처 공식 발표일 티커
# 실행: 터미널 1
# 예상 소요: 20~25분
# 마지막 업데이트: 2026-04-05

---

## 목적
기존 Data Source Ticker (우리 DB 업데이트 시간) 아래에
**원본 출처의 공식 발표일/버전/관보 번호**를 표시하는 두 번째 티커 추가.

### 현재 (1줄)
```
● USITC 22d ago | ● Exchange Rates 5h ago | ● EU TARIC 22d ago
```

### 목표 (2줄)
```
● USITC 22d ago | ● Exchange Rates 5h ago | ● EU TARIC 22d ago        ← DB 신선도
● USITC HTS 2026 Eff. Jan 1 | ● ECB Daily Ref | ● EU CN 2026 Eff. Jan 1  ← 원본 발표일
```

---

## 현재 메타데이터 현황

코드베이스 분석 결과, 원본 발표일 메타데이터가 있는 소스와 없는 소스:

| 소스 | 현재 메타데이터 | 필요한 정보 |
|------|---------------|-----------|
| USITC HTS | API URL만 있음 | HTS 2026 edition, Effective Jan 1, 2026 |
| EU TARIC | API URL만 있음 | Combined Nomenclature 2026, Eff. Jan 1, 2026 |
| UK Trade Tariff | API URL만 있음 | UK Customs Tariff 2026, Eff. Jan 1, 2026 |
| Canada CBSA | DB 테이블만 있음 | Customs Tariff Schedule 2026 |
| Australia ABF | DB 테이블만 있음 | Customs Tariff 2026 |
| Korea KCS | DB 테이블만 있음 | Harmonized Tariff 2026 |
| Japan Customs | DB 테이블만 있음 | Customs Tariff 2026 |
| MacMap MFN | ✅ `data_year: 2023`, `revision: H6` | MacMap MFN 2023 (HS2017) |
| Exchange Rates | ✅ ECB daily XML | ECB Daily Reference Rate |
| Section 301/232 | 부분적 (EO 날짜만) | EO Mar 12, 2025 (25% Al/Steel) |
| Trade Remedies | ✅ `effective_date`, `case_number` | 최신 case 날짜 |
| FTA Agreements | ✅ `year_entered_force` | 각 협정 발효년도 |

---

## 아키텍처

### 접근 방식: `data/source-publications.json` 정적 파일

원본 발표일은 **연간 1~2회** 정도만 바뀌는 정보 (관세 스케줄은 보통 1월 1일 발효).
→ Supabase 실시간 조회 불필요. **정적 JSON 파일**로 관리하고 변경 시 수동 업데이트.
→ prebuild 스크립트로 MacMap, FTA, Trade Remedies의 DB 메타데이터는 자동 보강 가능.

```
data/source-publications.json
  ↓
DataSourceTicker.tsx가 import
  ↓
두 번째 줄에 표시
```

---

## 작업 순서

### Step 1: data/source-publications.json 생성

```json
{
  "lastManualUpdate": "2026-04-05",
  "sources": [
    {
      "name": "USITC",
      "publication": "HTS 2026 Edition",
      "effectiveDate": "2026-01-01",
      "reference": "USITC Pub. 5765",
      "sourceUrl": "https://hts.usitc.gov/",
      "shortLabel": "HTS 2026 — Eff. Jan 1"
    },
    {
      "name": "UK Trade Tariff",
      "publication": "UK Global Tariff 2026",
      "effectiveDate": "2026-01-01",
      "reference": "UK Trade Tariff",
      "sourceUrl": "https://www.trade-tariff.service.gov.uk/",
      "shortLabel": "UKGT 2026 — Eff. Jan 1"
    },
    {
      "name": "EU TARIC",
      "publication": "Combined Nomenclature 2026",
      "effectiveDate": "2026-01-01",
      "reference": "OJ L 2025/2782",
      "sourceUrl": "https://ec.europa.eu/taxation_customs/dds2/taric/",
      "shortLabel": "CN 2026 — Eff. Jan 1"
    },
    {
      "name": "Canada CBSA",
      "publication": "Customs Tariff Schedule 2026",
      "effectiveDate": "2026-01-01",
      "reference": "CBSA D-Memoranda",
      "sourceUrl": "https://www.cbsa-asfc.gc.ca/trade-commerce/tariff-tarif/",
      "shortLabel": "Customs Tariff 2026 — Eff. Jan 1"
    },
    {
      "name": "Australia ABF",
      "publication": "Customs Tariff 2026",
      "effectiveDate": "2026-01-01",
      "reference": "Schedule 3",
      "sourceUrl": "https://www.abf.gov.au/importing-exporting-and-manufacturing/tariff-classification",
      "shortLabel": "AU Tariff 2026 — Eff. Jan 1"
    },
    {
      "name": "Korea KCS",
      "publication": "관세율표 2026",
      "effectiveDate": "2026-01-01",
      "reference": "KCS Tariff Schedule",
      "sourceUrl": "https://www.customs.go.kr/",
      "shortLabel": "KR Tariff 2026 — Eff. Jan 1"
    },
    {
      "name": "Japan Customs",
      "publication": "Customs Tariff Schedule 2026",
      "effectiveDate": "2026-04-01",
      "reference": "MOF Notification",
      "sourceUrl": "https://www.customs.go.jp/english/tariff/",
      "shortLabel": "JP Tariff FY2026 — Eff. Apr 1"
    },
    {
      "name": "MacMap MFN",
      "publication": "ITC MacMap MFN Rates",
      "effectiveDate": "2023-01-01",
      "reference": "HS2017 (H6 Revision)",
      "sourceUrl": "https://www.macmap.org/",
      "shortLabel": "MacMap 2023 — HS2017 Rev."
    },
    {
      "name": "Exchange Rates",
      "publication": "ECB Euro Foreign Exchange Reference Rates",
      "effectiveDate": null,
      "reference": "Daily Publication",
      "sourceUrl": "https://www.ecb.europa.eu/stats/eurofxref/",
      "shortLabel": "ECB — Daily Reference"
    },
    {
      "name": "Section 301/232",
      "publication": "Executive Order — 25% Steel & Aluminum",
      "effectiveDate": "2025-03-12",
      "reference": "EO 14307",
      "sourceUrl": "https://www.federalregister.gov/",
      "shortLabel": "EO 14307 — Mar 12, 2025"
    },
    {
      "name": "Trade Remedies",
      "publication": "AD/CVD Orders & Safeguards",
      "effectiveDate": null,
      "reference": "10,999 active cases",
      "sourceUrl": "https://www.trade.gov/enforcement-and-compliance",
      "shortLabel": "10,999 Active Cases"
    },
    {
      "name": "FTA Agreements",
      "publication": "Free Trade Agreements Registry",
      "effectiveDate": null,
      "reference": "1,319 agreements (WTO RTA-IS)",
      "sourceUrl": "https://rtais.wto.org/",
      "shortLabel": "1,319 FTAs — WTO Registry"
    }
  ]
}
```

**주의**: `shortLabel`이 티커에 표시되는 텍스트. 간결하게 유지.

---

### Step 2: DataSourceTicker.tsx 수정 — 두 번째 줄 추가

**수정 파일**: `components/home/DataSourceTicker.tsx`

```typescript
// 상단에 import 추가
import publicationData from '@/data/source-publications.json';

// 새 인터페이스
interface SourcePublication {
  name: string;
  shortLabel: string;
  sourceUrl: string;
}
```

**UI 구조 변경**:
현재 `<div>` 하나에 스크롤 티커 1줄 → 2줄 구조로 변경.

```tsx
return (
  <div style={{
    background: '#0A0A1A',
    borderBottom: '1px solid rgba(255,255,255,0.08)',
    overflow: 'hidden',
  }}>
    {/* 1줄: DB Freshness (기존) */}
    <div style={{ /* 기존 티커 스타일 유지 */ }}>
      {/* 기존 스크롤 애니메이션 + items */}
    </div>

    {/* 2줄: Source Publications (새로 추가) */}
    <div style={{
      borderTop: '1px solid rgba(255,255,255,0.05)',
      padding: '6px 0',
      overflow: 'hidden',
      position: 'relative',
    }}>
      <div style={{
        display: 'inline-flex',
        animation: 'tickerScroll2 90s linear infinite', /* 1줄보다 느리게 */
        gap: 0,
      }}>
        {/* publicationData.sources를 2번 반복 (무한 스크롤) */}
        {[...publicationData.sources, ...publicationData.sources].map((pub, i) => (
          <span key={i} style={{ display: 'inline-flex', alignItems: 'center', gap: 6, whiteSpace: 'nowrap' }}>
            <span style={{ color: 'rgba(255,255,255,0.5)', fontSize: 12, fontWeight: 500 }}>
              {pub.name}
            </span>
            <span style={{ color: 'rgba(245,158,11,0.8)', fontSize: 12, fontWeight: 600 }}>
              {pub.shortLabel}
            </span>
            {i < publicationData.sources.length * 2 - 1 && (
              <span style={{ color: 'rgba(255,255,255,0.15)', margin: '0 14px' }}>│</span>
            )}
          </span>
        ))}
      </div>

      {/* 좌우 페이드 그라디언트 (기존과 동일) */}
    </div>
  </div>
);
```

**스타일 차이점** (1줄 vs 2줄):
| 항목 | 1줄 (DB Freshness) | 2줄 (Source Publications) |
|------|-------------------|-------------------------|
| 글자 크기 | 15px / 13px | 12px / 12px |
| 색상 | 흰색 + 초록/노랑/빨강 상태 | 회색 + 앰버(#F59E0B) |
| 스크롤 속도 | 60s | 90s (더 느리게) |
| 패딩 | 12px | 6px |
| 상태 도트 | ● (색상 변동) | 없음 |

→ 2줄은 보조 정보 느낌으로 더 작고 은은하게.

---

### Step 3: CSS @keyframes 추가

```css
@keyframes tickerScroll2 {
  0% { transform: translateX(0); }
  100% { transform: translateX(-50%); }
}
```

기존 `tickerScroll`과 동일한 구조, 속도만 다르게.

---

### Step 4: 빌드 & 검증

```bash
npm run build
```

확인 사항:
- [ ] 1줄(DB freshness)과 2줄(source publications)이 동시에 표시
- [ ] 2줄의 스크롤 속도가 1줄보다 느림
- [ ] 2줄의 텍스트가 1줄보다 작고 은은함
- [ ] source-publications.json import 정상
- [ ] 모바일에서 1줄만 표시하고 2줄은 숨기기 고려 (선택사항)

---

## 향후 관리

원본 발표일이 바뀌는 타이밍:
- **매년 1월**: 대부분 국가의 관세 스케줄 갱신 (USITC, EU, UK, CA, AU, KR)
- **매년 4월**: 일본 관세 스케줄 갱신 (회계연도 기준)
- **수시**: Section 301/232 (행정명령), Trade Remedies (새 판결)
- **MacMap**: ITC가 새 빈티지 공개 시 (보통 연 1회)

→ `source-publications.json`을 1월과 4월에 수동 업데이트하면 충분.
→ 2번 명령어(MONITOR_AUTO_IMPORT)에서 자동화 가능한 부분은 자동화 예정.

## 수정 파일 요약
| 파일 | 작업 |
|------|------|
| `data/source-publications.json` | 새로 생성 — 12개 소스의 공식 발표일 |
| `components/home/DataSourceTicker.tsx` | 두 번째 줄 추가, 스타일 분리 |
