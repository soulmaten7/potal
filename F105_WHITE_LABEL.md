# F105 White-label Branding — 강화 명령어

## 현재 상태
- 위젯에 "Powered by POTAL" 표시만 구현
- Pro+ 플랜에서 제거 가능 설정만 있음
- 실제 커스터마이징 옵션 부족

## CRITICAL 수정 사항

### C1. 커스텀 브랜딩 설정 API
- `app/api/v1/branding/route.ts` 신규 생성
- GET: 현재 브랜딩 설정 조회
- POST: 브랜딩 업데이트 (logo_url, primary_color, secondary_color, font_family, custom_css, display_name)
- 플랜 체크: Free/Basic = "Powered by POTAL" 필수, Pro+ = 제거 가능 + 커스텀 브랜딩

### C2. 위젯 테마 엔진
- `app/lib/branding/widget-theme.ts` 신규 생성
- generateWidgetCSS(brandingConfig): 셀러 브랜딩 설정 → CSS 변수 생성
- 기본 테마 3종: light, dark, minimal
- CSS 변수: --potal-primary, --potal-secondary, --potal-font, --potal-radius, --potal-bg

### C3. 브랜딩 프리뷰 API
- `app/api/v1/branding/preview/route.ts` 신규 생성
- POST: 브랜딩 설정 미리보기 HTML 반환 (실제 위젯 모양 시뮬레이션)
- 셀러가 대시보드에서 실시간 프리뷰 가능

### C4. 이메일/PDF 브랜딩
- `app/lib/branding/document-branding.ts` 신규 생성
- applyBranding(templateType, brandingConfig): 송장/통관서류/이메일에 셀러 로고+색상 적용
- 템플릿: invoice, customs_declaration, packing_list, certificate_of_origin

### C5. 브랜딩 에셋 검증
- logo_url: 이미지 URL 유효성 + 크기 제한 (max 2MB, 허용 형식: png/jpg/svg)
- color: HEX 코드 검증 (#RRGGBB)
- custom_css: XSS 방지 sanitization (script, onclick 등 제거)

### C6. 멀티 브랜드 지원
- Enterprise: 여러 브랜드/스토어별 다른 브랜딩 설정
- brand_profiles 배열 지원 (각 프로필에 name, config, active 필드)

## 수정/생성 파일
- app/api/v1/branding/route.ts (신규 — 브랜딩 CRUD)
- app/api/v1/branding/preview/route.ts (신규 — 프리뷰)
- app/lib/branding/widget-theme.ts (신규 — CSS 테마 엔진)
- app/lib/branding/document-branding.ts (신규 — 문서 브랜딩)

## 5-Step 검증
1. TypeScript compile — `npx tsc --noEmit 2>&1 | grep -c "error"` → 0
2. `as any` 검사 — 새 파일에 `as any` 없어야 함
3. `npm run build` — Compiled successfully
4. 테스트 작성 + 실행 — 10개+ PASS
5. 에러 핸들링 — try-catch + 입력 검증 + XSS 방지

## 빌드 금지 사항
- 기존 위젯 코드 (potal-widget.js) 구조 변경 금지
- Free/Basic 플랜에서 "Powered by POTAL" 제거 허용 금지
