# HOMEPAGE_I18N.md — 홈페이지 다국어 번역 명령어
# 실행: 터미널 1 또는 2에서 실행
# 예상 소요: 30~40분
# 마지막 업데이트: 2026-04-05

---

## 목적
홈페이지(app/page.tsx)에 하드코딩된 영어 문자열 60+개를 i18n 시스템(useI18n + t())으로 교체.
기존 51개 언어 파일에 새 키를 추가하되, **1차로 7개 핵심 언어**만 번역.

---

## ⚠️ 절대 규칙: 번역하지 않는 용어 (DO NOT TRANSLATE LIST)

아래 용어들은 **국제 무역/관세 표준 용어**로, 모든 언어에서 **영어 원문 그대로** 유지.
구글번역이나 기계번역에 넣으면 의미가 왜곡되므로 반드시 영어 유지.

### 관세/무역 용어
- HS Code / HTS (Harmonized System / Harmonized Tariff Schedule)
- Total Landed Cost (TLC)
- De Minimis
- FOB (Free on Board)
- CIF (Cost, Insurance, Freight)
- DDP (Delivered Duty Paid)
- FTA (Free Trade Agreement)
- MFN (Most Favoured Nation)
- AD/CVD (Anti-Dumping / Countervailing Duty)
- Section 301 / Section 232
- TARIC (EU tariff schedule)
- HTS 10-digit / TARIC 10-digit

### 기관/데이터베이스명
- WTO, USITC, EU TARIC, UK HMRC, CBSA, KCS, JP Customs
- OFAC SDN (Office of Foreign Assets Control — Specially Designated Nationals)
- BIS Entity List (Bureau of Industry and Security)
- MacMap

### 기술 용어
- API, REST API, MCP (Model Context Protocol)
- Widget, Shadow DOM
- API Endpoints
- API Key

### 브랜드/제품명
- POTAL
- Zonos, Avalara, Global-e, Duty Calculator, SimplyDuty 등 경쟁사명

### 숫자+단위 조합
- 140 Features, 240 Countries, 155+ API Endpoints, $0
- 99.9% uptime, 21,300+ entries, 119,700+ cases
- $50,000/year, 100K calls/month
- 48%, 25% (통계 수치)

---

## 번역 대상 언어 (1차: 7개)

| 코드 | 언어 | 파일 |
|------|------|------|
| en | English | en.ts (원본 — 새 키 추가) |
| ko | 한국어 | ko.ts |
| ja | 日本語 | ja.ts |
| zh | 中文 | zh.ts |
| es | Español | es.ts |
| de | Deutsch | de.ts |
| fr | Français | fr.ts |

> 나머지 44개 언어는 2차에서 처리. 일단 en fallback으로 동작.

---

## 작업 순서

### Step 1: en.ts에 새 번역 키 추가

아래 키들을 `en.ts`에 추가. 기존 108개 키 뒤에 이어서 넣기.

```typescript
// ═══════════════ Homepage — Hero ═══════════════
'home.hero.badge': 'ALL FEATURES FREE — FOREVER',
'home.hero.title.part1': '140 Features.',
'home.hero.title.part2': 'All Free.',
'home.hero.title.part3': 'Forever.',
'home.hero.description': 'Top 10 competitors combined offer fewer features — and charge up to $50,000/year. POTAL gives you everything. For $0.',
'home.hero.ctaPrimary': 'Start Free Now',
'home.hero.ctaSecondary': 'API Docs',
'home.hero.stat.features': 'Features',
'home.hero.stat.countries': 'Countries',
'home.hero.stat.endpoints': 'API Endpoints',
'home.hero.stat.cost': 'Cost — Forever',
'home.hero.trustedBy': 'Built on official data from',

// ═══════════════ Homepage — Features CTA Banner ═══════════════
'home.featuresBanner.count': '140 FEATURES',
'home.featuresBanner.title': 'Try every feature with a live demo',
'home.featuresBanner.description': 'No sign-up required. All 140 features free to try.',
'home.featuresBanner.cta': 'Explore 140 Features →',

// ═══════════════ Homepage — Competitor Comparison ═══════════════
'home.competitor.title': 'More features than all competitors combined',
'home.competitor.description': 'We analyzed every feature from the top 10 cross-border commerce platforms. POTAL covers them all — and more.',
'home.competitor.source': 'Source: Feature-by-feature audit of each competitor\'s public documentation and product pages.',

// ═══════════════ Homepage — Cost Comparison ═══════════════
'home.cost.title': 'They charge enterprise prices. We don\'t charge at all.',
'home.cost.description': 'Every competitor below charges per-transaction fees, setup costs, or enterprise minimums. POTAL is free. No asterisks.',
'home.cost.table.provider': 'Provider',
'home.cost.table.features': 'Features',
'home.cost.table.annualCost': 'Annual Cost',
'home.cost.table.perTransaction': 'Per-Transaction',
'home.cost.table.free': 'FREE',
'home.cost.table.none': 'None',
'home.cost.table.yes': 'Yes',
'home.cost.conclusion': 'They charge enterprise prices for fewer features. We give you more — for free.',

// ═══════════════ Homepage — How It Works ═══════════════
'home.howItWorks.title': 'How it works',
'home.howItWorks.subtitle': 'Three steps to show your customers the true cost of cross-border purchases',
'home.howItWorks.step1.title': 'Get your API key',
'home.howItWorks.step1.description': 'Sign up for free and get your publishable key in seconds. No credit card required.',
'home.howItWorks.step2.title': 'Embed the widget',
'home.howItWorks.step2.description': 'Add one script tag to your product page. The widget auto-detects your API endpoint.',
'home.howItWorks.step3.title': 'Buyers see true cost',
'home.howItWorks.step3.description': 'Customers select their country and instantly see duties, taxes, and total landed cost.',

// ═══════════════ Homepage — Features Grid ═══════════════
'home.features.title': 'Everything you need for global commerce',
'home.features.subtitle': 'One API that handles the complexity of international trade regulations.',
'home.features.seeAll': 'See all 140 features →',
'home.features.countries.title': '240 Countries',
'home.features.countries.desc': 'Complete duty rates, VAT/GST, de minimis thresholds, and FTA agreements for 240 countries worldwide.',
'home.features.hsCode.title': '9-Field HS Classification',
'home.features.hsCode.desc': 'Input 9 standardized fields — product name, material, category, and more — validated against WCO standards. Get 100% accurate HS Codes.',
'home.features.tax.title': 'Sub-national Tax',
'home.features.tax.desc': 'State-level tax for US (50 states), Canada (13 provinces — GST/HST/PST), and Brazil (27 states — ICMS).',
'home.features.fta.title': 'FTA Detection',
'home.features.fta.desc': 'Automatically detects Free Trade Agreements between origin and destination countries for reduced duty rates.',
'home.features.deMinimis.title': 'De Minimis Rules',
'home.features.deMinimis.desc': 'Knows every country\'s duty-free threshold. Orders under the limit? Zero import duty, automatically applied.',
'home.features.widget.title': 'Embeddable Widget',
'home.features.widget.desc': 'Drop-in JavaScript widget with Shadow DOM isolation. Works on any site with zero CSS conflicts.',
'home.features.sanctions.title': 'Sanctions & Export Controls',
'home.features.sanctions.desc': 'Screen against OFAC SDN, BIS Entity List, and 19 sanctions sources. 21,300+ entries with fuzzy matching.',
'home.features.remedies.title': 'Trade Remedies',
'home.features.remedies.desc': 'Anti-dumping duties, countervailing duties, and safeguard measures. 119,700+ cases across 36 countries.',
'home.features.mcp.title': 'AI Agent Ready (MCP)',
'home.features.mcp.desc': 'Official MCP server on the registry. Any AI agent can call POTAL via one command.',

// ═══════════════ Homepage — API Response ═══════════════
'home.apiResponse.title': 'One request, complete breakdown',
'home.apiResponse.description': 'Every calculation returns a detailed breakdown including product price, import duty, taxes, shipping, HS code, FTA status, and de minimis eligibility.',
'home.apiResponse.check1': 'Total landed cost in one number',
'home.apiResponse.check2': 'Line-by-line cost breakdown',
'home.apiResponse.check3': 'HS code with duty rate',
'home.apiResponse.check4': 'State-level tax for US, CA, BR',
'home.apiResponse.check5': 'FTA & de minimis detection',

// ═══════════════ Homepage — Widget Demo ═══════════════
'home.widgetDemo.title': 'Your customers see this',
'home.widgetDemo.description': 'The POTAL widget embeds directly into your product page. Select a country below to see it in action.',
'home.widgetDemo.cta': 'Try Widget Playground',

// ═══════════════ Homepage — Before vs After ═══════════════
'home.before.label': 'Without POTAL',
'home.before.title': 'Customer sees $45 at checkout...',
'home.before.item1': 'Unexpected $18 customs charge at delivery',
'home.before.item2': 'Customer refuses package → return shipping costs',
'home.before.item3': 'Negative review: "Hidden fees!"',
'home.before.item4': 'Lost customer lifetime value',
'home.before.stat': 'Cart abandonment rate: up to 48%',
'home.after.label': 'With POTAL',
'home.after.title': 'Customer sees $63 total landed cost',
'home.after.item1': 'Duties, taxes & fees shown before checkout',
'home.after.item2': 'No surprise charges at delivery',
'home.after.item3': '5-star review: "Exactly what I expected to pay"',
'home.after.item4': 'Repeat customer → higher LTV',
'home.after.stat': 'Conversion rate increase: up to 25%',

// ═══════════════ Homepage — Final CTA ═══════════════
'home.cta.title': 'Stop paying for duty calculation.',
'home.cta.description': '140 features. 240 countries. Free forever. No credit card, no trial, no limits.',
'home.cta.primary': 'Start Free Now',
'home.cta.secondary': 'See All Features',
```

