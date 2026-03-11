# 다음 세션 시작 가이드
> 마지막 업데이트: 2026-03-11 19:30 KST (Cowork 세션 9 — 47기능 도장깨기 34개 완료 + P0 인프라 3개)

---

## ⚠️ CW9에서 완료된 사항

### 47기능 도장깨기 — 34개 작업 완료
- **31개 기능 구현**: #1~#10, #14, #17~#21, #24~#28, #30~#33, #40, #42, #44~#47
- **3개 P0 인프라**: #11(벡터DB+분류파이프라인), #13(HS10자리확장), #15(분류DB규모)
- 전부 npm run build 통과

### 주요 변경
- **50개국어 i18n** (#14, #19): 26→50개 locale + Intl.DisplayNames 폴백
- **위젯 v2.1.0** (#21): auto-detect (locale/country/currency/theme)
- **FTA RoO 엔진** (#5): CTC/CTH/CTSH/RVC/WO, USMCA/RCEP/CPTPP
- **ASEAN/India/Turkey** (#18): 3개 tariff provider 추가
- **제재심사** (#25): OFAC/BIS/EU/UN/UK + fuzzy matching
- **CSV 배치** (#33): /api/v1/calculate/csv, batch MAX 500
- **벡터DB** (#11): pgvector + ivfflat + 5단계 분류 파이프라인
- **HS 10자리** (#13): USITC/UK/EU TARIC 정부 API + DB 캐시
- **분류DB** (#15): product_hs_mappings + pg_trgm + Google Taxonomy 170+ 매핑
- **GlobalCostEngine**: EU IOSS, UK reverse charge, AU LVG, Insurance, Brokerage, DDP/DDU, 반덤핑, Section 301, confidence_score
- **새 API**: /fta, /screening, /vat-report, /graphql, /support, /alerts/subscribe, /calculate/csv

### Supabase 인프라 (CW9 신규)
- pgvector (v0.8.0), pg_trgm 확장 설치
- hs_classification_vectors (ivfflat 벡터 인덱스)
- hs_expansion_rules (HS10 캐시)
- product_hs_mappings (gin_trgm_ops 인덱스)
- match_hs_vectors RPC 함수

### AGR 버그 수정
- import_agr_all.py: None 방어 (.strip() AttributeError)

---

## 현재 진행 중인 백그라운드 작업

### AGR 관세율 임포트 (Mac)
```bash
# 진행 확인
tail -5 ~/portal/agr_import.log
cat ~/portal/agr_import_progress.json
```
- ~144M행, 53개국
- 스크립트: import_agr_all.py + run_agr_loop.sh
- ⚠️ 완료 전까지 다른 대량 작업 금지

---

## 다음 세션 우선순위

### 🔴 P1 — 즉시
1. **#1 관세최적화** — 최적 관세율 자동 추천 (MIN/AGR/FTA 비교)
2. **#8 기업별 AD 관세** — 반덤핑 기업별 세율 적용 (trade_remedy_duties 활용)
3. **#9 heading 세분화** — HS 4자리 heading 내 세부 분류 개선
4. **#17 일간 Cron** — 환율/관세율 일일 자동 업데이트 (현재 주간 → 일간)
5. **#25 SDN 데이터 로딩** — OFAC SDN 실제 데이터 로딩 (현재 하드코딩 25건 → 풀 리스트)
6. **AGR 임포트 모니터링** → `cat ~/portal/agr_import_progress.json` (31/53 완료, MAR 진행중)
7. **Google Taxonomy→HS 매핑 임포트** — `npx tsx scripts/import-google-taxonomy-hs.ts`

### 🟡 P2 — 47기능 남은 항목
8. **47기능 중 미완료 항목 확인** — POTAL_47_Victory_Strategy.xlsx 기준
9. **벤치마크 실행** — `npx tsx accuracy-benchmark/run-benchmark.ts` (분류 정확도 측정)
10. **벡터DB 데이터 적재** — WDC 추출 후 임베딩 생성 → hs_classification_vectors
11. **WDC 상품명 추출 실행** (AGR 완료 후):
   ```bash
   cd ~/portal && nohup python3 scripts/extract_with_categories.py /Volumes/soulmaten/POTAL/wdc-products > wdc_extract.log 2>&1 &
   ```
12. **Shopify 앱 심사 상태 확인** — Partner Dashboard

### 🟢 P3 — 장기
13. **lookup_duty_rate_v2() 통합 테스트** — MIN+AGR 4단계 폴백 검증
14. **Layer 2 Monitor 구현** — Morning Brief 자동 보고
15. **Layer 3 Agent Teams 시범 운영**

---

## ⚠️ 주의사항
- **결제**: ✅ Paddle Live 완료 + Overage 빌링 + DDP Quote-only
- **요금제**: ✅ 전체 코드베이스 정리 완료 (Free/Basic/Pro/Enterprise)
- **47기능**: CW9에서 34개 작업 완료 (31기능 + 3 P0인프라)
- **AI Agent Org v3**: ✅ 15 Division, 3 Layer, Chief Orchestrator
- **Layer 1 자동화**: ✅ 15/15 Division 전체 완료, Vercel Cron 9개
- **Git push**: Mac 터미널에서만 가능
- **터미널 작업**: 한 번에 하나만 (AGR 실행 중)

---

## Vercel Cron 전체 목록 (9개)

| # | 엔드포인트 | 스케줄 | Division |
|---|-----------|--------|----------|
| 1 | `/admin/update-tariffs` | 매주 월 06:00 UTC | D1 |
| 2 | `/admin/billing-overage` | 매월 1일 07:00 UTC | D10 |
| 3 | `/admin/health-check` | 매 6시간 | D11 |
| 4 | `/admin/spot-check` | 매일 04:00 UTC | D8 |
| 5 | `/admin/uptime-check` | 매 6시간 | D5 |
| 6 | `/admin/trade-remedy-sync` | 매주 월 06:30 UTC | D1 |
| 7 | `/admin/gov-api-health` | 매 12시간 | D4 |
| 8 | `/admin/plugin-health` | 매 12시간 | D6 |
| 9 | `/admin/competitor-scan` | 매주 월 08:00 UTC | D15 |
