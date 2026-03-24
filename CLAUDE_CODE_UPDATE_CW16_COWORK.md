# CW16 Cowork 세션 — 5개 문서 업데이트 명령어
# 2026-03-17 KST
# 이 파일의 내용을 Claude Code 터미널에 복사-붙여넣기하세요.

---

아래 4개 파일을 업데이트해. 각 파일에 기존 내용은 유지하고, 아래 내용을 **추가**해.

=== 1. CLAUDE.md 업데이트 ===

파일: CLAUDE.md (루트)
헤더 날짜를 수정:
```
# 마지막 업데이트: 2026-03-17 22:00 KST (CW16 Cowork — GRI Agent Team 설계, HS Code 분류 엔진 역설계, 7개국 규칙 수집 완료, DB read-only 복구 진행)
```

### "핵심 수치" 섹션에 추가/수정:
- **HS Code 매핑**: product_hs_mappings **~1.36M건** (WDC v2 36M건은 부정확 추정 매핑으로 판명 → 삭제 진행 중. GRI 기반 정확 매핑으로 재구축 예정)
- **GRI 분류 참고자료**: ✅ **2.1MB 수집 완료** (/Volumes/soulmaten/POTAL/hs_classification_rules/, 14개 파일)
  - Section Notes 21개 (45KB) + Chapter Notes 96개 (358KB) + Subheading Notes 37개 (97KB)
  - GRI 1-6 규칙 + CBP 사례 (35KB) + CBP Classification Guide 43페이지 (97KB)
  - 7개국 추가 규칙: US/EU/UK/KR/JP/AU/CA 전부 완료 + SUMMARY.md
  - COMPLETE_GRI_REFERENCE.md (42KB) + COMPLETE_GRI1_REFERENCE.md (475KB)
- **EU EBTI 수집 완료**: 269,730 rulings → 231,727 고유 product-HS 매핑 추출 (/Volumes/soulmaten/POTAL/regulations/eu_ebti/)
- **DB 상태**: ⚠️ read-only (디스크 53GB 초과) → WDC v2 36M건 삭제 진행 중 → 완료 후 VACUUM FULL → read-write 복구 예정

### 새 섹션 추가: "⭐ CW16 Cowork 세션 성과 (2026-03-17 KST)"

