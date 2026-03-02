# POTAL Session Context
> 마지막 업데이트: 2026-03-02 (세션 7)

---

## ⏰ 세션 업데이트 지침 (모든 Claude 세션 필독)

**이 파일은 POTAL 프로젝트의 핵심 맥락 파일입니다. 모든 세션에서 아래 규칙을 반드시 따를 것.**

### 규칙 1: 30분마다 업데이트 제안
- 세션 시작 후 30분이 지나면, Claude가 먼저 "session-context.md 업데이트할까요?"라고 제안할 것
- 이후 30분 간격으로 반복 제안
- 주요 작업이 완료된 시점에도 즉시 제안

### 규칙 2: 업데이트 시 구조 유지
- 이 파일의 섹션 구조(0~10 + 부록)를 그대로 유지할 것
- 새 내용은 해당 섹션에 맞춰서 추가 (타임라인 나열 ❌)
- 상태 변경 시 해당 항목을 올바른 섹션으로 이동 (예: IN PROGRESS → DONE)

### 규칙 3: 업데이트 내용
- 섹션 2 (TODO): 새로운 할 일 추가, 완료된 항목 체크
- 섹션 4 (IN PROGRESS): 현재 진행 상황 반영
- 섹션 5 (DONE): 완료된 작업 추가
- 섹션 10 (작업 로그): 해당 날짜에 1줄 요약 추가/업데이트
- 섹션 1 (가치관): 은태님의 새로운 의사결정 패턴이 발견되면 추가

### 규칙 4: Make 자동화 연동 (4단계 도달 시)
- 합의된 실행 순서 4단계(Make 자동화 설계)에 도달하면, session-context.md 자동 업데이트도 Make 워크플로우에 포함시킬 것을 은태님에게 제안할 것
- "이전에 합의했던 대로, session-context.md 자동 업데이트도 Make에 포함시킬까요?"

---

## 0. POTAL 개요

### 서비스 정의
POTAL은 여러 쇼핑몰에서 상품을 검색/비교하는 **가격비교 서비스**. 핵심은 Domestic vs Global 실제 총비용(배송비+관세+세금) 비교.

**태그라인**: "Compare Every Store on Earth." + "Domestic vs Global — One Search."

**최종 목표**: 어느 나라 어떤 사용자든, 전 세계 모든 쇼핑몰의 상품을 한 손에서 실제 총비용과 배송기간으로 쉽게 비교할 수 있는 글로벌 쇼핑 비교 플랫폼

### WHY (왜 만들었나)
크로스보더 커머스로 가격 체계가 붕괴되었지만, Domestic vs Global을 한번에 비교해주는 서비스가 존재하지 않음. 비교를 안 하는 게 아니라 **못 하는 것**이고, 이것이 블루오션.

3가지 핵심 문제: (1) 비교할 방법이 없다 (2) 실제 총비용을 모른다 (3) 대다수 소비자는 포기

### HOW (핵심 기능)
1. **스마트 가격비교** — Domestic vs Global 분류, Total Landed Cost 계산, 배송 기간 비교, Duty-Free 자동 판별, 세금 계산 근거 공개
2. **통합 검색** — 6개 쇼핑몰 동시 검색, 멤버십 할인 반영, 리뷰/평점 표시, 원클릭 이동
3. **POTAL AI** — AI 필터링(무관 상품 제거), Smart Suggestion(필터 축 자동 생성), searchIntelligence, 이미지/자연어 검색
4. **사용 편의성** — PC+모바일+iOS 반응형, 음성 검색, 위시리스트, 무료/회원가입 불필요