**총 새 키: 73개** → 기존 108개 + 73개 = 181개

---

### Step 2: ko.ts 한국어 번역 추가

번역 규칙:
- trade 용어(HS Code, FTA, De Minimis, OFAC SDN 등)는 **영어 그대로**
- 숫자+단위($0, 140, 240 등)는 **그대로**
- 문장 안에서 자연스럽게 섞어 쓰기 (예: "240개국의 관세율, VAT/GST, De Minimis 기준, FTA 협정")

```typescript
// Homepage — Hero
'home.hero.badge': '모든 기능 무료 — 영원히',
'home.hero.title.part1': '140개 기능.',
'home.hero.title.part2': '전부 무료.',
'home.hero.title.part3': '영원히.',
'home.hero.description': '상위 10개 경쟁사를 합쳐도 기능이 더 적고, 연간 $50,000까지 청구합니다. POTAL은 모든 것을 제공합니다. $0에.',
'home.hero.ctaPrimary': '무료로 시작하기',
'home.hero.ctaSecondary': 'API 문서',
'home.hero.stat.features': '기능',
'home.hero.stat.countries': '국가',
'home.hero.stat.endpoints': 'API Endpoints',
'home.hero.stat.cost': '비용 — 영원히',
'home.hero.trustedBy': '공식 데이터 기반',

// Homepage — Features CTA Banner
'home.featuresBanner.count': '140 기능',
'home.featuresBanner.title': '모든 기능을 라이브 데모로 체험하세요',
'home.featuresBanner.description': '가입 불필요. 140개 기능 전부 무료 체험.',
'home.featuresBanner.cta': '140개 기능 탐색 →',

// Homepage — Competitor Comparison
'home.competitor.title': '모든 경쟁사를 합친 것보다 많은 기능',
'home.competitor.description': '상위 10개 국제 전자상거래 플랫폼의 모든 기능을 분석했습니다. POTAL은 그 모든 것을 포함하고, 더 많은 기능을 제공합니다.',
'home.competitor.source': '출처: 각 경쟁사의 공개 문서 및 제품 페이지의 기능별 감사.',

// Homepage — Cost Comparison
'home.cost.title': '그들은 기업 가격을 청구합니다. 우리는 아예 청구하지 않습니다.',
'home.cost.description': '아래 모든 경쟁사는 건당 수수료, 설치 비용 또는 기업 최소 요금을 부과합니다. POTAL은 무료입니다. 조건 없음.',
'home.cost.table.provider': '제공업체',
'home.cost.table.features': '기능',
'home.cost.table.annualCost': '연간 비용',
'home.cost.table.perTransaction': '건당 수수료',
'home.cost.table.free': '무료',
'home.cost.table.none': '없음',
'home.cost.table.yes': '있음',
'home.cost.conclusion': '그들은 더 적은 기능에 기업 가격을 청구합니다. 우리는 더 많은 기능을 무료로 제공합니다.',

// Homepage — How It Works
'home.howItWorks.title': '사용 방법',
'home.howItWorks.subtitle': '고객에게 국제 구매의 실제 비용을 보여주는 세 단계',
'home.howItWorks.step1.title': 'API Key 받기',
'home.howItWorks.step1.description': '무료로 가입하고 몇 초 만에 API Key를 받으세요. 신용카드 불필요.',
'home.howItWorks.step2.title': 'Widget 삽입',
'home.howItWorks.step2.description': '제품 페이지에 script 태그 하나만 추가하세요. Widget이 API endpoint를 자동 감지합니다.',
'home.howItWorks.step3.title': '구매자가 실제 비용 확인',
'home.howItWorks.step3.description': '고객이 국가를 선택하면 관세, 세금, Total Landed Cost를 즉시 확인합니다.',

// Homepage — Features Grid
'home.features.title': '글로벌 커머스에 필요한 모든 것',
'home.features.subtitle': '국제 무역 규정의 복잡성을 처리하는 하나의 API.',
'home.features.seeAll': '140개 전체 기능 보기 →',
'home.features.countries.title': '240개 국가',
'home.features.countries.desc': '240개국의 관세율, VAT/GST, De Minimis 기준, FTA 협정을 완벽하게 지원합니다.',
'home.features.hsCode.title': '9-Field HS Classification',
'home.features.hsCode.desc': '제품명, 소재, 카테고리 등 9개 표준 필드를 입력하면 WCO 기준으로 검증된 100% 정확한 HS Code를 제공합니다.',
'home.features.tax.title': '지방세 (Sub-national Tax)',
'home.features.tax.desc': '미국 (50개 주), 캐나다 (13개 주 — GST/HST/PST), 브라질 (27개 주 — ICMS)의 주 단위 세금.',
'home.features.fta.title': 'FTA 감지',
'home.features.fta.desc': '출발국과 도착국 간 FTA (Free Trade Agreement)를 자동 감지하여 감면된 관세율을 적용합니다.',
'home.features.deMinimis.title': 'De Minimis 규칙',
'home.features.deMinimis.desc': '모든 국가의 면세 기준을 파악합니다. 기준 미만 주문은 수입 관세 0원, 자동 적용.',
'home.features.widget.title': '임베드 가능 Widget',
'home.features.widget.desc': 'Shadow DOM 격리를 갖춘 드롭인 JavaScript Widget. 모든 사이트에서 CSS 충돌 없이 작동.',
'home.features.sanctions.title': '제재 및 수출 규제',
'home.features.sanctions.desc': 'OFAC SDN, BIS Entity List 등 19개 제재 소스를 스크리닝. 21,300+ 항목, 퍼지 매칭.',
'home.features.remedies.title': 'Trade Remedies',
'home.features.remedies.desc': 'Anti-dumping, Countervailing Duties, Safeguard 조치. 36개국 119,700+ 건.',
'home.features.mcp.title': 'AI Agent 지원 (MCP)',
'home.features.mcp.desc': '공식 MCP 서버가 레지스트리에 등록되어 있습니다. 모든 AI 에이전트가 한 줄 명령으로 POTAL을 호출할 수 있습니다.',

// Homepage — API Response
'home.apiResponse.title': '한 번의 요청으로 완전한 내역',
'home.apiResponse.description': '모든 계산은 제품 가격, 수입 관세, 세금, 배송료, HS Code, FTA 상태, De Minimis 적격 여부를 포함한 상세 내역을 반환합니다.',
'home.apiResponse.check1': 'Total Landed Cost를 하나의 숫자로',
'home.apiResponse.check2': '항목별 비용 내역',
'home.apiResponse.check3': 'HS Code + 관세율',
'home.apiResponse.check4': 'US, CA, BR 주 단위 세금',
'home.apiResponse.check5': 'FTA & De Minimis 감지',

// Homepage — Widget Demo
'home.widgetDemo.title': '고객이 보는 화면',
'home.widgetDemo.description': 'POTAL Widget이 제품 페이지에 직접 임베드됩니다. 아래에서 국가를 선택해 직접 확인하세요.',
'home.widgetDemo.cta': 'Widget Playground 체험',

// Homepage — Before vs After
'home.before.label': 'POTAL 없이',
'home.before.title': '고객이 결제 시 $45만 확인...',
'home.before.item1': '배송 시 예상치 못한 $18 통관 비용',
'home.before.item2': '고객이 수취 거부 → 반품 배송 비용 발생',
'home.before.item3': '부정적 리뷰: "숨겨진 수수료!"',
'home.before.item4': '고객 평생 가치 손실',
'home.before.stat': '장바구니 이탈률: 최대 48%',
'home.after.label': 'POTAL 사용',
'home.after.title': '고객이 $63 Total Landed Cost 확인',
'home.after.item1': '결제 전 관세, 세금, 수수료 표시',
'home.after.item2': '배송 시 추가 비용 없음',
'home.after.item3': '5성 리뷰: "예상한 금액 그대로!"',
'home.after.item4': '재구매 고객 → 높은 LTV',
'home.after.stat': '전환율 증가: 최대 25%',

// Homepage — Final CTA
'home.cta.title': '관세 계산에 돈 쓰지 마세요.',
'home.cta.description': '140개 기능. 240개 국가. 영원히 무료. 신용카드 없이, 체험판 없이, 제한 없이.',
'home.cta.primary': '무료로 시작하기',
'home.cta.secondary': '전체 기능 보기',
```