```markdown
### ⭐ CW16 Cowork 세션 성과 (2026-03-17 KST)

**HS Code 분류 엔진 근본적 재설계 — "시스템을 바꾸지 말고 사람을 대체하라":**

핵심 인사이트 (은태님):
- 기존 접근: "AI한테 상품명 주고 HS Code 맞춰봐" → 시스템을 새로 만들려 한 것 → 오류 지속 (v2~v10, 최고 38%)
- 새 접근: "관세사가 하는 것과 똑같은 과정을 자동화" → 시스템은 그대로, 사람만 AI로 대체
- "이미 정답이 있는 시스템을 바꾸려 하니 오류가 생겼다. 사람이 하는 구조를 유지한 채 사람을 대체해야 한다"

**GRI (General Rules of Interpretation) 기반 분류 엔진 설계:**
- GRI 1~6 순차 적용 구조 (관세사가 실제 분류하는 방식 그대로)
- GRI 1: Section/Chapter Notes + Heading 설명 → 90% 분류 (주관 없음, 규칙 적용)
- GRI 2~5: 미완성/혼합/복수heading/포장 → 8% (판단 필요, 판례 참조)
- GRI 6: Subheading 레벨에서 GRI 1~5 재적용 → 최종 6자리 확정
- 핵심: 11단계 중 AI "생각"이 필요한 건 1~2단계뿐, 나머지는 코드/DB 룩업

**7개국 Country Agent 하위에이전트 설계 (은태님 아이디어):**
- 도착지별 전용 Agent (US/EU/UK/KR/JP/AU/CA)
- 각 Agent에 해당 국가 규칙 + 판례 패턴 내장
- API 호출 시 도착지가 이미 정해져 있으므로 1개 Agent만 작동 → 토큰 1/7 절약 + 정확도 향상
- 나머지 233국: 6자리에서 끝 (7~10자리 없음)

**"판례 → 대립 패턴" 규칙화 설계 (은태님 아이디어):**
- 기존: 22만 CBP 판례를 날것으로 검색 → 매번 다른 결과 가능
- 새 방식: 챕터별 "대립 패턴"으로 1회 정리
  - 각 패턴: 대립 후보(A vs B) + 정답 + 판단 근거 + 탈락 이유 + 예외 조건
  - AI가 "생각"이 아닌 "매칭"으로 분류 → 일관성 + 속도 + 감사추적
- 판례 소스: CBP CROSS 220,114건 + EU EBTI 269,730건 = ~50만건
- 6자리 판단은 CBP+EBTI 공통 (전 세계 6자리 동일), 7~10자리는 해당 국가만

**단계별 코드 체인 구조:**
```
Step 1: [코드] 상품명 키워드 추출
Step 2: [코드] Section 매칭 (21개)
Step 3: [코드] Section Note 포함/제외 체크
Step 4: [코드] Chapter 매칭 (97개)
Step 5: [코드] Chapter Note 포함/제외 체크
Step 6: [코드] Heading 매칭 (1,228개)
Step 7: [AI 1회] 대립 패턴 매칭 (필요 시만)
Step 8: [코드] Subheading 매칭 (5,371개)
Step 9: [코드] Country Router → 해당 Country Agent
Step 10: [코드] 가격 분기/추가 규칙 적용
Step 11: [코드] 최종 7~10자리 확정
→ AI 호출 0~2회, 나머지 전부 코드. 비용 기존 대비 1/10 이하
```

**12개 Total Landed Cost 계산 영역 — 같은 방식 적용 계획:**
1. HS Code — GRI Agent Team (지금 설계 중)
2. Duty Rate — DB 룩업 (113M+ 이미 있음, AI 0회)
3. AD/CVD — DB 매칭 (119,706건, AI 0회)
4. VAT/GST — DB 룩업 (240개국, AI 0회)
5. De Minimis — if문 1개 (AI 0회)
6. Special Tax — 테이블 (12개국, AI 0회)
7. Customs Fees — 고정값 (AI 0회)
8. Rules of Origin — FTA PSR 매칭 (복잡 시 AI 1회)
9. Export Controls — ECCN 매트릭스 (이중용도 시 AI 1회)
10. Sanctions — 퍼지 매칭 (21,301건, AI 0회)
11. Currency — API (AI 0회)
12. Insurance/Shipping — 수식 (AI 0회)
→ 12개 중 AI 필요: HS Code(1~2회) + RoO(가끔 1회) + Export Controls(가끔 1회). 나머지 9개는 코드만.

**전략 방향 전환:**
- "모든 기능을 이런 관점(사람 프로세스 역설계 → 코드화 → AI 최소화)으로 접근"
- Beta 출시 → Pro 모델까지 개방 → 142개 기능 계속 파이프라인 확장
- 이 구조가 경쟁사(Avalara/Zonos)가 못 따라오는 이유: 그들은 "AI로 분류"하지만, POTAL은 "공식 자체를 코드로" 만듦

**GRI 참고자료 수집 완료 (2.1MB, 14개 파일):**
- 터미널 1: Section/Chapter Notes + GRI 1-6 규칙 + CBP Guide ✅
- 터미널 2: 7개국(US/EU/UK/KR/JP/AU/CA) 추가 규칙 ✅
- EU EBTI: 269,730 rulings, 231,727 매핑 추출 ✅
- 저장: /Volumes/soulmaten/POTAL/hs_classification_rules/

**벤치마크 히스토리 (HS Code 분류 정확도):**
- v2 (GPT-4o-mini): 6-digit 25%
- v8 (GPT-4o): 6-digit 37%
- v10 (GPT-4o + GRI prompt): 6-digit 38%
- 경쟁사: Tarifflo 89%, Avalara 80%, Zonos 44%, WCO BACUDA 13%
- 다음 목표: GRI Agent Team으로 89%+ (Tarifflo 수준)

**DB read-only 긴급 복구:**
- 원인: WDC v2 벌크 업로드로 product_hs_mappings 37.3M건 (8.75GB) → DB 53GB → Supabase 디스크 초과
- WDC v2 데이터 = 카테고리 기반 추정 매핑 (GRI 미적용, 부정확) → 삭제 결정
- 터미널 3에서 36M건 배치 삭제 진행 중 (50만건씩, ~2~3시간)
- 삭제 후: 기존 1.3M건 유지 + VACUUM FULL + read-write 복구
- 향후: GRI 엔진으로 분류한 결과만 DB에 저장 (정확한 매핑만)

**파일 생성/수집:**
- /Volumes/soulmaten/POTAL/hs_classification_rules/ (14개 파일, 2.1MB)
  - section_notes.json, chapter_notes.json, subheading_notes.json
  - COMPLETE_GRI1_REFERENCE.md, COMPLETE_GRI_REFERENCE.md
  - gri_full_text.md, gri1~6_rules_and_cases.md
  - cbp_classification_guide.md
  - us_additional_rules.md, eu_cn_rules.md, uk_tariff_rules.md
  - kr_classification_rules.md, jp_tariff_rules.md, au_tariff_rules.md
  - ca_tariff_rules.md, SUMMARY.md
- /Volumes/soulmaten/POTAL/regulations/eu_ebti/ (269,730 rulings)
```

