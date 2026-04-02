# F116 Multilingual Support (50+ Languages) — 프로덕션 강화

> ⚠️ 이 기능(F116)만 작업합니다.

## 현재 파일
- `app/i18n/translations/` — 51개 언어 파일 (en.ts ~ lv.ts)
- `app/i18n/index.ts` — 언어 레지스트리
- `app/context/I18nProvider.tsx` — Context Provider

## CRITICAL 5개

### C1: 자동 로케일 감지 없음
브라우저 Accept-Language 무시. 신규 사용자 항상 영어.
**수정**: middleware.ts에 로케일 감지 추가
```typescript
// middleware.ts 수정
const acceptLang = request.headers.get('accept-language');
const preferredLang = acceptLang?.split(',')[0]?.split('-')[0] || 'en';
const supportedLangs = ['en','ko','ja','zh','es','de','fr','it','pt','ru','tr','ar',...]; // 51개
const locale = supportedLangs.includes(preferredLang) ? preferredLang : 'en';
// 쿠키/localStorage에 저장하여 이후 세션에서 유지
```

### C2: API 응답 번역 없음
/classify 응답의 description이 영어 고정. /calculate 오류 메시지도 영어.
**수정**: API에 `lang` 파라미터 추가
```typescript
// 모든 v1 API에 선택적 lang 파라미터
const lang = searchParams.get('lang') || 'en';
// 에러 메시지 번역
return apiError(ApiErrorCode.BAD_REQUEST, t(lang, 'errors.invalidHsCode'));
```

### C3: 번역 키 불완전
pricing, nav, dashboard만 번역됨. API 에러, 분류 결과, RoO 용어 미번역.
**수정**: 각 언어 파일에 기술 용어 키 추가 (최소 en.ts에 전체 키 정의 후 다른 언어 확장)
```typescript
// 추가할 키 카테고리:
errors: { invalidHsCode, timeout, unauthorized, rateLimitExceeded, ... },
classification: { confidence, source, alternatives, ... },
tariff: { dutyRate, vatRate, totalLandedCost, freeTradeAgreement, ... },
compliance: { sanctionsCleared, restricted, exportControlled, ... }
```

### C4: RTL 언어 지원 없음 (ar, he, fa, ur)
아랍어/히브리어/페르시아어/우르두어 텍스트는 표시되지만 레이아웃이 LTR.
**수정**: I18nProvider에 dir 속성 추가
```typescript
const RTL_LANGUAGES = ['ar', 'he', 'fa', 'ur'];
const dir = RTL_LANGUAGES.includes(locale) ? 'rtl' : 'ltr';
// <html dir={dir}> 또는 Provider에서 설정
```

### C5: 복수형 처리 없음
"1 calculation" vs "2 calculations" — 러시아어 등은 3개 이상의 복수형 필요.
**수정**: 복수형 함수 추가
```typescript
function pluralize(lang: string, count: number, forms: Record<string, string>): string {
  if (lang === 'ru' || lang === 'uk') {
    // 러시아어: 1(один), 2-4(два), 5+(пять)
    if (count % 10 === 1 && count % 100 !== 11) return forms.one;
    if (count % 10 >= 2 && count % 10 <= 4 && (count % 100 < 10 || count % 100 >= 20)) return forms.few;
    return forms.many;
  }
  return count === 1 ? forms.one : forms.other;
}
```

## MISSING 4개
M1: 날짜/시간 로컬라이즈 → Intl.DateTimeFormat 사용
M2: 통화 로컬라이즈 → Intl.NumberFormat 사용 (KRW ₩, JPY ¥ 등)
M3: 숫자 포맷 → 독일 1.000,00 vs 미국 1,000.00
M4: HS 코드 설명 번역 → 공식 관세율표 번역 연동 (있는 경우)

## 수정 파일: 4개 (I18nProvider.tsx, i18n/index.ts, middleware.ts, 번역 파일들)
## 테스트 8개
```
1. Accept-Language: ko → 자동 한국어 선택
2. Accept-Language: ar → dir="rtl" 설정
3. API lang=ko → 에러 메시지 한국어
4. 복수형 러시아어: 1 → "расчёт", 2 → "расчёта", 5 → "расчётов"
5. 날짜 로컬라이즈: ko → "2026년 3월 25일"
6. 통화 로컬라이즈: JPY → "¥1,000"
7. 미지원 언어 → en 폴백
8. 번역 키 누락 → en 폴백 (빈 문자열 아님)
```

## 결과
```
=== F116 Multilingual — 강화 완료 ===
- 수정 파일: 4개 | CRITICAL 5개, MISSING 4개 | 테스트: 8개 | 빌드: PASS/FAIL
```