---

### Step 3: ja.ts 일본어 번역 추가

```typescript
// Homepage — Hero
'home.hero.badge': '全機能無料 — 永久に',
'home.hero.title.part1': '140の機能。',
'home.hero.title.part2': '全て無料。',
'home.hero.title.part3': '永遠に。',
'home.hero.description': '上位10社の競合を合わせても機能が少なく、年間$50,000まで請求します。POTALは全てを提供します。$0で。',
'home.hero.ctaPrimary': '無料で始める',
'home.hero.ctaSecondary': 'API ドキュメント',
'home.hero.stat.features': '機能',
'home.hero.stat.countries': 'カ国',
'home.hero.stat.endpoints': 'API Endpoints',
'home.hero.stat.cost': 'コスト — 永遠に',
'home.hero.trustedBy': '公式データに基づく',

'home.featuresBanner.count': '140の機能',
'home.featuresBanner.title': 'ライブデモで全機能をお試しください',
'home.featuresBanner.description': 'サインアップ不要。140の機能すべて無料でお試し。',
'home.featuresBanner.cta': '140の機能を見る →',

'home.competitor.title': '全競合を合わせたより多い機能',
'home.competitor.description': '上位10社のクロスボーダーコマースプラットフォームの全機能を分析。POTALはそれら全てをカバーし、さらに多くを提供。',
'home.competitor.source': '出典：各競合の公開ドキュメントおよび製品ページの機能別監査。',

'home.cost.title': '彼らは企業価格を請求します。私たちは一切請求しません。',
'home.cost.description': '以下の全競合はトランザクション料金、導入費用、または企業最低料金を課しています。POTALは無料です。条件なし。',
'home.cost.table.provider': 'プロバイダー',
'home.cost.table.features': '機能',
'home.cost.table.annualCost': '年間コスト',
'home.cost.table.perTransaction': 'トランザクション毎',
'home.cost.table.free': '無料',
'home.cost.table.none': 'なし',
'home.cost.table.yes': 'あり',
'home.cost.conclusion': '彼らはより少ない機能に企業価格を請求。私たちはより多くを無料で提供。',

'home.howItWorks.title': '使い方',
'home.howItWorks.subtitle': '顧客に国際購入の真のコストを表示する3つのステップ',
'home.howItWorks.step1.title': 'API Keyを取得',
'home.howItWorks.step1.description': '無料登録して数秒でAPI Keyを取得。クレジットカード不要。',
'home.howItWorks.step2.title': 'Widgetを埋め込む',
'home.howItWorks.step2.description': '商品ページにscriptタグを1つ追加するだけ。WidgetがAPI endpointを自動検出。',
'home.howItWorks.step3.title': '購入者が真のコストを確認',
'home.howItWorks.step3.description': '顧客が国を選択すると、関税、税金、Total Landed Costを即座に確認。',

'home.features.title': 'グローバルコマースに必要な全て',
'home.features.subtitle': '国際貿易規制の複雑さを処理する1つのAPI。',
'home.features.seeAll': '140の全機能を見る →',
'home.features.countries.title': '240カ国',
'home.features.countries.desc': '240カ国の関税率、VAT/GST、De Minimis基準、FTA協定を完全サポート。',
'home.features.hsCode.title': '9-Field HS Classification',
'home.features.hsCode.desc': '商品名、素材、カテゴリなど9つの標準フィールドを入力。WCO基準で検証された100%正確なHS Code。',
'home.features.tax.title': '地方税（Sub-national Tax）',
'home.features.tax.desc': '米国（50州）、カナダ（13州 — GST/HST/PST）、ブラジル（27州 — ICMS）の州レベル税金。',
'home.features.fta.title': 'FTA検出',
'home.features.fta.desc': '出発国と到着国間のFTA（Free Trade Agreement）を自動検出し、軽減関税率を適用。',
'home.features.deMinimis.title': 'De Minimisルール',
'home.features.deMinimis.desc': '全国のDe Minimis基準を把握。基準以下の注文は輸入関税ゼロ、自動適用。',
'home.features.widget.title': '埋め込みWidget',
'home.features.widget.desc': 'Shadow DOM分離のドロップインJavaScript Widget。全サイトでCSS競合なし。',
'home.features.sanctions.title': '制裁＆輸出規制',
'home.features.sanctions.desc': 'OFAC SDN、BIS Entity Listなど19の制裁ソースをスクリーニング。21,300+件、ファジーマッチング。',
'home.features.remedies.title': 'Trade Remedies',
'home.features.remedies.desc': 'Anti-dumping、Countervailing Duties、Safeguard措置。36カ国119,700+件。',
'home.features.mcp.title': 'AI Agent対応（MCP）',
'home.features.mcp.desc': '公式MCPサーバーがレジストリに登録済み。全AI AgentがPOTALを1コマンドで呼び出し可能。',

'home.apiResponse.title': '1リクエストで完全な内訳',
'home.apiResponse.description': '全計算は商品価格、輸入関税、税金、送料、HS Code、FTAステータス、De Minimis適格性を含む詳細内訳を返します。',
'home.apiResponse.check1': 'Total Landed Costを1つの数字で',
'home.apiResponse.check2': '項目別コスト内訳',
'home.apiResponse.check3': 'HS Code＋関税率',
'home.apiResponse.check4': 'US、CA、BRの州レベル税金',
'home.apiResponse.check5': 'FTA＆De Minimis検出',

'home.widgetDemo.title': '顧客が見る画面',
'home.widgetDemo.description': 'POTAL Widgetが商品ページに直接埋め込まれます。下で国を選択してお試しください。',
'home.widgetDemo.cta': 'Widget Playgroundを試す',

'home.before.label': 'POTALなし',
'home.before.title': '顧客がチェックアウト時に$45を確認...',
'home.before.item1': '配送時に予期しない$18の通関料金',
'home.before.item2': '顧客が受取拒否 → 返品送料が発生',
'home.before.item3': '低評価レビュー：「隠れ料金！」',
'home.before.item4': '顧客生涯価値の損失',
'home.before.stat': 'カート放棄率：最大48%',
'home.after.label': 'POTAL使用',
'home.after.title': '顧客が$63のTotal Landed Costを確認',
'home.after.item1': 'チェックアウト前に関税、税金、手数料を表示',
'home.after.item2': '配送時の追加料金なし',
'home.after.item3': '5つ星レビュー：「予想通りの金額！」',
'home.after.item4': 'リピーター → 高いLTV',
'home.after.stat': 'コンバージョン率向上：最大25%',

'home.cta.title': '関税計算にお金を払うのをやめましょう。',
'home.cta.description': '140の機能。240カ国。永遠に無料。クレジットカード不要、トライアルなし、制限なし。',
'home.cta.primary': '無料で始める',
'home.cta.secondary': '全機能を見る',
```

