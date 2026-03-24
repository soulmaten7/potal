# POTAL 데모 영상 촬영 가이드라인
# 2026-03-24 KST

---

## 영상 스펙

| 항목 | 권장값 |
|------|--------|
| 길이 | **30초** (SNS/Reddit) / **60초** (Product Hunt/LinkedIn) |
| 해상도 | 1920×1080 (1080p) |
| 포맷 | MP4 (H.264) |
| 자막 | 필수 (85% 무음 시청) |
| 음악 | 배경음악 가볍게 (저작권 프리) |
| 썸네일 | 별도 제작 (텍스트 포함) |

---

## 촬영 전 준비

### 브라우저 세팅
- [ ] Chrome 사용 (시크릿 모드 또는 깨끗한 프로필)
- [ ] 불필요한 탭 전부 닫기
- [ ] 북마크바 숨기기 (Cmd+Shift+B)
- [ ] 확장 프로그램 아이콘 정리
- [ ] 다크모드 권장

### 터미널 세팅
- [ ] 폰트 크기 크게 (16pt 이상)
- [ ] 터미널 배경 어두운 색
- [ ] 프롬프트 깔끔하게

### POTAL 세팅
- [ ] https://www.potal.app 로그인
- [ ] API 키 미리 발급
- [ ] 데모용 curl 명령어 메모장에 준비

---

## 30초 버전 스크립트 (SNS/Reddit용)

```
[0-5초] 문제 제시
화면: 검은 배경 + 흰 텍스트
"Shipping internationally? Customs costs are unpredictable."

[5-15초] API 호출 데모
화면: 터미널
행동: curl 명령어 붙여넣기 → Enter → JSON 응답 표시
보여줄 것:
  - productName: "cotton t-shirt"
  - origin: CN → destination: US
  - 응답: duty rate, totalLandedCost 하이라이트

[15-22초] 국가 비교
화면: 터미널
행동: 같은 상품 → US/UK/DE/JP 비교
나라마다 다른 관세율 + FTA 감세 표시

[22-28초] 핵심 수치
텍스트 오버레이:
  "240 countries · 113M+ tariff records · Free: 200 calls/month"

[28-30초] CTA
화면: potal.app
텍스트: "Try it free → potal.app"
```

---

## 60초 버전 스크립트 (Product Hunt / LinkedIn용)

```
[0-7초] Hook
텍스트 애니메이션:
"Cross-border ecommerce is $6T+.
But calculating import costs? Still broken."
비교: Avalara $1,500/mo | Zonos $2/order | Free tools = 5 countries

[7-20초] 해결책 + 첫 API 호출
화면: 터미널
자막: "I built POTAL — landed cost API for 240 countries."
행동: curl → JSON 응답 (duty, vat, totalLandedCost 하이라이트)

[20-30초] 국가 비교 + FTA
화면: /compare 엔드포인트로 4개국 동시 비교
자막: "63 Free Trade Agreements — auto-detected"

[30-40초] 홈페이지 스크롤
화면: potal.app 천천히 스크롤
보여줄 것:
  - Hero (240 Countries, 113M+ Tariff Records)
  - 가격표 (Free→$20→$80→$300)
  - API 문서 페이지 잠깐

[40-50초] MCP 서버 데모
화면: Claude Desktop 또는 터미널
행동: npx potal-mcp-server → AI 에이전트가 관세 계산
자막: "Works with AI agents — Claude, ChatGPT, Gemini"

[50-57초] 차별점 요약
비교 표 오버레이:
| | POTAL | Avalara | Zonos |
| Price | Free (200/mo) | $1,500+/mo | $2/order |
| Countries | 240 | 190+ | 200+ |
| HS Accuracy | 100% (9-field) | ~80% | ~44% |

[57-60초] CTA
"Free. No credit card. → potal.app"
```

---

## 텍스트 오버레이 (자막) 스크립트

```
[0:00] "Shipping a $25 t-shirt from China to the US..."
[0:05] "POTAL calculates the exact landed cost"
[0:10] (curl 실행 장면)
[0:15] "Duties: $4.88 | Fees: $3.77 | Total: $42.15"
[0:20] "HS Code classified with 100% accuracy"
[0:25] "Works for 240 countries"
[0:30] (3개국 비교)
[0:35] "Free tier: 200 API calls/month"
[0:40] "potal.app"
```

---

## 촬영 팁

