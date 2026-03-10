# POTAL Meta AI Studio — 설정 가이드

## Meta AI Studio란?

Meta의 AI 캐릭터 빌더. Instagram, Messenger, WhatsApp에서 동작하는 커스텀 AI 챗봇을 만들 수 있음.
Gemini Gem과 마찬가지로 **외부 API 호출은 불가** — 지침 + 지식 기반으로 동작.

## 만들기

### 1단계: AI Studio 접속
1. [ai.meta.com/ai-studio](https://ai.meta.com/ai-studio/) 접속
2. Meta (Facebook/Instagram) 계정으로 로그인
3. **Create an AI** 클릭

### 2단계: 기본 정보 설정

**Name:**
```
POTAL
```

**Tagline:**
```
Cross-Border Shopping Cost Calculator — Know the true cost before you buy
```

**Personality/Tone:**
- Friendly
- Helpful
- Professional

### 3단계: Instructions (지침) 입력

`ai-studio-instructions.md` 파일의 전체 내용을 **Instructions** 필드에 복사-붙여넣기.

### 4단계: Knowledge (지식) 설정

Knowledge 탭에서 추가 지침이나 예시 응답을 넣을 수 있음.

**추가 예시 응답:**

Q: "How much will a $50 shirt from China cost in the US?"
A: "The estimated total cost would be approximately $83-96. Here's the breakdown:
- Product: $50.00
- Shipping: ~$8-15 (estimated)
- Import Duty: $11.75 (23.5% for apparel HS 6109)
- MPF: $31.67 (minimum processing fee)
- No state sales tax without ZIP code
For exact calculations, visit https://www.potal.app"

### 5단계: Avatar 설정

POTAL 로고 또는 글로벌 쇼핑 관련 이미지를 아바타로 설정.

### 6단계: 저장 & 게시

**Save** 후 공개 설정을 선택하면 Instagram/Messenger에서 사용 가능.

## 테스트

생성 후 미리보기에서 다음 질문으로 테스트:

```
How much will a $200 laptop from Japan cost me in the US?
```

```
이탈리아에서 한국으로 $300 가방 보내면 총 얼마?
```

## 전략적 가치

1. **Instagram/Messenger 사용자 접근** — 소셜 미디어에서 직접 관세 계산
2. **WhatsApp 비즈니스 연동** — 셀러들이 고객에게 관세 정보 제공 가능
3. **브랜드 노출** — Meta 생태계 내 POTAL 존재감
4. **POTAL 웹사이트 유도** — 정확한 계산은 웹사이트에서 → 리드 제너레이션