---

### Step 4: zh.ts 중국어 번역 추가

```typescript
'home.hero.badge': '所有功能免费 — 永久',
'home.hero.title.part1': '140项功能。',
'home.hero.title.part2': '全部免费。',
'home.hero.title.part3': '永久。',
'home.hero.description': '前10名竞争对手加起来功能更少，且每年收费高达$50,000。POTAL提供一切，$0。',
'home.hero.ctaPrimary': '免费开始',
'home.hero.ctaSecondary': 'API 文档',
'home.hero.stat.features': '项功能',
'home.hero.stat.countries': '个国家',
'home.hero.stat.endpoints': 'API Endpoints',
'home.hero.stat.cost': '费用 — 永久',
'home.hero.trustedBy': '基于官方数据',

'home.featuresBanner.count': '140项功能',
'home.featuresBanner.title': '通过实时演示试用每项功能',
'home.featuresBanner.description': '无需注册。140项功能全部免费试用。',
'home.featuresBanner.cta': '探索140项功能 →',

'home.competitor.title': '功能超过所有竞争对手的总和',
'home.competitor.description': '我们分析了前10大跨境电商平台的所有功能。POTAL全部覆盖，并提供更多。',
'home.competitor.source': '来源：对每位竞争对手公开文档和产品页面的逐项功能审计。',

'home.cost.title': '他们收取企业价格。我们完全不收费。',
'home.cost.description': '以下所有竞争对手都收取按次费用、安装费或企业最低费用。POTAL免费，没有附加条件。',
'home.cost.table.provider': '提供商',
'home.cost.table.features': '功能',
'home.cost.table.annualCost': '年费',
'home.cost.table.perTransaction': '按次收费',
'home.cost.table.free': '免费',
'home.cost.table.none': '无',
'home.cost.table.yes': '有',
'home.cost.conclusion': '他们以更少的功能收取企业价格。我们以更多功能免费提供。',

'home.howItWorks.title': '使用方法',
'home.howItWorks.subtitle': '三步向客户展示跨境购买的真实成本',
'home.howItWorks.step1.title': '获取API Key',
'home.howItWorks.step1.description': '免费注册，几秒内获取API Key。无需信用卡。',
'home.howItWorks.step2.title': '嵌入Widget',
'home.howItWorks.step2.description': '在产品页面添加一个script标签。Widget自动检测API endpoint。',
'home.howItWorks.step3.title': '买家看到真实成本',
'home.howItWorks.step3.description': '客户选择国家后立即看到关税、税费和Total Landed Cost。',

'home.features.title': '全球商务所需的一切',
'home.features.subtitle': '一个处理国际贸易法规复杂性的API。',
'home.features.seeAll': '查看全部140项功能 →',
'home.features.countries.title': '240个国家',
'home.features.countries.desc': '覆盖240个国家的关税率、VAT/GST、De Minimis标准和FTA协议。',
'home.features.hsCode.title': '9-Field HS Classification',
'home.features.hsCode.desc': '输入产品名、材料、类别等9个标准字段，经WCO标准验证，获得100%准确的HS Code。',
'home.features.tax.title': '地方税（Sub-national Tax）',
'home.features.tax.desc': '美国（50个州）、加拿大（13个省 — GST/HST/PST）、巴西（27个州 — ICMS）的州级税。',
'home.features.fta.title': 'FTA检测',
'home.features.fta.desc': '自动检测出发国和目的国之间的FTA（Free Trade Agreement），适用减免关税率。',
'home.features.deMinimis.title': 'De Minimis规则',
'home.features.deMinimis.desc': '掌握所有国家的免税门槛。低于标准的订单自动适用零进口关税。',
'home.features.widget.title': '可嵌入Widget',
'home.features.widget.desc': '带Shadow DOM隔离的即插即用JavaScript Widget。在任何网站上无CSS冲突。',
'home.features.sanctions.title': '制裁与出口管制',
'home.features.sanctions.desc': '筛查OFAC SDN、BIS Entity List等19个制裁来源。21,300+条记录，模糊匹配。',
'home.features.remedies.title': 'Trade Remedies',
'home.features.remedies.desc': 'Anti-dumping、Countervailing Duties和Safeguard措施。36个国家119,700+案件。',
'home.features.mcp.title': 'AI Agent就绪（MCP）',
'home.features.mcp.desc': '官方MCP服务器已在注册表中。任何AI Agent都可通过一条命令调用POTAL。',

'home.apiResponse.title': '一次请求，完整明细',
'home.apiResponse.description': '每次计算返回包含产品价格、进口关税、税费、运费、HS Code、FTA状态和De Minimis资格的详细明细。',
'home.apiResponse.check1': 'Total Landed Cost一个数字',
'home.apiResponse.check2': '逐行成本明细',
'home.apiResponse.check3': 'HS Code + 关税率',
'home.apiResponse.check4': 'US、CA、BR州级税',
'home.apiResponse.check5': 'FTA & De Minimis检测',

'home.widgetDemo.title': '客户看到的界面',
'home.widgetDemo.description': 'POTAL Widget直接嵌入您的产品页面。在下方选择国家即可体验。',
'home.widgetDemo.cta': '试用Widget Playground',

'home.before.label': '没有POTAL',
'home.before.title': '客户结账时看到$45...',
'home.before.item1': '送货时出现意外$18海关费用',
'home.before.item2': '客户拒收 → 产生退货运费',
'home.before.item3': '差评："隐藏费用！"',
'home.before.item4': '客户终身价值损失',
'home.before.stat': '购物车放弃率：高达48%',
'home.after.label': '使用POTAL',
'home.after.title': '客户看到$63的Total Landed Cost',
'home.after.item1': '结账前显示关税、税费和手续费',
'home.after.item2': '送货时无额外费用',
'home.after.item3': '五星好评："和预期完全一致！"',
'home.after.item4': '回头客 → 更高LTV',
'home.after.stat': '转化率提升：高达25%',

'home.cta.title': '别再为关税计算付费了。',
'home.cta.description': '140项功能。240个国家。永久免费。无需信用卡、无试用、无限制。',
'home.cta.primary': '免费开始',
'home.cta.secondary': '查看全部功能',
```

