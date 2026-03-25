# F112 White-Label Solution — 프로덕션 강화

> ⚠️ 이 기능(F112)만 작업합니다.

## 현재 파일
- `app/api/v1/whitelabel/config/route.ts` — 브랜딩 설정 CRUD
- `app/lib/api-auth/plan-checker.ts` — 플랜별 권한 체크
- `supabase/migrations/026_whitelabel_configs.sql` — DB 스키마

## CRITICAL 4개

### C1: CSS 인젝션 취약점 (route.ts:67-68)
customCss가 길이만 체크 (10K). 악성 @import, url() 가능.
**수정**: CSS 새니타이저 적용
```typescript
function sanitizeCss(css: string): string {
  // @import 제거 (외부 리소스 로딩 방지)
  let clean = css.replace(/@import\s+[^;]+;/gi, '');
  // url() 제거 (데이터 유출 방지)
  clean = clean.replace(/url\s*\([^)]*\)/gi, 'url(blocked)');
  // expression() 제거 (IE 스크립트 실행 방지)
  clean = clean.replace(/expression\s*\([^)]*\)/gi, '');
  return clean;
}
```

### C2: 커스텀 도메인 소유권 미검증 (route.ts:70-71)
도메인 길이만 체크. 다른 셀러 도메인 등록 가능.
**수정**: DNS TXT 레코드 검증
```typescript
// 도메인 등록 시:
// 1. 고유 TXT 값 생성: "potal-verify=abc123"
// 2. 셀러에게 DNS TXT 레코드 추가 요청
// 3. 저장 시 DNS 조회로 TXT 확인
import { Resolver } from 'dns/promises';
const resolver = new Resolver();
const txtRecords = await resolver.resolveTxt(customDomain);
const verified = txtRecords.flat().some(r => r === `potal-verify=${sellerId}`);
if (!verified) return apiError(ApiErrorCode.FORBIDDEN, 'Domain ownership not verified. Add DNS TXT record: potal-verify=' + sellerId);
```

### C3: 감사 로깅 없음
브랜딩 변경 이력 추적 불가. 계정 탈취 시 로고/링크 변경 감지 불가.
**수정**: POST에 이전 값 로깅
```typescript
// 업데이트 전에:
const { data: existing } = await supabase.from('whitelabel_configs').select('*').eq('seller_id', sellerId).single();
await logAudit({
  actor: sellerId, action: 'update', area: 6, // D6 Platform
  reason: 'White-label config update',
  beforeState: existing ? { logoUrl: existing.logo_url, hideAttribution: existing.hide_attribution } : undefined,
  afterState: { logoUrl: config.logoUrl, hideAttribution: config.hideAttribution },
  validationPassed: true
});
```

### C4: "Powered by" 토글이 API 응답에 미반영
hideAttribution 저장되지만 GET 응답에 poweredByPotalVisible 필드 없음.
**수정**: GET 응답에 명시적 필드 추가
```typescript
return NextResponse.json({
  ...config,
  poweredByPotalVisible: !config.hide_attribution,
  brandingTier: plan === 'enterprise' ? 'full_whitelabel' : plan === 'pro' ? 'custom_branded' : 'standard'
});
```

## MISSING 6개
M1: 위젯에 커스텀 CSS 실제 적용 → potal-widget.js에서 config 로드 + CSS 주입
M2: 커스텀 도메인 라우팅 → Vercel rewrites 또는 CNAME 매핑
M3: 로고 URL 유효성 → HEAD 요청으로 이미지 존재 + MIME 확인
M4: 설정 변경 속도 제한 → 분당 1회
M5: Pro vs Enterprise 권한 정리 → hideAttribution은 Enterprise만
M6: 브랜딩 미리보기 → /whitelabel/preview 엔드포인트

## 수정 파일: 2개 (whitelabel/config/route.ts, plan-checker.ts)
## 테스트 8개
```
1. CSS 새니타이즈: @import 포함 → 제거됨
2. CSS 새니타이즈: url(evil.com) → url(blocked)
3. 도메인 검증: TXT 레코드 없음 → 403 에러
4. 감사 로그: 설정 변경 → data_update_log에 기록
5. GET 응답: poweredByPotalVisible 필드 포함
6. Enterprise: hideAttribution=true 허용
7. Pro: hideAttribution=true → 403 (Enterprise만)
8. 로고 URL: 404 URL → 경고 메시지
```

## 결과
```
=== F112 White-Label — 강화 완료 ===
- 수정 파일: 2개 | CRITICAL 4개, MISSING 6개 | 테스트: 8개 | 빌드: PASS/FAIL
```
