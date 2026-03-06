# POTAL Gemini Gem — 설정 가이드

## Gem 만들기

### 1단계: Gemini 접속
1. [gemini.google.com](https://gemini.google.com) 접속
2. 왼쪽 메뉴에서 **Gems** 클릭
3. **새 Gem** (New Gem) 클릭

### 2단계: 기본 정보 입력

**이름:**
```
POTAL — Cross-Border Shopping Cost Calculator
```

**설명 (Description):**
```
Calculate the true total cost of buying products from other countries. Import duties, taxes, VAT/GST, and customs fees for 181 countries — instantly.
```

### 3단계: 지침 (Instructions) 입력

`gem-instructions.md` 파일의 **전체 내용**을 복사해서 지침 필드에 붙여넣기.

### 4단계: 파일 업로드

**Add files** 버튼 클릭 → `country-duty-reference.csv` 파일 업로드.

이 파일은 40개 주요 국가의 VAT/GST 세율, 평균 관세율, 면세 기준(de minimis) 데이터를 담고 있어서 Gem이 API 없이도 꽤 정확한 계산을 할 수 있게 해줍니다.

### 5단계: 저장

**Save** 버튼 클릭.

## 테스트

Gem 생성 후 다음 질문으로 테스트:

```
How much will a $50 T-shirt from China cost me in the US including all duties and taxes?
```

```
Compare the total import cost of a $200 laptop: China to Japan vs China to Germany
```

```
이탈리아에서 한국으로 $300 가방을 보내면 총 얼마야?
```

## 제한사항

- Gemini Gems는 외부 API 호출이 불가능합니다
- 계산은 업로드된 참고 데이터 기반 **추정치**입니다
- 정확한 실시간 계산은 https://potal-x1vl.vercel.app 에서 가능합니다
- Gem은 이 데이터를 바탕으로 상당히 정확한 추정을 제공하지만, 특정 HS Code별 세부 세율까지는 커버하지 못합니다

## 전략적 가치

API 호출은 안 되지만 Gemini Gem의 가치:
1. **Google 생태계 내 브랜드 존재감** — Google Shopping과의 시너지 가능성
2. **트래픽 축적** — Gem 사용 데이터가 쌓이면 Google 파트너십 기회
3. **정확한 계산이 필요한 사용자** → POTAL 웹사이트로 유도 (리드 제너레이션)
