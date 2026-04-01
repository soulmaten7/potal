# POTAL MCP 서버 설정 가이드

Claude Desktop에서 POTAL의 관세 계산 기능을 직접 사용할 수 있게 해주는 MCP 서버입니다.

## MCP란?

MCP (Model Context Protocol)는 Claude가 외부 도구/API를 직접 호출할 수 있게 해주는 프로토콜입니다. 이 서버를 설치하면 Claude에게 "이 물건 중국에서 한국으로 보내면 총 얼마야?" 라고 물어보면 POTAL API를 직접 호출해서 정확한 관세+세금을 계산해줍니다.

## 설치 방법

### 사전 요구사항
- Node.js 18+ 설치 ([nodejs.org](https://nodejs.org))
- Claude Desktop 앱 설치 ([claude.ai/download](https://claude.ai/download))

### 1단계: POTAL API 키 준비

API 키: `YOUR_POTAL_API_KEY`

### 2단계: Claude Desktop 설정 파일 열기

**Mac:**
```bash
open ~/Library/Application\ Support/Claude/claude_desktop_config.json
```
파일이 없으면 새로 만드세요.

**Windows:**
```
%APPDATA%\Claude\claude_desktop_config.json
```

### 3단계: 설정 추가

#### 방법 A: npx로 바로 실행 (가장 간단)

```json
{
  "mcpServers": {
    "potal": {
      "command": "npx",
      "args": ["-y", "@potal/mcp-server"],
      "env": {
        "POTAL_API_KEY": "YOUR_POTAL_API_KEY"
      }
    }
  }
}
```

#### 방법 B: 로컬 소스에서 실행

```json
{
  "mcpServers": {
    "potal": {
      "command": "node",
      "args": ["/Users/사용자이름/potal/mcp-server/build/index.js"],
      "env": {
        "POTAL_API_KEY": "YOUR_POTAL_API_KEY"
      }
    }
  }
}
```

### 4단계: Claude Desktop 재시작

설정을 저장한 후 Claude Desktop을 완전히 종료하고 다시 실행하세요.

### 5단계: 테스트

Claude에게 다음과 같이 물어보세요:

```
중국에서 50달러짜리 티셔츠를 한국으로 보내면 관세 포함 총 얼마야?
```

```
미국에서 $200짜리 노트북을 일본으로 보내면 총 비용이 얼마야?
```

```
이탈리아에서 영국으로 신발을 보내면 관세가 얼마나 부과돼?
```

## 제공되는 도구

### calculate_landed_cost
국제 배송 시 총 착지 비용을 계산합니다.

필수 파라미터:
- `price`: 상품 가격 (USD)
- `origin`: 출발 국가 코드 (CN, US, DE, JP, KR 등)
- `destinationCountry`: 도착 국가 코드

선택 파라미터:
- `shippingPrice`: 배송비 (USD)
- `zipcode`: 미국 도착 시 우편번호 (주 판매세 계산용)
- `productName`: 상품명 (HS Code 자동 분류용)
- `productCategory`: 카테고리 (electronics, apparel 등)
- `hsCode`: HS 코드 (알고 있는 경우)

### list_supported_countries
지원되는 240개국의 VAT/GST 세율, 관세율, 면세 기준 정보를 조회합니다.

## 문제 해결

### "POTAL API key is not configured" 오류
→ `claude_desktop_config.json`에서 `POTAL_API_KEY` 환경변수가 올바르게 설정되어 있는지 확인

### Claude에서 POTAL 도구가 보이지 않음
→ Claude Desktop을 완전히 종료 후 재시작. 설정 파일의 JSON 문법이 올바른지 확인

### "Network error" 오류
→ 인터넷 연결 확인. POTAL 서버 상태 확인: https://www.potal.app