---

### Step 5: es.ts 스페인어 번역 추가

```typescript
'home.hero.badge': 'TODAS LAS FUNCIONES GRATIS — PARA SIEMPRE',
'home.hero.title.part1': '140 funciones.',
'home.hero.title.part2': 'Todas gratis.',
'home.hero.title.part3': 'Para siempre.',
'home.hero.description': 'Los 10 principales competidores combinados ofrecen menos funciones y cobran hasta $50,000/año. POTAL te lo da todo. Por $0.',
'home.hero.ctaPrimary': 'Comienza gratis ahora',
'home.hero.ctaSecondary': 'Documentación API',
'home.hero.stat.features': 'Funciones',
'home.hero.stat.countries': 'Países',
'home.hero.stat.endpoints': 'API Endpoints',
'home.hero.stat.cost': 'Costo — Para siempre',
'home.hero.trustedBy': 'Construido con datos oficiales de',

'home.featuresBanner.count': '140 FUNCIONES',
'home.featuresBanner.title': 'Prueba cada función con una demo en vivo',
'home.featuresBanner.description': 'Sin registro. Las 140 funciones gratis para probar.',
'home.featuresBanner.cta': 'Explorar 140 funciones →',

'home.competitor.title': 'Más funciones que todos los competidores combinados',
'home.competitor.description': 'Analizamos cada función de las 10 principales plataformas de comercio transfronterizo. POTAL las cubre todas — y más.',
'home.competitor.source': 'Fuente: Auditoría función por función de la documentación pública y páginas de producto de cada competidor.',

'home.cost.title': 'Ellos cobran precios empresariales. Nosotros no cobramos nada.',
'home.cost.description': 'Todos los competidores cobran tarifas por transacción, costos de instalación o mínimos empresariales. POTAL es gratis. Sin condiciones.',
'home.cost.table.provider': 'Proveedor',
'home.cost.table.features': 'Funciones',
'home.cost.table.annualCost': 'Costo anual',
'home.cost.table.perTransaction': 'Por transacción',
'home.cost.table.free': 'GRATIS',
'home.cost.table.none': 'Ninguna',
'home.cost.table.yes': 'Sí',
'home.cost.conclusion': 'Cobran precios empresariales por menos funciones. Nosotros ofrecemos más — gratis.',

'home.howItWorks.title': 'Cómo funciona',
'home.howItWorks.subtitle': 'Tres pasos para mostrar a tus clientes el costo real de compras internacionales',
'home.howItWorks.step1.title': 'Obtén tu API Key',
'home.howItWorks.step1.description': 'Regístrate gratis y obtén tu API Key en segundos. Sin tarjeta de crédito.',
'home.howItWorks.step2.title': 'Integra el Widget',
'home.howItWorks.step2.description': 'Añade una etiqueta script a tu página de producto. El Widget detecta automáticamente tu API endpoint.',
'home.howItWorks.step3.title': 'Los compradores ven el costo real',
'home.howItWorks.step3.description': 'Los clientes seleccionan su país y ven instantáneamente aranceles, impuestos y Total Landed Cost.',

'home.features.title': 'Todo lo que necesitas para el comercio global',
'home.features.subtitle': 'Una API que maneja la complejidad de las regulaciones comerciales internacionales.',
'home.features.seeAll': 'Ver las 140 funciones →',
'home.features.countries.title': '240 países',
'home.features.countries.desc': 'Tasas arancelarias, VAT/GST, umbrales De Minimis y acuerdos FTA para 240 países.',
'home.features.hsCode.title': '9-Field HS Classification',
'home.features.hsCode.desc': 'Ingresa 9 campos estándar — nombre, material, categoría y más — validados contra estándares WCO. HS Codes 100% precisos.',
'home.features.tax.title': 'Impuestos subnacionales',
'home.features.tax.desc': 'Impuestos estatales para EE.UU. (50 estados), Canadá (13 provincias — GST/HST/PST) y Brasil (27 estados — ICMS).',
'home.features.fta.title': 'Detección de FTA',
'home.features.fta.desc': 'Detecta automáticamente FTA (Free Trade Agreements) entre países de origen y destino para tasas arancelarias reducidas.',
'home.features.deMinimis.title': 'Reglas De Minimis',
'home.features.deMinimis.desc': 'Conoce el umbral libre de aranceles de cada país. Pedidos por debajo del límite: arancel de importación cero, aplicado automáticamente.',
'home.features.widget.title': 'Widget integrable',
'home.features.widget.desc': 'Widget JavaScript con aislamiento Shadow DOM. Funciona en cualquier sitio sin conflictos CSS.',
'home.features.sanctions.title': 'Sanciones y controles de exportación',
'home.features.sanctions.desc': 'Verificación contra OFAC SDN, BIS Entity List y 19 fuentes de sanciones. 21,300+ registros con coincidencia difusa.',
'home.features.remedies.title': 'Trade Remedies',
'home.features.remedies.desc': 'Anti-dumping, Countervailing Duties y medidas Safeguard. 119,700+ casos en 36 países.',
'home.features.mcp.title': 'Listo para AI Agent (MCP)',
'home.features.mcp.desc': 'Servidor MCP oficial en el registro. Cualquier AI Agent puede llamar a POTAL con un solo comando.',

'home.apiResponse.title': 'Una solicitud, desglose completo',
'home.apiResponse.description': 'Cada cálculo devuelve un desglose detallado incluyendo precio, arancel, impuestos, envío, HS Code, estado FTA y elegibilidad De Minimis.',
'home.apiResponse.check1': 'Total Landed Cost en un número',
'home.apiResponse.check2': 'Desglose de costos línea por línea',
'home.apiResponse.check3': 'HS Code con tasa arancelaria',
'home.apiResponse.check4': 'Impuestos estatales para US, CA, BR',
'home.apiResponse.check5': 'Detección FTA & De Minimis',

'home.widgetDemo.title': 'Tus clientes ven esto',
'home.widgetDemo.description': 'El Widget POTAL se integra directamente en tu página de producto. Selecciona un país para verlo en acción.',
'home.widgetDemo.cta': 'Probar Widget Playground',

'home.before.label': 'Sin POTAL',
'home.before.title': 'El cliente ve $45 al pagar...',
'home.before.item1': 'Cargo aduanero inesperado de $18 en la entrega',
'home.before.item2': 'El cliente rechaza el paquete → costos de envío de devolución',
'home.before.item3': 'Reseña negativa: "¡Tarifas ocultas!"',
'home.before.item4': 'Pérdida del valor de vida del cliente',
'home.before.stat': 'Tasa de abandono del carrito: hasta 48%',
'home.after.label': 'Con POTAL',
'home.after.title': 'El cliente ve $63 Total Landed Cost',
'home.after.item1': 'Aranceles, impuestos y tarifas mostrados antes del pago',
'home.after.item2': 'Sin cargos sorpresa en la entrega',
'home.after.item3': 'Reseña 5 estrellas: "Exactamente lo que esperaba pagar"',
'home.after.item4': 'Cliente recurrente → mayor LTV',
'home.after.stat': 'Aumento de tasa de conversión: hasta 25%',

'home.cta.title': 'Deja de pagar por cálculos arancelarios.',
'home.cta.description': '140 funciones. 240 países. Gratis para siempre. Sin tarjeta, sin prueba, sin límites.',
'home.cta.primary': 'Comienza gratis ahora',
'home.cta.secondary': 'Ver todas las funciones',
```