1. **미리 리허설** — API 호출 잘 되는지, 응답 시간 빠른지 확인
2. **느린 응답 대비** — 2초 이상 걸리면 편집에서 대기 시간 잘라내기
3. **마우스 커서** — 보여줄 곳에만 이동, 불필요한 움직임 금지
4. **실수하면 재촬영** — 편집보다 빠름
5. **여러 테이크** — 장면당 3-5번 녹화, 나중에 제일 좋은 거 선택

---

## 편집 도구 (무료)

| 도구 | 특징 | 추천 용도 |
|------|------|----------|
| **CapCut** (capcut.com) | 자막 자동 생성, 템플릿 다양 | 가장 쉬움, 자막 작업 최적 |
| **Canva Video** | 텍스트 오버레이 쉬움 | 간단한 편집 |
| **iMovie** | Mac 기본 | 기본 자르기+음악 |
| **DaVinci Resolve** | 전문가급 무료 | 고급 편집 |

**자막 추가:** CapCut 자동 자막 → 수동 교정 (가장 빠름)

**배경 음악 (저작권 프리):**
- YouTube Audio Library (studio.youtube.com)
- Pixabay Music (pixabay.com/music)
- "Corporate" 또는 "Technology" 검색

---

## 채널별 영상 활용

| 채널 | 길이 | 포맷 | 비고 |
|------|------|------|------|
| Product Hunt | 60초 | 갤러리 첫 번째 | 필수. 썸네일 별도 제작 |
| LinkedIn | 60초 | 네이티브 업로드 | 링크보다 직접 업로드가 노출 10배 |
| Reddit | 30초 | 직접 업로드 | r/SideProject 영상 포스트 트렌드 |
| X/Twitter | 30초 | 네이티브 업로드 | 자막 필수 |
| DEV.to | 60초 | YouTube 임베드 | 블로그 글에 삽입 |
| Shopify Community | 30초 | YouTube 링크 | 앱 승인 후 |

---

## 촬영 전 API 테스트 (복붙용)

```bash
# 테스트 1: US
curl -s https://www.potal.app/api/v1/calculate \
  -H "X-API-Key: YOUR_KEY" \
  -H "Content-Type: application/json" \
  -d '{"productName":"cotton t-shirt","material":"cotton","category":"apparel","declaredValue":25,"originCountry":"CN","destinationCountry":"US","shippingCost":8.50}' | python3 -m json.tool

# 테스트 2: DE (독일)
curl -s https://www.potal.app/api/v1/calculate \
  -H "X-API-Key: YOUR_KEY" \
  -H "Content-Type: application/json" \
  -d '{"productName":"cotton t-shirt","material":"cotton","category":"apparel","declaredValue":25,"originCountry":"CN","destinationCountry":"DE","shippingCost":8.50}' | python3 -m json.tool

# 테스트 3: JP (일본)
curl -s https://www.potal.app/api/v1/calculate \
  -H "X-API-Key: YOUR_KEY" \
  -H "Content-Type: application/json" \
  -d '{"productName":"cotton t-shirt","material":"cotton","category":"apparel","declaredValue":25,"originCountry":"CN","destinationCountry":"JP","shippingCost":8.50}' | python3 -m json.tool

# 테스트 4: 국가 비교
curl -s https://www.potal.app/api/v1/calculate/compare \
  -H "X-API-Key: YOUR_KEY" \
  -H "Content-Type: application/json" \
  -d '{"productName":"cotton t-shirt","origin":"CN","destinationCountries":["US","GB","DE","JP"],"price":25}' | python3 -m json.tool

# 테스트 5: HS Code 분류
curl -s https://www.potal.app/api/v1/classify \
  -H "X-API-Key: YOUR_KEY" \
  -H "Content-Type: application/json" \
  -d '{"productName":"cotton t-shirt","material":"cotton","category":"apparel"}' | python3 -m json.tool
```

⚠️ YOUR_KEY → 실제 API 키로 교체
⚠️ 응답이 예상과 다르면 촬영 전 알려주세요

---

## 촬영 체크리스트

- [ ] 브라우저 정리 완료
- [ ] API 키 준비 (영상에서는 일부 모자이크)
- [ ] curl 명령어 5개 메모장에 준비
- [ ] 화면 녹화 도구 테스트 (1분 테스트 녹화)
- [ ] API 테스트 5개 전부 정상 응답 확인
- [ ] 30초 버전 촬영 (3-5 테이크)
- [ ] 60초 버전 촬영 (3-5 테이크)
- [ ] CapCut에서 자막 추가
- [ ] 배경 음악 추가
- [ ] 최종 검토 후 내보내기 (MP4)