### product_hs_mappings 테이블 현황 업데이트:
```
| product_hs_mappings | ~1.36M (WDC v2 36M건 삭제 중) | ✅ (GRI 기반 재구축 예정) |
```

---

=== 2. session-context.md 업데이트 ===

파일: session-context.md (루트)
헤더 날짜를 수정:
```
> 마지막 업데이트: 2026-03-17 22:00 KST (CW16 Cowork — GRI Agent Team 설계, HS Code 분류 엔진 역설계, 7개국 규칙 수집 완료, DB read-only 복구)
```

적절한 위치에 아래 내용 추가:

```markdown
### CW16 Cowork 세션 (2026-03-17 KST)

**HS Code 분류 근본 전략 전환:**
- 기존: "AI한테 상품명 주고 맞춰봐" (v2~v10, 최고 38%)
- 전환: "관세사가 하는 과정 그대로 자동화" — GRI 1~6 순차 적용
- 핵심 원칙: "시스템을 바꾸지 말고 사람을 대체하라" (은태님)
- 관세사가 쓰는 도구 5가지 전부 확보: GRI 규칙 ✅ + Section/Chapter Notes ✅ + Heading 설명 ✅ + 7개국 규칙 ✅ + 판례(CBP 22만+EBTI 27만) ✅

**GRI Agent Team 아키텍처:**
- Layer 1: GRI 1~6 Agent (6자리 분류, 전 세계 공통)
  - 11단계 체인, AI 호출 최대 1~2회, 나머지 코드/DB
- Layer 2: 7개국 Country Agent (7~10자리, 국가별 하위에이전트)
  - US/EU/UK/KR/JP/AU/CA 각각 전용 프롬프트
  - 도착지 기준 1개만 호출 → 토큰 1/7 절약
- 판례 규칙화: CBP+EBTI 50만건 → 챕터별 "대립 패턴" 정리 (1회성)
  - 패턴: 대립 후보 + 정답 + 근거 + 탈락이유 + 예외

**12개 TLC 계산 영역 — 동일 접근:**
- 각 영역의 "사람 프로세스"를 역설계 → 코드화 → AI 최소화
- 12개 중 9개는 이미 DB/코드만으로 완결. AI 필요: HS Code, RoO, Export Controls만

**GRI 참고자료 수집 완료 (14개 파일, 2.1MB):**
- Section Notes 21개 + Chapter Notes 96개 + Subheading Notes 37개
- GRI 1-6 규칙 원문 + CBP 사례 + CBP Classification Guide (43페이지)
- 7개국 추가 규칙: US, EU, UK, KR, JP, AU, CA 전부 완료
- EU EBTI 269,730건 수집 + 231,727 매핑 추출
- 저장: /Volumes/soulmaten/POTAL/hs_classification_rules/

**DB read-only 긴급 복구:**
- product_hs_mappings WDC v2 36M건 = 카테고리 추정 매핑 (부정확) → 삭제 진행 중
- DB 53GB → 삭제+VACUUM 후 ~10~15GB 예상
- 기존 1.3M건 유지 (WDC v1 + CBP CROSS + Google taxonomy)
- 향후: GRI 엔진 분류 결과만 DB 저장

**벤치마크 히스토리:**
- v2(4o-mini) 25% → v8(4o) 37% → v10(4o+GRI) 38%
- 경쟁사: Tarifflo 89%, Avalara 80%, Zonos 44%
- 목표: GRI Agent Team으로 89%+

**다음 작업 (우선순위):**
1. DB read-only 복구 (터미널 3, 진행 중)
2. 판례 → 대립 패턴 규칙화 (CBP 22만 + EBTI 27만 → 챕터별 정리)
3. GRI Agent Team + 7 Country Agent 구축
4. CBP 100건 벤치마크 테스트
5. 12개 TLC 계산 영역 전체 구조화
6. Beta 출시 준비
```

