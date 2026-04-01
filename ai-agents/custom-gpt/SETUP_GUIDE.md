# Custom GPT 설정 가이드

## 1단계: ChatGPT에서 GPT 생성 페이지 열기

1. https://chatgpt.com 접속
2. 왼쪽 사이드바 → **Explore GPTs** 클릭
3. 오른쪽 상단 → **+ Create** 클릭

## 2단계: Configure 탭에서 설정

### Name (이름):
```
POTAL — Cross-Border Shopping Calculator
```

### Description (설명):
```
Calculate the true total cost of buying products from other countries. Get instant breakdowns of import duties, taxes, VAT/GST, and customs fees for 240 countries. Know exactly what you'll pay before you buy.
```

### Instructions (지침):
`gpt-instructions.md` 파일의 내용을 전체 복사해서 붙여넣기

### Conversation starters (대화 시작 예시):
```
How much will a $50 T-shirt from China cost me in the US with shipping?
```
```
Compare the total cost of buying a laptop from Japan vs Germany, shipped to Korea
```
```
What import duties will I pay on shoes from Italy to the UK?
```
```
이 가방을 중국에서 한국으로 보내면 관세 포함 총 얼마야?
```

### Capabilities:
- ❌ Web Browsing (체크 해제)
- ❌ DALL·E Image Generation (체크 해제)
- ❌ Code Interpreter (체크 해제)

## 3단계: Actions 설정 (가장 중요!)

1. **Create new action** 클릭
2. **Authentication** 섹션:
   - Type: **API Key**
   - API Key: `YOUR_POTAL_API_KEY`
   - Auth Type: **Custom**
   - Custom Header Name: `X-API-Key`
3. **Schema** 섹션:
   - `openapi-gpt-actions.json` 파일의 내용을 전체 복사해서 붙여넣기
4. **Privacy policy URL**:
   ```
   https://www.potal.app/privacy
   ```

## 4단계: 테스트

설정 완료 후 Preview에서 다음 테스트:

### 테스트 1: 기본 계산
```
How much will a $100 jacket from China cost me in New York (10001)?
```
→ 예상: 총 $130~140 범위 (관세 + 세금 포함)

### 테스트 2: 다국가
```
Compare buying a $50 shirt from China vs Japan, shipped to Germany
```

### 테스트 3: 한국어
```
중국에서 50달러짜리 티셔츠를 한국으로 보내면 총 얼마야?
```

### 테스트 4: 면세 확인
```
Will I pay any customs on a $30 item from Canada to the US?
```
→ 예상: $800 de minimis 이하이므로 면세

## 5단계: GPT Store에 공개

1. 테스트 통과 후 → **Save** → **Everyone** 선택
2. Category: **Productivity** 또는 **Other**
3. GPT Store에 자동 등록됨 (검수 후)

## 파일 위치
- OpenAPI 스펙: `custom-gpt/openapi-gpt-actions.json`
- GPT Instructions: `custom-gpt/gpt-instructions.md`
- 이 가이드: `custom-gpt/SETUP_GUIDE.md`