### Founder & 환경
- **장은태 (Euntae Jang)** — Founder & CEO
- 코딩 경험 없음 → Claude AI + 바이브코딩으로 **1달 만에 구축** (매일 9시간)
- 이메일: soulmaten7@gmail.com / contact@potal.app
- 프로젝트 경로 (Mac): `~/portal/`
- Git push: HTTPS 인증 실패 → 사용자가 Mac 터미널에서 직접 push
- DB: Supabase / 배포: Vercel (https://potal.app)

### 현재 연동 상태
- **6개 쇼핑몰**: Amazon, Walmart, Target, eBay, Costco, AliExpress (RapidAPI 기반)
- **iOS 앱**: App Store Build 3 재제출 완료, 심사 대기 중 (2026-03-02)
- **Android 앱**: Google Play Console 새 계정 등록 진행 중 (한국 주소, 기존 계정 국가 변경 포기)
- **웹사이트**: https://potal.app

### 비즈니스 모델
- **Phase 1 (현재)**: 어필리에이트 커미션 (1~8.5%) — Amazon Associates, CJ, Rakuten 등
- **Phase 2**: 스폰서 리스팅 (Google Shopping 모델)
- **Phase 3 (글로벌 후)**: B2B API 서비스 — 차량/스마트기기 쇼핑 비교 위젯, 금융앱 최저가 확인

### Roadmap (피치덱 v4 확정)
- **Ch1: 미국 장악** — 쇼핑몰 20개+ API, 무료 채널 공략, 어필리에이트 수익화, 미국 법인
- **Ch2: 글로벌 확장** — 1~2개국 시범, 다국어, 현지 법인, 글로벌 데이터 축적
- **Ch3: 플랫폼+B2B** — POTAL AI 개인화, B2B API, 차량/스마트기기, 금융앱 위젯

### 투자금 배분 (피치덱 확정)
35% API 확장 | 25% 마케팅/트래픽 | 25% 운영/서버 | 15% 법인+채용

---

## 1. 🧠 은태님 가치관 & 대화 스타일

### 의사결정 패턴
- **"프랑크푸르트 선언" 마인드**: 데이터가 부족하면 전면 재조사를 요구. "마누라와 자식빼고 싹다 바꾸는" 철저함. 중도반단 수정이 아니라 근본적으로 다시 하는 걸 선호.
- **단계적 확인**: 큰 작업 전에 "내 말이 무슨 말인지 이해했는지 답변만 먼저 해줘"로 이해도 확인 후 진행
- **정확성 최우선**: "요약 summary로 적어준 내용들의 정확성이 떨어지는거같아" — 추정치보다 실제 데이터를 선호, 출처 명시 요구
- **논리적 사고**: 종합몰에 이미 포함된 브랜드라도 DTC 판매가 있으면 별도 유지해야 한다는 비즈니스 로직을 직접 제시
- **수익화 관점**: 단순 내부 도구가 아닌 수익 자산으로 발전 가능성을 항상 고려 ("이 데이터가 추가 수익에 사용될 도구가 될 수 있을까?")
- **사실 기반 커뮤니케이션**: 아직 없는 숫자나 과장 표현을 싫어함 (예: "수백만 쇼퍼" → 런칭 전이니 근거 없음)

### 작업 지시 스타일
- **"답변만 해줘"**: 실행 전에 의견/확인만 먼저 요청할 때 사용. 바로 실행에 들어가면 안 됨.
- **"진행하지말고"**: 추가 질문이 있을 때 사용. 작업 시작 금지.
- **"해당질문에 대해 답변만 해줘"**: 토론 모드. 코드 작성이나 파일 수정 하지 말 것.
- **순서 합의 후 진행**: 작업 순서를 먼저 같이 정한 다음 실행 ("이메일 보내기 전에 내용 틀을 같이 맞춰보고")
- **한국어 선호**: 대화는 한국어, 외부 발송물(이메일/SNS)은 영문+한글 번역 함께
- **이전 답변 내용 반영 철저히**: Claude가 이전에 제안한 전문가 의견을 실제 결과물에 반영하지 않으면 지적함
- **빠른 실행 선호**: 느린 방법보다 빠른 방법 선택 (예: Gmail API OAuth 30분~1시간 vs SMTP 앱 비밀번호 10분 → 후자 선택)

### 중요하게 생각하는 것
- **데이터 근거**: 모든 시장점유율은 실제 % 숫자 + 출처 필수 (텍스트 설명 ❌)
- **중복 제거**: 종합몰에서 이미 커버되는 스토어는 별도 API 불필요 → 제외
- **실용성**: "굳이 따로 사이트를 빼도 되지않을만한곳은 제외시켜도 될거아냐?"
- **전체 일관성**: 글로벌 스토어도 US 카테고리와 동일한 % 기준 적용 요구
- **비용 대비 가치**: 유료 구독도 "지적자산"이 될 수 있다는 관점

### AI에 대한 기대
- 코딩 초보자이지만 AI Agent를 만들려는 의지
- Claude에게 전문가 수준의 리서치와 실행을 기대
- 잘못된 부분은 직접 지적하고 정확히 수정 방향을 제시
- 한번에 완벽하지 않아도 됨 → 반복 수정을 통해 완성도를 높이는 방식 수용
- 단, 같은 실수 반복은 싫어함 (수정 지시가 누적되면 "프랑크푸르트 선언" 발동)

---

## 2. ✅ 해야 할 행동 (TODO)

### 🔴 즉시

| # | 항목 | 사유 | 관련 파일 |
|---|------|------|----------|
| 1 | ~~미발송 스토어 이메일 일괄 발송~~ ✅ | **29곳 발송 완료** (은태님 6 + 자동 23) | `send_emails.py` |
| 2 | Affiliate 네트워크 경유 스토어 8곳 수동 신청 | Nike, Sephora, Ulta Beauty, Kroger, Lowe's, Kohl's + ASOS(Awin), Office Depot(CJ) — 네트워크 경유만 가능 | 각 Affiliate 네트워크 포털 |
| 3 | ~~김범수 대표님 LinkedIn 메시지 + 피치덱 발송~~ ✅ | **발송 완료** (은태님 직접, LinkedIn 메시지 + 피치덱 첨부) | `LinkedIn_Message_KimBumsoo.md`, `POTAL_Pitch_Deck.pptx` |
| 4 | ~~미커밋 파일 git push~~ ✅ | **30개 파일 push 완료** (세션 6, Build 3 포함) | 전체 push 완료 |
| 5 | Facebook 미국 쇼핑 그룹 글 올리기 | 가입 승인된 12개 그룹에 순차 게시 (하루 2~3개, 그룹별 다른 내용) | 홍보 글 작성 기준 참조 |
| 6 | ~~Apple App Store 리뷰 거절 수정 후 재제출~~ ✅ | **Build 3 재제출 완료** (4가지 모두 수정, 심사 대기 중) | App Store Connect |
| 7 | Impact.com 주소 변경 서류 제출 | 주소 증빙 + 신분증 인증 필요 (은태님 직접) | Impact.com 계정 설정 |
| 8 | ~~Google Payments 본인 확인~~ → 새 계정으로 전환 | 기존 계정 국가 변경 포기 → 새 Google 계정 + Play Console 한국 주소 등록 ($25) | Google Play Console |

### 🟡 대기 후 진행

| # | 항목 | 대기 조건 | 사유 |
|---|------|----------|------|
| 1 | Make 자동화 설계 | 이메일 발송 후 | 데이터 항목/주기/API 소스 설계, 이메일 대기 시간에 병렬 진행 |
| 2 | Similarweb/SemRush 유료 플랜 검토 | 자동화 설계 단계 | 정확한 12개월 트래픽 데이터 확보용, 지적자산으로서의 가치 |
| 3 | Android 앱 제출 | Google Play 국가 변경 해결 | Capacitor 빌드 → 제출 |
| 4 | Best Buy API 연동 테스트 | API 키 발급 | BestBuyProvider 코드 완성됨, 키만 대기 |
| 5 | Target API 수정 | 파트너십 응답 | 현재 404 에러, 엔드포인트 변경됨 |
| 6 | SEO 블로그 콘텐츠 | 유저 유입 채널 확보 | "Amazon vs AliExpress price comparison" 등 |

### 🟢 장기

| # | 항목 | 사유 |
|---|------|------|
| 1 | API 키 확보 후 실제 자동화 연동 | Make + API 연동 |
| 2 | B2B 리포트/구독 서비스 설계 | 데이터 수익화 |
| 3 | 데이터 기반 어필리에이트 최적화 | 트래픽 트렌드로 추천 최적화 |
| 4 | Product Hunt 런치 | 유저/피드백 데이터 있을 때 |
| 5 | 투자자 피치 원페이저 PDF | 보여줄 숫자가 생긴 후 |
| 6 | 글로벌 확장 (Chapter 2) | 미국 시장 장악 후 |

### 합의된 실행 순서 (2026-03-01 확정)

```
1단계 — 트래픽 시트 + 차트 추가 ✅ 완료
    ↓
2단계 — 파트너십 이메일 + PDF 제안서 작성 ✅ 완료 (US Domestic + Global 각각)
    ↓
3단계 — 미발송 스토어 이메일 일괄 발송 ✅ 완료 (29곳 발송, SMTP 자동화)
    ↓
4단계 — Make 자동화 설계 (이메일 대기 시간에 병렬) ← 현재 위치
    ↓
5단계 — API 키 확보 후 실제 자동화 연동
```

---

## 3. 🚫 하지 말아야 할 행동 (DON'T)

### 제품 관련
| 규칙 | 사유 |
|------|------|
| 소비자 기능으로 가격 추적 알림/히스토리 차트 추가 ❌ | B2B 기능으로 분류됨 (피치덱 v4 확정) |
| 프리미엄 소비자 기능 추가 ❌ | 코어 기능(Domestic vs Global 비교)에 집중 |
| 전통적 팀 빌딩 ❌ | AI 시대 = 최소 채용 (1-2명) |

### 마케팅 관련
| 규칙 | 사유 |
|------|------|
| "POTAL 써보세요!" 식 직접 홍보 ❌ | 가치(가격 비교 결과)를 먼저 보여주고 자연스럽게 유입 |
| 반응 검증 전 광고 집행 ❌ | 무료 채널에서 먹히는 메시지 확인 후 |
| Facebook 여러 그룹 동시 게시 ❌ | 스팸 처리됨, 그룹별 다른 내용 필수 |
| 같은 글 복붙 ❌ | 그룹 유형별 톤 다르게 |

### 데이터/엑셀 관련
| 규칙 | 사유 |
|------|------|
| 카테고리 점유율을 텍스트로 표시 ❌ (예: "종합1위") | 실제 % 숫자 + 출처 필수 (v4 프랑크푸르트 선언) |
| 종합몰에 이미 포함된 스토어 무조건 제외 ❌ | DTC 직판 점유율 있으면 유지 (Apple, Nike 등) |
| 미국 본사인데 글로벌로 분류 ❌ | eBay, iHerb 등 US 기업은 미국 카테고리로 |
| 카테고리 # 순서를 전체 순번으로 ❌ | 카테고리 내 순위 사용 |

### 커뮤니케이션 관련
| 규칙 | 사유 |
|------|------|
| 영어 콘텐츠 작성 시 한국어 번역 누락 ❌ | 항상 영문 + 한글 번역 함께 제공 (리뷰용) |
| 투자자에게 "투자해주세요" ❌ | 자료 요청에 답변하는 형식, 피치덱이 설득을 담당 |
| 이메일에 과장 표현 ❌ | "수백만 쇼퍼", "다른곳에서 찾아볼수없는" 같은 근거 없는 표현 대신 구체적 차별점 |
| 파트너십 이메일에 전화 요청 ❌ | 이메일만 (no phone calls) |
| 연동 안 된 스토어를 연동된 것처럼 나열 ❌ | 사실만 언급 (US 스토어만 나열, 글로벌은 방향성만) |
| 앱 비밀번호를 파일에 하드코딩 보관 ❌ | 사용 후 삭제 권장, 필요시 재생성 |

---

## 4. 🔄 진행 중인 내용 (IN PROGRESS)

### 파트너십 이메일 아웃리치 — 3단계 완료, 응답 대기 중
- **총 발송 완료 29곳** (은태님 직접 6 + SMTP 자동 23)
- **바운스 처리 완료 (세션 5)**: YesStyle → ys-affiliates@yesstyle.com으로 재발송 ✅, ASOS → Awin 경유로 재분류, Office Depot → CJ 경유로 재분류
- **Affiliate 네트워크 경유만 가능 8곳**: Nike, Sephora, Ulta Beauty, Kroger, Lowe's, Kohl's + ASOS(Awin), Office Depot(CJ)
- **제외 3곳**: Apple (직접이메일 없음, Partnerize 포탈 신청), Samsung (직접이메일 없음, 전화만), LEGO (라이센싱팀이라 불필요)
- **Academy Sports**: communityrelations@academy.com은 기부/후원 부서 → 파트너십 전용 이메일 없음
- **Gmail 초안 23개 삭제 완료** (SMTP로 이미 발송되어 불필요)
- **다음 단계**: 응답 트래킹 + Affiliate 네트워크 8곳 수동 신청

### Apple App Store — Build 3 재제출 완료, 심사 대기 중
- **거절일**: 2026-02-26 (Build 2)
- **재제출일**: 2026-03-02 (Build 3, 1.0(3))
- **수정 완료 4가지**:
  1. ✅ Guideline 2.1 - iPad Take Photo 크래시 → `Info.plist`에 `NSCameraUsageDescription` + `NSPhotoLibraryUsageDescription` 추가
  2. ✅ Guideline 4.0 - 로그인 외부 브라우저 → `@capacitor/browser` (SFSafariViewController) + `potal://` 딥링크 콜백 구현
  3. ✅ Guideline 2.1 - 데모 계정 미제공 → Supabase에 `appreview@potal.app` / `PotalReview2026!` 계정 생성, App Store Connect에 입력
  4. ✅ Guideline 5.1.1(v) - 계정 삭제 기능 → `/api/delete-account` API + 확인 다이얼로그 UI 구현
- **수동 설정 3가지 완료**: Supabase 리다이렉트 URL(`potal://auth-callback`), App Store Connect 데모 계정, Vercel 환경변수(`SUPABASE_SERVICE_ROLE_KEY`)
- **다음**: Apple 심사 결과 대기 (24~48시간)

### 외부 서비스 대기

| 서비스 | 상태 | 다음 단계 |
|--------|------|----------|
| Google Play Console | 기존 계정 국가 변경 포기 → 새 Google 계정으로 한국 주소 등록 진행 중 ($25) | 등록 완료 후 Android Capacitor 빌드 + 제출 |
| Reddit r/SideProject | 스팸 필터 → 모더레이터 승인 대기 | 승인 후 r/Frugal 진출 |
| Rakuten (Case #390705) | Madhu에게 재답장 완료 | 기술팀 해결 대기 |
| Temu Affiliate | 승인 대기 중 | 승인되면 API 구현 |
| RapidAPI 환불 (#130604) | 신원 확인 요청 | 신원 확인 후 환불 |
| 김범수 대표 LinkedIn | ✅ 피치덱 + 메시지 발송 완료 (은태님 직접) | 응답 대기 |
| Best Buy Developer Portal | 이메일 발송 완료 | API 키 발급 대기 |
| Target | 파트너십 이메일 발송 완료 | 응답 대기 |
| Kroger | Partner Request 제출 완료 (Developer Portal) | 응답 대기 |
| 파트너십 이메일 29곳 | 전체 발송 완료 (2026-03-01) | 응답 대기 중 |
| Apple App Store | Build 3 재제출 완료 (2026-03-02) | 심사 결과 대기 (24~48시간) |
| Impact.com 주소 변경 | 서류 제출 필요 (주소 증빙 + 신분증) | 은태님 직접 제출 |
| Google Play Console (새 계정) | 새 Google 계정 생성 + Play Console 등록 진행 중 | 한국 주소 인증 → Android 빌드 |

---

## 5. ✅ 완료된 내용 (DONE)

### 제품 개발

**iOS 앱 Build 3 재제출 완료** ✅ (2026-03-02, 세션 6)
- Build 2 리뷰 거절 (2026-02-26) → 4가지 수정 → Build 3 (1.0(3)) 재제출
- Bundle ID: com.potal.app, Apple Distribution 인증서
- **수정 내역**:
  1. iPad Take Photo 크래시 → `NSCameraUsageDescription` + `NSPhotoLibraryUsageDescription` Info.plist 추가
  2. 로그인 외부 브라우저 → `@capacitor/browser` SFSafariViewController + `potal://auth-callback` 딥링크 구현
  3. 데모 계정 미제공 → `appreview@potal.app` / `PotalReview2026!` Supabase 생성 + App Store Connect 입력
  4. 계정 삭제 기능 → `app/api/delete-account/route.ts` API (Supabase Admin) + `app/account/page.tsx` 확인 다이얼로그
- **새 코드 파일**: `app/lib/native-auth.ts` (네이티브 OAuth 유틸리티), `app/api/delete-account/route.ts` (계정 삭제 API)
- **수정 파일 7개**: Info.plist, SupabaseProvider.tsx, AuthForm.tsx, login/page.tsx, join/page.tsx, account/page.tsx, package.json
- **수동 설정 3가지**: Supabase 리다이렉트 URL, App Store Connect 데모 계정, Vercel `SUPABASE_SERVICE_ROLE_KEY`
- **빌드/배포**: git push (30 files, 2914 insertions) → Vercel 자동 배포 → `npx cap sync ios` (4 plugins) → Xcode Archive → Upload → App Store Connect 제출
- 심사 대기 중

**코드베이스 리팩토링** ✅ (2026-02-26)
- 고아 파일 7개 삭제, 죽은 코드 제거, console.log 13개 정리
- 컴포넌트 디렉토리 통합 (app/components/ → components/), app/components/ 완전 삭제
- 대형 파일 분리: ResultsGrid.tsx 1220→955줄, ProductCard.tsx 622→546줄
- UI 수정: Duty+MPF 합침, PC (i) 팝업, eBay 피드백% 표시, Total Landed Cost 순서 변경 등

**검색 인텔리전스 강화** ✅ (2026-02-26)
- Amazon API 간헐적 0건 문제 → `generateQueryVariants()` 단수↔복수 변형 로직 추가
- SearchService 레벨에서 모든 provider에 공통 적용
- BestBuyProvider 코드 완성 (API 키 대기)

**OG 이미지 업데이트** ✅
- 1200x630 Domestic vs Global 비교 디자인, 메타 description 업데이트

### 마케팅 & 홍보

**홍보 채널 실행** ✅
- LinkedIn: 프로필 설정 + 글 게시
- X (Twitter): 일론 머스크 태그 + POTAL 비전 글
- Facebook: "Amazing deals" 그룹 첫 글 + 자체 그룹 2개 생성 (Smart Deal Finder, Amazon vs AliExpress)
- Reddit: r/SideProject 글 올림 → 스팸 필터 걸림 (karma 1)

**피치덱 v4 완성** ✅ (2026-02-28)
- 11 슬라이드, 4번 피드백 반영
- 김범수/QPV 종합 리서치 완료
- LinkedIn 메시지 초안 확정

### Master Partnership Tracker

**v1→v5 완성 + 트래픽 시트 + 차트** ✅ (2026-03-01)
- v1: 81개 스토어, 단일 시장점유율 컬럼
- v2: 시장점유율 2개 컬럼 분리 + 글로벌 분류
- v3: 교차(cross-reference) 시스템 도입 + 저가치 스토어 제외
- v4: 프랑크푸르트 선언 — 카테고리 % 실수치, 카테고리 내 순위, 시장규모 헤더, Sam's Club 제외
- v5: 글로벌 스토어 US % 적용 + US 카테고리 교차 추가 6곳 + 저가치 글로벌 5곳 제외
- 트래픽 시트 v3: 18개 스토어 × 12개월 (2025년 데이터), 3개 차트 (Bar/Line/Pie), 성장률 테이블
- 전체 4시트 데이터 2025 기준 최종 검수 완료

**v5 최종 구성:**
| 카테고리 | 시장규모 | 스토어 | 교차 |
|----------|---------|--------|------|
| 종합 | $1,190B | 8 | 1 (Temu) |
| 전자제품 | $120B | 7 | 3 |
| 패션 | $159.4B | 12 | 5 (Shein, H&M, Zara 포함) |
| 홈/가구 | $182B | 7 | 3 (IKEA 포함) |
| 그로서리 | $205B | 5 | 3 |
| 뷰티/건강 | $61B | 6 | 2 |
| 스포츠 | $15B | 5 | 2 |
| 펫 | $21B | 5 | 2 |
| 장난감 | $18B | 5 | 4 (LEGO 포함) |
| 오피스 | $23B | 3 | 1 |
| 글로벌 | 크로스보더 | 9 | 0 |
| **합계** | | **46 고유** | **26 교차** |

제외 사이트: 35곳 (사유 포함)

### Gmail 스캔 + 바운스 처리 + 초안 정리 ✅ (2026-03-01, 세션 5)

**contact@potal.app 전체 이메일 스캔:**
- 100+ 이메일 전수 조사 → 미처리 항목 발견 및 처리
- 바운스 3곳 발견: YesStyle(affiliates@), ASOS(gavina@), Office Depot(vendordiversity@) — 모두 "550 Recipient address rejected"
- YesStyle: ys-affiliates@yesstyle.com으로 재발송 ✅
- ASOS: Awin 네트워크 경유만 가능 → Affiliate로 재분류
- Office Depot: CJ 네트워크 경유만 가능 → Affiliate로 재분류
- Academy Sports: communityrelations@academy.com은 기부/후원 부서 (파트너십 전용 이메일 없음)
- Apple App Store 리뷰 거절 발견 (2/26) → 분석 완료, 은태님 직접 처리
- Gmail 초안 23개 IMAP으로 일괄 삭제 (SMTP로 이미 발송 완료되어 불필요)
- 엑셀 트래커 업데이트: ASOS/Office Depot Affiliate 재분류, YesStyle 이메일 변경, Academy Sports 비고 추가

### 파트너십 이메일 일괄 발송 ✅ (2026-03-01, 세션 4)

**이메일 리서치 + 발송 자동화:**
- 25개 N/A 스토어 이메일 주소 리서치 → 19개 발견, 엑셀 업데이트
- Gmail SMTP + 앱 비밀번호로 23개 이메일 PDF 첨부 자동 발송
- US Domestic 19곳: `POTAL_Partnership_Proposal_FINAL.pdf` 첨부
- Global 4곳 (H&M, Adidas, ASOS, YesStyle): `POTAL_Global_Partnership_Proposal_FINAL.pdf` 첨부
- 카테고리별 맞춤 문구 적용 (Electronics, Fashion, Home, Grocery, Pet)
- 엑셀 트래커 26행 "Sent" + 발송일 2026-03-01 업데이트

**은태님 직접 발송 6곳:** Macy's, Nordstrom, Zappos, Home Depot, Wayfair, iHerb

**발송 불가 스토어:**
- Apple: 직접이메일 없음 → Partnerize 포탈 신청 필요
- Samsung: 직접이메일 없음 → 전화 (866) 726-4249
- LEGO: licensing@lego.com 있으나 라이센싱팀이라 불필요
- Kroger: 이메일 아닌 Developer Portal URL만
- Nike, Sephora, Ulta Beauty, Kohl's, Lowe's: Affiliate 네트워크 경유만 가능

### 파트너십 이메일 + PDF 제안서 ✅ (2026-03-01, 세션 2~3)

**US Domestic 스토어용:**
- 이메일 템플릿: 짧은 hook + PDF 첨부 전략
- PDF 1페이지 제안서: What is POTAL → Why (equal competition) → What You Get (4항목) → What We Need → Closing (글로벌 확장 + confidence)
- 핵심 메시지: "Your competitive products deserve equal visibility"
- 카테고리별 맞춤 문구 테이블 포함

**Global 스토어용:**
- 이메일 템플릿: US Domestic과 다른 접근 — "미국 소비자 접근" + "Total Landed Cost 투명성"
- PDF 1페이지 제안서: What is POTAL → Why Global Retailers Need POTAL (hidden costs) → What You Get (5항목) → What We Need → Closing (revenue pipeline + 글로벌 확장)
- 핵심 메시지: "US consumers want to buy from global stores — but hidden costs stop them."
- 연동 안 된 글로벌 스토어는 이름 나열하지 않음 (사실 기반)

**이메일 전략 합의사항:**
- 이메일은 짧게 (hook) + PDF (상세) 분리
- What you get → What we need 순서 (benefits first)
- Benefits 3~4개로 압축 (읽기 부담 줄이기)
- 전화 없음, 이메일만
- "수백만 쇼퍼" 같은 근거 없는 숫자 사용 ❌

---

## 6. 🗄️ 더 이상 사용하지 않는 내용 (DEPRECATED)

| 항목 | 폐기 사유 |
|------|----------|
| **Serper 기반 17개 provider** | Serper Shopping API의 한계 (부정확한 가격, 재고 미반영) → 공식 API/RapidAPI로 전환. 코드 파일은 providers/ 폴더에 남아있음 |
| **Impact.com 어필리에이트 전략** | 트래픽 부족으로 거절됨 → 직접 쇼핑몰 컨택 전략으로 전환 |
| **Gen Z 한정 타겟** | 피치덱 v4에서 삭제. 40대 이상이 오히려 더 큰 pain point → "가격 민감 미국 온라인 쇼퍼 (연령 무관)"으로 재정의 |
| **3개월 구축 → 1달** | 사실관계 수정: 실제 1달 (매일 9시간) |
| **Sam's Club 파트너십** | Walmart 자회사 — 데이터/상품 중복, 별도 API 없음 → 제외 시트로 이동 |
| **Shein RapidAPI** | 서버 다운, 환불 요청 중 |
| **create_master_tracker v1~v4.py** | v5로 대체됨. 세션 2에서 삭제 완료 |
| **add_traffic_sheet v1~v2.py** | v3로 대체됨. 세션 2에서 삭제 완료 |
| **create_proposal_pdf v1~v2.py** | v3 (dual-mode)로 대체됨 |
| **email_template_draft.md (v1)** | 이전 이메일 템플릿. FINAL 버전으로 대체됨 |
| **POTAL_Partnership_Email_Template.md** | 세션 1 기본 템플릿. 세션 3에서 US/Global 분리 FINAL로 대체 |

---

## 7. ⛔ 진행하지 말아야 하는 내용 (DO NOT PROCEED)

| 항목 | 사유 |
|------|------|
| **소비자 기능 확장** (가격 추적, 히스토리 차트) | B2B 기능으로 분류 확정. 코어(비교)에 집중 |
| **반응 검증 전 광고 집행** | 무료 채널에서 먹히는 메시지 확인 후 |
| **B2B API 서비스 지금 시작** | 글로벌 확장 후 (Chapter 3) |
| **전통적 팀 빌딩** | AI 시대 = 1-2명 최소 채용 |
| **Slickdeals 직접 진출** | Deal 게시(상품만), 포럼(활동이력필요), 유료광고(비용높음) — Slickdeals 유저가 겹치는 Reddit/Facebook에서 공략 |
| **사업계획서 우선 작성** | Pre-seed 단계에선 피치덱 + 작동하는 웹사이트가 우선, 추가 요청 시 준비 |

---

## 8. 📋 참조 데이터

### 검색 파이프라인

```
유저 검색 "airpod"
  → SearchService.search("airpod")
    → Step 1: 모든 provider 동시 호출 (Domestic: Amazon, Walmart, Best Buy* / Global: eBay, AliExpress)
    → Step 1b: 전체 결과 0건? → generateQueryVariants("airpod") → ["airpods"]로 재호출
    → Step 2: FraudFilter (rule-based, $0/no-image/sponsored 제거)
    → Step 3: AI Filter (OpenAI, 무관 상품 제거)
    → Step 4: CostEngine (Total Landed Cost 계산)
    → Step 5: ScoringEngine (Best/Fastest/Cheapest 점수)
```

### Provider 현황

**활성:**
| Provider | API | 상태 | 분류 |
|----------|-----|------|------|
| Amazon | RapidAPI (OpenWeb Ninja PRO $25/mo) | ✅ (간헐적 0건 → 재시도 커버) | Domestic |
| Walmart | RapidAPI (realtime-walmart-data) | ✅ | Domestic |
| eBay | RapidAPI PRO (real-time-ebay-data) | ✅ (캡차 재시도 있음) | Global |
| Target | RapidAPI (target-com-shopping-api) | ❌ 404 에러 | Domestic |
| AliExpress | RapidAPI (aliexpress-data) | ✅ | Global |
| Costco | (구현 상태 확인 필요) | 🔄 | Domestic |

**대기:** Best Buy (코드 완성, API 키 대기)
**비활성:** Shein (서버 다운), Temu (어필리에이트 대기), Serper 기반 17개 (폐기)

### 컴포넌트 디렉토리 구조

```
components/
├── auth/ — AuthForm, LoginModal, OnboardingModal
├── common/ — GoogleAnalytics, LanguageModal
├── help/ — ContactForm
├── home/ — HeroVisuals, SearchBar, SearchWidget(495줄)
├── icons.tsx
├── layout/ — Footer, Header, MobileBottomNav
├── search/ — AiSmartSuggestionBox(673줄), DeliveryBadge, FilterSidebar,
│             MobileCompactCard(277줄), ProductCard(546줄),
│             ResultsGrid(955줄), StickyHeader, TaxInfoPopup(208줄)
└── ui/ — SkeletonCard
```

### 핵심 파일 경로

| 파일 | 역할 |
|------|------|
| `app/lib/search/searchIntelligence.ts` | refineQuery, detectPriceIntent, generateQueryVariants |
| `app/lib/search/SearchService.ts` | 전체 파이프라인 오케스트레이션 |
| `app/lib/search/CostEngine.ts` | Total Landed Cost 계산 |
| `app/lib/search/ScoringEngine.ts` | 상품 점수 산정 |
| `app/lib/search/FraudFilter.ts` | 사기/저품질 필터 |
| `app/lib/search/AIFilterService.ts` | AI 관련성 필터 |
| `app/lib/search/providers/AmazonProvider.ts` | Amazon RapidAPI |
| `app/lib/search/providers/BestBuyProvider.ts` | Best Buy 공식 API (키 대기) |
| `app/lib/native-auth.ts` | 네이티브 OAuth (SFSafariViewController + 딥링크) |
| `app/api/delete-account/route.ts` | 계정 삭제 API (Supabase Admin) |
| `app/account/page.tsx` | 계정 설정 (삭제 기능 포함) |
| `app/context/SupabaseProvider.tsx` | Supabase 클라이언트 + 세션 + 딥링크 리스너 |

### Master Tracker 엑셀 구조

**컬럼 (A~U):**
순위 | 카테고리 | 본사 | 쇼핑몰 | 웹사이트 | US 전체 시장점유율 | 카테고리 내 점유율(%) | 월간 트래픽 | 주요 연령층 | Affiliate Program | Affiliate Link | API Status | API Type | Contact Email | Contact Page | Priority | 이메일 발송 | 발송일 | 응답 | POTAL 상태 | 비고

**스타일링:** 카테고리별 고유 색상, 교차 행 = 보라색(#E8EAF6) + 이탤릭, 발송 상태 색상 코딩

### 카테고리 시장규모 (US 온라인, 2024)

전체 이커머스 $1,190B | 그로서리 $205B | 홈/가구 $182B | 패션 $159.4B | 전자제품 $120B | 뷰티/건강 $61B | 오피스 $23B | 펫 $21B | 장난감 $18B | 스포츠 $15B

### 크로스보더 이커머스 통계 (피치덱 사용, 출처 검증)

- $1.47T 글로벌 크로스보더 — Coherent Market Insights 2025
- 289M 미국 온라인 쇼퍼 — eMarketer 2025
- 59% 해외 구매 경험 — DHL 2025 Survey (24개국 24,000명)
- 48% 예상치 못한 비용으로 포기 — Baymard Institute 2024.2
- 54% 높은 배송비가 최대 불만

### Capacitor iOS 설정 요약

- appId: `com.potal.app`, webDir: `out`, server URL: `https://potal.app`
- TabletViewController: iPad 1440px viewport 강제
- KeyboardAccessoryFix: WKContentView swizzling
- Apple Distribution 인증서 (수동), Xcode iOS 26.2
- **URL Scheme**: `potal://` (CFBundleURLTypes, 딥링크 OAuth 콜백용)
- **Capacitor 플러그인 4개**: @capacitor/splash-screen, @capacitor/status-bar, @capacitor/browser (SFSafariViewController), @capacitor/app (딥링크 리스너)
- **Info.plist 권한**: NSCameraUsageDescription, NSPhotoLibraryUsageDescription
- **Supabase 리다이렉트 URL**: `potal://auth-callback` (네이티브 OAuth 콜백)
- **환경변수**: `SUPABASE_SERVICE_ROLE_KEY` (Vercel, 계정 삭제 Admin API용)

---

## 9. 📁 파일 인덱스

### 현재 활성 파일 (mnt/portal/)
| 파일 | 역할 |
|------|------|
| `POTAL_Master_Partnership_Tracker.xlsx` | 최종 v5 트래커 + 트래픽 시트/차트 |
| `POTAL_Partnership_Proposal_FINAL.pdf` | US Domestic 파트너십 제안서 (영어만, 발송용) |
| `POTAL_Global_Partnership_Proposal_FINAL.pdf` | Global 스토어 파트너십 제안서 (영어만, 발송용) |
| `POTAL_Partnership_Email_FINAL.md` | US Domestic 이메일 템플릿 (영어만, 발송용) |
| `POTAL_Global_Partnership_Email_FINAL.md` | Global 스토어 이메일 템플릿 (영어만, 발송용) |
| `POTAL_Partnership_Proposal.pdf` | US Domestic 제안서 리뷰본 (한글 포함) |
| `POTAL_Global_Partnership_Proposal.pdf` | Global 제안서 리뷰본 (한글 포함) |
| `email_template_draft.md` | US 이메일 리뷰본 (한글 포함) |
| `email_template_global_draft.md` | Global 이메일 리뷰본 (한글 포함) |
| `POTAL_Pitch_Deck.pptx` | 피치덱 v4 (11 슬라이드) |
| `create_pitchdeck.js` | 피치덱 생성 스크립트 (pptxgenjs) |
| `Kim_Bumsoo_QPV_Research.md` | 김범수/QPV 리서치 |
| `LinkedIn_Message_KimBumsoo.md` | LinkedIn 메시지 (확정) |
| `All_Partnership_Emails_Ready.md` | 13개 쇼핑몰 이메일 모음 |
| `BestBuy_Email_Ready.md` | Best Buy 맞춤 이메일 |
| `Target_Email_Ready.md` | Target 맞춤 이메일 |
| `POTAL_Partnership_Target_List.xlsx` | 27개 쇼핑몰 타겟 리스트 |
| `Partnership_Emails_Ready_v2.md` | 6개 스토어 프리메이드 이메일 (은태님 직접 발송용, 참조) |
| `session-context.md` | 이 파일 (프로젝트 맥락) |
| `app/lib/native-auth.ts` | 네이티브 OAuth 유틸리티 (SFSafariViewController + 딥링크 토큰 파싱) |
| `app/api/delete-account/route.ts` | 계정 삭제 API (Supabase Admin, Apple Guideline 5.1.1(v)) |

### 작업 스크립트 (세션 작업 디렉토리)

⚠️ **절대 삭제 금지** — PDF 내용 수정 시 이 스크립트들을 다시 돌려야 함

| 파일 | 역할 | 삭제 |
|------|------|------|
| `create_master_tracker_v5.py` | v5 엑셀 생성 스크립트 | ❌ 금지 |
| `add_traffic_sheet_v3.py` | 트래픽 시트 + 차트 스크립트 | ❌ 금지 |
| `create_proposal_pdf_v3.py` | US Domestic PDF 생성 (dual-mode: review/final) | ❌ 금지 — PDF 수정 시 필요 |
| `create_proposal_pdf_global.py` | Global PDF 생성 (dual-mode: review/final) | ❌ 금지 — PDF 수정 시 필요 |
| `NotoSansKR.ttf` | 한국어 폰트 (reportlab용, PDF 스크립트 의존) | ❌ 금지 |
| ~~`send_emails.py`~~ | SMTP 이메일 발송 스크립트 — **삭제됨** (앱 비밀번호 하드코딩 보안 이슈) | ✅ 삭제됨 |
| ~~`delete_drafts.py`~~ | IMAP 초안 삭제 스크립트 — **삭제됨** (앱 비밀번호 포함) | ✅ 삭제됨 |
| ~~`create_proposal_pdf.py`~~ | v1 PDF 스크립트 — v3로 대체 | ✅ 삭제됨 |
| ~~`create_proposal_pdf_v2.py`~~ | v2 PDF 스크립트 — v3로 대체 | ✅ 삭제됨 |

### 커밋 완료 (세션 6에서 push 완료)
- ✅ 세션 6에서 30개 파일 git push 완료 (2914 insertions, 62 deletions)
- 포함 내역: App Store 거절 수정 4가지 (Info.plist, native-auth, delete-account, OAuth 수정), searchIntelligence, BestBuyProvider 등 전체

---

## 10. 📝 작업 로그 (날짜별 요약)

### 2026-03-02 (세션 7) — Google Play Console 새 계정 전환 + Android 앱 등록
- Google Payments 본인 확인: 기존 계정 미국 주소 인증 서류 없음 → 국가 변경 루프 포기
- 새 Google 계정 생성 + Play Console 한국 주소 등록 ($25) 결정
- 한국 주소로 등록해도 전 세계(미국 포함) 앱 배포 가능 확인
- (진행 중)

### 2026-03-02 (세션 6) — App Store 거절 4가지 수정 + Build 3 재제출
- App Store 리뷰 거절 3가지 사유 + 추가 1가지 (계정 삭제) 분석 및 전체 수정 완료
- **(1) iPad Take Photo 크래시**: Info.plist에 `NSCameraUsageDescription` + `NSPhotoLibraryUsageDescription` 추가
- **(2) 로그인 외부 브라우저**: `@capacitor/browser` + `@capacitor/app` 설치, `potal://` URL scheme 등록, `native-auth.ts` 생성 (SFSafariViewController + 딥링크 토큰 파싱 + setSession), SupabaseProvider/AuthForm/login/join 페이지 수정
- **(3) 데모 계정 미제공**: Supabase에 `appreview@potal.app` / `PotalReview2026!` 생성, App Store Connect에 입력
- **(4) 계정 삭제 (5.1.1(v))**: `app/api/delete-account/route.ts` 생성 (Supabase Admin API), `app/account/page.tsx`에 확인 다이얼로그 + API 호출 추가
- 수동 설정 3가지 완료: Supabase 리다이렉트 URL (`potal://auth-callback`), App Store Connect 데모 계정, Vercel `SUPABASE_SERVICE_ROLE_KEY`
- Git push 완료 (30 files changed, 2914 insertions, 62 deletions) — HEAD.lock 이슈 해결 후
- `npx cap sync ios` 성공 (4 Capacitor plugins)
- Xcode Archive → Upload → App Store Connect Build 3 (1.0(3)) 제출 완료
- Gmail 초안 23개 IMAP 삭제 완료 (세션 5에서 이어서)
- session-context.md 세션 6 업데이트

### 2026-03-01 (세션 5) — Gmail 전수 스캔 + 바운스 처리 + App Store 거절 분석
- contact@potal.app 전체 이메일 100+건 전수 조사
- 바운스 3곳 발견 및 처리: YesStyle 재발송(ys-affiliates@yesstyle.com), ASOS→Awin 재분류, Office Depot→CJ 재분류
- Academy Sports communityrelations@ = 기부/후원 부서로 확인 (파트너십 전용 이메일 없음)
- Apple App Store 리뷰 거절 (2/26) 분석: (1) iPad Take Photo 크래시, (2) 로그인 외부 브라우저 UX, (3) 데모 계정 미제공, (4) 계정 삭제 기능 확인 필요
- Impact.com 주소 변경 서류 제출 안내 (은태님 직접)
- Google Payments 본인 확인 안내 (은태님 직접)
- Gmail 초안 23개 IMAP으로 일괄 삭제 완료
- 엑셀 트래커 업데이트 (바운스 처리 결과, Affiliate 재분류)
- session-context.md 업데이트 (세션 5 반영)

### 2026-03-01 (세션 4) — 이메일 일괄 발송 완료 (29곳)
- 이전 세션 컨텍스트 이어받아 작업 재개
- 25개 N/A 스토어 이메일 주소 병렬 리서치 → 19개 발견
- 엑셀 트래커에 19개 이메일 주소 업데이트
- Gmail MCP 커넥터로 23개 초안 생성 (US Domestic 19 + Global 4)
- Gmail MCP 한계 (첨부/발송 불가) → SMTP + 앱 비밀번호 방식으로 전환
- Python 스크립트(send_emails.py)로 23개 이메일 PDF 첨부 + 자동 발송 성공 (실패 0)
- 카테고리별 맞춤 문구 적용: Electronics(Best Buy, Newegg, B&H), Fashion(Gap, Lululemon), Home(Overstock), Grocery(Instacart), Pet(Chewy, PetSmart, Petco)
- 엑셀 트래커 26행 "Sent" + 발송일 업데이트
- 은태님 직접 발송 6곳 확인: Macy's, Nordstrom, Zappos, Home Depot, Wayfair, iHerb
- 제외 결정: Apple(직접이메일 없음), Samsung(직접이메일 없음), LEGO(라이센싱팀 불필요)
- **총 발송: 29곳** (은태님 6 + 자동 23), 미발송: Affiliate 경유 6곳 + 제외 3곳

### 2026-03-01 (세션 3) — 이메일 + PDF 제안서 완성
- 파트너십 PDF 제안서 v1→v3: 한글 렌더링 해결(NotoSansKR.ttf), dual-mode(review/final)
- US Domestic PDF: equal competition 메시지, 5 benefits, 글로벌 확장 closing
- Global PDF: TLC 투명성, hidden costs 해결, revenue pipeline, 5 benefits
- 이메일 템플릿 US Domestic + Global 각각 작성 및 확정
- 은태님 피드백 반영: 이름 수정(Euntae Jang), 근거 없는 숫자 삭제, 연동 안 된 스토어 나열 금지, 이해 안 되는 표현 수정
- 전략 합의: 이메일(짧은 hook) + PDF(상세) 분리, benefits first, 전화 없음

### 2026-03-01 (세션 2) — 트래픽 시트 + 데이터 검수
- 트래픽 시트 v1→v3: 차트 렌더링 이슈 해결 (category references, 30-row spacing)
- 2025년 데이터 기준 전체 4시트 최종 검수 (18개 데이터 포인트 중 15개 정확, 3개 수정)
- 이전 버전 스크립트 정리 삭제 (v1~v4 tracker, v1~v2 traffic)
- 이메일 템플릿 초안 작성 시작

### 2026-03-01 (세션 1) — Master Tracker v5 완성 + 수익화 논의
- Master Partnership Tracker v1→v5 완성 (5번 반복, 사용자 수정 5회 반영)
- v5 핵심: 글로벌 스토어 US 시장점유율 % 적용, US 카테고리 교차 6곳 추가, 저가치 글로벌 5곳 제외
- 사용자 질문 대응: 마이너스 표기 확인, 월간vs연간 트래픽, 데이터 수익화 가능성
- 합의: 트래픽 시트+차트 → 이메일 템플릿 검토 → 발송 → Make 자동화 → 연동
- 수익화 방향 논의: B2B 리포트, 어필리에이트 최적화, 광고 세일즈 데이터
- session-context.md 전면 재구조화

### 2026-02-28 — 김범수/QPV 리서치 + 피치덱 v4
- 김범수 대표 LinkedIn 1촌 수락 → "자료 보내달라" 응답
- QPV 종합 리서치 완료, 투자 철학 3가지 (행동력, 지적 정직성, 사람)
- 피치덱 v3→v4 (4번 피드백 반영, 11 슬라이드)
- LinkedIn 메시지 초안 확정 (은태님 직접 수정)
- 파트너십 이메일 7곳 발송 완료

### 2026-02-26 — 코드베이스 리팩토링 + 마케팅 실행
- 코드베이스 종합 점검: 고아 파일 삭제, 컴포넌트 통합, 대형 파일 분리
- Amazon API 디버깅 + searchIntelligence 검색어 변형 로직
- BestBuyProvider 코드 작성 (공식 API)
- OG 이미지 업데이트
- 홍보 채널: Reddit, LinkedIn, X, Facebook 글 게시
- Slickdeals 분석, 실유저 확보 전략 수립

---

## 부록: 홍보 글 작성 기준

### 공통 지침
- 영어 원문 + 한글 번역 항상 함께
- POTAL URL: https://potal.app
- "POTAL" 직접 홍보 ❌ → 가치(가격 비교 결과)를 먼저, 자연스럽게 링크

### 채널별 톤
| 채널 | 톤 | 제한사항 |
|------|-----|---------|
| Facebook 딜 그룹 | 실제 비교 결과 먼저 | 하루 2~3개, 그룹간 30분 간격, 동시 게시 ❌ |
| Reddit | 개인 경험, 피드백 요청, 겸손 | karma 필요, 노골적 홍보 → 삭제+ban |
| LinkedIn | 프로페셔널, 빌더 스토리 | #buildinpublic 등 해시태그 |
| X (Twitter) | 짧고 임팩트, 비전 | 280자 |

### Facebook 그룹 현황
- 자체 그룹 2개: Smart Deal Finder (메인), Amazon vs AliExpress (서브)
- 가입 완료 13개 그룹 (Amazing deals 20만명, Couponing 24만명, Dollar General 49만명 등)
- 첫 글 게시 완료: Amazing deals clearance and codes

### 이메일 전략 (세션 3 확정)
- **2종 템플릿**: US Domestic용 (공정 경쟁 중심) + Global용 (미국 시장 접근 + TLC 투명성)
- **2종 PDF**: 각 템플릿에 매칭되는 1페이지 제안서
- **구조**: 이메일 = 짧은 hook + PDF 첨부 (상세)
- **Benefits → Needs 순서** (상대방 이점을 먼저)
- **연락**: 이메일만 (전화 ❌)

### 파트너십 이메일 발송 현황

**✅ 발송 완료 — 총 29곳 (2026-03-01)**

은태님 직접 발송 (6곳):
Macy's, Nordstrom, Zappos, Home Depot, Wayfair, iHerb

SMTP 자동 발송 — US Domestic (19곳, PDF: POTAL_Partnership_Proposal_FINAL.pdf):
Target (partners@Targetpartnerships.com), Costco (isinfo@costco.com), Etsy (developers@etsy.com), Best Buy (developer@bestbuy.com), Newegg (Partnerservices@newegg.com), B&H Photo (info@bhphoto.com), Gap/Old Navy (press@gap.com), Lululemon (media@lululemon.com), Overstock (affiliates@overstock.com), Instacart (partners@instacart.com), Dick's Sporting Goods (DSGAffiliateProgram@dcsg.com), REI (advertising@rei.com), Academy Sports (communityrelations@academy.com), Chewy (affiliates@chewy.com), PetSmart (Merchandising2@PetSmart.com), Petco (pressinquiries@petco.com), GameStop (partnerships@gamestop.com), Staples (kevin.dunne@staples.com), Office Depot (vendordiversity@officedepot.com)

SMTP 자동 발송 — Global (4곳, PDF: POTAL_Global_Partnership_Proposal_FINAL.pdf):
H&M (mediarelations@hm.com), Adidas (corporate.press@adidas.com), ~~ASOS (gavina@asos.com)~~ ❌바운스→Awin경유, ~~YesStyle (affiliates@yesstyle.com)~~ ❌바운스→ys-affiliates@yesstyle.com으로 재발송 ✅

**❌ 바운스 처리 (세션 5):**
- YesStyle: affiliates@ → ys-affiliates@yesstyle.com 재발송 ✅
- ASOS: gavina@ 바운스 → Awin 네트워크 경유만 가능, Affiliate로 재분류
- Office Depot: vendordiversity@ 바운스 → CJ 네트워크 경유만 가능, Affiliate로 재분류

**⬜ 미발송 — Affiliate 네트워크 경유만 가능 (8곳):**
Nike, Sephora, Ulta Beauty, Kroger, Lowe's, Kohl's, ASOS(Awin), Office Depot(CJ)

**⛔ 제외 (3곳):**
Apple (직접이메일 없음, Partnerize 포탈), Samsung (직접이메일 없음, 전화만), LEGO (라이센싱팀 불필요)

**이메일 발송 인프라:**
- 발신: contact@potal.app (Gmail SMTP + 앱 비밀번호)
- 스크립트: `send_emails.py` (Python smtplib, PDF 자동 첨부, US/Global 분리)
- Gmail MCP 커넥터: 초안 생성/읽기 가능, 첨부/발송은 불가 → SMTP로 대체

### 김범수 대표 투자 관련
- QPV Inc. (2025.7 설립, Sunnyvale), 첫 펀드 300억원 목표
- 투자 기준: 행동력, 지적 정직성, 사람
- Pre-seed/Seed 집중, 60% 1년 미만 회사, Anti-hype
- ✅ LinkedIn 메시지 + 피치덱 발송 완료 (2026-03-01, 은태님 직접)
- 다음: 응답 대기 → 추가 자료 요청 시 사업계획서 작성