---

=== 3. docs/CHANGELOG.md 업데이트 ===

파일: docs/CHANGELOG.md
날짜 헤더 추가:

```markdown
## [2026-03-17 22:00 KST] CW16 Cowork — GRI Agent Team 설계, HS Code 분류 엔진 역설계, 7개국 규칙 수집 완료

### HS Code 분류 전략 근본 전환
- "시스템을 바꾸지 말고 사람을 대체하라" — 관세사의 분류 프로세스를 그대로 자동화
- GRI 1~6 순차 적용 → 11단계 코드 체인 (AI 호출 최대 1~2회)
- 벤치마크: v2(25%) → v8(37%) → v10(38%) → 다음: GRI Agent Team(목표 89%+)

### GRI Agent Team + 7 Country Agent 아키텍처 설계
- Layer 1: GRI Agent (6자리, 전 세계 공통) — 코드 위주 + AI 최소
- Layer 2: Country Agent 7개 (US/EU/UK/KR/JP/AU/CA) — 7~10자리, 도착지 기준 1개만 호출
- 판례 규칙화: CBP 22만 + EBTI 27만 → 챕터별 "대립 패턴" (1회성 정리)

### GRI 참고자료 수집 완료 (2.1MB, 14개 파일)
- Section Notes (21개, 45KB) + Chapter Notes (96개, 358KB) + Subheading Notes (37개, 97KB)
- GRI 1-6 규칙 + 사례 (35KB) + CBP Classification Guide (97KB)
- 7개국 추가 규칙: US, EU, UK, KR, JP, AU, CA ✅
- COMPLETE_GRI_REFERENCE.md (42KB) + COMPLETE_GRI1_REFERENCE.md (475KB)
- 저장: /Volumes/soulmaten/POTAL/hs_classification_rules/

### EU EBTI 수집 완료
- 269,730 rulings → 231,727 고유 product-HS 매핑 추출
- 7개 CSV (2004~2010), 96 HS chapters
- 저장: /Volumes/soulmaten/POTAL/regulations/eu_ebti/

### DB read-only 긴급 복구
- 원인: WDC v2 벌크 업로드 → product_hs_mappings 37.3M건 → DB 53GB → 디스크 초과
- WDC v2 = 카테고리 추정 매핑 (부정확) → 삭제 결정
- 36M건 배치 삭제 진행 (50만건씩) → 완료 후 VACUUM FULL + read-write 복구

### 12개 TLC 계산 영역 구조화 계획
- HS Code(GRI엔진) / Duty(DB) / AD/CVD(DB) / VAT(DB) / De Minimis(if문) / Special Tax(테이블) / Customs Fees(고정값) / RoO(FTA PSR+AI) / Export Controls(ECCN+AI) / Sanctions(퍼지매칭) / Currency(API) / Insurance(수식)
- 12개 중 9개 = 코드만, 3개만 AI 필요
```

---

=== 4. docs/NEXT_SESSION_START.md 업데이트 ===