---

### Step 6: de.ts 독일어 번역 추가

```typescript
'home.hero.badge': 'ALLE FUNKTIONEN KOSTENLOS — FÜR IMMER',
'home.hero.title.part1': '140 Funktionen.',
'home.hero.title.part2': 'Alle kostenlos.',
'home.hero.title.part3': 'Für immer.',
'home.hero.description': 'Die Top-10-Wettbewerber zusammen bieten weniger Funktionen — und verlangen bis zu $50.000/Jahr. POTAL gibt Ihnen alles. Für $0.',
'home.hero.ctaPrimary': 'Jetzt kostenlos starten',
'home.hero.ctaSecondary': 'API-Dokumentation',
'home.hero.stat.features': 'Funktionen',
'home.hero.stat.countries': 'Länder',
'home.hero.stat.endpoints': 'API Endpoints',
'home.hero.stat.cost': 'Kosten — Für immer',
'home.hero.trustedBy': 'Basierend auf offiziellen Daten von',

'home.featuresBanner.count': '140 FUNKTIONEN',
'home.featuresBanner.title': 'Testen Sie jede Funktion mit einer Live-Demo',
'home.featuresBanner.description': 'Keine Anmeldung erforderlich. Alle 140 Funktionen kostenlos testen.',
'home.featuresBanner.cta': '140 Funktionen entdecken →',

'home.competitor.title': 'Mehr Funktionen als alle Wettbewerber zusammen',
'home.competitor.description': 'Wir haben jede Funktion der Top-10-Cross-Border-Commerce-Plattformen analysiert. POTAL deckt alle ab — und bietet mehr.',
'home.competitor.source': 'Quelle: Funktions-Audit der öffentlichen Dokumentation und Produktseiten jedes Wettbewerbers.',

'home.cost.title': 'Sie verlangen Enterprise-Preise. Wir verlangen gar nichts.',
'home.cost.description': 'Alle Wettbewerber erheben Transaktionsgebühren, Einrichtungskosten oder Enterprise-Mindestbeträge. POTAL ist kostenlos. Ohne Bedingungen.',
'home.cost.table.provider': 'Anbieter',
'home.cost.table.features': 'Funktionen',
'home.cost.table.annualCost': 'Jährliche Kosten',
'home.cost.table.perTransaction': 'Pro Transaktion',
'home.cost.table.free': 'KOSTENLOS',
'home.cost.table.none': 'Keine',
'home.cost.table.yes': 'Ja',
'home.cost.conclusion': 'Sie verlangen Enterprise-Preise für weniger Funktionen. Wir bieten mehr — kostenlos.',

'home.howItWorks.title': 'So funktioniert es',
'home.howItWorks.subtitle': 'Drei Schritte, um Ihren Kunden die wahren Kosten internationaler Einkäufe zu zeigen',
'home.howItWorks.step1.title': 'API Key erhalten',
'home.howItWorks.step1.description': 'Kostenlos registrieren und API Key in Sekunden erhalten. Keine Kreditkarte erforderlich.',
'home.howItWorks.step2.title': 'Widget einbetten',
'home.howItWorks.step2.description': 'Fügen Sie ein Script-Tag zu Ihrer Produktseite hinzu. Das Widget erkennt Ihren API Endpoint automatisch.',
'home.howItWorks.step3.title': 'Käufer sehen echte Kosten',
'home.howItWorks.step3.description': 'Kunden wählen ihr Land und sehen sofort Zölle, Steuern und Total Landed Cost.',

'home.features.title': 'Alles für den globalen Handel',
'home.features.subtitle': 'Eine API für die Komplexität internationaler Handelsvorschriften.',
'home.features.seeAll': 'Alle 140 Funktionen ansehen →',
'home.features.countries.title': '240 Länder',
'home.features.countries.desc': 'Vollständige Zollsätze, VAT/GST, De Minimis-Schwellen und FTA-Abkommen für 240 Länder.',
'home.features.hsCode.title': '9-Field HS Classification',
'home.features.hsCode.desc': '9 standardisierte Felder eingeben — Produktname, Material, Kategorie u.m. — nach WCO-Standards validiert. 100% genaue HS Codes.',
'home.features.tax.title': 'Regionale Steuern (Sub-national Tax)',
'home.features.tax.desc': 'Steuern auf Bundesstaatsebene für USA (50 Staaten), Kanada (13 Provinzen — GST/HST/PST) und Brasilien (27 Staaten — ICMS).',
'home.features.fta.title': 'FTA-Erkennung',
'home.features.fta.desc': 'Erkennt automatisch FTA (Free Trade Agreements) zwischen Ursprungs- und Zielland für reduzierte Zollsätze.',
'home.features.deMinimis.title': 'De Minimis-Regeln',
'home.features.deMinimis.desc': 'Kennt die zollfreien Schwellenwerte jedes Landes. Bestellungen unter dem Limit: Null Einfuhrzoll, automatisch angewendet.',
'home.features.widget.title': 'Einbettbares Widget',
'home.features.widget.desc': 'Drop-in JavaScript Widget mit Shadow DOM-Isolation. Funktioniert auf jeder Website ohne CSS-Konflikte.',
'home.features.sanctions.title': 'Sanktionen & Exportkontrollen',
'home.features.sanctions.desc': 'Prüfung gegen OFAC SDN, BIS Entity List und 19 Sanktionsquellen. 21.300+ Einträge mit Fuzzy-Matching.',
'home.features.remedies.title': 'Trade Remedies',
'home.features.remedies.desc': 'Anti-dumping, Countervailing Duties und Safeguard-Maßnahmen. 119.700+ Fälle in 36 Ländern.',
'home.features.mcp.title': 'AI Agent-fähig (MCP)',
'home.features.mcp.desc': 'Offizieller MCP-Server im Registry. Jeder AI Agent kann POTAL mit einem Befehl aufrufen.',

'home.apiResponse.title': 'Eine Anfrage, vollständige Aufschlüsselung',
'home.apiResponse.description': 'Jede Berechnung liefert eine detaillierte Aufschlüsselung mit Produktpreis, Einfuhrzoll, Steuern, Versand, HS Code, FTA-Status und De Minimis-Berechtigung.',
'home.apiResponse.check1': 'Total Landed Cost in einer Zahl',
'home.apiResponse.check2': 'Kostenaufschlüsselung Zeile für Zeile',
'home.apiResponse.check3': 'HS Code mit Zollsatz',
'home.apiResponse.check4': 'Steuern auf Staatsebene für US, CA, BR',
'home.apiResponse.check5': 'FTA & De Minimis-Erkennung',

'home.widgetDemo.title': 'Das sehen Ihre Kunden',
'home.widgetDemo.description': 'Das POTAL Widget wird direkt in Ihre Produktseite eingebettet. Wählen Sie unten ein Land, um es in Aktion zu sehen.',
'home.widgetDemo.cta': 'Widget Playground testen',

'home.before.label': 'Ohne POTAL',
'home.before.title': 'Kunde sieht $45 beim Checkout...',
'home.before.item1': 'Unerwartete Zollgebühr von $18 bei Lieferung',
'home.before.item2': 'Kunde verweigert Paket → Rücksendekosten',
'home.before.item3': 'Negative Bewertung: „Versteckte Gebühren!"',
'home.before.item4': 'Verlust des Kunden-Lebenszeitwerts',
'home.before.stat': 'Warenkorbabbruchrate: bis zu 48%',
'home.after.label': 'Mit POTAL',
'home.after.title': 'Kunde sieht $63 Total Landed Cost',
'home.after.item1': 'Zölle, Steuern & Gebühren vor dem Checkout angezeigt',
'home.after.item2': 'Keine überraschenden Kosten bei Lieferung',
'home.after.item3': '5-Sterne-Bewertung: „Genau wie erwartet!"',
'home.after.item4': 'Stammkunde → höherer LTV',
'home.after.stat': 'Steigerung der Konversionsrate: bis zu 25%',

'home.cta.title': 'Hören Sie auf, für Zollberechnung zu bezahlen.',
'home.cta.description': '140 Funktionen. 240 Länder. Für immer kostenlos. Keine Kreditkarte, kein Test, keine Limits.',
'home.cta.primary': 'Jetzt kostenlos starten',
'home.cta.secondary': 'Alle Funktionen ansehen',
```

