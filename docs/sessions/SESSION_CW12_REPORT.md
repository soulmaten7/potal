# Cowork 12 세션 리포트
> 2026-03-13 22:00 KST

## 세션 개요
**유형**: 전략 세션 (은태님 + Cowork)
**핵심 주제**: 경쟁사 기능 분석, 240개국 규정 RAG 전략, 데이터 유지보수 설계, 시장 평가

---

## 주요 성과

### 1. 147개 경쟁사 기능 분석 완료
- **10개 경쟁사** 전체 기능 중복 제거: Avalara, Global-e, Zonos, Easyship, DHL, SimplyDuty, Dutify, Hurricane, TaxJar, Passport
- **147개 고유 기능** 도출, 16개 카테고리 분류
- **최종 판정**: MUST 102 (58 구현완료 + 44 구현필요) / SHOULD 40 / WON'T 5
- **커버리지**: 142/147 = **96.6%**
- WON'T 5개: 인간전문가검증, 국제방문자인사, 장바구니이탈방지, Power BI, 700+전문가네트워크

### 2. 5개 솔루션 전략 (WON'T 60→5)
1. **240개국 규정 RAG**: 관세법/세법 벡터 DB화 → 규정 기반 기능 자동 커버
2. **중소 물류사 파트너십**: POTAL(엔진) + 물류(배송) = 물류 기능 커버
3. **100% 정확도 증명 → MoR 불필요**: 정확도 완벽 → 고객 직접 수입
4. **결제 인프라 활용**: Stripe/Paddle이 사기방지/환불 처리
5. **AEO 고객지원**: 인증 대행 아닌 서류/절차 안내 도구

### 3. 타겟 거래처 3그룹
- **A그룹 (즉시)**: Shopify 41K+ 스토어, WooCommerce, Royal Mail, Australia Post, Canada Post
- **B그룹 (RAG 후)**: eBay, Etsy, 중형 물류사
- **C그룹 (풀 파트너십)**: DHL, Walmart, Toyota/Samsung

### 4. 범용 HS Code 계산기 증명
- 산업부품: "볼트 M6x20 스테인리스" → HS 7318.15 (정확)
- 반도체: "DDR5 SDRAM 16GB 1Rx8 PC5-4800B-SA0-1010-XT" → HS 8542.32 (정확)
- 소비재: 기존 WDC 데이터 기반 분류 정상
- **결론**: "세상의 모든 HS Code를 계산할 수 있는 계산기"

### 5. 240개국 규정 RAG 전략 확정
- **목표**: 전 세계 관세법/세법/무역규정 → 벡터 DB → "240개국 관세사/세무사 AI"
- **핵심 인사이트**: "결과가 정해져 있는 시장" = 관세사가 공부하는 법률 → 전부 디지털화 가능
- **Approach 2가 Approach 1을 포함**: RAG → LLM 규칙 추출 → 구조화 DB → 코드 실행
- **수집**: Phase 1(7개국) → Phase 2(국제기구) → Phase 3(지역/나머지)
- **저장**: 외장하드 /Volumes/soulmaten/POTAL/regulations/
- **상태**: Claude Code 터미널 2에서 수집 진행중

### 6. 데이터 유지보수 자동화 설계
- **원리**: 정부 규정 변경은 공고 페이지로 사전 공지 (WTO TBT 60일 전 통보)
- **3단계**: 공고 URL 특정(1회) → Cron 해시 비교(매일) → Make.com AI 변경 해석
- **분류**: 세율변경→자동 DB, 새규정→RAG 추가, UI변경→skip
- **예외**: URL 구조 변경 시 이메일 알림 (연 1~2회)
- **비용**: 일일 ~$0

### 7. 시장 평가
- 설계 90점
- 핵심 공식: "정해진 답 데이터화 → 사전매핑 → DB 룩업 $0"
- AI Agent 시대 API 인프라 포지셔닝 적합
- ARR $1M~$10M 도달 가능
- **리스크 3가지**: 정확도 실사용 검증, 영업(기존 계약 빼앗기), 유지보수
- 유지보수는 "변경 피드 구독"으로 예상보다 가벼움
- **가장 빠른 과제**: 첫 유료 고객 10개

---

## 생성 파일
| 파일 | 내용 |
|------|------|
| analysis/POTAL_Complete_Feature_Analysis.xlsx | 147개 전체 기능 + 10개 경쟁사 보유 현황 |
| analysis/POTAL_Target_Analysis.xlsx | 거래처 유형별 필요 기능 + 1차 판정 |
| analysis/POTAL_Revised_Feature_Analysis.xlsx | RAG+파트너십 적용 후 재판정 |
| analysis/POTAL_Final_Feature_Analysis_v2.xlsx | **최종본** (102/40/5, 96.6%) |
| REGULATION_DATA_COLLECTION_COMMAND.md | 240개국 규정 수집 Claude Code 명령어 |

---

## 백그라운드 작업 상태
| 작업 | 위치 | 상태 |
|------|------|------|
| 7개국 HS 10자리 벌크 | Claude Code 터미널 1, 외장하드 | 🔄 진행중 |
| 240개국 규정 수집 | Claude Code 터미널 2, 외장하드 | 🔄 진행중 |
| WDC 추출 | Mac 터미널 | 🔄 ~1,029/1,899 |
| AGR 53/53국 | 완료 | ✅ |

---

## 다음 세션 (CW13) 추천 우선순위
1. 벌크 다운로드 + 규정 수집 진행 확인
2. 44개 MUST 미구현 기능 우선순위 정리 (A그룹 기준)
3. 5억 상품명 사전 매핑 파이프라인
4. A그룹 타겟 접근 전략
5. 첫 유료 고객 10개 확보 방안

---

## 문서 업데이트
- ✅ CLAUDE.md — Cowork 12 전체 내용 반영
- ✅ session-context.md — Cowork 12 완료 항목 + 진행중 작업 + 로드맵 업데이트
- ✅ .cursorrules — Cowork 12 항목 5개 추가
- ✅ CHANGELOG.md — Cowork 12 전체 변경 이력
- ✅ NEXT_SESSION_START.md — CW12 요약 + 우선순위 CW13 기준으로 업데이트
- ✅ SESSION_CW12_REPORT.md — 본 리포트