파일: docs/NEXT_SESSION_START.md
헤더 날짜를 수정:
```
> 마지막 업데이트: 2026-03-17 22:00 KST (CW16 Cowork — GRI Agent Team 설계, 7개국 규칙 수집 완료, DB 복구 진행)
```

"2단계: 백그라운드 작업 확인" 섹션을 아래로 교체:

```markdown
2단계: 백그라운드 작업 확인
- KOR AGR 재임포트: ✅ 완료
- WDC 추출: ✅ 완료 (1,896/1,899 파트)
- WDC Phase 4 v2 매칭: ✅ 완료 (49,265,581건)
- WDC Phase 4 v2 업로드: ❌ 중단 — 36M건은 카테고리 추정 매핑(부정확) → 삭제 결정 → 삭제 진행 후 완료 확인 필요
- DB read-only: ⚠️ 36M건 삭제 + VACUUM FULL 후 복구 확인 필요
- GRI 참고자료 수집: ✅ 완료 (14개 파일, 2.1MB, /Volumes/soulmaten/POTAL/hs_classification_rules/)
- EU EBTI 수집: ✅ 완료 (269,730 rulings, 231,727 매핑)
- 7개국 추가 규칙: ✅ 완료 (US/EU/UK/KR/JP/AU/CA)
```

"우선순위 작업" 섹션을 추가/수정:

```markdown
## 🎯 다음 세션 우선순위

### P0 — 즉시 (DB 복구 + GRI 엔진)
1. **DB read-only 복구 확인** — 36M건 삭제 완료 + VACUUM FULL + read-write 확인 + www.potal.app 정상 동작 확인
2. **판례 → 대립 패턴 규칙화** — CBP CROSS 22만건 + EBTI 27만건을 챕터별로 정리
   - 각 패턴: 대립 후보 + 정답 + 근거 + 탈락이유 + 예외
   - 97 Chapter × 평균 10~20 패턴 = ~1,000~2,000 규칙
3. **GRI Agent Team 구축** — 11단계 코드 체인 + AI 최소 호출
4. **7 Country Agent 구축** — US/EU/UK/KR/JP/AU/CA 각각 전용 프롬프트 + 규칙 파일
5. **CBP 100건 벤치마크 테스트** — 이전 v10(38%) 대비 개선 확인, 목표 89%+

### P1 — 이번 주 (12개 TLC 구조화)
6. **12개 TLC 계산 영역 전체 구조화** — 각 영역의 "사람 프로세스" 역설계 → 코드화
7. **142개 기능 동일 접근** — 각 기능마다 실무자 프로세스 역설계 → 단계별 자동화

### P2 — Beta 출시 준비
8. **Beta 출시** — Pro 모델까지 개방, 핵심 12개 계산 완성 후
9. **파이프라인 확장** — 142개 기능 계속 추가

### ⭐ 핵심 전략 변화 (CW16 Cowork)
- **"시스템을 바꾸지 말고 사람을 대체하라"** — 관세사/세무사의 실무 프로세스를 그대로 자동화
- **"한 마디로 AI한테 시키지 말고, 공식을 찾아서 단계별 코드로 만들고, 판단 필요한 곳만 AI"**
- 이 원칙을 HS Code뿐 아니라 12개 TLC 전체 → 142개 기능 전체에 적용
- GRI Agent Team = 첫 번째 적용 사례, 성공하면 나머지에 동일 패턴 확장
```

---

=== 실행 방법 ===

위 내용을 4개 파일에 각각 적용해줘:
1. CLAUDE.md — 헤더 날짜 수정 + "핵심 수치" 수정 + "CW16 Cowork 세션 성과" 섹션 추가 + product_hs_mappings 행 수정
2. session-context.md — 헤더 날짜 수정 + "CW16 Cowork 세션" 내용 추가
3. docs/CHANGELOG.md — 최상단에 새 날짜 섹션 추가
4. docs/NEXT_SESSION_START.md — 헤더 날짜 수정 + 백그라운드 작업 + 우선순위 교체

각 파일 수정 후 변경 줄 수 출력해줘. git add + commit은 하지 마 (Mac 터미널에서 push해야 하니까).