---

### Step 7: fr.ts 프랑스어 번역 추가

```typescript
'home.hero.badge': 'TOUTES LES FONCTIONNALITÉS GRATUITES — POUR TOUJOURS',
'home.hero.title.part1': '140 fonctionnalités.',
'home.hero.title.part2': 'Toutes gratuites.',
'home.hero.title.part3': 'Pour toujours.',
'home.hero.description': 'Les 10 principaux concurrents combinés offrent moins de fonctionnalités — et facturent jusqu\'à $50 000/an. POTAL vous donne tout. Pour $0.',
'home.hero.ctaPrimary': 'Commencer gratuitement',
'home.hero.ctaSecondary': 'Documentation API',
'home.hero.stat.features': 'Fonctionnalités',
'home.hero.stat.countries': 'Pays',
'home.hero.stat.endpoints': 'API Endpoints',
'home.hero.stat.cost': 'Coût — Pour toujours',
'home.hero.trustedBy': 'Construit sur des données officielles de',

'home.featuresBanner.count': '140 FONCTIONNALITÉS',
'home.featuresBanner.title': 'Essayez chaque fonctionnalité avec une démo en direct',
'home.featuresBanner.description': 'Sans inscription. Les 140 fonctionnalités gratuites à essayer.',
'home.featuresBanner.cta': 'Explorer 140 fonctionnalités →',

'home.competitor.title': 'Plus de fonctionnalités que tous les concurrents réunis',
'home.competitor.description': 'Nous avons analysé chaque fonctionnalité des 10 principales plateformes de commerce transfrontalier. POTAL les couvre toutes — et plus encore.',
'home.competitor.source': 'Source : Audit fonctionnalité par fonctionnalité de la documentation publique et des pages produit de chaque concurrent.',

'home.cost.title': 'Ils facturent des prix entreprise. Nous ne facturons rien.',
'home.cost.description': 'Tous les concurrents facturent des frais par transaction, des coûts d\'installation ou des minimums entreprise. POTAL est gratuit. Sans condition.',
'home.cost.table.provider': 'Fournisseur',
'home.cost.table.features': 'Fonctionnalités',
'home.cost.table.annualCost': 'Coût annuel',
'home.cost.table.perTransaction': 'Par transaction',
'home.cost.table.free': 'GRATUIT',
'home.cost.table.none': 'Aucun',
'home.cost.table.yes': 'Oui',
'home.cost.conclusion': 'Ils facturent des prix entreprise pour moins de fonctionnalités. Nous offrons plus — gratuitement.',

'home.howItWorks.title': 'Comment ça marche',
'home.howItWorks.subtitle': 'Trois étapes pour montrer à vos clients le vrai coût des achats internationaux',
'home.howItWorks.step1.title': 'Obtenez votre API Key',
'home.howItWorks.step1.description': 'Inscrivez-vous gratuitement et obtenez votre API Key en quelques secondes. Sans carte de crédit.',
'home.howItWorks.step2.title': 'Intégrez le Widget',
'home.howItWorks.step2.description': 'Ajoutez une balise script à votre page produit. Le Widget détecte automatiquement votre API endpoint.',
'home.howItWorks.step3.title': 'Les acheteurs voient le vrai coût',
'home.howItWorks.step3.description': 'Les clients sélectionnent leur pays et voient instantanément les droits de douane, taxes et Total Landed Cost.',

'home.features.title': 'Tout ce dont vous avez besoin pour le commerce mondial',
'home.features.subtitle': 'Une seule API pour gérer la complexité des réglementations commerciales internationales.',
'home.features.seeAll': 'Voir les 140 fonctionnalités →',
'home.features.countries.title': '240 pays',
'home.features.countries.desc': 'Taux de droits, VAT/GST, seuils De Minimis et accords FTA pour 240 pays.',
'home.features.hsCode.title': '9-Field HS Classification',
'home.features.hsCode.desc': 'Saisissez 9 champs standards — nom, matériau, catégorie et plus — validés selon les normes WCO. HS Codes 100% précis.',
'home.features.tax.title': 'Taxes infranationales',
'home.features.tax.desc': 'Taxes au niveau des États pour les USA (50 États), le Canada (13 provinces — GST/HST/PST) et le Brésil (27 États — ICMS).',
'home.features.fta.title': 'Détection FTA',
'home.features.fta.desc': 'Détecte automatiquement les FTA (Free Trade Agreements) entre pays d\'origine et de destination pour des taux réduits.',
'home.features.deMinimis.title': 'Règles De Minimis',
'home.features.deMinimis.desc': 'Connaît le seuil d\'exemption de chaque pays. Commandes sous le seuil : droits d\'importation zéro, appliqués automatiquement.',
'home.features.widget.title': 'Widget intégrable',
'home.features.widget.desc': 'Widget JavaScript avec isolation Shadow DOM. Fonctionne sur tout site sans conflits CSS.',
'home.features.sanctions.title': 'Sanctions et contrôles à l\'exportation',
'home.features.sanctions.desc': 'Vérification contre OFAC SDN, BIS Entity List et 19 sources de sanctions. 21 300+ entrées avec correspondance floue.',
'home.features.remedies.title': 'Trade Remedies',
'home.features.remedies.desc': 'Anti-dumping, Countervailing Duties et mesures Safeguard. 119 700+ cas dans 36 pays.',
'home.features.mcp.title': 'Prêt pour AI Agent (MCP)',
'home.features.mcp.desc': 'Serveur MCP officiel dans le registre. Tout AI Agent peut appeler POTAL via une seule commande.',

'home.apiResponse.title': 'Une requête, détail complet',
'home.apiResponse.description': 'Chaque calcul renvoie un détail complet incluant prix, droits, taxes, expédition, HS Code, statut FTA et éligibilité De Minimis.',
'home.apiResponse.check1': 'Total Landed Cost en un chiffre',
'home.apiResponse.check2': 'Détail des coûts ligne par ligne',
'home.apiResponse.check3': 'HS Code avec taux de droits',
'home.apiResponse.check4': 'Taxes étatiques pour US, CA, BR',
'home.apiResponse.check5': 'Détection FTA & De Minimis',

'home.widgetDemo.title': 'Ce que vos clients voient',
'home.widgetDemo.description': 'Le Widget POTAL s\'intègre directement dans votre page produit. Sélectionnez un pays ci-dessous pour le voir en action.',
'home.widgetDemo.cta': 'Essayer Widget Playground',

'home.before.label': 'Sans POTAL',
'home.before.title': 'Le client voit $45 au paiement...',
'home.before.item1': 'Frais de douane inattendus de $18 à la livraison',
'home.before.item2': 'Le client refuse le colis → frais de retour',
'home.before.item3': 'Avis négatif : « Frais cachés ! »',
'home.before.item4': 'Perte de la valeur vie du client',
'home.before.stat': 'Taux d\'abandon de panier : jusqu\'à 48%',
'home.after.label': 'Avec POTAL',
'home.after.title': 'Le client voit $63 Total Landed Cost',
'home.after.item1': 'Droits, taxes et frais affichés avant le paiement',
'home.after.item2': 'Aucun frais surprise à la livraison',
'home.after.item3': 'Avis 5 étoiles : « Exactement ce que j\'attendais ! »',
'home.after.item4': 'Client fidèle → LTV plus élevé',
'home.after.stat': 'Augmentation du taux de conversion : jusqu\'à 25%',

'home.cta.title': 'Arrêtez de payer pour le calcul des droits de douane.',
'home.cta.description': '140 fonctionnalités. 240 pays. Gratuit pour toujours. Sans carte, sans essai, sans limites.',
'home.cta.primary': 'Commencer gratuitement',
'home.cta.secondary': 'Voir toutes les fonctionnalités',
```

---

### Step 8: app/page.tsx 수정 — `useI18n()` 연동

**중요**: page.tsx는 현재 서버 컴포넌트인지 클라이언트 컴포넌트인지 확인 필요.
- `'use client'` 선언이 있으면 바로 `useI18n()` 사용 가능
- 없으면 상위에 `'use client'` 추가하거나 별도 클라이언트 래퍼 컴포넌트 생성

**수정 방법**:
1. 파일 상단에 `import { useI18n } from '@/app/context/I18nProvider';` 추가
2. `HomePage` 함수 내부에 `const { t } = useI18n();` 추가
3. 모든 하드코딩 문자열을 `t('home.xxx.xxx')` 호출로 교체

**주의사항**:
- `FeatureCard` 컴포넌트도 props로 번역된 문자열을 받도록 변경
- `COMPETITORS` 배열은 데이터이므로 번역 불필요 (경쟁사명, 숫자)
- 데이터 소스 목록 (WTO, USITC 등)은 번역하지 않음
- `AnimatedNumber` 컴포넌트는 그대로 유지

**교체 예시**:
```tsx
// Before
<h1>140 Features. <span>All Free.</span> Forever.</h1>

// After
<h1>{t('home.hero.title.part1')} <span>{t('home.hero.title.part2')}</span> {t('home.hero.title.part3')}</h1>
```

```tsx
// Before
{ value: 140, suffix: '', label: 'Features', icon: '⚡' },

// After
{ value: 140, suffix: '', label: t('home.hero.stat.features'), icon: '⚡' },
```

---

### Step 9: 나머지 44개 언어 — 영어 fallback 확인

나머지 언어 파일(am.ts, ar.ts, az.ts 등)에는 아직 `home.*` 키가 없으므로:
- I18nProvider의 `t()` 함수가 해당 키를 찾지 못하면 **key 자체를 반환** (line 74-77)
- 이건 UX가 안 좋으므로, **en.ts 값을 fallback으로 반환**하도록 `getTranslation()` 수정 권장

**수정 위치**: `app/i18n/translations/index.ts`의 `getTranslation()`:
```typescript
export function getTranslation(language: LanguageCode): Record<TranslationKey, string> {
  const target = translations[language] || translations[DEFAULT_LANGUAGE];
  const fallback = translations[DEFAULT_LANGUAGE];
  // Merge: target 우선, 없으면 en fallback
  return { ...fallback, ...target } as Record<TranslationKey, string>;
}
```

이렇게 하면 44개 언어에서 `home.*` 키가 없어도 영어로 표시됨. 2차 번역 때 채워넣으면 됨.

---

### Step 10: 빌드 확인 + 검증

```bash
npm run build
```

확인 사항:
- [ ] TypeScript 타입 오류 없음 (TranslationKey에 새 키 포함)
- [ ] en.ts의 새 키가 다른 6개 언어 파일의 키와 정확히 일치
- [ ] page.tsx에서 모든 하드코딩 문자열이 t() 호출로 교체됨
- [ ] `getTranslation()` fallback 로직 정상 동작
- [ ] 언어 전환 시 홈페이지 텍스트가 정상적으로 변경됨

---

## 요약

| 항목 | 수치 |
|------|------|
| 새 번역 키 | 73개 |
| 번역 대상 언어 (1차) | 7개 (en, ko, ja, zh, es, de, fr) |
| 번역하지 않는 용어 | 40+개 (trade/legal/기관명/기술/브랜드) |
| 수정 파일 | en.ts, ko.ts, ja.ts, zh.ts, es.ts, de.ts, fr.ts, page.tsx, index.ts |
| 남은 언어 (2차) | 44개 (en fallback으로 동작) |
